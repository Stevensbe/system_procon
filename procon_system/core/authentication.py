import json
import time
from typing import Optional, Tuple

import jwt
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from rest_framework.authentication import get_authorization_header

_JWKS_CACHE = {"keys": {}, "fetched_at": 0}
_JWKS_TTL_SECONDS = 60 * 60  # 1 hora


def _get_supabase_settings():
    supabase_url = (
        getattr(settings, "SUPABASE_URL", None)
        or getattr(settings, "VITE_SUPABASE_URL", None)
        or None
    )
    if supabase_url:
        supabase_url = supabase_url.rstrip("/")

    jwks_url = getattr(settings, "SUPABASE_JWKS_URL", None)
    if not jwks_url and supabase_url:
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"

    iss = getattr(settings, "SUPABASE_JWT_ISS", None)
    if not iss and supabase_url:
        iss = f"{supabase_url}/auth/v1"

    aud = getattr(settings, "SUPABASE_JWT_AUD", None) or "authenticated"

    return supabase_url, jwks_url, iss, aud


def _get_jwks(jwks_url: str) -> dict:
    now = time.time()
    if _JWKS_CACHE["keys"] and (now - _JWKS_CACHE["fetched_at"]) < _JWKS_TTL_SECONDS:
        return _JWKS_CACHE["keys"]

    response = requests.get(jwks_url, timeout=5)
    response.raise_for_status()
    data = response.json()
    keys = {key["kid"]: key for key in data.get("keys", [])}
    _JWKS_CACHE["keys"] = keys
    _JWKS_CACHE["fetched_at"] = now
    return keys


def _get_public_key(jwks_url: str, kid: str):
    keys = _get_jwks(jwks_url)
    jwk = keys.get(kid)
    if not jwk:
        # Faz refresh forcado para tentar capturar nova chave
        _JWKS_CACHE["keys"] = {}
        keys = _get_jwks(jwks_url)
        jwk = keys.get(kid)
    if not jwk:
        raise exceptions.AuthenticationFailed("Chave publica nao encontrada para o token Supabase.")
    return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))


def _get_token_issuer(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("iss")
    except Exception:
        return None


def _is_supabase_token(token: str, supabase_url: Optional[str], iss: Optional[str]) -> bool:
    token_iss = _get_token_issuer(token)
    if not token_iss:
        return False
    if supabase_url and token_iss.startswith(supabase_url):
        return True
    if iss and (token_iss == iss or token_iss == f"{iss}/" or token_iss.startswith(iss)):
        return True
    return False


def _get_or_create_user(payload: dict):
    User = get_user_model()
    from django.contrib.auth.models import Group

    email = payload.get("email")
    sub = payload.get("sub")
    user_metadata = payload.get("user_metadata") or {}
    app_metadata = payload.get("app_metadata") or {}

    if not email and not sub:
        raise exceptions.AuthenticationFailed("Token Supabase sem email/sub.")

    base_username = None
    if email:
        base_username = email.split("@")[0]
    else:
        base_username = f"supabase_{sub[:8]}"

    def unique_username():
        candidate = base_username
        if not User.objects.filter(username=candidate).exists():
            return candidate
        suffix = sub[:6] if sub else str(int(time.time()))[-6:]
        candidate = f"{base_username[:20]}_{suffix}"
        if not User.objects.filter(username=candidate).exists():
            return candidate
        return f"{base_username[:16]}_{int(time.time())}"

    user = None
    if email:
        user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.filter(username=base_username).first()

    if not user:
        user = User.objects.create(
            username=unique_username(),
            email=email or "",
            is_active=True,
        )

    # Atualiza nome completo se disponivel
    full_name = user_metadata.get("full_name") or user_metadata.get("name")
    if full_name and (not user.first_name and not user.last_name):
        parts = str(full_name).strip().split()
        user.first_name = parts[0]
        user.last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

    # Mapeamento de roles para grupos Django
    ROLE_GROUPS = {
        'admin': ['Administradores', 'Gestores'],
        'staff': ['Gestores'],
        'fiscal': ['Fiscalização'],
        'fiscalizacao': ['Fiscalização'],
        'fiscalizacao_denuncias': ['Fiscalização', 'Fiscalização - Denúncias'],
        'fiscal_denuncias': ['Fiscalização', 'Fiscalização - Denúncias'],
        'juridico': ['Jurídico'],
        'juridico_1': ['Jurídico', 'Jurídico 1'],
        'juridico_2': ['Jurídico', 'Jurídico 2'],
        'analista': ['Analistas', 'Jurídico'],
        'analista_juridico': ['Analistas', 'Jurídico'],
        'atendimento': ['Atendimento', 'Protocolo'],
        'protocolo': ['Atendimento', 'Protocolo'],
        'cobranca': ['Cobrança'],
        'financeiro': ['Financeiro'],
        'diretoria': ['Diretoria', 'Gestores'],
        'gerente': ['Gestores'],
        'user': [],
    }

    # Define flags de staff/superuser com base no role customizado (se existir)
    role = app_metadata.get("role") or user_metadata.get("role") or ""
    role_lower = role.lower().replace(' ', '_').replace('-', '_') if role else ""
    
    if role_lower in ['admin', 'administrador']:
        user.is_staff = True
        user.is_superuser = True
    elif role_lower in ['staff', 'gerente', 'manager', 'diretoria', 'gestor']:
        user.is_staff = True
        user.is_superuser = False
    elif role_lower in ['fiscal', 'fiscalizacao', 'juridico', 'analista', 'analista_juridico']:
        user.is_staff = True  # Permite acesso ao admin
        user.is_superuser = False
    else:
        user.is_staff = False
        user.is_superuser = False
    
    # Limpa grupos gerenciados para evitar acúmulo de permissões
    managed_group_names = {name for names in ROLE_GROUPS.values() for name in names}
    if managed_group_names:
        managed_groups = Group.objects.filter(name__in=managed_group_names)
        if managed_groups.exists():
            user.groups.remove(*managed_groups)

    # Atribui grupos do Django baseado no role
    if role_lower in ROLE_GROUPS:
        for group_name in ROLE_GROUPS[role_lower]:
            group, _ = Group.objects.get_or_create(name=group_name)
            user.groups.add(group)
    
    # Log para debug
    print(f"[SupabaseAuth] Usuário {email} autenticado com role '{role}', grupos: {list(user.groups.values_list('name', flat=True))}")

    user.save(update_fields=["email", "first_name", "last_name", "is_staff", "is_superuser"])
    return user


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Autenticacao JWT para Supabase.
    Valida token via JWKS e converte para usuario Django.
    """

    def authenticate(self, request) -> Optional[Tuple[object, str]]:
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != b"bearer":
            return None

        if len(auth) == 1:
            raise exceptions.AuthenticationFailed("Token nao informado.")
        if len(auth) > 2:
            raise exceptions.AuthenticationFailed("Token invalido.")

        token = auth[1].decode("utf-8")

        supabase_url, jwks_url, iss, aud = _get_supabase_settings()
        if not supabase_url or not jwks_url:
            # Supabase nao configurado; deixa outras auths tentarem
            return None

        token_iss = _get_token_issuer(token)
        if not _is_supabase_token(token, supabase_url, iss):
            return None

        try:
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            if not kid:
                raise exceptions.AuthenticationFailed("Token Supabase sem kid.")

            public_key = _get_public_key(jwks_url, kid)

            issuer = None
            if token_iss and supabase_url and token_iss.startswith(supabase_url):
                issuer = token_iss
            elif iss:
                issuer = iss

            options = {"verify_aud": bool(aud), "verify_iss": bool(issuer)}
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=aud if aud else None,
                issuer=issuer if issuer else None,
                options=options,
            )
        except exceptions.AuthenticationFailed:
            raise
        except Exception as exc:
            raise exceptions.AuthenticationFailed(f"Token Supabase invalido: {exc}") from exc

        user = _get_or_create_user(payload)
        return (user, token)

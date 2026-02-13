"""
Utilitários centrais para gestão de papéis/perfis de usuários.
Mantém a mesma lógica utilizada nos serializers e contexto de autenticação.
"""
from __future__ import annotations

from typing import Iterable, List, Sequence


def _ensure_iterable(value) -> Sequence[str]:
    if value is None:
        return ()
    if isinstance(value, (list, tuple, set, frozenset)):
        return value
    return (value,)


def _extract_empresas(usuario) -> List[dict]:
    empresas = []
    relacao = getattr(usuario, "empresas_autorizadas", None)
    if not relacao:
        return empresas

    try:
        for empresa in relacao.all():
            empresas.append(
                {
                    "id": empresa.id,
                    "razao_social": empresa.razao_social,
                    "nome_fantasia": getattr(empresa, "nome_fantasia", ""),
                    "cnpj": getattr(empresa, "cnpj", ""),
                    "nivel_acesso": getattr(empresa, "nivel_acesso", ""),
                    "status": getattr(empresa, "status", ""),
                }
            )
    except Exception:
        # Relação pode não estar carregada ou falhar; mantemos lista vazia.
        return []

    return empresas


def _has_perfil_cidadao(usuario) -> bool:
    try:
        perfil = usuario.perfil_cidadao
        return perfil is not None
    except AttributeError:
        return False


ROLE_PRIORITY = ("admin", "staff", "atendimento", "protocolo", "empresa", "consumer", "guest")


def _has_grupo(usuario, nomes: Iterable[str]) -> bool:
    if not usuario or not hasattr(usuario, "groups"):
        return False
    try:
        grupos = set(usuario.groups.values_list("name", flat=True))
    except Exception:
        return False
    return bool(grupos.intersection({str(nome) for nome in nomes}))


def get_user_roles(usuario) -> List[str]:
    if not usuario or not getattr(usuario, "is_authenticated", False):
        return ["guest"]

    roles: List[str] = []

    if usuario.is_superuser:
        roles.append("admin")

    if usuario.is_staff and "staff" not in roles:
        roles.append("staff")

    if _has_grupo(usuario, ("Atendimento", "Protocolo")) and "atendimento" not in roles:
        roles.append("atendimento")

    if _has_grupo(usuario, ("Protocolo",)) and "protocolo" not in roles:
        roles.append("protocolo")

    if _extract_empresas(usuario):
        roles.append("empresa")

    if _has_perfil_cidadao(usuario):
        roles.append("consumer")

    if not roles:
        roles.append("guest")

    return roles


def get_primary_role(usuario) -> str:
    roles = set(get_user_roles(usuario))
    for candidate in ROLE_PRIORITY:
        if candidate in roles:
            return candidate
    return "guest"


def get_redirect_for_role(role_or_user) -> str:
    role_map = {
        "admin": "/dashboard",
        "staff": "/dashboard",
        "atendimento": "/atendimento/dashboard",
        "protocolo": "/atendimento/dashboard",
        "empresa": "/portal-empresa",
        "consumer": "/portal-consumidor",
        "guest": "/dashboard",
    }

    if hasattr(role_or_user, "is_authenticated"):
        primary = get_primary_role(role_or_user)
    else:
        primary = role_or_user or "guest"

    return role_map.get(primary, "/dashboard")


def get_empresas(usuario) -> List[dict]:
    return _extract_empresas(usuario)


def user_has_role(usuario, roles: Iterable[str]) -> bool:
    wanted = set(role.lower() for role in _ensure_iterable(roles))
    if not wanted:
        return True
    current = {role.lower() for role in get_user_roles(usuario)}
    return bool(current & wanted)

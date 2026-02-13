"""
Autenticação Django usando tokens JWT do Supabase.
Este módulo permite que o Django valide e autentique usuários
usando tokens emitidos pelo Supabase Auth.
"""

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from functools import lru_cache

User = get_user_model()

# Configurações do Supabase
SUPABASE_URL = getattr(settings, 'SUPABASE_URL', None) or getattr(settings, 'VITE_SUPABASE_URL', None)
SUPABASE_JWT_SECRET = getattr(settings, 'SUPABASE_JWT_SECRET', None)


@lru_cache(maxsize=1)
def get_supabase_jwt_secret():
    """
    Obtem o segredo JWT do Supabase.
    O segredo deve ser configurado diretamente em SUPABASE_JWT_SECRET.
    """
    return SUPABASE_JWT_SECRET


class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Autenticação customizada que valida tokens JWT do Supabase.
    
    Usage:
        Adicione em REST_FRAMEWORK settings:
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'core.supabase_auth.SupabaseJWTAuthentication',
            ...
        ]
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None  # Não é autenticação Bearer, deixa passar para o próximo
        
        token = auth_header.split(' ')[1]
        
        try:
            # Primeiro, tenta decodificar sem verificar a assinatura
            # para obter as informações do usuário
            unverified_payload = jwt.decode(
                token, 
                options={"verify_signature": False}
            )
            
            # Verifica se é um token do Supabase
            issuer = unverified_payload.get('iss', '')
            if 'supabase' not in issuer:
                return None  # Não é token do Supabase

            secret = get_supabase_jwt_secret()
            if not secret:
                raise AuthenticationFailed('SUPABASE_JWT_SECRET nao configurado.')

            expected_issuer = f"{SUPABASE_URL}/auth/v1" if SUPABASE_URL else None
            options = {"verify_aud": False, "verify_iss": bool(expected_issuer)}

            # Valida a assinatura e expiracao do token
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                issuer=expected_issuer if expected_issuer else None,
                options=options,
            )
            
            # Extrai informações do usuário do token
            user_id = payload.get('sub')
            email = payload.get('email')
            role = payload.get('role', 'authenticated')
            user_metadata = payload.get('user_metadata', {})
            app_metadata = payload.get('app_metadata', {})
            
            if not user_id:
                raise AuthenticationFailed('Token inválido: sem user_id')
            
            # Obtém ou cria o usuário no Django
            user = self._get_or_create_user(
                supabase_id=user_id,
                email=email,
                role=user_metadata.get('role', app_metadata.get('role', 'user')),
                user_metadata=user_metadata
            )
            
            # Adiciona informações do Supabase ao request
            request.supabase_user = {
                'id': user_id,
                'email': email,
                'role': user_metadata.get('role', app_metadata.get('role', 'user')),
                'metadata': user_metadata,
            }
            
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Token inválido: {str(e)}')
        except Exception as e:
            print(f'[SupabaseAuth] Erro ao autenticar: {e}')
            raise AuthenticationFailed(f'Erro de autenticação: {str(e)}')
    
    def _get_or_create_user(self, supabase_id, email, role, user_metadata):
        """
        Obtém ou cria um usuário Django baseado nos dados do Supabase.
        """
        # Mapeia roles do Supabase para permissões do Django
        ROLE_MAPPING = {
            'admin': {'is_staff': True, 'is_superuser': True},
            'staff': {'is_staff': True, 'is_superuser': False},
            'fiscal': {'is_staff': True, 'is_superuser': False},
            'juridico': {'is_staff': True, 'is_superuser': False},
            'analista': {'is_staff': True, 'is_superuser': False},
            'atendimento': {'is_staff': False, 'is_superuser': False},
            'user': {'is_staff': False, 'is_superuser': False},
        }
        
        # Grupos do Django baseados no role
        ROLE_GROUPS = {
            'admin': ['Administradores', 'Gestores'],
            'staff': ['Gestores'],
            'fiscal': ['Fiscalização'],
            'juridico': ['Jurídico'],
            'juridico_1': ['Jurídico', 'Jurídico 1'],
            'juridico_2': ['Jurídico', 'Jurídico 2'],
            'analista': ['Analistas'],
            'atendimento': ['Atendimento'],
        }
        
        try:
            # Tenta encontrar por email primeiro (mais comum)
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Tenta encontrar por username (pode ser o supabase_id ou parte do email)
            username = email.split('@')[0] if email else supabase_id[:30]
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                # Cria novo usuário
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=user_metadata.get('first_name', user_metadata.get('nome', '')),
                    last_name=user_metadata.get('last_name', user_metadata.get('sobrenome', '')),
                )
        
        # Atualiza permissões baseado no role
        role_permissions = ROLE_MAPPING.get(role.lower(), ROLE_MAPPING['user'])
        user.is_staff = role_permissions.get('is_staff', False)
        user.is_superuser = role_permissions.get('is_superuser', False)
        
        # Atualiza grupos do Django
        if role.lower() in ROLE_GROUPS:
            from django.contrib.auth.models import Group
            for group_name in ROLE_GROUPS[role.lower()]:
                group, _ = Group.objects.get_or_create(name=group_name)
                user.groups.add(group)
        
        user.save()
        
        return user


class SupabaseOrDjangoAuthentication(BaseAuthentication):
    """
    Tenta autenticar primeiro com Supabase, depois com Django.
    Permite que ambos os sistemas funcionem juntos.
    """
    
    def authenticate(self, request):
        # Primeiro tenta Supabase
        supabase_auth = SupabaseJWTAuthentication()
        result = supabase_auth.authenticate(request)
        
        if result is not None:
            return result
        
        # Se Supabase falhar, deixa o Django tentar
        return None

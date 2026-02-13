"""
API para gerenciamento de usuários integrado com Supabase.
Permite criar, listar, atualizar e gerenciar cargos/permissões de usuários.
"""

import os
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework import serializers

User = get_user_model()

# Configurações do Supabase
SUPABASE_URL = (
    getattr(settings, 'SUPABASE_URL', None)
    or os.environ.get('SUPABASE_URL')
    or os.environ.get('VITE_SUPABASE_URL')
)
if SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.rstrip('/')

SUPABASE_SERVICE_KEY = (
    getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', None)
    or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
)
SUPABASE_ANON_KEY = (
    getattr(settings, 'SUPABASE_ANON_KEY', None)
    or os.environ.get('SUPABASE_ANON_KEY')
    or os.environ.get('VITE_SUPABASE_ANON_KEY', '')
)

# Mapeamento de roles para grupos Django
ROLE_GROUPS = {
    'admin': ['Administradores', 'Gestores'],
    'staff': ['Gestores'],
    'fiscal': ['Fiscalização'],
    'fiscalizacao': ['Fiscalização'],
    'fiscalizacao_denuncias': ['Fiscalização', 'Fiscalização - Denúncias'],
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

# Roles disponíveis para seleção
AVAILABLE_ROLES = [
    {'value': 'admin', 'label': 'Administrador', 'description': 'Acesso total ao sistema'},
    {'value': 'fiscal', 'label': 'Fiscal', 'description': 'Acesso à fiscalização'},
    {'value': 'fiscalizacao_denuncias', 'label': 'Fiscal - Denúncias', 'description': 'Fiscalização de denúncias'},
    {'value': 'juridico', 'label': 'Jurídico', 'description': 'Acesso ao setor jurídico'},
    {'value': 'juridico_1', 'label': 'Jurídico 1', 'description': 'Jurídico - Setor 1'},
    {'value': 'juridico_2', 'label': 'Jurídico 2', 'description': 'Jurídico - Setor 2'},
    {'value': 'analista', 'label': 'Analista', 'description': 'Analista geral'},
    {'value': 'atendimento', 'label': 'Atendimento', 'description': 'Atendimento ao consumidor'},
    {'value': 'protocolo', 'label': 'Protocolo', 'description': 'Setor de protocolo'},
    {'value': 'cobranca', 'label': 'Cobrança', 'description': 'Setor de cobrança'},
    {'value': 'financeiro', 'label': 'Financeiro', 'description': 'Setor financeiro'},
    {'value': 'diretoria', 'label': 'Diretoria', 'description': 'Diretoria/Gestão'},
    {'value': 'user', 'label': 'Usuário', 'description': 'Usuário comum'},
]

class IsAdminOrManager(BasePermission):
    """Permite apenas superuser ou membros de grupos administrativos."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.groups.filter(name__in=['Administradores', 'Gestores', 'Diretoria']).exists()


def _ensure_supabase_ready(require_service_key=True):
    if not SUPABASE_URL:
        return Response({'error': 'SUPABASE_URL nao configurada.'}, status=500)
    if require_service_key and not SUPABASE_SERVICE_KEY:
        return Response({'error': 'SUPABASE_SERVICE_ROLE_KEY nao configurada.'}, status=500)
    if not SUPABASE_ANON_KEY and not SUPABASE_SERVICE_KEY:
        return Response({'error': 'SUPABASE_ANON_KEY nao configurada.'}, status=500)
    return None


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    groups_list = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'is_active', 'is_staff', 'is_superuser', 'date_joined',
                  'role', 'groups_list']
        read_only_fields = ['id', 'date_joined']
    
    def get_role(self, obj):
        # Determina o role baseado nos grupos
        groups = list(obj.groups.values_list('name', flat=True))
        if obj.is_superuser:
            return 'admin'
        for role, role_groups in ROLE_GROUPS.items():
            if any(g in groups for g in role_groups):
                return role
        return 'user'
    
    def get_groups_list(self, obj):
        return list(obj.groups.values_list('name', flat=True))


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    full_name = serializers.CharField(max_length=255)
    role = serializers.ChoiceField(choices=[(r['value'], r['label']) for r in AVAILABLE_ROLES])
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class UpdateUserRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[(r['value'], r['label']) for r in AVAILABLE_ROLES])


def get_supabase_headers(use_service_key=False):
    """Retorna headers para API do Supabase"""
    if use_service_key and not SUPABASE_SERVICE_KEY:
        raise RuntimeError('SUPABASE_SERVICE_ROLE_KEY nao configurada.')
    key = SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY
    if not key:
        raise RuntimeError('Chave do Supabase nao configurada.')
    return {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }


def sync_user_to_django(supabase_user_id, email, full_name, role):
    """Sincroniza usuário do Supabase com o Django"""
    username = email.split('@')[0]
    
    # Tenta encontrar usuário existente
    user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.filter(username=username).first()
    
    if not user:
        # Cria novo usuário
        user = User.objects.create(
            username=username,
            email=email,
            is_active=True,
        )
    
    # Atualiza nome
    if full_name:
        parts = full_name.strip().split()
        user.first_name = parts[0] if parts else ''
        user.last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''
    
    # Define permissões baseado no role
    role_lower = role.lower().replace(' ', '_').replace('-', '_') if role else 'user'
    
    if role_lower in ['admin', 'administrador']:
        user.is_staff = True
        user.is_superuser = True
    elif role_lower in ['staff', 'gerente', 'manager', 'diretoria', 'gestor']:
        user.is_staff = True
        user.is_superuser = False
    elif role_lower in ['fiscal', 'fiscalizacao', 'juridico', 'analista', 'analista_juridico']:
        user.is_staff = True
        user.is_superuser = False
    else:
        user.is_staff = False
        user.is_superuser = False
    
    # Limpa grupos antigos e adiciona novos
    user.groups.clear()
    if role_lower in ROLE_GROUPS:
        for group_name in ROLE_GROUPS[role_lower]:
            group, _ = Group.objects.get_or_create(name=group_name)
            user.groups.add(group)
    
    user.save()
    return user


@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def get_available_roles(request):
    """Retorna lista de roles disponíveis para seleção"""
    return Response(AVAILABLE_ROLES)


@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def list_users(request):
    """Lista todos os usuários do Supabase"""
    config_error = _ensure_supabase_ready()
    if config_error:
        return config_error
    try:
        # Busca perfis do Supabase
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc',
            headers=get_supabase_headers(use_service_key=True),
            timeout=10
        )
        
        if response.status_code == 200:
            profiles = response.json()
            return Response(profiles)
        else:
            return Response(
                {'error': 'Erro ao buscar usuários', 'details': response.text},
                status=response.status_code
            )
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminOrManager])
def create_user(request):
    """Cria um novo usuário no Supabase e sincroniza com Django"""
    serializer = CreateUserSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    data = serializer.validated_data
    
    config_error = _ensure_supabase_ready()
    if config_error:
        return config_error
    
    try:
        # Cria usuário no Supabase Auth
        auth_response = requests.post(
            f'{SUPABASE_URL}/auth/v1/admin/users',
            headers=get_supabase_headers(use_service_key=True),
            timeout=10,
            json={
                'email': data['email'],
                'password': data['password'],
                'email_confirm': True,
                'user_metadata': {
                    'full_name': data['full_name'],
                    'phone': data.get('phone', ''),
                },
                'app_metadata': {
                    'role': data['role'],
                }
            }
        )
        
        if auth_response.status_code not in [200, 201]:
            return Response(
                {'error': 'Erro ao criar usuario no Supabase', 'details': auth_response.text},
                status=auth_response.status_code
            )

        user_data = auth_response.json()
        user_id = user_data.get('id')
        
        if user_id:
            # Atualiza o perfil com o role correto
            profile_response = requests.patch(
                f'{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}',
                headers=get_supabase_headers(use_service_key=True),
                timeout=10,
                json={
                    'role': data['role'],
                    'full_name': data['full_name'],
                }
            )
            
            # Sincroniza com Django
            django_user = sync_user_to_django(
                user_id, 
                data['email'], 
                data['full_name'], 
                data['role']
            )
            
            return Response({
                'success': True,
                'message': 'Usuário criado com sucesso',
                'user': {
                    'id': user_id,
                    'email': data['email'],
                    'full_name': data['full_name'],
                    'role': data['role'],
                    'django_id': django_user.id,
                }
            }, status=201)
        
        return Response({'error': 'Erro ao obter ID do usuário'}, status=500)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PATCH'])
@permission_classes([IsAdminOrManager])
def update_user_role(request, user_id):
    """Atualiza o role/cargo de um usuário"""
    serializer = UpdateUserRoleSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    new_role = serializer.validated_data['role']
    
    config_error = _ensure_supabase_ready()
    if config_error:
        return config_error
    
    try:
        # Atualiza perfil no Supabase
        profile_response = requests.patch(
            f'{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}',
            headers=get_supabase_headers(use_service_key=True),
            timeout=10,
            json={'role': new_role}
        )
        
        if profile_response.status_code not in [200, 204]:
            return Response(
                {'error': 'Erro ao atualizar perfil', 'details': profile_response.text},
                status=profile_response.status_code
            )
        
        # Busca email do usuário para sincronizar com Django
        get_profile = requests.get(
            f'{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=email,full_name',
            headers=get_supabase_headers(use_service_key=True),
            timeout=10
        )
        
        if get_profile.status_code == 200:
            profiles = get_profile.json()
            if profiles:
                profile = profiles[0]
                sync_user_to_django(
                    user_id,
                    profile['email'],
                    profile.get('full_name', ''),
                    new_role
                )
        
        return Response({
            'success': True,
            'message': f'Role atualizado para {new_role}',
            'user_id': user_id,
            'role': new_role
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAdminOrManager])
def delete_user(request, user_id):
    """Desativa um usuario (soft delete)"""
    config_error = _ensure_supabase_ready()
    if config_error:
        return config_error
    try:
        # Buscar email antes de desativar (para sincronizar Django)
        email = None
        get_profile = requests.get(
            f'{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=email',
            headers=get_supabase_headers(use_service_key=True),
            timeout=10
        )
        if get_profile.status_code == 200:
            profiles = get_profile.json()
            if profiles:
                email = profiles[0].get('email')

        # Desativa no Supabase
        response = requests.patch(
            f'{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}',
            headers=get_supabase_headers(use_service_key=True),
            timeout=10,
            json={'is_active': False}
        )
        
        if response.status_code not in [200, 204]:
            return Response(
                {'error': 'Erro ao desativar usuario'},
                status=response.status_code
            )
        
        # Desativa no Django apenas o usuario alvo
        if email:
            User.objects.filter(email=email).update(is_active=False)
        
        return Response({'success': True, 'message': 'Usuario desativado'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def get_user_profile(request, user_id):
    """Obtém perfil completo de um usuário"""
    config_error = _ensure_supabase_ready()
    if config_error:
        return config_error
    try:
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*',
            headers=get_supabase_headers(use_service_key=True),
            timeout=10
        )
        
        if response.status_code == 200:
            profiles = response.json()
            if profiles:
                return Response(profiles[0])
            return Response({'error': 'Usuário não encontrado'}, status=404)
        
        return Response({'error': 'Erro ao buscar perfil'}, status=response.status_code)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminOrManager])
def sync_all_users(request):
    """Sincroniza todos os usuários do Supabase com o Django"""
    config_error = _ensure_supabase_ready()
    if config_error:
        return config_error
    try:
        # Busca todos os perfis
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/profiles?select=*',
            headers=get_supabase_headers(use_service_key=True),
            timeout=10
        )
        
        if response.status_code != 200:
            return Response({'error': 'Erro ao buscar perfis'}, status=response.status_code)
        
        profiles = response.json()
        synced = 0
        errors = []
        
        for profile in profiles:
            try:
                sync_user_to_django(
                    profile['id'],
                    profile['email'],
                    profile.get('full_name', ''),
                    profile.get('role', 'user')
                )
                synced += 1
            except Exception as e:
                errors.append({'email': profile['email'], 'error': str(e)})
        
        return Response({
            'success': True,
            'synced': synced,
            'total': len(profiles),
            'errors': errors
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

"""
Views com rate limiting aplicado
"""
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from rest_framework_simplejwt.tokens import RefreshToken
from core.decorators import auth_ratelimit
from core.validators import validate_cpf, validate_phone, validate_email
from portal_cidadao.models import PerfilCidadao

User = get_user_model()


def _format_cpf(cpf_value):
    if cpf_value and len(cpf_value) == 11:
        return f"{cpf_value[:3]}.{cpf_value[3:6]}.{cpf_value[6:9]}-{cpf_value[9:]}"
    return cpf_value


def _format_phone(phone_value):
    if phone_value and phone_value.isdigit():
        if len(phone_value) == 11:
            return f"({phone_value[:2]}) {phone_value[2:7]}-{phone_value[7:]}"
        if len(phone_value) == 10:
            return f"({phone_value[:2]}) {phone_value[2:6]}-{phone_value[6:]}"
    return phone_value


class TokenObtainPairView(BaseTokenObtainPairView):
    """
    Token obtain view com rate limiting
    """
    @auth_ratelimit(rate='5/m')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

@api_view(['POST'])
@auth_ratelimit(rate='3/m')
def register(request):
    """Endpoint de registro de usuário"""
    username = (request.data.get('username') or '').strip().lower()
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password')
    nome = (request.data.get('nome') or request.data.get('first_name') or '').strip()
    cpf = (request.data.get('cpf') or '').strip()
    telefone = (request.data.get('telefone') or '').strip()
    cidade = (request.data.get('cidade') or '').strip()
    estado = (request.data.get('estado') or '').strip()
    endereco = (request.data.get('endereco') or '').strip()

    if not email:
        return Response({'errors': {'email': 'Email é obrigatório'}}, status=status.HTTP_400_BAD_REQUEST)

    if not password:
        return Response({'errors': {'password': 'Senha é obrigatória'}}, status=status.HTTP_400_BAD_REQUEST)

    if not cpf:
        return Response({'errors': {'cpf': 'CPF é obrigatório'}}, status=status.HTTP_400_BAD_REQUEST)

    if not username:
        username = email

    try:
        email = validate_email(email)
    except ValidationError as e:
        return Response({'errors': {'email': list(e.messages)}}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cpf_normalizado = validate_cpf(cpf)
    except ValidationError as e:
        return Response({'errors': {'cpf': list(e.messages)}}, status=status.HTTP_400_BAD_REQUEST)

    telefone_normalizado = ''
    if telefone:
        try:
            telefone_normalizado = validate_phone(telefone)
        except ValidationError as e:
            return Response({'errors': {'telefone': list(e.messages)}}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'errors': {'username': 'Username já existe'}}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'errors': {'email': 'Email já existe'}}, status=status.HTTP_400_BAD_REQUEST)

    if PerfilCidadao.objects.filter(cpf=cpf_normalizado).exists():
        return Response({'errors': {'cpf': 'CPF já cadastrado'}}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password)
    except ValidationError as e:
        return Response({'errors': {'password': list(e.messages)}}, status=status.HTTP_400_BAD_REQUEST)

    first_name = nome.split()[0] if nome else ''
    last_name = ' '.join(nome.split()[1:]) if nome and len(nome.split()) > 1 else ''

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            PerfilCidadao.objects.create(
                user=user,
                nome_completo=nome or user.get_full_name() or username,
                cpf=cpf_normalizado,
                telefone=telefone_normalizado,
                cidade=cidade,
                estado=(estado.upper()[:2] if estado else ''),
                endereco=endereco,
            )
    except IntegrityError:
        return Response({'errors': {'detail': 'Não foi possível concluir o cadastro. Verifique se as informações já estão em uso.'}}, status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(user)
    perfil = getattr(user, 'perfil_cidadao', None)
    perfil_data = None
    if perfil:
        perfil_data = {
            'nome_completo': perfil.nome_completo,
            'cpf': _format_cpf(perfil.cpf),
            'telefone': _format_phone(perfil.telefone),
            'cidade': perfil.cidade,
            'estado': perfil.estado,
            'endereco': perfil.endereco,
        }

    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'profile': perfil_data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@auth_ratelimit(rate='5/m')
def login(request):
    """Endpoint de login de usuário"""
    from django.contrib.auth import authenticate
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not all([username, password]):
        return Response({
            'error': 'Username e password são obrigatórios'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        perfil = getattr(user, 'perfil_cidadao', None)
        perfil_data = None
        if perfil:
            perfil_data = {
                'nome_completo': perfil.nome_completo,
                'cpf': _format_cpf(perfil.cpf),
                'telefone': _format_phone(perfil.telefone),
                'cidade': perfil.cidade,
                'estado': perfil.estado,
                'endereco': perfil.endereco,
            }
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'profile': perfil_data
        })
    
    return Response({
        'error': 'Credenciais inválidas'
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Endpoint de logout"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logout realizado com sucesso'})
    except Exception:
        return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Endpoint para obter perfil do usuário"""
    user = request.user
    perfil = getattr(user, 'perfil_cidadao', None)
    perfil_data = None
    if perfil:
        perfil_data = {
            'nome_completo': perfil.nome_completo,
            'cpf': _format_cpf(perfil.cpf),
            'telefone': _format_phone(perfil.telefone),
            'cidade': perfil.cidade,
            'estado': perfil.estado,
            'endereco': perfil.endereco,
        }

    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'date_joined': user.date_joined,
        'profile': perfil_data,
    })

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Endpoint para atualizar perfil do usuário"""
    user = request.user
    
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.email = request.data.get('email', user.email)
    
    user.save()
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Endpoint para alterar senha"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not all([old_password, new_password]):
        return Response({
            'error': 'Senha antiga e nova são obrigatórias'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not user.check_password(old_password):
        return Response({
            'error': 'Senha antiga incorreta'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return Response({
            'error': list(e.messages)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Senha alterada com sucesso'})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    """Endpoint de dashboard para admin"""
    return Response({
        'message': 'Admin dashboard',
        'user': request.user.username,
        'is_admin': request.user.is_superuser,
        'is_staff': request.user.is_staff
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_dashboard(request):
    """Endpoint de dashboard para staff"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Acesso negado. Usuário deve ser staff.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    return Response({
        'message': 'Staff dashboard',
        'user': request.user.username,
        'is_staff': request.user.is_staff
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])  
def protected_endpoint(request):
    """Endpoint protegido para testes de autenticação"""
    return Response({
        'message': 'Acesso autorizado',
        'user': request.user.username
    })

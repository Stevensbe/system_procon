from django.contrib.auth import get_user_model
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from core.decorators import auth_ratelimit

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """View para registro de usuários"""
    permission_classes = [permissions.AllowAny]
    
    @auth_ratelimit(rate='3/m')
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not all([username, email, password]):
            return Response({
                'error': 'Todos os campos são obrigatórios'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Nome de usuário já existe'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email já existe'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        return Response({
            'message': 'Usuário criado com sucesso',
            'user_id': user.id
        }, status=status.HTTP_201_CREATED)

class LoginView(TokenObtainPairView):
    """View para login de usuários"""
    permission_classes = [permissions.AllowAny]
    
    @auth_ratelimit(rate='5/m')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class LogoutView(generics.GenericAPIView):
    """View para logout de usuários"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Logout realizado com sucesso'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Erro ao fazer logout'
            }, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """View para perfil do usuário"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        from .serializers import UserProfileSerializer
        return UserProfileSerializer

class ChangePasswordView(generics.UpdateAPIView):
    """View para alteração de senha"""
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({
                'error': 'Senha atual incorreta'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Senha alterada com sucesso'
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def protected_endpoint(request):
    """Endpoint protegido para testes"""
    return Response({
        'message': 'Endpoint protegido acessado com sucesso',
        'user': request.user.username
    })

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_only_endpoint(request):
    """Endpoint apenas para administradores"""
    return Response({
        'message': 'Endpoint de admin acessado com sucesso',
        'user': request.user.username
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def staff_only_endpoint(request):
    """Endpoint apenas para staff"""
    if not request.user.is_staff:
        return Response({
            'error': 'Acesso negado'
        }, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'message': 'Endpoint de staff acessado com sucesso',
        'user': request.user.username
    })

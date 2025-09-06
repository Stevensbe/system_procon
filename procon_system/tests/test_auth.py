import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()

class TestAuthentication:
    """Testes de autenticação e autorização"""
    
    def test_user_registration_success(self, api_client, user_data):
        """Testa registro de usuário com sucesso"""
        url = reverse('register')
        response = api_client.post(url, user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'tokens' in response.data
        assert response.data['user']['username'] == user_data['username']
        assert response.data['user']['email'] == user_data['email']
    
    def test_user_registration_invalid_data(self, api_client):
        """Testa registro com dados inválidos"""
        url = reverse('register')
        invalid_data = {
            'username': 'test',
            'email': 'invalid-email',
            'password': '123'  # Senha muito curta
        }
        response = api_client.post(url, invalid_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_user_login_success(self, api_client, user):
        """Testa login com sucesso"""
        # Criar usuário com senha
        user.set_password('testpass123')
        user.save()
        
        url = reverse('login')
        login_data = {
            'username': user.username,
            'password': 'testpass123'
        }
        response = api_client.post(url, login_data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data
    
    def test_user_login_invalid_credentials(self, api_client):
        """Testa login com credenciais inválidas"""
        url = reverse('login')
        login_data = {
            'username': 'nonexistent',
            'password': 'wrongpass'
        }
        response = api_client.post(url, login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'detail' in response.data
    
    def test_token_refresh_success(self, api_client, user):
        """Testa refresh de token com sucesso"""
        refresh = RefreshToken.for_user(user)
        url = reverse('token_refresh')
        data = {'refresh': str(refresh)}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
    
    def test_token_refresh_invalid(self, api_client):
        """Testa refresh de token inválido"""
        url = reverse('token_refresh')
        data = {'refresh': 'invalid-token'}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'detail' in response.data
    
    def test_logout_success(self, authenticated_client):
        """Testa logout com sucesso"""
        url = reverse('logout')
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
    
    def test_logout_unauthorized(self, api_client):
        """Testa logout sem autenticação"""
        url = reverse('logout')
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_protected_endpoint_with_auth(self, authenticated_client):
        """Testa acesso a endpoint protegido com autenticação"""
        url = reverse('test_api')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_protected_endpoint_without_auth(self, api_client):
        """Testa acesso a endpoint protegido sem autenticação"""
        url = reverse('test_api')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_user_profile_retrieve(self, authenticated_client, user):
        """Testa recuperação do perfil do usuário"""
        url = reverse('profile')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == user.username
        assert response.data['email'] == user.email
    
    def test_user_profile_update(self, authenticated_client, user):
        """Testa atualização do perfil do usuário"""
        url = reverse('profile')
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = authenticated_client.patch(url, update_data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'
        assert response.data['last_name'] == 'Name'
    
    def test_change_password_success(self, authenticated_client, user):
        """Testa mudança de senha com sucesso"""
        # Definir senha inicial
        user.set_password('oldpass123')
        user.save()
        
        url = reverse('change_password')
        password_data = {
            'old_password': 'oldpass123',
            'new_password': 'newpass123'
        }
        response = authenticated_client.post(url, password_data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
    
    def test_change_password_wrong_old_password(self, authenticated_client, user):
        """Testa mudança de senha com senha antiga incorreta"""
        user.set_password('oldpass123')
        user.save()
        
        url = reverse('change_password')
        password_data = {
            'old_password': 'wrongpass',
            'new_password': 'newpass123'
        }
        response = authenticated_client.post(url, password_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data

class TestPermissions:
    """Testes de permissões e autorização"""
    
    def test_admin_only_endpoint_with_admin(self, admin_client):
        """Testa endpoint admin com superusuário"""
        url = reverse('admin_dashboard')
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert response.data['is_admin'] == True
    
    def test_admin_only_endpoint_with_user(self, authenticated_client):
        """Testa endpoint admin com usuário comum"""
        url = reverse('admin_dashboard')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_staff_only_endpoint_with_staff(self, api_client):
        """Testa endpoint staff com usuário staff"""
        # Criar usuário staff
        user = User.objects.create_user(
            username='staffuser',
            email='staff@example.com',
            password='testpass123',
            is_staff=True
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        url = reverse('staff_dashboard')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert response.data['is_staff'] == True
    
    def test_staff_only_endpoint_with_user(self, authenticated_client):
        """Testa endpoint staff com usuário comum"""
        url = reverse('staff_dashboard')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

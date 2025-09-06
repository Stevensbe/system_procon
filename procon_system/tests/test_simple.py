import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()

class TestBasicEndpoints:
    """Testes básicos dos endpoints existentes"""
    
    def test_health_check_endpoint(self, api_client):
        """Testa endpoint de health check"""
        url = reverse('health_check')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'status' in response.data
        assert response.data['status'] == 'healthy'
    
    def test_test_api_endpoint(self, api_client):
        """Testa endpoint de teste da API"""
        url = reverse('test_api')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert response.data['message'] == 'Test API endpoint'
    
    def test_teste_api_endpoint(self, api_client):
        """Testa endpoint de teste da API (português)"""
        url = reverse('teste_api')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert response.data['message'] == 'API funcionando!'

class TestAuthentication:
    """Testes de autenticação básicos"""
    
    def test_token_obtain_pair(self, api_client, user):
        """Testa obtenção de token"""
        user.set_password('testpass123')
        user.save()
        
        url = reverse('token_obtain_pair')
        data = {
            'username': user.username,
            'password': 'testpass123'
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_token_refresh(self, api_client, user):
        """Testa refresh de token"""
        refresh = RefreshToken.for_user(user)
        url = reverse('token_refresh')
        data = {'refresh': str(refresh)}
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

class TestModels:
    """Testes básicos dos modelos"""
    
    def test_user_creation(self):
        """Testa criação de usuário"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
    
    def test_superuser_creation(self):
        """Testa criação de superusuário"""
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        assert superuser.username == 'admin'
        assert superuser.is_superuser
        assert superuser.is_staff

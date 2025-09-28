import os
import sys
import django
from django.conf import settings

# Configurar Django antes de qualquer import
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
    django.setup()

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from factory import Faker
from factory.django import DjangoModelFactory

User = get_user_model()

# ===============================================
# FACTORIES PARA TESTES
# ===============================================

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    username = Faker('user_name')
    email = Faker('email')
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    is_staff = False
    is_superuser = False

class SuperUserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    username = Faker('user_name')
    email = Faker('email')
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    is_staff = True
    is_superuser = True

# ===============================================
# FIXTURES PARA TESTES
# ===============================================

@pytest.fixture
def api_client():
    """Cliente API para testes"""
    return APIClient()

@pytest.fixture
def user():
    """Usuário comum para testes"""
    return UserFactory()

@pytest.fixture
def superuser():
    """Superusuário para testes"""
    return SuperUserFactory()

@pytest.fixture
def authenticated_client(api_client, user):
    """Cliente API autenticado com usuário comum"""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def admin_client(api_client, superuser):
    """Cliente API autenticado com superusuário"""
    refresh = RefreshToken.for_user(superuser)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def user_data():
    """Dados de usuário para criação"""
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User'
    }

@pytest.fixture
def login_data():
    """Dados para login"""
    return {
        'username': 'testuser',
        'password': 'testpass123'
    }

# ===============================================
# CONFIGURAÇÕES DE TESTE
# ===============================================

@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Habilita acesso ao banco para todos os testes"""
    pass

@pytest.fixture
def mock_redis(mocker):
    """Mock do Redis para testes"""
    return mocker.patch('redis.Redis')

@pytest.fixture
def mock_celery(mocker):
    """Mock do Celery para testes"""
    return mocker.patch('celery.app.control.Control.inspect')

# ===============================================
# HELPERS PARA TESTES
# ===============================================

def create_user_with_token(user_data=None):
    """Cria um usuário e retorna o token de acesso"""
    if user_data is None:
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123'
        }
    
    user = UserFactory(**user_data)
    user.set_password(user_data['password'])
    user.save()
    
    refresh = RefreshToken.for_user(user)
    return user, refresh.access_token

def assert_response_structure(response, expected_status=200):
    """Verifica estrutura básica da resposta"""
    assert response.status_code == expected_status
    
    if expected_status == 200:
        assert 'data' in response.data or 'results' in response.data or 'message' in response.data
    
    if expected_status == 400:
        assert 'errors' in response.data or 'detail' in response.data
    
    if expected_status == 401:
        assert 'detail' in response.data
    
    if expected_status == 403:
        assert 'detail' in response.data
    
    if expected_status == 404:
        assert 'detail' in response.data

def assert_pagination(response):
    """Verifica estrutura de paginação"""
    assert 'count' in response.data
    assert 'next' in response.data
    assert 'previous' in response.data
    assert 'results' in response.data
    assert isinstance(response.data['count'], int)
    assert isinstance(response.data['results'], list)

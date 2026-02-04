from __future__ import annotations

import os
import random
from typing import Generator

# ---------------------------------------------------------------------------
# Configure Django before importing anything that touches ORM/models
# ---------------------------------------------------------------------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "procon_system.settings")
import django  # noqa: E402

django.setup()

import pytest  # noqa: E402
from django.conf import settings  # noqa: E402
from django.test import Client  # noqa: E402
from faker import Faker as FakerGenerator  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402
from rest_framework_simplejwt.tokens import RefreshToken  # noqa: E402

from .factories import SuperUserFactory, UserFactory  # noqa: E402


# ---------------------------------------------------------------------------
# Configurações globais para a suíte de testes
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def _configure_settings_for_tests() -> None:
    """Força backends rápidos/seguros durante testes."""
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture(scope="session")
def faker_locale() -> str:
    return os.getenv("FAKER_LOCALE", "pt_BR")


@pytest.fixture(scope="session")
def faker(faker_locale: str) -> FakerGenerator:
    """Instância compartilhada do Faker com seed fixa para repetibilidade."""
    seed = int(os.getenv("PYTEST_FAKER_SEED", "12345"))
    fake = FakerGenerator(locale=faker_locale)
    FakerGenerator.seed(seed)
    random.seed(seed)
    return fake


# ---------------------------------------------------------------------------
# Usuários/Django test client
# ---------------------------------------------------------------------------
@pytest.fixture()
def user(db) -> Generator:
    yield UserFactory()


@pytest.fixture()
def superuser(db) -> Generator:
    yield SuperUserFactory()


@pytest.fixture()
def client_logged(client: Client, user) -> Client:
    """Client padrão do Django autenticado."""
    client.force_login(user)
    return client


@pytest.fixture()
def admin_django_client(client: Client, superuser) -> Client:
    """Client do Django autenticado como superusuário (usado em views server-side)."""
    client.force_login(superuser)
    return client


# ---------------------------------------------------------------------------
# API helpers (DRF)
# ---------------------------------------------------------------------------
@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def authenticated_client(api_client: APIClient, user):
    """Cliente API autenticado com usuário comum via JWT."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


@pytest.fixture
def admin_client(api_client: APIClient, superuser):
    """Cliente API autenticado como superusuário (usado pelos testes de permissões)."""
    refresh = RefreshToken.for_user(superuser)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


@pytest.fixture
def user_data():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def login_data():
    return {"username": "testuser", "password": "testpass123"}


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Habilita acesso ao banco para todos os testes (mesmo sem usar o fixture db explicitamente)."""
    yield


@pytest.fixture
def mock_redis(mocker):
    return mocker.patch("redis.Redis")


@pytest.fixture
def mock_celery(mocker):
    return mocker.patch("celery.app.control.Control.inspect")


# ---------------------------------------------------------------------------
# Utilitários compartilhados nos testes
# ---------------------------------------------------------------------------
def create_user_with_token(user_data=None):
    """Cria usuário e devolve (user, access_token)."""
    if user_data is None:
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
        }

    user = UserFactory(**user_data)
    user.set_password(user_data["password"])
    user.save()

    refresh = RefreshToken.for_user(user)
    return user, refresh.access_token


def assert_response_structure(response, expected_status=200):
    """Verifica estrutura básica da resposta DRF."""
    assert response.status_code == expected_status

    if expected_status == 200:
        assert any(
            key in response.data for key in ("data", "results", "message")
        ), "Resposta 200 deve conter dados ou mensagem"
    elif expected_status in {400, 401, 403, 404}:
        assert "detail" in response.data or "errors" in response.data


def assert_pagination(response):
    """Valida chaves padrão de paginação DRF."""
    for key in ("count", "next", "previous", "results"):
        assert key in response.data
    assert isinstance(response.data["count"], int)
    assert isinstance(response.data["results"], list)

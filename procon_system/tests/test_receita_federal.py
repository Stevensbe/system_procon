import pytest
from django.urls import reverse

from atendimento.services import ReceitaFederalService


class DummyResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


def _mock_requests_get(monkeypatch, status_code=200, payload=None):
    payload = payload or {}

    def _fake_get(url, timeout=None, headers=None):
        return DummyResponse(status_code, payload)

    monkeypatch.setattr('atendimento.services.requests.get', _fake_get)


def test_consultar_cnpj_sucesso(monkeypatch):
    payload = {
        'status': 'OK',
        'nome': 'Empresa Exemplo LTDA',
        'fantasia': 'Empresa Exemplo',
        'situacao': 'ATIVA',
        'logradouro': 'Rua Exemplo',
        'numero': '123',
        'bairro': 'Centro',
        'municipio': 'Manaus',
        'uf': 'AM',
        'cep': '69000-000',
        'telefone': '(92) 99999-9999',
        'email': 'contato@empresa.com',
    }
    _mock_requests_get(monkeypatch, status_code=200, payload=payload)

    resultado = ReceitaFederalService.consultar_cnpj('12.345.678/0001-95')

    assert resultado['sucesso'] is True
    assert resultado['razao_social'] == payload['nome']
    assert resultado['dados_brutos'] == payload


def test_consultar_cnpj_limite_excedido(monkeypatch):
    _mock_requests_get(monkeypatch, status_code=429)

    resultado = ReceitaFederalService.consultar_cnpj('12345678000195')

    assert resultado['erro'].startswith('Limite de consultas')


def test_consultar_cnpj_invalido():
    resultado = ReceitaFederalService.consultar_cnpj('123')

    assert resultado == {'erro': 'CNPJ inválido'}


@pytest.mark.django_db
def test_api_consultar_cnpj_sucesso(client, django_user_model, monkeypatch):
    usuario = django_user_model.objects.create_user('tester', 'tester@example.com', 'senha123')
    client.force_login(usuario)

    esperado = {'sucesso': True, 'razao_social': 'Teste'}
    monkeypatch.setattr(
        'atendimento.views.ReceitaFederalService.consultar_cnpj',
        lambda cnpj: esperado,
    )

    resposta = client.get(reverse('atendimento:api_consultar_cnpj'), {'cnpj': '12345678000195'})

    assert resposta.status_code == 200
    assert resposta.json() == esperado


@pytest.mark.django_db
def test_api_consultar_cnpj_retorna_erro_do_servico(client, django_user_model, monkeypatch):
    usuario = django_user_model.objects.create_user('tester2', 'tester2@example.com', 'senha123')
    client.force_login(usuario)

    monkeypatch.setattr(
        'atendimento.views.ReceitaFederalService.consultar_cnpj',
        lambda cnpj: {'erro': 'Serviço indisponível'},
    )

    resposta = client.get(reverse('atendimento:api_consultar_cnpj'), {'cnpj': '12345678000195'})

    assert resposta.status_code == 400
    assert resposta.json() == {'erro': 'Serviço indisponível'}


@pytest.mark.django_db
def test_api_consultar_cnpj_valida_tamanho(client, django_user_model):
    usuario = django_user_model.objects.create_user('tester3', 'tester3@example.com', 'senha123')
    client.force_login(usuario)

    resposta = client.get(reverse('atendimento:api_consultar_cnpj'), {'cnpj': '123'})

    assert resposta.status_code == 400
    assert resposta.json()['erro'] == 'CNPJ inválido'

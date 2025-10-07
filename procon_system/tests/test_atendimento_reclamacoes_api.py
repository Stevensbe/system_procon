import pytest
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from atendimento.models import Atendimento

from portal_cidadao.models import ReclamacaoDenuncia


def _build_payload():
    return {
        'tipo_demanda': 'RECLAMACAO',
        'consumidor_nome': 'Maria Teste',
        'consumidor_cpf': '52998224725',
        'consumidor_email': 'maria@example.com',
        'consumidor_telefone': '11988887777',
        'consumidor_endereco': 'Rua das Flores, 100',
        'consumidor_cep': '01310930',
        'consumidor_cidade': 'São Paulo',
        'consumidor_uf': 'SP',
        'empresa_razao_social': 'Fornecedor ABC',
        'empresa_cnpj': '19131243000197',
        'empresa_endereco': 'Av. Paulista, 1000',
        'empresa_telefone': '1133332222',
        'empresa_email': 'contato@fornecedor.com',
        'descricao_fatos': 'Produto apresentou defeito após 2 dias de uso.',
        'data_ocorrencia': '2024-02-15',
        'valor_envolvido': '150,90',
    }


@pytest.mark.django_db
def test_reclamacoes_requires_authentication(api_client):
    url = reverse('api_atendimento:api_reclamacoes')

    response = api_client.get(url)
    assert response.status_code == 401

    payload = _build_payload()
    response = api_client.post(url, data=payload)
    assert response.status_code == 401


@pytest.mark.django_db
def test_create_and_retrieve_reclamacao(authenticated_client, monkeypatch):
    monkeypatch.setattr(
        'atendimento.services.WorkflowService.processar_nova_reclamacao',
        lambda reclamacao: {'sucesso': True},
    )

    url = reverse('api_atendimento:api_reclamacoes')
    payload = _build_payload()
    arquivo = SimpleUploadedFile('comprovante.pdf', b'conteudo de teste', content_type='application/pdf')
    payload['anexo_0'] = arquivo

    response = authenticated_client.post(url, data=payload, format='multipart')
    assert response.status_code == 201
    data = response.data

    assert data['numero_protocolo'].startswith('REC-')
    assert data['status'] == 'REGISTRADA'
    assert data['anexos'][0]['descricao'] == 'comprovante.pdf'

    reclamacao_id = data['id']

    list_response = authenticated_client.get(url)
    assert list_response.status_code == 200
    assert list_response.data['count'] >= 1
    assert any(item['numero_protocolo'] == data['numero_protocolo'] for item in list_response.data['results'])

    detail_url = reverse('api_atendimento:api_reclamacao_detalhe', args=[reclamacao_id])
    detail_response = authenticated_client.get(detail_url)
    assert detail_response.status_code == 200
    detail = detail_response.data
    assert detail['id'] == reclamacao_id
    assert detail['historico'][0]['acao'] == 'REGISTRADA'
    assert detail['anexos'][0]['descricao'] == 'comprovante.pdf'


@pytest.mark.django_db
def test_dashboard_endpoint(authenticated_client, user):
    ReclamacaoDenuncia.objects.create(
        consumidor_nome='José da Silva',
        consumidor_cpf='12345678909',
        consumidor_email='jose@example.com',
        consumidor_telefone='11999991111',
        consumidor_endereco='Rua Teste, 123',
        consumidor_cep='04001000',
        consumidor_cidade='São Paulo',
        consumidor_uf='SP',
        empresa_razao_social='Empresa XYZ',
        empresa_cnpj='27865757000102',
        empresa_endereco='Av. Brasil, 200',
        descricao_fatos='Problema na prestação de serviço',
        data_ocorrencia=timezone.now().date(),
        atendente_responsavel=user,
    )

    url = reverse('api_atendimento:api_dashboard_atendimento')
    response = authenticated_client.get(url)
    assert response.status_code == 200
    payload = response.data
    assert 'atendimentos_hoje' in payload
    assert 'reclamas_pendentes' in payload
    assert 'status_reclamacoes' in payload





@pytest.mark.django_db
def test_registro_presencial_cria_atendimento_e_reclamacao(authenticated_client, monkeypatch):
    monkeypatch.setattr(
        'atendimento.services.WorkflowService.processar_nova_reclamacao',
        lambda reclamacao: {'sucesso': True},
    )

    url = reverse('api_atendimento:api_registro_presencial')
    payload = _build_payload()
    payload['tipo_atendimento'] = 'RECLAMACAO'
    payload['observacoes'] = 'Atendimento presencial realizado no balcão.'
    arquivo = SimpleUploadedFile('documento.pdf', b'conteudo de teste', content_type='application/pdf')
    payload['anexo_0'] = arquivo

    response = authenticated_client.post(url, data=payload, format='multipart')
    assert response.status_code == 201
    data = response.data

    assert data['numero_atendimento'].startswith('ATD-')
    assert data['reclamacao']['numero_protocolo'].startswith('REC-')

    atendimento = Atendimento.objects.get(id=data['atendimento_id'])
    assert atendimento.reclamacao_id == data['reclamacao']['id']
    assert atendimento.canal_atendimento == 'BALCAO'

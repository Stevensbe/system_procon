import pytest
from django.urls import reverse
from rest_framework import status

from portal_cidadao.models import DenunciaCidadao
from triagem.models import TriagemDemanda
from ppa.models import ProcedimentoPreAdministrativo, MovimentacaoPPA


@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.api
def test_denuncia_portal_cria_triagem_e_ppa(api_client, user):
    """
    Garante que o envio de uma denúncia via Portal do Cidadão
    cria automaticamente registros de triagem e um PPA vinculado.
    """
    url = reverse("api_portal_cidadao:api_denuncia")
    payload = {
        "empresa_denunciada": "Super Mercado Bom Preço",
        "cnpj_empresa": "12.345.678/0001-99",
        "endereco_empresa": "Av. Principal, 123 - Centro",
        "telefone_empresa": "92999999999",
        "email_empresa": "contato@bompreco.com",
        "descricao_fatos": "Cobrança abusiva identificada pelos consumidores.",
        "data_ocorrencia": "2024-01-15",
        "tipo_infracao": "supermercado",
        "nome_denunciante": "Maria Consumidora",
        "cpf_cnpj": "123.456.789-00",
        "email": "maria@example.com",
        "telefone": "92988887777",
        "denuncia_anonima": False,
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    numero_denuncia = response.data["numero_denuncia"]

    denuncia = DenunciaCidadao.objects.get(numero_denuncia=numero_denuncia)
    triagem = TriagemDemanda.objects.get(denuncia_portal=denuncia)

    assert triagem.ppa is not None, "Triagem deve ser vinculada a um PPA após criação da denúncia"
    assert triagem.status == "convertido_ppa"

    ppa = ProcedimentoPreAdministrativo.objects.get(id=triagem.ppa_id)
    assert ppa.sigla == "SUPERMERCADO"
    assert denuncia.empresa_denunciada in ppa.interessado
    assert denuncia.numero_denuncia in ppa.assunto

    movimentacoes = MovimentacaoPPA.objects.filter(ppa=ppa)
    assert movimentacoes.filter(tipo_movimentacao="criacao").exists()

    assert "Portal do Cidadao" in ppa.observacoes

from datetime import date
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from cip_automatica.models import CIPAutomatica, TipoCIP
from cip_automatica.services import cip_generation
from portal_cidadao.models import ReclamacaoDenuncia


class RespostaEmpresaApiTests(APITestCase):
    def setUp(self):
        self.tipo_cip = TipoCIP.objects.create(
            nome="Financeiro",
            codigo="FIN",
            descricao="Testes de respostas empresariais",
            template_cip="<html></html>",
            prazo_resposta=7,
            prazo_acordo=15,
            valor_minimo=Decimal("100.00"),
            valor_maximo=Decimal("20000.00"),
            setor_responsavel="Financeiro",
        )
        self.reclamacao = ReclamacaoDenuncia.objects.create(
            consumidor_nome="Carlos Teste",
            consumidor_cpf="55566677788",
            consumidor_email="carlos@example.com",
            consumidor_telefone="92900000000",
            consumidor_endereco="Rua Principal, 100",
            consumidor_cep="69000-001",
            consumidor_cidade="Manaus",
            consumidor_uf="AM",
            empresa_razao_social="Empresa Financeira SA",
            empresa_cnpj="98.765.432/0001-00",
            empresa_endereco="Av. Central, 200",
            empresa_email="financeiro@empresa.com",
            empresa_telefone="9232100000",
            descricao_fatos="Descrição detalhada " * 10,
            data_ocorrencia=date.today(),
            valor_envolvido=Decimal("2500.00"),
        )
        self.cip = cip_generation.gerar_cip_automatica(
            reclamacao_id=self.reclamacao.id,
            tipo_cip_id=self.tipo_cip.id,
            valor_indenizacao=Decimal("2500.00"),
            observacoes="CIP de teste",
        )

    def test_create_resposta_empresa(self):
        url = reverse("resposta_empresa:respostaempresa-list")
        payload = {
            "cip_id": str(self.cip.id),
            "texto_resposta": "Aceitamos integralmente as condições propostas.",
            "valor_oferecido": "2500.00",
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["numero_cip"], self.cip.numero_cip)
        self.assertIn(data['status'], ['ACEITA', 'ANALISANDO', 'AGUARDANDO_COMPLEMENTO'])

    def test_relatorio_respostas(self):
        # Gera resposta para constar no relatório
        self.client.post(
            reverse("resposta_empresa:respostaempresa-list"),
            {
                "cip_id": str(self.cip.id),
                "texto_resposta": "Necessitamos de mediação para fechamento de acordo.",
            },
            format="json",
        )

        inicio = timezone.now().date().replace(day=1)
        fim = timezone.now().date()
        url = reverse("resposta_empresa:respostaempresa-relatorio")
        response = self.client.get(
            url,
            {"data_inicio": inicio.isoformat(), "data_fim": fim.isoformat()},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertIn("total_respostas", payload)

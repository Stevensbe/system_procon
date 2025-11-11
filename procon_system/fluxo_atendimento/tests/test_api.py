from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from cip_automatica.models import CIPAutomatica, TipoCIP
from resposta_empresa.services import analise_service, relatorio_resposta_service

User = get_user_model()


class FluxoAtendimentoApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="atendente", password="123456", first_name="Atendente")
        self.client.force_authenticate(self.user)

        self.tipo_cip = TipoCIP.objects.create(
            nome="Padrão Workflow",
            codigo="COMPRAS_VENDAS",
            descricao="Fluxo completo automático",
            template_cip="<html></html>",
            prazo_resposta=5,
            prazo_acordo=10,
            valor_minimo=Decimal("100.00"),
            valor_maximo=Decimal("20000.00"),
            setor_responsavel="Atendimento",
        )
        TipoCIP.objects.get_or_create(
            codigo="GENERICO",
            defaults={
                "nome": "CIP Genérica",
                "descricao": "Fallback para recomendações",
                "template_cip": "<html></html>",
                "prazo_resposta": 5,
                "prazo_acordo": 10,
                "valor_minimo": Decimal("50.00"),
                "valor_maximo": Decimal("50000.00"),
                "setor_responsavel": "Atendimento",
            },
        )

    def _payload_workflow(self, audience=False):
        payload = {
            "consumidor_nome": "Maria da Silva",
            "consumidor_cpf": "12345678901",
            "consumidor_email": "maria@example.com",
            "consumidor_telefone": "92999999999",
            "consumidor_endereco": "Rua Azul, 123",
            "consumidor_cidade": "Manaus",
            "consumidor_uf": "AM",
            "consumidor_cep": "69000-000",
            "empresa_razao_social": "Empresa Boa LTDA",
            "empresa_cnpj": "12.345.678/0001-90",
            "empresa_endereco": "Av. Principal, 456",
            "empresa_cidade": "Manaus",
            "empresa_email": "contato@empresa.com",
            "empresa_telefone": "9233334444",
            "descricao_fatos": "Situação extensa " * 20,
            "tipo_reclamacao": "COMPRAS_VENDAS",
            "modalidade": "DIGITAL",
            "valor_prejuizo": "1500.00",
            "documentos_anexados": ["contrato.pdf"],
        }
        if audience:
            payload.update(
                {
                    "solicita_audiencia": True,
                    "data_audiencia_desejada": (timezone.now() + timedelta(days=7)).isoformat(),
                    "duracao_audiencia": 2,
                    "participantes_consumidor": [{"nome": "Maria da Silva", "email": "maria@example.com"}],
                    "participantes_empresa": [{"nome": "Empresa Boa LTDA", "email": "contato@empresa.com"}],
                }
            )
        return payload

    def test_workflow_sem_audiencia(self):
        url = reverse("fluxo_atendimento:fluxo-list")
        response = self.client.post(url, self._payload_workflow(), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.json())
        data = response.json()
        self.assertEqual(data["status"], "concluido")
        self.assertIn("registro_reclamacao", data["etapas"])
        self.assertIn("geracao_cip", data["etapas"])
        self.assertTrue(CIPAutomatica.objects.exists())

    def test_workflow_com_audiencia(self):
        url = reverse("fluxo_atendimento:fluxo-list")
        response = self.client.post(url, self._payload_workflow(audience=True), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.json())
        data = response.json()
        self.assertIn("agendamento_audiencia", data["etapas"])

    def test_workflow_com_resposta_e_relatorio(self):
        url = reverse("fluxo_atendimento:fluxo-list")
        response = self.client.post(url, self._payload_workflow(), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.json())
        data = response.json()
        self.assertIn("geracao_cip", data["etapas"])

        cip_id = data["etapas"]["geracao_cip"]["cip_id"]
        cip = CIPAutomatica.objects.get(id=cip_id)
        resposta = analise_service.analisar_resposta_recebida(
            cip_id=cip_id,
            texto_resposta="Aceito integralmente a demanda, concordo com todas as condições e pagarei o valor total solicitado imediatamente.",
            valor_oferecido=cip.valor_total,
            usuario_analista=self.user,
        )
        self.assertEqual(resposta.status, "ACEITA")

        inicio = timezone.now() - timedelta(days=1)
        fim = timezone.now() + timedelta(days=1)
        relatorio = relatorio_resposta_service.gerar_relatorio_periodo(inicio, fim)

        self.assertEqual(relatorio["total_respostas"], 1)
        self.assertIn("ACEITA", relatorio["respostas_por_status"])
        self.assertEqual(relatorio["respostas_por_status"]["ACEITA"], 1)
        self.assertIn("ACEITA_TOTALMENTE", relatorio["respostas_por_tipo"])


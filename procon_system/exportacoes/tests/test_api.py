from unittest import mock
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from exportacoes.models import AgendamentoExportacao, ExecucaoExportacao, TipoExportacao

User = get_user_model()


class ExportacoesApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="gestor_export", password="123456")
        self.client.force_authenticate(self.user)

        self.tipo = TipoExportacao.objects.create(
            codigo="REL_MENSAL_PROCON_SP",
            nome_exibicao="Relatório Mensal PROCON-SP",
            descricao="Dados consolidados para o PROCON-SP",
            frequencia_automatica="MENSAL",
            tipos_documentos_incluir=["reclamacoes", "cips"],
            filtros_aplicar={"uf": "AM"},
            campos_exportar=["protocolo", "status"],
            orgao_destino_nome="PROCON-SP",
            formato_arquivo="JSON",
            ativo=True,
            validação_obrigatoria=True,
            enviar_email_notificacao=False,
            criado_por=self.user,
        )

        inicio = timezone.now() - timedelta(days=30)
        fim = timezone.now()

        self.agendamento = AgendamentoExportacao.objects.create(
            tipo_exportacao=self.tipo,
            periodo_de=inicio,
            periodo_ate=fim,
        )

    def test_lista_tipos(self):
        url = reverse("exportacoes:tipoexportacao-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["codigo"], "REL_MENSAL_PROCON_SP")

    @mock.patch("exportacoes.views.exportacao_service.executar_exportacao")
    def test_executar_agendamento(self, mock_executar):
        execucao = ExecucaoExportacao.objects.create(agendamento=self.agendamento, status="CONCLUIDA")
        mock_executar.return_value = execucao

        url = reverse("exportacoes:agendamentoexportacao-executar", args=[self.agendamento.id])
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED, response.data)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["execucao"]["id"], str(execucao.id))
        mock_executar.assert_called_with(self.agendamento, self.user)

    @mock.patch("exportacoes.views.exportacao_service.executar_exportacao")
    def test_executar_agendamento_falha(self, mock_executar):
        mock_executar.side_effect = RuntimeError("Serviço indisponível")
        url = reverse("exportacoes:agendamentoexportacao-executar", args=[self.agendamento.id])

        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertFalse(response.data["success"])
        self.assertIn("Serviço indisponível", response.data["error"])

    def test_requer_autenticacao(self):
        self.client.force_authenticate(user=None)
        url = reverse("exportacoes:agendamentoexportacao-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from government_integration.models import IntegrationConnector, IntegrationSyncRun, IntegrationEvent

User = get_user_model()


class GovernmentIntegrationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="gov_admin", password="senha123")
        self.client.force_authenticate(self.user)

    def _create_connector(self):
        return IntegrationConnector.objects.create(
            nome="Integração TJ",
            slug="tj-integracao",
            orgao_responsavel="Tribunal de Justiça",
            endpoint_base="https://api.tj.gov.br/integracao",
            tipo_autenticacao="API_KEY",
            configuracao_credenciais={"api_key": "123456"},
            criado_por=self.user,
        )

    def test_criar_conector(self):
        url = reverse("government_integration:integration-connector-list")
        payload = {
            "nome": "Integração MP",
            "slug": "mp-integracao",
            "orgao_responsavel": "Ministério Público",
            "endpoint_base": "https://api.mp.gov.br/integracao",
            "tipo_autenticacao": "BASIC",
            "configuracao_credenciais": {"username": "user", "password": "secret"},
            "criado_por": self.user.id,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["slug"], "mp-integracao")

    def test_executar_sync_connector(self):
        connector = self._create_connector()
        url = reverse("government_integration:integration-connector-executar-sync", args=[connector.id])
        payload = {"payload_envio": {"filtro": "ultimos_30_dias"}}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(IntegrationSyncRun.objects.count(), 1)
        execucao = IntegrationSyncRun.objects.first()
        self.assertEqual(execucao.status, "EXECUTANDO")
        self.assertEqual(execucao.responsavel, self.user)

    def test_registrar_evento(self):
        connector = self._create_connector()
        url = reverse("government_integration:integration-event-list")
        payload = {
            "connector": connector.id,
            "tipo_evento": "ATUALIZACAO_PROCESSO",
            "referencia_externa": "PROC-123",
            "payload": {"status": "Atualizado"},
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        evento = IntegrationEvent.objects.first()
        self.assertFalse(evento.processado)

        mark_url = reverse("government_integration:integration-event-marcar-processado", args=[evento.id])
        response_mark = self.client.post(mark_url, {"observacoes": "Processado manualmente"}, format="json")
        self.assertEqual(response_mark.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertTrue(evento.processado)
        self.assertIsNotNone(evento.processado_em)


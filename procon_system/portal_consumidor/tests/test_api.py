from uuid import UUID, uuid4

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from portal_consumidor.models import (
    FeedbackConsumidor,
    NotificacaoConsumidor,
    SessaoConsulta,
    TipoConsulta,
)


@override_settings(PORTAL_API_KEY="portal-test-key")
class PortalConsumidorAPITests(APITestCase):
    def setUp(self):
        self.client.defaults["REMOTE_ADDR"] = "187.20.30.40"
        self.client.defaults["HTTP_USER_AGENT"] = "pytest-agent"
        self.headers = {"HTTP_X_PORTAL_API_KEY": "portal-test-key"}

    def test_cria_sessao_consulta(self):
        url = reverse("portal_consumidor:sessoes-list")
        response = self.client.post(url, {"tipo_consulta": TipoConsulta.CPF}, format="json", **self.headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        data = response.json()
        self.assertIn("token_consulta", data)
        self.assertTrue(SessaoConsulta.objects.filter(id=data["id"]).exists())

    def test_rejeita_sem_api_key(self):
        url = reverse("portal_consumidor:sessoes-list")
        response = self.client.post(url, {"tipo_consulta": TipoConsulta.CPF}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_consulta_documentos_retorna_historico(self):
        # Cria sessão
        create_url = reverse("portal_consumidor:sessoes-list")
        create_response = self.client.post(create_url, {"tipo_consulta": TipoConsulta.PROTOCOLO}, format="json", **self.headers)
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.data)
        sessao_id = create_response.data["id"]
        token = create_response.data["token_consulta"]

        # Executa consulta com sessão válida
        consulta_url = reverse("portal_consumidor:sessoes-consultar", args=[sessao_id])
        payload = {"token": token, "protocolo": "PROTO-0001"}
        response = self.client.post(consulta_url, payload, format="json", **self.headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["resultado"], "NAO_ENCONTRADO")
        historicos_url = reverse("portal_consumidor:sessoes-historicos", args=[sessao_id])
        historicos = self.client.get(f"{historicos_url}?token={token}", **self.headers)
        self.assertEqual(historicos.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(historicos.data), 1)

    def test_lista_notificacoes_filtrando_por_email(self):
        email = f"consumidor-{uuid4().hex[:6]}@example.com"
        notificacao = NotificacaoConsumidor.objects.create(
            consumidor_email=email,
            titulo="Atualização importante",
            mensagem="Detalhes da atualização.",
        )
        url = reverse("portal_consumidor:notificacoes-list")
        response = self.client.get(f"{url}?email={notificacao.consumidor_email}", **self.headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        data = response.json()
        matching = [item for item in data if UUID(item["id"]) == notificacao.id]
        self.assertEqual(len(matching), 1)

    def test_envia_feedback_consumidor(self):
        url = reverse("portal_consumidor:feedbacks-list")
        payload = {
            "consumidor_email": "feedback@example.com",
            "tipo_feedback": "USABILIDADE",
            "nota_geral": 9,
            "sugestoes": "Interface amigável.",
        }
        response = self.client.post(url, payload, format="json", **self.headers)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(FeedbackConsumidor.objects.filter(consumidor_email="feedback@example.com").exists())

    def test_lista_feedbacks(self):
        FeedbackConsumidor.objects.create(
            consumidor_email="lista@example.com",
            tipo_feedback="CONTEUDO",
            nota_geral=7,
            sugestoes="Conteúdo útil.",
        )
        url = reverse("portal_consumidor:feedbacks-list")
        response = self.client.get(url, **self.headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertGreaterEqual(len(response.data), 1)

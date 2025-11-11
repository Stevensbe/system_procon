from unittest import mock

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apis_externas.models import EnvioDocumentoExterno, OrgaoExterno
from apis_externas.services import ExternalAPIError

User = get_user_model()


class ApisExternasApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="coordenador", password="123456")
        self.client.force_authenticate(self.user)

        self.orgao = OrgaoExterno.objects.create(
            nome="Ministério Público Estadual",
            codigo_identificacao="MP_AM",
            tipo_orgao="MINISTERIO_PUBLICO",
            status="ATIVO",
            possui_api_integrada=True,
            api_endpoint_base="https://integracao.exemplo.gov/api",
            timeout_segundos=5,
            tipos_documentos_enviados=["RECLAMACAO_INICIAL"],
        )

        self.envio = EnvioDocumentoExterno.objects.create(
            orgao_destino=self.orgao,
            tipo_documento="RECLAMACAO_INICIAL",
            protocolo_interno="PROC-123",
            dados_enviados={"teste": True},
            payload_completo="{}",
        )

    def test_lista_orgaos(self):
        url = reverse("apis_externas:orgaoexterno-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["codigo_identificacao"], "MP_AM")

    @mock.patch("apis_externas.views.ping_external_api")
    def test_testar_conexao_atualiza_timestamp(self, mock_ping):
        mock_ping.return_value = {"status_code": 200, "payload": {"ok": True}, "url": "https://ok"}
        url = reverse("apis_externas:orgaoexterno-testar-conexao", args=[self.orgao.id])

        response = self.client.post(url, {"path": "health"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.orgao.refresh_from_db()
        self.assertIsNotNone(self.orgao.data_ultimo_sync)
        mock_ping.assert_called_with(
            self.orgao.api_endpoint_base,
            path="health",
            headers={},
            timeout=self.orgao.timeout_segundos,
        )
        self.assertTrue(response.data["success"])

    @mock.patch("apis_externas.views.enviar_documento_externo")
    def test_simular_envio_atualiza_status(self, mock_enviar):
        mock_enviar.return_value = {
            "status_code": 201,
            "payload": {"external_id": "ABC"},
            "headers": {"X-Request-ID": "123"},
            "request_payload": {"teste": True},
            "request_payload_raw": '{"teste": true}',
            "url": "https://integracao.exemplo.gov/api/envios",
        }

        url = reverse("apis_externas:enviodocumentoexterno-simular-envio", args=[self.envio.id])
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.envio.refresh_from_db()
        self.assertEqual(self.envio.status_envio, "ENVIADO")
        self.assertEqual(self.envio.codigo_resposta_http, 201)
        self.assertIn("external_id", self.envio.resposta_orcao_externo)
        mock_enviar.assert_called_once()

    @mock.patch("apis_externas.views.enviar_documento_externo")
    def test_simular_envio_falha(self, mock_enviar):
        mock_enviar.side_effect = ExternalAPIError("fora do ar")
        url = reverse("apis_externas:enviodocumentoexterno-simular-envio", args=[self.envio.id])

        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.envio.refresh_from_db()
        self.assertEqual(self.envio.status_envio, "ERRO_ENVIO")
        self.assertIn("fora do ar", self.envio.erro_envio)

    def test_requer_autenticacao(self):
        self.client.force_authenticate(user=None)
        url = reverse("apis_externas:orgaoexterno-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


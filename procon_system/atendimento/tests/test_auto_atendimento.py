from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from atendimento.models import BalcaoAtendimento, SenhaAtendimento


class AutoAtendimentoTests(APITestCase):
    def setUp(self):
        self.balcao = BalcaoAtendimento.objects.create(
            nome="Guichê 1",
            codigo="G1",
            descricao="Atendimento geral",
            localizacao="Térreo",
            ativo=True,
            ordem_prioridade=1,
            capacidade_simultanea=1,
        )

    def test_listar_balcoes_publicos(self):
        url = reverse("atendimento:autoatendimento-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.balcao.id)

    def test_retirar_senha_auto_atendimento(self):
        url = reverse("atendimento:autoatendimento-retirar", args=[self.balcao.id])
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        dados = response.json()
        self.assertIn("senha", dados)
        self.assertIn("balcao", dados)
        self.assertEqual(dados["balcao"]["id"], self.balcao.id)
        self.assertEqual(dados["senha"]["posicao"], 1)
        self.assertTrue(
            SenhaAtendimento.objects.filter(balcao=self.balcao, identificador=dados["senha"]["identificador"]).exists()
        )

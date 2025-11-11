from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date

from legislacao.models import Lei, Artigo


class LegislacaoApiTests(APITestCase):
    def setUp(self):
        self.lei = Lei.objects.create(
            numero="Lei 1/2025",
            titulo="Proteção ao Consumidor",
            publicada_em=date(2025, 1, 10),
            link="https://example.gov/lei-1-2025",
        )
        Artigo.objects.create(
            lei=self.lei,
            numero_artigo="1º",
            texto="Disposições gerais",
        )

    def test_list_leis_returns_embedded_artigos(self):
        url = reverse("legislacao:lei-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        items = payload if isinstance(payload, list) else payload.get("results", [])
        self.assertGreaterEqual(len(items), 1)
        self.assertEqual(items[0]["numero"], "Lei 1/2025")
        self.assertEqual(len(items[0]["artigos"]), 1)

    def test_create_artigo_via_api(self):
        url = reverse("legislacao:artigo-list")
        data = {
            "lei": self.lei.id,
            "numero_artigo": "2º",
            "texto": "Novas obrigações aos fornecedores",
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Artigo.objects.filter(lei=self.lei).count(), 2)

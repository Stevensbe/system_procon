from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from recursos_defesas.models import TipoDefesa


class TipoDefesaApiTests(APITestCase):
    def test_create_tipo_defesa(self):
        url = '/recursos-defesas/api/tipos/'
        payload = {
            'nome': 'Defesa Prévia',
            'descricao': 'Defesa inicial apresentada pelo autuado',
            'prazo_dias': 15,
            'requer_documentos': True,
            'ativo': True,
        }
        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TipoDefesa.objects.count(), 1)
        self.assertEqual(TipoDefesa.objects.first().nome, 'Defesa Prévia')


class DefesaAdministrativaApiTests(APITestCase):
    def test_list_returns_empty_payload(self):
        url = '/recursos-defesas/api/defesas/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        if isinstance(body, dict) and 'results' in body:
            self.assertEqual(body['results'], [])
        else:
            self.assertEqual(body, [])

    def test_stats_endpoint_has_expected_structure(self):
        url = '/recursos-defesas/api/defesas/stats/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn('total', body)
        self.assertIn('por_status', body)
        self.assertIn('atrasadas', body)



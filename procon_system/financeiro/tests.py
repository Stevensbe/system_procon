from django.test import TestCase

from rest_framework.test import APIRequestFactory

from .models import Financeiro
from .views import (
    dashboard_api_view,
    arrecadacao_mensal_api_view,
    empresas_list_api_view,
)


class FinanceiroModelTest(TestCase):
    def test_str(self):
        financeiro = Financeiro.objects.create(
            descricao="Pagamento de fornecedor",
            valor=1500.00,
            tipo="saida"
        )
        self.assertEqual(
            str(financeiro),
            "Pagamento de fornecedor - 1500.0 (saida)"
        )


class FinanceiroAPITests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_dashboard_api_returns_expected_schema(self):
        request = self.factory.get('/financeiro/dashboard/')
        response = dashboard_api_view(request)
        self.assertEqual(response.status_code, 200)
        payload = response.data
        self.assertIn('arrecadacao_mes', payload)
        self.assertIn('total_pendente', payload)
        self.assertIn('periodo', payload)
        self.assertIn('inicio_mes', payload['periodo'])
        self.assertIn('fim_mes', payload['periodo'])

    def test_arrecadacao_mensal_api_returns_twleve_periods(self):
        request = self.factory.get('/financeiro/arrecadacao-mensal/')
        response = arrecadacao_mensal_api_view(request)
        self.assertEqual(response.status_code, 200)
        payload = response.data
        self.assertIn('dados', payload)
        self.assertEqual(len(payload['dados']), 12)
        self.assertIn('meta', payload)
        self.assertEqual(payload['meta']['total_periodos'], 12)

    def test_empresas_list_api_returns_total(self):
        request = self.factory.get('/financeiro/empresas/')
        response = empresas_list_api_view(request)
        self.assertEqual(response.status_code, 200)
        payload = response.data
        self.assertIn('empresas', payload)
        self.assertIn('total', payload)
        self.assertEqual(payload['total'], len(payload['empresas']))

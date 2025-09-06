from django.test import TestCase
from .models import Financeiro

class FinanceiroModelTest(TestCase):
    def test_str(self):
        financeiro = Financeiro.objects.create(
            descricao="Pagamento de fornecedor",
            valor=1500.00,
            tipo="saida"
        )
        self.assertEqual(
            str(financeiro),
            "Pagamento de fornecedor - 1500.00 (saida)"
        )

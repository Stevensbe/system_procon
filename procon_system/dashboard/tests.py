from django.test import TestCase
from .models import Dashboard

class DashboardModelTest(TestCase):
    def test_str(self):
        dashboard = Dashboard.objects.create(
            titulo="Painel de Teste",
            descricao="Descrição do painel"
        )
        self.assertEqual(str(dashboard), "Painel de Teste")

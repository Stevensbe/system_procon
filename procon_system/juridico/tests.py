from django.test import TestCase
from .models import ProcessoJuridico

class ProcessoJuridicoModelTest(TestCase):
    def test_str(self):
        processo = ProcessoJuridico.objects.create(
            numero="2025-001",
            parte="João da Silva"
        )
        self.assertEqual(str(processo), "2025-001 – João da Silva")

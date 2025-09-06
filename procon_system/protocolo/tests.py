from django.test import TestCase
from .models import Protocolo

class ProtocoloModelTest(TestCase):
    def test_str(self):
        protocolo = Protocolo.objects.create(
            numero="2025-001",
            assunto="Teste de Protocolo"
        )
        self.assertEqual(str(protocolo), "2025-001 – Teste de Protocolo")

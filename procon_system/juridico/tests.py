from django.test import TestCase
from django.db.models.signals import post_save

from caixa_entrada.signals import criar_documento_caixa_entrada_processo_juridico
from .models import ProcessoJuridico


class ProcessoJuridicoModelTest(TestCase):
    def setUp(self):
        post_save.disconnect(
            criar_documento_caixa_entrada_processo_juridico,
            sender=ProcessoJuridico,
        )

    def tearDown(self):
        post_save.connect(
            criar_documento_caixa_entrada_processo_juridico,
            sender=ProcessoJuridico,
        )

    def test_str(self):
        processo = ProcessoJuridico.objects.create(
            numero="2025-001",
            parte="João da Silva",
            assunto="Teste",
            descricao="Descrição",
        )
        self.assertEqual(str(processo), "2025-001 - João da Silva")

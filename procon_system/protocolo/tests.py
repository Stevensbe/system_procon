from django.contrib.auth.models import User
from django.test import TestCase

from .models import Protocolo, TipoProtocolo, StatusProtocolo


class ProtocoloModelTest(TestCase):
    def setUp(self):
        self.tipo = TipoProtocolo.objects.create(
            nome="Denúncia",
            tipo="DENUNCIA",
            prazo_padrao=15,
        )
        self.status = StatusProtocolo.objects.create(
            nome="Aberto",
            ordem=1,
        )
        self.usuario = User.objects.create_user(
            username="protocolo_teste",
            password="teste123",
        )

    def test_str(self):
        protocolo = Protocolo.objects.create(
            numero="2025-001",
            assunto="Teste de Protocolo",
            tipo_protocolo=self.tipo,
            status=self.status,
            criado_por=self.usuario,
        )
        texto = str(protocolo)
        self.assertIn("2025-001", texto)
        self.assertIn("Teste de Protocolo", texto)

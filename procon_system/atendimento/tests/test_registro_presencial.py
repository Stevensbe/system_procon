import tempfile
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile

from portal_cidadao.models import ReclamacaoDenuncia, AnexoReclamacao
from atendimento.models import Atendimento


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class RegistroPresencialAPITests(APITestCase):
    def setUp(self):
        self.usuario = User.objects.create_user(username='agente', password='123456')
        self.client.force_authenticate(self.usuario)
        self.url = reverse('atendimento:api_registro_presencial')
        self.default_payload = {
            'consumidor_nome': 'Fulano Teste',
            'consumidor_cpf': '39053344705',
            'consumidor_email': 'fulano@example.com',
            'consumidor_endereco': 'Rua das Flores, 123',
            'consumidor_cep': '69000000',
            'consumidor_cidade': 'Manaus',
            'consumidor_uf': 'AM',
            'empresa_razao_social': 'Empresa Exemplo LTDA',
            'empresa_cnpj': '19131243000197',
            'empresa_endereco': 'Av Principal, 456',
            'descricao_fatos': 'Produto entregue com defeito',
            'data_ocorrencia': '2025-10-10',
            'consentimento_lgpd': 'true',
            'valor_envolvido': '1.234,56',
        }

    def _mock_config(self, limite_mb=10, prazo_resposta_dias=10):
        config_stub = SimpleNamespace(
            tamanho_maximo_documentos_mb=limite_mb,
            prazo_resposta_dias=prazo_resposta_dias,
        )
        return patch('atendimento.views.ConfiguracaoAtendimento.get_config', return_value=config_stub)

    def test_registro_presencial_cria_reclamacao_e_atendimento(self):
        arquivo = SimpleUploadedFile('comprovante.pdf', b'conteudo teste', content_type='application/pdf')
        data = {**self.default_payload, 'anexo_0': arquivo}

        with self._mock_config():
            resposta = self.client.post(self.url, data, format='multipart')

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

        atendimento = Atendimento.objects.get()
        reclamacao = ReclamacaoDenuncia.objects.get()

        self.assertTrue(atendimento.consentimento_lgpd)
        self.assertEqual(atendimento.reclamacao_id, reclamacao.id)
        self.assertEqual(atendimento.atendente, self.usuario)
        self.assertEqual(reclamacao.numero_protocolo[:3], 'REC')

        anexos = AnexoReclamacao.objects.filter(reclamacao=reclamacao)
        self.assertEqual(anexos.count(), 1)
        self.assertEqual(resposta.data['reclamacao']['id'], reclamacao.id)
        self.assertIn('numero_atendimento', resposta.data)
        self.assertEqual(resposta.data['tipo_atendimento'], 'RECLAMACAO')

    def test_registro_presencial_recusa_sem_consentimento(self):
        data = {**self.default_payload, 'consentimento_lgpd': 'false'}

        with self._mock_config():
            resposta = self.client.post(self.url, data, format='multipart')

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('erro', resposta.data)
        self.assertEqual(Atendimento.objects.count(), 0)
        self.assertEqual(ReclamacaoDenuncia.objects.count(), 0)

    def test_registro_presencial_rejeita_anexo_maior_que_limite(self):
        arquivo_grande = SimpleUploadedFile('video.mp4', b'a' * (2 * 1024 * 1024), content_type='video/mp4')
        data = {**self.default_payload, 'anexo_0': arquivo_grande}

        with self._mock_config(limite_mb=1):
            resposta = self.client.post(self.url, data, format='multipart')

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('anexos', resposta.data)
        self.assertEqual(ReclamacaoDenuncia.objects.count(), 0)
        self.assertEqual(AnexoReclamacao.objects.count(), 0)

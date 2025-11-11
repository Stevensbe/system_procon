import tempfile
from datetime import date

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate

from atendimento.models import Atendimento
from atendimento.services import AtendimentoService
from atendimento.views import api_relatorios_detalhados
from portal_cidadao.models import ReclamacaoDenuncia, AnexoReclamacao


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class AtendimentoLGPDServiceTests(TestCase):
    def setUp(self):
        self.usuario = User.objects.create_user(username='agente', password='123456')

    def _criar_reclamacao(self):
        return ReclamacaoDenuncia.objects.create(
            tipo_demanda='RECLAMACAO',
            consumidor_nome='Consumidor Teste',
            consumidor_cpf='12345678901',
            consumidor_email='teste@example.com',
            consumidor_telefone='92999999999',
            consumidor_endereco='Rua Teste, 123',
            consumidor_cep='69000000',
            consumidor_cidade='Manaus',
            consumidor_uf='AM',
            empresa_razao_social='Empresa Teste',
            empresa_cnpj='12345678000199',
            empresa_endereco='Av Principal, 456',
            descricao_fatos='Produto entregue com defeito.',
            data_ocorrencia=date.today(),
        )

    def test_confirmar_remocao_dados_limpa_anexos(self):
        reclamacao = self._criar_reclamacao()
        atendimento = Atendimento.objects.create(
            atendente=self.usuario,
            consumidor_nome='Fulano da Silva',
            consumidor_cpf='98765432100',
            consumidor_telefone='92911112222',
            consumidor_email='fulano@example.com',
            tipo_atendimento='RECLAMACAO',
            canal_atendimento='BALCAO',
            observacoes='Cliente solicitou cancelamento.',
            consentimento_lgpd=True,
            consentimento_origem='GUICHE',
            consentimento_registrado_em=timezone.now(),
            reclamacao=reclamacao,
        )

        arquivo = SimpleUploadedFile('documento.pdf', b'conteudo de teste', content_type='application/pdf')
        AnexoReclamacao.objects.create(
            reclamacao=reclamacao,
            arquivo=arquivo,
            descricao='Documento de teste',
            tipo_documento='OUTROS',
        )

        AtendimentoService.solicitar_remocao(atendimento.id, observacoes='Pedido formal do consumidor')
        AtendimentoService.confirmar_remocao(atendimento.id)

        atendimento.refresh_from_db()
        anexo = reclamacao.anexos.first()

        self.assertEqual(atendimento.consumidor_nome, 'Consumidor Removido')
        self.assertEqual(atendimento.consumidor_cpf, 'REMOVIDO')
        self.assertIsNotNone(atendimento.dados_removidos_em)
        self.assertEqual(atendimento.status, 'FINALIZADO')
        self.assertIsNotNone(anexo.removido_em)
        self.assertFalse(bool(anexo.arquivo))


class AtendimentoRelatoriosLGPDTests(APITestCase):
    def setUp(self):
        self.usuario = User.objects.create_user(username='analista', password='123456')
        self.client.force_authenticate(self.usuario)

        Atendimento.objects.create(
            atendente=self.usuario,
            consumidor_nome='Teste 1',
            consumidor_cpf='12312312312',
            tipo_atendimento='ORIENTACAO',
            canal_atendimento='BALCAO',
            consentimento_lgpd=True,
            consentimento_origem='GUICHE',
        )

        Atendimento.objects.create(
            atendente=self.usuario,
            consumidor_nome='Teste 2',
            consumidor_cpf='32132132132',
            tipo_atendimento='RECLAMACAO',
            canal_atendimento='BALCAO',
            consentimento_lgpd=False,
            consentimento_origem='GUICHE',
            dados_remocao_solicitada_em=timezone.now(),
        )

    def test_relatorio_detalhado_retorna_metrica_lgpd(self):
        factory = APIRequestFactory()
        request = factory.get('/atendimento/api/relatorios-detalhados/')
        force_authenticate(request, user=self.usuario)
        resposta = api_relatorios_detalhados(request)

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        payload = resposta.data

        self.assertIn('lgpd', payload)
        self.assertEqual(payload['lgpd']['consentimentos_confirmados'], 1)
        self.assertEqual(payload['lgpd']['consentimentos_pendentes'], 1)
        self.assertIn('anexos', payload)
        self.assertIn('ultima_atualizacao', payload)

    @override_settings(MEDIA_ROOT=tempfile.gettempdir())
    def test_api_remocao_dados_fluxo_completo(self):
        # Criar reclamacao com anexo
        reclamacao = ReclamacaoDenuncia.objects.create(
            tipo_demanda='RECLAMACAO',
            consumidor_nome='Cons Teste',
            consumidor_cpf='12345678901',
            consumidor_email='cons@example.com',
            consumidor_telefone='92999999999',
            consumidor_endereco='Rua X',
            consumidor_cep='69000000',
            consumidor_cidade='Manaus',
            consumidor_uf='AM',
            empresa_razao_social='Empresa X',
            empresa_cnpj='12345678000199',
            empresa_endereco='Av Y',
            descricao_fatos='Produto com defeito.',
            data_ocorrencia=timezone.now().date(),
        )
        anexo = AnexoReclamacao.objects.create(
            reclamacao=reclamacao,
            arquivo=SimpleUploadedFile('documento.pdf', b'conteudo', content_type='application/pdf'),
            descricao='Documento teste',
            tipo_documento='OUTROS',
        )
        atendimento = Atendimento.objects.create(
            atendente=self.usuario,
            consumidor_nome='Cliente X',
            consumidor_cpf='98765432100',
            consumidor_email='cliente@example.com',
            tipo_atendimento='RECLAMACAO',
            canal_atendimento='BALCAO',
            consentimento_lgpd=True,
            consentimento_origem='GUICHE',
            consentimento_registrado_em=timezone.now(),
            reclamacao=reclamacao,
        )

        self.client.force_authenticate(user=self.usuario)

        solicitar_url = reverse('atendimento:api_solicitar_remocao_dados', args=[atendimento.id])
        resposta = self.client.post(solicitar_url, {'observacoes': 'Pedido formal.'}, format='json')
        self.assertEqual(resposta.status_code, status.HTTP_202_ACCEPTED)

        atendimento.refresh_from_db()
        self.assertIsNotNone(atendimento.dados_remocao_solicitada_em)
        self.assertEqual(atendimento.dados_remocao_observacoes, 'Pedido formal.')

        confirmar_url = reverse('atendimento:api_confirmar_remocao_dados', args=[atendimento.id])
        resposta = self.client.post(confirmar_url)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        atendimento.refresh_from_db()
        self.assertIsNotNone(atendimento.dados_removidos_em)
        self.assertEqual(atendimento.status, 'FINALIZADO')
        reclamacao.refresh_from_db()
        self.assertEqual(reclamacao.consumidor_nome, 'Consumidor Removido')
        anexo.refresh_from_db()
        self.assertIsNotNone(anexo.removido_em)
        self.assertFalse(bool(anexo.arquivo))




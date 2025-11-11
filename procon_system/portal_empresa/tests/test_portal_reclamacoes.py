import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from portal_cidadao.models import ReclamacaoDenuncia
from portal_empresa.api_views import ReclamacaoEmpresaViewSet
from portal_empresa.models import EmpresaAutorizada, UsuarioEmpresaAutorizado, RespostaEmpresaPortal

User = get_user_model()


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class PortalEmpresaReclamacoesAPITests(APITestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.usuario = User.objects.create_user(username='empresa_user', password='123456', email='empresa@example.com')
        self.empresa = EmpresaAutorizada.objects.create(
            razao_social='Empresa Portal LTDA',
            nome_fantasia='Empresa Portal',
            cnpj='12.345.678/0001-90',
            email_principal='contato@empresa.com',
            responsavel_legal='Fulano',
            endereco_completo='Rua Principal, 100',
            cidade='Manaus',
            estado='AM',
            cep='69000-000',
            status='ATIVA',
        )
        UsuarioEmpresaAutorizado.objects.create(
            empresa=self.empresa,
            usuario=self.usuario,
            pode_responder_cip=True,
        )

        self.reclamacao = ReclamacaoDenuncia.objects.create(
            numero_protocolo='ATD-20251016-0001',
            tipo_demanda='RECLAMACAO',
            consumidor_nome='Consumidor Teste',
            consumidor_cpf='12345678901',
            consumidor_email='consumidor@example.com',
            consumidor_telefone='92999990000',
            consumidor_endereco='Rua X',
            consumidor_cep='69000000',
            consumidor_cidade='Manaus',
            consumidor_uf='AM',
            empresa_razao_social='Empresa Portal LTDA',
            empresa_cnpj='12345678000190',
            empresa_email='atendimento@empresa.com',
            empresa_telefone='92999990001',
            empresa_endereco='Rua Empresa, 500',
            descricao_fatos='Produto apresentou defeito.',
            data_ocorrencia='2025-10-10',
        )

    def test_listar_reclamacoes(self):
        url = reverse('portal_empresa:portal-empresa-reclamacoes-list')
        request = self.factory.get(url)
        force_authenticate(request, user=self.usuario)
        response = ReclamacaoEmpresaViewSet.as_view({'get': 'list'})(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        itens = response.data.get('results') if isinstance(response.data, dict) else response.data
        self.assertTrue(any(item['id'] == self.reclamacao.id for item in itens))

    def test_consultar_detalhe(self):
        url = reverse('portal_empresa:portal-empresa-reclamacoes-detail', args=[self.reclamacao.id])
        request = self.factory.get(url)
        force_authenticate(request, user=self.usuario)
        response = ReclamacaoEmpresaViewSet.as_view({'get': 'retrieve'})(request, pk=self.reclamacao.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['numero_protocolo'], 'ATD-20251016-0001')

    def test_enviar_resposta(self):
        url = reverse('portal_empresa:portal-empresa-reclamacoes-respostas', args=[self.reclamacao.id])
        arquivo = SimpleUploadedFile('comprovante.pdf', b'conteudo de teste', content_type='application/pdf')
        request = self.factory.post(
            url,
            {
                'tipo_documento': 'DEFESA_CIP',
                'titulo': 'Resposta Formal',
                'conteudo': 'Detalhamos nossa posicao.',
            },
            format='multipart',
        )
        request.FILES['anexos'] = arquivo
        force_authenticate(request, user=self.usuario)
        response = ReclamacaoEmpresaViewSet.as_view({'post': 'respostas'})(request, pk=self.reclamacao.id)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.reclamacao.refresh_from_db()
        self.assertEqual(self.reclamacao.status, 'em_analise')
        self.assertTrue(RespostaEmpresaPortal.objects.filter(reclamacao_relacionada=self.reclamacao).exists())

    def test_bloqueia_usuario_sem_vinculo(self):
        user = User.objects.create_user(username='visitante', password='123456')
        url = reverse('portal_empresa:portal-empresa-reclamacoes-list')
        request = self.factory.get(url)
        force_authenticate(request, user=user)
        response = ReclamacaoEmpresaViewSet.as_view({'get': 'list'})(request)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

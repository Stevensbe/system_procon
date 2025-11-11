from uuid import uuid4

from django.test import override_settings
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from portal_empresa.models import (
    EmpresaAutorizada,
    TokenEmpresa,
    UsuarioEmpresaAutorizado,
    RespostaEmpresaPortal,
    SolicitacaoCadastroEmpresa,
    HistoricoEmpresaPortal,
)
from portal_cidadao.models import ReclamacaoDenuncia
from django.contrib.auth import get_user_model

User = get_user_model()


@override_settings(PORTAL_EMPRESA_API_KEY="portal-empresa-test-key")
class PortalEmpresaAPITests(APITestCase):
    def setUp(self):
        self.client.defaults["HTTP_X_PORTAL_EMPRESA_KEY"] = "portal-empresa-test-key"
        self.empresa = EmpresaAutorizada.objects.create(
            razao_social="Empresa Teste LTDA",
            nome_fantasia="Empresa Teste",
            cnpj="12.345.678/0001-99",
            email_principal="contato@empresa.com",
            responsavel_legal="Maria Empresaria",
            endereco_completo="Rua Principal, 100",
            cidade="São Paulo",
            estado="SP",
            cep="01001-000",
            api_key="chave-api-teste",
        )
        self.usuario = User.objects.create_user(
            username="empresario", email="empresario@empresa.com", password="123456"
        )
        UsuarioEmpresaAutorizado.objects.create(
            empresa=self.empresa, usuario=self.usuario, nivel_permissao="ADMIN"
        )
        TokenEmpresa.objects.create(
            empresa=self.empresa,
            usuario_criador=self.usuario,
            token="tokentest",
            refresh_token="refresh",
            data_expiracao=timezone.now() + timezone.timedelta(days=30),
        )

    def test_lista_empresas_autorizadas(self):
        url = reverse("portal_empresa:empresas-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        if isinstance(data, dict) and 'results' in data:
            data = data['results']
        self.assertTrue(any(item['id'] == self.empresa.id for item in data))

    def test_lista_usuarios_da_empresa(self):
        url = reverse("portal_empresa:empresas-usuarios", args=[self.empresa.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        if isinstance(data, dict) and 'results' in data:
            data = data['results']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["usuario_email"], "empresario@empresa.com")

    def test_create_resposta_empresa_via_endpoint(self):
        url = reverse("portal_empresa:respostas-enviar")
        payload = {
            "empresa": str(self.empresa.id),
            "usuario_enviador": self.usuario.id,
            "tipo_documento": "DEFESA_CIP",
            "titulo": "Resposta Formal",
            "conteudo": "Apresentamos nossa defesa.",
            "anexos": [],
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(
            RespostaEmpresaPortal.objects.filter(
                titulo_resposta="Resposta Formal", empresa=self.empresa
            ).exists()
        )

    def test_engajamento_resumo_endpoint(self):
        token = TokenEmpresa.objects.first()
        token.data_expiracao = timezone.now() + timezone.timedelta(days=5)
        token.save(update_fields=['data_expiracao'])

        agora = timezone.now()
        reclamacao = ReclamacaoDenuncia.objects.create(
            consumidor_nome='Joao Consumidor',
            consumidor_cpf='123.456.789-10',
            consumidor_email='joao@example.com',
            consumidor_telefone='(11)90000-0000',
            consumidor_endereco='Rua A, 123',
            consumidor_cep='01000-000',
            consumidor_cidade='Sao Paulo',
            consumidor_uf='SP',
            empresa_razao_social=self.empresa.razao_social,
            empresa_cnpj=self.empresa.cnpj,
            empresa_endereco='Rua Empresa, 100',
            descricao_fatos='Produto com defeito',
            data_ocorrencia=agora.date(),
            status='NOTIFICADA',
            notificacao_enviada=True,
            data_notificacao=agora - timezone.timedelta(hours=12),
            prazo_resposta=agora + timezone.timedelta(days=5),
        )

        RespostaEmpresaPortal.objects.create(
            empresa=self.empresa,
            usuario_enviador=self.usuario,
            token_usado=token,
            reclamacao_relacionada=reclamacao,
            tipo_documento='DEFESA_CIP',
            titulo_resposta='Resposta detalhada',
            conteudo_resposta='Informacoes sobre a resolucao do caso.',
            status='ENVIADA',
            data_envio=agora - timezone.timedelta(hours=6),
        )

        url = reverse('portal_empresa:engajamento-resumo')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.json())
        data = response.json()

        self.assertEqual(data['empresas_monitoradas'], 1)
        self.assertEqual(data['reclamacoes_total'], 1)
        self.assertEqual(data['reclamacoes_pendentes'], 0)
        self.assertEqual(data['respostas_ultimos_30_dias'], 1)
        self.assertAlmostEqual(data['taxa_resposta_percentual'], 100.0)
        self.assertIsNotNone(data['tempo_medio_resposta_horas'])
        self.assertEqual(data['tokens_ativos'], 1)
        self.assertEqual(data['tokens_expirando_7_dias'], 1)

    def test_tokens_expirados_sao_desativados(self):
        expirado = TokenEmpresa.objects.create(
            empresa=self.empresa,
            usuario_criador=self.usuario,
            token='tokexp',
            refresh_token='refresh-exp',
            data_expiracao=timezone.now() - timezone.timedelta(hours=1),
        )

        url = reverse('portal_empresa:tokens-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expirado.refresh_from_db()
        self.assertFalse(expirado.ativo)
        self.assertIsNotNone(expirado.revogado_em)
        self.assertIn('expirado automaticamente', expirado.motivo_revocacao.lower())
        self.assertTrue(
            HistoricoEmpresaPortal.objects.filter(empresa=self.empresa, tipo_acao='TOKEN_EXPIRED').exists()
        )

    def test_bloqueia_sem_chave(self):
        url = reverse("portal_empresa:empresas-list")
        self.client.defaults.pop("HTTP_X_PORTAL_EMPRESA_KEY", None)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.get(url, HTTP_X_PORTAL_EMPRESA_KEY="chave-invalida")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SolicitacaoCadastroEmpresaAPITests(APITestCase):
    def setUp(self):
        self.url = reverse("portal_empresa:solicitacaocadastroempresa-list")
        self.admin = User.objects.create_user(username="ti_admin", password="123456", is_staff=True)

    def _payload(self):
        return {
            "razao_social": "Empresa Nova LTDA",
            "nome_fantasia": "Empresa Nova",
            "cnpj": "23.456.789/0001-10",
            "email_contato": "contato@novaltda.com",
            "telefone_contato": "(11) 4002-8922",
            "responsavel_legal": "João Responsável",
            "cargo_responsavel": "Diretor",
            "endereco_completo": "Rua Alfa, 100",
            "cidade": "Manaus",
            "estado": "AM",
            "cep": "69000-000",
            "observacoes": "Solicitação enviada via portal",
        }

    def test_criar_solicitacao(self):
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        solicitacao = SolicitacaoCadastroEmpresa.objects.get()
        self.assertEqual(solicitacao.status, "PENDENTE")

    def test_aprovar_solicitacao_gera_empresa_e_token(self):
        solicitacao = SolicitacaoCadastroEmpresa.objects.create(**self._payload())
        aprovar_url = reverse("portal_empresa:solicitacaocadastroempresa-aprovar", args=[solicitacao.id])
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(aprovar_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn("email_enviado", response.data)
        self.assertTrue(response.data["email_enviado"])
        solicitacao.refresh_from_db()
        self.assertEqual(solicitacao.status, "APROVADA")
        self.assertTrue(EmpresaAutorizada.objects.filter(cnpj=solicitacao.cnpj).exists())
        self.assertTrue(TokenEmpresa.objects.filter(empresa__cnpj=solicitacao.cnpj).exists())

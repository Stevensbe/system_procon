from datetime import timedelta

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from notificacoes.models import Notificacao
from portal_cidadao.models import ReclamacaoDenuncia


class DashboardAlertasPrazoTests(APITestCase):
    def setUp(self):
        self.url = reverse('atendimento:api_dashboard_atendimento')
        self.responsavel = User.objects.create_user(
            username='responsavel',
            password='123456',
            email='responsavel@example.com',
            is_staff=True,
        )
        self.client.force_authenticate(self.responsavel)

    def _criar_reclamacao(self, **kwargs):
        defaults = {
            'tipo_demanda': 'RECLAMACAO',
            'consumidor_nome': 'Consumidor Teste',
            'consumidor_cpf': '12345678901',
            'consumidor_email': 'consumidor@example.com',
            'consumidor_telefone': '11999999999',
            'consumidor_endereco': 'Rua X',
            'consumidor_cep': '01001000',
            'consumidor_cidade': 'São Paulo',
            'consumidor_uf': 'SP',
            'empresa_razao_social': 'Empresa Y',
            'empresa_cnpj': '12345678000199',
            'empresa_endereco': 'Rua Y',
            'descricao_fatos': 'Produto com defeito.',
            'data_ocorrencia': timezone.now().date(),
        }
        defaults.update(kwargs)
        return ReclamacaoDenuncia.objects.create(**defaults)

    def test_alerta_prazo_resposta_proximo_cria_notificacao(self):
        prazo = timezone.now() + timedelta(hours=8)
        reclamacao = self._criar_reclamacao(
            status='AGUARDANDO_RESPOSTA',
            notificacao_enviada=True,
            prazo_resposta=prazo,
            atendente_responsavel=self.responsavel,
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        alertas = response.data.get('alertas_prazo', [])
        self.assertTrue(
            any(
                alerta['numero_protocolo'] == reclamacao.numero_protocolo
                and alerta['tipo_alerta'] == 'resposta'
                for alerta in alertas
            )
        )

        notificacao_existe = Notificacao.objects.filter(
            tipo__codigo='ATENDIMENTO_PRAZO_RESPOSTA_PROXIMO',
            content_type__model='reclamacaodenuncia',
            object_id=reclamacao.id,
            destinatario=self.responsavel,
        ).exists()
        self.assertTrue(notificacao_existe)

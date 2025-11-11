from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from atendimento.models import RegraDistribuicaoAtendimento


class RegraDistribuicaoApiTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username='admin', password='123456', is_staff=True)
        self.user = User.objects.create_user(username='usuario', password='123456', is_staff=False)
        self.list_url = reverse('atendimento:api_regras_distribuicao')

    def test_listar_regras_sem_autenticacao(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_listar_regras_autenticado(self):
        RegraDistribuicaoAtendimento.objects.create(
            nome='Regra Gravidade Alta',
            prioridade=1,
            gravidade='ALTA',
            responsavel=self.staff,
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)

    def test_criar_regra_sem_permissao(self):
        self.client.force_authenticate(self.user)
        payload = {
            'nome': 'Regra Teste',
            'prioridade': 1,
            'gravidade': 'MEDIA',
            'responsavel': self.staff.id,
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_criar_regra_staff(self):
        self.client.force_authenticate(self.staff)
        payload = {
            'nome': 'Regra Teste',
            'prioridade': 2,
            'gravidade': 'MEDIA',
            'assunto': 'FINANCEIRO',
            'tipo_classificacao': 'CIP',
            'responsavel': self.staff.id,
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RegraDistribuicaoAtendimento.objects.count(), 1)

    def test_atualizar_e_excluir_regra(self):
        regra = RegraDistribuicaoAtendimento.objects.create(
            nome='Regra Inicial',
            prioridade=3,
            responsavel=self.staff,
        )
        detalhe_url = reverse('atendimento:api_regra_distribuicao_detalhe', args=[regra.id])

        # Usuário sem permissão não pode atualizar
        self.client.force_authenticate(self.user)
        response = self.client.put(detalhe_url, {'nome': 'Alterada'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Staff atualiza
        self.client.force_authenticate(self.staff)
        response = self.client.put(detalhe_url, {'nome': 'Alterada'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        regra.refresh_from_db()
        self.assertEqual(regra.nome, 'Alterada')

        # Staff exclui
        response = self.client.delete(detalhe_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(RegraDistribuicaoAtendimento.objects.count(), 0)

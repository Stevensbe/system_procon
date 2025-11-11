from django.apps import apps
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AtendimentoConfigTests(TestCase):
    def test_app_config_registered(self):
        config = apps.get_app_config('atendimento')
        self.assertEqual(config.verbose_name, 'Gestão de Atendimento')


class ConfiguracaoAtendimentoModelTests(TestCase):
    def test_get_config_cria_registro_padrao(self):
        config_model = apps.get_model('atendimento', 'ConfiguracaoAtendimento')
        config = config_model.get_config()
        self.assertTrue(config.ativo)
        self.assertEqual(config.nome_sistema, 'Sistema PROCON')


class ConfiguracaoAtendimentoApiTests(APITestCase):
    def setUp(self):
        self.url = reverse('atendimento:api_configuracao_atendimento')
        self.staff = User.objects.create_user('staff', password='123456', is_staff=True)
        self.user = User.objects.create_user('usuario', password='123456', is_staff=False)

    def test_get_configuracao_retorna_prazos(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertIn('prazo_resposta_dias', payload)
        self.assertIn('prazo_conciliacao_dias', payload)
        self.assertIn('prazo_decisao_dias', payload)

    def test_put_configuracao_atualiza_prazos(self):
        self.client.force_authenticate(self.staff)
        data = {
            'prazo_resposta_dias': 15,
            'prazo_conciliacao_dias': 45,
            'prazo_decisao_dias': 75,
        }
        response = self.client.put(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        for campo, valor in data.items():
            self.assertEqual(payload[campo], valor)

        config_model = apps.get_model('atendimento', 'ConfiguracaoAtendimento')
        config = config_model.get_config()
        self.assertEqual(config.prazo_resposta_dias, 15)
        self.assertEqual(config.prazo_conciliacao_dias, 45)
        self.assertEqual(config.prazo_decisao_dias, 75)

    def test_put_sem_permissao_retorna_erro(self):
        self.client.force_authenticate(self.user)
        response = self.client.put(self.url, {'prazo_resposta_dias': 20}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

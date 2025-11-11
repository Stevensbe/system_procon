from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.test import TestCase

from caixa_entrada.models import CaixaEntrada


class MonitoringApiTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username='monitor',
            email='monitor@example.com',
            password='safe-pass-123',
        )

        now = timezone.now()
        # Documento com prazo crítico (próximas horas)
        CaixaEntrada.objects.create(
            tipo_documento='PETICAO',
            assunto='Prazo crítico',
            remetente_nome='João da Silva',
            setor_destino='JURIDICO',
            prazo_resposta=now + timedelta(hours=2),
        )
        # Documento vencido para alimentar alertas
        CaixaEntrada.objects.create(
            tipo_documento='PETICAO',
            assunto='Prazo vencido',
            remetente_nome='Maria Souza',
            setor_destino='FISCALIZACAO',
            status='EM_ANALISE',
            prioridade='URGENTE',
            responsavel_atual=self.user,
            prazo_resposta=now - timedelta(hours=3),
        )

    def test_dashboard_prazos_api_returns_expected_structure(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse('monitoring:api_prazos'))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('critical_deadlines', payload)
        self.assertIn('overdue_deadlines', payload)
        self.assertIn('stats', payload)
        self.assertGreaterEqual(len(payload['critical_deadlines']), 1)
        self.assertGreaterEqual(len(payload['overdue_deadlines']), 1)

    def test_alerts_realtime_api_lists_alerts(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse('monitoring:api_alerts_realtime'))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('alerts', payload)
        self.assertIn('total_alerts', payload)
        self.assertGreater(payload['total_alerts'], 0)


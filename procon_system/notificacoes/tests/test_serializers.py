from django.test import SimpleTestCase

from notificacoes.serializers import (
    DashboardNotificacoesSerializer,
    NotificacaoContadorSerializer,
    NotificacaoEstatisticasSerializer,
    NotificacaoSerializer,
)


class NotificacoesSerializerTests(SimpleTestCase):
    def test_dashboard_serializer_accepts_payload(self):
        payload = {
            'total_notificacoes': 10,
            'notificacoes_pendentes': 4,
            'notificacoes_enviadas': 3,
            'notificacoes_lidas': 2,
            'notificacoes_falhadas': 1,
            'notificacoes_por_tipo': {'Alerta': 5, 'Aviso': 5},
            'notificacoes_por_canal': {'EMAIL': 6, 'SMS': 4},
            'notificacoes_recentes': [],
        }
        serializer = DashboardNotificacoesSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_contador_serializer_accepts_counts(self):
        payload = {
            'total': 20,
            'pendentes': 5,
            'enviadas': 7,
            'lidas': 6,
            'falhadas': 2,
        }
        serializer = NotificacaoContadorSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_estatisticas_serializer_accepts_periods(self):
        payload = {
            'hoje': 3,
            'ontem': 2,
            'semana_passada': 12,
            'mes_passado': 40,
        }
        serializer = NotificacaoEstatisticasSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

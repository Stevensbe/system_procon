from django.test import SimpleTestCase
from datetime import datetime
from django.utils.timezone import make_aware

from auditoria.serializers import AuditoriaDashboardSerializer


class AuditoriaSerializerTests(SimpleTestCase):
    def test_dashboard_serializer_accepts_payload(self):
        now = make_aware(datetime(2025, 10, 7, 13, 0))
        payload = {
            'total_eventos': 5,
            'eventos_por_tipo': {'login': 3, 'edicao': 2},
            'eventos_recentes': [
                {
                    'objeto': 'Protocolo 123',
                    'usuario': 'admin',
                    'acao': 'login',
                    'criado_em': now
                }
            ]
        }
        serializer = AuditoriaDashboardSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

from django.test import SimpleTestCase
from datetime import datetime
from django.utils.timezone import make_aware

from agenda.serializers import AgendaDashboardSerializer


class AgendaSerializerTests(SimpleTestCase):
    def test_dashboard_serializer_accepts_payload(self):
        now = make_aware(datetime(2025, 10, 7, 12, 0))
        payload = {
            'total_eventos': 3,
            'eventos_por_status': {'agendado': 2, 'confirmado': 1},
            'eventos_por_tipo': {'fiscalizacao': 2, 'reuniao': 1},
            'eventos_hoje': [
                {
                    'titulo': 'Fiscalizacao Centro',
                    'inicio': now,
                    'fim': now,
                    'status': 'agendado',
                    'prioridade': 'normal'
                }
            ]
        }
        serializer = AgendaDashboardSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

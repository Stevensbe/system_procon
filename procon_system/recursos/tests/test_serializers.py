from django.test import SimpleTestCase
from datetime import datetime
from django.utils.timezone import make_aware

from recursos.serializers import RecursosDashboardSerializer


class RecursosSerializerTests(SimpleTestCase):
    def test_dashboard_serializer_accepts_payload(self):
        payload = {
            'total_recursos': 4,
            'recursos_por_status': {'pendente': 3, 'julgado': 1},
            'recursos_pendentes': [
                {
                    'numero': 'R-2025-001',
                    'status': 'pendente',
                    'tipo': 'administrativo',
                    'criado_em': make_aware(datetime(2025, 10, 7, 9, 0))
                }
            ]
        }
        serializer = RecursosDashboardSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

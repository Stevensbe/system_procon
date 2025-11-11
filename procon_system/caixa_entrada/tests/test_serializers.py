from django.test import SimpleTestCase

from caixa_entrada.serializers import CaixaEntradaDashboardSerializer


class CaixaEntradaSerializerTests(SimpleTestCase):
    def test_dashboard_serializer_accepts_empty_payload(self):
        payload = {
            'total': 0,
            'nao_lidos': 0,
            'atrasados': 0,
            'urgentes': 0,
            'distribuicao_status': [],
            'distribuicao_tipo': [],
            'recentes': [],
        }
        serializer = CaixaEntradaDashboardSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

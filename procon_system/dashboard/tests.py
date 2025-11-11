from django.test import SimpleTestCase

from .serializers import DashboardStatsSerializer


class DashboardSerializerTests(SimpleTestCase):
    def test_stats_serializer_accepts_expected_payload(self):
        payload = {
            'totalProcessos': 10,
            'processosEmAndamento': 5,
            'processosConcluidos': 3,
            'processosPendentes': 2,
            'totalMultas': 7,
            'multasPagas': 4,
            'multasPendentes': 2,
            'multasVencidas': 1,
            'arrecadacaoMes': 12345.67,
            'arrecadacaoAno': 98765.43,
            'denunciasRecebidas': 12,
            'fiscalizacoesRealizadas': 8,
            'usuariosAtivos': 3,
            'taxaResolucao': 75.5,
            'tempoMedioResolucao': 10.2,
            'periodo': 'mes',
            'atualizadoEm': '2025-10-07T14:00:00Z',
        }
        serializer = DashboardStatsSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

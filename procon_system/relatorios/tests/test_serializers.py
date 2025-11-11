from django.test import SimpleTestCase
from datetime import date

from relatorios.serializers import (
    RelatorioStatsSerializer,
    RelatorioFilterSerializer,
)


class RelatoriosSerializerTests(SimpleTestCase):
    def test_stats_serializer_accepts_expected_payload(self):
        payload = {
            'periodo': 'mensal',
            'total_relatorios': 12,
            'relatorios_por_mes': [
                {'mes': '2025-08', 'total': 5},
                {'mes': '2025-09', 'total': 7},
            ],
            'usuarios_mais_ativos': [
                {'usuario': 'admin', 'total': 4},
                {'usuario': 'gestor', 'total': 3},
            ],
            'tipos_mais_utilizados': [
                {'tipo': 'Financeiro', 'total': 6},
                {'tipo': 'Estatistica', 'total': 6},
            ],
        }
        serializer = RelatorioStatsSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_filter_serializer_handles_optional_fields(self):
        payload = {
            'tipo_relatorio': 1,
            'status': 'concluido',
            'formato': 'PDF',
            'solicitado_por': 3,
            'data_inicio': date(2025, 9, 1),
            'data_fim': date(2025, 9, 30),
            'titulo': 'Resumo Mensal',
        }
        serializer = RelatorioFilterSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['status'], 'concluido')

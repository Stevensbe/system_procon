from django.test import SimpleTestCase

from fiscalizacao.serializers import (
    FiscalizacaoDashboardStatsSerializer,
    FiscalizacaoEstatisticasResponseSerializer,
    ProcessosDashboardSerializer,
)


class FiscalizacaoSerializerTests(SimpleTestCase):
    def test_dashboard_stats_serializer_accepts_payload(self):
        payload = {
            'autos': {
                'total_bancos': 1,
                'total_postos': 2,
                'total_supermercados': 3,
                'total_diversos': 4,
            },
            'infracoes': {
                'total_infracoes': 5,
                'infracoes_mes': 2,
                'infracoes_pendentes': 1,
                'por_gravidade': {'leve': 3, 'media': 2},
            },
            'processos': {
                'total_processos': 4,
                'processos_pendentes': 1,
                'processos_finalizados': 3,
                'por_status': {'aguardando_defesa': 1, 'finalizado_procedente': 3},
            },
            'tendencias': {
                '2025-01': {'banco': 1, 'posto': 0, 'supermercado': 0, 'diversos': 0, 'total': 1},
            },
            'resumo': {
                'total_documentos': 10,
                'atividade_recente': 2,
                'pendencias': 1,
            },
        }
        serializer = FiscalizacaoDashboardStatsSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_estatisticas_serializer_accepts_payload(self):
        payload = {
            'periodo': {
                'data_inicio': '2025-01-01',
                'data_fim': '2025-01-31',
                'municipio': 'Cidade',
            },
            'totais': {
                'autos_banco': 1,
                'autos_posto': 2,
                'autos_supermercado': 3,
                'autos_diversos': 4,
                'total_autos': 10,
                'total_infracoes': 5,
            },
            'por_origem': {'acao_fiscalizatoria': 2, 'denuncia': 3, 'forca_tarefa': 1},
            'irregularidades': {
                'bancos_com_irregularidades': 1,
                'postos_com_irregularidades': 1,
                'supermercados_com_irregularidades': 1,
            },
            'infracoes_por_gravidade': {'leve': 2},
            'infracoes_por_tipo': {'documental': 1},
        }
        serializer = FiscalizacaoEstatisticasResponseSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_processos_dashboard_serializer_accepts_payload(self):
        payload = {
            'resumo': {'total': 5, 'pendentes': 2, 'finalizados_mes': 1, 'vencendo_prazo': 0},
            'por_status': {'aguardando_defesa': 2},
            'por_prioridade': {'alta': 1, 'baixa': 1},
            'valores': {'total_multas': 1000.0, 'valor_medio': 500.0},
            'tempo_medio_tramitacao': {},
        }
        serializer = ProcessosDashboardSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

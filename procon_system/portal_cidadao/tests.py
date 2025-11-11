from datetime import datetime

from django.test import SimpleTestCase
from django.utils.timezone import make_aware

from portal_cidadao.serializers import PortalCidadaoDashboardSerializer


class PortalCidadaoSerializerTests(SimpleTestCase):
    def test_dashboard_serializer_accepts_payload(self):
        now = make_aware(datetime(2025, 10, 7, 15, 0))
        payload = {
            'total_demandas': 4,
            'demandas_por_status': {'aberta': 2, 'em_analise': 1, 'respondida': 1},
            'demandas_recorrentes': ['Falta de produto', 'Cobrança indevida'],
            'demandas_recentes': [
                {
                    'protocolo': '2025-0001',
                    'titulo': 'Cobrança indevida de cartão',
                    'status': 'em_analise',
                    'categoria': 'Financeiro',
                    'atualizado_em': now,
                }
            ],
            'notificacoes': [
                {
                    'id': 10,
                    'assunto': 'Resposta da empresa',
                    'lida': False,
                    'recebida_em': now,
                }
            ],
            'documentos_pendentes': 1,
            'ultima_sincronizacao': now,
        }
        serializer = PortalCidadaoDashboardSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

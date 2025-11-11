from decimal import Decimal

from django.test import SimpleTestCase

from cobranca.serializers import (
    DashboardSerializer,
    BoletosPorStatusSerializer,
    PagamentosPorMesSerializer,
    CobrancasPorStatusSerializer,
    RemessasPorStatusSerializer,
)


class CobrancaSerializerTests(SimpleTestCase):
    def test_dashboard_serializer_accepts_schema(self):
        payload = {
            'total_em_aberto': Decimal('1500.50'),
            'recebido_hoje': Decimal('250.00'),
            'boletos_vencidos': 4,
            'taxa_pagamento': Decimal('75.25'),
            'variacao_em_aberto': Decimal('5.10'),
            'variacao_recebido': Decimal('3.50'),
            'variacao_vencidos': -1,
            'variacao_taxa': Decimal('0.00'),
        }
        serializer = DashboardSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_boletos_por_status_serializer_validates_list(self):
        payload = [
            {'status': 'pendente', 'quantidade': 3, 'percentual': Decimal('60.00')},
            {'status': 'pago', 'quantidade': 2, 'percentual': Decimal('40.00')},
        ]
        serializer = BoletosPorStatusSerializer(data=payload, many=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_pagamentos_por_mes_serializer_validates_payload(self):
        payload = [
            {'mes': '2025-01', 'valor': Decimal('500.00'), 'quantidade': 5},
            {'mes': '2025-02', 'valor': Decimal('650.00'), 'quantidade': 7},
        ]
        serializer = PagamentosPorMesSerializer(data=payload, many=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_cobrancas_por_status_serializer_validates_payload(self):
        payload = [
            {'status': 'gerada', 'quantidade': 4, 'percentual': Decimal('80.00')},
            {'status': 'enviada', 'quantidade': 1, 'percentual': Decimal('20.00')},
        ]
        serializer = CobrancasPorStatusSerializer(data=payload, many=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_remessas_por_status_serializer_validates_payload(self):
        payload = [
            {'status': 'gerado', 'quantidade': 2, 'percentual': Decimal('50.00')},
            {'status': 'processado', 'quantidade': 2, 'percentual': Decimal('50.00')},
        ]
        serializer = RemessasPorStatusSerializer(data=payload, many=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)

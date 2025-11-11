from django.test import SimpleTestCase

from empresas.serializers import EmpresasDashboardSerializer


class EmpresasSerializerTests(SimpleTestCase):
    def test_dashboard_serializer_accepts_payload(self):
        payload = {
            'total_empresas': 2,
            'empresas_por_situacao': {'ativa': 2},
            'empresas_recentes': [
                {
                    'id': 1,
                    'razao_social': 'Empresa Exemplo LTDA',
                    'cnpj': '12.345.678/0001-90',
                    'situacao': 'ativa',
                    'classificacao_risco': 'baixo'
                }
            ]
        }
        serializer = EmpresasDashboardSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

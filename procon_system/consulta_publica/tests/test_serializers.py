from django.test import SimpleTestCase

from consulta_publica.serializers import ConsultaPublicaResumoSerializer


class ConsultaPublicaSerializerTests(SimpleTestCase):
    def test_resumo_serializer_accepts_payload(self):
        payload = {
            'total_consultas': 12,
            'abertas': 4,
            'encerradas': 8,
            'temas_populares': ['Telecom', 'Saude']
        }
        serializer = ConsultaPublicaResumoSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

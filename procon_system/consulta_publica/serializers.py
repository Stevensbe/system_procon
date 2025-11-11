from rest_framework import serializers


class ConsultaPublicaResumoSerializer(serializers.Serializer):
    total_consultas = serializers.IntegerField()
    abertas = serializers.IntegerField()
    encerradas = serializers.IntegerField()
    temas_populares = serializers.ListField(child=serializers.CharField())

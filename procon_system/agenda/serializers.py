from rest_framework import serializers


class AgendaEventoResumoSerializer(serializers.Serializer):
    titulo = serializers.CharField()
    inicio = serializers.DateTimeField()
    fim = serializers.DateTimeField()
    status = serializers.CharField()
    prioridade = serializers.CharField()


class AgendaDashboardSerializer(serializers.Serializer):
    total_eventos = serializers.IntegerField()
    eventos_por_status = serializers.DictField(child=serializers.IntegerField())
    eventos_por_tipo = serializers.DictField(child=serializers.IntegerField())
    eventos_hoje = AgendaEventoResumoSerializer(many=True)

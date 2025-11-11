from rest_framework import serializers


class AuditoriaLogSerializer(serializers.Serializer):
    objeto = serializers.CharField()
    usuario = serializers.CharField()
    acao = serializers.CharField()
    criado_em = serializers.DateTimeField()


class AuditoriaDashboardSerializer(serializers.Serializer):
    total_eventos = serializers.IntegerField()
    eventos_por_tipo = serializers.DictField(child=serializers.IntegerField())
    eventos_recentes = AuditoriaLogSerializer(many=True)

from rest_framework import serializers


class RecursoResumoSerializer(serializers.Serializer):
    numero = serializers.CharField()
    status = serializers.CharField()
    tipo = serializers.CharField()
    criado_em = serializers.DateTimeField()


class RecursosDashboardSerializer(serializers.Serializer):
    total_recursos = serializers.IntegerField()
    recursos_por_status = serializers.DictField(child=serializers.IntegerField())
    recursos_pendentes = RecursoResumoSerializer(many=True)

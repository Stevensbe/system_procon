from rest_framework import serializers


class PortalCidadaoDemandaResumoSerializer(serializers.Serializer):
    protocolo = serializers.CharField()
    titulo = serializers.CharField()
    status = serializers.CharField()
    categoria = serializers.CharField()
    atualizado_em = serializers.DateTimeField()


class PortalCidadaoNotificacaoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    assunto = serializers.CharField()
    lida = serializers.BooleanField()
    recebida_em = serializers.DateTimeField()


class PortalCidadaoDashboardSerializer(serializers.Serializer):
    total_demandas = serializers.IntegerField()
    demandas_por_status = serializers.DictField(child=serializers.IntegerField())
    demandas_recorrentes = serializers.ListField(child=serializers.CharField())
    demandas_recentes = PortalCidadaoDemandaResumoSerializer(many=True)
    notificacoes = PortalCidadaoNotificacaoSerializer(many=True)
    documentos_pendentes = serializers.IntegerField()
    ultima_sincronizacao = serializers.DateTimeField()

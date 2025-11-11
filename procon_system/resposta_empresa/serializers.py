from datetime import datetime

from django.utils import timezone
from rest_framework import serializers

from cip_automatica.models import CIPAutomatica, RespostaEmpresa


class RespostaEmpresaSerializer(serializers.ModelSerializer):
    cip_id = serializers.UUIDField(source="cip.id", read_only=True)
    numero_cip = serializers.CharField(source="cip.numero_cip", read_only=True)
    empresa = serializers.CharField(source="cip.empresa_razao_social", read_only=True)

    class Meta:
        model = RespostaEmpresa
        fields = [
            "id",
            "cip_id",
            "numero_cip",
            "empresa",
            "tipo_resposta",
            "status",
            "texto_resposta",
            "valor_oferecido",
            "prazo_pagamento_oferecido",
            "data_recebimento",
            "prazo_analise",
            "decisao_final",
            "data_decisao",
            "documentos_anexos",
        ]


class RespostaEmpresaCreateSerializer(serializers.Serializer):
    cip_id = serializers.UUIDField()
    texto_resposta = serializers.CharField()
    valor_oferecido = serializers.DecimalField(
        max_digits=10, decimal_places=2, allow_null=True, required=False
    )

    def validate_cip_id(self, value):
        if not CIPAutomatica.objects.filter(id=value).exists():
            raise serializers.ValidationError("CIP inválida para registro de resposta.")
        return value


class RespostaRelatorioSerializer(serializers.Serializer):
    data_inicio = serializers.DateField()
    data_fim = serializers.DateField()

    def validate(self, attrs):
        if attrs["data_fim"] < attrs["data_inicio"]:
            raise serializers.ValidationError("Data fim deve ser posterior à data início.")
        return attrs


class AnaliseResumoSerializer(serializers.Serializer):
    total_respostas = serializers.IntegerField()
    respostas_por_tipo = serializers.DictField(child=serializers.IntegerField())
    respostas_por_status = serializers.DictField(child=serializers.IntegerField())
    valores_totais = serializers.DictField()
    taxa_aceitacao = serializers.FloatField()
    tempo_medio_analise = serializers.CharField(allow_null=True)
    empresas_mais_responsivas = serializers.ListField()
    tendencias = serializers.DictField()
    periodo = serializers.DictField()


class ProximaAnaliseSerializer(serializers.Serializer):
    prazo_analise = serializers.DateTimeField()

    def update(self, instance, validated_data):
        instance.prazo_analise = validated_data.get("prazo_analise", timezone.now())
        instance.save(update_fields=["prazo_analise"])
        return instance

from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from .models import TipoCIP, CIPAutomatica


class TipoCIPSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCIP
        fields = [
            "id",
            "nome",
            "codigo",
            "descricao",
            "template_cip",
            "prazo_resposta",
            "prazo_acordo",
            "valor_minimo",
            "valor_maximo",
            "setor_responsavel",
            "ativo",
        ]


class CIPAutomaticaSerializer(serializers.ModelSerializer):
    tipo_cip = TipoCIPSerializer(read_only=True)

    class Meta:
        model = CIPAutomatica
        fields = [
            "id",
            "numero_protocolo",
            "numero_cip",
            "tipo_cip",
            "status",
            "prioridade",
            "consumidor_nome",
            "consumidor_cpf",
            "empresa_razao_social",
            "empresa_cnpj",
            "assunto",
            "descricao_fatos",
            "valor_indenizacao",
            "valor_multa",
            "valor_total",
            "data_geracao",
            "prazo_resposta_empresa",
            "prazo_acordo_pagamento",
        ]


class CIPGenerateSerializer(serializers.Serializer):
    reclamacao_id = serializers.IntegerField()
    tipo_cip_id = serializers.IntegerField()
    valor_indenizacao = serializers.DecimalField(max_digits=10, decimal_places=2)
    observacoes = serializers.CharField(allow_blank=True, required=False)

    def validate_valor_indenizacao(self, value: Decimal) -> Decimal:
        if value <= 0:
            raise serializers.ValidationError("Valor da indenização deve ser positivo.")
        return value


class CIPDispatchSerializer(serializers.Serializer):
    metodo_envio = serializers.ChoiceField(choices=["email", "correios", "juridico"], default="email")


class CIPStatusUpdateSerializer(serializers.Serializer):
    novo_status = serializers.CharField(max_length=30)
    observacoes = serializers.CharField(required=False, allow_blank=True)

    def validate_novo_status(self, value: str) -> str:
        value = value.upper()
        valid_status = {choice[0] for choice in CIPAutomatica.STATUS_CHOICES}
        if value not in valid_status:
            raise serializers.ValidationError("Status inválido para CIP.")
        return value


class CIPOverdueAlertSerializer(serializers.Serializer):
    cip_id = serializers.UUIDField()
    numero_cip = serializers.CharField()
    empresa = serializers.CharField()
    consumidor = serializers.CharField()
    valor_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    dias_vencido = serializers.IntegerField()
    status = serializers.CharField()
    timestamp = serializers.SerializerMethodField()

    def get_timestamp(self, obj) -> str:
        return timezone.now().isoformat()

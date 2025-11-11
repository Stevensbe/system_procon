from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import AgendamentoAudiencia, LocalAudiencia, Mediador
from cip_automatica.models import CIPAutomatica

User = get_user_model()


class MediadorSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField(read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(source="usuario", queryset=User.objects.all(), write_only=True)

    class Meta:
        model = Mediador
        fields = [
            "id",
            "usuario",
            "usuario_id",
            "numero_registro",
            "especializacoes",
            "disponibilidade_semana",
            "valor_hora",
            "ativo",
        ]
        read_only_fields = ["usuario"]


class LocalAudienciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalAudiencia
        fields = [
            "id",
            "nome",
            "endereco",
            "capacidade_maxima",
            "possui_equipamentos_video",
            "possui_acesso_inclusao",
            "tipo_local",
            "disponivel_24h",
            "horario_funcionamento",
            "custo_utilizacao",
            "ativo",
        ]


class AgendamentoAudienciaSerializer(serializers.ModelSerializer):
    mediador = MediadorSerializer(read_only=True)
    mediador_id = serializers.PrimaryKeyRelatedField(
        source="mediador", queryset=Mediador.objects.all(), write_only=True, required=False
    )
    local = LocalAudienciaSerializer(read_only=True)
    local_id = serializers.PrimaryKeyRelatedField(
        source="local", queryset=LocalAudiencia.objects.all(), write_only=True, required=False, allow_null=True
    )
    cips_relacionadas = serializers.PrimaryKeyRelatedField(many=True, queryset=CIPAutomatica.objects.all(), required=False)

    class Meta:
        model = AgendamentoAudiencia
        fields = [
            "id",
            "numero_protocolo",
            "status",
            "modalidade",
            "tipo_audiencia",
            "data_agendamento",
            "duracao_estimada",
            "mediador",
            "mediador_id",
            "local",
            "local_id",
            "observacoes",
            "participantes_consumidor",
            "participantes_empresa",
            "cips_relacionadas",
            "resultado_final",
            "valor_acordo",
            "prazo_pagamento_acordo",
        ]
        read_only_fields = ["numero_protocolo", "resultado_final"]

    def validate_data_agendamento(self, value):
        if value < timezone.now() - timedelta(minutes=1):
            raise serializers.ValidationError("A data de agendamento deve ser futura.")
        return value

    def create(self, validated_data):
        cips = validated_data.pop("cips_relacionadas", [])
        instance = AgendamentoAudiencia(**validated_data)
        instance.gerar_numero_protocolo()
        instance.save()
        if cips:
            instance.cips_relacionadas.set(cips)
        return instance

    def update(self, instance, validated_data):
        cips = validated_data.pop("cips_relacionadas", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if cips is not None:
            instance.cips_relacionadas.set(cips)
        return instance

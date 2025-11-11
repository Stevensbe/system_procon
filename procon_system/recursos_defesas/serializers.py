from rest_framework import serializers

from .models import TipoDefesa, DefesaAdministrativa


class TipoDefesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDefesa
        fields = [
            "id",
            "nome",
            "descricao",
            "prazo_dias",
            "requer_documentos",
            "ativo",
        ]


class DefesaAdministrativaSerializer(serializers.ModelSerializer):
    esta_no_prazo = serializers.SerializerMethodField()
    dias_para_vencimento = serializers.SerializerMethodField()

    class Meta:
        model = DefesaAdministrativa
        fields = [
            "id",
            "numero_defesa",
            "processo",
            "tipo_defesa",
            "status",
            "forma_apresentacao",
            "data_protocolo",
            "data_apresentacao",
            "prazo_resposta",
            "esta_no_prazo",
            "dias_para_vencimento",
            "analista_responsavel",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = [
            "numero_defesa",
            "data_protocolo",
            "data_apresentacao",
            "prazo_resposta",
            "criado_em",
            "atualizado_em",
        ]

    def get_esta_no_prazo(self, obj):
        return obj.esta_no_prazo

    def get_dias_para_vencimento(self, obj):
        return obj.dias_para_vencimento

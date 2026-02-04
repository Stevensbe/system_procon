from rest_framework import serializers

from .models import ConfiguracaoSistema


class ConfigValueField(serializers.CharField):
    def to_internal_value(self, data):
        if isinstance(data, bool):
            return "true" if data else "false"
        if data is None:
            return ""
        return super().to_internal_value(str(data))


class ConfiguracaoSistemaSerializer(serializers.ModelSerializer):
    valor = ConfigValueField()

    class Meta:
        model = ConfiguracaoSistema
        fields = [
            "id",
            "chave",
            "valor",
            "descricao",
            "tipo",
            "categoria",
            "editavel",
            "data_atualizacao",
        ]
        read_only_fields = ["id", "data_atualizacao"]

    def validate_valor(self, value):
        return str(value)

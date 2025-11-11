from rest_framework import serializers


class FluxoAtendimentoRequestSerializer(serializers.Serializer):
    consumidor_nome = serializers.CharField()
    consumidor_cpf = serializers.CharField()
    consumidor_email = serializers.EmailField()
    consumidor_telefone = serializers.CharField()
    consumidor_endereco = serializers.CharField()
    consumidor_cidade = serializers.CharField()
    consumidor_uf = serializers.CharField(min_length=2, max_length=2)
    consumidor_cep = serializers.CharField()

    empresa_razao_social = serializers.CharField()
    empresa_cnpj = serializers.CharField()
    empresa_endereco = serializers.CharField()
    empresa_cidade = serializers.CharField(required=False, allow_blank=True)
    empresa_email = serializers.EmailField(required=False, allow_blank=True)
    empresa_telefone = serializers.CharField(required=False, allow_blank=True)

    descricao_fatos = serializers.CharField()
    tipo_reclamacao = serializers.CharField(default="GERAL")
    modalidade = serializers.CharField(default="PRESENCIAL")
    valor_prejuizo = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    documentos_anexados = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )

    solicita_audiencia = serializers.BooleanField(default=False)
    data_audiencia_desejada = serializers.DateTimeField(required=False)
    duracao_audiencia = serializers.IntegerField(required=False, min_value=1)
    mediador_preferencial = serializers.CharField(required=False, allow_blank=True)
    participantes_consumidor = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    participantes_empresa = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )

    def validate(self, attrs):
        if attrs.get("solicita_audiencia") and not attrs.get("data_audiencia_desejada"):
            raise serializers.ValidationError(
                {"data_audiencia_desejada": "Informe a data desejada para a audiência."}
            )
        return attrs

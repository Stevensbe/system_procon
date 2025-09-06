from rest_framework import serializers
from .models import (
    BoletoMulta, PagamentoMulta, CobrancaMulta, ConfiguracaoCobranca,
    TemplateCobranca, LogCobranca, Remessa, Banco
)


class ConfiguracaoCobrancaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoCobranca
        fields = '__all__'


class BoletoMultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoletoMulta
        fields = [
            'id', 'uuid', 'numero_boleto', 'nosso_numero', 'multa', 'pagador_nome',
            'pagador_documento', 'pagador_endereco', 'pagador_email', 'pagador_telefone',
            'valor_principal', 'valor_juros', 'valor_multa', 'valor_desconto', 'valor_total',
            'data_emissao', 'data_vencimento', 'data_pagamento', 'data_envio', 'status',
            'forma_pagamento', 'codigo_barras', 'linha_digitavel', 'observacoes',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id', 'uuid', 'criado_em', 'atualizado_em']


class BoletoMultaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoletoMulta
        fields = [
            'multa', 'pagador_nome', 'pagador_documento', 'pagador_endereco',
            'pagador_email', 'pagador_telefone', 'valor_principal', 'valor_juros',
            'valor_multa', 'valor_desconto', 'data_vencimento', 'observacoes'
        ]


class PagamentoMultaSerializer(serializers.ModelSerializer):
    boleto_info = BoletoMultaSerializer(source='boleto', read_only=True)
    
    class Meta:
        model = PagamentoMulta
        fields = [
            'id', 'boleto', 'boleto_info', 'valor_pago', 'data_pagamento',
            'forma_pagamento', 'comprovante', 'observacoes', 'criado_em'
        ]
        read_only_fields = ['id', 'criado_em']


class CobrancaMultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CobrancaMulta
        fields = '__all__'
        read_only_fields = ['id', 'criado_em']


class TemplateCobrancaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateCobranca
        fields = '__all__'


class LogCobrancaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogCobranca
        fields = '__all__'
        read_only_fields = ['id', 'data_hora']


class DashboardSerializer(serializers.Serializer):
    total_em_aberto = serializers.DecimalField(max_digits=15, decimal_places=2)
    recebido_hoje = serializers.DecimalField(max_digits=15, decimal_places=2)
    boletos_vencidos = serializers.IntegerField()
    taxa_pagamento = serializers.DecimalField(max_digits=5, decimal_places=2)
    variacao_em_aberto = serializers.DecimalField(max_digits=5, decimal_places=2)
    variacao_recebido = serializers.DecimalField(max_digits=5, decimal_places=2)
    variacao_vencidos = serializers.IntegerField()
    variacao_taxa = serializers.DecimalField(max_digits=5, decimal_places=2)


class BoletosPorStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    quantidade = serializers.IntegerField()
    percentual = serializers.DecimalField(max_digits=5, decimal_places=2)


class PagamentosPorMesSerializer(serializers.Serializer):
    mes = serializers.CharField()
    valor = serializers.DecimalField(max_digits=15, decimal_places=2)
    quantidade = serializers.IntegerField()


class CobrancasPorStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    quantidade = serializers.IntegerField()
    percentual = serializers.DecimalField(max_digits=5, decimal_places=2)


class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = ['id', 'codigo', 'nome', 'ativo']
        read_only_fields = ['id']


class RemessaSerializer(serializers.ModelSerializer):
    banco_info = BancoSerializer(source='banco', read_only=True)
    
    class Meta:
        model = Remessa
        fields = [
            'id', 'numero', 'tipo', 'banco', 'banco_info', 'quantidade_boletos',
            'valor_total', 'arquivo_remessa', 'arquivo_retorno', 'data_geracao',
            'data_envio', 'data_processamento', 'status', 'sequencial',
            'observacoes', 'erro_processamento', 'criado_em', 'atualizado_em',
            'criado_por'
        ]
        read_only_fields = ['id', 'numero', 'data_geracao', 'data_envio', 
                           'data_processamento', 'criado_em', 'atualizado_em']


class RemessaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Remessa
        fields = ['banco', 'tipo', 'observacoes']


class RemessasPorStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    quantidade = serializers.IntegerField()
    percentual = serializers.DecimalField(max_digits=5, decimal_places=2)

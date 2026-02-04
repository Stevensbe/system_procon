from rest_framework import serializers
from .models import (
    Boleto, Pagamento, Remessa, TipoBoleto, Banco, 
    Processo, DocumentoBoleto, HistoricoBoleto
)


class TipoBoletoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoBoleto
        fields = '__all__'


class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = '__all__'


class ProcessoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Processo
        fields = ['id', 'numero', 'empresa', 'status']


class DocumentoBoletoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoBoleto
        fields = ['id', 'nome', 'arquivo', 'tipo', 'data_upload']


class HistoricoBoletoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricoBoleto
        fields = ['id', 'acao', 'descricao', 'data_acao', 'usuario']


class BoletoSerializer(serializers.ModelSerializer):
    documentos = DocumentoBoletoSerializer(many=True, read_only=True)
    historico = HistoricoBoletoSerializer(many=True, read_only=True)
    processo_info = ProcessoSerializer(source='processo', read_only=True)
    banco_info = BancoSerializer(source='banco', read_only=True)
    tipo_info = TipoBoletoSerializer(source='tipo', read_only=True)
    
    class Meta:
        model = Boleto
        fields = [
            'id', 'numero', 'tipo', 'tipo_info', 'status', 'valor', 'valor_original',
            'vencimento', 'emissao', 'devedor', 'documento', 'tipo_documento',
            'endereco', 'cidade', 'estado', 'cep', 'telefone', 'email',
            'banco', 'banco_info', 'agencia', 'conta', 'carteira', 'nosso_numero',
            'codigo_barras', 'linha_digitavel', 'descricao', 'observacoes',
            'processo', 'processo_info', 'auto_infracao', 'multa_atraso',
            'juros_mora', 'desconto', 'desconto_ate', 'documentos', 'historico',
            'data_criacao', 'data_atualizacao', 'usuario_criacao', 'usuario_atualizacao'
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao', 'usuario_criacao', 'usuario_atualizacao']


class BoletoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Boleto
        fields = [
            'numero', 'tipo', 'status', 'valor', 'valor_original', 'vencimento',
            'emissao', 'devedor', 'documento', 'tipo_documento', 'endereco',
            'cidade', 'estado', 'cep', 'telefone', 'email', 'banco', 'agencia',
            'conta', 'carteira', 'nosso_numero', 'codigo_barras', 'linha_digitavel',
            'descricao', 'observacoes', 'processo', 'auto_infracao', 'multa_atraso',
            'juros_mora', 'desconto', 'desconto_ate'
        ]


class PagamentoSerializer(serializers.ModelSerializer):
    boleto_info = BoletoSerializer(source='boleto', read_only=True)
    
    class Meta:
        model = Pagamento
        fields = [
            'id', 'boleto', 'boleto_info', 'numero_boleto', 'valor_pago',
            'data_pagamento', 'forma_pagamento', 'comprovante', 'observacoes',
            'data_criacao', 'usuario_criacao'
        ]
        read_only_fields = ['id', 'data_criacao', 'usuario_criacao']


class RemessaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Remessa
        fields = [
            'id', 'numero', 'banco', 'data_geracao', 'data_envio', 'status',
            'quantidade_boletos', 'valor_total', 'arquivo', 'observacoes',
            'data_criacao', 'usuario_criacao'
        ]
        read_only_fields = ['id', 'data_criacao', 'usuario_criacao']


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


class RemessasPorStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    quantidade = serializers.IntegerField()
    percentual = serializers.DecimalField(max_digits=5, decimal_places=2)

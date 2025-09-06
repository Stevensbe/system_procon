from rest_framework import serializers
from .models import (
    Produto, CategoriaProduto, Fabricante, RegistroPreco,
    ProdutoInutilizado, ControleEstoque
)


class CategoriaProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaProduto
        fields = ['id', 'nome', 'codigo', 'descricao', 'ativo', 'requer_inspecao']


class FabricanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fabricante
        fields = ['id', 'nome', 'cnpj', 'pais_origem', 'ativo']


class ProdutoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    fabricante_nome = serializers.CharField(source='fabricante.nome', read_only=True)
    preco_medio = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Produto
        fields = [
            'id', 'nome', 'codigo_interno', 'codigo_barras', 'codigo_ncm',
            'categoria', 'categoria_nome', 'fabricante', 'fabricante_nome',
            'descricao', 'unidade_medida', 'classificacao_risco',
            'preco_referencia', 'preco_medio', 'tem_validade', 'ativo'
        ]


class RegistroPrecoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    
    class Meta:
        model = RegistroPreco
        fields = [
            'id', 'produto', 'produto_nome', 'estabelecimento',
            'cnpj_estabelecimento', 'preco', 'preco_promocional',
            'data_coleta', 'ativo', 'verificado'
        ]


class ProdutoInutilizadoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)
    
    class Meta:
        model = ProdutoInutilizado
        fields = [
            'id', 'numero_auto', 'produto', 'produto_nome',
            'estabelecimento_nome', 'motivo', 'motivo_display',
            'quantidade_inutilizada', 'unidade', 'valor_estimado',
            'data_inutilizacao', 'fiscal_responsavel'
        ]


class ControleEstoqueSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    situacao_estoque = serializers.CharField(read_only=True)
    
    class Meta:
        model = ControleEstoque
        fields = [
            'id', 'produto', 'produto_nome', 'estabelecimento_nome',
            'quantidade_estoque', 'produtos_vencidos', 'produtos_proximos_vencimento',
            'data_verificacao', 'situacao_estoque', 'irregularidades'
        ]
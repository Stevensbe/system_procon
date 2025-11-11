from rest_framework import serializers


class PeriodoMensalSerializer(serializers.Serializer):
    inicio_mes = serializers.CharField()
    fim_mes = serializers.CharField()


class FinanceiroDashboardSerializer(serializers.Serializer):
    arrecadacao_mes = serializers.FloatField()
    total_pendente = serializers.FloatField()
    total_atraso = serializers.FloatField()
    taxa_conversao = serializers.FloatField()
    total_registros = serializers.IntegerField()
    registros_pagos = serializers.IntegerField()
    periodo = PeriodoMensalSerializer()


class PeriodoGenericoSerializer(serializers.Serializer):
    inicio = serializers.CharField()
    fim = serializers.CharField()


class ArrecadacaoMensalItemSerializer(serializers.Serializer):
    mes = serializers.CharField()
    ano_mes = serializers.CharField()
    total = serializers.FloatField()
    periodo = PeriodoGenericoSerializer()


class ArrecadacaoMetaSerializer(serializers.Serializer):
    total_periodos = serializers.IntegerField()
    data_geracao = serializers.CharField()
    fonte_dados = serializers.CharField()


class ArrecadacaoMensalResponseSerializer(serializers.Serializer):
    dados = ArrecadacaoMensalItemSerializer(many=True)
    meta = ArrecadacaoMetaSerializer()


class ComposicaoCarteiraItemSerializer(serializers.Serializer):
    status = serializers.CharField()
    valor = serializers.FloatField()
    percentual = serializers.FloatField()
    count = serializers.IntegerField()


class ComposicaoMetaSerializer(serializers.Serializer):
    total_carteira = serializers.FloatField()
    total_registros = serializers.IntegerField()
    data_calculo = serializers.CharField()
    fonte_dados = serializers.CharField()


class ComposicaoCarteiraResponseSerializer(serializers.Serializer):
    dados = ComposicaoCarteiraItemSerializer(many=True)
    meta = ComposicaoMetaSerializer()


class EmpresaResumoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    razao_social = serializers.CharField()
    cnpj = serializers.CharField()


class ProcessoResumoSerializer(serializers.Serializer):
    numero = serializers.CharField(allow_null=True)
    id = serializers.IntegerField(allow_null=True)


class MultaResumoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    empresa = EmpresaResumoSerializer()
    valor = serializers.FloatField()
    data_emissao = serializers.CharField()
    data_vencimento = serializers.CharField()
    status = serializers.CharField()
    pago = serializers.BooleanField()
    processo = ProcessoResumoSerializer()


class RelatorioFiltrosSerializer(serializers.Serializer):
    data_inicio = serializers.CharField(allow_null=True)
    data_fim = serializers.CharField(allow_null=True)
    status = serializers.CharField(allow_null=True)
    empresa_id = serializers.CharField(allow_null=True)
    search = serializers.CharField(allow_null=True)


class RelatorioResumoSerializer(serializers.Serializer):
    total_valor = serializers.FloatField()
    total_registros = serializers.IntegerField()
    filtros_aplicados = RelatorioFiltrosSerializer()


class RelatorioMultasResponseSerializer(serializers.Serializer):
    results = MultaResumoSerializer(many=True)
    count = serializers.IntegerField()
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    resumo = RelatorioResumoSerializer()


class EmpresaListaItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    razao_social = serializers.CharField()
    cnpj = serializers.CharField()
    total_multas = serializers.IntegerField()
    valor_total = serializers.FloatField()


class EmpresasListResponseSerializer(serializers.Serializer):
    empresas = EmpresaListaItemSerializer(many=True)
    total = serializers.IntegerField()

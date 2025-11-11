from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    totalProcessos = serializers.IntegerField()
    processosEmAndamento = serializers.IntegerField()
    processosConcluidos = serializers.IntegerField()
    processosPendentes = serializers.IntegerField()
    totalMultas = serializers.IntegerField()
    multasPagas = serializers.IntegerField()
    multasPendentes = serializers.IntegerField()
    multasVencidas = serializers.IntegerField()
    arrecadacaoMes = serializers.FloatField()
    arrecadacaoAno = serializers.FloatField()
    denunciasRecebidas = serializers.IntegerField()
    fiscalizacoesRealizadas = serializers.IntegerField()
    usuariosAtivos = serializers.IntegerField()
    taxaResolucao = serializers.FloatField()
    tempoMedioResolucao = serializers.FloatField()
    periodo = serializers.CharField()
    atualizadoEm = serializers.CharField()


class ChartSerieSerializer(serializers.Serializer):
    mes = serializers.CharField(required=False, allow_blank=True)
    valor = serializers.FloatField(required=False)
    meta = serializers.FloatField(required=False)
    quantidade = serializers.IntegerField(required=False)
    percentual = serializers.FloatField(required=False)
    resolvidas = serializers.IntegerField(required=False)
    status = serializers.CharField(required=False)
    tipo = serializers.CharField(required=False)


class DashboardGraficosSerializer(serializers.Serializer):
    arrecadacaoMensal = serializers.ListField(child=ChartSerieSerializer())
    processosPorStatus = serializers.ListField(child=ChartSerieSerializer())
    multasPorTipo = serializers.ListField(child=ChartSerieSerializer())
    denunciasPorMes = serializers.ListField(child=ChartSerieSerializer())
    performanceMensal = serializers.ListField(child=ChartSerieSerializer())
    fiscalizacoesPorMes = serializers.ListField(child=ChartSerieSerializer())


class DashboardAlertaSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    tipo = serializers.CharField()
    titulo = serializers.CharField()
    mensagem = serializers.CharField()
    acao = serializers.CharField()
    dataCriacao = serializers.CharField()


class DashboardAtividadeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    tipo = serializers.CharField()
    titulo = serializers.CharField()
    descricao = serializers.CharField()
    usuario = serializers.CharField()
    dataCriacao = serializers.CharField()


class DashboardPayloadSerializer(serializers.Serializer):
    estatisticas = DashboardStatsSerializer()
    graficos = DashboardGraficosSerializer()
    alertas = serializers.ListField(child=DashboardAlertaSerializer())
    atividades = serializers.ListField(child=DashboardAtividadeSerializer())
    dataAtualizacao = serializers.CharField()

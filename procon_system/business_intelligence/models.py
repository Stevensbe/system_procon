"""
Modelos de Business Intelligence para o Sistema Procon
Dashboards executivos, KPIs governamentais e análises avançadas
"""

import uuid
from datetime import datetime, timedelta
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.serializers.json import DjangoJSONEncoder
from typing import Dict, List, Any, Optional
from decimal import Decimal


class KPI(models.Model):
    """Modelo para KPIs executivos do sistema"""
    
    TIPO_KPI_CHOICES = [
        ('TATAL', 'Total'),
        ('PERCENTUAL', 'Percentual'),
        ('MEDIA', 'Média'),
        ('RATIO', 'Taxa'),
        ('INDICE', 'Índice'),
    ]
    
    COTEGORIA_KPI_CHOICES = [
        ('OPERACIONAL', 'Operacional'),
        ('CONFORMIDADE', 'Conformidade'),
        ('SATISFACAO', 'Satisfação'),
        ('PERFORMANCE', 'Performance'),
        ('COMERCIAL', 'Comercial'),
        ('GERENCIAL', 'Gerencial'),
        ('REGULATORIO', 'Regulatório'),
    ]
    
    codigo = models.CharField("Código", max_length=50, unique=True)
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    
    categoria = models.CharField("Categoria", max_length=20, choices=COTEGORIA_KPI_CHOICES)
    tipo_kpi = models.CharField("Tipo", max_length=15, choices=TIPO_KPI_CHOICES)
    
    # Configuração de cálculo
    formula_calculo = models.TextField("Fórmula de Cálculo", help_text="Expressão para calcular o KPI")
    filtros_aplicaveis = models.JSONField("Filtros Aplicáveis", default=dict, blank=True)
    validade_dias = models.IntegerField("Validade em Dias", default=30)
    
    # Metas e alertas
    meta_anual = models.DecimalField("Meta Anual", max_digits=10, decimal_places=2, null=True, blank=True)
    meta_mensal = models.DecimalField("Meta Mensal", max_digits=10, decimal_places=2, null=True, blank=True)
    limite_alerta_inferior = models.DecimalField("Limite Alerta Inferior", max_digits=10, decimal_places=2, null=True, blank=True)
    limite_alerta_superior = models.DecimalField("Limite Alerta Superior", max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Configuração da apresentação
    cor_base = models.CharField("Cor Base", max_length=7, default="#007bff")
    icone = models.CharField("Ícone", max_length=50, default="fas fa-chart-bar")
    ordenacao = models.IntegerField("Ordenação", default=0)
    
    # Status e controle
    ativo = models.BooleanField("Ativo", default=True)
    publico = models.BooleanField("Público", default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='kpis_criados')
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "KPI"
        verbose_name_plural = "KPIs"
        ordering = ['ordenacao', 'nome']
        unique_together = ['codigo', 'categoria']
    
    def __str__(self):
        return f"{self.codigo} - {self.nome}"


class Dashboard(models.Model):
    """Modelo para Dashboards executivos configuraveis"""
    
    TIPO_DASHBOARD_CHOICES = [
        ('EXECUTIVO', 'Executivo'),
        ('OPERACIONAL', 'Operacional'),
        ('TATICO', 'Tático'),
        ('GERENCIAL', 'Gerencial'),
        ('REGULATORIO', 'Regulatório'),
    ]
    
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    tipo_dashboard = models.CharField("Tipo", max_length=15, choices=TIPO_DASHBOARD_CHOICES)
    
    # Configuração visual
    layout_config = models.JSONField("Configuração Layout", default=list, blank=True)
    cores_tema = models.JSONField("Cores do Tema", default=dict, blank=True)
    intervalo_atualizacao = models.IntegerField("Intervalo Atualização (min)", default=5)
    
    # KPIs relacionados
    kpis = models.ManyToManyField(KPI, through='DashboardKPI', blank=True)
    
    # Permissões
    usuario_permitidos = models.ManyToManyField(User, blank=True, related_name='dashboards_permitidos')
    grupos_permitidos = models.ManyToManyField('auth.Group', blank=True)
    
    # Status e controle
    ativo = models.BooleanField("Ativo", default=True)
    padrao = models.BooleanField("Dashboard Padrão", default=False)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='dashboards_criados')
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Dashboard"
        verbose_name_plural = "Dashboards"
        ordering = ['-padrao', 'nome']
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_dashboard_display()})"


class DashboardKPI(models.Model):
    """Relação entre Dashboards e KPIs com configurações específicas"""
    
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name='dashboard_kpis')
    kpi = models.ForeignKey(KPI, on_delete=models.CASCADE, related_name='dashboard_kpis')
    
    # Configurações específicas do widget
    posicao_x = models.IntegerField("Posição X", default=0)
    posicao_y = models.IntegerField("Posição Y", default=0)
    largura = models.IntegerField("Largura", default=400)
    altura = models.IntegerField("Altura", default=300)
    
    # Configurações visuais
    titulo_personalizado = models.CharField("Título Personalizado", max_length=100, blank=True)
    tipo_grafico = models.CharField("Tipo Gráfico", max_length=20, default='card')
    opcoes_visualizacao = models.JSONField("Opções Visualização", default=dict, blank=True)
    
    # Configurações de dados
    periodo_padrao = models.IntegerField("Período Padrão (dias)", default=30)
    filtros_personalizados = models.JSONField("Filtros Personalizados", default=dict, blank=True)
    
    # Status
    ativo = models.BooleanField("Ativo", default=True)
    ordenacao = models.IntegerField("Ordenação", default=0)
    
    class Meta:
        verbose_name = "Dashboard KPI"
        verbose_name_plural = "Dashboards KPIs"
        ordering = ['dashboard', 'ordenacao']
        unique_together = ['dashboard', 'kpi']


class ValorKPI(models.Model):
    """Histórico de valores dos KPIs"""
    
    kpi = models.ForeignKey(KPI, on_delete=models.CASCADE, related_name='valores_historico')
    
    # Contexto temporal
    data_referencia = models.DateTimeField("Data Referência")
    periodo_tipo = models.CharField("Tipo Período", max_length=10, 
                                    choices=[('HORA', 'Hora'), ('DIA', 'Dia'), ('SEMANA', 'Semana'), 
                                            ('MES', 'Mês'), ('TRIMESTRE', 'Trimestre'), ('ANO', 'Ano')])
    
    # Valores
    valor_calculado = models.DecimalField("Valor Calculado", max_digits=15, decimal_places=4)
    valor_meta = models.DecimalField("Valor Meta", max_digits=10, decimal_places=2, null=True, blank=True)
    percentual_meta = models.DecimalField("Percentual Meta", max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Contexto adicional
    filtros_aplicados = models.JSONField("Filtros Aplicados", default=dict, blank=True)
    parametros_calculo = models.JSONField("Parâmetros Cálculo", default=dict, blank=True)
    observacoes = models.TextField("Observações", blank=True)
    
    # Status do cálculo
    calculado_em = models.DateTimeField("Calculado em", auto_now_add=True)
    status_calculo = models.CharField("Status", max_length=20, choices=[
        ('SUCESSO', 'Sucesso'),
        ('ERRO', 'Erro'),
        ('PARCIAL', 'Parcial'),
        ('CACHE', 'Cache')
    ], default='SUCESSO')
    
    # Metadados técnicos
    tempo_calculo_ms = models.IntegerField("Tempo Cálculo (ms)", default=0)
    registro_id = models.CharField("ID Registro", max_length=50, blank=True)
    
    class Meta:
        verbose_name = "Valor KPI"
        verbose_name_plural = "Valores KPIs"
        ordering = ['-data_referencia', 'kpi']
        unique_together = ['kpi', 'data_referencia', 'periodo_tipo']
        indexes = [
            models.Index(fields=['kpi', 'data_referencia']),
            models.Index(fields=['data_referencia']),
            models.Index(fields=['periodo_tipo', 'data_referencia']),
        ]
    
    def __str__(self):
        return f"{self.kpi.codigo} - {self.data_referencia} - {self.valor_calculado}"


class RelatorioPersonalizado(models.Model):
    """Modelo para relatórios personalizados gerados automaticamente"""
    
    TIPO_RELATORIO_CHOICES = [
        ('EXECUTIVO', 'Relatório Executivo'),
        ('OPERACIONAL', 'Relatório Operacional'),
        ('COMPLIANCE', 'Relatório de Conformidade'),
        ('PERFORMANCE', 'Relatório de Performance'),
        ('REGULATORIO', 'Relatório Regulatório'),
        ('AUDITORIA', 'Relatório de Auditoria'),
        ('PERIODICO', 'Relatório Periódico'),
    ]
    
    FORMATO_CHOICES = [
        ('PDF', 'PDF'),
        ('EXCEL', 'Excel'),
        ('CSV', 'CSV'),
        ('HTML', 'HTML'),
        ('JSON', 'JSON'),
    ]
    
    FREQUENCIA_CHOICES = [
        ('IMEDIATO', 'Imediato'),
        ('DIARIA', 'Diária'),
        ('SEMANAL', 'Semanal'),
        ('MENSAL', 'Mensal'),
        ('TRIMESTRAL', 'Trimestral'),
        ('ANUAL', 'Anual'),
        ('PERSONALIZADA', 'Personalizada'),
    ]
    
    codigo = models.CharField("Código", max_length=50, unique=True)
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    
    tipo_relatorio = models.CharField("Tipo", max_length=20, choices=TIPO_RELATORIO_CHOICES)
    formato = models.CharField("Formato", max_length=10, choices=FORMATO_CHOICES, default='PDF')
    
    # Configuração do relatório
    query_sql = models.TextField("Query SQL", blank=True)
    filtros_disponiveis = models.JSONField("Filtros Disponíveis", default=dict, blank=True)
    parametros_default = models.JSONField("Parâmetros Default", default=dict, blank=True)
    template_path = models.CharField("Caminho Template", max_length=200, blank=True)
    
    # Agendamento
    frequencia_geracao = models.CharField("Frequência", max_length=15, choices=FREQUENCIA_CHOICES, default='IMEDIATO')
    intervalo_dias = models.IntegerField("Intervalo Dias", default=1, help_text="Para frequência personalizada")
    hora_execucao = models.TimeField("Hora Execução", null=True, blank=True)
    
    # Destinatários automáticos
    email_destinatarios = models.JSONField("Destinatários Email", default=list, blank=True)
    grupos_destinatarios = models.ManyToManyField('auth.Group', blank=True)
    
    # Configurações visuais
    logo_relatorio = models.ImageField("Logo", upload_to='relatorios/logos/', null=True, blank=True)
    rodape_personalizado = models.TextField("Rodapé Personalizado", blank=True)
    configuracoes_exibicao = models.JSONField("Configurações Exibição", default=dict, blank=True)
    
    # Controle de execução
    ativo = models.BooleanField("Ativo", default=True)
    ultima_execucao = models.DateTimeField("Última Execução", null=True, blank=True)
    proxima_execucao = models.DateTimeField("Próxima Execução", null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='relatorios_criados')
    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Relatório Personalizado"
        verbose_name_plural = "Relatórios Personalizados"
        ordering = ['codigo', 'tipo_relatorio']
    
    def __str__(self):
        return f"{self.codigo} - {self.nome} ({self.get_tipo_relatorio_display()})"


class HistoricoRelatorio(models.Model):
    """Histórico de execuções de relatórios personalizados"""
    
    STATUS_CHOICES = [
        ('AGUARDANDO', 'Aguardando'),
        ('EXECUTANDO', 'Executando'),
        ('SUCESSO', 'Sucesso'),
        ('ERRO', 'Erro'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    relatorio = models.ForeignKey(RelatorioPersonalizado, on_delete=models.CASCADE, related_name='execucoes')
    
    # Contexto da execução
    executado_em = models.DateTimeField("Executado em", auto_now_add=True)
    solicitado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    parametros_utilizados = models.JSONField("Parâmetros Utilizados", default=dict, blank=True)
    
    # Resultado
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES)
    arquivo_gerado = models.FileField("Arquivo Gerado", upload_to='relatorios/execucoes/', null=True, blank=True)
    tamanho_arquivo = models.IntegerField("Tamanho Arquivo (bytes)", default=0)
    
    # Métricas de performance
    tempo_execucao_segundos = models.DecimalField("Tempo Execução (s)", max_digits=8, decimal_places=3)
    registros_processados = models.IntegerField("Registros Processados", default=0)
    memoria_utilizada_mb = models.DecimalField("Memória Utilizada (MB)", max_digits=8, decimal_places=2, default=0)
    
    # Informações técnicas
    logs_execucao = models.TextField("Logs Execução", blank=True)
    erro_detalhes = models.TextField("Detalhes do Erro", blank=True)
    versao_sistema = models.CharField("Versão Sistema", max_length=50, blank=True)
    
    class Meta:
        verbose_name = "Histórico Relatório"
        verbose_name_plural = "Histórico Relatórios"
        ordering = ['-executado_em']
        indexes = [
            models.Index(fields=['relatorio', '-executado_em']),
            models.Index(fields=['solicitado_por', '-executado_em']),
            models.Index(fields=['status', '-executado_em']),
        ]
    
    def __str__(self):
        return f"{self.relatorio.código} - {self.executado_em} - {self.get_status_display()}"


class AnaliseEmpirica(models.Model):
    """Análises estatísticas e empíricas avançadas"""
    
    TIPO_ANALISE_CHOICES = [
        ('TENDENCIA', 'Análise de Tendência'),
        ('CORRELACAO', 'Análise de Correlação'),
        ('CONCENTRACAO', 'Análise de Concentração'),
        ('PERFORMANCE', 'Análise de Performance'),
        ('COMPARATIVA', 'Análise Comparativa'),
        ('TEMPORAL', 'Análise Temporal'),
        ('SETORIAL', 'Análise Setorial'),
        ('GEOGRAFICA', 'Análise Geográfica'),
    ]
    
    codigo = models.CharField("Código", max_length=50, unique=True)
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    
    tipo_analise = models.CharField("Tipo", max_length=20, choices=TIPO_ANALISE_CHOICES)
    
    # Configuração da análise
    modelo_analise = models.JSONField("Modelo Análise", default=dict, blank=True)
    parametros_analise = models.JSONField("Parâmetros Análise", default=dict, blank=True)
    filtros_base = models.JSONField("Filtros Base", default=dict, blank=True)
    
    # Dados de entrada
    fonte_dados = models.CharField("Fonte Dados", max_length=100)
    periodo_analise = models.JSONField("Período Análise", default=dict, blank=True)
    
    # Resultados da análise
    resultado_principal = models.JSONField("Resultado Principal", default=dict, blank=True)
    metricas_calculadas = models.JSONField("Métricas Calculadas", default=dict, blank=True)
    insights_gerados = models.TextField("Insights Gerados", blank=True)
    recomendacoes = models.TextField("Recomendações", blank=True)
    
    # Configuração de atualização
    atualizacao_automatica = models.BooleanField("Atualização Automática", default=False)
    frequencia_atualizacao_dias = models.IntegerField("Frequência Atualização (dias)", default=7)
    
    # Controle de qualidade
    confiabilidade_score = models.DecimalField("Score Confiabilidade", max_digits=3, decimal_places=2, null=True, blank=True)
    validacao_realizada = models.BooleanField("Validação Realizada", default=False)
    observacoes_validacao = models.TextField("Observações Validação", blank=True)
    
    # Metadados
    executado_em = models.DateTimeField("Executado em", auto_now_add=True)
    executado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    versao_analise = models.IntegerField("Versão", default=1)
    
    class Meta:
        verbose_name = "Análise Empírica"
        verbose_name_plural = "Análises Empíricas"
        ordering = ['-executado_em', 'nome']
        indexes = [
            models.Index(fields=['tipo_analise', '-executado_em']),
            models.Index(fields=['confiabilidade_score', '-executado_em']),
        ]
    
    def __str__(self):
        return f"{self.codigo} - {self.nome} ({self.get_tipo_analise_display()})"

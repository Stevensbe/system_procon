"""
SISPROCON - Sistema de Relatórios Executivos
Gera relatórios analíticos e estatísticos para apoio à tomada de decisão
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
import json


class TipoRelatorio(models.Model):
    """Tipos de relatórios disponíveis no sistema"""
    
    CATEGORIA_CHOICES = [
        ('fiscalizacao', 'Fiscalização'),
        ('financeiro', 'Financeiro'),
        ('juridico', 'Jurídico'),
        ('operacional', 'Operacional'),
        ('estrategico', 'Estratégico'),
    ]
    
    PERIODICIDADE_CHOICES = [
        ('diario', 'Diário'),
        ('semanal', 'Semanal'),
        ('mensal', 'Mensal'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
        ('sob_demanda', 'Sob Demanda'),
    ]
    
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição")
    categoria = models.CharField("Categoria", max_length=20, choices=CATEGORIA_CHOICES)
    periodicidade = models.CharField("Periodicidade", max_length=15, choices=PERIODICIDADE_CHOICES)
    
    # Configurações técnicas
    classe_gerador = models.CharField("Classe Geradora", max_length=100, help_text="Nome da classe que gera o relatório")
    template_html = models.CharField("Template HTML", max_length=200, blank=True)
    gerar_pdf = models.BooleanField("Gerar PDF", default=True)
    gerar_excel = models.BooleanField("Gerar Excel", default=False)
    
    # Permissões
    publico = models.BooleanField("Público", default=False)
    requer_aprovacao = models.BooleanField("Requer Aprovação", default=False)
    
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    
    class Meta:
        verbose_name = "Tipo de Relatório"
        verbose_name_plural = "Tipos de Relatórios"
        ordering = ['categoria', 'nome']
    
    def __str__(self):
        return f"{self.get_categoria_display()} - {self.nome}"


class RelatorioGerado(models.Model):
    """Relatórios gerados e armazenados"""
    
    STATUS_CHOICES = [
        ('processando', 'Processando'),
        ('concluido', 'Concluído'),
        ('erro', 'Erro'),
        ('cancelado', 'Cancelado'),
    ]
    
    tipo_relatorio = models.ForeignKey(TipoRelatorio, on_delete=models.CASCADE, related_name='relatorios_gerados')
    
    # Dados da geração
    numero_relatorio = models.CharField("Número", max_length=30, unique=True, blank=True)
    titulo = models.CharField("Título", max_length=200)
    data_inicio = models.DateField("Data Início", help_text="Período inicial dos dados")
    data_fim = models.DateField("Data Fim", help_text="Período final dos dados")
    
    # Status e controle
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='processando')
    data_geracao = models.DateTimeField("Gerado em", auto_now_add=True)
    data_conclusao = models.DateTimeField("Concluído em", null=True, blank=True)
    
    # Responsável
    solicitado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='relatorios_solicitados')
    aprovado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='relatorios_aprovados')
    
    # Arquivos gerados
    arquivo_pdf = models.FileField("Arquivo PDF", upload_to='relatorios/pdf/%Y/%m/', blank=True)
    arquivo_excel = models.FileField("Arquivo Excel", upload_to='relatorios/excel/%Y/%m/', blank=True)
    
    # Dados estatísticos (JSON)
    dados_estatisticos = models.JSONField("Dados Estatísticos", default=dict, blank=True)
    
    # Observações
    observacoes = models.TextField("Observações", blank=True)
    erro_detalhes = models.TextField("Detalhes do Erro", blank=True)
    
    class Meta:
        verbose_name = "Relatório Gerado"
        verbose_name_plural = "Relatórios Gerados"
        ordering = ['-data_geracao']
        indexes = [
            models.Index(fields=['numero_relatorio']),
            models.Index(fields=['tipo_relatorio', 'status']),
            models.Index(fields=['data_inicio', 'data_fim']),
        ]
    
    def __str__(self):
        return f"{self.numero_relatorio} - {self.titulo}"
    
    def save(self, *args, **kwargs):
        if not self.numero_relatorio:
            self.numero_relatorio = self._gerar_numero_relatorio()
        
        if self.status == 'concluido' and not self.data_conclusao:
            self.data_conclusao = timezone.now()
        
        super().save(*args, **kwargs)
    
    def _gerar_numero_relatorio(self):
        """Gera número sequencial para o relatório"""
        ano = timezone.now().year
        mes = timezone.now().month
        ultimo = RelatorioGerado.objects.filter(
            numero_relatorio__contains=f"{ano}{mes:02d}"
        ).order_by('-id').first()
        
        seq = 1
        if ultimo and '-' in ultimo.numero_relatorio:
            try:
                seq = int(ultimo.numero_relatorio.split('-')[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"REL-{ano}{mes:02d}-{seq:04d}"


class ConfiguracaoRelatorio(models.Model):
    """Configurações específicas para cada tipo de relatório"""
    
    tipo_relatorio = models.OneToOneField(TipoRelatorio, on_delete=models.CASCADE, related_name='configuracao')
    
    # Configurações de dados
    incluir_dados_historicos = models.BooleanField("Incluir Dados Históricos", default=True)
    periodo_maximo_dias = models.IntegerField("Período Máximo (dias)", default=365)
    
    # Configurações de formatação
    incluir_graficos = models.BooleanField("Incluir Gráficos", default=True)
    incluir_tabelas_detalhadas = models.BooleanField("Incluir Tabelas Detalhadas", default=True)
    incluir_analise_tendencias = models.BooleanField("Incluir Análise de Tendências", default=False)
    
    # Configurações de distribuição
    envio_automatico = models.BooleanField("Envio Automático", default=False)
    destinatarios_email = models.TextField("Destinatários Email", blank=True, help_text="Emails separados por vírgula")
    
    # Parâmetros específicos (JSON)
    parametros_customizados = models.JSONField("Parâmetros Customizados", default=dict, blank=True)
    
    class Meta:
        verbose_name = "Configuração de Relatório"
        verbose_name_plural = "Configurações de Relatórios"
    
    def __str__(self):
        return f"Config: {self.tipo_relatorio.nome}"


class AgendamentoRelatorio(models.Model):
    """Agendamentos para geração automática de relatórios"""
    
    tipo_relatorio = models.ForeignKey(TipoRelatorio, on_delete=models.CASCADE, related_name='agendamentos')
    
    # Configurações de agendamento
    ativo = models.BooleanField("Ativo", default=True)
    hora_execucao = models.TimeField("Hora de Execução", default='08:00')
    
    # Periodicidade específica
    dia_do_mes = models.IntegerField("Dia do Mês", null=True, blank=True, help_text="Para relatórios mensais")
    dia_da_semana = models.IntegerField("Dia da Semana", null=True, blank=True, help_text="0=Segunda, 6=Domingo")
    
    # Controle de execução
    ultima_execucao = models.DateTimeField("Última Execução", null=True, blank=True)
    proxima_execucao = models.DateTimeField("Próxima Execução", null=True, blank=True)
    
    # Responsável
    criado_por = models.ForeignKey(User, on_delete=models.PROTECT)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    
    class Meta:
        verbose_name = "Agendamento de Relatório"
        verbose_name_plural = "Agendamentos de Relatórios"
        ordering = ['proxima_execucao']
    
    def __str__(self):
        return f"Agendamento: {self.tipo_relatorio.nome}"
    
    def calcular_proxima_execucao(self):
        """Calcula a próxima execução baseada na periodicidade"""
        now = timezone.now()
        
        if self.tipo_relatorio.periodicidade == 'diario':
            self.proxima_execucao = now.replace(hour=self.hora_execucao.hour, minute=self.hora_execucao.minute, second=0, microsecond=0)
            if self.proxima_execucao <= now:
                self.proxima_execucao += timedelta(days=1)
        
        elif self.tipo_relatorio.periodicidade == 'semanal' and self.dia_da_semana is not None:
            dias_ate_execucao = (self.dia_da_semana - now.weekday()) % 7
            if dias_ate_execucao == 0 and now.time() > self.hora_execucao:
                dias_ate_execucao = 7
            self.proxima_execucao = (now + timedelta(days=dias_ate_execucao)).replace(
                hour=self.hora_execucao.hour, minute=self.hora_execucao.minute, second=0, microsecond=0
            )
        
        elif self.tipo_relatorio.periodicidade == 'mensal' and self.dia_do_mes is not None:
            if now.day < self.dia_do_mes:
                self.proxima_execucao = now.replace(day=self.dia_do_mes, hour=self.hora_execucao.hour, minute=self.hora_execucao.minute, second=0, microsecond=0)
            else:
                # Próximo mês
                if now.month == 12:
                    self.proxima_execucao = now.replace(year=now.year+1, month=1, day=self.dia_do_mes, hour=self.hora_execucao.hour, minute=self.hora_execucao.minute, second=0, microsecond=0)
                else:
                    self.proxima_execucao = now.replace(month=now.month+1, day=self.dia_do_mes, hour=self.hora_execucao.hour, minute=self.hora_execucao.minute, second=0, microsecond=0)
        
        self.save()


# =====================================
# CLASSES BASE PARA GERADORES
# =====================================

class BaseGeradorRelatorio:
    """Classe base para geradores de relatório"""
    
    def __init__(self, data_inicio, data_fim, parametros=None):
        self.data_inicio = data_inicio
        self.data_fim = data_fim
        self.parametros = parametros or {}
        self.dados = {}
    
    def gerar_dados(self):
        """Método abstrato para gerar dados do relatório"""
        raise NotImplementedError("Subclasses devem implementar gerar_dados()")
    
    def calcular_estatisticas(self):
        """Calcula estatísticas básicas dos dados"""
        return {}
    
    def gerar_relatorio_completo(self):
        """Gera relatório completo com dados e estatísticas"""
        self.gerar_dados()
        estatisticas = self.calcular_estatisticas()
        
        return {
            'dados': self.dados,
            'estatisticas': estatisticas,
            'periodo': {
                'inicio': self.data_inicio.isoformat(),
                'fim': self.data_fim.isoformat()
            },
            'gerado_em': timezone.now().isoformat()
        }

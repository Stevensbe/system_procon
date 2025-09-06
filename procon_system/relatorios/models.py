from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from datetime import datetime, timedelta
import uuid
import json


class TipoRelatorio(models.Model):
    """Tipos de relatórios disponíveis"""
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição")
    modulo = models.CharField("Módulo", max_length=50)  # fiscalizacao, juridico, multas, etc.
    ativo = models.BooleanField("Ativo", default=True)
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Tipo de Relatório"
        verbose_name_plural = "Tipos de Relatórios"
    
    def __str__(self):
        return self.nome


class Relatorio(models.Model):
    """Relatórios gerados pelo sistema"""
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('EM_PROCESSAMENTO', 'Em Processamento'),
        ('CONCLUIDO', 'Concluído'),
        ('ERRO', 'Erro'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    FORMATO_CHOICES = [
        ('PDF', 'PDF'),
        ('EXCEL', 'Excel'),
        ('CSV', 'CSV'),
        ('JSON', 'JSON'),
        ('HTML', 'HTML'),
    ]
    
    # Dados básicos
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    tipo_relatorio = models.ForeignKey(TipoRelatorio, on_delete=models.CASCADE, related_name='relatorios')
    
    # Configuração
    parametros = models.JSONField("Parâmetros", default=dict, blank=True)
    filtros = models.JSONField("Filtros", default=dict, blank=True)
    formato = models.CharField("Formato", max_length=10, choices=FORMATO_CHOICES, default='PDF')
    
    # Status e controle
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    progresso = models.IntegerField("Progresso (%)", default=0)
    data_solicitacao = models.DateTimeField("Data de Solicitação", auto_now_add=True)
    data_conclusao = models.DateTimeField("Data de Conclusão", null=True, blank=True)
    
    # Arquivo gerado
    arquivo = models.FileField("Arquivo", upload_to='relatorios/', null=True, blank=True)
    nome_arquivo = models.CharField("Nome do Arquivo", max_length=255, blank=True)
    tamanho_arquivo = models.IntegerField("Tamanho (bytes)", null=True, blank=True)
    
    # Responsável
    solicitado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relatorios_solicitados')
    
    # Metadados
    tempo_processamento = models.FloatField("Tempo de Processamento (segundos)", null=True, blank=True)
    registros_processados = models.IntegerField("Registros Processados", null=True, blank=True)
    erro_mensagem = models.TextField("Mensagem de Erro", blank=True)
    
    class Meta:
        verbose_name = "Relatório"
        verbose_name_plural = "Relatórios"
        ordering = ['-data_solicitacao']
    
    def __str__(self):
        return f"{self.titulo} - {self.get_status_display()}"
    
    @property
    def tempo_estimado(self):
        """Tempo estimado para conclusão baseado no progresso"""
        if self.status == 'CONCLUIDO' or self.tempo_processamento:
            return self.tempo_processamento or 0
        
        # Estimativa baseada no progresso
        if self.progresso > 0:
            tempo_decorrido = (timezone.now() - self.data_solicitacao).total_seconds()
            tempo_total_estimado = (tempo_decorrido / self.progresso) * 100
            return tempo_total_estimado - tempo_decorrido
        
        return None


class RelatorioAgendado(models.Model):
    """Relatórios agendados para execução automática"""
    FREQUENCIA_CHOICES = [
        ('DIARIA', 'Diária'),
        ('SEMANAL', 'Semanal'),
        ('MENSAL', 'Mensal'),
        ('TRIMESTRAL', 'Trimestral'),
        ('SEMESTRAL', 'Semestral'),
        ('ANUAL', 'Anual'),
    ]
    
    STATUS_CHOICES = [
        ('ATIVO', 'Ativo'),
        ('INATIVO', 'Inativo'),
        ('PAUSADO', 'Pausado'),
    ]
    
    # Dados básicos
    nome = models.CharField("Nome", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    tipo_relatorio = models.ForeignKey(TipoRelatorio, on_delete=models.CASCADE, related_name='agendamentos')
    
    # Configuração
    parametros = models.JSONField("Parâmetros", default=dict, blank=True)
    filtros = models.JSONField("Filtros", default=dict, blank=True)
    formato = models.CharField("Formato", max_length=10, choices=Relatorio.FORMATO_CHOICES, default='PDF')
    
    # Agendamento
    frequencia = models.CharField("Frequência", max_length=20, choices=FREQUENCIA_CHOICES)
    proxima_execucao = models.DateTimeField("Próxima Execução")
    ultima_execucao = models.DateTimeField("Última Execução", null=True, blank=True)
    
    # Status
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='ATIVO')
    ativo = models.BooleanField("Ativo", default=True)
    
    # Responsável
    criado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relatorios_agendados')
    
    # Metadados
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    data_modificacao = models.DateTimeField("Data de Modificação", auto_now=True)
    
    class Meta:
        verbose_name = "Relatório Agendado"
        verbose_name_plural = "Relatórios Agendados"
        ordering = ['proxima_execucao']
    
    def __str__(self):
        return f"{self.nome} - {self.get_frequencia_display()}"
    
    def calcular_proxima_execucao(self):
        """Calcula a próxima execução baseada na frequência"""
        if not self.ultima_execucao:
            return timezone.now()
        
        if self.frequencia == 'DIARIA':
            return self.ultima_execucao + timedelta(days=1)
        elif self.frequencia == 'SEMANAL':
            return self.ultima_execucao + timedelta(weeks=1)
        elif self.frequencia == 'MENSAL':
            return self.ultima_execucao + timedelta(days=30)
        elif self.frequencia == 'TRIMESTRAL':
            return self.ultima_execucao + timedelta(days=90)
        elif self.frequencia == 'SEMESTRAL':
            return self.ultima_execucao + timedelta(days=180)
        elif self.frequencia == 'ANUAL':
            return self.ultima_execucao + timedelta(days=365)
        
        return self.ultima_execucao


class TemplateRelatorio(models.Model):
    """Templates para relatórios"""
    nome = models.CharField("Nome", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    tipo_relatorio = models.ForeignKey(TipoRelatorio, on_delete=models.CASCADE, related_name='templates')
    
    # Configuração do template
    configuracao = models.JSONField("Configuração", default=dict)
    layout = models.TextField("Layout HTML", blank=True)
    css = models.TextField("CSS", blank=True)
    
    # Controle
    ativo = models.BooleanField("Ativo", default=True)
    padrao = models.BooleanField("Padrão", default=False)
    criado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='templates_criados')
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Template de Relatório"
        verbose_name_plural = "Templates de Relatórios"
    
    def __str__(self):
        return self.nome


class FiltroRelatorio(models.Model):
    """Filtros disponíveis para relatórios"""
    TIPO_FILTRO_CHOICES = [
        ('TEXTO', 'Texto'),
        ('NUMERO', 'Número'),
        ('DATA', 'Data'),
        ('SELECT', 'Seleção'),
        ('MULTISELECT', 'Múltipla Seleção'),
        ('BOOLEAN', 'Booleano'),
        ('RANGE', 'Intervalo'),
    ]
    
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    tipo_relatorio = models.ForeignKey(TipoRelatorio, on_delete=models.CASCADE, related_name='filtros')
    
    # Configuração do filtro
    tipo_filtro = models.CharField("Tipo de Filtro", max_length=20, choices=TIPO_FILTRO_CHOICES)
    campo = models.CharField("Campo", max_length=100)
    opcoes = models.JSONField("Opções", default=list, blank=True)
    obrigatorio = models.BooleanField("Obrigatório", default=False)
    valor_padrao = models.CharField("Valor Padrão", max_length=200, blank=True)
    
    # Controle
    ativo = models.BooleanField("Ativo", default=True)
    ordem = models.IntegerField("Ordem", default=0)
    
    class Meta:
        verbose_name = "Filtro de Relatório"
        verbose_name_plural = "Filtros de Relatórios"
        ordering = ['tipo_relatorio', 'ordem']
    
    def __str__(self):
        return f"{self.nome} - {self.tipo_relatorio.nome}"


class RelatorioCompartilhado(models.Model):
    """Relatórios compartilhados entre usuários"""
    relatorio = models.ForeignKey(Relatorio, on_delete=models.CASCADE, related_name='compartilhamentos')
    compartilhado_por = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relatorios_compartilhados')
    compartilhado_com = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relatorios_recebidos')
    
    # Permissões
    pode_visualizar = models.BooleanField("Pode Visualizar", default=True)
    pode_baixar = models.BooleanField("Pode Baixar", default=True)
    pode_compartilhar = models.BooleanField("Pode Compartilhar", default=False)
    
    # Controle
    data_compartilhamento = models.DateTimeField("Data de Compartilhamento", auto_now_add=True)
    data_expiracao = models.DateTimeField("Data de Expiração", null=True, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Relatório Compartilhado"
        verbose_name_plural = "Relatórios Compartilhados"
        unique_together = ['relatorio', 'compartilhado_com']
    
    def __str__(self):
        return f"{self.relatorio.titulo} - {self.compartilhado_com.get_full_name()}"


class HistoricoRelatorio(models.Model):
    """Histórico de execução de relatórios"""
    relatorio = models.ForeignKey(Relatorio, on_delete=models.CASCADE, related_name='historico')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='execucoes_relatorios')
    
    # Dados da execução
    status = models.CharField("Status", max_length=20, choices=Relatorio.STATUS_CHOICES)
    tempo_processamento = models.FloatField("Tempo de Processamento (segundos)", null=True, blank=True)
    registros_processados = models.IntegerField("Registros Processados", null=True, blank=True)
    erro_mensagem = models.TextField("Mensagem de Erro", blank=True)
    
    # Controle
    data_execucao = models.DateTimeField("Data de Execução", auto_now_add=True)
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    
    class Meta:
        verbose_name = "Histórico de Relatório"
        verbose_name_plural = "Históricos de Relatórios"
        ordering = ['-data_execucao']
    
    def __str__(self):
        return f"{self.relatorio.titulo} - {self.data_execucao.strftime('%d/%m/%Y %H:%M')}"


class ConfiguracaoRelatorio(models.Model):
    """Configurações gerais do sistema de relatórios"""
    # Limites
    max_relatorios_por_usuario = models.IntegerField("Máximo de Relatórios por Usuário", default=100)
    max_tamanho_arquivo = models.IntegerField("Tamanho Máximo de Arquivo (MB)", default=50)
    tempo_maximo_processamento = models.IntegerField("Tempo Máximo de Processamento (minutos)", default=30)
    
    # Configurações de armazenamento
    dias_retencao_relatorios = models.IntegerField("Dias de Retenção", default=365)
    dias_retencao_agendados = models.IntegerField("Dias de Retenção Agendados", default=730)
    
    # Configurações de notificação
    notificar_conclusao = models.BooleanField("Notificar Conclusão", default=True)
    notificar_erro = models.BooleanField("Notificar Erro", default=True)
    
    # Configurações de formato
    formato_padrao = models.CharField("Formato Padrão", max_length=10, choices=Relatorio.FORMATO_CHOICES, default='PDF')
    compressao_arquivos = models.BooleanField("Comprimir Arquivos", default=True)
    
    # Metadados
    data_configuracao = models.DateTimeField("Data de Configuração", auto_now_add=True)
    configurado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='configuracoes_relatorios')
    
    class Meta:
        verbose_name = "Configuração de Relatório"
        verbose_name_plural = "Configurações de Relatórios"
    
    def __str__(self):
        return f"Configuração - {self.data_configuracao.strftime('%d/%m/%Y')}"
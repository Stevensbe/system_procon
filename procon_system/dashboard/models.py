from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta


class DashboardConfig(models.Model):
    """Configurações do dashboard por usuário"""
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard_config')
    tema = models.CharField("Tema", max_length=20, default='claro', choices=[
        ('claro', 'Claro'),
        ('escuro', 'Escuro'),
        ('auto', 'Automático')
    ])
    atualizacao_automatica = models.BooleanField("Atualização Automática", default=True)
    intervalo_atualizacao = models.IntegerField("Intervalo (segundos)", default=300)
    alertas_ativos = models.BooleanField("Alertas Ativos", default=True)
    notificacoes_email = models.BooleanField("Notificações por Email", default=True)
    widgets_ativos = models.JSONField("Widgets Ativos", default=list)
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    data_atualizacao = models.DateTimeField("Data de Atualização", auto_now=True)
    
    class Meta:
        verbose_name = "Configuração do Dashboard"
        verbose_name_plural = "Configurações do Dashboard"
    
    def __str__(self):
        return f"Dashboard - {self.usuario.username}"


class DashboardCache(models.Model):
    """Cache de dados do dashboard"""
    chave = models.CharField("Chave", max_length=100, unique=True)
    dados = models.JSONField("Dados")
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    data_expiracao = models.DateTimeField("Data de Expiração")
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Cache do Dashboard"
        verbose_name_plural = "Caches do Dashboard"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Cache - {self.chave}"
    
    def is_expired(self):
        return timezone.now() > self.data_expiracao


class DashboardAlerta(models.Model):
    """Alertas do sistema para o dashboard"""
    TIPOS_CHOICES = [
        ('info', 'Informação'),
        ('warning', 'Aviso'),
        ('error', 'Erro'),
        ('success', 'Sucesso'),
    ]
    
    PRIORIDADES_CHOICES = [
        ('baixa', 'Baixa'),
        ('normal', 'Normal'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    tipo = models.CharField("Tipo", max_length=20, choices=TIPOS_CHOICES, default='info')
    prioridade = models.CharField("Prioridade", max_length=20, choices=PRIORIDADES_CHOICES, default='normal')
    titulo = models.CharField("Título", max_length=200)
    mensagem = models.TextField("Mensagem")
    acao = models.CharField("Ação", max_length=100, blank=True)
    url_acao = models.URLField("URL da Ação", blank=True)
    usuario_destinatario = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='alertas_recebidos')
    lido = models.BooleanField("Lido", default=False)
    data_lido = models.DateTimeField("Data de Leitura", null=True, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    data_expiracao = models.DateTimeField("Data de Expiração", null=True, blank=True)
    
    class Meta:
        verbose_name = "Alerta do Dashboard"
        verbose_name_plural = "Alertas do Dashboard"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.titulo}"
    
    def is_expired(self):
        if not self.data_expiracao:
            return False
        return timezone.now() > self.data_expiracao


class DashboardAtividade(models.Model):
    """Atividades recentes do sistema"""
    TIPOS_CHOICES = [
        ('processo', 'Processo'),
        ('multa', 'Multa'),
        ('fiscalizacao', 'Fiscalização'),
        ('protocolo', 'Protocolo'),
        ('usuario', 'Usuário'),
        ('sistema', 'Sistema'),
        ('relatorio', 'Relatório'),
    ]
    
    tipo = models.CharField("Tipo", max_length=20, choices=TIPOS_CHOICES)
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='atividades')
    dados_extras = models.JSONField("Dados Extras", default=dict, blank=True)
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Atividade do Dashboard"
        verbose_name_plural = "Atividades do Dashboard"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.titulo}"
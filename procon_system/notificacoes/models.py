from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import uuid

class TipoNotificacao(models.Model):
    """Tipos de notificação disponíveis no sistema"""
    nome = models.CharField(max_length=100)
    codigo = models.CharField(max_length=50, unique=True)
    descricao = models.TextField(blank=True)
    template_email = models.TextField(blank=True)
    template_sms = models.TextField(blank=True)
    template_push = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tipo de Notificação"
        verbose_name_plural = "Tipos de Notificação"
        ordering = ['nome']

    def __str__(self):
        return self.nome

class Notificacao(models.Model):
    """Modelo principal de notificações"""
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('enviada', 'Enviada'),
        ('lida', 'Lida'),
        ('falhada', 'Falhada'),
        ('cancelada', 'Cancelada')
    ]

    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('normal', 'Normal'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo = models.ForeignKey(TipoNotificacao, on_delete=models.CASCADE)
    destinatario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificacoes_recebidas')
    remetente = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='notificacoes_enviadas')
    
    titulo = models.CharField(max_length=200)
    mensagem = models.TextField()
    dados_extras = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    prioridade = models.CharField(max_length=20, choices=PRIORIDADE_CHOICES, default='normal')
    
    # Campos para referência genérica
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    objeto_relacionado = GenericForeignKey('content_type', 'object_id')
    
    # Campos de agendamento
    agendada_para = models.DateTimeField(null=True, blank=True)
    enviada_em = models.DateTimeField(null=True, blank=True)
    lida_em = models.DateTimeField(null=True, blank=True)
    
    # Campos de criação
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['destinatario', 'status']),
            models.Index(fields=['agendada_para', 'status']),
            models.Index(fields=['tipo', 'status']),
        ]

    def __str__(self):
        return f"{self.titulo} - {self.destinatario.username}"

    def marcar_como_enviada(self):
        """Marca a notificação como enviada"""
        self.status = 'enviada'
        self.enviada_em = timezone.now()
        self.save()

    def marcar_como_lida(self):
        """Marca a notificação como lida"""
        self.status = 'lida'
        self.lida_em = timezone.now()
        self.save()

    def esta_vencida(self):
        """Verifica se a notificação está vencida"""
        if self.agendada_para:
            return timezone.now() > self.agendada_para
        return False

class PreferenciaNotificacao(models.Model):
    """Preferências de notificação por usuário"""
    CANAL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push'),
        ('sistema', 'Sistema')
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    tipo_notificacao = models.ForeignKey(TipoNotificacao, on_delete=models.CASCADE)
    canal = models.CharField(max_length=20, choices=CANAL_CHOICES)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Preferência de Notificação"
        verbose_name_plural = "Preferências de Notificação"
        unique_together = ['usuario', 'tipo_notificacao', 'canal']
        ordering = ['usuario', 'tipo_notificacao']

    def __str__(self):
        return f"{self.usuario.username} - {self.tipo_notificacao.nome} - {self.canal}"

class LogNotificacao(models.Model):
    """Log de envio de notificações"""
    RESULTADO_CHOICES = [
        ('sucesso', 'Sucesso'),
        ('falha', 'Falha'),
        ('pendente', 'Pendente')
    ]

    notificacao = models.ForeignKey(Notificacao, on_delete=models.CASCADE)
    canal = models.CharField(max_length=20, choices=PreferenciaNotificacao.CANAL_CHOICES)
    resultado = models.CharField(max_length=20, choices=RESULTADO_CHOICES)
    mensagem_erro = models.TextField(blank=True)
    tentativas = models.PositiveIntegerField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de Notificação"
        verbose_name_plural = "Logs de Notificação"
        ordering = ['-criado_em']

    def __str__(self):
        return f"{self.notificacao.titulo} - {self.canal} - {self.resultado}"

class TemplateNotificacao(models.Model):
    """Templates de notificação"""
    nome = models.CharField(max_length=100)
    tipo_notificacao = models.ForeignKey(TipoNotificacao, on_delete=models.CASCADE)
    canal = models.CharField(max_length=20, choices=PreferenciaNotificacao.CANAL_CHOICES)
    assunto = models.CharField(max_length=200, blank=True)
    conteudo = models.TextField()
    variaveis = models.JSONField(default=list, blank=True, help_text="Lista de variáveis disponíveis no template")
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Template de Notificação"
        verbose_name_plural = "Templates de Notificação"
        unique_together = ['tipo_notificacao', 'canal']
        ordering = ['nome']

    def __str__(self):
        return f"{self.nome} - {self.canal}"
"""
Modelos para calendário de audiências e conciliações
Sistema Procon - Fase 4 - Fluxo Completo do Atendimento
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, date, time
from typing import Dict, Any, List, Optional
import uuid

User = get_user_model()


class Mediador(models.Model):
    """Mediadores disponíveis para conciliações"""
    
    ESPECIALIZACAO_CHOICES = [
        ('GERAL', 'Geral'),
        ('CONSUMIDOR', 'Consumidor'),
        ('CONTRATOS', 'Contratos'),
        ('SERVICOS_FINANCEIROS', 'Serviços Financeiros'),
        ('SAUDE', 'Saúde'),
        ('EDUCACAO', 'Educação'),
        ('VEICULOS', 'Veículos'),
        ('CONSTRUCAO', 'Construção Civil'),
    ]
    
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    numero_registro = models.CharField(max_length=20, unique=True)
    especializacoes = models.JSONField(default=list)
    disponibilidade_semana = models.JSONField(default=dict)  # {"segunda": [9,10,11], ...}
    valor_hora = models.DecimalField(max_digits=8, decimal_places=2, default=100.00)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Mediador"
        verbose_name_plural = "Mediadores"
        
    def __str__(self):
        return f"{self.usuario.get_full_name()} - {self.numero_registro}"


class LocalAudiencia(models.Model):
    """Locais disponíveis para audiências"""
    
    TIPO_LOCAL_CHOICES = [
        ('SALA_FISICA', 'Sala Física'),
        ('SALA_VIRTUAL', 'Sala Virtual'),
        ('AMBIENTE_VIRTUAL', 'Ambiente Virtual'),
        ('ESPACO_EXTERNO', 'Espaço Externo'),
    ]
    
    nome = models.CharField(max_length=200)
    endereco = models.TextField()
    capacidade_maxima = models.PositiveIntegerField(default=10)
    possui_equipamentos_video = models.BooleanField(default=False)
    possui_acesso_inclusao = models.BooleanField(default=True)
    tipo_local = models.CharField(max_length=20, choices=TIPO_LOCAL_CHOICES)
    disponivel_24h = models.BooleanField(default=False)
    horario_funcionamento = models.JSONField(default=dict)
    custo_utilizacao = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Local de Audiência"
        verbose_name_plural = "Locais de Audiência"
        
    def __str__(self):
        return f"{self.nome} - {self.endereco}"


class AgendamentoAudiencia(models.Model):
    """Agendamento de audiências/conciliações"""
    
    STATUS_CHOICES = [
        ('AGENDADA', 'Agendada'),
        ('CONFIRMADA', 'Confirmada'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('REALIZADA', 'Realizada'),
        ('CANCELADA', 'Cancelada'),
        ('ADIADA', 'Adiada'),
        ('SEM_COMPARECIMENTO', 'Sem Comparecimento'),
        ('ACORDO_REALIZADO', 'Acordo Realizado'),
        ('SEM_ACORDO', 'Sem Acordo'),
    ]
    
    MODALIDADE_CHOICES = [
        ('PRESENCIAL', 'Presencial'),
        ('VIRTUAL', 'Virtual'),
        ('HIBRIDA', 'Híbrida'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Dados básicos
    tipo_audiencia = models.CharField(max_length=30, default='CONCILIACAO')
    numero_protocolo = models.CharField(max_length=50, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AGENDADA')
    modalidade = models.CharField(max_length=15, choices=MODALIDADE_CHOICES, default='VIRTUAL')
    
    # Data e horário
    data_agendamento = models.DateTimeField()
    duracao_estimada = models.DurationField(default=timedelta(hours=2))
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    # Mediador e local
    mediador = models.ForeignKey(Mediador, on_delete=models.SET_NULL, null=True)
    local = models.ForeignKey(LocalAudiencia, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Participantes
    cips_relacionadas = models.ManyToManyField(
        'cip_automatica.CIPAutomatica', 
        blank=True, 
        related_name='audiencias_vinculadas'
    )
    
    # Dados dos participantes do consumidor
    participantes_consumidor = models.JSONField(default=list)
    
    # Dados dos participantes da empresa
    participantes_empresa = models.JSONField(default=list)
    
    # Controle e observações
    observacoes = models.TextField(blank=True)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='agendamentos_criados')
    
    # Resultados
    resultado_final = models.CharField(max_length=20, choices=[
        ('ACORDO_PARCIAL', 'Acordo Parcial'),
        ('ACORDO_TOTAL', 'Acordo Total'),
        ('SEM_ACORDO', 'Sem Acordo'),
        ('NAO_COMPARECEU_CON', 'Não Compareceu - Consumidor'),
        ('NAO_REPECEU_EMP', 'Não Compareceu - Empresa'),
        ('REAGENDO', 'Reagendada'),
    ], blank=True)
    
    valor_acordo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    prazo_pagamento_acordo = models.IntegerField(null=True, blank=True)  # dias
    
    # Documentos
    ata_audiência = models.FileField(
        upload_to='audiencias/atas/',
        null=True, blank=True
    )
    documentos_acordo = models.JSONField(default=list, blank=True)
    
    class Meta:
        verbose_name = "Agendamento de Audiência"
        verbose_name_plural = "Agendamentos de Audiência"
        ordering = ['data_agendamento']
        
    def __str__(self):
        return f"Audiência {self.numero_protocolo or self.id} - {self.data_agendamento.strftime('%d/%m/%Y %H:%M')}"
    
    def gerar_numero_protocolo(self):
        """Gera número de protocolo único"""
        if not self.numero_protocolo:
            ano = timezone.now().year
            sequencial = AgendamentoAudiencia.objects.filter(
                data_criacao__year=ano
            ).count() + 1
            
            self.numero_protocolo = f"AUD{ano:04d}{sequencial:06d}"
    
    def calcular_disponibilidade(self) -> Dict[str, Any]:
        """Calcula disponibilidade baseada nos participantes"""
        # Simplificado - em produção seria mais complexo
        disponibilidade = {
            'mediador_disponivel': True,
            'local_disponivel': True,
            'conflitos_horario': [],
        }
        
        # Verificar conflitos com outros agendamentos do mesmo mediador
        if self.mediador:
            conflitos = AgendamentoAudiencia.objects.filter(
                mediador=self.mediador,
                data_agendamento__date=self.data_agendamento.date(),
                status__in=['AGENDADA', 'CONFIRMADA', 'EM_ANDAMENTO'],
            ).exclude(id=self.id)
            
            if conflitos.exists():
                disponibilidade['conflitos_horario'].extend([
                    {
                        'protocolo': aud.numero_protocolo,
                        'horario': aud.data_agendamento.strftime('%H:%M'),
                    }
                    for aud in conflitos
                ])
        
        return disponibilidade


class Reagendamento(models.Model):
    """Reagendamentos de audiências"""
    
    MOTIVOS_CHOICES = [
        ('CONFLITO_MEDIADOR', 'Conflito com Mediador'),
        ('CONFLITO_PARTICIPANTE', 'Conflito com Participante'),
        ('EMERGENCIA', 'Emergência'),
        ('DOENTE_PARTICIPANTE', 'Doença de Participante'),
        ('PROBLEMA_TECNICO', 'Problema Técnico'),
        ('NAO_CONCORDO_HORARIO', 'Não Concordo com Horário'),
        ('MUDANCA_LOGISTICA', 'Mudança Logística'),
        ('OUTROS', 'Outros Motivos'),
    ]
    
    agendamento_original = models.ForeignKey(AgendamentoAudiencia, on_delete=models.CASCADE, 
                                           related_name='reagendamentos')
    nova_data = models.DateTimeField()
    motivo = models.CharField(max_length=30, choices=MOTIVOS_CHOICES)
    solicitado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    data_solicitacao = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True)
    aprovado = models.BooleanField(default=False)
    aprovado_por = models.ForeignKey(User, on_delete=models.SET_NULL, 
                                   null=True, related_name='reagendamentos_aprovados')
    
    class Meta:
        verbose_name = "Reagendamento"
        verbose_name_plural = "Reagendamentos"
        ordering = ['-data_solicitacao']
        
    def __str__(self):
        return f"Reagendamento {self.id} - Motivo: {self.get_motivo_display()}"


class HistoricoAudiencia(models.Model):
    """Histórico de mudanças em audiências"""
    
    agendamento = models.ForeignKey(AgendamentoAudiencia, on_delete=models.CASCADE, 
                                  related_name='historico')
    tipo_evento = models.CharField(max_length=30)  # CREATED, UPDATED, STATUS_CHANGED, etc.
    descricao = models.TextField()
    dados_anteriores = models.JSONField(default=dict, blank=True)
    dados_novos = models.JSONField(default=dict, blank=True)
    usuario_responsavel = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    data_evento = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Histórico de Audiência"
        verbose_name_plural = "Históricos de Audiências"
        ordering = ['-data_evento']
        
    def __str__(self):
        return f"Histórico {self.agendamento.numero_protocolo} - {self.tipo_evento}"

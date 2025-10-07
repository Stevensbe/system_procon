from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import uuid


class Atendimento(models.Model):
    """Modelo para controle de atendimentos no balcão"""
    
    numero_atendimento = models.CharField("Número do Atendimento", max_length=50, unique=True, blank=True)
    data_atendimento = models.DateTimeField("Data do Atendimento", auto_now_add=True)
    
    # Dados do atendente
    atendente = models.ForeignKey(User, on_delete=models.PROTECT, related_name='atendimentos_realizados')
    
    # Dados do consumidor
    consumidor_nome = models.CharField("Nome do Consumidor", max_length=255)
    consumidor_cpf = models.CharField("CPF do Consumidor", max_length=14)
    consumidor_telefone = models.CharField("Telefone do Consumidor", max_length=20, blank=True)
    consumidor_email = models.EmailField("E-mail do Consumidor", blank=True)
    
    # Tipo de atendimento
    TIPO_ATENDIMENTO_CHOICES = [
        ('ORIENTACAO', 'Orientação'),
        ('RECLAMACAO', 'Reclamação'),
        ('DENUNCIA', 'Denúncia'),
        ('CONSULTA', 'Consulta'),
        ('OUTROS', 'Outros'),
    ]
    CANAL_ATENDIMENTO_CHOICES = [
        ('BALCAO', 'Balcao Presencial'),
        ('TELEFONE', 'Telefone'),
        ('ONLINE', 'Portal/Online'),
    ]
    tipo_atendimento = models.CharField("Tipo de Atendimento", max_length=20, choices=TIPO_ATENDIMENTO_CHOICES)
    canal_atendimento = models.CharField("Canal do Atendimento", max_length=20, choices=CANAL_ATENDIMENTO_CHOICES, default='BALCAO')
    
    # Status do atendimento
    STATUS_CHOICES = [
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('FINALIZADO', 'Finalizado'),
        ('ENCAMINHADO', 'Encaminhado'),
        ('CANCELADO', 'Cancelado'),
    ]
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='EM_ANDAMENTO')
    
    # Observações
    observacoes = models.TextField("Observações", blank=True)
    resolucao = models.TextField("Resolução", blank=True)
    reclamacao = models.OneToOneField('portal_cidadao.ReclamacaoDenuncia', on_delete=models.SET_NULL, null=True, blank=True, related_name='atendimento', verbose_name="Reclamacao/Denuncia")
    
    # Controle
    duracao_minutos = models.IntegerField("Duração (minutos)", null=True, blank=True)
    satisfacao_consumidor = models.IntegerField("Satisfação do Consumidor", choices=[
        (1, 'Muito Insatisfeito'),
        (2, 'Insatisfeito'),
        (3, 'Neutro'),
        (4, 'Satisfeito'),
        (5, 'Muito Satisfeito'),
    ], null=True, blank=True)
    
    class Meta:
        verbose_name = "Atendimento"
        verbose_name_plural = "Atendimentos"
        ordering = ['-data_atendimento']
    
    def __str__(self):
        return f"Atendimento {self.numero_atendimento} - {self.consumidor_nome}"
    
    def save(self, *args, **kwargs):
        """Gera número automático do atendimento"""
        if not self.numero_atendimento:
            from datetime import datetime
            agora = datetime.now()
            ano = agora.year
            mes = agora.month
            dia = agora.day
            
            # Busca último atendimento do dia
            ultimo = Atendimento.objects.filter(
                data_atendimento__date=agora.date()
            ).order_by('-id').first()
            
            seq = 1
            if ultimo:
                try:
                    seq = int(ultimo.numero_atendimento.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    seq = 1
            
            self.numero_atendimento = f"ATD-{ano}{mes:02d}{dia:02d}-{seq:04d}"
        
        super().save(*args, **kwargs)


class ConfiguracaoAtendimento(models.Model):
    """Configurações do módulo de atendimento"""
    
    # Configurações gerais
    nome_sistema = models.CharField("Nome do Sistema", max_length=100, default="Sistema PROCON")
    versao = models.CharField("Versão", max_length=20, default="1.0.0")
    
    # Configurações de protocolo
    prefixo_protocolo = models.CharField("Prefixo do Protocolo", max_length=10, default="REC")
    sequencia_ano = models.BooleanField("Sequência por Ano", default=True)
    
    # Configurações de prazos
    prazo_resposta_dias = models.IntegerField("Prazo para Resposta (dias)", default=10)
    prazo_conciliacao_dias = models.IntegerField("Prazo para Conciliação (dias)", default=30)
    prazo_decisao_dias = models.IntegerField("Prazo para Decisão (dias)", default=60)
    
    # Configurações de notificação
    notificar_consumidor = models.BooleanField("Notificar Consumidor", default=True)
    notificar_empresa = models.BooleanField("Notificar Empresa", default=True)
    notificar_atendente = models.BooleanField("Notificar Atendente", default=True)
    
    # Configurações de integração
    consultar_receita_federal = models.BooleanField("Consultar Receita Federal", default=True)
    validar_cnpj_automatico = models.BooleanField("Validar CNPJ Automaticamente", default=True)
    
    # Configurações de classificação
    classificacao_automatica = models.BooleanField("Classificação Automática", default=True)
    assuntos_predefinidos = models.JSONField("Assuntos Predefinidos", default=list, blank=True)
    
    # Controle
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Configuração do Atendimento"
        verbose_name_plural = "Configurações do Atendimento"
    
    def __str__(self):
        return f"Configuração - {self.nome_sistema}"
    
    @classmethod
    def get_config(cls):
        """Retorna a configuração ativa ou cria uma padrão"""
        config, created = cls.objects.get_or_create(
            ativo=True,
            defaults={
                'nome_sistema': 'Sistema PROCON',
                'versao': '1.0.0'
            }
        )
        return config


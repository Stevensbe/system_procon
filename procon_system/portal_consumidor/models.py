"""
Modelos para Portal do Consumidor
Sistema Procon - Fase 5 - Portal Externo & Integradores
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinLengthValidator, MaxValueValidator
import uuid
import hashlib


class TipoConsulta(models.TextChoices):
    """Tipos de consulta disponíveis no portal"""
    PROTOCOLO = 'PROTOCOLO', 'Por Número de Protocolo'
    CPF = 'CPF', 'Por CPF'
    EMAIL = 'EMAIL', 'Por E-mail'
    RECLAMACAO = 'RECLAMACAO', 'Por Tipo de Reclamação'
    STATUS = 'STATUS', 'Por Status'


class SessaoConsulta(models.Model):
    """Sessões de consulta do consumidor no portal público"""
    
    STATUS_CHOICES = [
        ('ATIVA', 'Ativa'),
        ('EXPIRADA', 'Expirada'),
        ('LIMITADA', 'Limitada'),
        ('BLOQUEADA', 'Bloqueada'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Identificação da consulta
    token_consulta = models.CharField(max_length=100, unique=True)
    tipo_consulta = models.CharField(max_length=20, choices=TipoConsulta.choices, default=TipoConsulta.PROTOCOLO)
    
    # Dados do solicitante
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    localizacao = models.JSONField(default=dict)  # País, estado, cidade
    
    # Controle de acesso
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_expiracao = models.DateTimeField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ATIVA')
    
    # Limitações de segurança
    tentativas_falhadas = models.PositiveIntegerField(default=0)
    limite_maximo_consultas = models.PositiveIntegerField(default=5)
    consultas_realizadas = models.PositiveIntegerField(default=0)
    
    # Métricas de comportamento
    tempo_total_gastado = models.DurationField(default=timezone.timedelta(0))
    paginas_acessadas = models.JSONField(default=list)
    
    class Meta:
        verbose_name = "Sessão de Consulta"
        verbose_name_plural = "Sessões de Consulta"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Consulta {self.token_consulta[:8]}... - {self.get_status_display()}"
    
    def gerar_token_consulta(self):
        """Gera token único para a sessão de consulta"""
        timestamp = timezone.now().isoformat()
        random_data = f"{timestamp}_{self.ip_address}_{uuid.uuid4().hex}"
        self.token_consulta = hashlib.sha256(random_data.encode()).hexdigest()[:32]
    
    def is_valid(self):
        """Verifica se a sessão ainda está válida"""
        agora = timezone.now()
        return (
            self.status == 'ATIVA' and 
            self.data_expiracao > agora and 
            self.consultas_realizadas < self.limite_maximo_consultas
        )
    
    def incrementar_consulta(self):
        """Incrementa contador de consultas realizadas"""
        self.consultas_realizadas += 1
        if self.consultas_realizadas >= self.limite_maximo_consultas:
            self.status = 'LIMITADA'
        self.save(update_fields=['consultas_realizadas', 'status'])


class HistoricoConsulta(models.Model):
    """Histórico de consultas realizadas pelos consumidores"""
    
    RESULTADO_CHOICES = [
        ('ENCONTRADO', 'Documento Encontrado'),
        ('NAO_ENCONTRADO', 'Documento Não Encontrado'), 
        ('ACESSO_NEGADO', 'Acesso Negado'),
        ('ERRO_TECNICO', 'Erro Técnico'),
    ]
    
    sessao = models.ForeignKey(SessaoConsulta, on_delete=models.CASCADE, related_name='historicos')
    
    # Dados da consulta
    protocolo_buscado = models.CharField(max_length=50, blank=True)
    cpf_informado = models.CharField(max_length=15, blank=True)
    tipo_reclamacao_buscada = models.CharField(max_length=50, blank=True)
    
    # Resultados
    resultado = models.CharField(max_length=20, choices=RESULTADO_CHOICES)
    documentos_encontrados = models.JSONField(default=list)
    quantidade_encontrada = models.PositiveIntegerField(default=0)
    
    # Horário e duração
    data_consulta = models.DateTimeField(auto_now_add=True)
    tempo_gasto_esta_consulta = models.DurationField()
    
    # Feedback do usuário (opcional)
    satisfacao_usuario = models.CharField(
        max_length=20,
        choices=[
            ('MUITO_SATISFEITO', 'Muito Satisfeito'),
            ('SATISFEITO', 'Satisfeito'),
            ('NEUTRO', 'Neutro'),
            ('INSATISFEITO', 'Insatisfeito'),
            ('MUITO_INSATISFEITO', 'Muito Insatisfeito'),
        ],
        blank=True
    )
    comentario_usuario = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Histórico de Consulta"
        verbose_name_plural = "Históricos de Consultas"
        ordering = ['-data_consulta']
    
    def __str__(self):
        return f"Consulta {self.sessao.token_consulta[:8]}... - {self.resultado}"


class DocumentosPortal(models.Model):
    """Templates de documentos específicos para portal do consumidor"""
    
    TIPO_DOCUMENTO_CHOICES = [
        ('CIP_RESPONDIDA', 'CIP Respondida pela Empresa'),
        ('ACORDO_REALIZADO', 'Acordo Realizado'),
        ('AUDIENCIA_AGENDADA', 'Audência Agendada'),
        ('DECISAO_FINAL', 'Decisão Final'),
        ('ORIENTACAO', 'Orientações'),
        ('PROTOCOLO_RESPOSTA', 'Resposta ao Protocolo'),
    ]
    
    VISIBILIDADE_CHOICES = [
        ('PUBLICO', 'Público'),
        ('CONSUMIDOR_LOGOUT', 'Consumidor Deslogado'),
        ('CONSUMIDOR_LOGADO', 'Consumidor Logado'),
        ('RESTRITO', 'Restrito'),
    ]
    
    nome = models.CharField(max_length=150)
    tipo_documento = models.CharField(max_length=30, choices=TIPO_DOCUMENTO_CHOICES)
    visibilidade = models.CharField(max_length=20, choices=VISIBILIDADE_CHOICES, default='PUBLICO')
    
    # Conteúdo do documento
    titulo_template = models.CharField(max_length=200)
    conteudo_template = models.TextField()
    placeholder_formats = models.JSONField(default=list)  # {"nome": "{consumidor_nome}"}
    
    # Configurações de exibição
    mostrar_data = models.BooleanField(default=True)
    mostrar_protocolo = models.BooleanField(default=True)
    permitir_download = models.BooleanField(default=True)
    aplicar_watermark = models.BooleanField(default=False)
    
    # Organização
    categoria = models.CharField(max_length=50, blank=True)
    ordem_exibicao = models.PositiveIntegerField(default=0)
    ativo = models.BooleanField(default=True)
    
    # Controle de acesso
    exigir_validacao_codigo = models.BooleanField(default=False)
    codigo_acesso_padrao = models.CharField(max_length=20, blank=True)
    
    class Meta:
        verbose_name = "Documento do Portal"
        verbose_name_plural = "Documentos do Portal"
        ordering = ['categoria', 'ordem_exibicao', 'tipo_documento']
    
    def __str__(self):
        return f"{self.tipo_documento} - {self.nome}"
    
    def renderizar_documento(self, dados_contexto: dict) -> str:
        """Renderiza o documento com dados específicos"""
        conteudo = self.conteudo_template
        
        # Substituição de placeholders
        for placeholder, valor in dados_contexto.items():
            conteudo = conteudo.replace(placeholder, str(valor))
        
        return conteudo


class NotificacaoConsumidor(models.Model):
    """Central de notificações para consumidores"""
    
    CANAL_CHOICES = [
        ('EMAIL', 'E-mail'),
        ('SMS', 'SMS'),
        ('WHATSAPP', 'WhatsApp'),
        ('TELEGRAM', 'Telegram'),
        ('NOTIFICACAO_SITE', 'Notificação no Site'),
        ('PUSH_MOBILE', 'Push Mobile'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('CRTICA', 'Crítica'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Destinatário
    consumidor_email = models.EmailField()
    consumidor_telefone = models.CharField(max_length=20, blank=True)
    consumidor_cpf = models.CharField(max_length=15, blank=True)
    
    # Conteúdo da notificação
    titulo = models.CharField(max_length=150)
    mensagem = models.TextField()
    canal_escolhido = models.CharField(max_length=20, choices=CANAL_CHOICES, default='EMAIL')
    prioridade = models.CharField(max_length=10, choices=PRIORIDADE_CHOICES, default='NORMAL')
    
    # Vinculações
    protocolo_relacionado = models.CharField(max_length=50, blank=True)
    tipo_reclamacao_relacionada = models.CharField(max_length=50, blank=True)
    
    # Controle temporal
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_envio_programada = models.DateTimeField(null=True, blank=True)
    data_envio_real = models.DateTimeField(null=True, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('AGUARDANDO', 'Aguardando'),
        ('ENVIANDO', 'Enviando'),
        ('ENVIADA', 'Enviada'),
        ('FALHA_ENVIO', 'Falha no Envio'),
        ('ENTREGA_CONFIRMADA', 'Entrega Confirmada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AGUARDANDO')
    tentativas_envio = models.PositiveIntegerField(default=0)
    maximo_tentativas = models.PositiveIntegerField(default=3)
    
    # Resultados
    codigo_entrega = models.CharField(max_length=100, blank=True)
    detalhes_entrega = models.JSONField(default=dict)
    erro_envio = models.TextField(blank=True)
    
    # Interação do usuário
    data_leitura = models.DateTimeField(null=True, blank=True)
    data_interacao = models.DateTimeField(null=True, blank=True)
    tipo_interacao = models.CharField(
        max_length=30,
        choices=[
            ('CLICOU_LINK', 'Clicou no Link'),
            ('ABRIU_DOCUMENTO', 'Abriu Documento'),
            ('RESPONDEU_MENSAGEM', 'Respondeu Mensagem'),
            ('OUTROS', 'Outros'),
        ],
        blank=True
    )
    
    class Meta:
        verbose_name = "Notificação do Consumidor"
        verbose_name_plural = "Notificações do Consumidor"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Notificação {self.get_canal_display()} - {self.titulo}"
    
    def pode_tentar_enviar_novamente(self) -> bool:
        """Verifica se pode tentar enviar novamente"""
        return self.tentativas_envio < self.maximo_tentativas and self.status in ['AGUARDANDO', 'FALHA_ENVIO']
    
    def incrementar_tentativa(self):
        """Incrementa contador de tentativas"""
        self.tentativas_envio += 1
        if self.tentativas_envio >= self.maximo_tentativas:
            self.status = 'FALHA_ENVIO'
        self.save(update_fields=['tentativas_envio', 'status'])


class FeedbackConsumidor(models.Model):
    """Sistema de feedback dos consumidores sobre o portal"""
    
    tipo_feedback_choices = [
        ('USABILIDADE', 'Usabilidade do Portal'),
        ('PROCESSO_TRAMATACAO', 'Processo de Tramitação'),
        ('ATENDIMENTO_PROCON', 'Atendimento do PROCON'),
        ('RESPOSTA_EMPRESA', 'Resposta da Empresa'),
        ('RESOLYCAO_FINAL', 'Resolução Final'),
        ('GERAL', 'Feedback Geral'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Informações do consumidor
    consumidor_email = models.EmailField(blank=True)
    consumidor_cpf = models.CharField(max_length=15, blank=True)  # Opcional para preservar privacidade
    
    # Feedback específico
    tipo_feedback = models.CharField(max_length=30, choices=tipo_feedback_choices)
    protocolo_relacionado = models.CharField(max_length=50, blank=True)
    
    # Avaliação
    nota_geral = models.PositiveIntegerField(
        validators=[MaxValueValidator(10)],
        help_text="Nota de 1 a 10"
    )
    
    # Comentários
    aspecto_positivo = models.TextField(blank=True, help_text="O que funcionou bem?")
    aspecto_melhoria = models.TextField(blank=True, help_text="O que pode ser melhorado?")
    sugestoes = models.TextField(blank=True, help_text="Sugestões específicas")
    
    # Classificação automática de sentimento (se disponível)
    analise_sentimento = models.CharField(
        max_length=20,
        choices=[
            ('MUITO_POSITIVO', 'Muito Positivo'),
            ('POSITIVO', 'Positivo'),
            ('NEUTRO', 'Neutro'),
            ('NEGATIVO', 'Negativo'),
            ('MUITO_NEGATIVO', 'Muito Negativo'),
        ],
        blank=True
    )
    confianca_analise_sentimento = models.FloatField(null=True, blank=True, help_text="Confiância da análise (0-1)")
    
    # Metadados
    data_feedback = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Ações tomadas
    revisado = models.BooleanField(default=False)
    revisado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks_revisados')
    data_revisao = models.DateTimeField(null=True, blank=True)
    acoes_tomadas = models.TextField(blank=True)
    
    # Categorização para análise
    categoria_feedback = models.CharField(max_length=50, blank=True)  # Pode ser preenchida automaticamente
    tags = models.JSONField(default=list)
    
    class Meta:
        verbose_name = "Feedback do Consumidor"
        verbose_name_plural = "Feedbacks do Consumidor"
        ordering = ['-data_feedback']
    
    def __str__(self):
        return f"Feedback {self.consumidor_email[:10]}... - {self.get_tipo_feedback_display()}"


# Função para definir valor padrão para JSON fields
def dict_blank():
    return {}

def list_blank():
    return []

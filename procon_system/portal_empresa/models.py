"""
Modelos para Portal da Empresa
Sistema Procon - Fase 5 - Portal Externo & Integradores
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid
import hashlib


class EmpresaAutorizada(models.Model):
    """Empresas autorizadas a acessar o portal"""
    
    STATUS_CHOICES = [
        ('ATIVA', 'Ativa'),
        ('PENDING_CONF', 'Aguardando Confirmação'),
        ('SUSPENSA', 'Suspensa'),
        ('BLOQUEADA', 'Bloqueada'),
        ('REVOGADA', 'Revogada'),
    ]
    
    NIVEL_ACESSO_CHOICES = [
        ('BASIC', 'Básico'),
        ('STANDARD', 'Standard'),
        ('PREMIUM', 'Premium'),
        ('ENTERPRISE', 'Enterprise'),
    ]
    
    # Identificação da empresa
    razao_social = models.CharField(max_length=200, unique=True)
    nome_fantasia = models.CharField(max_length=200, blank=True)
    cnpj = models.CharField(
        max_length=18,
        validators=[RegexValidator(
            regex=r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$',
            message='CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'
        )],
        unique=True
    )
    
    # Contatos principais
    email_principal = models.EmailField()
    telefone_principal = models.CharField(max_length=20, blank=True)
    responsavel_legal = models.CharField(max_length=150)
    
    # Endereço
    endereco_completo = models.TextField()
    cidade = models.CharField(max_length=100)
    estado = models.CharField(max_length=2)
    cep = models.CharField(max_length=10)
    
    # Configurações de acesso
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_CONF')
    nivel_acesso = models.CharField(max_length=15, choices=NIVEL_ACESSO_CHOICES, default='BASIC')
    
    # Usuários autorizados
    usuarios_autorizados = models.ManyToManyField(
        User,
        through='UsuarioEmpresaAutorizado',
        related_name='empresas_autorizadas',
        blank=True
    )
    
    # Chaves de acesso
    api_key = models.CharField(max_length=100, blank=True)
    webhook_endpoint = models.URLField(blank=True)
    
    # Controle temporal
    data_registro = models.DateTimeField(auto_now_add=True)
    data_ultimo_acesso = models.DateTimeField(null=True, blank=True)
    data_expiracao_acesso = models.DateTimeField(null=True, blank=True)
    
    # Configurações de notificação
    receber_notificacoes_cip = models.BooleanField(default=True)
    receber_notificacoes_audiencia = models.BooleanField(default=True)
    receber_comunicacoes_gerais = models.BooleanField(default=True)
    canal_contato_preferencial = models.CharField(
        max_length=20,
        choices=[
            ('EMAIL', 'E-mail'),
            ('WEBHOOK', 'Webhook API'),
            ('AMBOS', 'Ambos'),
        ],
        default='EMAIL'
    )
    
    # Configurações de integração
    integracao_automatica = models.BooleanField(default=False)
    sistema_interno_nome = models.CharField(max_length=100, blank=True)
    sistema_interno_url = models.URLField(blank=True)
    
    class Meta:
        verbose_name = "Empresa Autorizada"
        verbose_name_plural = "Empresas Autorizadas"
        ordering = ['razao_social']
    
    def __str__(self):
        return f"{self.razao_social} ({self.cnpj})"
    
    def gerar_api_key(self):
        """Gera chave única de API para a empresa"""
        timestamp = timezone.now().isoformat()
        random_data = f"{timestamp}_{self.cnpj}_{uuid.uuid4().hex}"
        self.api_key = hashlib.sha256(random_data.encode()).hexdigest()[:32]
    
    def autorizar_usuario(self, usuario: User, nivel: str='STANDARD'):
        """Autoriza um usuário para a empresa"""
        UsuarioEmpresaAutorizado.objects.get_or_create(
            empresa=self,
            usuario=usuario,
            defaults={
                'nivel_permissao': nivel,
                'pode_responder_cip': True,
                'pode_agendar_audiencia': True,
                'pode_visualizar_relatorios': True,
            }
        )


class UsuarioEmpresaAutorizado(models.Model):
    """Usuários autorizados para representar empresas"""
    
    NIVEL_PERMISSAO_CHOICES = [
        ('VIEWER', 'Visualização'),
        ('STANDARD', 'Padrão'),
        ('ADMIN', 'Administrador'),
        ('LEGAL', 'Representante Legal'),
    ]
    
    empresa = models.ForeignKey(EmpresaAutorizada, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Permissões específicas
    nivel_permissao = models.CharField(max_length=15, choices=NIVEL_PERMISSAO_CHOICES, default='STANDARD')
    pode_responder_cip = models.BooleanField(default=True)
    pode_agendar_audiencia = models.BooleanField(default=True)
    pode_visualizar_relatorios = models.BooleanField(default=True)
    pode_configurar_webhook = models.BooleanField(default=False)
    pode_gerenciar_usuarios = models.BooleanField(default=False)
    
    # Controle de acesso
    data_autorizacao = models.DateTimeField(auto_now_add=True)
    data_ultimo_acesso = models.DateTimeField(null=True, blank=True)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['empresa', 'usuario']
        verbose_name = "Usuário Autorizado da Empresa"
        verbose_name_plural = "Usuários Autorizados de Empresas"
    
    def __str__(self):
        return f"{self.usuario.username} → {self.empresa.razao_social} ({self.nivel_permissao})"


class TokenEmpresa(models.Model):
    """Tokens de acesso temporário para empresas"""
    
    empresa = models.ForeignKey(EmpresaAutorizada, on_delete=models.CASCADE)
    usuario_criador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Token de acesso
    token = models.CharField(max_length=100, unique=True)
    refresh_token = models.CharField(max_length=100, unique=True, blank=True)
    
    # Controle temporal
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_expiracao = models.DateTimeField()
    usado_em = models.DateTimeField(null=True, blank=True)
    
    # Máscaras de permissão
    escopo_permitido = models.JSONField(default=list)  # ['read_cips', 'write_responses', 'api_access']
    ips_permitidos = models.JSONField(default=list)    # Whitelist de IPs
    
    # Métricas de uso
    contador_acesso = models.PositiveIntegerField(default=0)
    ultimo_ip_acesso = models.GenericIPAddressField(null=True, blank=True)
    
    # Status
    ativo = models.BooleanField(default=True)
    revogado_em = models.DateTimeField(null=True, blank=True)
    motivo_revocacao = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Token de Empresa"
        verbose_name_plural = "Tokens de Empresa"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Token {self.empresa.razao_social} - {self.token[:8]}..."
    
    def gerar_tokens(self):
        """Gera tokens únicos de acesso"""
        timestamp = timezone.now().isoformat()
        
        # Token principal
        access_data = f"access_{timestamp}_{self.empresa.cnpj}_{uuid.uuid4().hex}"
        self.token = hashlib.sha256(access_data.encode()).hexdigest()
        
        # Refresh token
        refresh_data = f"refresh_{timestamp}_{self.empresa.cnpj}_{uuid.uuid4().hex}"
        self.refresh_token = hashlib.sha256(refresh_data.encode()).hexdigest()
        
        # Configurar expiração (30 dias por padrão)
        self.data_expiracao = timezone.now() + timezone.timedelta(days=30)
    
    def is_valid(self, ip_acesso: str='') -> bool:
        """Verifica se o token ainda é válido"""
        agora = timezone.now()
        
        if not self.ativo or agora > self.data_expiracao:
            return False
        
        if self.ips_permitidos and ip_acesso and ip_acesso not in self.ips_permitidos:
            return False
        
        return True


class RespostaEmpresaPortal(models.Model):
    """Respostas formais enviadas pelas empresas através do portal"""
    
    TIPO_DOCUMENTO_CHOICES = [
        ('DEFESA_CIP', 'Defesa de CIP'),
        ('RESPOSTA_ALEGACOES', 'Resposta às Alegações'),
        ('PROPOSTA_ACORDOS', 'Proposta de Acordo'),
        ('COMPLEMENTACAO_DOCS', 'Complementação de Documentos'),
        ('SOLICITA_CLARIFICACAO', 'Solicitação de Esclarecimento'),
        ('PROTESTA_DECISAO', 'Protesto de Decisão'),
    ]
    
    STATUS_CHOICES = [
        ('RASCUNHO', 'Rascunho'),
        ('ENVIADA', 'Enviada'),
        ('RECEBIDA_AUDITORIA', 'Recebida para Auditoria'),
        ('ANALISANDO', 'Analisando'),
        ('ACEITA', 'Aceita'),
        ('REJEITADA', 'Rejeitada'),
        ('SOLICITA_COMPLEMENTO', 'Solicita Complemento'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Empresa remetente
    empresa = models.ForeignKey(EmpresaAutorizada, on_delete=models.CASCADE, related_name='respostas_enviadas')
    usuario_enviador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    token_usado = models.ForeignKey(TokenEmpresa, on_delete=models.SET_NULL, null=True)
    
    # Documentos relacionados
    cip_relacionada = models.ForeignKey('cip_automatica.CIPAutomatica', on_delete=models.CASCADE, null=True)
    audiencia_relacionada = models.ForeignKey('audiencia_calendario.AgendamentoAudiencia', on_delete=models.SET_NULL, null=True)
    
    # Conteúdo da resposta
    tipo_documento = models.CharField(max_length=25, choices=TIPO_DOCUMENTO_CHOICES)
    titulo_resposta = models.CharField(max_length=200)
    conteudo_resposta = models.TextField()
    
    # Documentos anexos
    documentos_anexados = models.JSONField(default=list)
    quantidade_anexos = models.PositiveIntegerField(default=0)
    
    # Proposta financeira (se aplicável)
    valor_proposta = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    prazo_pagamento_proposta = models.PositiveIntegerField(null=True, blank=True)  # dias
    forma_pagamento_proposta = models.CharField(max_length=50, blank=True)
    
    # Status e controle
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='RASCUNHO')
    
    # Controle temporal
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_envio = models.DateTimeField(null=True, blank=True)
    data_recebimento = models.DateTimeField(null=True, blank=True)
    prazo_analise = models.DateTimeField(null=True, blank=True)
    
    # Auditoria
    revisado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='respostas_auditoradas')
    data_revisao = models.DateTimeField(null=True, blank=True)
    parecer_revisor = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Resposta Empresa Portal"
        verbose_name_plural = "Respostas Empresa Portal"
        ordering = ['-data_envio', '-data_criacao']
    
    def __str__(self):
        return f"Resposta {self.get_tipo_documento_display()} - {self.empresa.razao_social}"
    
    def enviar_resposta(self):
        """Envia resposta formalmente"""
        if self.status != 'RASCUNHO':
            raise ValueError("Apenas rascunhos podem ser enviados")
        
        self.status = 'ENVIADA'
        self.data_envio = timezone.now()
        
        # Definir prazo de análise (5 dias úteis)
        from datetime import timedelta
        self.prazo_analise = timezone.now() + timedelta(days=5)
        
        self.save()
        
        # TODO: Notificar responsáveis no PROCON
        # TODO: Atualizar status da CIP/Audiência relacionada


class HistoricoEmpresaPortal(models.Model):
    """Histórico de ações realizadas pelas empresas no portal"""
    
    TIPO_ACAO_CHOICES = [
        ('LOGIN', 'Login'),
        ('VIEW_CIP', 'Visualização de CIP'),
        ('RESPONSE_CIP', 'Resposta a CIP'),
        ('VIEW_AUDIENCE', 'Visualização de Audiência'),
        ('SCHEDULE_AUDIENCE', 'Agendamento de Audiência'),
        ('DOWNLOAD_DOCS', 'Download de Documentos'),
        ('API_ACCESS', 'Acesso via API'),
        ('CONFIG_WEBHOOK', 'Configuração de Webhook'),
        ('ADMIN_USER', 'Administração de Usuários'),
        ('VIEW_REPORTS', 'Visualização de Relatórios'),
    ]
    
    empresa = models.ForeignKey(EmpresaAutorizada, on_delete=models.CASCADE, related_name='historico_acoes')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Ação realizada
    tipo_acao = models.CharField(max_length=20, choices=TIPO_ACAO_CHOICES)
    descricao_acao = models.TextField()
    
    # Contexto
    protocolo_relacionado = models.CharField(max_length=50, blank=True)
    
    # Metadados técnicos
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    token_usado = models.ForeignKey(TokenEmpresa, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Resultado
    sucesso = models.BooleanField(default=True)
    detalhes_resultado = models.JSONField(default=dict)
    
    # Timestamp
    data_acao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Histórico Empresa Portal"
        verbose_name_plural = "Históricos Empresa Portal"
        ordering = ['-data_acao']
    
    def __str__(self):
        return f"{self.empresa.razao_social} - {self.get_tipo_acao_display()}"


class WebhookConfiguration(models.Model):
    """Configurações de webhooks para integração automatizada"""
    
    empresa = models.ForeignKey(EmpresaAutorizada, on_delete=models.CASCADE, related_name='webhooks')
    
    # Configuração do webhook
    nome_webhook = models.CharField(max_length=100)
    endpoint_url = models.URLField()
    eventos_suscritos = models.JSONField(default=list)  # ['cip_received', 'audience_scheduled', 'document_shared']
    
    # Segurança
    secret_key = models.CharField(max_length=100)
    verificar_ssl = models.BooleanField(default=True)
    timeout_segundos = models.PositiveIntegerField(default=30)
    
    # Status
    ativo = models.BooleanField(default=True)
    ultimo_test_success = models.DateTimeField(null=True, blank=True)
    contador_enviadas = models.PositiveIntegerField(default=0)
    contador_falhas = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Configuração de Webhook"
        verbose_name_plural = "Configurações de Webhook"
    
    def __str__(self):
        return f"Webhook {self.nome_webhook} - {self.empresa.razao_social}"


class APIAnalytics(models.Model):
    """Análise de uso da API pelo portal da empresa"""
    
    empresa = models.ForeignKey(EmpresaAutorizada, on_delete=models.CASCADE, related_name='analytics_api')
    token = models.ForeignKey(TokenEmpresa, on_delete=models.CASCADE, null=True)
    
    # Métricas de uso
    data_analise = models.DateField(default=timezone.now)
    total_requests = models.PositiveIntegerField(default=0)
    requests_success = models.PositiveIntegerField(default=0)
    requests_failed = models.PositiveIntegerField(default=0)
    
    # Endpoints mais utilizados
    endpoints_usados = models.JSONField(default=dict)
    
    # Performance
    tempo_resposta_medio_ms = models.FloatField(default=0)
    maior_tempo_resposta_ms = models.FloatField(default=0)
    
    # Cargas
    bandwidth_consumida_mb = models.FloatField(default=0)
    
    class Meta:
        verbose_name = "Analytics API"
        verbose_name_plural = "Analytics APIs"
        ordering = ['-data_analise']
    
    def __str__(self):
        return f"Analytics {self.empresa.razao_social} - {self.data_analise}"

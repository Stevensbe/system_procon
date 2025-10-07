"""
Modelos para Integração com APIs Externas
Sistema Procon - Fase 5 - Portal Externo & Integradores
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid


class OrgaoExterno(models.Model):
    """Órgãos externos integrados ao sistema"""
    
    TIPO_ORGAO_CHOICES = [
        ('MINISTERIO_PUBLICO', 'Ministério Público'),
        ('JUDICIARIO', 'Poder Judiciário'),
        ('SECADRIO_AGROPECUARIA', 'Secretaria de Agricultura'),
        ('ANATEL', 'ANATEL'),
        ('ANVISA', 'ANVISA'),
        ('ANAC', 'ANAC'),
        ('ABNT', 'Fundo de Defesa do Direito Difuso'),
        ('PROCON_JURIDICO', 'Outros PROCONs'),
        ('AUTO_REGULACAO', 'Órgãos de Autorregulação'),
        ('DEFESA_CONSUMIDOR', 'Órgãos de Defesa do Consumidor'),
    ]
    
    STATUS_CHOICES = [
        ('ATIVO', 'Ativo'),
        ('INATIVO', 'Inativo'),
        ('SUSPENSO', 'Suspenso'),
        ('MANUTENCAO', 'Em Manutenção'),
    ]
    
    # Identificação do órgão
    nome = models.CharField(max_length=200, unique=True)
    codigo_identificacao = models.CharField(max_length=50, unique=True)  # Ex: "MP_SP", "TJ_SP"
    tipo_orgao = models.CharField(max_length=30, choices=TIPO_ORGAO_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ATIVO')
    
    # Contatos
    email_contato = models.EmailField(blank=True)
    telefone_contato = models.CharField(max_length=20, blank=True)
    responsavel_contato = models.CharField(blank=True, max_length=150)
    
    # Endereço
    endereco_completo = models.TextField(blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=2, blank=True)
    
    # Configurações de integração
    possui_api_integrada = models.BooleanField(default=False)
    api_endpoint_base = models.URLField(blank=True)
    api_authentication_type = models.CharField(
        max_length=25,
        choices=[
            ('TOKEN', 'Token Bearer'),
            ('API_KEY', 'API Key'),
            ('OAUTH2', 'OAuth 2.0'),
            ('BASIC_AUTH', 'Basic Authentication'),
            ('CERTIFICATE', 'Certificate'),
        ],
        default='TOKEN'
    )
    
    # Configurações de envio automático
    automatic_sync_enabled = models.BooleanField(default=False)
    automatic_sync_interval_hours = models.PositiveIntegerField(default=24)
    tipos_documentos_enviados = models.JSONField(default=list)  # ['reclamacoes', 'cips', 'audiencias']
    
    # Controle temporal
    data_registro = models.DateTimeField(auto_now_add=True)
    data_ultimo_sync = models.DateTimeField(null=True, blank=True)
    data_proximo_sync = models.DateTimeField(null=True, blank=True)
    
    # Configurações de formato
    formato_dados = models.CharField(
        max_length=15,
        choices=[
            ('JSON', 'JSON'),
            ('XML', 'XML'),
            ('SOAP', 'SOAP'),
            ('EDI', 'EDI'),
            ('CSV', 'CSV'),
        ],
        default='JSON'
    )
    
    # Configurações de segurança
    require_ssl = models.BooleanField(default=True)
    timeout_segundos = models.PositiveIntegerField(default=30)
    retry_max_tentativas = models.PositiveIntegerField(default=3)
    
    class Meta:
        verbose_name = "Órgão Externo"
        verbose_name_plural = "Órgãos Externos"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} ({self.tipo_orgao})"


class CredencialAcesso(models.Model):
    """Credenciais de acesso para órgãos externos"""
    
    STATUS_CHOICES = [
        ('ATIVA', 'Ativa'),
        ('EXPIREU', 'Expirada'),
        ('REVOGADA', 'Revogada'),
        ('BLOQUEADA', 'Bloqueada'),
    ]
    
    orgao = models.ForeignKey(OrgaoExterno, on_delete=models.CASCADE, related_name='credenciais')
    
    # Credenciais gerais
    nome_credencial = models.CharField(max_length=100)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ATIVO')
    
    # Autenticação específica
    api_key_value = models.CharField(max_length=500, blank=True)
    bearer_token = models.TextField(blank=True)
    username_auth = models.CharField(max_length=100, blank=True)
    password_auth = models.CharField(max_length=100, blank=True)
    certificate_file = models.FileField(upload_to='certificates/', blank=True)
    
    # Controle temporal
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_expiracao = models.DateTimeField(null=True, blank=True)
    data_ultimo_usado = models.DateTimeField(null=True, blank=True)
    
    # Quem gerencia
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    responsavel_atual = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='credenciais_permitido')
    
    # Ambiente
    ambiente = models.CharField(
        max_length=15,
        choices=[
            ('DESENVOLVIMENTO', 'Desenvolvimento'),
            ('HOMOLOGACAO', 'Homologação'),
            ('PRODUCAO', 'Produção'),
        ],
        default='PRODUCAO'
    )
    
    # Configurações específicas
    escopo_limitado = models.JSONField(default=list)  # APIs/eserviços específicos
    limite_requests_hora = models.PositiveIntegerField(default=1000)
    
    class Meta:
        verbose_name = "Credencial de Acesso"
        verbose_name_plural = "Credenciais de Acesso"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Credencial {self.nome_credencial} - {self.orgao.nome}"
    
    def is_valid(self) -> bool:
        """Verifica se a credencial ainda é válida"""
        agora = timezone.now()
        return (
            self.status == 'ATIVA' and 
            (not self.data_expiracao or self.data_expiracao > agora)
        )


class EnvioDocumentoExterno(models.Model):
    """Registro de documentos enviados para órgãos externos"""
    
    STATUS_ENVIO_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('ENVIANDO', 'Enviando'),
        ('ENVIADO', 'Enviado'),
        ('ACEITO', 'Aceito'),
        ('REJEITADO', 'Rejeitado'),
        ('ERRO_ENVIO', 'Erro no Envio'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    TIPO_DOCUMENTO_CHOICES = [
        ('RECLAMACAO_INICIAL', 'Reclamação Inicial'),
        ('CIP_ENVIADA', 'CIP Enviada'),
        ('RESPOSTA_EMPRESA', 'Resposta da Empresa'),
        ('ACORDO_REALIZADO', 'Acordo Realizado'),
        ('DECISE_FINAL', 'Decisão Final'),
        ('RELATORIO_PERIODICO', 'Relatório Periódico'),
        ('CONSULTA_STATUS', 'Consulta de Status'),
        ('DOCUMENTO_PORTAL', 'Documento do Portal'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Órgão de destino
    orgao_destino = models.ForeignKey(OrgaoExterno, on_delete=models.CASCADE, related_name='envios_recebidos')
    credencial_usada = models.ForeignKey(CredencialAcesso, on_delete=models.SET_NULL, null=True)
    
    # Documento interno relacionado
    tipo_documento = models.CharField(max_length=25, choices=TIPO_DOCUMENTO_CHOICES)
    protocolo_interno = models.CharField(max_length=50)
    cip_relacionada = models.ForeignKey('cip_automatica.CIPAutomatica', on_delete=models.SET_NULL, null=True, blank=True)
    audiencia_relacionada = models.ForeignKey('audiencia_calendario.AgendamentoAudiencia', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Conteúdo do envio
    dados_enviados = models.JSONField(default=dict)
    payload_completo = models.TextField()  # JSON estruturado enviado
    
    # Controle de envio
    status_envio = models.CharField(max_length=15, choices=STATUS_ENVIO_CHOICES, default='PENDENTE')
    tentativas_envio = models.PositiveIntegerField(default=0)
    maximo_tentativas = models.PositiveIntegerField(default=5)
    
    # Timestamps
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_envio = models.DateTimeField(null=True, blank=True)
    data_aceite_rejeicao = models.DateTimeField(null=True, blank=True)
    
    # Resposta do órgão externo
    protocolo_externo = models.CharField(max_length=100, blank=True)
    codigo_resposta_http = models.PositiveIntegerField(null=True, blank=True)
    resposta_orcao_externo = models.TextField(blank=True)
    header_resposta = models.JSONField(default=dict)
    
    # Erros e observações
    erro_envio = models.TextField(blank=True)
    detalhes_erro = models.JSONField(default=dict)
    
    # Controle administrativo
    enviado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    observacoes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Envio Documento Externo"
        verbose_name_plural = "Envios Documento Externo"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"Envio {self.get_tipo_documento_display()} → {self.orgao_destino.nome}"


class TemplateIntegracao(models.Model):
    """Templates de integração com órgãos específicos"""
    
    orgao = models.ForeignKey(OrgaoExterno, on_delete=models.CASCADE, related_name='templates_integracao')
    
    nome_template = models.CharField(max_length=150)
    tipo_documento_aplicavel = models.CharField(max_length=25, choices=EnvioDocumentoExterno.TIPO_DOCUMENTO_CHOICES)
    versao_template = models.CharField(max_length=10, default='1.0')
    
    # Template do payload
    template_payload = models.TextField()
    campos_obrigatorios = models.JSONField(default=list)
    campos_opcionais = models.JSONField(default=list)
    
    # Validações
    url_envio = models.URLField()
    metodo_http = models.CharField(
        max_length=10,
        choices=[
            ('POST', 'POST'),
            ('PUT', 'PUT'),
            ('PATCH', 'PATCH'),
        ],
        default='POST'
    )
    
    # Configurações do template
    ativo = models.BooleanField(default=True)
    require_validação = models.BooleanField(default=True)
    
    # Controle
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['orgao', 'tipo_documento_aplicavel', 'versao_template']
        verbose_name = "Template de Integração"
        verbose_name_plural = "Templates de Integração"
        ordering = ['orgao', 'tipo_documento_aplicavel']
    
    def __str__(self):
        return f"{self.orgao.nome} - {self.get_tipo_documento_aplicavel_display()}"


class EventoIntegracao(models.Model):
    """Eventos disparados por integrações"""
    
    TIPO_EVENTO_CHOICES = [
        ('ENVIO_SUCESSO', 'Envio Bem-Sucedido'),
        ('ENVIO_FALHA', 'Falha no Envio'),
        ('RESPOSTA_RECEITA', 'Resposta Recebida'),
        ('SYNC_AUTOMATICO', 'Sincronização Automática'),
        ('CREDENTIAL_EXPIRED', 'Credencial Expirada'),
        ('API_CHANGED', 'Mudanças na API'),
        ('ERROR_THRESHOLD', 'Limite de Erros'),
    ]
    
    SEVERITY_CHOICES = [
        ('LOW', 'Baixa'),
        ('MEDIUM', 'Média'),
        ('HIGH', 'Alta'),
        ('CRITICAL', 'Crítica'),
    ]
    
    tipo_evento = models.CharField(max_length=25, choices=TIPO_EVENTO_CHOICES)
    orgao_relacionado = models.ForeignKey(OrgaoExterno, on_delete=models.CASCADE, null=True)
    envio_relacionado = models.ForeignKey(EnvioDocumentoExterno, on_delete=models.CASCADE, null=True)
    
    # Detalhes do evento
    titulo_evento = models.CharField(max_length=200)
    descricao_evento = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='MEDIUM')
    
    # Dados contextuais
    dados_evento = models.JSONField(default=dict)
    
    # Controle
    processado = models.BooleanField(default=False)
    data_evento = models.DateTimeField(auto_now_add=True)
    processado_em = models.DateTimeField(null=True, blank=True)
    
    # Ações tomadas
    acoes_tomadas = models.TextField(blank=True)
    notificacoes_enviadas = models.JSONField(default=list)
    
    class Meta:
        verbose_name = "Evento de Integração"
        verbose_name_plural = "Eventos de Integração"
        ordering = ['-data_evento', '-severity']
    
    def __str__(self):
        return f"{self.get_tipo_evento_display()} - {self.titulo_evento}"


class MetricasIntegracao(models.Model):
    """Métricas de performance das integrações"""
    
    orgao = models.ForeignKey(OrgaoExterno, on_delete=models.CASCADE, related_name='metricas')
    
    # Período de análise
    data_analise = models.DateField(default=timezone.now)
    periodo_horas = models.PositiveIntegerField(default=24)
    
    # Métricas de envio
    total_envios = models.PositiveIntegerField(default=0)
    envios_sucesso = models.PositiveIntegerField(default=0)
    envios_falha = models.PositiveIntegerField(default=0)
    taxa_sucesso_percent = models.FloatField(default=0)
    
    # Performance
    tempo_resposta_medio_ms = models.FloatField(default=0)
    tempo_resposta_max_ms = models.FloatField(default=0)
    
    # Recursos
    bandwidth_usado_mb = models.FloatField(default=0)
    requests_api_feitos = models.PositiveIntegerField(default=0)
    
    # Alertas
    limite_erro_atingido = models.BooleanField(default=False)
    sla_atingido = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['orgao', 'data_analise', 'periodo_horas']
        verbose_name = "Métricas de Integração"
        verbose_name_plural = "Métricas de Integração"
        ordering = ['-data_analise']
    
    def __str__(self):
        return f"Métricas {self.orgao.nome} - {self.data_analise}"

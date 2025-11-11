"""
Modelos para Integrações Governamentais
Fase 6 – Camada de conectores, sincronizações e eventos externos
"""

from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class IntegrationConnector(models.Model):
    """Configuração de conectores com órgãos governamentais."""

    AUTH_TYPE_CHOICES = [
        ("JWT", "JWT"),
        ("API_KEY", "API Key"),
        ("CERTIFICATE", "Certificado"),
        ("BASIC", "Basic Auth"),
        ("NONE", "Sem Autenticação"),
    ]

    nome = models.CharField("Nome do Conector", max_length=120)
    slug = models.SlugField("Slug", unique=True, max_length=80)
    orgao_responsavel = models.CharField("Órgão Responsável", max_length=150)
    descricao = models.TextField("Descrição", blank=True)

    endpoint_base = models.URLField("Endpoint Base")
    tipo_autenticacao = models.CharField("Tipo de Autenticação", max_length=20, choices=AUTH_TYPE_CHOICES, default="API_KEY")
    configuracao_credenciais = models.JSONField("Configuração de Credenciais", default=dict, blank=True)
    configuracao_headers = models.JSONField("Headers Padrão", default=dict, blank=True)
    configuracao_parametros = models.JSONField("Parâmetros Padrão", default=dict, blank=True)

    ativo = models.BooleanField("Ativo", default=True)
    ultima_sincronizacao = models.DateTimeField("Última sincronização", null=True, blank=True)
    proxima_sincronizacao = models.DateTimeField("Próxima sincronização", null=True, blank=True)

    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="connectores_criados")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Conector Governamental"
        verbose_name_plural = "Conectores Governamentais"
        ordering = ["orgao_responsavel", "nome"]

    def __str__(self):
        return f"{self.orgao_responsavel} - {self.nome}"


class IntegrationSyncRun(models.Model):
    """Registro de execuções de sincronização com órgãos externos."""

    STATUS_CHOICES = [
        ("PENDENTE", "Pendente"),
        ("EXECUTANDO", "Executando"),
        ("SUCESSO", "Sucesso"),
        ("ERRO", "Erro"),
        ("CANCELADO", "Cancelado"),
    ]

    connector = models.ForeignKey(IntegrationConnector, on_delete=models.CASCADE, related_name="execucoes")
    iniciado_em = models.DateTimeField("Iniciado em", auto_now_add=True)
    finalizado_em = models.DateTimeField("Finalizado em", null=True, blank=True)
    status = models.CharField("Status", max_length=12, choices=STATUS_CHOICES, default="PENDENTE")
    payload_envio = models.JSONField("Payload Enviado", default=dict, blank=True)
    retorno_bruto = models.JSONField("Retorno Bruto", default=dict, blank=True)
    erros_encontrados = models.TextField("Erros Encontrados", blank=True)
    registros_processados = models.PositiveIntegerField("Registros Processados", default=0)
    responsavel = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="execucoes_integracao")

    class Meta:
        verbose_name = "Execução de Integração"
        verbose_name_plural = "Execuções de Integração"
        ordering = ["-iniciado_em"]
        indexes = [
            models.Index(fields=["connector", "-iniciado_em"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.connector.nome} - {self.iniciado_em:%d/%m/%Y %H:%M}"

    def finalizar(self, status: str, retorno: dict | None = None, erros: str | None = None, registros: int | None = None):
        self.status = status
        self.finalizado_em = timezone.now()
        if retorno is not None:
            self.retorno_bruto = retorno
        if erros:
            self.erros_encontrados = erros
        if registros is not None:
            self.registros_processados = registros
        self.save(update_fields=["status", "finalizado_em", "retorno_bruto", "erros_encontrados", "registros_processados"])


class IntegrationEvent(models.Model):
    """Eventos recebidos/notificados por órgãos governamentais."""

    connector = models.ForeignKey(IntegrationConnector, on_delete=models.CASCADE, related_name="eventos")
    tipo_evento = models.CharField("Tipo de Evento", max_length=80)
    referencia_externa = models.CharField("Identificador Externo", max_length=120, blank=True)
    payload = models.JSONField("Payload do Evento", default=dict, blank=True)
    recebido_em = models.DateTimeField("Recebido em", auto_now_add=True)
    processado = models.BooleanField("Processado", default=False)
    processado_em = models.DateTimeField("Processado em", null=True, blank=True)
    observacoes = models.TextField("Observações", blank=True)

    class Meta:
        verbose_name = "Evento de Integração"
        verbose_name_plural = "Eventos de Integração"
        ordering = ["-recebido_em"]
        indexes = [
            models.Index(fields=["connector", "-recebido_em"]),
            models.Index(fields=["tipo_evento", "processado"]),
        ]

    def __str__(self):
        return f"{self.tipo_evento} - {self.connector.nome}"


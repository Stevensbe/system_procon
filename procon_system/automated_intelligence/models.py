"""
Modelos para Automação Inteligente
Fase 6 – Regras automáticas, execuções e insights
"""

from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class AutomationRule(models.Model):
    """Regras automatizadas que disparam ações inteligentes."""

    TRIGGER_TYPE_CHOICES = [
        ("EVENTO", "Evento"),
        ("AGENDADO", "Agendado"),
        ("METRICA", "Métrica"),
        ("THRESHOLD", "Threshold"),
        ("CUSTOM", "Customizado"),
    ]

    ACTION_TYPE_CHOICES = [
        ("EMAIL", "Notificação por E-mail"),
        ("WEBHOOK", "Webhook Externo"),
        ("TASK", "Tarefa Interna"),
        ("ALERTA", "Alerta do Sistema"),
        ("SCRIPT", "Script Personalizado"),
    ]

    nome = models.CharField("Nome da Regra", max_length=150)
    slug = models.SlugField("Slug", max_length=100, unique=True)
    descricao = models.TextField("Descrição", blank=True)
    trigger_type = models.CharField("Tipo de Trigger", max_length=20, choices=TRIGGER_TYPE_CHOICES)
    trigger_config = models.JSONField("Configuração do Trigger", default=dict, blank=True)
    action_type = models.CharField("Tipo de Ação", max_length=20, choices=ACTION_TYPE_CHOICES)
    action_config = models.JSONField("Configuração da Ação", default=dict, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    prioridade = models.IntegerField("Prioridade", default=0)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="regras_automatizadas")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Regra de Automação"
        verbose_name_plural = "Regras de Automação"
        ordering = ["-ativo", "-prioridade", "nome"]

    def __str__(self):
        return self.nome


class AutomationRun(models.Model):
    """Execuções realizadas a partir de uma regra automática."""

    STATUS_CHOICES = [
        ("PENDENTE", "Pendente"),
        ("EXECUTANDO", "Executando"),
        ("SUCESSO", "Sucesso"),
        ("FALHA", "Falha"),
        ("IGNORADA", "Ignorada"),
    ]

    regra = models.ForeignKey(AutomationRule, on_delete=models.CASCADE, related_name="execucoes")
    status = models.CharField("Status", max_length=12, choices=STATUS_CHOICES, default="PENDENTE")
    disparado_em = models.DateTimeField("Disparado em", auto_now_add=True)
    finalizado_em = models.DateTimeField("Finalizado em", null=True, blank=True)
    entrada = models.JSONField("Dados de Entrada", default=dict, blank=True)
    resultado = models.JSONField("Resultado", default=dict, blank=True)
    mensagem_erro = models.TextField("Mensagem de Erro", blank=True)
    executado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="execucoes_automatizadas")

    class Meta:
        verbose_name = "Execução de Automação"
        verbose_name_plural = "Execuções de Automação"
        ordering = ["-disparado_em"]
        indexes = [
            models.Index(fields=["regra", "-disparado_em"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.regra.nome} - {self.status}"

    def finalizar(self, status: str, resultado: dict | None = None, mensagem_erro: str | None = None):
        self.status = status
        self.finalizado_em = timezone.now()
        if resultado is not None:
            self.resultado = resultado
        if mensagem_erro:
            self.mensagem_erro = mensagem_erro
        self.save(update_fields=["status", "finalizado_em", "resultado", "mensagem_erro"])


class InsightTrigger(models.Model):
    """Insights gerados por automações inteligentes."""

    regra = models.ForeignKey(AutomationRule, on_delete=models.CASCADE, related_name="insights")
    titulo = models.CharField("Título", max_length=150)
    descricao = models.TextField("Descrição", blank=True)
    dados_relacionados = models.JSONField("Dados Relacionados", default=dict, blank=True)
    severidade = models.CharField(
        "Severidade",
        max_length=10,
        choices=[("LOW", "Baixa"), ("MEDIUM", "Média"), ("HIGH", "Alta"), ("CRITICAL", "Crítica")],
        default="LOW",
    )
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    reconhecido = models.BooleanField("Reconhecido", default=False)
    reconhecido_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="insights_reconhecidos")
    reconhecido_em = models.DateTimeField("Reconhecido em", null=True, blank=True)

    class Meta:
        verbose_name = "Insight de Automação"
        verbose_name_plural = "Insights de Automação"
        ordering = ["-criado_em"]
        indexes = [
            models.Index(fields=["regra", "severidade"]),
            models.Index(fields=["reconhecido", "severidade"]),
        ]

    def __str__(self):
        return f"{self.regra.nome} - {self.titulo}"

    def marcar_reconhecido(self, usuario: User | None = None):
        self.reconhecido = True
        self.reconhecido_por = usuario
        self.reconhecido_em = timezone.now()
        self.save(update_fields=["reconhecido", "reconhecido_por", "reconhecido_em"])


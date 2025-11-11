"""
Modelos para Analytics Preditivo no Sistema Procon
Fase 6 - Pipelines de Machine Learning, previsões e monitoramento de modelos
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class PredictiveModel(models.Model):
    """Metadados de modelos preditivos registrados no sistema."""

    TIPO_ALGORITMO_CHOICES = [
        ("REGRESSION", "Regressão"),
        ("CLASSIFICATION", "Classificação"),
        ("TIME_SERIES", "Série Temporal"),
        ("CLUSTERING", "Clustering"),
        ("NLP", "Processamento de Linguagem Natural"),
        ("RECOMMENDER", "Recomendação"),
        ("CUSTOM", "Customizado"),
    ]

    codigo = models.CharField("Código", max_length=50, unique=True)
    nome = models.CharField("Nome", max_length=120)
    descricao = models.TextField("Descrição", blank=True)

    tipo_algoritmo = models.CharField("Tipo de Algoritmo", max_length=20, choices=TIPO_ALGORITMO_CHOICES)
    origem_dados = models.CharField("Origem dos Dados", max_length=150, blank=True)
    parametros_treinamento = models.JSONField("Parâmetros de Treinamento", default=dict, blank=True)
    metricas_referencia = models.JSONField("Métricas de Referência", default=dict, blank=True)

    versao = models.PositiveIntegerField("Versão", default=1)
    ativo = models.BooleanField("Modelo Ativo", default=True)

    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="modelos_criados")
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Modelo Preditivo"
        verbose_name_plural = "Modelos Preditivos"
        ordering = ["-ativo", "nome"]

    def __str__(self):
        return f"{self.codigo} - {self.nome} (v{self.versao})"


class TrainingJob(models.Model):
    """Execuções de treinamento vinculadas a um modelo preditivo."""

    STATUS_CHOICES = [
        ("PENDENTE", "Pendente"),
        ("EXECUTANDO", "Executando"),
        ("SUCESSO", "Sucesso"),
        ("FALHA", "Falha"),
        ("CANCELADO", "Cancelado"),
    ]

    modelo = models.ForeignKey(PredictiveModel, on_delete=models.CASCADE, related_name="jobs_treinamento")
    iniciado_em = models.DateTimeField("Iniciado em", auto_now_add=True)
    finalizado_em = models.DateTimeField("Finalizado em", null=True, blank=True)
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default="PENDENTE")

    conjunto_dados = models.CharField("Conjunto de Dados", max_length=150)
    parametros_execucao = models.JSONField("Parâmetros Executados", default=dict, blank=True)
    metricas_resultado = models.JSONField("Métricas de Resultado", default=dict, blank=True)
    log_execucao = models.TextField("Log da Execução", blank=True)
    duracao_segundos = models.DecimalField("Duração (s)", max_digits=10, decimal_places=3, null=True, blank=True)

    executado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="jobs_treinamento")

    class Meta:
        verbose_name = "Job de Treinamento"
        verbose_name_plural = "Jobs de Treinamento"
        ordering = ["-iniciado_em"]
        indexes = [
            models.Index(fields=["modelo", "-iniciado_em"]),
            models.Index(fields=["status", "-iniciado_em"]),
        ]

    def __str__(self):
        return f"{self.modelo.codigo} - {self.iniciado_em:%d/%m/%Y %H:%M} ({self.status})"

    def marcar_finalizacao(self, status: str, metricas: dict | None = None):
        """Utilitário simples para finalizar a execução do job."""
        self.status = status
        self.finalizado_em = timezone.now()
        if self.finalizado_em and self.iniciado_em:
            delta = self.finalizado_em - self.iniciado_em
            self.duracao_segundos = round(delta.total_seconds(), 3)
        if metricas:
            self.metricas_resultado = metricas
        self.save(update_fields=["status", "finalizado_em", "duracao_segundos", "metricas_resultado"])


class ForecastResult(models.Model):
    """Resultados de previsões geradas a partir de um modelo preditivo."""

    STATUS_CHOICES = [
        ("GERADO", "Gerado"),
        ("ERRO", "Erro"),
        ("AGENDADO", "Agendado"),
    ]

    modelo = models.ForeignKey(PredictiveModel, on_delete=models.CASCADE, related_name="previsoes")
    referencia = models.DateTimeField("Data de Referência", default=timezone.now)
    horizonte = models.CharField("Horizonte", max_length=30, default="CURTO_PRAZO")
    parametros_entrada = models.JSONField("Parâmetros de Entrada", default=dict, blank=True)
    resultado_previsto = models.JSONField("Resultado Previsto", default=dict, blank=True)
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default="GERADO")
    gerado_em = models.DateTimeField("Gerado em", auto_now_add=True)
    gerado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="previsoes_geradas")
    observacoes = models.TextField("Observações", blank=True)

    class Meta:
        verbose_name = "Resultado de Previsão"
        verbose_name_plural = "Resultados de Previsão"
        ordering = ["-gerado_em"]
        indexes = [
            models.Index(fields=["modelo", "-gerado_em"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.modelo.codigo} - {self.referencia:%d/%m/%Y} ({self.horizonte})"


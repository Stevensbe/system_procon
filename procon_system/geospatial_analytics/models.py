"""
Modelos para Analytics Geoespacial
Fase 6 – Camadas de dados geográficos e estatísticas espaciais
"""

from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class GeoDataLayer(models.Model):
    """Camadas geográficas configuráveis com metadados e origem."""

    TIPO_CAMADA_CHOICES = [
        ("REGIAO_ADMINISTRATIVA", "Região Administrativa"),
        ("BAIRRO", "Bairro"),
        ("MUNICIPIO", "Município"),
        ("ZONA", "Zona"),
        ("PONTO_INTERESSE", "Ponto de Interesse"),
        ("CUSTOM", "Personalizada"),
    ]

    nome = models.CharField("Nome da Camada", max_length=120)
    slug = models.SlugField("Slug", unique=True, max_length=80)
    tipo_camada = models.CharField("Tipo de Camada", max_length=30, choices=TIPO_CAMADA_CHOICES, default="CUSTOM")
    descricao = models.TextField("Descrição", blank=True)
    fonte_dados = models.CharField("Fonte dos Dados", max_length=200, blank=True)
    srid = models.CharField("SRID", max_length=20, default="4326")
    atributos_disponiveis = models.JSONField("Atributos Disponíveis", default=list, blank=True)
    configuracoes_estilo = models.JSONField("Configuração de Estilo", default=dict, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="camadas_geograficas")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Camada Geográfica"
        verbose_name_plural = "Camadas Geográficas"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class GeoMetric(models.Model):
    """Métricas agregadas por unidade geográfica."""

    layer = models.ForeignKey(GeoDataLayer, on_delete=models.CASCADE, related_name="metricas")
    identificador_geografico = models.CharField("Identificador Geográfico", max_length=100)
    indicador = models.CharField("Indicador", max_length=100)
    valor = models.DecimalField("Valor", max_digits=20, decimal_places=4)
    periodo_referencia = models.DateField("Período de Referência")
    metadados = models.JSONField("Metadados", default=dict, blank=True)
    calculado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Métrica Geoespacial"
        verbose_name_plural = "Métricas Geoespaciais"
        ordering = ["-periodo_referencia", "indicador"]
        unique_together = ["layer", "identificador_geografico", "indicador", "periodo_referencia"]
        indexes = [
            models.Index(fields=["layer", "indicador"]),
            models.Index(fields=["identificador_geografico", "indicador"]),
        ]

    def __str__(self):
        return f"{self.layer.nome} - {self.indicador} ({self.identificador_geografico})"


class HeatmapSnapshot(models.Model):
    """Snapshots de heatmap gerados a partir de camadas e métricas."""

    layer = models.ForeignKey(GeoDataLayer, on_delete=models.CASCADE, related_name="snapshots_heatmap")
    indicador = models.CharField("Indicador", max_length=100)
    gerado_em = models.DateTimeField("Gerado em", auto_now_add=True)
    parametros = models.JSONField("Parâmetros", default=dict, blank=True)
    dados_geojson = models.JSONField("GeoJSON", default=dict, blank=True)
    legenda = models.JSONField("Legenda", default=dict, blank=True)
    expiracao = models.DateTimeField("Expiração", null=True, blank=True)

    class Meta:
        verbose_name = "Heatmap Snapshot"
        verbose_name_plural = "Heatmap Snapshots"
        ordering = ["-gerado_em"]
        indexes = [
            models.Index(fields=["layer", "indicador"]),
            models.Index(fields=["expiracao"]),
        ]

    def __str__(self):
        return f"{self.layer.nome} - {self.indicador} ({self.gerado_em:%d/%m/%Y %H:%M})"

    def expirado(self) -> bool:
        return bool(self.expiracao and timezone.now() > self.expiracao)


"""Serviço centralizado de geração e previsão de numeração dos autos."""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from .. import models, utils


@transaction.atomic
def gerar_numero_constatacao() -> str:
    """Gera o próximo número sequencial para autos de constatação."""
    return utils.gerar_proximo_numero_auto()


@transaction.atomic
def gerar_numero_apreensao() -> str:
    """Gera o próximo número sequencial para autos de apreensão."""
    return utils.gerar_proximo_numero_auto_apreensao()


def prever_numero_constatacao() -> str:
    """Retorna uma previsão do próximo número sem consumir a sequência."""
    return utils.obter_proximo_numero_preview()


def prever_numero_apreensao() -> str:
    """Retorna previsão do próximo número de apreensão."""
    return utils.obter_proximo_numero_apreensao_preview()


def atribuir_numero_auto(auto) -> None:
    """Atribui número para uma instância de auto, respeitando o tipo."""
    if isinstance(auto, models.AutoApreensaoInutilizacao):
        auto.numero_documento = gerar_numero_apreensao()
    else:
        auto.numero = gerar_numero_constatacao()
    auto.sincronizado_em = timezone.now()
    auto.save()


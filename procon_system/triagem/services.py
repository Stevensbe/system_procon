"""
Servicos auxiliares para a fase de triagem.

Centraliza a logica de criacao automatica de PPAs para evitar duplicacao
entre sinais e serializers.
"""

from __future__ import annotations

from typing import Optional

from django.conf import settings
from django.contrib.auth import get_user_model

from portal_cidadao.models import DenunciaCidadao
from ppa.models import MovimentacaoPPA, ProcedimentoPreAdministrativo

from .models import TriagemDemanda


def _obter_analista_padrao():
    User = get_user_model()

    analista_id = getattr(settings, "TRIAGEM_ANALISTA_PADRAO_ID", None)
    if analista_id:
        try:
            return User.objects.get(id=analista_id, is_active=True)
        except User.DoesNotExist:
            pass

    analista_username = getattr(settings, "TRIAGEM_ANALISTA_PADRAO_USERNAME", None)
    if analista_username:
        try:
            return User.objects.get(username=analista_username, is_active=True)
        except User.DoesNotExist:
            pass

    return (
        User.objects.filter(is_active=True, is_staff=True).order_by("id").first()
        or User.objects.filter(is_active=True).order_by("id").first()
    )


def _mapear_sigla_por_denuncia(denuncia: Optional[DenunciaCidadao]) -> str:
    if not denuncia:
        return "DIVERSOS"

    tipo = (denuncia.tipo_infracao or "").lower()
    mapeamento = {
        "banco": "BANCO",
        "posto": "POSTO",
        "combust": "POSTO",
        "supermerc": "SUPERMERCADO",
        "hiper": "SUPERMERCADO",
        "mercado": "SUPERMERCADO",
        "telef": "TELECOMUNICACOES",
        "internet": "TELECOMUNICACOES",
        "energia": "ENERGIA",
        "luz": "ENERGIA",
        "saude": "PLANO_SAUDE",
        "plano": "PLANO_SAUDE",
    }
    for chave, sigla in mapeamento.items():
        if chave in tipo:
            return sigla
    return "DIVERSOS"


def _mapear_sigla_por_triagem(triagem: TriagemDemanda) -> str:
    assunto = (triagem.assunto or "").lower()
    origem = triagem.origem or ""

    if "banco" in assunto:
        return "BANCO"
    if any(palavra in assunto for palavra in ["posto", "combust"]):
        return "POSTO"
    if "supermerc" in assunto:
        return "SUPERMERCADO"
    if any(palavra in assunto for palavra in ["telefone", "internet", "operadora"]):
        return "TELECOMUNICACOES"
    if any(palavra in assunto for palavra in ["energia", "luz"]):
        return "ENERGIA"
    if any(palavra in assunto for palavra in ["plano", "saude"]):
        return "PLANO_SAUDE"
    if origem == "ROTINA":
        return "OUTROS"
    return "DIVERSOS"


def criar_ppa_para_triagem(
    triagem: TriagemDemanda, denuncia: Optional[DenunciaCidadao] = None
) -> Optional[ProcedimentoPreAdministrativo]:
    """
    Garante que toda triagem possua um PPA vinculado.

    Retorna o PPA criado (ou ja existente). Caso nao seja possivel criar,
    registra um evento informativo e retorna None.
    """
    if triagem.ppa_id:
        return triagem.ppa

    analista = _obter_analista_padrao()
    if not analista:
        triagem.registrar_evento(
            evento="comentario",
            descricao=(
                "PPA nao foi criado automaticamente porque nenhum analista responsavel padrao esta configurado."
            ),
        )
        return None

    sigla = _mapear_sigla_por_denuncia(denuncia) if denuncia else _mapear_sigla_por_triagem(triagem)
    assunto = (
        f"Denuncia {denuncia.numero_denuncia} - {triagem.assunto}"
        if denuncia and denuncia.numero_denuncia
        else f"Triagem {triagem.numero_protocolo} - {triagem.assunto}"
    )

    ppa = ProcedimentoPreAdministrativo.objects.create(
        sigla=sigla,
        assunto=assunto,
        interessado=triagem.empresa_alvo or "Interessado nao informado",
        cnpj_interessado=triagem.cnpj_empresa or "",
        endereco_interessado=triagem.endereco_empresa or "",
        analista_responsavel=analista,
        status="criado",
        criado_por=analista,
        observacoes=(
            "PPA criado automaticamente a partir do registro de triagem."
            if not denuncia
            else (
                f"PPA criado automaticamente a partir da denuncia {denuncia.numero_denuncia} "
                "registrada no Portal do Cidadao."
            )
        ),
    )

    MovimentacaoPPA.objects.create(
        ppa=ppa,
        tipo_movimentacao="criacao",
        atendimento=(
            "PPA criado automaticamente a partir de denuncia do Portal do Cidadao."
            if denuncia
            else "PPA criado automaticamente a partir de triagem manual."
        ),
        usuario=analista,
    )

    triagem.ppa = ppa
    atualizar_status = []
    if triagem.status == "em_triagem":
        triagem.status = "convertido_ppa"
        atualizar_status.append("status")
    triagem.save(update_fields=["ppa", *atualizar_status] if atualizar_status else ["ppa"])
    descricao_evento = (
        "PPA criado automaticamente para acompanhar a denuncia."
        if denuncia
        else "PPA criado automaticamente para acompanhar a triagem."
    )
    triagem.registrar_evento(
        evento="vinculo_ppa",
        descricao=f"PPA {ppa.numero} criado automaticamente. {descricao_evento}",
        usuario=analista,
    )
    return ppa

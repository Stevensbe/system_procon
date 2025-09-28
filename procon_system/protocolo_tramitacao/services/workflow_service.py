"""Serviços de workflow para protocolos e tramitações."""

from __future__ import annotations

from typing import Dict, Optional, Tuple

from django.db import transaction
from django.utils import timezone

from ..models import ProtocoloDocumento, TramitacaoDocumento, Setor

try:
    from caixa_entrada.models import CaixaEntrada, HistoricoCaixaEntrada  # type: ignore
except Exception:  # noqa: BLE001 - módulo opcional
    CaixaEntrada = None  # type: ignore
    HistoricoCaixaEntrada = None  # type: ignore

try:
    from caixa_entrada.services import sincronizar_protocolo_caixa  # type: ignore
except Exception:  # noqa: BLE001 - módulo opcional
    sincronizar_protocolo_caixa = None  # type: ignore


# === Funções auxiliares ===

def _nome_do_setor(setor: Optional[Setor]) -> str:
    if not setor:
        return ""
    if setor.nome:
        return setor.nome
    return setor.sigla or ""


def _responsavel_do_setor(setor: Optional[Setor]):
    if setor and setor.responsavel_id:
        return setor.responsavel
    return None


def _obter_documento_caixa(protocolo: ProtocoloDocumento):
    if CaixaEntrada is None:
        return None
    return (
        CaixaEntrada.objects.filter(protocolo=protocolo)
        .order_by('-data_entrada')
        .first()
    )


def _registrar_historico(documento, acao: str, usuario, detalhes: str = ""):
    if HistoricoCaixaEntrada is None or documento is None:
        return
    HistoricoCaixaEntrada.objects.create(
        documento=documento,
        acao=acao,
        usuario=usuario,
        detalhes=detalhes or "",
    )


def _criar_documento_caixa(
    protocolo: ProtocoloDocumento,
    setor_destino: Setor,
    usuario,
    observacoes: str = "",
):
    if CaixaEntrada is None:
        return None

    responsavel = _responsavel_do_setor(setor_destino)
    documento = CaixaEntrada.objects.create(
        tipo_documento='PROTOCOLO',
        numero_protocolo=protocolo.numero_protocolo,
        assunto=protocolo.assunto,
        descricao=(protocolo.descricao or ""),
        prioridade=protocolo.prioridade,
        status='NAO_LIDO',
        remetente_nome=protocolo.remetente_nome,
        remetente_documento=protocolo.remetente_documento,
        remetente_email=protocolo.remetente_email,
        remetente_telefone=protocolo.remetente_telefone,
        setor_destino=_nome_do_setor(setor_destino) or 'Protocolo',
        responsavel_atual=responsavel,
        destinatario_direto=responsavel,
        setor_lotacao=_nome_do_setor(setor_destino),
        protocolo=protocolo,
        origem=protocolo.origem,
        prazo_resposta=protocolo.prazo_resposta,
    )

    if observacoes:
        documento.descricao = f"{documento.descricao}\n{observacoes}".strip()
        documento.save(update_fields=['descricao'])

    _registrar_historico(
        documento,
        acao='CRIADO',
        usuario=usuario,
        detalhes='Documento protocolado no setor destino.',
    )

    if sincronizar_protocolo_caixa is not None:
        try:
            sincronizar_protocolo_caixa(
                documento,
                usuario=usuario,
                acao='PROTOCOLADO',
                setor_origem=_nome_do_setor(setor_destino),
                setor_destino=_nome_do_setor(setor_destino),
                observacoes=observacoes or protocolo.descricao,
            )
        except Exception:
            # Sincronização é melhor esforço – não interromper fluxo principal
            pass

    return documento


def _encaminhar_documento_caixa(
    protocolo: ProtocoloDocumento,
    setor_destino: Setor,
    usuario,
    observacoes: str = "",
):
    if CaixaEntrada is None:
        return None

    documento_atual = _obter_documento_caixa(protocolo)
    if not documento_atual:
        documento_atual = _criar_documento_caixa(protocolo, setor_destino, usuario)

    responsavel = _responsavel_do_setor(setor_destino)
    novo_documento = documento_atual.encaminhar_para_setor(
        setor_destino=_nome_do_setor(setor_destino) or 'Destino',
        responsavel=responsavel,
        observacoes=observacoes,
    )

    campos = ['status', 'responsavel_atual', 'destinatario_direto', 'setor_lotacao']
    novo_documento.status = 'NAO_LIDO'
    novo_documento.responsavel_atual = responsavel
    novo_documento.destinatario_direto = responsavel
    novo_documento.setor_lotacao = _nome_do_setor(setor_destino)

    if observacoes:
        novo_documento.descricao = f"{(novo_documento.descricao or '').strip()}\n{observacoes}".strip()
        campos.append('descricao')

    novo_documento.save(update_fields=campos)

    _registrar_historico(
        novo_documento,
        acao='ENCAMINHADO',
        usuario=usuario,
        detalhes=f'Encaminhado para { _nome_do_setor(setor_destino) }',
    )

    return novo_documento


def _marcar_documento_recebido(
    tramitacao: TramitacaoDocumento,
    usuario,
    observacoes: str = "",
):
    if CaixaEntrada is None:
        return None

    documento = (
        CaixaEntrada.objects.filter(
            protocolo=tramitacao.protocolo,
            setor_destino=_nome_do_setor(tramitacao.setor_destino),
        )
        .order_by('-data_entrada')
        .first()
    )

    if not documento:
        return None

    documento.status = 'EM_ANALISE'
    documento.lido_por = usuario
    documento.lido_em = timezone.now()
    documento.save(update_fields=['status', 'lido_por', 'lido_em'])

    _registrar_historico(
        documento,
        acao='LIDO',
        usuario=usuario,
        detalhes=observacoes or 'Documento recebido no setor.',
    )

    return documento


def _arquivar_documentos_da_caixa(
    protocolo: ProtocoloDocumento,
    usuario,
    observacoes: str = "",
):
    if CaixaEntrada is None:
        return

    documentos = CaixaEntrada.objects.filter(protocolo=protocolo).exclude(status='ARQUIVADO')
    agora = timezone.now()
    for documento in documentos:
        documento.status = 'ARQUIVADO'
        documento.data_atualizacao = agora
        documento.save(update_fields=['status', 'data_atualizacao'])
        _registrar_historico(
            documento,
            acao='ARQUIVADO',
            usuario=usuario,
            detalhes=observacoes or 'Documento arquivado junto ao protocolo.',
        )


# === Serviço principal ===


class WorkflowProtocoloService:
    """Centraliza operações de workflow sobre protocolos."""

    @transaction.atomic
    def protocolar(
        self,
        *,
        tipo_documento: ProtocoloDocumento.tipo_documento.field.related_model,
        origem: str,
        assunto: str,
        descricao: str,
        remetente_nome: str,
        remetente_documento: str,
        setor_destino: Setor,
        usuario,
        remetente_email: str = "",
        remetente_telefone: str = "",
        remetente_endereco: str = "",
        prioridade: str = "NORMAL",
        sigiloso: bool = False,
        observacoes: str = "",
        setor_origem: Optional[Setor] = None,
    ) -> ProtocoloDocumento:
        """Cria um protocolo e registra a tramitação inicial."""

        setor_origem = setor_origem or setor_destino
        responsavel = _responsavel_do_setor(setor_destino)

        protocolo = ProtocoloDocumento.objects.create(
            tipo_documento=tipo_documento,
            origem=origem,
            assunto=assunto,
            descricao=descricao,
            remetente_nome=remetente_nome,
            remetente_documento=remetente_documento,
            remetente_email=remetente_email,
            remetente_telefone=remetente_telefone,
            remetente_endereco=remetente_endereco,
            setor_atual=setor_destino,
            setor_origem=setor_origem,
            protocolado_por=usuario,
            prioridade=prioridade,
            sigiloso=sigiloso,
            observacoes=observacoes or "",
            responsavel_atual=responsavel,
        )

        TramitacaoDocumento.objects.create(
            protocolo=protocolo,
            acao="PROTOCOLADO",
            setor_origem=setor_origem,
            setor_destino=setor_destino,
            motivo="Documento protocolado",
            observacoes=observacoes or "",
            usuario=usuario,
        )

        _criar_documento_caixa(
            protocolo=protocolo,
            setor_destino=setor_destino,
            usuario=usuario,
            observacoes=observacoes,
        )

        return protocolo

    @transaction.atomic
    def protocolar_documento(
        self,
        dados: Dict,
        usuario,
    ) -> Tuple[ProtocoloDocumento, TramitacaoDocumento]:
        """Cria um protocolo a partir de dados validados e retorna protocolo/tramitação."""

        protocolo = self.protocolar(
            tipo_documento=dados["tipo_documento"],
            origem=dados["origem"],
            assunto=dados["assunto"],
            descricao=dados["descricao"],
            remetente_nome=dados["remetente_nome"],
            remetente_documento=dados["remetente_documento"],
            remetente_email=dados.get("remetente_email", ""),
            remetente_telefone=dados.get("remetente_telefone", ""),
            setor_destino=dados["setor_destino"],
            usuario=usuario,
            prioridade=dados.get("prioridade", "NORMAL"),
            sigiloso=dados.get("sigiloso", False),
            observacoes=dados.get("observacoes", ""),
            setor_origem=dados.get("setor_origem"),
        )

        tramitacao = protocolo.tramitacoes.filter(acao="PROTOCOLADO").order_by("data_tramitacao").first()
        if tramitacao is None:
            tramitacao = protocolo.tramitacoes.order_by("data_tramitacao").first()

        return protocolo, tramitacao

    @transaction.atomic
    def tramitar(
        self,
        protocolo: ProtocoloDocumento,
        *,
        setor_destino: Setor,
        motivo: str,
        usuario,
        prazo_dias: Optional[int] = None,
        observacoes: str = "",
    ) -> TramitacaoDocumento:
        """Tramita um protocolo para outro setor."""

        tramitacao = protocolo.tramitar_para_setor(
            setor_destino=setor_destino,
            motivo=motivo,
            usuario=usuario,
            prazo_dias=prazo_dias,
        )

        if observacoes:
            tramitacao.observacoes = observacoes
            tramitacao.save(update_fields=["observacoes"])
            protocolo.observacoes = f"{protocolo.observacoes}\n{observacoes}".strip()
            protocolo.save(update_fields=["observacoes"])

        _encaminhar_documento_caixa(
            protocolo=protocolo,
            setor_destino=setor_destino,
            usuario=usuario,
            observacoes=observacoes,
        )

        return tramitacao

    @transaction.atomic
    def tramitar_protocolo(
        self,
        *,
        protocolo: ProtocoloDocumento,
        setor_destino: Setor,
        motivo: str,
        usuario,
        observacoes: str = "",
        prazo_dias: Optional[int] = None,
    ) -> Tuple[ProtocoloDocumento, TramitacaoDocumento]:
        """Encaminha protocolo e retorna dados atualizados."""

        tramitacao = self.tramitar(
            protocolo=protocolo,
            setor_destino=setor_destino,
            motivo=motivo,
            usuario=usuario,
            prazo_dias=prazo_dias,
            observacoes=observacoes,
        )

        protocolo.refresh_from_db()
        return protocolo, tramitacao

    @transaction.atomic
    def receber(
        self,
        tramitacao: TramitacaoDocumento,
        *,
        usuario,
        observacoes: str = "",
    ) -> TramitacaoDocumento:
        """Marca uma tramitação como recebida e atualiza o protocolo."""

        if tramitacao.data_recebimento is not None:
            return tramitacao

        tramitacao.data_recebimento = timezone.now()
        tramitacao.recebido_por = usuario
        if observacoes:
            texto = (tramitacao.observacoes or "").strip()
            tramitacao.observacoes = f"{texto}\n{observacoes}".strip()
        tramitacao.save()

        protocolo = tramitacao.protocolo
        protocolo.setor_atual = tramitacao.setor_destino
        protocolo.status = "EM_TRAMITACAO"
        responsavel = _responsavel_do_setor(tramitacao.setor_destino)
        if responsavel:
            protocolo.responsavel_atual = responsavel
        protocolo.save(update_fields=["setor_atual", "status", "responsavel_atual", "atualizado_em"])

        _marcar_documento_recebido(
            tramitacao=tramitacao,
            usuario=usuario,
            observacoes=observacoes,
        )

        return tramitacao

    @transaction.atomic
    def finalizar(
        self,
        protocolo: ProtocoloDocumento,
        *,
        usuario=None,
        observacoes: str = "",
    ) -> ProtocoloDocumento:
        """Finaliza o protocolo."""

        protocolo.finalizar_protocolo(observacoes=observacoes, usuario=usuario)
        _arquivar_documentos_da_caixa(
            protocolo=protocolo,
            usuario=usuario,
            observacoes=observacoes,
        )
        return protocolo


workflow_service = WorkflowProtocoloService()

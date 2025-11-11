"""
Utilitários de notificação para eventos da triagem.
Centraliza o envio de e-mails para o denunciante e notificações internas.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

try:  # pragma: no cover - fallback se app não estiver disponível
    from notificacoes.services import notificacao_service  # type: ignore
    from notificacoes.models import TipoNotificacao  # type: ignore
except Exception:  # pragma: no cover
    notificacao_service = None
    TipoNotificacao = None

from .models import TriagemDemanda


DEFAULT_FROM_EMAIL = getattr(settings, "DEFAULT_FROM_EMAIL", "nao-responder@procon.am.gov.br")


@dataclass
class CanalMensagem:
    assunto: str
    mensagem: str


def _obter_email_denunciante(triagem: TriagemDemanda) -> Optional[str]:
    """
    Tenta extrair um e-mail válido do registro da triagem ou da denúncia do portal.
    """
    if triagem.denuncia_portal and triagem.denuncia_portal.email:
        return triagem.denuncia_portal.email.strip()

    contato = (triagem.denunciante_contato or "").strip()
    if "@" in contato:
        return contato

    return None


def _enviar_email(destinatario: str, conteudo: CanalMensagem) -> None:
    """
    Envia e-mail simples. Em caso de falha loga no logger default.
    """
    try:
        send_mail(
            subject=conteudo.assunto,
            message=conteudo.mensagem,
            from_email=DEFAULT_FROM_EMAIL,
            recipient_list=[destinatario],
            fail_silently=True,
        )
    except Exception:  # pragma: no cover - apenas log
        # Não interrompe o fluxo principal
        pass


def _garantir_tipo_notificacao(codigo: str, nome: str, descricao: str) -> TipoNotificacao:
    if TipoNotificacao is None:
        raise RuntimeError("Aplicativo de notificações não está disponível.")
    tipo, _ = TipoNotificacao.objects.get_or_create(
        codigo=codigo,
        defaults={"nome": nome, "descricao": descricao},
    )
    return tipo


def _notificar_responsavel(triagem: TriagemDemanda, codigo: str, titulo: str, mensagem: str) -> None:
    """
    Cria uma notificação interna para o responsável atual da triagem, se disponível.
    """
    responsavel = triagem.responsavel_triagem
    if not responsavel:
        return

    if notificacao_service is None or TipoNotificacao is None:
        return

    tipo = _garantir_tipo_notificacao(
        codigo=codigo,
        nome=titulo,
        descricao=mensagem[:255],
    )

    notificacao_service.criar_notificacao(
        tipo_codigo=tipo.codigo,
        destinatario_id=responsavel.id,
        titulo=titulo,
        mensagem=mensagem,
        dados_extras={
            "triagem_id": triagem.id,
            "numero_protocolo": triagem.numero_protocolo,
        },
        objeto_relacionado=triagem,
    )


def enviar_confirmacao_triagem(triagem: TriagemDemanda) -> None:
    """
    Confirma ao denunciante o registro da triagem e avisa o responsável interno.
    """
    email = _obter_email_denunciante(triagem)
    if email:
        mensagem = (
            f"Olá!\n\nRecebemos sua denúncia no PROCON-AM.\n"
            f"Protocolo: {triagem.numero_protocolo}\n"
            f"Assunto: {triagem.assunto}\n"
            "Nossa equipe de triagem já está analisando o caso. Você poderá ser contatado "
            "para complementações se necessário.\n\n"
            "Atenciosamente,\nEquipe PROCON Amazonas"
        )
        _enviar_email(
            email,
            CanalMensagem(
                assunto=f"Confirmação de recebimento - {triagem.numero_protocolo}",
                mensagem=mensagem,
            ),
        )

    _notificar_responsavel(
        triagem,
        codigo="triagem_confirmacao_recebida",
        titulo="Nova triagem registrada",
        mensagem=(
            f"A denúncia {triagem.numero_protocolo} foi registrada e atribuída automaticamente. "
            "Revise os dados e defina os próximos passos."
        ),
    )


def enviar_pedido_complemento(triagem: TriagemDemanda, motivo: str, observacao: str) -> None:
    """
    Notifica o denunciante com a solicitação de complementação e alerta o responsável.
    """
    email = _obter_email_denunciante(triagem)
    if email:
        mensagem = (
            f"Olá!\n\nPrecisamos de informações adicionais para continuar o atendimento da denúncia "
            f"{triagem.numero_protocolo}.\n\n"
            f"Motivo do pedido: {motivo}\n"
            f"Orientações: {observacao}\n\n"
            "Por favor, responda este e-mail ou utilize o mesmo canal pelo qual entrou em contato. "
            "Assim que recebermos o retorno, daremos continuidade ao processo.\n\n"
            "Atenciosamente,\nEquipe PROCON Amazonas"
        )
        _enviar_email(
            email,
            CanalMensagem(
                assunto=f"Complementação necessária - {triagem.numero_protocolo}",
                mensagem=mensagem,
            ),
        )

    _notificar_responsavel(
        triagem,
        codigo="triagem_pedido_complemento",
        titulo="Complementação solicitada",
        mensagem=(
            f"Você solicitou complementação para a triagem {triagem.numero_protocolo}. "
            "Aguarde o retorno do denunciante ou registre a resposta quando recebida."
        ),
    )


def enviar_aviso_agendamento(triagem: TriagemDemanda, evento) -> None:
    """
    Envia aviso de agendamento ao denunciante (quando fizer sentido) e ao responsável/fiscalização.
    """
    data_inicio = timezone.localtime(evento.data_inicio)
    email = _obter_email_denunciante(triagem)
    if email:
        mensagem = (
            f"Olá!\n\nA denúncia {triagem.numero_protocolo} avançou para fiscalização. "
            f"Agendamos uma visita com previsão para {data_inicio.strftime('%d/%m/%Y às %H:%M')}.\n"
            "Caso tenhamos novidades, entraremos em contato.\n\n"
            "Atenciosamente,\nEquipe PROCON Amazonas"
        )
        _enviar_email(
            email,
            CanalMensagem(
                assunto=f"Fiscalização agendada - {triagem.numero_protocolo}",
                mensagem=mensagem,
            ),
        )

    detalhes = (
        f"Fiscalização agendada para {data_inicio.strftime('%d/%m/%Y %H:%M')} "
        f"({evento.fiscal_responsavel})."
    )
    _notificar_responsavel(
        triagem,
        codigo="triagem_agendamento_fiscalizacao",
        titulo="Fiscalização agendada",
        mensagem=(
            f"A triagem {triagem.numero_protocolo} foi encaminhada para fiscalização. {detalhes}"
        ),
    )

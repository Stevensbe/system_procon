import logging

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import AutoInfracao, HistoricoProcesso, Processo


logger = logging.getLogger(__name__)

def _auto_infracao_esta_notificada(auto_infracao) -> bool:
    if getattr(auto_infracao, "data_notificacao", None):
        return True
    status = (getattr(auto_infracao, "status", "") or "").lower()
    return status in {"notificado", "em_defesa", "em_recurso", "julgado", "pago", "finalizado"}


@receiver(post_save, sender=AutoInfracao)
def criar_processo_automatico(sender, instance, created, **kwargs):
    """
    Cria automaticamente um processo administrativo quando um Auto de Infracao
    e registrado, mantendo o comportamento original em ambiente de producao.
    """
    if getattr(settings, "TESTING", False):
        return

    if not _auto_infracao_esta_notificada(instance):
        return

    try:
        if Processo.objects.filter(auto_infracao=instance).exists():
            return
        if getattr(instance, "content_type", None) and getattr(instance, "object_id", None):
            if Processo.objects.filter(
                auto_constatacao_content_type=instance.content_type,
                auto_constatacao_id=instance.object_id,
            ).exists():
                return

        data_notificacao = instance.data_notificacao or timezone.now().date()

        processo = Processo.objects.create(
            auto_infracao=instance,
            autuado=instance.razao_social,
            cnpj=instance.cnpj,
            status="aguardando_defesa",
            prioridade="normal",
            valor_multa=instance.valor_multa,
            fiscal_responsavel=instance.fiscal_nome,
            prazo_defesa=calcular_prazo_defesa(data_notificacao),
            data_notificacao=data_notificacao,
        )

        HistoricoProcesso.objects.create(
            processo=processo,
            status_anterior=None,
            status_novo=processo.status,
            observacao=f"Processo criado automaticamente a partir do Auto de Infracao {instance.numero}",
            usuario="Sistema Automatico",
        )

        logger.info(
            "Process %s created automatically for auto %s",
            processo.numero_processo,
            instance.numero,
        )

    except Exception:
        logger.exception(
            "Failed to create process automatically for auto %s",
            instance.numero,
        )


@receiver(post_save, sender=Processo)
def registrar_mudanca_status(sender, instance, created, **kwargs):
    """
    Registra mudancas de status do processo no historico.
    """
    if getattr(settings, "TESTING", False):
        return

    if not created:
        try:
            ultimo_historico = (
                HistoricoProcesso.objects.filter(processo=instance)
                .order_by("-data_mudanca")
                .first()
            )

            status_anterior = ultimo_historico.status_novo if ultimo_historico else None

            if status_anterior and status_anterior != instance.status:
                HistoricoProcesso.objects.create(
                    processo=instance,
                    status_anterior=status_anterior,
                    status_novo=instance.status,
                    observacao=f'Status alterado de "{status_anterior}" para "{instance.status}"',
                    usuario="Sistema",
                )

        except Exception:
            logger.exception(
                "Failed to register status change for process %s",
                instance.pk,
            )


def calcular_prazo_defesa(data_fiscalizacao, dias_uteis=15):
    """
    Calcula o prazo para apresentacao de defesa (15 dias uteis).
    """
    from datetime import timedelta

    data_base = data_fiscalizacao if data_fiscalizacao else timezone.now().date()
    prazo = data_base

    dias_adicionados = 0
    while dias_adicionados < dias_uteis:
        prazo += timedelta(days=1)
        if prazo.weekday() < 5:
            dias_adicionados += 1

    return prazo

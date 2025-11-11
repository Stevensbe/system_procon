import logging

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import AutoInfracao, HistoricoProcesso, Processo


logger = logging.getLogger(__name__)


@receiver(post_save, sender=AutoInfracao)
def criar_processo_automatico(sender, instance, created, **kwargs):
    """
    Cria automaticamente um processo administrativo quando um Auto de Infracao
    e registrado, mantendo o comportamento original em ambiente de producao.
    """
    if getattr(settings, "TESTING", False):
        return

    if created:
        try:
            if hasattr(instance, "processo"):
                return

            processo = Processo.objects.create(
                auto_infracao=instance,
                autuado=instance.razao_social,
                cnpj=instance.cnpj,
                status="aguardando_defesa",
                prioridade="normal",
                valor_multa=instance.valor_multa,
                fiscal_responsavel=instance.fiscal_nome,
                prazo_defesa=calcular_prazo_defesa(instance.data_fiscalizacao),
                data_notificacao=timezone.now().date(),
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

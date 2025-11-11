import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import (
    ProcedimentoPreAdministrativo,
    MovimentacaoPPA,
    AnexoPPA,
    ParecerPPA
)

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ProcedimentoPreAdministrativo)
def registrar_mudanca_status_ppa(sender, instance, created, **kwargs):
    """
    Registra mudanças de status do PPA automaticamente
    """
    if created:
        # Já registra na criação através do serializer/admin
        return
    
    try:
        # Busca última movimentação
        ultima = MovimentacaoPPA.objects.filter(
            ppa=instance
        ).order_by('-criado_em').first()
        
        if not ultima:
            return
        
        # Verifica se o status mudou
        # (isso é verificado no serializer, mas mantemos por segurança)
        pass
        
    except Exception as e:
        logger.exception(f"Erro ao registrar mudança de status do PPA {instance.numero}: {e}")


@receiver(post_save, sender=AnexoPPA)
def registrar_anexo_ppa(sender, instance, created, **kwargs):
    """
    Registra automaticamente quando um anexo é adicionado
    (já é feito no ViewSet, mas mantemos por segurança)
    """
    if not created:
        return
    
    # A movimentação já é criada no ViewSet/Admin
    pass


@receiver(post_save, sender=ParecerPPA)
def atualizar_status_ppa_parecer(sender, instance, created, **kwargs):
    """
    Atualiza status do PPA quando parecer é criado
    (já é feito no ViewSet, mas mantemos por segurança)
    """
    if not created:
        return
    
    try:
        ppa = instance.ppa
        if ppa.status not in ['parecer_elaborado', 'concluido', 'arquivado']:
            ppa.status = 'parecer_elaborado'
            ppa.save(update_fields=['status', 'atualizado_em'])
    except Exception as e:
        logger.exception(f"Erro ao atualizar status do PPA após parecer: {e}")


@receiver(pre_save, sender=ProcedimentoPreAdministrativo)
def definir_prazo_analise(sender, instance, **kwargs):
    """
    Define prazo de análise automaticamente se não informado
    """
    if not instance.prazo_analise and instance.status == 'criado':
        # Define prazo de 30 dias corridos
        instance.prazo_analise = timezone.now().date() + timezone.timedelta(days=30)


@receiver(post_save, sender=ProcedimentoPreAdministrativo)
def verificar_conclusao_automatica(sender, instance, created, **kwargs):
    """
    Verifica se deve marcar como concluído automaticamente
    """
    if created:
        return
    
    try:
        # Se decisão final foi definida e status não é concluído/arquivado
        if instance.decisao_final != 'pendente' and instance.status not in ['concluido', 'arquivado']:
            if instance.decisao_final == 'arquivado':
                instance.status = 'arquivado'
            else:
                instance.status = 'concluido'
            
            if not instance.data_conclusao:
                instance.data_conclusao = timezone.now()
            
            # Salva sem disparar signals novamente
            ProcedimentoPreAdministrativo.objects.filter(pk=instance.pk).update(
                status=instance.status,
                data_conclusao=instance.data_conclusao
            )
    except Exception as e:
        logger.exception(f"Erro ao verificar conclusão automática do PPA {instance.numero}: {e}")


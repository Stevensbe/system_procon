from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import AutoInfracao, Processo, HistoricoProcesso

@receiver(post_save, sender=AutoInfracao)
def criar_processo_automatico(sender, instance, created, **kwargs):
    """
    Signal que cria automaticamente um processo administrativo
    sempre que um Auto de Infração é criado.
    """
    if created:  # Só executa quando o auto é criado, não quando é atualizado
        try:
            # Verifica se já existe um processo para este auto
            if hasattr(instance, 'processo'):
                return  # Já existe processo, não criar duplicado
            
            # Criar o processo automaticamente
            processo = Processo.objects.create(
                auto_infracao=instance,
                autuado=instance.razao_social,
                cnpj=instance.cnpj,
                status='aguardando_defesa',
                prioridade='normal',
                valor_multa=instance.valor_multa,
                fiscal_responsavel=instance.fiscal_nome,
                # Definir prazo de defesa (15 dias úteis a partir da criação)
                prazo_defesa=calcular_prazo_defesa(instance.data_fiscalizacao),
                data_notificacao=timezone.now().date(),
            )
            
            # Criar registro no histórico
            HistoricoProcesso.objects.create(
                processo=processo,
                tipo='criacao',
                descricao_mudanca=f'Processo criado automaticamente a partir do Auto de Infração {instance.numero}',
                data_ocorrencia=timezone.now(),
                usuario_responsavel='Sistema Automático'
            )
            
            print(f"✅ Processo {processo.numero_processo} criado automaticamente para Auto de Infração {instance.numero}")
            
        except Exception as e:
            print(f"❌ Erro ao criar processo automaticamente para Auto {instance.numero}: {str(e)}")

@receiver(post_save, sender=Processo)
def registrar_mudanca_status(sender, instance, created, **kwargs):
    """
    Signal que registra mudanças de status do processo no histórico.
    """
    if not created:  # Só para atualizações, não criações
        try:
            # Buscar último status no histórico
            ultimo_historico = HistoricoProcesso.objects.filter(
                processo=instance,
                tipo='status_change'
            ).order_by('-data_ocorrencia').first()
            
            # Se o status mudou, registrar no histórico
            status_anterior = ultimo_historico.status_novo if ultimo_historico else None
            
            if status_anterior and status_anterior != instance.status:
                HistoricoProcesso.objects.create(
                    processo=instance,
                    tipo='status_change',
                    descricao_mudanca=f'Status alterado de "{status_anterior}" para "{instance.status}"',
                    status_anterior=status_anterior,
                    status_novo=instance.status,
                    data_ocorrencia=timezone.now(),
                    usuario_responsavel='Sistema'  # Pode ser melhorado para capturar usuário real
                )
                
        except Exception as e:
            print(f"❌ Erro ao registrar mudança de status: {str(e)}")

def calcular_prazo_defesa(data_fiscalizacao, dias_uteis=15):
    """
    Calcula o prazo para apresentação de defesa (15 dias úteis).
    """
    from datetime import timedelta
    
    data_base = data_fiscalizacao if data_fiscalizacao else timezone.now().date()
    prazo = data_base
    
    # Adicionar dias úteis (seg-sex)
    dias_adicionados = 0
    while dias_adicionados < dias_uteis:
        prazo += timedelta(days=1)
        # Se não for fim de semana (seg=0, dom=6)
        if prazo.weekday() < 5:  
            dias_adicionados += 1
    
    return prazo

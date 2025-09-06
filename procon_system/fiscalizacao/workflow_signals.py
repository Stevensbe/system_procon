"""
SISPROCON - Workflow de Integração Automática
Fiscalização → Multas → Cobrança

Este módulo gerencia o fluxo automático desde a criação de um auto de infração
até a cobrança da multa, passando pelo processo administrativo.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.utils import timezone
from .models import AutoInfracao, Processo
from multas.models import Multa, Empresa


@receiver(post_save, sender=AutoInfracao)
def criar_processo_automatico(sender, instance, created, **kwargs):
    """
    Automaticamente cria processo administrativo quando um Auto de Infração é criado
    """
    if created and not hasattr(instance, '_skip_processo'):
        try:
            # Verifica se já existe processo para este auto
            if hasattr(instance, 'processo'):
                return
            
            # Cria processo automaticamente
            processo = Processo.objects.create(
                auto_infracao=instance,
                autuado=instance.razao_social,
                cnpj=instance.cnpj,
                valor_multa=instance.valor_multa,
                fiscal_responsavel=instance.fiscal_nome,
                observacoes=f"Processo criado automaticamente a partir do Auto {instance.numero}"
            )
            
            # Calcula prazos baseados na data de notificação (assumindo 7 dias após criação)
            data_notificacao = timezone.now().date() + timezone.timedelta(days=7)
            processo.data_notificacao = data_notificacao
            processo.calcular_prazos()
            processo.save()
            
            print(f"✅ Processo {processo.numero_processo} criado automaticamente para Auto {instance.numero}")
            
        except Exception as e:
            print(f"❌ Erro ao criar processo para Auto {instance.numero}: {e}")


@receiver(post_save, sender=Processo)
def processar_finalizacao_processo(sender, instance, created, **kwargs):
    """
    Processa automaticamente quando um processo é finalizado
    """
    if not created and instance.status == 'finalizado_procedente':
        # Verifica se já foi processado
        if hasattr(instance, '_processado_finalizacao'):
            return
        
        try:
            # Marca para evitar reprocessamento
            instance._processado_finalizacao = True
            
            # Cria multa automaticamente se não existe
            if not hasattr(instance, 'multa') or not Multa.objects.filter(processo=instance.auto_infracao).exists():
                multa = Multa.criar_a_partir_de_processo(instance)
                print(f"✅ Multa #{multa.pk} criada automaticamente para processo {instance.numero_processo}")
                
                # Agenda criação de cobrança após 3 dias
                from datetime import timedelta
                # Aqui poderia ser implementado com Celery para agendamento
                # Por enquanto, apenas cria a cobrança imediatamente
                try:
                    cobranca = multa.gerar_cobranca()
                    print(f"✅ Cobrança criada para multa #{multa.pk}")
                except Exception as e:
                    print(f"⚠️ Erro ao gerar cobrança: {e}")
            
            # Cria notificação de finalização
            try:
                from protocolo_tramitacao.notifications import GerenciadorNotificacoes
                notifs = GerenciadorNotificacoes.criar_notificacao_processo_finalizado(instance)
                print(f"📧 {len(notifs)} notificações de processo finalizado criadas")
            except ImportError:
                pass
            
        except Exception as e:
            print(f"❌ Erro ao processar finalização do processo {instance.numero_processo}: {e}")


@receiver(pre_save, sender=Processo)
def atualizar_multa_valor(sender, instance, **kwargs):
    """
    Atualiza valor da multa quando processo é alterado
    """
    if instance.pk:  # Só para atualizações
        try:
            # Busca instância anterior
            processo_anterior = Processo.objects.get(pk=instance.pk)
            
            # Se valor da multa mudou, atualiza na multa relacionada
            if processo_anterior.valor_multa != instance.valor_multa:
                multa = Multa.objects.filter(processo=instance.auto_infracao).first()
                if multa and multa.status == 'pendente':
                    multa.valor = instance.valor_multa
                    multa.observacoes = f"{multa.observacoes}\nValor atualizado de R$ {processo_anterior.valor_multa} para R$ {instance.valor_multa}".strip()
                    multa.save()
                    print(f"💰 Valor da multa #{multa.pk} atualizado para R$ {instance.valor_multa}")
        
        except Processo.DoesNotExist:
            pass
        except Exception as e:
            print(f"❌ Erro ao atualizar valor da multa: {e}")


def migrar_empresas_de_autos_existentes():
    """
    Função utilitária para migrar empresas dos autos existentes
    """
    autos_sem_empresa = AutoInfracao.objects.all()
    empresas_criadas = 0
    
    for auto in autos_sem_empresa:
        try:
            empresa, created = Empresa.objects.get_or_create(
                cnpj=auto.cnpj,
                defaults={
                    'razao_social': auto.razao_social,
                    'nome_fantasia': getattr(auto, 'nome_fantasia', ''),
                    'endereco': auto.endereco,
                    'telefone': getattr(auto, 'telefone', ''),
                    'ativo': True
                }
            )
            
            if created:
                empresas_criadas += 1
                print(f"✅ Empresa criada: {empresa.razao_social}")
        
        except Exception as e:
            print(f"❌ Erro ao criar empresa para Auto {auto.numero}: {e}")
    
    print(f"📊 Total de empresas criadas: {empresas_criadas}")
    return empresas_criadas


def sincronizar_processos_existentes():
    """
    Sincroniza processos existentes que não têm multa
    """
    processos_procedentes = Processo.objects.filter(
        status='finalizado_procedente'
    )
    
    multas_criadas = 0
    for processo in processos_procedentes:
        try:
            # Verifica se já tem multa
            if not Multa.objects.filter(processo=processo.auto_infracao).exists():
                multa = Multa.criar_a_partir_de_processo(processo)
                multas_criadas += 1
                print(f"✅ Multa #{multa.pk} criada para processo {processo.numero_processo}")
        
        except Exception as e:
            print(f"❌ Erro ao criar multa para processo {processo.numero_processo}: {e}")
    
    print(f"📊 Total de multas criadas: {multas_criadas}")
    return multas_criadas


class WorkflowManager:
    """
    Classe para gerenciar o workflow completo do PROCON
    """
    
    @staticmethod
    def processar_auto_completo(auto_infracao, notificar_em_dias=7):
        """
        Processa um auto de infração completo:
        1. Cria processo administrativo
        2. Define prazos
        3. Cria protocolo de tramitação
        """
        try:
            # 1. Cria processo se não existe
            if not hasattr(auto_infracao, 'processo'):
                processo = Processo.objects.create(
                    auto_infracao=auto_infracao,
                    autuado=auto_infracao.razao_social,
                    cnpj=auto_infracao.cnpj,
                    valor_multa=auto_infracao.valor_multa,
                    fiscal_responsavel=auto_infracao.fiscal_nome
                )
            else:
                processo = auto_infracao.processo
            
            # 2. Define data de notificação e prazos
            processo.data_notificacao = timezone.now().date() + timezone.timedelta(days=notificar_em_dias)
            processo.calcular_prazos()
            processo.save()
            
            # 3. Cria protocolo de tramitação
            try:
                from protocolo_tramitacao.models import ProtocoloDocumento, Setor
                from django.contrib.auth.models import User
                
                setor_juridico = Setor.objects.filter(sigla__icontains='JUR').first()
                usuario_sistema = User.objects.filter(is_staff=True).first()
                
                if setor_juridico and usuario_sistema:
                    protocolo = ProtocoloDocumento.criar_a_partir_de_auto_infracao(
                        auto_infracao=auto_infracao,
                        setor_destino=setor_juridico,
                        usuario=usuario_sistema
                    )
                    print(f"📋 Protocolo {protocolo.numero_protocolo} criado")
            
            except ImportError:
                print("⚠️ Módulo de protocolo não disponível")
            
            return processo
            
        except Exception as e:
            print(f"❌ Erro no processamento completo: {e}")
            return None
    
    @staticmethod
    def finalizar_processo_e_gerar_multa(processo, valor_final=None):
        """
        Finaliza processo como procedente e gera multa automaticamente
        """
        try:
            # Atualiza valor se fornecido
            if valor_final:
                processo.valor_multa = valor_final
            
            # Finaliza processo
            processo.status = 'finalizado_procedente'
            processo.data_finalizacao = timezone.now().date()
            processo.save()
            
            print(f"✅ Processo {processo.numero_processo} finalizado como procedente")
            
            # A multa será criada automaticamente pelo signal
            return processo
            
        except Exception as e:
            print(f"❌ Erro ao finalizar processo: {e}")
            return None
    
    @staticmethod
    def relatorio_workflow():
        """
        Gera relatório do estado atual do workflow
        """
        total_autos = AutoInfracao.objects.count()
        total_processos = Processo.objects.count()
        total_multas = Multa.objects.count()
        
        processos_pendentes = Processo.objects.filter(
            status__in=['aguardando_defesa', 'defesa_apresentada', 'em_analise']
        ).count()
        
        multas_vencidas = Multa.objects.filter(status='vencida').count()
        
        relatorio = {
            'autos_criados': total_autos,
            'processos_criados': total_processos,
            'multas_geradas': total_multas,
            'processos_pendentes': processos_pendentes,
            'multas_vencidas': multas_vencidas,
            'taxa_conversao_auto_processo': (total_processos / total_autos * 100) if total_autos > 0 else 0,
            'taxa_conversao_processo_multa': (total_multas / total_processos * 100) if total_processos > 0 else 0,
        }
        
        return relatorio
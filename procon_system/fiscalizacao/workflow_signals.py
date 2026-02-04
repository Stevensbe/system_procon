"""
SISPROCON - Workflow de Integração Automática
Fiscalização → Multas → Cobrança

Este módulo gerencia o fluxo automático desde a criação de um auto de infração
até a cobrança da multa, passando pelo processo administrativo.

Também gerencia a criação automática de processos após Auto de Constatação.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from .models import (
    AutoInfracao, Processo,
    AutoBanco, AutoPosto, AutoSupermercado, AutoDiversos
)
from multas.models import Multa, Empresa
import logging

logger = logging.getLogger(__name__)

CRIAR_PROCESSO_APOS_AUTO_CONSTATACAO = False


def _auto_infracao_esta_notificada(auto_infracao) -> bool:
    if getattr(auto_infracao, 'data_notificacao', None):
        return True
    status = (getattr(auto_infracao, 'status', '') or '').lower()
    return status in {'notificado', 'em_defesa', 'em_recurso', 'julgado', 'pago', 'finalizado'}


def criar_processo_apos_auto_constatacao(auto_constatacao):
    """
    Função auxiliar para criar processo administrativo e protocolo após Auto de Constatação.
    Esta função é chamada pelos signals de todos os tipos de Auto de Constatação.
    """
    if not CRIAR_PROCESSO_APOS_AUTO_CONSTATACAO:
        logger.info("Processo nao criado a partir de Auto de Constatacao (regra desativada).")
        return None
    try:
        # Verifica se já existe processo para este auto de constatação
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(auto_constatacao)
        
        processo_existente = Processo.objects.filter(
            auto_constatacao_content_type=content_type,
            auto_constatacao_id=auto_constatacao.id
        ).first()
        
        if processo_existente:
            logger.info(f"Processo {processo_existente.numero_processo} já existe para Auto {auto_constatacao.numero}")
            return processo_existente
        
        # Busca setor de origem (Fiscalização) e setor destino inicial
        from protocolo_tramitacao.models import Setor, ProtocoloDocumento, TipoDocumento
        
        setor_fiscalizacao = Setor.objects.filter(sigla__icontains='FISC').first()
        setor_destino = Setor.objects.filter(sigla__icontains='JUR').first()
        
        if not setor_destino:
            # Se não existe setor jurídico, cria um padrão
            setor_destino = Setor.objects.create(
                nome='Setor Jurídico',
                sigla='JUR',
                pode_protocolar=True,
                pode_tramitar=True
            )
        
        if not setor_fiscalizacao:
            setor_fiscalizacao = setor_destino
        
        # Busca usuário do sistema para protocolar
        usuario_sistema = User.objects.filter(is_staff=True).first()
        if not usuario_sistema:
            usuario_sistema = User.objects.filter(is_superuser=True).first()
        
        # Cria processo administrativo
        processo = Processo.objects.create(
            auto_constatacao_content_type=content_type,
            auto_constatacao_id=auto_constatacao.id,
            autuado=auto_constatacao.razao_social,
            cnpj=auto_constatacao.cnpj,
            status='aguardando_auto_infracao',
            prioridade='normal',
            fiscal_responsavel=getattr(auto_constatacao, 'fiscal_nome_1', '') or getattr(auto_constatacao, 'fiscal_nome', ''),
            observacoes=f"Processo criado automaticamente após Auto de Constatação {auto_constatacao.numero}"
        )
        
        logger.info(f"✅ Processo {processo.numero_processo} criado automaticamente para Auto de Constatação {auto_constatacao.numero}")
        
        # Cria ProtocoloDocumento vinculado ao processo
        if usuario_sistema:
            try:
                tipo_doc, _ = TipoDocumento.objects.get_or_create(
                    nome="Auto de Constatação",
                    defaults={
                        'descricao': 'Auto de constatação para tramitação',
                        'prazo_resposta_dias': 15,
                        'requer_assinatura': False
                    }
                )
                
                protocolo = ProtocoloDocumento.objects.create(
                    tipo_documento=tipo_doc,
                    origem='FISCALIZACAO',
                    assunto=f"Auto de Constatação {auto_constatacao.numero} - {auto_constatacao.razao_social}",
                    descricao=f"Tramitação do Auto de Constatação {auto_constatacao.numero}",
                    remetente_nome=auto_constatacao.razao_social,
                    remetente_documento=auto_constatacao.cnpj,
                    processo_fiscalizacao=processo,
                    setor_atual=setor_destino,
                    setor_origem=setor_fiscalizacao,
                    protocolado_por=usuario_sistema,
                    responsavel_atual=setor_destino.responsavel
                )
                
                logger.info(f"✅ Protocolo {protocolo.numero_protocolo} criado para processo {processo.numero_processo}")
                
            except Exception as e:
                logger.error(f"❌ Erro ao criar protocolo para processo {processo.numero_processo}: {e}")
        
        return processo
        
    except Exception as e:
        logger.exception(f"❌ Erro ao criar processo para Auto de Constatação {getattr(auto_constatacao, 'numero', '')}: {e}")
        return None


# Signals para criar processo após Auto de Constatação (todos os tipos)
@receiver(post_save, sender=AutoBanco)
def criar_processo_auto_banco(sender, instance, created, **kwargs):
    """Cria processo automaticamente após Auto de Banco"""
    if created and not hasattr(instance, '_skip_processo') and CRIAR_PROCESSO_APOS_AUTO_CONSTATACAO:
        criar_processo_apos_auto_constatacao(instance)


@receiver(post_save, sender=AutoPosto)
def criar_processo_auto_posto(sender, instance, created, **kwargs):
    """Cria processo automaticamente após Auto de Posto"""
    if created and not hasattr(instance, '_skip_processo') and CRIAR_PROCESSO_APOS_AUTO_CONSTATACAO:
        criar_processo_apos_auto_constatacao(instance)


@receiver(post_save, sender=AutoSupermercado)
def criar_processo_auto_supermercado(sender, instance, created, **kwargs):
    """Cria processo automaticamente após Auto de Supermercado"""
    if created and not hasattr(instance, '_skip_processo') and CRIAR_PROCESSO_APOS_AUTO_CONSTATACAO:
        criar_processo_apos_auto_constatacao(instance)


@receiver(post_save, sender=AutoDiversos)
def criar_processo_auto_diversos(sender, instance, created, **kwargs):
    """Cria processo automaticamente após Auto de Diversos"""
    if created and not hasattr(instance, '_skip_processo') and CRIAR_PROCESSO_APOS_AUTO_CONSTATACAO:
        criar_processo_apos_auto_constatacao(instance)


@receiver(post_save, sender=AutoInfracao)
def criar_processo_automatico(sender, instance, created, **kwargs):
    """
    Vincula Auto de Infração ao processo existente (criado após Auto de Constatação)
    ou cria novo processo se não houver AC relacionado.
    """
    if not hasattr(instance, '_skip_processo'):
        if not _auto_infracao_esta_notificada(instance):
            return
        try:
            # Verifica se já existe processo vinculado a este auto de infração
            processo_existente = Processo.objects.filter(auto_infracao=instance).first()
            if processo_existente:
                logger.info(f"Processo {processo_existente.numero_processo} já está vinculado ao Auto {instance.numero}")
                return
            
            # Tenta buscar processo existente através do Auto de Constatação relacionado
            processo = None
            auto_constatacao = None
            
            # Verifica se o Auto de Infração está relacionado a um Auto de Constatação
            # através de GenericForeignKey (content_type e object_id)
            if hasattr(instance, 'content_type') and hasattr(instance, 'object_id'):
                if instance.content_type and instance.object_id:
                    auto_constatacao = instance.content_type.get_object_for_this_type(id=instance.object_id)
                    
                    # Busca processo relacionado ao auto de constatação
                    content_type = ContentType.objects.get_for_model(auto_constatacao)
                    processo = Processo.objects.filter(
                        auto_constatacao_content_type=content_type,
                        auto_constatacao_id=auto_constatacao.id
                    ).first()
            
            if processo:
                # Vincula o Auto de Infração ao processo existente e atualiza status
                processo.auto_infracao = instance
                processo.valor_multa = instance.valor_multa
                processo.status = 'aguardando_defesa'
                
                # Calcula prazos baseados na data de notificação
                if instance.data_notificacao:
                    processo.data_notificacao = instance.data_notificacao
                    if hasattr(processo, 'calcular_prazos'):
                        processo.calcular_prazos()
                else:
                    # Assume notificação em 7 dias se não especificado
                    processo.data_notificacao = timezone.now().date() + timezone.timedelta(days=7)
                
                processo.observacoes = f"{processo.observacoes}\nAuto de Infração {instance.numero} vinculado ao processo".strip()
                processo.save()
                
                logger.info(f"✅ Auto de Infração {instance.numero} vinculado ao processo existente {processo.numero_processo}")
            else:
                # Se não há processo relacionado ao AC, cria novo processo
                # (caso onde o AI foi criado diretamente sem AC)
                processo = Processo.objects.create(
                    auto_infracao=instance,
                    autuado=instance.razao_social,
                    cnpj=instance.cnpj,
                    valor_multa=instance.valor_multa,
                    fiscal_responsavel=instance.fiscal_nome,
                    status='aguardando_defesa',
                    observacoes=f"Processo criado automaticamente a partir do Auto de Infração {instance.numero} (sem AC relacionado)"
                )
                
                # Calcula prazos baseados na data de notificação
                if instance.data_notificacao:
                    processo.data_notificacao = instance.data_notificacao
                else:
                    processo.data_notificacao = timezone.now().date() + timezone.timedelta(days=7)
                
                if hasattr(processo, 'calcular_prazos'):
                    processo.calcular_prazos()
                    processo.save()
                
                logger.info(f"✅ Novo processo {processo.numero_processo} criado para Auto de Infração {instance.numero} (sem AC)")
            
        except Exception as e:
            logger.exception(f"❌ Erro ao vincular/criar processo para Auto {instance.numero}: {e}")


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

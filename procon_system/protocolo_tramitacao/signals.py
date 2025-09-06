"""
SISPROCON - Signals para Protocolo e Tramitação
Automatiza a criação de protocolos para diferentes tipos de documentos
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from fiscalizacao.models import AutoInfracao, Processo
from multas.models import Multa
from .models import ProtocoloDocumento, Setor


@receiver(post_save, sender=AutoInfracao)
def criar_protocolo_auto_infracao(sender, instance, created, **kwargs):
    """
    Automaticamente cria protocolo quando um Auto de Infração é criado
    """
    if created and not hasattr(instance, '_skip_protocolo'):
        # Busca setor responsável pela análise jurídica
        setor_juridico = Setor.objects.filter(
            sigla__icontains='JUR'
        ).first()
        
        if not setor_juridico:
            # Se não existe setor jurídico, cria um padrão
            setor_juridico = Setor.objects.create(
                nome='Setor Jurídico',
                sigla='JUR',
                pode_protocolar=True,
                pode_tramitar=True
            )
        
        # Busca usuário do sistema para protocolar
        usuario_sistema = User.objects.filter(is_staff=True).first()
        if not usuario_sistema:
            # Cria usuário sistema se não existir
            usuario_sistema = User.objects.create_user(
                username='sistema_protocolo',
                email='sistema@procon.gov.br',
                is_staff=True
            )
        
        try:
            # Cria protocolo automaticamente
            protocolo = ProtocoloDocumento.criar_a_partir_de_auto_infracao(
                auto_infracao=instance,
                setor_destino=setor_juridico,
                usuario=usuario_sistema
            )
            
            print(f"✅ Protocolo {protocolo.numero_protocolo} criado automaticamente para Auto {instance.numero}")
            
        except Exception as e:
            print(f"❌ Erro ao criar protocolo para Auto {instance.numero}: {e}")


@receiver(post_save, sender=Multa)
def criar_protocolo_multa(sender, instance, created, **kwargs):
    """
    Automaticamente cria protocolo quando uma Multa é criada
    """
    if created and not hasattr(instance, '_skip_protocolo'):
        # Busca setor responsável pela cobrança
        setor_financeiro = Setor.objects.filter(
            sigla__icontains='FIN'
        ).first()
        
        if not setor_financeiro:
            # Se não existe setor financeiro, cria um padrão
            setor_financeiro = Setor.objects.create(
                nome='Setor Financeiro',
                sigla='FIN',
                pode_protocolar=True,
                pode_tramitar=True
            )
        
        # Busca usuário do sistema para protocolar
        usuario_sistema = User.objects.filter(is_staff=True).first()
        if not usuario_sistema:
            return  # Se não há usuário, não cria protocolo
        
        try:
            # Cria protocolo automaticamente
            protocolo = ProtocoloDocumento.criar_a_partir_de_multa(
                multa=instance,
                setor_destino=setor_financeiro,
                usuario=usuario_sistema
            )
            
            print(f"✅ Protocolo {protocolo.numero_protocolo} criado automaticamente para Multa #{instance.pk}")
            
        except Exception as e:
            print(f"❌ Erro ao criar protocolo para Multa #{instance.pk}: {e}")


@receiver(post_save, sender=Processo)
def atualizar_protocolo_processo(sender, instance, created, **kwargs):
    """
    Atualiza protocolo quando status do processo muda
    """
    if not created:  # Só para atualizações, não criações
        try:
            # Busca protocolo relacionado ao auto de infração do processo
            if instance.auto_infracao:
                protocolo = ProtocoloDocumento.objects.filter(
                    auto_infracao=instance.auto_infracao
                ).first()
                
                if protocolo:
                    # Mapeia status do processo para status do protocolo
                    status_map = {
                        'aguardando_defesa': 'AGUARDANDO_ANALISE',
                        'defesa_apresentada': 'EM_ANALISE',
                        'em_analise': 'EM_ANALISE',
                        'aguardando_recurso': 'AGUARDANDO_DECISAO',
                        'recurso_apresentado': 'EM_ANALISE',
                        'julgamento': 'EM_ANALISE',
                        'finalizado_procedente': 'DECIDIDO',
                        'finalizado_improcedente': 'DECIDIDO',
                        'arquivado': 'ARQUIVADO',
                        'prescrito': 'ARQUIVADO',
                    }
                    
                    novo_status = status_map.get(instance.status)
                    if novo_status and protocolo.status != novo_status:
                        protocolo.status = novo_status
                        protocolo.observacoes = f"{protocolo.observacoes}\nStatus atualizado: {instance.get_status_display()}".strip()
                        protocolo.save()
                        
                        print(f"✅ Protocolo {protocolo.numero_protocolo} atualizado para status: {novo_status}")
                        
        except Exception as e:
            print(f"❌ Erro ao atualizar protocolo do processo {instance.numero_processo}: {e}")


def configurar_setores_padrao():
    """
    Função utilitária para criar setores padrão do sistema
    """
    try:
        # Verificar se a tabela existe antes de tentar acessá-la
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='protocolo_tramitacao_setor'
            """)
            if not cursor.fetchone():
                print("⚠️  Tabela de setores não existe ainda. Execute as migrations primeiro.")
                return []
    except Exception as e:
        print(f"⚠️  Erro ao verificar tabela de setores: {e}")
        return []

    setores_padrao = [
        {
            'nome': 'Setor de Fiscalização',
            'sigla': 'FISC',
            'email': 'fiscalizacao@procon.gov.br',
            'pode_protocolar': True,
            'pode_tramitar': True
        },
        {
            'nome': 'Setor Jurídico',
            'sigla': 'JUR',
            'email': 'juridico@procon.gov.br',
            'pode_protocolar': True,
            'pode_tramitar': True
        },
        {
            'nome': 'Setor Financeiro',
            'sigla': 'FIN',
            'email': 'financeiro@procon.gov.br',
            'pode_protocolar': True,
            'pode_tramitar': True
        },
        {
            'nome': 'Diretoria',
            'sigla': 'DIR',
            'email': 'diretoria@procon.gov.br',
            'pode_protocolar': True,
            'pode_tramitar': True
        },
        {
            'nome': 'Protocolo Central',
            'sigla': 'PROT',
            'email': 'protocolo@procon.gov.br',
            'pode_protocolar': True,
            'pode_tramitar': True
        }
    ]
    
    setores_criados = []
    for setor_data in setores_padrao:
        try:
            setor, created = Setor.objects.get_or_create(
                sigla=setor_data['sigla'],
                defaults=setor_data
            )
            if created:
                setores_criados.append(setor.nome)
        except Exception as e:
            print(f"⚠️  Erro ao criar setor {setor_data['sigla']}: {e}")
    
    if setores_criados:
        print(f"✅ Setores criados: {', '.join(setores_criados)}")
    
    return setores_criados
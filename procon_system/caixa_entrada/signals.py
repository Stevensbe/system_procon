"""
Signals para integração automática da Caixa de Entrada com outros módulos
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import CaixaEntrada, HistoricoCaixaEntrada


@receiver(post_save, sender='peticionamento.PeticaoEletronica')
def criar_documento_caixa_entrada_peticao(sender, instance, created, **kwargs):
    """
    Cria documento na caixa de entrada quando uma petição é criada
    """
    if created and instance.origem == 'PORTAL_CIDADAO':
        try:
            # Determinar setor destino baseado no tipo de petição
            setor_destino = 'Jurídico'  # Padrão para petições do portal
            if instance.tipo_peticao.categoria in ['RECURSO', 'DEFESA']:
                setor_destino = 'Jurídico'
            elif instance.tipo_peticao.categoria in ['SOLICITACAO']:
                setor_destino = 'Atendimento'
            
            # Determinar prioridade
            prioridade = 'NORMAL'
            if instance.prioridade == 'URGENTE':
                prioridade = 'URGENTE'
            elif instance.prioridade == 'ALTA':
                prioridade = 'ALTA'
            
            # Criar documento na caixa de entrada
            documento = CaixaEntrada.objects.create(
                tipo_documento='PETICAO',
                assunto=instance.assunto,
                descricao=instance.descricao,
                prioridade=prioridade,
                remetente_nome=instance.peticionario_nome,
                remetente_documento=instance.peticionario_documento,
                remetente_email=instance.peticionario_email,
                remetente_telefone=instance.peticionario_telefone,
                empresa_nome=instance.empresa_nome,
                empresa_cnpj=instance.empresa_cnpj,
                setor_destino=setor_destino,
                prazo_resposta=instance.prazo_resposta,
                origem='PORTAL_CIDADAO',
                ip_origem=instance.ip_origem,
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='CRIADO',
                detalhes=f'Petição criada via Portal do Cidadão - Tipo: {instance.tipo_peticao.nome}'
            )
            
            print(f"Documento {documento.numero_protocolo} criado na caixa de entrada para petição {instance.numero_peticao}")
            
        except Exception as e:
            print(f"Erro ao criar documento na caixa de entrada para petição {instance.numero_peticao}: {e}")





@receiver(post_save, sender='multas.Multa')
def criar_documento_caixa_entrada_multa(sender, instance, created, **kwargs):
    """
    Cria documento na caixa de entrada quando uma multa é criada
    """
    if created:
        try:
            # Criar documento na caixa de entrada
            documento = CaixaEntrada.objects.create(
                tipo_documento='MULTA',
                assunto=f'Multa - {instance.empresa.razao_social}',
                descricao=f'Multa {instance.numero} - Valor: R$ {instance.valor}',
                prioridade='NORMAL',
                remetente_nome=instance.empresa.razao_social,
                remetente_documento=instance.empresa.cnpj,
                empresa_nome=instance.empresa.razao_social,
                empresa_cnpj=instance.empresa.cnpj,
                setor_destino='Cobrança',
                origem='MULTAS',
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='CRIADO',
                detalhes=f'Multa {instance.numero} criada'
            )
            
            print(f"Documento {documento.numero_protocolo} criado na caixa de entrada para multa {instance.numero}")
            
        except Exception as e:
            print(f"Erro ao criar documento na caixa de entrada para multa {instance.numero}: {e}")


@receiver(post_save, sender='juridico.ProcessoJuridico')
def criar_documento_caixa_entrada_processo_juridico(sender, instance, created, **kwargs):
    """
    Cria documento na caixa de entrada quando um processo jurídico é criado
    """
    if created:
        try:
            # Criar documento na caixa de entrada
            documento = CaixaEntrada.objects.create(
                tipo_documento='PROTOCOLO',
                assunto=f'Processo Jurídico - {instance.parte}',
                descricao=f'Processo {instance.numero} - {instance.assunto}',
                prioridade=instance.prioridade,
                remetente_nome=instance.parte,
                remetente_documento=instance.empresa_cnpj,
                empresa_nome=instance.parte,
                empresa_cnpj=instance.empresa_cnpj,
                setor_destino='Jurídico',
                responsavel_atual=instance.analista.user if instance.analista else None,
                origem='JURIDICO',
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='CRIADO',
                detalhes=f'Processo jurídico {instance.numero} criado'
            )
            
            print(f"Documento {documento.numero_protocolo} criado na caixa de entrada para processo {instance.numero}")
            
        except Exception as e:
            print(f"Erro ao criar documento na caixa de entrada para processo {instance.numero}: {e}")


@receiver(post_save, sender='portal_cidadao.DenunciaCidadao')
def criar_documento_caixa_entrada_denuncia(sender, instance, created, **kwargs):
    """
    Cria documento na caixa de entrada quando uma denúncia é criada via Portal do Cidadão
    """
    if created:
        try:
            # Preparar dados do remetente baseado no anonimato
            if instance.denuncia_anonima:
                remetente_nome = "Denunciante Anônimo"
                remetente_documento = "N/A"
                remetente_email = "anonimo@procon.gov.br"
                remetente_telefone = "N/A"
                assunto = f'Denúncia Anônima - {instance.empresa_denunciada}'
            else:
                remetente_nome = instance.nome_denunciante
                remetente_documento = instance.cpf_cnpj
                remetente_email = instance.email
                remetente_telefone = instance.telefone
                assunto = f'Denúncia - {instance.empresa_denunciada}'
            
            # Criar documento na caixa de entrada para DENÚNCIAS
            documento = CaixaEntrada.objects.create(
                tipo_documento='DENUNCIA',
                assunto=assunto,
                descricao=instance.descricao_fatos,
                prioridade='ALTA',
                remetente_nome=remetente_nome,
                remetente_documento=remetente_documento,
                remetente_email=remetente_email,
                remetente_telefone=remetente_telefone,
                empresa_nome=instance.empresa_denunciada,
                empresa_cnpj=instance.cnpj_empresa,
                setor_destino='Fiscalização',
                origem='PORTAL_CIDADAO',
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='CRIADO',
                detalhes=f'Denúncia criada via Portal do Cidadão - {instance.numero_denuncia}'
            )
            
            print(f"Documento {documento.numero_protocolo} criado na Caixa de Denúncias para denúncia {instance.numero_denuncia}")
            
        except Exception as e:
            print(f"Erro ao criar documento na caixa de entrada para denúncia {instance.numero_denuncia}: {e}")


@receiver(post_save, sender='fiscalizacao.AutoInfracao')
def criar_documento_caixa_entrada_auto_fiscal(sender, instance, created, **kwargs):
    """
    Cria documento na caixa de entrada quando um auto de infração é criado pelo fiscal
    """
    if created and instance.origem_denuncia != 'PORTAL_CIDADAO':
        try:
            # Criar documento na caixa de entrada para AUTOS DE FISCALIZAÇÃO
            documento = CaixaEntrada.objects.create(
                tipo_documento='AUTO_INFRACAO',
                assunto=f'Auto de Infração - {instance.razao_social}',
                descricao=f'Auto de infração {instance.numero_auto} - {instance.descricao_infracao}',
                prioridade='ALTA',
                remetente_nome=instance.razao_social,
                remetente_documento=instance.cnpj,
                empresa_nome=instance.razao_social,
                empresa_cnpj=instance.cnpj,
                setor_destino='Fiscalização',
                origem='FISCALIZACAO',
                content_type=ContentType.objects.get_for_model(instance),
                object_id=instance.id
            )
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='CRIADO',
                detalhes=f'Auto de infração {instance.numero_auto} criado pelo fiscal'
            )
            
            print(f"Documento {documento.numero_protocolo} criado na Caixa de Autos para auto {instance.numero_auto}")
            
        except Exception as e:
            print(f"Erro ao criar documento na caixa de entrada para auto {instance.numero_auto}: {e}")


# Signal para atualizar status da caixa de entrada quando documento relacionado é atualizado
@receiver(post_save, sender=CaixaEntrada)
def atualizar_status_caixa_entrada(sender, instance, created, **kwargs):
    """
    Atualiza status da caixa de entrada baseado no documento relacionado
    """
    if not created and instance.documento_relacionado:
        try:
            # Verificar se o documento relacionado foi respondido
            if hasattr(instance.documento_relacionado, 'status'):
                status_relacionado = instance.documento_relacionado.status
                
                # Mapear status do documento relacionado para status da caixa de entrada
                if status_relacionado in ['RESPONDIDO', 'FINALIZADO', 'CONCLUIDO']:
                    if instance.status != 'RESPONDIDO':
                        instance.status = 'RESPONDIDO'
                        instance.save()
                        
                        # Registrar no histórico
                        HistoricoCaixaEntrada.objects.create(
                            documento=instance,
                            acao='STATUS_ALTERADO',
                            detalhes=f'Status alterado para RESPONDIDO baseado no documento relacionado'
                        )
                
                elif status_relacionado in ['ARQUIVADO', 'CANCELADO']:
                    if instance.status != 'ARQUIVADO':
                        instance.status = 'ARQUIVADO'
                        instance.save()
                        
                        # Registrar no histórico
                        HistoricoCaixaEntrada.objects.create(
                            documento=instance,
                            acao='STATUS_ALTERADO',
                            detalhes=f'Status alterado para ARQUIVADO baseado no documento relacionado'
                        )
            
        except Exception as e:
            print(f"Erro ao atualizar status da caixa de entrada {instance.numero_protocolo}: {e}")

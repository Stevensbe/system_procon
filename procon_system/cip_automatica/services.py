"""
Serviços para CIP (Carta de Intimação para Pagamento) Automática
Sistema Procon - Fase 4 - Fluxo Completo do Atendimento
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from django.utils import timezone
from django.db import transaction, models
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from .models import CIPAutomatica, TipoCIP, RespostaEmpresa, AudienciaConciligiao
from portal_cidadao.models import ReclamacaoDenuncia
from caixa_entrada.models import CaixaEntrada
from logging_config import logger_manager, LoggedOperation, log_execution_time


class CIPGenerationService:
    """Serviço para geração automática de CIPs"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('cip_generation')
        
    @log_execution_time('cip_generation')
    def gerar_cip_automatica(self, reclamacao_id: int, tipo_cip_id: int, 
                           valor_indenizacao: float, observacoes: str = "") -> CIPAutomatica:
        """Gera CIP automática a partir de uma reclamação"""
        
        with LoggedOperation('gerar_cip_automatica', {
            'reclamacao_id': reclamacao_id,
            'tipo_cip_id': tipo_cip_id,
            'valor_indenizacao': valor_indenizacao,
        }):
            try:
                # Buscar reclamação
                reclamacao = ReclamacaoDenuncia.objects.get(id=reclamacao_id)
                tipo_cip = TipoCIP.objects.get(id=tipo_cip_id)
                
                # Validar elegibilidade
                self._validar_elegibilidade(reclamacao, tipo_cip, valor_indenizacao)
                
                # Criar CIP
                with transaction.atomic():
                    cip = CIPAutomatica.objects.create(
                        tipo_cip=tipo_cip,
                        assunto=f"CIP - {reclamacao.descricao_fatos[:100]}",
                        
                        # Dados do consumidor
                        consumidor_nome=reclamacao.consumidor_nome,
                        consumidor_cpf=reclamacao.consumidor_cpf,
                        consumidor_email=reclamacao.consumidor_email,
                        consumidor_telefone=reclamacao.consumidor_telefone,
                        consumidor_endereco=reclamacao.consumidor_endereco,
                        consumidor_cidade=reclamacao.consumidor_cidade,
                        consumidor_uf=reclamacao.consumidor_uf,
                        consumidor_cep=reclamacao.consumidor_cep,
                        
                        # Dados da empresa
                        empresa_razao_social=reclamacao.empresa_razao_social,
                        empresa_cnpj=reclamacao.empresa_cnpj,
                        empresa_endereco=reclamacao.empresa_endereco,
                        empresa_cidade=reclamacao.consumidor_cidade,  # Usar da empresa se disponível
                        empresa_uf=reclamacao.consumidor_uf,
                        empresa_email=reclamacao.empresa_email,
                        empresa_telefone=reclamacao.empresa_telefone,
                        
                        # Dados do caso
                        descricao_fatos=reclamacao.descricao_fatos,
                        valor_indenizicao=valor_indenizacao,
                        valor_multa=self._calcular_multa(valor_indenizicao),
                        
                        # Controle
                        observacoes=observacoes,
                        setor_responsavel=tipo_cip.setor_responsavel,
                    )
                    
                    # Vincular documento origem se existir
                    try:
                        documento_origem = CaixaEntrada.objects.filter(
                            content_object=reclamacao
                        ).first()
                        if documento_origem:
                            cip.documento_origem = documento_origem
                            cip.save()
                    except Exception:
                        pass  # Não crítico se não encontrar
                    
                    # Registrar no log
                    self.logger.log_operation('cip_gerada', {
                        'cip_id': cip.id,
                        'numero_cip': cip.numero_cip,
                        'valor_total': float(cip.valor_total),
                        'empresa': reclamacao.empresa_razao_social,
                        'consumidor': reclamacao.consumidor_nome,
                    })
                    
                    return cip
                    
            except Exception as e:
                self.logger.error(f'Erro na geração de CIP: {str(e)}', exc_info=True)
                raise
    
    @log_execution_time('cip_validation')
    def _validar_elegibilidade(self, reclamacao: ReclamacaoDenuncia, 
                              tipo_cip: TipoCIP, valor_indenizacao: float):
        """Valida se uma reclamação é elegível para CIP"""
        
        # Verificar valor mínimo
        if valor_indenizacao < tipo_cip.valor_minimo:
            raise ValueError(f"Valor mínimo não atingido para {tipo_cip.nome}")
        
        # Verificar valor máximo se definido
        if tipo_cip.valor_maximo and valor_indenizacao > tipo_cip.valor_maximo:
            raise ValueError(f"Valor máximo excedido para {tipo_cip.nome}")
        
        # Verificar se já existe CIP para esta reclamação
        if CIPAutomatica.objects.filter(
            consumidor_cpf=reclamacao.consumidor_cpf,
            empresa_cnpj=reclamacao.empresa_cnpj,
            descricao_fatos__icontains=reclamacao.descricao_fatos[:100]
        ).exists():
            raise ValueError("Já existe CIP para esta reclamação")
        
        # Log da validação
        self.logger.info(f'Validação de elegibilidade passou para CIP {tipo_cip.nome}')
    
    def _calcular_multa(self, valor_indenizacao: float) -> float:
        """Calcula multa baseada no valor da indenização"""
        # Lógica de cálculo de multa (pode ser configurável)
        if valor_indenizacao <= 1000:
            multa = valor_indenizacao * 0.1  # 10%
        elif valor_indenizacao <= 5000:
            multa = valor_indenizacao * 0.08  # 8%
        else:
            multa = valor_indenizacao * 0.05  # 5%
        
        return max(multa, 100)  # Mínimo de R$ 100,00


class CIPDocumentService:
    """Serviço para geração de documentos da CIP"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('cip_documents')
    
    @log_execution_time('cip_document_generation')
    def gerar_documento_cip(self, cip: CIPAutomatica) -> str:
        """Gera documento formal da CIP"""
        
        with LoggedOperation('gerar_documento_cip', {
            'cip_id': cip.id,
            'numero_cip': cip.numero_cip,
        }):
            try:
                # Context para template
                context = {
                    'cip': cip,
                    'agora': timezone.now().strftime('%d/%m/%Y'),
                    'prefeitura_nome': 'Prefeitura Municipal (exemplo)',
                    'procon_endereco': 'Rua do Procon, 123',
                }
                
                # Renderizar template (placeholder - seria arquivo HTML real)
                documento_html = f"""
                <html>
                <head>
                    <title>CIP {cip.numero_cip}</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 40px; }}
                        .header {{ text-align: center; border-bottom: 2px solid #333; }}
                        .content {{ margin-top: 20px; }}
                        .valor {{ font-weight: bold; color: #d32f2f; }}
                        .prazo {{ color: #1976d2; }}
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>CARTA DE INTIMAÇÃO PARA PAGAMENTO</h1>
                        <p>CIP Nº {cip.numero_cip}</p>
                        <p>{timezone.now().strftime('%d/%m/%Y')}</p>
                    </div>
                    
                    <div class="content">
                        <h2>Dados da Empresa:</h2>
                        <p><strong>Nome:</strong> {cip.empresa_razao_social}</p>
                        <p><strong>CNPJ:</strong> {cip.empresa_cnpj}</p>
                        <p><strong>Endereço:</strong> {cip.empresa_endereco}</p>
                        
                        <h2>Dados do Consumidor:</h2>
                        <p><strong>Nome:</strong> {cip.consumidor_nome}</p>
                        <p><strong>CPF:</strong> {cip.consumidor_cpf}</p>
                        <p><strong>Endereço:</strong> {cip.consumidor_endereco}</p>
                        
                        <h2>Objeto da CIP:</h2>
                        <p>{cip.descricao_fatos}</p>
                        
                        <h2>Valores:</h2>
                        <p class="valor">Valor da Indenização: R$ {cip.valor_indenizacao:,.2f}</p>
                        <p class="valor">Valor da Multa: R$ {cip.valor_multa:,.2f}</p>
                        <p class="valor"><strong>Valor Total: R$ {cip.valor_total:,.2f}</strong></p>
                        
                        <h2>Prazos:</h2>
                        <p class="prazo">Prazo para resposta da empresa: {cip.prazo_resposta_empresa.strftime('%d/%m/%Y')}</p>
                        <p class="prazo">Prazo para acordo de pagamento: {cip.prazo_acordo_pagamento.strftime('%d/%m/%Y')}</p>
                    </div>
                </body>
                </html>
                """
                
                # Salvar documento (em produção seria PDF real)
                documento_path = f'cip/documentos/cip_{cip.numero_cip}_{timezone.now().strftime("%Y%m%d")}.html'
                
                self.logger.log_operation('documento_cip_gerado', {
                    'cip_id': cip.id,
                    'numero_cip': cip.numero_cip,
                    'documento_path': documento_path,
                })
                
                return documento_path
                
            except Exception as e:
                self.logger.error(f'Erro na geração de documento: {str(e)}', exc_info=True)
                raise


class CIPDispatchService:
    """Serviço para envio e disparos de CIP"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('cip_dispatch')
    
    @log_execution_time('cip_dispatch')
    def enviar_cip_empresa(self, cip: CIPAutomatica, metodo_envio: str = 'email') -> Dict[str, Any]:
        """Envia CIP para a empresa pelos canais disponíveis"""
        
        with LoggedOperation('enviar_cip_empresa', {
            'cip_id': cip.id,
            'numero_cip': cip.numero_cip,
            'metodo_envio': metodo_envio,
        }):
            try:
                resultados_envio = {}
                
                if metodo_envio == 'email' and cip.empresa_email:
                    resultados_envio['email'] = self._enviar_email_empressor(cip)
                elif metodo_envio == 'correios':
                    resultados_envio['correios'] = self._enviar_correios(cip)
                elif metodo_envio == 'juridico':
                    resultados_envio['juridico'] = self._enviar_despacho_juridico(cip)
                
                # Atualizar status da CIP
                cip.status = 'ENVIADA'
                cip.data_envio_producao = timezone.now()
                cip.save()
                
                self.logger.log_operation('cip_enviada', {
                    'cip_id': cip.id,
                    'numero_cip': cip.numero_cip,
                    'resultados_envio': resultados_envio,
                })
                
                return resultados_envio
                
            except Exception as e:
                self.logger.error(f'Erro no envio da CIP: {str(e)}', exc_info=True)
                raise
    
    def _enviar_email_empressor(self, cip: CIPAutomatica) -> Dict[str, str]:
        """Envia email para a empresa"""
        try:
            assunto = f"CIP {cip.numero_cip} - {cip.assunto}"
            mensagem = f"""
            Prezada Empresa {cip.empresa_razao_social},
            
            Você recebeu uma Carta de Intimação para Pagamento (CIP) relacionada a:
            Documento: CIP Nº {cip.numero_cip}
            Valor Total: R$ {cip.valor_total:,.2f}
            Prazo para Resposta: {cip.prazo_resposta_empresa.strftime('%d/%m/%Y')}
            
            Para acessar e responder, clique aqui: [link_para_portal_empresa]
            
            Atenciosamente,
            Departamento de Atendimento - PROCON
            """
            
            # Em produção, enviaria email real
            self.logger.info(f'Email enviado para {cip.empresa_email}: {assunto}')
            
            return {
                'status': 'enviado',
                'email': cip.empresa_email,
                'timestamp': timezone.now().isoformat(),
            }
            
        except Exception as e:
            self.logger.logger.error(f'Erro no envio de email: {str(e)}')
            return {'status': 'erro', 'erro': str(e)}
    
    def _enviar_correios(self, cip: CIPAutomatica) -> Dict[str, str]:
        """Simula envio via Correios"""
        return {
            'status': 'agendado',
            'tracking': f'BR{cip.numero_cip}',
            'timestamp': timezone.now().isoformat(),
        }
    
    def _enviar_despacho_juridico(self, cip: CIPAutomatica) -> Dict[str, str]:
        """Envia para produção jurídica"""
        cip.status = 'PRODUCAO_JURIDICA'
        cip.save()
        
        return {
            'status': 'encaminhado',
            'setor_destino': 'Produção Jurídica',
            'timestamp': timezone.now().isoformat(),
        }


class CIPTrackingService:
    """Serviço para rastreamento e monitoramento de CIPs"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('cip_tracking')
    
    @log_execution_time('cip_status_update')
    def atualizar_status_cip(self, cip: CIPAutomatica, novo_status: str, 
                           usuario: Any = None, observacoes: str = ""):
        """Atualiza status da CIP com auditoria"""
        
        status_anterior = cip.status
        cip.status = novo_status
        cip.save()
        
        # Log da mudança de status
        self.logger.log_operation('status_cip_atualizado', {
            'cip_id': cip.id,
            'numero_cip': cip.numero_cip,
            'status_anterior': status_anterior,
            'novo_status': novo_status,
            'usuario_id': usuario.id if usuario else None,
            'observacoes': observacoes,
        })
    
    @log_execution_time('cip_deadline_check')
    def verificar_prazos_vencidos(self) -> List[Dict[str, Any]]:
        """Verifica CIPs com prazos vencidos"""
        
        agora = timezone.now()
        cips_vencidas = CIPAutomatica.objects.filter(
            prazo_resposta_empresa__lt=agora,
            status__in=['ENVIADA', 'PRODUCAO_JURIDICA']
        )
        
        alertas = []
        
        for cip in cips_vencidas:
            dias_vencido = (agora - cip.prazo_resposta_empresa).days
            
            alertas.append({
                'cip_id': cip.id,
                'numero_cip': cip.numero_cip,
                'empresa': cip.empresa_razao_social,
                'consumidor': cip.consumidor_nome,
                'valor_total': float(cip.valor_total),
                'dias_vencido': dias_vencido,
                'status': 'urgente' if dias_vencido > 5 else 'atencao',
            })
        
        # Log dos prazos vencedidos
        if alertas:
            self.logger.logger.warning(f'{len(alertas)} CIPs com prazos vencidos encontrados')
            
        return alertas
    
    def gerar_relatorio_cips_periodo(self, data_inicio: datetime, 
                                    data_fim: datetime) -> Dict[str, Any]:
        """Gera relatório de CIPs por período"""
        
        cips_periodo = CIPAutomatica.objects.filter(
            data_geracao__range=[data_inicio, data_fim]
        )
        
        relatorio = {
            'periodo': {'inicio': data_inicio.date(), 'fim': data_fim.date()},
            'total_cips': cips_periodo.count(),
            'por_status': {'status': 'GERADA', 'count': cips_periodo.filter(status='GERADA').count()},
            'por_tipo': {},  # Implementar agregação por tipo
            'valores_totais': {
                'soma_indenizacao': cips_periodo.aggregate(soma=models.Sum('valor_indenizicao'))['soma'] or 0,
                'soma_multas': cips_periodo.aggregate(soma=models.Sum('valor_multa'))['soma'] or 0,
                'soma_total': cips_periodo.aggregate(soma=models.Sum('valor_total'))['soma'] or 0,
            }
        }
        
        return relatorio


# Instâncias globais dos serviços
cip_generation = CIPGenerationService()
cip_documents = CIPDocumentService()
cip_dispatch = CIPDispatchService()
cip_tracking = CIPTrackingService()


def gerar_cip_workflow_automatico(reclamacao_id: int) -> CIPAutomatica:
    """Workflow completo automático de geração de CIP"""
    
    logger = logger_manager.get_logger('cip_workflow')
    
    with LoggedOperation('cip_workflow_completo', {
        'reclamacao_id': reclamacao_id,
    }):
        try:
            # 1. Gerar CIP automática
            cip = cip_generation.gerar_cip_automatica(
                reclamacao_id=reclamacao_id,
                tipo_cip_id=1,  # Tipo padrão (configurável)
                valor_indenizacao=1000.00,  # Valor padrão (configurável)
                observacoes="CIP gerada automaticamente via sistema"
            )
            
            # 2. Gerar documento
            documento_path = cip_documents.gerar_documento_cip(cip)
            
            # 3. Enviar para empresa
            resultados_envio = cip_dispatch.enviar_cip_empresa(cip, metodo_envio='email')
            
            # 4. Log do workflow completo
            logger.log_operation('workflow_cip_concluido', {
                'cip_id': cip.id,
                'numero_cip': cip.numero_cip,
                'documento_path': documento_path,
                'resultados_envio': resultados_envio,
            })
            
            return cip
            
        except Exception as e:
            logger.logger.error(f'Erro no workflow de CIP: {str(e)}', exc_info=True)
            raise

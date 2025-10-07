"""
Serviços para Fluxo Completo de Atendimento Presencial + Digital
Sistema Procon - Fase 4 - Integração de todos os módulos
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings

from cip_automatica.models import CIPAutomatica, RespostaEmpresa
from audiencia_calendario.models import AgendamentoAudiencia, Mediador
from caixa_entrada.models import CaixaEntrada
from portal_cidadao.models import ReclamacaoDenuncia
from logging_config import logger_manager, LoggedOperation, log_execution_time


class FluxoAtendimentoCompletoService:
    """Serviço integrador para fluxo completo de atendimento"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('fluxo_atendimento_completo')
        
        # Importar serviços dos outros módulos
        from cip_automatica.services import cip_generation, cip_dispatch, cip_tracking
        from audiencia_calendario.services import calendar_service, reagendamento_service
        from resposta_empresa.services import analise_service, relatorio_resposta_service
        
        self.cip_service = cip_generation
        self.cip_dispatch = cip_dispatch
        self.cip_tracking = cip_tracking
        self.calendario_service = calendar_service
        self.reagendamento_service = reagendamento_service
        self.analise_service = analise_service
        self.relatorio_service = relatorio_resposta_service
    
    @log_execution_time('workflow_atendimento_completo')
    def iniciar_workflow_atendimento(self, dados_atendimento: Dict[str, Any], 
                                   usuario_atendente: Any) -> Dict[str, Any]:
        """Inicia workflow completo de atendimento"""
        
        with LoggedOperation('iniciar_workflow_atendimento', {
            'modalidade': dados_atendimento.get('modalidade'),
            'tipo_reclamacao': dados_atendimento.get('tipo_reclamacao'),
            'usuario_atendente_id': usuario_atendente.id,
        }):
            try:
                workflow_id = f"WF_{timezone.now().strftime('%Y%m%d_%H%M%S')}"
                
                resultado = {
                    'workflow_id': workflow_id,
                    'status': 'iniciado',
                    'etapas': {},
                    'timestamp_inicio': timezone.now().isoformat(),
                    'usuario_atendente': usuario_atendente.username,
                }
                
                with transaction.atomic():
                    # 1. Etapa: Registro da Reclamação
                    etapa_registro = self._etapa_registro_reclamacao(dados_atendimento, usuario_atendente)
                    resultado['etapas']['registro_reclamacao'] = etapa_registro
                    
                    # 2. Etapa: Análise de Elegibilidade
                    etapa_analise = self._etapa_analise_elegibilidade(etapa_registro['reclamacao_id'])
                    resultado['etapas']['analise_elegibilidade'] = etapa_analise
                    
                    # 3. Etapa: Geração Automática de CIP (se elegível)
                    if etapa_analise['elegivel_para_cip']:
                        etapa_cip = self._etapa_geracao_cip(etapa_registro['reclamacao_id'], etapa_analise)
                        resultado['etapas']['geracao_cip'] = etapa_cip
                        
                        # 4. Etapa: Envio para Empresa
                        etapa_envio = self._etapa_envio_cip_empresa(etapa_cip['cip_id'])
                        resultado['etapas']['envio_cip'] = etapa_envio
                    
                    # 5. Etapa: Agendamento de Audiência (se necessário)
                    if dados_atendimento.get('solicita_audiencia'):
                        etapa_audiencia = self._etapa_agendamento_audiencia(etapa_registro['reclamacao_id'], dados_atendimento)
                        resultado['etapas']['agendamento_audiencia'] = etapa_audiencia
                    
                    # 6. Etapa: Monitoramento e Follow-up
                    etapa_monitoramento = self._etapa_configurar_monitoramento(resultado)
                    resultado['etapas']['monitoramento'] = etapa_monitoramento
                    
                    # Finalizar workflow
                    resultado['status'] = 'concluido'
                    resultado['timestamp_conclusao'] = timezone.now().isoformat()
                    
                    # Log do workflow completo
                    self.logger.log_operation('workflow_completo_concluido', {
                        'workflow_id': workflow_id,
                        'total_etapas': len(resultado['etapas']),
                        'duracao_minutos': (
                            timezone.now() - 
                            datetime.fromisoformat(resultado['timestamp_inicio'].replace('Z', '+00:00'))
                        ).total_seconds() / 60,
                    })
                    
                    return resultado
                    
            except Exception as e:
                self.logger.error(f'Erro no workflow de atendimento: {str(e)}', exc_info=True)
                resultado['status'] = 'erro'
                resultado['erro'] = str(e)
                return resultado
    
    @log_execution_time('etapa_registro_reclamacao')
    def _etapa_registro_reclamacao(self, dados: Dict[str, Any], usuario: Any) -> Dict[str, Any]:
        """Etapa 1: Registro da reclamação"""
        
        try:
            # Criar reclamação
            reclamacao = ReclamacaoDenuncia.objects.create(
                consumidor_nome=dados['consumidor_nome'],
                consumidor_cpf=dados['consumidor_cpf'],
                consumidor_email=dados['consumidor_email'],
                consumidor_telefone=dados['consumidor_telefone'],
                consumidor_endereco=dados['consumidor_endereco'],
                consumidor_cidade=dados['consumidor_cidade'],
                consumidor_uf=dados['consumidor_uf'],
                consumidor_cep=dados['consumidor_cep'],
                
                empresa_razao_social=dados['empresa_razao_social'],
                empresa_cnpj=dados['empresa_cnpj'],
                empresa_endereco=dados['empresa_endereco'],
                empresa_cidade=dados.get('empresa_cidade', ''),
                empresa_email=dados.get('empresa_email'),
                empresa_telefone=dados.get('empresa_telefone'),
                
                descricao_fatos=dados['descricao_fatos'],
                tipo_reclamacao=dados.get('tipo_reclamacao', 'GERAL'),
                modalidade_atendimento=dados.get('modalidade', 'PRESENCIAL'),
                
                valor_prejuizo=dados.get('valor_prejuizo', 0),
                documentos_anexados=dados.get('documentos_anexados', []),
                
                status='NOVA',
                criado_por=usuario,
            )
            
            self.logger.info(f'Reclamação {reclamacao.id} registrada por {usuario.username}')
            
            return {
                'status': 'sucesso',
                'reclamacao_id': reclamacao.id,
                'numero_protocolo': reclamacao.numero_protocolo,
                'modalidade': dados.get('modalidade', 'PRESENCIAL'),
                'valor_prejuizo': dados.get('valor_prejuizo', 0),
            }
            
        except Exception as e:
            raise Exception(f"Erro ao registrar reclamação: {str(e)}")
    
    @log_execution_time('etapa_analise_elegibilidade')
    def _etapa_analise_elegibilidade(self, reclamacao_id: int) -> Dict[str, Any]:
        """Etapa 2: Análise de elegibilidade para CIP"""
        
        reclamacao = ReclamacaoDenuncia.objects.get(id=reclamacao_id)
        
        criterios = {
            'valor_minimo': reclamacao.valor_prejuizo >= 500,  # Mínimo R$ 500
            'documentos_completos': len(reclamacao.documentos_anexados or []) >= 1,
            'empresa_valida': bool(reclamacao.empresa_cnpj),
            'fatos_detalhados': len(reclamacao.descricao_fatos or '') >= 100,
            
            # Critérios específicos por tipo
            'tipo_elegivel': reclamacao.tipo_reclamacao in [
                'COMPRAS_VENDAS', 'PRESTACAO_SERVICOS', 
                'CARTAO_PAGAMENTO', 'TELEFONIA_INTERNET'
            ],
        }
        
        elegivel_para_cip = all(criterios.values())
        
        # Determinar tipo de CIP recomendado
        tipo_cip_recomendado = self._determinar_tipo_cip_recomendado(reclamacao)
        
        analise = {
            'status': 'concluida',
            'elegivel_para_cip': elegivel_para_cip,
            'criterios': criterios,
            'tipo_cip_recomendado': tipo_cip_recomendado,
            'valor_recomendado_cip': max(reclamacao.valor_prejuizo * 1.5, 1000),  # Valor sugerido
        }
        
        if not elegivel_para_cip:
            analise['alternativas'] = self._sugerir_alternativas(reclamacao)
        
        return analise
    
    def _determinar_tipo_cip_recomendado(self, reclamacao: ReclamacaoDenuncia) -> str:
        """Determina tipo de CIP recomendado baseado na reclamação"""
        
        mapeamento_tipos = {
            'COMPRAS_VENDAS': 'COMPRAS_VENDAS',
            'PRESTACAO_SERVICOS': 'PRESTACAO_SERVICOS',
            'CARTAO_PAGAMENTO': 'CARTAO_PAGAMENTO',
            'TEREFONIA_INTERNET': 'TELEFONIA_INTERNET',
            'EDUCACAO': 'EDUCACAO',
            'SAUDE': 'SAUDE_MEDICAMENTOS',
            'VEICULOS': 'VEICULOS_AUTOMOTIVOS',
        }
        
        return mapeamento_tipos.get(reclamacao.tipo_reclamacao, 'GENERICO')
    
    def _sugerir_alternativas(self, reclamacao: ReclamacaoDenuncia) -> List[str]:
        """Sugere alternativas quando não elegível para CIP"""
        
        alternativas = []
        
        if reclamacao.valor_prejuizo < 500:
            alternativas.append('Orientação jurídica geral (valor abaixo do mínimo)')
        
        if not reclamacao.empresa_cnpj:
            alternativas.append('Verificar dados da empresa antes de prosseguir')
        
        if len(reclamacao.descricao_fatos or '') < 100:
            alternativas.append('Solicitar mais detalhes da situação')
        
        alternativas.append('Audiência de conciliação direta')
        alternativas.append('Orientação preventiva')
        
        return alternativas
    
    @log_execution_time('etapa_geracao_cip')
    def _etapa_geracao_cip(self, reclamacao_id: int, analise: Dict[str, Any]) -> Dict[str, Any]:
        """Etapa 3: Geração automática de CIP"""
        
        try:
            # Determinar tipo de CIP
            tipo_cip = TipoCIP.objects.filter(
                codigo=analise['tipo_cip_recomendado']
            ).first()
            
            if not tipo_cip:
                tipo_cip = TipoCIP.objects.filter(codigo='GENERICO').first()
            
            # Gerar CIP usando serviço
            cip = self.cip_service.gerar_cip_automatica(
                reclamacao_id=reclamacao_id,
                tipo_cip_id=tipo_cip.id,
                valor_indenizacao=analise['valor_recomendado_cip'],
                observacoes=f"CIP gerada automaticamente via workflow de atendimento"
            )
            
            return {
                'status': 'sucesso',
                'cip_id': cip.id,
                'numero_cip': cip.numero_cip,
                'valor_total': float(cip.valor_total),
                'prazo_resposta': cip.prazo_resposta_empresa.isoformat(),
            }
            
        except Exception as e:
            raise Exception(f"Erro ao gerar CIP: {str(e)}")
    
    @log_execution_time('etapa_envio_cip')
    def _etapa_envio_cip_empresa(self, cip_id: str) -> Dict[str, Any]:
        """Etapa 4: Envio da CIP para empresa"""
        
        try:
            cip = CIPAutomatica.objects.get(id=cip_id)
            
            # Determinar melhor método de envio
            metodo_envio = self._determinar_metodo_envio(cip)
            
            # Enviar usando serviço
            resultados = self.cip_dispatch.enviar_cip_empresa(cip, metodo_envio=metodo_envio)
            
            return {
                'status': 'sucesso',
                'metodo_envio': metodo_envio,
                'resultados_envio': resultados,
                'data_envio': timezone.now().isoformat(),
            }
            
        except Exception as e:
            raise Exception(f"Erro ao enviar CIP: {str(e)}")
    
    def _determinar_metodo_envio(self, cip: CIPAutomatica) -> str:
        """Determina melhor método de envio baseado na empresa"""
        
        # Critérios para escolha do método
        if cip.empresa_email:
            return 'email'
        elif cip.valor_total >= 5000:
            return 'juridico'  # CIPs de alto valor vão direto para produção jurídica
        else:
            return 'correios'
    
    @log_execution_time('etapa_agendamento_audiencia')
    def _etapa_agendamento_audiencia(self, reclamacao_id: int, dados_atendimento: Dict[str, Any]) -> Dict[str, Any]:
        """Etapa 5: Agendamento de audiência"""
        
        try:
            # Preparar dados para agendamento
            dados_agendamento = {
                'data_agendamento': dados_atendimento.get('data_audiencia_desejada'),
                'duracao_horas': dados_atendimento.get('duracao_audiencia', 2),
                'modalidade': dados_atendimento.get('modalidade_audiencia', 'VIRTUAL'),
                'participantes_consumidor': dados_atendimento.get('participantes_consumidor', []),
                'participantes_empresa': dados_atendimento.get('participantes_empresa', []),
                'observacoes': f"Audiência solicitada durante atendimento de reclamação {reclamacao_id}",
            }
            
            # Buscar mediador disponível
            if dados_atendimento.get('mediador_preferencial'):
                mediador = Mediador.objects.filter(
                    usuario__username=dados_atendimento['mediador_preferencial']
                ).first()
                if mediador:
                    dados_agendamento['mediador_id'] = mediador.id
            
            # Criar agendamento usando serviço
            agendamento = self.calendario_service.criar_agendamento(
                dados_agendamento,
                usuario_criador=dados_atendimento.get('usuario_atendente')
            )
            
            return {
                'status': 'sucesso',
                'audiencia_id': agendamento.id,
                'numero_protocolo': agendamento.numero_protocolo,
                'data_agendada': agendamento.data_agendamento.isoformat_(),
                'modalidade': agendamento.modalidade,
            }
            
        except Exception as e:
            return {
                'status': 'erro',
                'erro': str(e),
                'alternativa': 'Orientação para reagendamento posterior',
            }
    
    @log_execution_time('etapa_monitoramento')
    def _etapa_configurar_monitoramento(self, workflow_result: Dict[str, Any]) -> Dict[str, Any]:
        """Etapa 6: Configurar monitoramento e follow-up"""
        
        try:
            # Configurar alertas automáticos
            alertas_configurados = []
            
            # Alert de CIP se foi gerada
            if 'geracao_cip' in workflow_result['etapas']:
                cip_id = workflow_result['etapas']['geracao_cip']['cip_id']
                alertas_configurados.append({
                    'tipo': 'CIP_PRAZO_VENCIMENTO',
                    'referencia': cip_id,
                    'dias_antes': 3,
                    'notificacoes': ['email_consumidor', 'email_empresa'],
                })
            
            # Alert de audiência se foi agendada
            if 'agendamento_audiencia' in workflow_result['etapas']:
                audiencia_id = workflow_result['etapas']['agendamento_audiencia']['audiencia_id']
                alertas_configurados.append({
                    'tipo': 'AUDIENCIA_CONFIRMACAO',
                    'referencia': audiencia_id,
                    'horas_antes': 48,
                    'notificacoes': ['sms_consumidor', 'email_empresa'],
                })
            
            # Programa follow-up automático
            follow_up_config = {
                'dias_baseline': [7, 14, 30],  # Check-ins automáticos
                'enviar_status': True,
                'solicitar_feedback': True,
                'gerar_relatorio_periodico': True,
            }
            
            return {
                'status': 'sucesso',
                'alertas_configurados': alertas_configurados,
                'follow_up_config': follow_up_config,
                'monitoramento_ativado': True,
            }
            
        except Exception as e:
            return {
                'status': 'erro',
                'erro': str(e),
                'monitoramento_manual_necessario': True,
            }


class DashboardWorkflowService:
    """Serviço para dashboard dos workflows de atendimento"""
    
    def __inc__(self):
        self.logger = logger_manager.get_logger('dashboard_workflow')
    
    @log_execution_time('metricas_workflow_periodo')
    def metricas_workflow_periodo(self, data_inicio: datetime, data_fim: datetime) -> Dict[str, Any]:
        """Coleta métricas dos workflows por período"""
        
        with LoggedOperation('metricas_workflow_periodo'):
            # Encontrar reclamações do período
            reclamacoes_periodo = ReclamacaoDenuncia.objects.filter(
                criado_em__range=[data_inicio, data_fim]
            )
            
            # Estatísticas gerais
            total_atendimentos = reclamacoes_periodo.count()
            modalidades = {
                'PRESENCIAL': reclamacoes_periodo.filter(modalidade_atendimento='PRESENCIAL').count(),
                'DIGITAL': reclamacoes_periodo.filter(modalidade_atendimento='DIGITAL').count(),
                'REMOTO': reclamacoes_periodo.filter(modalidade_atendimento='REMOTO').count(),
            }
            
            # CIPs geradas
            cips_geradas = CIPAutomatica.objects.filter(
                documento_origem__content_object__in=reclamacoes_periodo,
                data_geracao__range=[data_inicio, data_fim]
            )
            
            # Audiências realizadas
            audiencias_periodo = AgendamentoAudiencia.objects.filter(
                data_agendamento__range=[data_inicio, data_fim]
            )
            
            # Métricas de sucesso
            taxa_conversao_cip = (
                (cips_geradas.count() / total_atendimentos * 100) if total_atendimentos > 0 else 0
            )
            
            audiencias_com_acordo = audiencias_periodo.filter(
                resultado_final__in=['ACORDO_PARCIAL', 'ACORDO_TOTAL']
            )
            
            taxa_sucesso_audiencia = (
                (audiencias_com_acordo.count() / audiencias_periodo.count() * 100) 
                if audiencias_periodo.count() > 0 else 0
            )
            
            # Tempo médio de resposta
            tempo_medio_resposta = cips_geradas.filter(
                resposta__isnull=False,
                data_geracao__isnull=False
            ).aggregate(
                tempo_medio=models.Avg(F('resposta__data_recebimento') - F('data_geracao'))
            )['tempo_medio']
            
            return {
                'periodo': {'inicio': data_inicio.date(), 'fim': data_fim.date()},
                'total_atendimentos': total_atendimentos,
                'modalidades': modalidades,
                'total_cips_geradas': cips_geradas.count(),
                'total_audiencias': audiencias_periodo.count(),
                'taxa_conversao_cip': taxa_conversao_cip,
                'taxa_sucesso_audiencia': taxa_sucesso_audiencia,
                'tempo_medio_resposta_dias': tempo_medio_resposta.days if tempo_medio_resposta else 0,
                'valores_totais': {
                    'indenizacoes_solicitadas': cips_geradas.aggregate(
                        total=models.Sum('valor_total')
                    )['total'] or 0,
                    'acordos_realizados': audiencias_com_acordo.aggregate(
                        total=models.Sum('valor_acordo')
                    )['total'] or 0,
                },
                'satisfacao_estimada': self._calcular_satisfacao_estimada(
                    taxa_conversao_cip, taxa_sucesso_audiencia, tempo_medio_resposta
                ),
            }
    
    def _calcular_satisfacao_estimada(self, taxa_conversao_cip: float, taxa_sucesso_audiencia: float, tempo_medio_resposta: Any) -> float:
        """Calcula satisfação estimada baseada nas métricas"""
        # Simplificado - baseado em taxas de sucesso e tempo de resposta
        satisfacao = 60  # Base
        
        # Bonus por conversão de CIP
        satisfacao += min(20, taxa_conversao_cip * 0.3)
        
        # Bonus por sucesso em audiências
        satisfacao += min(15, taxa_sucesso_audiencia * 0.2)
        
        # Penalidade por tempo de resposta > 15 dias
        if tempo_medio_resposta and tempo_medio_resposta.days > 15:
            satisfacao -= min(25, (tempo_medio_resposta.days - 15) * 1.5)
        
        return max(0, min(100, satisfacao))
    
    @log_execution_time('tempos_realacao_workflow')
    def tempos_reacao_workflow(self) -> Dict[str, Any]:
        """Analisa tempos de reação em diferentes etapas do workflow"""
        
        agora = timezone.now()
        ultimos_7_dias = agora - timedelta(days=7)
        
        # Tempo entre reclamação e primeira ação (simplificado)
        tempo_reclamacao_primeira_acao = None
        # Nota: Implementação simplificada - em produção seria necessário 
        # criar vinculação entre reclamação e primeira ação tomada
        
        # Tempo entre CIP e envio para empresa
        tempo_cip_envio = CIPAutomatica.objects.filter(
            data_geracao__gte=ultimos_7_dias,
            data_envio_producao__isnull=False
        ).aggregate(
            tempo_medio=models.Avg(F('data_envio_producao') - F('data_geracao'))
        )['tempo_medio']
        
        # Tempo entre audiência agendada e realização
        tempo_agendamento_realizacao = AgendamentoAudiencia.objects.filter(
            data_criacao__gte=ultimos_7_dias,
            status='REALIZADA'
        ).aggregate(
            tempo_medio=models.Avg(F('data_agendamento') - F('data_criacao'))
        )['tempo_medio']
        
        return {
            'tempo_reclamacao_primeira_acao': str(tempo_reclamacao_primeira_acao) if tempo_reclamacao_primeira_acao else 'Não implementado',
            'tempo_cip_envio': str(tempo_cip_envio) if tempo_cip_envio else None,
            'tempo_agendamento_realizacao': str(tempo_agendamento_realizacao) if tempo_agendamento_realizacao else None,
            'periodo_analise': 'Últimos 7 dias',
        }


# Instâncias globais dos serviços
workflow_service = FluxoAtendimentoCompletoService()
dashboard_workflow_service = DashboardWorkflowService()

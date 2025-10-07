"""
Serviços para calendário de audiências e conciliações
Sistema Procon - Fase 4 - Fluxo Completo do Atendimento
"""

import json
from datetime import datetime, timedelta, time as dt_time, date as dt_date
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone
from django.db import transaction, models
from django.core.mail import send_mail
from django.utils.dateparse import parse_datetime

from .models import (
    AgendamentoAudiencia, Mediador, LocalAudiencia, 
    Reagendamento, HistoricoAudiencia
)
from cip_automatica.models import CIPAutomatica
from logging_config import logger_manager, LoggedOperation, log_execution_time


class CalendarioAudienciaService:
    """Serviço principal para gerenciamento de audiências"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('calendario_audiencia')
    
    @log_execution_time('agendar_audiencia')
    def criar_agendamento(self, dados: Dict[str, Any], usuario_criador: Any) -> AgendamentoAudiencia:
        """Cria novo agendamento de audiência"""
        
        with LoggedOperation('criar_agendamento', {
            'dados': dados,
            'usuario_criador_id': usuario_criador.id,
        }):
            try:
                # Validar disponibilidade
                disponibilidade = self._verificar_disponibilidade(
                    data=dados['data_agendamento'],
                    mediador_id=dados.get('mediador_id'),
                    local_id=dados.get('local_id')
                )
                
                if not disponibilidade['disponivel']:
                    raise ValueError(f"Horário não disponível: {disponibilidade.get('motivo', 'Conflito')}")
                
                with transaction.atomic():
                    # Criar agendamento
                    agendamento = AgendamentoAudiencia.objects.create(
                        tipo_audiencia=dados.get('tipo_audiencia', 'CONCILIACAO'),
                        data_agendamento=dados['data_agendamento'],
                        duracao_estimada=timedelta(hours=dados.get('duracao_horas', 2)),
                        modalidade=dados.get('modalidade', 'VIRTUAL'),
                        mediador_id=dados.get('mediador_id'),
                        local_id=dados.get('local_id'),
                        participantes_consumidor=dados.get('participantes_consumidor', []),
                        participantes_empresa=dados.get('participantes_empresa', []),
                        observacoes=dados.get('observacoes', ''),
                        criado_por=usuario_criador,
                    )
                    
                    # Vinculcar CIPs se informadas
                    if dados.get('cip_ids'):
                        cips = CIPAutomatica.objects.filter(id__in=dados['cip_ids'])
                        agendamento.cips_relacionadas.set(cips)
                    
                    # Registrar histórico
                    self._registrar_historico(agendamento, 'CREATED', 'Audiência agendada', usuario_criador)
                    
                    # Enviar confirmações
                    self._enviar_confirmacoes(agendamento)
                    
                    self.logger.log_operation('audiencia_criada', {
                        'agendamento_id': agendamento.id,
                        'numero_protocolo': agendamento.numero_protocolo,
                        'data': agendamento.data_agendamento.isoformat(),
                        'mediador': agendamento.mediador.usuario.get_full_name() if agendamento.mediador else None,
                    })
                    
                    return agendamento
                    
            except Exception as e:
                self.logger.logger.error(f'Erro ao criar agendamento: {str(e)}', exc_info=True)
                raise
    
    @log_execution_time('verificar_disponibilidade')
    def _verificar_disponibilidade(self, data: datetime, mediador_id: Optional[int] = None, 
                                 local_id: Optional[int] = None) -> Dict[str, Any]:
        """Verifica disponibilidade de mediador/local para uma data"""
        
        data_inicio = data
        agendamentos_existentes = AgendamentoAudiencia.objects.filter(
            data_agendamento__date=data_inicio.date(),
            status__in=['AGENDADA', 'CONFIRMADA', 'EM_ANDAMENTO']
        ).exclude(id=getattr(self, 'exclude_id', None))
        
        conflitos = []
        
        # Verificar conflito do mediador
        if mediador_id:
            conflitos_mediador = agendamentos_existentes.filter(mediador_id=mediador_id)
            for ag in conflitos_mediador:
                conflitos.append({
                    'tipo': 'mediador',
                    'resource_id': mediador_id,
                    'conflito_com': ag.numero_protocolo,
                    'horario': ag.data_agendamento.strftime('%H:%M'),
                })
        
        # Verificar conflito do local
        if local_id:
            conflitos_local = agendamentos_existentes.filter(local_id=local_id)
            for ag in conflitos_local:
                conflitos.append({
                    'tipo': 'local',
                    'resource_id': local_id,
                    'conflito_com': ag.numero_protocolo,
                    'horario': ag.data_agendamento.strftime('%H:%M'),
                })
        
        return {
            'disponivel': len(conflitos) == 0,
            'conflitos': conflitos,
            'motivo': 'Conflito de horário' if conflitos else None,
        }
    
    @log_execution_time('buscar_horarios_livres')
    def buscar_horarios_livres(self, data: date, duracao_horas: int = 2, 
                             mediador_id: Optional[int] = None,
                             local_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Busca horários livres em uma data específica"""
        
        horarios_livres = []
        
        # Horários funcionamento padrão (08:00 às 18:00)
        horario_inicio = dt_time(8, 0)
        horario_fim = dt_time(18, 0)
        
        # Se especificado mediador, usar disponibilidade dele
        if mediador_id:
            mediador = Mediador.objects.get(id=mediador_id)
            disponibilidade = mediador.disponibilidade_semana
            dia_semana = data.strftime('%A').lower()
            
            if dia_semana in disponibilidade and disponibilidade[dia_semana]:
                # Usar horários específicos do mediador
                hora_inicial = min(disponibilidade[dia_semana]) 
                hora_final = max(disponibilidade[dia_semana]) 
                horario_inicio = dt_time(hora_inicial, 0)
                horario_fim = dt_time(hora_final, 0)
        
        # Gerar slots de tempo
        hora_atual = horario_inicio
        slot_duracao = timedelta(hours=duracao_horas)
        
        while hora_atual <= horario_fim:
            slot_fim = dt_time.fromisoformat(str(hora_atual)) + slot_duracao
            if slot_fim.time() > horario_fim:
                break
                
            data_slot = datetime.combine(data, hora_atual)
            
            # Verificar se este slot está livre
            disponibilidade = self._verificar_disponibilidade(
                data=data_slot,
                mediador_id=mediador_id,
                local_id=local_id
            )
            
            if disponibilidade['disponivel']:
                horarios_livres.append({
                    'inicio': data_slot,
                    'fim': datetime.combine(data, slot_fim),
                    'duracao_horas': duracao_horas,
                    'formato_visual': data_slot.strftime('%H:%M'),
                })
            
            # Próximo slot (intervalo de 30 minutos)
            hora_atual = dt_time.fromisoformat(str(hora_atual).replace(':', '-'))
            hora_atual += timedelta(minutes=30)
            if hasattr(hora_atual, 'replace'):
                hora_atual = hora_atual.replace(tzinfo=None)
        
        return horarios_livres
    
    @log_execution_time('registrar_historico')
    def _registrar_historico(self, agendamento: AgendamentoAudiencia, evento: str,
                           descricao: str, usuario: Any, dados_extras: Dict = None):
        """Registra evento no histórico da audiência"""
        
        HistoricoAudiencia.objects.create(
            agendamento=agendamento,
            tipo_evento=evento,
            descricao=descricao,
            dados_novos=dados_extras or {},
            usuario_responsavel=usuario,
        )
    
    @log_execution_time('enviar_confirmacoes')
    def _enviar_confirmacoes(self, agendamento: AgendamentoAudiencia):
        """Envia confirmações para participantes da audiência"""
        
        try:
            # Email para consumidor
            for participante in agendamento.participantes_consumidor:
                if participante.get('email'):
                    self._enviar_email_consumidor(agendamento, participante)
            
            # Email para empresa
            for participante in agendamento.participantes_empresa:
                if participante.get('email'):
                    self._enviar_email_empresa(agendamento, participante)
            
            self.logger.logger.info(f'Confirmações enviadas para audiência {agendamento.numero_protocolo}')
            
        except Exception as e:
            self.logger.logger.error(f'Erro ao enviar confirmações: {str(e)}')
    
    def _enviar_email_consumidor(self, agendamento: AgendamentoAudiencia, participante: Dict):
        """Envia email de confirmação para consumidor"""
        assunto = f"Audiência agendada - Protocolo {agendamento.numero_protocolo}"
        mensagem = f"""
        Prezado/a {participante.get('nome', 'Consumidor')},
        
        Sua audiência de conciliação foi agendada com sucesso:
        
        Data: {agendamento.data_agendamento.strftime('%d/%m/%Y')}
        Horário: {agendamento.data_agendamento.strftime('%H:%M')}
        Tipo: {agendamento.get_tipo_audiencia_display()}
        Modalidade: {agendamento.get_modalidade_display()}
        
        Protocolo: {agendamento.numero_protocolo}
        
        Se precisar reagendar ou cancelar, entre em contato conosco.
        
        Atenciosamente,
        PROCON
        """
        # Em produção, enviaria email real
        self.logger.logger.info(f'Email enviado para {participante.get("email")}: {assunto}')
    
    def _enviar_email_empresa(self, agendamento: AgendamentoAudiencia, participante: Dict):
        """Envia email de confirmação para empresa"""
        assunto = f"Audiência agendada - Protocolo {agendamento.numero_protocolo}"
        mensagem = f"""
        Prezada Empresa {participante.get('nome', 'Representante')},
        
        Uma audiência de conciliação foi agendada contra a empresa:
        
        Data: {agendamento.data_agendamento.strftime('%d/%m/%Y')}
        Horário: {agendamento.data_agendamento.strftime('%H:%M')}
        Modalidade: {agendamento.get_modalidade_display()}
        
        Protocolo: {agendamento.numero_protocolo}
        
        A audiência será mediadora conciliatória. Reúna os documentos necessários.
        
        Atenciosamente,
        PROCON
        """
        # Em produção, enviaria email real
        self.logger.logger.info(f'Email enviado para {participante.get("email")}: {assunto}')


class ReagendamentoService:
    """Serviço para reagendamentos"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('reagendamento_service')
    
    @log_execution_time('solicitar_reagendamento')
    def solicitar_reagendamento(self, agendamento_id: str, nova_data: datetime,
                              motivo: str, solicitante: Any, observacoes: str = "") -> Reagendamento:
        """Solicita reagendamento de audiência"""
        
        try:
            agendamento = AgendamentoAudiencia.objects.get(id=agendamento_id)
            
            reagendamento = Reagendamento.objects.create(
                agendamento_original=agendamento,
                nova_data=nova_data,
                motivo=motivo,
                solicitado_por=solicitante,
                observacoes=observacoes,
            )
            
            # Definir como aguardando aprovação
            agendamento.status = 'ADIADA'
            agendamento.save()
            
            self.logger.log_operation('reagendamento_solicitado', {
                'reagendamento_id': reagendamento.id,
                'agendamento_id': agendamento_id,
                'nova_data': nova_data.isoformat(),
                'motivo': motivo,
            })
            
            return reagendamento
            
        except Exception as e:
            self.logger.logger.error(f'Erro ao solicitar reagendamento: {str(e)}', exc_info=True)
            raise
    
    @log_execution_time('aprovar_reagendamento')
    def aprovar_reagendamento(self, reagendamento_id: int, aprovador: Any) -> AgendamentoAudiencia:
        """Aprova reagendamento de audiência"""
        
        try:
            reagendamento = Reagendamento.objects.get(id=reagendamento_id)
            
            agendamento = reagendamento.agendamento_original
            
            # Verificar disponibilidade da nova data
            calendario_service = CalendarioAudienciaService()
            disponibilidade = calendario_service._verificar_disponibilidade(
                data=reagendamento.nova_data,
                mediador_id=agendamento.mediador_id,
                local_id=agendamento.local_id
            )
            
            if not disponibilidade['disponivel']:
                raise ValueError("Nova data não está disponível")
            
            # Atualizar agendamento
            data_anterior = agendamento.data_agendamento
            agendamento.data_agendamento = reagendamento.nova_data
            agendamento.status = 'CONFIRMADA'
            agendamento.save()
            
            # Marcar reagendamento como aprovado
            reagendamento.aprovado = True
            reagendamento.aprovado_por = aprovador
            reagendamento.save()
            
            # Registrar histórico
            calendario_service._registrar_historico(
                agendamento, 
                'REAGENDED',
                f'Reagendada de {data_anterior.strftime("%d/%m/%Y %H:%M")} para {reagendamento.nova_data.strftime("%d/%m/%Y %H:%M")}',
                aprovador
            )
            
            self.logger.log_operation('reagendamento_aprovado', {
                'reagendamento_id': reagendamento.id,
                'agendamento_id': agendamento.id,
                'nova_data': reagendamento.nova_data.isoformat(),
            })
            
            return agendamento
            
        except Exception as e:
            self.logger.logger.error(f'Erro ao aprovar reagendamento: {str(e)}', exc_info=True)
            raise


class RelatorioAudienciaService:
    """Serviço para relatórios de audiências"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('relatorio_audiencia')
    
    @log_execution_time('gerar_relatorio_periodo')
    def gerar_relatorio_periodo(self, data_inicio: datetime, data_fim: datetime) -> Dict[str, Any]:
        """Gera relatório de audiências por período"""
        
        audiencias = AgendamentoAudiencia.objects.filter(
            data_agendamento__range=[data_inicio, data_fim]
        )
        
        relatorio = {
            'periodo': {
                'inicio': data_inicio.date(),
                'fim': data_fim.date(),
            },
            'total_agendadas': audiencias.count(),
            'por_status': {},
            'por_modalidade': {},
            'por_mediador': {},
            'taxa_acordo': 0,
            'valor_total_acordado': 0,
            'audiencias_por_dia': {},
        }
        
        # Contagem por status
        for status, _ in AgendamentoAudiencia.STATUS_CHOICES:
            count = audiencias.filter(status=status).count()
            relatorio['por_status'][status] = count
        
        # Contagem por modalidade
        for modalidade, _ in AgendamentoAudiencia.MODALIDADE_CHOICES:
            count = audiencias.filter(modalidade=modalidade).count()
            relatorio['por_modalidade'][modalidade] = count
        
        # Contagem por mediador
        mediadores_stats = audiencias.values('mediador__usuario__first_name', 'mediador__usuario__last_name')\
            .annotate(total=models.Count('id'))
        for stat in mediadores_stats:
            mediador_nome = f"{stat['mediador__usuario__first_name']} {stat['mediador__usuario__last_name']}"
            relatorio['por_mediador'][mediador_nome] = stat['total']
        
        # Taxa de acordo
        audiencias_com_resultado = audiencias.exclude(resultado_final__isnull=True)
        audiencias_com_acordo = audiencias_com_resultado.filter(
            resultado_final__in=['ACORDO_PARCIAL', 'ACORDO_TOTAL']
        )
        
        if audiencias_com_resultado.count() > 0:
            relatorio['taxa_acordo'] = (audiencias_com_acordo.count() / audiencias_com_resultado.count()) * 100
        
        # Valor total acordado
        relatorio['valor_total_acordado'] = audiencias_com_acordo.aggregate(
            total=models.Sum('valor_acordo')
        )['total'] or 0
        
        # Audiências por dia
        agendamentos_por_dia = audiencias.extra(
            select={'day': 'date(data_agendamento)'}
        ).values('day').annotate(count=models.Count('id')).order_by('day')
        
        for ag in agendamentos_por_dia:
            relatorio['audiencias_por_dia'][ag['day'].strftime('%d/%m/%Y')] = ag['count']
        
        return relatorio


# Instâncias globais dos serviços
calendario_service = CalendarioAudienciaService()
reagendamento_service = ReagendamentoService()
relatorio_service = RelatorioAudienciaService()

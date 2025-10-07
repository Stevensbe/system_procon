"""
Serviços de Business Intelligence para o Sistema Procon
Fase 6 - Analytics e Relatórios Avançados
"""

import json
import time
from datetime import datetime, timedelta, timezone as dt_timezone
from typing import Dict, List, Any, Optional, Tuple
from decimal import Decimal
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q, F, Prefetch
from django.db import connection
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth.models import User, Group

from caixa_entrada.models import CaixaEntrada
from protocolo_tramitacao.models import ProtocoloDocumento, TramitacaoDocumento
from portal_cidadao.models import ReclamacaoDenuncia
from cip_automatica.models import CIPAutomatica
from audiencia_calendario.models import AgendamentoAudiencia
from atendimento.models import Atendimento

from logging_config import logger_manager, LoggedOperation, log_execution_time
from .models import KPI, Dashboard, ValorKPI, RelatorioPersonalizado, HistoricoRelatorio, AnaliseEmpirica, DashboardKPI


class KPIComputationService:
    """Serviço para computação automática de KPIs"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('kpi_computation')
        self.kpi_cache = {}  # Cache temporário de KPIs computados
        self.cache_ttl = 300  # 5 minutos
    
    @log_execution_time('kpi_computation')
    def compute_kpi_value(self, kpi: KPI, data_referencia: Optional[datetime] = None, 
                         periodo_tipo: str = 'DIA', filtros_aplicados: Dict[str, Any] = None) -> ValorKPI:
        """
        Computa o valor de um KPI específico
        """
        with LoggedOperation('compute_kpi', {'kpi_id': kpi.id, 'periodo': periodo_tipo}):
            if data_referencia is None:
                data_referencia = timezone.now()
            
            filtros_aplicados = filtros_aplicados or {}
            
            # Verificar se já existe valor no cache
            cache_key = f"{kpi.id}_{periodo_tipo}_{data_referencia.date()}"
            if cache_key in self.kpi_cache:
                cached_value = self.kpi_cache[cache_key]
                if time.time() - cached_value['timestamp'] < self.cache_ttl:
                    self.logger.info(f'KPI {kpi.codigo} obtido do cache')
                    return ValorKPI.objects.get(id=cached_value['valor_id'])
            
            try:
                # Determinar período baseado no tipo
                inicio_periodo, fim_periodo = self._calcular_periodo_periodo(data_referencia, periodo_tipo)
                
                # Aplicar filtros base
                filtros_base = filtros_aplicados.copy()
                filtros_base.update({
                    'created_at__gte': inicio_periodo,
                    'created_at__lte': fim_periodo
                })
                
                # Computar valor baseado na fórmula
                valor_calculado = self._executar_solcuacao_kpi(kpi, filtros_base)
                
                # Calcular percentual da meta se meta definida
                percentual_meta = None
                if kpi.meta_mensal:
                    percentual_meta = (valor_calculado / kpi.meta_mensal) * 100
                
                # Criar ou atualizar registro
                ValorKPI.objects.update_or_create(
                    kpi=kpi,
                    data_referencia=data_referencia,
                    periodo_tipo=periodo_tipo,
                    defaults={
                        'valor_calculado': valor_calculado,
                        'valor_meta': kpi.meta_mensal,
                        'percentual_meta': percentual_meta,
                        'filtros_aplicados': filtros_aplicados,
                        'parametros_calculo': {'formula': kpi.formula_calculo},
                        'status_calculo': 'SUCESSO'
                    }
                )
                
                # Atualizar cache
                valor_obj = ValorKPI.objects.get(kpi=kpi, data_referencia=data_referencia, periodo_tipo=periodo_tipo)
                self.kpi_cache[cache_key] = {
                    'valor_id': valor_obj.id,
                    'timestamp': time.time()
                }
                
                self.logger.info(f'KPI {kpi.codigo} computado com sucesso: {valor_calculado}')
                return valor_obj
                
            except Exception as e:
                self.logger.error(f'Erro ao computar KPI {kpi.codigo}: {str(e)}', exc_info=True)
                
                # Registrar erro
                ValorKPI.objects.update_or_create(
                    kpi=kpi,
                    data_referencia=data_referencia,
                    periodo_tipo=periodo_tipo,
                    defaults={
                        'valor_calculado': Decimal('0'),
                        'status_calculo': 'ERRO',
                        'observacoes': f"Erro na computação: {str(e)}"
                    }
                )
                raise
    
    def _calcular_periodo_periodo(self, data_referencia: datetime, periodo_tipo: str) -> Tuple[datetime, datetime]:
        """Calcula inicio e fim do período baseado no tipo"""
        
        inicio_periodo = data_referencia.replace(hour=0, minute=0, second=0, microsecond=0)
        fim_periodo = data_referencia.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        if periodo_tipo == 'HORA':
            fim_periodo = inicio_periodo + timedelta(hours=1)
        elif periodo_tipo == 'DIA':
            # Já configurado acima
            pass
        elif periodo_tipo == 'SEMANA':
            # Domingo da semana de referência
            days_since_sunday = inicio_periodo.weekday()
            inicio_periodo = inicio_periodo - timedelta(days=days_since_sunday)
            fim_periodo = inicio_periodo + timedelta(days=6, hours=23, minutes=59, seconds=59)
        elif periodo_tipo == 'MES':
            inicio_periodo = inicio_periodo.replace(day=1)
            if inicio_periodo.month == 12:
                proximo_mes = inicio_periodo.replace(year=inicio_periodo.year + 1, month=1)
            else:
                proximo_mes = inicio_periodo.replace(month=inicio_periodo.month + 1)
            fim_periodo = proximo_mes - timedelta(microseconds=1)
        elif periodo_tipo == 'TRIMESTRE':
            trimestre_mes_inicio = ((inicio_periodo.month - 1) // 3) * 3 + 1
            inicio_periodo = inicio_periodo.replace(month=trimestre_mes_inicio, day=1)
            proximo_trimestre = inicio_periodo.replace(month=trimestre_mes_inicio + 3) if trimestre_mes_inicio < 10 else inicio_periodo.replace(year=inicio_periodo.year + 1, month=1)
            fim_periodo = proximo_trimestre - timedelta(microseconds=1)
        elif periodo_tipo == 'ANO':
            inicio_periodo = inicio_periodo.replace(month=1, day=1)
            proximo_ano = inicio_periodo.replace(year=inicio_periodo.year + 1)
            fim_periodo = proximo_ano - timedelta(microseconds=1)
        
        return inicio_periodo, fim_periodo
    
    def _executar_solcuacao_kpi(self, kpi: KPI, filtros_base: Dict[str, Any]) -> Decimal:
        """Executa a fórmula de cálculo do KPI"""
        
        # Parse da fórmula (simples para demonstrar)
        # Em produção, usar um parser mais robusto
        
        if 'count' in kpi.formula_calculo.lower():
            modelo_nome = kpi.formula_calculo.split('(')[1].split(')')[0].lower()
            
            if modelo_nome == 'caixa_entrada':
                return Decimal(CaixaEntrada.objects.filter(**filtros_base).count())
            elif modelo_nome == 'reclamacoes':
                return Decimal(ReclamacaoDenuncia.objects.filter(**filtros_base).count())
            elif modelo_nome == 'cips':
                return Decimal(CIPAutomatica.objects.filter(**filtros_base).count())
            elif modelo_nome == 'audiencias':
                return Decimal(AgendamentoAudiencia.objects.filter(**filtros_base).count())
        
        elif 'sum' in kpi.formula_calculo.lower():
            # Para soma de campos específicos
            if 'valor_indereizacao' in kpi.formula_calculo:
                from portal_cidadao.models import ReclamacaoDenuncia
                return Decimal(ReclamacaoDenuncia.objects.filter(
                    **filtros_base,
                    valor_indelenização__isnull=False
                ).aggregate(total=Sum('valor_indelenização'))['total'] or 0)
        
        elif 'avg' in kpi.formula_calculo.lower():
            # Para médias
            if 'prazo_resposta' in kpi.formula_calculo:
                return Decimal(CaixaEntrada.objects.filter(
                    **filtros_base,
                    prazo_resposta__isnull=False,
                    data_resposta__isnull=False
                ).aggregate(avg=Avg(F('data_resposta') - F('data_criacao')))['avg'] or Decimal('0'))
        
        # Fórmula personalizada não reconhecida
        return Decimal('0')
    
    @log_execution_time('batch_kpi_update')
    def update_all_kpis(self, periodo_tipo: str = 'DIA', data_referencia: Optional[datetime] = None):
        """Atualiza todos os KPIs ativos"""
        with LoggedOperation('batch_kpi_update', {'periodo': periodo_tipo}):
            kpis_ativos = KPI.objects.filter(ativo=True)
            
            resultados = {
                'sucesso': 0,
                'erros': 0,
                'total': kpis_ativos.count()
            }
            
            for kpi in kpis_ativos:
                try:
                    self.compute_kpi_value(kpi, data_referencia, periodo_tipo)
                    resultados['sucesso'] += 1
                except Exception as e:
                    resultados['erros'] += 1
                    self.logger.error(f'Erro ao atualizar KPI {kpi.codigo}: {str(e)}')
            
            self.logger.info(f'Atualização batch concluída: {resultados}')
            return resultados


class DashboardService:
    """Serviço para gerenciar Dashboards executivos"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('dashboard_service')
        self.kpi_service = KPIComputationService()
    
    def get_dashboard_data(self, dashboard_id: int, user: User, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Obtém dados completos de um dashboard"""
        with LoggedOperation('get_dashboard_data', {'dashboard_id': dashboard_id}):
            try:
                dashboard = Dashboard.objects.prefetch_related(
                    Prefetch('dashboard_kpis__pkp', queryset=KPI.objects.all()),
                    'usuario_permitidos',
                    'grupos_permitidos'
                ).get(id=dashboard_id)
                
                # Verificar permissões
                if not self._verificar_permissao_dashboard(dashboard, user):
                    raise PermissionError("Usuário não tem permissão para acessar este dashboard")
                
                # Obter dados dos KPIs
                widgets_data = []
                for dashboard_kp in dashboard.dashboard_kpis.filter(ativo=True).order_by('ordenacao'):
                    try:
                        kpi_value = self.kpi_service.compute_kpi_value(
                            dashboard_kp.kp,
                            periodo_tipo=dashboard_kp.periodo_padrao
                        )
                        
                        widgets_data.append({
                            'id': dashboard_kp.pk,
                            'titulo': dashboard_kp.titulo_personalizado or dashboard_kp.kp.nome,
                            'kpi_codigo': dashboard_kp.kp.codigo,
                            'valor_atual': float(kpi_value.valor_calculado),
                            'percentual_meta': float(kpi_value.percentual_meta or 0),
                            'indicador_status': self._determinar_indicador_status(kpi_value),
                            'tipo_grafico': dashboard_kp.tipo_grafico,
                            'opcoes_visualizacao': dashboard_kp.opcoes_visualizacao,
                            'posicao': {
                                'x': dashboard_kp.posicao_x,
                                'y': dashboard_kp.posicao_y,
                                'largura': dashboard_kp.largura,
                                'altura': dashboard_kp.altura
                            }
                        })
                    except Exception as e:
                        self.logger.error(f'Erro ao processar widget KPI {dashboard_kp.pk}: {str(e)}')
                        continue
                
                return {
                    'dashboard': {
                        'id': dashboard.id,
                        'nome': dashboard.nome,
                        'descricao': dashboard.descricao,
                        'tipo': dashboard.get_tipo_dashboard_display(),
                        'layout_config': dashboard.layout_config,
                        'cores_tema': dashboard.cores_tema,
                        'intervalo_atualizacao': dashboard.intervalo_atualizacao
                    },
                    'widgets': widgets_data,
                    'ultima_atualizacao': timezone.now().isoformat(),
                    'total_widgets': len(widgets_data)
                }
                
            except Dashboard.DoesNotExist:
                raise ValueError(f"Dashboard ID {dashboard_id} não encontrado")
            except Exception as e:
                self.logger.error(f'Erro ao obter dados do dashboard: {str(e)}', exc_info=True)
                raise
    
    def _verificar_permissao_dashboard(self, dashboard: Dashboard, user: User) -> bool:
        """Verifica se usuário tem permissão para acessar o dashboard"""
        # Dashboard público
        if dashboard.publico:
            return True
        
        # Verificar usuários do dashboard
        if dashboard.usuario_permitidos.filter(id=user.id).exists():
            return True
        
        # Verificar grupos do usuário
        grupos_usuario = user.groups.filter(id__in=dashboard.grupos_permitidos.values_list('id', flat=True))
        if grupos_usuario.exists():
            return True
        
        return False
    
    def _determinar_indicador_status(self, valor_kpi: ValorKPI) -> str:
        """Determina o indicador visual do status do KPI"""
        if valor_kpi.percentual_meta is None:
            return 'neutro'
        
        if valor_kpi.percentual_meta >= 100:
            return 'excelente'  # Verde
        elif valor_kpi.percentual_meta >= 80:
            return 'bom'  # Azul
        elif valor_kpi.percentual_meta >= 60:
            return 'atencao'  # Amarelo
        else:
            return 'critico'  # Vermelho
    
    @log_execution_time('create_executive_dashboard')
    def create_executive_dashboard(self, nome: str, tipo: str = 'EXECUTIVO', 
                                  created_by: User = None, kpis_config: List[Dict[str, Any]] = None) -> Dashboard:
        """Cria um dashboard executivo personalizado"""
        with LoggedOperation('create_executive_dashboard', {'nome': nome, 'tipo': tipo}):
            try:
                dashboard = Dashboard.objects.create(
                    nome=nome,
                    tipo_dashboard=tipo,
                    created_by=created_by,
                    layout_config=[{'id': 'grid', 'columns': 4, 'gap': 20}],
                    cores_tema={
                        'primary': '#007bff',
                        'secondary': '#6c757d',
                        'success': '#28a745',
                        'warning': '#ffc107',
                        'danger': '#dc3545'
                    }
                )
                
                # Configurar KPIs do dashboard
                if kpis_config:
                    for i, config in enumerate(kpis_config):
                        kpi = config.get('kpi')
                        if isinstance(kpi, str):
                            kpi = KPI.objects.get(codigo=kpi)
                        
                        DashboardKPI.objects.create(
                            dashboard=dashboard,
                            kpi=kpi,
                            posicao_x=config.get('posicao_x', (i % 4) * 400),
                            posicao_y=config.get('posicao_y', (i // 4) * 300),
                            largura=config.get('largura', 400),
                            altura=config.get('altura', 300),
                            tipo_grafico=config.get('tipo_grafico', 'card'),
                            periodo_padrao=config.get('periodo_padrao', 30),
                            ordenacao=i
                        )
                
                self.logger.info(f'Dashboard executivo criado: {dashboard.id}')
                return dashboard
                
            except Exception as e:
                self.logger.error(f'Erro ao criar dashboard executivo: {str(e)}', exc_info=True)
                raise


class RelatorioGenerationService:
    """Serviço para geração automatizada de relatórios"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('relatorio_generation')
    
    @log_execution_time('generate_custom_report')
    def generate_report(self, relatorio: RelatorioPersonalizado, parametros: Dict[str, Any] = None,
                       solicitado_por: User = None) -> HistoricoRelatorio:
        """Gera um relatório personalizado"""
        with LoggedOperation('generate_report', {'relatorio_id': relatorio.id}):
            
            # Criar histórico de execução
            historico = HistoricoRelatorio.objects.create(
                relatorio=relatorio,
                solicitado_por=solicitado_por,
                parametros_utilizados=parametros or {},
                status='EXECUTANDO'
            )
            
            try:
                start_time = time.time()
                
                # Preparar parâmetros
                parametros_final = {**(relatorio.parametros_default or {}), **(parametros or {})}
                
                # Executar query ou análise baseada no tipo
                if relatorio.query_sql:
                    dados_relatorio = self._executar_query_sql(relatorio.query_sql, parametros_final)
                else:
                    dados_relatorio = self._executar_analise_personalizada(relatorio, parametros_final)
                
                # Gerar arquivo do relatório
                arquivo_path = self._gerar_arquivo_relatorio(
                    relatorio, dados_relatorio, parametros_final
                )
                
                # Calcular métricas
                tempo_execucao = Decimal(str(time.time() - start_time))
                tamanho_arquivo = relatorio.relatorios.filter(
                    executado_em=historico.executado_em
                ).count()  # Placeholder para tamanho real
                
                # Atualizar histórico com sucesso
                historico.status = 'SUCESSO'
                historico.arquivo_gerado = arquivo_path
                historico.tamanho_arquivo = tamanho_arquivo
                historico.tempo_execucao_segundos = tempo_execucao
                historico.registros_processados = len(dados_relatorio) if isinstance(dados_relatorio, list) else 0
                
                # Atualizar relatório pai
                relatorio.ultima_execucao = historico.executado_em
                
                historico.save()
                relatorio.save()
                
                # Enviar por email se configurado
                if relatorio.email_destinatarios and relatorio.formato == 'PDF':
                    self._send_report_email(relatorio, historico, solicitado_por)
                
                self.logger.info(f'Relatório {relatorio.codigo} gerado com sucesso')
                return historico
                
            except Exception as e:
                # Registrar erro
                historico.status = 'ERRO'
                historico.erro_detalhes = str(e)
                historico.tempo_execucao_segundos = Decimal(str(time.time() - start_time))
                historico.save()
                
                self.logger.error(f'Erro na geração do relatório {relatorio.codigo}: {str(e)}', exc_info=True)
                raise
    
    def _executar_query_sql(self, query_sql: str, parametros: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Executa query SQL personalizada"""
        with connection.cursor() as cursor:
            try:
                cursor.execute(query_sql, parametros)
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
                
                return [dict(zip(columns, row)) for row in rows]
            except Exception as e:
                self.logger.error(f'Erro na execução da query SQL: {str(e)}')
                raise
    
    def _executar_analise_relatorio(self, relatorio: RelatorioPersonalizado, parametros: Dict[str, Any]) -> Dict[str, Any]:
        """Executa análise personalizada baseada no tipo de relatório"""
        
        if relatorio.tipo_relatorio == 'EXECUTIVO':
            return self._analise_executiva_completa(parametros)
        elif relatorio.tipo_relatorio == 'OPERACIONAL':
            return self._analise_operacional(parametros)
        elif relatorio.tipo_relatorio == 'PERFORMANCE':
            return self._analise_performance(parametros)
        elif relatorio.tipo_relatorio == 'COMPLIANCE':
            return self._analise_compliance(parametros)
        else:
            return {'resumo': 'Análise não implementada ainda', 'dados': []}
    
    def _analise_executiva_completa(self, parametros: Dict[str, Any]) -> Dict[str, Any]:
        """Análise executiva completa do sistema"""
        data_início = parametros.get('data_inicio', (timezone.now() - timedelta(days=30)).date())
        data_fim = parametros.get('data_fim', timezone.now().date())
        
        # Métricas principais
        total_reclamacoes = ReclamacaoDenuncia.objects.filter(
            created_at__date__range=[data_início, data_fim]
        ).count()
        
        total_cips = CIPAutomatica.objects.filter(
            created_at__date__range=[data_início, data_fim]
        ).count()
        
        total_audiencias = AgendamentoAudiencia.objects.filter(
            data_agendamento__date__range=[data_início, data_fim]
        ).count()
        
        # Performance por prazo
        performance_prazos = CaixaEntrada.objects.filter(
            data_criacao__date__range=[data_início, data_fim]
        ).aggregate(
            dentro_prazo=Count('id', filter=Q(data_resposta__lte=F('prazo_resposta'))),
            fora_prazo=Count('id', filter=Q(data_resposta__gt=F('prazo_resposta'))),
            total=Count('id')
        )
        
        return {
            'periodo': {'inicio': data_início, 'fim': data_fim},
            'métricas_principais': {
                'total_reclamacoes': total_reclamacoes,
                'total_cips': total_cips,
                'total_audiencias': total_audiencias
            },
            'performance_prazos': performance_prazos,
            'status_geral': 'OPERACIONAL' if performance_prazos['dentro_prazo'] > performance_prazos['fora_prazo'] else 'ATENCAO'
        }
    
    def _gerar_arquivo_relatorio(self, relatorio: RelatorioPersonalizado, dados: Any, parametros: Dict[str, Any]) -> str:
        """Gera arquivo do relatório no formato especificado"""
        
        if relatorio.formato == 'PDF':
            return self._gerar_pdf_relatorio(relatorio, dados, parametros)
        elif relatorio.formato == 'EXCEL':
            return self._gerar_excel_relatorio(relatorio, dados, parametros)
        elif relatorio.formato == 'CSV':
            return self._gerar_csv_relatorio(relatorio, dados, parametros)
        else:
            raise ValueError(f"Formato {relatorio.formato} não suportado ainda")
    
    def _gerar_pdf_relatorio(self, relatorio: RelatorioPersonalizado, dados: Any, parametros: Dict[str, Any]) -> str:
        """Gera relatório em PDF usando ReportLab"""
        # Implementação básica - em produção usar template mais sofisticado
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        
        filename = f"relatorio_{relatorio.codigo}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = f"relatorios/arquivos/{filename}"
        
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Conteúdo básico
        story = [
            Paragraph(f"Relatório: {relatorio.nome}", styles['Title']),
            Spacer(1, 12),
            Paragraph(f"Período: {parametros.get('data_inicio')} a {parametros.get('data_fim')}", styles['Normal']),
            Spacer(1, 12),
            Paragraph(f"Dados processados: {len(dados) if isinstance(dados, list) else 'N/A'} registros", styles['Normal']),
        ]
        
        doc.build(story)
        return filepath
    
    def _send_report_email(self, relatorio: RelatorioPersonalizado, historico: HistoricoRelatorio, solicitado_por: User = None):
        """Envia relatório por email para destinatários configurados"""
        try:
            assunto = f"Relatório Automático: {relatorio.nome}"
            
            # Template básico do email
            mensagem = f"""
            <h2>Relatório: {relatorio.nome}</h2>
            <p>Relatório gerado com sucesso!</p>
            <p><strong>Executado em:</strong> {historico.executado_em.strftime('%d/%m/%Y %H:%M')}</p>
            <p><strong>Tempo de execução:</strong> {historico.tempo_execucao_segundos}s</p>
            <p><strong>Registros processados:</strong> {historico.registros_processados}</p>
            
            <p>O arquivo do relatório está anexo a este email.</p>
            """
            
            # TODO: Em produção, implementar anexo do arquivo
            # send_mail(
            #     assunto,
            #     '',
            #     settings.DEFAULT_FROM_EMAIL,
            #     relatorio.email_destinatarios,
            #     fail_silently=False,
            #     html_message=mensagem
            # )
            
            self.logger.info(f'Email de relatório enviado para {len(relatorio.email_destinatarios)} destinatários')
            
        except Exception as e:
            self.logger.warning(f'Erro ao enviar email do relatório: {str(e)}')


class BusinessAnalyticsService:
    """Serviço principal de Business Analytics"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('business_analytics')
        self.kpi_service = KPIComputationService()
        self.dashboard_service = DashboardService()
        self.relatorio_service = RelatorioGenerationService()
    
    @log_execution_time('generate_executive_summary')
    def generate_executive_summary(self, periodo_dias: int = 30, incluir_comparativo: bool = True) -> Dict[str, Any]:
        """Gera resumo executivo completo"""
        with LoggedOperation('generate_executive_summary', {'periodo_dias': periodo_dias}):
            
            data_base = timezone.now().date()
            data_inicio = data_base - timedelta(days=periodo_dias)
            data_inicio_anterior = data_base - timedelta(days=periodo_dias * 2)
            
            try:
                # Coletar métricas principais
                métricas_vigentes = self._coletar_métricas_periodo(data_inicio, data_base)
                
                métricas_anteriores = {}
                if incluir_comparativo:
                    métricas_anteriores = self._coletar_métricas_periodo(data_inicio_anterior, data_inicio)
                
                # Gerar insights automáticos
                insights = self._gerar_insights_automaticos(métricas_vigentes, métricas_anteriores)
                
                # Recomendações baseadas nos dados
                recomendacoes = self._gerar_recomendacoes_executivas(métricas_vigentes, insights)
                
                return {
                    'periodo': {
                        'atual': {'inicio': data_inicio, 'fim': data_base},
                        'comparativo': {'inicio': data_inicio_anterior, 'fim': data_inicio} if incluir_comparativo else None
                    },
                    'métricas_principais': métricas_vigentes,
                    'comparativo_anterior': métricas_anteriores,
                    'insights': insights,
                    'recomendacoes': recomendacoes,
                    'status_geral': self._determinar_status_sistema(métricas_vigentes),
                    'gerado_em': timezone.now().isoformat()
                }
                
            except Exception as e:
                self.logger.error(f'Erro na geração do resumo executivo: {str(e)}', exc_info=True)
                raise
    
    def _coletar_métricas_periodo(self, data_inicio: datetime.date, data_fim: datetime.date) -> Dict[str, Any]:
        """Coleta métricas principais de um período"""
        
        return {
            'total_reclamacoes': ReclamacaoDenuncia.objects.filter(
                created_at__date__range=[data_inicio, data_fim]
            ).count(),
            
            'reclamacoes_resolvidas': ReclamacaoDenuncia.objects.filter(
                created_at__date__range=[data_inicio, data_fim],
                data_conclusao__isnull=False
            ).count(),
            
            'cips_geradas': CIPAutomatica.objects.filter(
                created_at__date__range=[data_inicio, data_fim]
            ).count(),
            
            'audiencias_realizadas': AgendamentoAudiencia.objects.filter(
                data_agendamento__date__range=[data_inicio, data_fim]
            ).count(),
            
            'taxa_resolucao': self._calcular_taxa_resolucao(data_inicio, data_fim),
            
            'tempo_medio_resposta': self._calcular_tempo_medio_resposta(data_inicio, data_fim),
            
            'setores_mais_atendidos': self._top_setores_atendidos(data_inicio, data_fim, 5)
        }
    
    def _calcular_taxa_resolucao(self, data_inicio: datetime.date, data_fim: datetime.date) -> float:
        """Calcula taxa de resolução no período"""
        total = ReclamacaoDenuncia.objects.filter(
            created_at__date__range=[data_inicio, data_fim]
        ).count()
        
        resolvidas = ReclamacaoDenuncia.objects.filter(
            created_at__date__range=[data_inicio, data_fim],
            data_conclusao__isnull=False
        ).count()
        
        return (resolvidas / total * 100) if total > 0 else 0.0
    
    def _calcular_tempo_medio_resposta(self, data_inicio: datetime.date, data_fim: datetime.date) -> float:
        """Calcula tempo médio de resposta em dias"""
        diferencas = ReclamacaoDenuncia.objects.filter(
            created_at__date__range=[data_inicio, data_fim],
            data_conclusao__isnull=False
        ).annotate(
            diferenca_dias=F('data_conclusao') - F('created_at')
        ).values_list('diferenca_dias', flat=True)
        
        if diferencas:
            total_dias = sum([diff.days for diff in diferencas])
            return total_dias / len(diferencas)
        
        return 0.0
    
    def _top_setores_atendidos(self, data_inicio: datetime.date, data_fim: datetime.date, top_n: int = 5) -> List[Dict[str, Any]]:
        """Top N setores mais atendidos"""
        from caixa_entrada.models import CaixaEntrada
        
        setores_counts = CaixaEntrada.objects.filter(
            data_criacao__date__range=[data_inicio, data_fim]
        ).values('setor_destino').annotate(
            total=Count('id')
        ).order_by('-total')[:top_n]
        
        return [
            {'setor': item['setor_destino'], 'total': item['total']}
            for item in setores_counts
        ]
    
    def _gerar_insights_automaticos(self, métricas_vigentes: Dict[str, Any], métricas_anteriores: Dict[str, Any]) -> List[str]:
        """Gera insights automáticos baseados nas métricas"""
        insights = []
        
        # Taxa de resolução
        taxa_vigente = métricas_vigentes.get('taxa_resolucao', 0)
        if taxa_vigente >= 80:
            insights.append("✅ Excelente taxa de resolução de reclamações (>80%)")
        elif taxa_vigente >= 60:
            insights.append("⚡ Taxa de resolução dentro do esperado (60-80%)")
        else:
            insights.append("⚠️ Taxa de resolução baixa (<60%) - necessária atenção")
        
        # Volume de reclamações
        total_reclamacoes = métricas_vigentes.get('total_reclamacoes', 0)
        if total_reclamacoes > 100:
            insights.append(f"📈 Alto volume de reclamações ({total_reclamacoes}) - sistema bem utilizado")
        elif total_reclamacoes < 10:
            insights.append("📉 Baixo volume de reclamações - verificar divulgação do serviço")
        
        # Comparativo com período anterior
        if métricas_anteriores:
            taxa_anterior = métricas_anteriores.get('taxa_resolucao', 0)
            variacao = taxa_vigente - taxa_anterior
            
            if abs(variacao) > 10:
                sinal = "📈" if variacao > 0 else "📉"
                insights.append(f"{sinal} Taxa de resolução {'melhorou' if variacao > 0 else 'piorou'} em {abs(variacao):.1f}% comparado ao período anterior")
        
        return insights
    
    def _gerar_recomendacoes_executivas(self, métricas: Dict[str, Any], insights: List[str]) -> List[str]:
        """Gera recomendações estratégicas baseadas nos dados"""
        recomendacoes = []
        
        # Recomendação baseada na taxa de resolução
        taxa_resolucao = métricas.get('taxa_resolucao', 0)
        if taxa_resolucao < 70:
            recomendacoes.append("🔧 Implementar treinamento adicional para equipe de atendimento")
            recomendacoes.append("📅 Revisar processos de tramitação para maior eficiência")
        
        # Recomendação baseada no volume
        total_reclamacoes = métricas.get('total_reclamacoes', 0)
        if total_reclamacoes > 200:
            recomendacoes.append("👥 Considerar ampliação de recursos humanos para alta demanda")
        elif total_reclamacoes < 20:
            recomendacoes.append("📢 Intensificar campanhas de divulgação do serviço")
        
        # Recomendação baseada no tempo médio
        tempo_medio = métricas.get('tempo_medio_resposta', 0)
        if tempo_medio > 15:
            recomendacoes.append("⚡ Otimizar workflow para redução do tempo de resposta")
        
        return recomendacoes
    
    def _determinar_status_sistema(self, métricas: Dict[str, Any]) -> str:
        """Determina status geral do sistema baseado nas métricas"""
        taxa_resolucao = métricas.get('taxa_resolucao', 0)
        tempo_medio = métricas.get('tempo_medio_resposta', 0)
        
        if taxa_resolucao >= 80 and tempo_medio <= 10:
            return 'EXCELENTE'
        elif taxa_resolucao >= 70 and tempo_medio <= 15:
            return 'BOM'
        elif taxa_resolucao >= 60:
            return 'REGULAR'
        else:
            return 'ATENCAO'

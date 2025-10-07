"""
Dashboard integrado para Fase 4 - Fluxo Completo do Atendimento
Sistema Procon - Consolidando CIPs, Audiências e Respostas Empresariais
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q, F
from django.contrib.auth import get_user_model

from caixa_entrada.models import CaixaEntrada
from protocolo_tramitacao.models import ProtocoloDocumento, TramitacaoDocumento
from cip_automatica.models import CIPAutomatica, TipoCIP, RespostaEmpresa
from audiencia_calendario.models import AgendamentoAudiencia, Mediador
from logging_config import logger_manager, LoggedOperation, log_execution_time

User = get_user_model()


class DashboardFase4Service:
    """Serviço integrado de dashboard para Fase 4"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('dashboard_fase4')
    
    @log_execution_time('collect_fase4_metrics')
    def coletar_metricas_integradas(self) -> Dict[str, Any]:
        """Coleta todas as métricas integradas da Fase 4"""
        
        with LoggedOperation('collect_fase4_metrics'):
            try:
                metrics = {
                    'timestamp': timezone.now().isoformat(),
                    
                    # Métricas de CIPs
                    'cips': self._coletar_metricas_cips(),
                    
                    # Métricas de Audiências
                    'audiencias': self._coletar_metricas_audiencias(),
                    
                    # Métricas de Respostas Empresariais
                    'respostas_empresa': self._coletar_metricas_respostas(),
                    
                    # Métricas de Tempo de Resposta
                    'tempo_resposta': self._coletar_metricas_tempo_resposta(),
                    
                    # Indicadores de SLA Críticos
                    'sla_criticos': self._coletar_sla_criticos(),
                    
                    # Conclusão: Cálculo geral da eficácia
                    'eficacia_sistema': self._calcular_eficacia_sistema(),
                }
                
                self.logger.log_operation('metricas_fase4_coletadas', {
                    'total_cips': metrics['cips']['total'],
                    'total_audiencias': metrics['audiencias']['total'],
                    'taxa_sucesso': metrics['eficacia_sistema']['taxa_sucesso']
                })
                
                return metrics
                
            except Exception as e:
                self.logger.logger.error(f'Erro ao coletar métricas Fase 4: {str(e)}', exc_info=True)
                raise
    
    @log_execution_time('metricas_cips')
    def _coletar_metricas_cips(self) -> Dict[str, Any]:
        """Coleta métricas específicas de CIPs"""
        
        agora = timezone.now()
        cips_total = CIPAutomatica.objects.all()
        
        # CIPs por status
        cips_por_status = {}
        for status, _ in CIPAutomatica.STATUS_CHOICES:
            count = cips_total.filter(status=status).count()
            cips_por_status[status] = count
        
        # CIPs com prazos vencidos
        cips_vencidas = cips_total.filter(
            prazo_resposta_empresa__lt=agora,
            status__in=['ENVIADA', 'PRODUCAO_JURIDICA']
        )
        
        # Valores totais das CIPs
        valores_totais = cips_total.aggregate(
            soma_indenizacao=Sum('valor_indenizacao'),
            soma_multas=Sum('valor_multa'),
            soma_total=Sum('valor_total')
        )
        
        # CIPs geradas hoje/semana
        hoje = agora.date()
        semana_atras = hoje - timedelta(days=7)
        
        cips_hoje = cips_total.filter(data_geracao__date=hoje).count()
        cips_semana = cips_total.filter(data_geracao__date__gte=semana_atras).count()
        
        return {
            'total': cips_total.count(),
            'por_status': cips_por_status,
            'vencidas_count': cips_vencidas.count(),
            'valores_totais': valores_totais,
            'geradas_hoje': cips_hoje,
            'geradas_semana': cips_semana,
        }
    
    @log_execution_time('metricas_audiencias')
    def _coletar_metricas_audiencias(self) -> Dict[str, Any]:
        """Coleta métricas específicas de audiências"""
        
        agora = timezone.now()
        audiencias_total = AgendamentoAudiencia.objects.all()
        
        # Audiências por status
        audiencias_por_status = {}
        for status, _ in AgendamentoAudiencia.STATUS_CHOICES:
            count = audiencias_total.filter(status=status).count()
            audiencias_por_status[status] = count
        
        # Audiências hoje/amanhã/esta semana
        hoje = agora.date()
        amanha = hoje + timedelta(days=1)
        semana_frente = hoje + timedelta(days=7)
        
        audiencias_hoje = audiencias_total.filter(data_agendamento__date=hoje).count()
        audiencias_amanha = audiencias_total.filter(data_agendamento__date=amanha).count()
        audiencias_semana = audiencias_total.filter(
            data_agendamento__date__range=[hoje, semana_frente]
        ).count()
        
        # Taxa de acordo (audiências realizadas)
        audiencias_realizadas = audiencias_total.filter(status='REALIZADA')
        audiencias_com_acordo = audiencias_realizadas.filter(
            resultado_final__in=['ACORDO_PARCIAL', 'ACORDO_TOTAL']
        )
        
        taxa_acordo = 0
        if audiencias_realizadas.count() > 0:
            taxa_acordo = (audiencias_com_acordo.count() / audiencias_realizadas.count()) * 100
        
        # Valor total acordado
        valor_total_acordado = audiencias_com_acordo.aggregate(
            total=Sum('valor_acordo')
        )['total'] or 0
        
        return {
            'total': audiencias_total.count(),
            'por_status': audiencias_por_status,
            'hoje': audiencias_hoje,
            'amanha': audiencias_amanha,
            'esta_semana': audiencias_semana,
            'taxa_acordo': taxa_acordo,
            'valor_total_acordado': valor_total_acordado,
        }
    
    @log_execution_time('metricas_respostas')
    def _coletar_metricas_respostas(self) -> Dict[str, Any]:
        """Coleta métricas de respostas empresariais"""
        
        respostas_total = RespostaEmpresa.objects.all()
        
        # Respostas por tipo
        respostas_por_tipo = {}
        for tipo, _ in RespostaEmpresa.TIPO_RESPOSTA_COMMONS:
            count = respostas_total.filter(tipo_resposta=tipo).count()
            respostas_por_tipo[tipo] = count
        
        # Respostas por status
        respostas_por_status = {}
        for status, _ in RespostaEmpresa.STATUS_CHOICES:
            count = respostas_total.filter(status=status).count()
            respostas_por_status[status] = count
        
        # Respostas analisando
        respostas_analisando = respostas_total.filter(status='ANALISANDO').count()
        
        # Tempo médio de análise
        tempo_medio_analise = respostas_total.filter(
            status__in=['ACEITA', 'REJEITADA'],
            data_decisao__isnull=False
        ).aggregate(
            tempo_medio=Avg(F('data_decisao') - F('data_recebimento'))
        )['tempo_medio']
        
        return {
            'total': respostas_total.count(),
            'por_tipo': respostas_por_tipo,
            'por_status': respostas_por_status,
            'analisando': respostas_analisando,
            'tempo_medio_analise': str(tempo_medio_analise) if tempo_medio_analise else None,
        }
    
    @log_execution_time('metricas_tempo_resposta')
    def _coletar_metricas_tempo_resposta(self) -> Dict[str, Any]:
        """Coleta métricas de tempo de resposta do sistema"""
        
        agora = timezone.now()
        
        # Tramentação média (CIP -> Audiência -> Resposta)
        cips_com_resposta = CIPAutomatica.objects.filter(
            resposta__isnull=False,
            data_geracao__isnull=False
        )
        
        tempo_medio_completo = None
        if cips_com_resposta.exists():
            tempo_medio_completo = cips_com_resposta.annotate(
                tempo_total=F('resposta__data_recebimento') - F('data_geracao')
            ).aggregate(avg_tempo=Avg('tempo_total'))['avg_tempo']
        
        # Tempo médio até primeira resposta da empresa
        tempo_medio_primeira_resposta = None
        cips_com_resposta_inicial = cips_com_resposta.filter(
            resposta__data_recebimento__isnull=False
        )
        
        if cips_com_resposta_inicial.exists():
            tempo_medio_primeira_resposta = cips_com_resposta_inicial.annotate(
                tempo_resposta=F('resposta__data_recebimento') - F('data_geracao')
            ).aggregate(avg_tempo=Avg('tempo_resposta'))['avg_tempo']
        
        return {
            'tempo_medio_ciclo_completo': str(tempo_medio_completo) if tempo_medio_completo else None,
            'tempo_medio_primeira_resposta': str(tempo_medio_primeira_resposta) if tempo_medio_primeira_resposta else None,
        }
    
    @log_execution_time('metricas_sla_criticos')
    def _coletar_sla_criticos(self) -> Dict[str, Any]:
        """Coleta indicadores de SLA críticos"""
        
        agora = timezone.now()
        
        # CIPs com SLA em risco/vencido
        sla_cips = {
            'vencidas': CIPAutomatica.objects.filter(
                prazo_resposta_empresa__lt=agora,
                status__in=['ENVIADA', 'PRODUCAO_JURIDICA']
            ).count(),
            
            'em_risko': CIPAutomatica.objects.filter(
                prazo_resposta_empresa__range=[agora, agora + timedelta(days=3)],
                status__in=['ENVIADA', 'PRODUCAO_JURIDICA']
            ).count(),
        }
        
        # Audiências próximas
        sla_audiencias = {
            'hoje': AgendamentoAudiencia.objects.filter(
                data_agendamento__date=agora.date(),
                status__in=['AGENDADA', 'CONFIRMADA']
            ).count(),
            
            'amanha': AgendamentoAudiencia.objects.filter(
                data_agendamento__date=agora.date() + timedelta(days=1),
                status__in=['AGENDADA', 'CONFIRMADA']
            ).count(),
        }
        
        # Alertas gerados hoje
        alertas_hoje = self._gerar_alertas_criticos()
        
        return {
            'cips': sla_cips,
            'audiencias': sla_audiencias,
            'alertas_ativos': len(alertas_hoje),
            'alertas': alertas_hoje,
        }
    
    def _calcular_eficacia_sistema(self) -> Dict[str, Any]:
        """Calcula métricas gerais de eficácia do sistema"""
        
        # Taxa de sucesso global (CIP -> Acordo Final)
        cips_total_processadas = CIPAutomatica.objects.filter(
            status__in=['RESPONDIDA_EMPRESA', 'ACEITA_EMPRESA', 'RECUSADA_EMPRESA']
        )
        
        cips_audiencias_com_acordo = AgendamentoAudiencia.objects.filter(
            resultado_final__in=['ACORDO_PARCIAL', 'ACORDO_TOTAL'],
            cips_relacionadas__isnull=False
        ).values_list('cips_relacionadas__id', flat=True).distinct()
        
        taxa_sucesso_geral = 0
        if cips_total_processadas.count() > 0:
            taxa_sucesso_geral = (cips_audiencias_com_acordo.count() / cips_total_processadas.count()) * 100
        
        # Satisfação estimada (baseada em tempo de resposta)
        tempo_resposta_meta = 15  # dias
        tempo_medio_real = self._calcular_tempo_medio_resposta()
        
        satisfacao_estimada = 100
        if tempo_medio_real > tempo_resposta_meta:
            satisfacao_estimada = max(0, 100 - ((tempo_medio_real - tempo_resposta_meta) * 2))
        
        return {
            'taxa_sucesso': taxa_sucesso_geral,
            'satisfacao_estimada': satisfacao_estimada,
            'tempo_medio_resposta': tempo_medio_real,
            'meta_tempo_resposta': tempo_resposta_meta,
        }
    
    def _calcular_tempo_medio_resposta(self) -> int:
        """Calcula tempo médio de resposta em dias"""
        cips_com_resposta = CIPAutomatica.objects.filter(
            resposta__isnull=False,
            data_geracao__isnull=False
        )
        
        if not cips_com_resposta.exists():
            return 0
        
        tempo_dias = cips_com_resposta.annotate(
            tempo_dias=F('resposta__data_recebimento') - F('data_geracao')
        ).aggregate(avg_dias=Avg('tempo_dias'))['avg_dias']
        
        return tempo_dias.days if tempo_dias else 0
    
    def _gerar_alertas_criticos(self) -> List[Dict[str, Any]]:
        """Gera lista de alertas críticos"""
        
        alertas = []
        agora = timezone.now()
        
        # CIPs vencidas há mais de 3 dias
        cips_vencidas_criticas = CIPAutomatica.objects.filter(
            prazo_resposta_empresa__lt=agora - timedelta(days=3),
            status__in=['ENVIADA', 'PRODUCAO_JURIDICA']
        )
        
        for cip in cips_vencidas_criticas:
            dias_vencidos = (agora.date() - cip.prazo_resposta_empresa.date()).days
            alertas.append({
                'tipo': 'CIP_VENCIDA_CRITICA',
                'prioridade': 'ALTA',
                'titulo': f'CIP {cip.numero_cip} vencida há {dias_vencidos} dias',
                'descricao': f'Empresa {cip.empresa_razao_social} não respondeu',
                'valor': float(cip.valor_total),
                'item_id': str(cip.id),
            })
        
        # Audiências sem confirmação com menos de 24h
        audiencias_urgentes = AgendamentoAudiencia.objects.filter(
            data_agendamento__lt=agora + timedelta(hours=24),
            status='AGENDADA'
        )
        
        for aud in audiencias_urgentes:
            alertas.append({
                'tipo': 'AUDIENCI_A_URGENTE',
                'prioridade': 'MEDIA',
                'titulo': f'Audiência {aud.numero_protocolo} sem confirmação',
                'descricao': f'Agendada para {aud.data_agendamento.strftime("%d/%m/%Y %H:%M")}',
                'valor': float(aud.valor_acordo) if aud.valor_acordo else 0,
                'item_id': str(aud.id),
            })
        
        # Alertas de carga de trabalho
        cips_sem_responsavel = CIPAutomatica.objects.filter(
            responsavel_juridico__isnull=True,
            status__in=['GERADA', 'ENVIADA']
        ).count()
        
        if cips_sem_responsavel > 10:
            alertas.append({
                'tipo': 'CARGA_TRABALHO',
                'prioridade': 'BAIXA',
                'titulo': f'{cips_sem_responsavel} CIPs sem responsável',
                'descricao': 'Alta carga de trabalho - necessária distribuição',
                'valor': 0,
                'item_id': 'CARGA_TRABALHO',
            })
        
        return alertas
    
    @log_execution_time('dashboard_html_generation')
    def gerar_html_dashboard(self, metrics: Dict[str, Any]) -> str:
        """Gera HTML do dashboard integrado"""
        
        template_html = """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard Fase 4 - Sistema PROCON</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                .card-metric { border-left: 4px solid #3498db; }
                .card-critical { border-left: 4px solid #e74c3c; }
                .card-warning { border-left: 4px solid #f39c12; }
                .card-success { border-left: 4px solid #2ecc71; }
                .alert-item { margin-bottom: 10px; }
                .metric-value { font-size: 2rem; font-weight: bold; }
                .status-badge { font-size: 0.8rem; }
            </style>
        </head>
        <body class="bg-light">
            <div class="container-fluid py-4">
                <div class="row mb-4">
                    <div class="col-12">
                        <h1 class="display-4 text-primary">
                            <i class="fas fa-chart-line"></i>
                            Dashboard Fase 4 - Fluxo Completo do Atendimento
                        </h1>
                        <p class="text-muted">Última atualização: {{timestamp}}</p>
                    </div>
                </div>

                <!-- Alertas Críticos -->
                {% if sla_criticos.alertas_ativos > 0 %}
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card border-danger">
                            <div class="card-header bg-danger text-white">
                                <i class="fas fa-exclamation-triangle"></i>
                                Alertas Críticos ({{sla_criticos.alertas_ativos}})
                            </div>
                            <div class="card-body">
                                {% for alerta in sla_criticos.alertas %}
                                <div class="alert-item alert alert-{% if alerta.prioridade == 'ALTA' %}danger{% elif alerta.prioridade == 'MEDIA' %}warning{% else %}info{% endif %}" role="alert">
                                    <strong>{{alerta.titulo}}</strong><br>
                                    {{alerta.descricao}}
                                    {% if alerta.valor > 0 %}
                                    <span class="badge bg-dark ms-2">R$ {{alerta.valor|floatformat:2}}</span>
                                    {% endif %}
                                </div>
                                {% endfor %}
                            </div>
                        </div>
                    </div>
                </div>
                {% endif %}

                <!-- Resumo Executivo -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card card-metric">
                            <div class="card-body text-center">
                                <div class="metric-value text-primary">{{cips.total}}</div>
                                <h5>CIPs Ativas</h5>
                                <small class="text-muted">{{cips.geradas_hoje}} geradas hoje</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card {% if audiencias.hoje > 5 %}card-warning{% else %}card-metric{% endif %}">
                            <div class="card-body text-center">
                                <div class="metric-value {% if audiencias.hoje > 5 %}text-warning{% else %}text-primary{% endif %}">{{audiencias.total}}</div>
                                <h5>Audiências Agendadas</h5>
                                <small class="text-muted">{{audiencias.hoje}} hoje</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card {% if eficacia_sistema.taxa_sucesso > 70 %}card-success{% elif eficacia_sistema.taxa_sucesso > 50 %}card-warning{% else %}card-critical{% endif %}">
                            <div class="card-body text-center">
                                <div class="metric-value {% if eficacia_sistema.taxa_sucesso > 70 %}text-success{% elif eficacia_sistema.taz_sucesso > 50 %}text-warning{% else %}text-danger{% endif %}">{{eficacia_sistema.taxa_sucesso|floatformat:1}}%</div>
                                <h5>Taxa de Sucesso</h5>
                                <small class="text-muted">Satisfação: {{eficacia_sistema.satisfacao_estimada|floatformat:1}}%</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card {% if eficacia_sistema.tempo_medio_resposta > 20 %}card-critical{% elif eficacia_sistema.tempo_medio_resposta > 15 %}card-warning{% else %}card-success{% endif %}">
                            <div class="card-body text-center">
                                <div class="metric-value {% if eficacia_sistema.tempo_medio_resposta > 20 %}text-danger{% elif eficacia_sistema.tempo_medio_resposta > 15 %}text-warning{% else %}text-success{% endif %}">{{eficacia_sistema.tempo_medio_resposta}}</div>
                                <h5>Dias Médias Resp.</h5>
                                <small class="text-muted">Meta: {{eficacia_sistema.meta_tempo_resposta}} dias</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detalhes por Status -->
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <i class="fas fa-file-alt"></i>
                                CIPs por Status
                            </div>
                            <div class="card-body">
                                {% for status, count in cips.por_status.items %}
                                {% if count > 0 %}
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="status-badge badge bg-secondary">{{status}}</span>
                                    <strong>{{count}}</strong>
                                </div>
                                {% endif %}
                                {% endfor %}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header bg-success text-white">
                                <i class="fas fa-calendar"></i>
                                Audiências por Status
                            </div>
                            <div class="card-body">
                                {% for status, count in audiencias.por_status.items %}
                                {% if count > 0 %}
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="status-badge badge bg-secondary">{{status}}</span>
                                    <strong>{{count}}</strong>
                                </div>
                                {% endif %}
                                {% endfor %}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header bg-info text-white">
                                <i class="fas fa-building"></i>
                                Respostas Empresariais
                            </div>
                            <div class="card-body">
                                {% for status, count in respostas_empresa.por_status.items %}
                                {% if count > 0 %}
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="status-badge badge bg-secondary">{{status}}</span>
                                    <strong>{{count}}</strong>
                                </div>
                                {% endif %}
                                {% endfor %}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Valores Financeiros -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header bg-dark text-white">
                                <i class="fas fa-dollar-sign"></i>
                                Resumo Financeiro
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-3">
                                        <h6>Total Indenizações Solicitadas</h6>
                                        <strong class="text-primary">R$ {{cips.valores_totais.soma_total|floatformat:2}}</strong>
                                    </div>
                                    <div class="col-md-3">
                                        <h6>Total Acordado em Audiências</h6>
                                        <strong class="text-success">R$ {{audiencias.valor_total_acordado|floatformat:2}}</strong>
                                    </div>
                                    <div class="col-md-3">
                                        <h6>Taxa de Conversão</h6>
                                        {% if cips.valores_totais.soma_total > 0 %}
                                        <strong class="text-info">{{audiencias.valor_total_acordado|floatformat:2|mul:100|div:cips.valores_totais.soma_total|floatformat:1}}%</strong>
                                        {% else %}
                                        <strong class="text-info">0%</strong>
                                        {% endif %}
                                    </div>
                                    <div class="col-md-3">
                                        <h6>Eficiência Estimada</h6>
                                        <strong class="{% if eficacia_sistema.satisfacao_estimada > 80 %}text-success{% elif eficacia_sistema.satisfacao_estimada > 60 %}text-warning{% else %}text-danger{% endif %}">{{eficacia_sistema.satisfacao_estimada|floatformat:1}}%</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
            <script>
                // Auto-refresh a cada 5 minutos
                setTimeout(() => {
                    window.location.reload();
                }, 300000);
                
                // Tooltips
                document.addEventListener('DOMContentLoaded', function() {
                    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
                    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                        return new bootstrap.Tooltip(tooltipTriggerEl)
                    })
                });
            </script>
        </body>
        </html>
        """
        
        return template_html.replace('{{', '{').replace('}}', '}').format(**metrics)

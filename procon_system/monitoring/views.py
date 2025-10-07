"""
Views para monitoramento e observabilidade do Sistema Procon
Dashboard de prazos críticos e métricas de performance
"""

from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, permission_required
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from caixa_entrada.models import CaixaEntrada
from protocolo_tramitacao.models import ProtocoloDocumento, TramitacaoDocumento
from logging_config import logger_manager, LoggedOperation, log_execution_time, SmartAlerts
from atendimento.models import Atendimento
from portal_cidadao.models import ReclamacaoDenuncia


def get_critical_deadlines_data():
    """Coleta dados de prazos críticos para o dashboard"""
    logger = logger_manager.get_logger('monitoring_view')
    now = timezone.now()
    
    # Prazos críticos (vencendo em 1 dia)
    critical_deadlines = CaixaEntrada.objects.filter(
        prazo_resposta__lte=now + timedelta(days=1),
        prazo_resposta__gt=now,
        status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
    ).select_related('responsavel_atual').order_by('prazo_resposta')
    
    # Prazos vencidos
    overdue_deadlines = CaixaEntrada.objects.filter(
        prazo_resposta__lt=now,
        status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
    ).select_related('responsavel_atual').order_by('prazo_resposta')
    
    # Prazos próximos (vencendo em 3 dias)
    upcoming_deadlines = CaixaEntrada.objects.filter(
        prazo_resposta__lte=now + timedelta(days=3),
        prazo_resposta__gt=now + timedelta(days=1),
        status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
    ).select_related('responsavel_atual').order_by('prazo_resposta')
    
    return {
        'critical': critical_deadlines,
        'overdue': overdue_deadlines,
        'upcoming': upcoming_deadlines,
    }


@login_required
@permission_required('caixa_entrada.view_caixaentrada', raise_exception=True)
def dashboard_prazos_criticos(request):
    """Dashboard principal de prazos críticos"""
    logger = logger_manager.get_logger('monitoring')
    
    with LoggedOperation('dashboard_prazos_access', {
        'user_id': request.user.id,
        'username': request.user.username,
    }):
        deadlines_data = get_critical_deadlines_data()
        
        # Estatísticas gerais
        stats = {
            'total_criticos': deadlines_data['critical'].count(),
            'total_vencidos': deadlines_data['overdue'].count(),
            'total_proximos': deadlines_data['upcoming'].count(),
            'total_documentos': CaixaEntrada.objects.count(),
            'taxa_atraso': 0,
        }
        
        if deadlines_data['overdue'].count() > 0:
            stats['taxa_atraso'] = (
                deadlines_data['overdue'].count() / 
                (deadlines_data['critical'].count() + deadlines_data['overdue'].count() + deadlines_data['upcoming'].count()) 
                * 100
            )
        
        # Alertas por setor
        alerts_by_sector = defaultdict(int)
        for documento in deadlines_data['overdue']:
            if documento.setor_destino:
                alerts_by_sector[documento.setor_destino] += 1
                
        context = {
            'deadlines_data': deadlines_data,
            'stats': stats,
            'alerts_by_sector': dict(alerts_by_sector),
            'current_time': timezone.now(),
        }
        
        return render(request, 'monitoring/dashboard_prazos_criticos.html', context)


@login_required
def api_dashboard_prazos(request):
    """API para dados de prazos críticos (AJAX)"""
    
    if request.method != 'GET':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    try:
        deadlines_data = get_critical_deadlines_data()
        
        data = {
            'critical_deadlines': [
                {
                    'id': d.id,
                    'assunto': d.assunto,
                    'tipo': d.tipo_documento,
                    'prioridade': d.prioridade,
                    'prazo': d.prazo_resposta.isoformat() if d.prazo_resposta else None,
                    'setor': d.setor_destino,
                    'responsavel': d.responsavel_atual.username if d.responsavel_atual else None,
                    'status': d.status,
                    'tempo_restante': str(d.prazo_resposta - timezone.now()) if d.prazo_resposta else None,
                    'is_overdue': d.prazo_resposta < timezone.now() if d.prazo_resposta else False,
                }
                for d in deadlines_data['critical'][:50]  # Limitar para performance
            ],
            'overdue_deadlines': [
                {
                    'id': d.id,
                    'assunto': d.assunto,
                    'tipo': d.tipo_documento,
                    'prioridade': d.prioridade,
                    'prazo': d.prazo_resposta.isoformat() if d.prazo_resposta else None,
                    'setor': d.setor_destino,
                    'responsavel': d.responsavel_atual.username if d.responsavel_atual else None,
                    'status': d.status,
                    'dias_atraso': (timezone.now() - d.prazo_resposta).days if d.prazo_resposta else 0,
                }
                for d in deadlines_data['overdue'][:50]
            ],
            'stats': {
                'total_criticos': deadlines_data['critical'].count(),
                'total_vencidos': deadlines_data['overdue'].count(),
                'total_proximos': deadlines_data['upcoming'].count(),
            }
        }
        
        return JsonResponse(data)
        
    except Exception as e:
        logger = logger_manager.get_logger('monitoring')
        logger.logger.error(f'Erro na API de prazos: {str(e)}', exc_info=True)
        return JsonResponse({'error': 'Erro interno do servidor'}, status=500)


@login_required
@permission_required('caixa_entrada.view_caixaentrada', raise_exception=True)
def dashboard_performance(request):
    """Dashboard de performance e SLA"""
    
    logger = logger_manager.get_logger('monitoring')
    
    with logger.LoggedOperation('dashboard_performance_access', {
        'user_id': request.user.id,
        'username': request.user.username,
    }):
        now = timezone.now()
        
        # Métricas de SLA por setor (últimos 30 dias)
        thirty_days_ago = now - timedelta(days=30)
        
        sla_data = []
        sectors = CaixaEntrada.objects.values_list('setor_destino', flat=True).distinct().exclude(setor_destino='')
        
        for sector in sectors:
            documents = CaixaEntrada.objects.filter(
                setor_destino=sector,
                data_entrada__gte=thirty_days_ago,
                status__in=['ARQUIVADO', 'RESPONDIDO']
            )
            
            total_docs = documents.count()
            if total_docs > 0:
                # Calcular tempo médio de resposta
                avg_response_time = documents.aggregate(
                    avg_time=Avg('prazo_resposta')
                )['avg_time']
                
                # Documentos dentro do prazo
                on_time = documents.filter(
                    prazo_resposta__gte='data_conclusao'  # Simplificado
                ).count()
                
                sla_percentage = (on_time / total_docs) * 100 if total_docs > 0 else 0
                
                sla_data.append({
                    'setor': sector,
                    'total_documentos': total_docs,
                    'tempo_medio_resposta': avg_response_time,
                    'sla_percentage': sla_percentage,
                    'status': 'red' if sla_percentage < 70 else 'yellow' if sla_percentage < 90 else 'green',
                })
        
        # Métricas de carga de trabalho
        workload_data = []
        users_with_workload = CaixaEntrada.objects.filter(
            responsavel_atual__isnull=False,
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).values('responsavel_atual__username').annotate(
            total_docs=Count('id')
        ).order_by('-total_docs')[:10]
        
        for user_data in users_with_workload:
            username = user_data['responsavel_atual__username']
            total_docs = user_data['total_docs']
            
            # Documentos urgentes pendentes
            urgent_count = CaixaEntrada.objects.filter(
                responsavel_atual__username=username,
                prioridade='URGENTE',
                status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
            ).count()
            
            workload_data.append({
                'username': username,
                'total_documentos': total_docs,
                'urgentes_pendentes': urgent_count,
                'carga_status': 'high' if total_docs > 20 else 'medium' if total_docs > 10 else 'low',
            })
        
        # Alertas ativos do sistema
        active_alerts = []
        if not CaixaEntrada.objects.exists():
            active_alerts.append({
                'type': 'warning',
                'message': 'Não há documentos cadastrados no sistema',
                'severity': 'medium',
            })
        
        overdue_count = deadlines_data['overdue'].count()
        if overdue_count > 10:
            active_alerts.append({
                'type': 'critical',
                'message': f'{overdue_count} documentos vencidos - Ação necessária!',
                'severity': 'high',
            })
        
        context = {
            'sla_data': sla_data,
            'workload_data': workload_data,
            'active_alerts': active_alerts,
            'period_days': 30,
        }
        
        return render(request, 'monitoring/dashboard_performance.html', context)


@login_required
def api_alerts_realtime(request):
    """API para alertas em tempo real"""
    
    if request.method != 'GET':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    try:
        now = timezone.now()
        alerts = []
        
        # Verificar documentos críticos
        critical_docs = CaixaEntrada.objects.filter(
            prazo_resposta__lte=now + timedelta(hours=4),  # Próximas 4 horas
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).count()
        
        if critical_docs > 0:
            alerts.append({
                'id': 'critical_deadlines',
                'type': 'warning',
                'title': 'Prezos Críticos',
                'message': f'{critical_docs} documentos com prazo crítico',
                'severity': 'medium',
                'timestamp': now.isoformat(),
            })
        
        # Verificar documentos vencidos
        overdue_docs = CaixaEntrada.objects.filter(
            prazo_resposta__lt=now,
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).count()
        
        if overdue_docs > 0:
            alerts.append({
                'id': 'overdue_deadlines',
                'type': 'error',
                'title': 'Documentos Vencidos',
                'message': f'{overdue_docs} documentos vencidos',
                'severity': 'high',
                'timestamp': now.isoformat(),
            })
        
        # Verificar alta carga de trabalho
        high_workload_users = CaixaEntrada.objects.filter(
            responsavel_atual__isnull=False,
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE'],
            prioridade='URGENTE'
        ).values('responsavel_atual__username').annotate(
            count=Count('id')
        ).filter(count__gt=5)
        
        for user_workload in high_workload_users:
            alerts.append({
                'id': f'workload_{user_workload["responsavel_atual__username"]}',
                'type': 'info',
                'title': 'Alta Carga de Trabalho',
                'message': f'{user_workload["responsavel_atual__username"]} tem {user_workload["count"]} documentos urgentes',
                'severity': 'medium',
                'timestamp': now.isoformat(),
            })
        
        return JsonResponse({
            'alerts': alerts,
            'total_alerts': len(alerts),
            'timestamp': now.isoformat(),
        })
        
    except Exception as e:
        logger = logger_manager.get_logger('monitoring')
        logger.logger.error(f'Erro na API de alertas: {str(e)}', exc_info=True)
        return JsonResponse({'error': 'Erro interno do servidor'}, status=500)


# Comando para executar verificações periódicas de SLA
def run_sla_checks():
    """Executa verificações automáticas de SLA e gera alertas inteligentes"""
    
    logger = logger_manager.get_logger('sla_monitor')
    smart_alerts = SmartAlerts()
    
    with logger.LoggedOperation('sla_checks_execution'):
        now = timezone.now()
        
        # Verificar taxa de erro por operação
        error_metrics = logger.alert_counts
        
        # Verificar violações críticas de SLA
        overdue_count = CaixaEntrada.objects.filter(
            prazo_resposta__lt=now,
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).count()
        
        if overdue_count > 20:  # Threshold crítico
            smart_alerts.alert_critical_sla_breach('documentos_vencidos', overdue_count)
            
        # Verificar tempo médio de resposta por setor
        for sector in CaixaEntrada.objects.values_list('setor_destino', flat=True).distinct():
            avg_time = CaixaEntrada.objects.filter(
                setor_destino=sector,
                status='ARQUIVADO',
                updated_at__gte=now - timedelta(days=7)
            ).aggregate(avg=Avg('updated_at' - 'data_entrada'))['avg']
            
            if avg_time and avg_time.total_seconds() > 7 * 24 * 3600:  # Mais de 7 dias
                logger.logger.warning(f'SLA lento detectado no setor {sector}')
        
        logger.log_operation('sla_checks_completed', {
            'overdue_count': overdue_count,
            'error_metrics': len(error_metrics),
            'checks_performed': True,
        })

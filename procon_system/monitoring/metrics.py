"""
Sistema de métricas avançadas para observabilidade
Captura e analisa dados de performance do Sistema Procon
"""

import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict, deque
import threading
import json

from django.db.models import Count, Q, Avg, Max, Min
from django.utils import timezone
from django.contrib.auth import get_user_model

from logging_config import logger_manager, LoggedOperation, log_execution_time

from caixa_entrada.models import CaixaEntrada
from protocolo_tramitacao.models import ProtocoloDocumento, TramitacaoDocumento
from atendimento.models import Atendimento
from logging_config import SmartAlerts


class MetricsCollector:
    """Coletor centralizado de métricas do sistema"""
    
    def __init__(self):
        self.metrics_buffer = deque(maxlen=1000)  # Buffer circular
        self.lock = threading.Lock()
        self.logger = logger_manager.get_logger('metrics')
        self.smart_alerts = SmartAlerts()
        
    def record_metric(self, name: str, value: float, tags: Dict[str, str] = None):
        """Registra uma métrica personalizada"""
        with self.lock:
            metric = {
                'timestamp': timezone.now().isoformat(),
                'name': name,
                'value': value,
                'tags': tags or {},
            }
            self.metrics_buffer.append(metric)
            
            # Log estrut turado da métrica
            self.logger.log_performance(f'metric_{name}', value, {
                'metric_type': 'custom',
                'tags': tags or {},
            })
            
    def get_metric_summary(self, name: str, hours: int = 24) -> Dict[str, Any]:
        """Obtém resumo de uma métrica específica"""
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        relevant_metrics = [
            m for m in self.metrics_buffer 
            if (m['name'] == name and 
                datetime.fromisoformat(m['timestamp']).replace(tzinfo=timezone.get_current_timezone()) >= cutoff_time)
        ]
        
        if not relevant_metrics:
            return {'count': 0, 'avg': 0, 'min': 0, 'max': 0}
            
        values = [m['value'] for m in relevant_metrics]
        
        return {
            'count': len(values),
            'avg': sum(values) / len(values),
            'min': min(values),
            'max': max(values),
            'latest': values[-1] if values else 0,
        }


class SystemHealthMetrics:
    """Monitor de saúde geral do sistema"""
    
    def __init__(self):
        self.collector = MetricsCollector()
        self.logger = logger_manager.get_logger('system_health')
        
    def check_database_health(self):
        """Verifica saúde do banco de dados"""
        try:
            # Teste de conexão e performance básica
            start_time = time.time()
            
            # Contagem de registros críticos
            caixa_count = CaixaEntrada.objects.count()
            protocol_count = ProtocoloDocumento.objects.count()
            user_count = get_user_model().objects.count()
            
            # Verificar documentos sem responsável
            unreviewer_count = CaixaEntrada.objects.filter(responsavel_atual__isnull=True).count()
            
            query_time = time.time() - start_time
            
            # Registrar métricas
            self.collector.record_metric('db_query_time', query_time, {'operation': 'health_check'})
            self.collector.record_metric('total_caixa_docs', caixa_count)
            self.collector.record_metric('total_protocols', protocol_count)
            self.collector.record_metric('total_users', user_count)
            self.collector.record_metric('unreviewed_docs', unreviewer_count)
            
            # Alertas baseados em thresholds
            if query_time > 2.0:  # Mais de 2 segundos
                self.logger.logger.warning(f'Consulta DB lenta: {query_time:.3f}s')
                
            if unreviewer_count > (caixa_count * 0.2):  # Mais de 20% sem responsável
                self.logger.logger.warning(f'Alto número de documentos sem responsável: {unreviewer_count}')
                
            return {
                'status': 'healthy' if query_time < 5.0 else 'degraded',
                'query_time': query_time,
                'documents_count': caixa_count,
                'protocols_count': protocol_count,
                'users_count': user_count,
                'unreviewer_count': unreviewer_count,
            }
            
        except Exception as e:
            self.logger.logger.error(f'Erro na verificação de saúde do DB: {str(e)}', exc_info=True)
            return {'status': 'error', 'error': str(e)}
            
    def check_sla_health(self):
        """Verifica saúde dos SLAs"""
        now = timezone.now()
        
        # SLA por setor (últimos 7 dias)
        sla_stats = []
        sectors = CaixaEntrada.objects.values_list('setor_destino', flat=True).distinct().exclude(setor_destino='')
        
        for sector in sectors:
            sector_docs = CaixaEntrada.objects.filter(
                setor_destino=sector,
                data_entrada__gte=now - timedelta(days=7),
            )
            
            closed_docs = sector_docs.filter(status__in=['ARQUIVADO', 'RESPONDIDO'])
            closed_count = closed_docs.count()
            total_count = sector_docs.count()
            
            if total_count > 0:
                # Calcular tempo médio de resposta
                avg_response_time = sector_docs.aggregate(
                    avg_time=Avg('data_entrada')  # Simplificado para demo
                )['avg_time']
                
                sla_percentage = (closed_count / total_count) * 100
                
                # Registrar métricas por setor
                self.collector.record_metric('sla_percentage', sla_percentage, {'setor': sector})
                self.collector.record_metric('response_time', avg_response_time.days if avg_response_time else 0, {'setor': sector})
                
                sla_stats.append({
                    'setor': sector,
                    'percentage': sla_percentage,
                    'total_docs': total_count,
                    'closed_docs': closed_count,
                    'status': 'green' if sla_percentage >= 90 else ('yellow' if sla_percentage >= 70 else 'red'),
                })
        
        return {
            'sla_stats': sla_stats,
            'overall_sla': sum(s['percentage'] for s in sla_stats) / len(sla_stats) if sla_stats else 0,
        }
        
    def check_workload_distribution(self):
        """Verifica distribuição de carga de trabalho"""
        # Usuários com mais documentos pendentes
        workload_stats = []
        
        users_with_workload = CaixaEntrada.objects.filter(
            responsavel_atual__isnull=False,
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).values('responsavel_atual__username', 'responsavel_atual_id').annotate(
            total_docs=Count('id'),
            urgent_docs=Count('id', filter=Q(prioridade='URGENTE')),
            alta_docs=Count('id', filter=Q(prioridade='ALTA')),
        ).order_by('-total_docs')
        
        for user_data in users_with_workload:
            username = user_data['responsavel_atual__username']
            total_docs = user_data['total_docs']
            urgent_docs = user_data['urgent_docs']
            alta_docs = user_data['alta_docs']
            
            # Classificar carga
            if total_docs > 30:
                load_level = 'critical'
            elif total_docs > 20:
                load_level = 'high'
            elif total_docs > 10:
                load_level = 'medium'
            else:
                load_level = 'normal'
            
            # Registrar métricas de carga
            self.collector.record_metric('user_workload', total_docs, {'user': username, 'level': load_level})
            self.collector.record_metric('user_urgent_workload', urgent_docs, {'user': username})
            
            workload_stats.append({
                'username': username,
                'total_docs': total_docs,
                'urgent_docs': urgent_docs,
                'alta_docs': alta_docs,
                'load_level': load_level,
                'status': load_level,
            })
            
            # Alerta para alta carga
            if urgent_docs > 10:
                self.logger.logger.warning(f'Usuário {username} com alta carga de documentos urgentes: {urgent_docs}')
        
        return {
            'workload_stats': workload_stats,
            'critical_users': len([w for w in workload_stats if w['load_level'] == 'critical']),
            'overloaded_users': len([w for w in workload_stats if w['load_level'] in ['critical', 'high']]),
        }


class PerformanceProfiler:
    """Profiler de performance para operações críticas"""
    
    def __init__(self):
        self.timings = defaultdict(lambda: deque(maxlen=100))
        self.logger = logger_manager.get_logger('performance')
        
    def time_operation(self, operation_name: str):
        """Decorator para medir tempo de operações"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time
                    
                    # Registrar timing
                    self.timings[operation_name].append(duration)
                    
                    # Classificar performance
                    p_level = 'excellent' if duration < 0.1 else (
                        'good' if duration < 0.5 else (
                            'acceptable' if duration < 1.0 else 'slow'
                        )
                    )
                    
                    self.logger.log_performance(operation_name, duration, {
                        'performance_level': p_level,
                        'args_count': len(args),
                        'kwargs_count': len(kwargs),
                    })
                    
                    return result
                    
                except Exception as e:
                    duration = time.time() - start_time
                    self.logger.logger.error(f'Operação {operation_name} falhou após {duration:.3f}s', exc_info=True)
                    raise
                    
            return wrapper
        return decorator
        
    def get_timing_stats(self, operation_name: str) -> Dict[str, Any]:
        """Obtém estatísticas de timing para uma operação"""
        if operation_name not in self.timings or not self.timings[operation_name]:
            return {'count': 0, 'avg': 0, 'min': 0, 'max': 0}
            
        timings_list = list(self.timings[operation_name])
        
        return {
            'count': len(timings_list),
            'avg': sum(timings_list) / len(timings_list),
            'min': min(timings_list),
            'max': max(timings_list),
            'p95': self._percentile(timings_list, 95),
            'p99': self._percentile(timings_list, 99),
        }
        
    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calcula percentil de uma lista de números"""
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]


class BusinessMetrics:
    """Métricas específicas do negócio Procon"""
    
    def __init__(self):
        self.collector = MetricsCollector()
        self.logger = logger_manager.get_logger('business_metrics')
        
    def calculate_consumer_satisfaction_score(self):
        """Calcula score de satisfação do consumidor"""
        try:
            # Protocolos finalizados sem recurso (proxy de satisfação)
            now = timezone.now()
            thirty_days_ago = now - timedelta(days=30)
            
            total_protocols = ProtocoloDocumento.objects.filter(
                data_entry__gte=thirty_days_ago,
                status__in=['ARQUIVADO', 'DECIDIDO']
            ).count()
            
            protocols_with_recurso = ProtocoloDocumento.objects.filter(
                data_entry__gte=thirty_days_ago,
                status__in=['ARQUIVADO', 'DECIDIDO'],
                # Buscar por tramitações de recurso
                tramitacoes__acao__icontains='recurso'
            ).distinct().count()
            
            satisfaction_rate = (
                (total_protocols - protocols_with_recurso) / total_protocols * 100
                if total_protocols > 0 else 0
            )
            
            self.collector.record_metric('consumer_satisfaction_rate', satisfaction_rate)
            
            return {
                'satisfaction_rate': satisfaction_rate,
                'total_protocols': total_protocols,
                'protocols_with_recurso': protocols_with_recurso,
                'score_category': (
                    'excellent' if satisfaction_rate >= 90 else (
                        'good' if satisfaction_rate >= 80 else (
                            'needs_improvement' if satisfaction_rate >= 60 else 'critical'
                        )
                    )
                )
            }
            
        except Exception as e:
            self.logger.logger.error(f'Erro no cálculo de satisfação: {str(e)}', exc_info=True)
            return {'error': str(e)}
            
    def calculate_efficiency_metrics(self):
        """Calcula métricas de eficiência operacional"""
        try:
            # Tempo médio de resposta por tipo de documento
            efficiency_stats = []
            
            document_types = ['DENUNCIA', 'RECLAMACAO', 'PETICAO', 'RECURSO']
            
            for doc_type in document_types:
                docs = CaixaEntrada.objects.filter(
                    tipo_documento=doc_type,
                    status__in=['ARQUIVADO', 'RESPONDIDO']
                )
                
                if docs.exists():
                    avg_response_time = docs.aggregate(
                        avg_time=Avg('data_conclusao' - 'data_entrada')  # Simplificado
                    )['avg_time']
                    
                    efficiency_stats.append({
                        'document_type': doc_type,
                        'avg_response_time': avg_response_time.days if avg_response_time else 0,
                        'total_processed': docs.count(),
                    })
                    
                    self.collector.record_metric('response_time_by_type', 
                                              avg_response_time.days if avg_response_time else 0,
                                              {'document_type': doc_type})
            
            return {'efficiency_stats': efficiency_stats}
            
        except Exception as e:
            self.logger.logger.error(f'Erro no cálculo de eficiência: {str(e)}', exc_info=True)
            return {'error': str(e)}


# Instâncias globais
metrics_collector = MetricsCollector()
system_health = SystemHealthMetrics()
performance_profiler = PerformanceProfiler()
business_metrics = BusinessMetrics()


def collect_all_metrics():
    """Coleta todas as métricas do sistema periodicamente"""
    logger = logger_manager.get_logger('metrics_collector')
    
    with logger.LoggedOperation('metrics_collection'):
        try:
            # Verificar saúde do sistema
            db_health = system_health.check_database_health()
            sla_health = system_health.check_sla_health()
            workload_health = system_health.check_workload_distribution()
            
            # Métricas de negócio
            satisfaction = business_metrics.calculate_consumer_satisfaction_score()
            efficiency = business_metrics.calculate_efficiency_metrics()
            
            # Resumo geral
            summary = {
                'timestamp': timezone.now().isoformat(),
                'db_health': db_health,
                'sla_health': sla_health,
                'workload_health': workload_health,
                'business_satisfaction': satisfaction,
                'efficiency': efficiency,
            }
            
            logger.log_operation('metrics_collection_completed', {'summary': summary})
            
            return summary
            
        except Exception as e:
            logger.logger.error(f'Erro na coleta de métricas: {str(e)}', exc_info=True)
            raise

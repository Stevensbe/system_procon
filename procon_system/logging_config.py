"""
Configuração de logging estruturado para o System Procon
Substitui warnings soltos por sistema de logging inteligente
"""

import logging
import json
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from django.conf import settings

# Formatter personalizado para logs estruturados
class StructuredFormatter(logging.Formatter):
    """Formata logs em estrutura JSON para melhor observabilidade"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Adicionar contexto específico baseado no nível
        if record.levelname in ['WARNING', 'ERROR', 'CRITICAL']:
            log_data.update({
                'severity': 'high',
                'requires_attention': True,
            })
            
        if record.levelname == 'ERROR':
            log_data.update({
                'error_type': getattr(record, 'exc_type', None),
                'traceback': traceback.format_exception(record.exc_info[0], record.exc_info[1], record.exc_info[2]) if record.exc_info else None,
            })
        
        # Adicionar contexto customizado se presente
        if hasattr(record, 'context'):
            log_data['context'] = record.context
            
        return json.dumps(log_data, ensure_ascii=False)

# Logger específico para operações críticas
class ProconLogger:
    """Logger especializado para operações do Procon"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(f'procon.{name}')
        
    def log_operation(self, operation: str, context: Dict[str, Any], level: str = 'INFO'):
        """Log de operação específica com contexto"""
        extra_context = {
            'operation': operation,
            'context': context,
            'service': 'procon_system',
        }
        self.logger.info(f'Operação: {operation}', extra={'context': extra_context})
        
    def log_performance(self, operation: str, duration: float, context: Dict[str, Any] = None):
        """Log de performance de operações"""
        perf_context = {
            'operation': operation,
            'duration_ms': duration * 1000,
            'performance_tier': self._get_performance_tier(duration),
            **(context or {}),
        }
        self.logger.info(f'Performance: {operation} ({duration:.3f}s)', extra={'context': perf_context})
        
    def log_user_action(self, user_id: int, action: str, context: Dict[str, Any] = None):
        """Log de ações do usuário"""
        user_context = {
            'user_id': user_id,
            'action': action,
            'user_action': True,
            **(context or {}),
        }
        self.logger.info(f'Ações do usuário: {action}', extra={'context': user_context})
        
    def log_system_health(self, metric: str, value: float, threshold: float = None):
        """Log de saúde do sistema"""
        health_context = {
            'metric': metric,
            'value': value,
            'threshold': threshold,
            'healthy': threshold is None or value < threshold,
            'health_check': True,
        }
        level = 'WARNING' if threshold and value >= threshold else 'INFO'
        self.logger.log(getattr(logging, level), f'Métrica do sistema: {metric} = {value}', extra={'context': health_context})
        
    def _get_performance_tier(self, duration: float) -> str:
        """Classifica performance em tiers"""
        if duration < 0.1:
            return 'excellent'
        elif duration < 0.5:
            return 'good'
        elif duration < 1.0:
            return 'acceptable'
        elif duration < 3.0:
            return 'slow'
        else:
            return 'critical'

# Loggers específicos para cada módulo
class LoggerManager:
    """Gerenciador de loggers específicos"""
    
    def __init__(self):
        self._loggers = {}
        
    def get_logger(self, module: str) -> ProconLogger:
        """Obtém logger específico do módulo"""
        if module not in self._loggers:
            self._loggers[module] = ProconLogger(module)
        return self._loggers[module]
        
    def set_logger_config(self, module: str, level: str = 'INFO'):
        """Configura nível de log para módulo específico"""
        logger = logging.getLogger(f'procon.{module}')
        logger.setLevel(getattr(logging, level.upper()))
        
# Instância global do gerenciador
logger_manager = LoggerManager()

# Decorator para logging automático de funções críticas
def log_execution_time(operation_name: str = None, include_args: bool = False):
    """Decorator para medir e logar tempo de execução"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            start_time = time.time()
            
            op_name = operation_name or f'{func.__module__}.{func.__name__}'
            
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Contexto adicional se solicitado
                context = {}
                if include_args:
                    context['args_count'] = len(args)
                    context['kwargs_keys'] = list(kwargs.keys())
                
                logger_manager.get_logger('performance').log_performance(op_name, duration, context)
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                logger_manager.get_logger('error').error(
                    f'Erro em {op_name} após {duration:.3f}s',
                    extra={'context': {'operation': op_name, 'error': str(e), 'duration': duration}},
                    exc_info=True
                )
                raise
                
        return wrapper
    return decorator

# Context manager para logging de operações críticas
class LoggedOperation:
    """Context manager para operações que precisam de logging especial"""
    
    def __init__(self, operation: str, context: Dict[str, Any] = None):
        self.operation = operation
        self.context = context or {}
        self.logger = logger_manager.get_logger('operation')
        self.start_time = None
        
    def __enter__(self):
        import time
        self.start_time = time.time()
        self.logger.log_operation(self.operation, {**self.context, 'status': 'started'})
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        duration = time.time() - self.start_time
        
        status_data = {
            **self.context,
            'duration': duration,
            'status': 'completed' if exc_type is None else 'failed',
        }
        
        if exc_type is not None:
            status_data['error'] = str(exc_val)
            self.logger.logger.error(f'Operação falhou: {self.operation}', 
                                   extra={'context': status_data}, exc_info=(exc_type, exc_val, exc_tb))
        else:
            self.logger.log_operation(self.operation, status_data)

# Alertas inteligentes
class SmartAlerts:
    """Sistema de alertas inteligentes baseado em padrões"""
    
    def __init__(self):
        self.alert_counts = {}
        self.alert_thresholds = {
            'error_rate': 10,  # Mais de 10 erros em 5 minutos
            'slow_operations': 5,  # Mais de 5 operações lentas em 5 minutos
            'user_complaints': 3,  # Mais de 3 reclamações em 1 hora
        }
        
    def check_error_rate(self, operation: str, error_count: int, time_window_minutes: int = 5):
        """Verifica taxa de erro para operação específica"""
        key = f'error_{operation}_{time_window_minutes}'
        
        if key not in self.alert_counts:
            self.alert_counts[key] = []
            
        # Simular janela de tempo (em produção seria com timestamps reais)
        self.alert_counts[key].append(error_count)
        
        if len(self.alert_counts[key]) >= self.alert_thresholds.get('error_rate', 10):
            logger_manager.get_logger('alerts').logger.warning(
                f'Taxa de erro elevada para {operation}',
                extra={'context': {
                    'alert_type': 'high_error_rate',
                    'operation': operation,
                    'error_count': error_count,
                    'time_window': f'{time_window_minutes}min',
                    'requires_action': True,
                }}
            )
            return True
        return False
        
    def alert_critical_sla_breach(self, sla_type: str, breach_time: float):
        """Alerta para violação crítica de SLA"""
        logger_manager.get_logger('alerts').logger.critical(
            f'VIOLAÇÃO CRÍTICA DE SLA: {sla_type}',
            extra={'context': {
                'alert_type': 'sla_breach',
                'sla_type': sla_type,
                'breach_time': breach_time,
                'severity': 'critical',
                'immediate_action_required': True,
            }}
        )

# Configuração de logging
def configure_procon_logging():
    """Configura sistema de logging do Procon"""
    
    # Criar handler para arquivo de log estruturado
    file_handler = logging.FileHandler('procon_system.log')
    file_handler.setFormatter(StructuredFormatter())
    
    # Criar handler para console (desenvolvimento)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    # Configurar loggers específicos
    logger_configs = {
        'procon.caixa_entrada': 'INFO',
        'procon.protocolo': 'INFO', 
        'procon.atendimento': 'INFO',
        'procon.fiscalizacao': 'INFO',
        'procon.performance': 'INFO',
        'procon.alerts': 'WARNING',
        'procon.error': 'ERROR',
        'procon.operation': 'INFO',
    }
    
    for logger_name, level in logger_configs.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(getattr(logging, level))
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        logger.propagate = False
        
    # Configurar logger root
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)

# Instâncias globais
smart_alerts = SmartAlerts()

# Configurar automaticamente quando importado
configure_procon_logging()

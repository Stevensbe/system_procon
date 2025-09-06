"""
Views para health checks do sistema
"""
import time
from django.http import JsonResponse
from django.db import connection
from django.conf import settings
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)

@require_http_methods(["GET"])
@csrf_exempt
def health_check(request):
    """
    Health check básico
    """
    return JsonResponse({
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'System Procon API'
    })

@require_http_methods(["GET"])
@csrf_exempt
def health_detailed(request):
    """
    Health check detalhado com verificação de dependências
    """
    start_time = time.time()
    checks = {}
    overall_status = 'healthy'
    
    # Verificar banco de dados
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = {
            'status': 'healthy',
            'message': 'Database connection OK'
        }
    except Exception as e:
        checks['database'] = {
            'status': 'unhealthy',
            'message': f'Database error: {str(e)}'
        }
        overall_status = 'unhealthy'
        logger.error(f"Database health check failed: {e}")
    
    # Verificar Redis (se configurado)
    if hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
        try:
            import redis
            r = redis.from_url(settings.REDIS_URL)
            r.ping()
            checks['redis'] = {
                'status': 'healthy',
                'message': 'Redis connection OK'
            }
        except Exception as e:
            checks['redis'] = {
                'status': 'unhealthy',
                'message': f'Redis error: {str(e)}'
            }
            overall_status = 'degraded'
            logger.warning(f"Redis health check failed: {e}")
    
    # Verificar Celery (se disponível)
    try:
        from procon_system.celery import app as celery_app
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        if active_workers:
            checks['celery'] = {
                'status': 'healthy',
                'message': f'Celery workers active: {len(active_workers)}'
            }
        else:
            checks['celery'] = {
                'status': 'unhealthy',
                'message': 'No active Celery workers'
            }
            overall_status = 'degraded'
    except Exception as e:
        checks['celery'] = {
            'status': 'unknown',
            'message': f'Celery check error: {str(e)}'
        }
        logger.warning(f"Celery health check failed: {e}")
    
    # Verificar espaço em disco
    try:
        import shutil
        total, used, free = shutil.disk_usage('/')
        free_percent = (free / total) * 100
        
        if free_percent > 20:
            disk_status = 'healthy'
            disk_message = f'Free space: {free_percent:.1f}%'
        elif free_percent > 10:
            disk_status = 'warning'
            disk_message = f'Low disk space: {free_percent:.1f}%'
            overall_status = 'degraded' if overall_status == 'healthy' else overall_status
        else:
            disk_status = 'critical'
            disk_message = f'Critical disk space: {free_percent:.1f}%'
            overall_status = 'unhealthy'
            
        checks['disk'] = {
            'status': disk_status,
            'message': disk_message
        }
    except Exception as e:
        checks['disk'] = {
            'status': 'unknown',
            'message': f'Disk check error: {str(e)}'
        }
    
    response_time = time.time() - start_time
    
    response_data = {
        'status': overall_status,
        'timestamp': time.time(),
        'response_time_ms': round(response_time * 1000, 2),
        'service': 'System Procon API',
        'version': '1.0.0',
        'checks': checks
    }
    
    # Retornar status HTTP baseado na saúde do sistema
    status_code = 200
    if overall_status == 'unhealthy':
        status_code = 503
    elif overall_status == 'degraded':
        status_code = 200  # Ainda funcional, mas com problemas
    
    return JsonResponse(response_data, status=status_code)

@require_http_methods(["GET"])
@csrf_exempt
def readiness_check(request):
    """
    Readiness check - verifica se o serviço está pronto para receber tráfego
    """
    try:
        # Verificação crítica: banco de dados
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'ready',
            'timestamp': time.time(),
            'service': 'System Procon API'
        })
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JsonResponse({
            'status': 'not_ready',
            'timestamp': time.time(),
            'service': 'System Procon API',
            'error': str(e)
        }, status=503)

@require_http_methods(["GET"])
@csrf_exempt
def liveness_check(request):
    """
    Liveness check - verifica se o serviço está vivo
    """
    return JsonResponse({
        'status': 'alive',
        'timestamp': time.time(),
        'service': 'System Procon API'
    })
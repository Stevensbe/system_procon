"""
Decoradores personalizados para rate limiting e outras funcionalidades
"""
from functools import wraps
from django.http import JsonResponse
from django.conf import settings

try:
    from django_ratelimit.decorators import ratelimit
    RATELIMIT_AVAILABLE = True
except ImportError:
    RATELIMIT_AVAILABLE = False
    # Fallback decorator que não faz nada se django_ratelimit não estiver disponível
    def ratelimit(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

def api_ratelimit(group='api', key='user_or_ip', rate='60/m', method=['POST', 'PUT', 'PATCH', 'DELETE']):
    """
    Decorador personalizado para rate limiting de APIs
    """
    def decorator(view_func):
        if not getattr(settings, 'RATELIMIT_ENABLE', True) or not RATELIMIT_AVAILABLE:
            return view_func
            
        @ratelimit(group=group, key=key, rate=rate, method=method, block=True)
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Se chegou até aqui, o rate limit não foi excedido
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def auth_ratelimit(rate='5/m'):
    """
    Rate limiting específico para endpoints de autenticação
    """
    def decorator(view_func):
        if not getattr(settings, 'RATELIMIT_ENABLE', True) or not RATELIMIT_AVAILABLE:
            return view_func
            
        @ratelimit(group='auth', key='ip', rate=rate, method='POST', block=True)
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def upload_ratelimit(rate='10/m'):
    """
    Rate limiting para uploads de arquivos
    """
    def decorator(view_func):
        if not getattr(settings, 'RATELIMIT_ENABLE', True) or not RATELIMIT_AVAILABLE:
            return view_func
            
        @ratelimit(group='upload', key='user_or_ip', rate=rate, method='POST', block=True)
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
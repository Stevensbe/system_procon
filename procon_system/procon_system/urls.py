from django.contrib import admin
from django.urls import path, include
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import register, login, logout, profile, update_profile, change_password, admin_dashboard, staff_dashboard, protected_endpoint

# Importar métricas do Prometheus
try:
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from django.http import HttpResponse
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

@api_view(['GET'])
def test_api(request):
    return Response({
        'message': 'API funcionando!',
        'timestamp': timezone.now().isoformat()
    })

@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat()
    })

# Endpoint para métricas do Prometheus
def metrics_view(request):
    if PROMETHEUS_AVAILABLE:
        return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
    else:
        return HttpResponse("Prometheus não disponível", status=503)

urlpatterns = [
    path('admin/', admin.site.urls),

    # === AUTENTICAÇÃO ===
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('auth/profile/', profile, name='profile'),
    path('auth/profile/update/', update_profile, name='update_profile'),
    path('auth/change-password/', change_password, name='change_password'),
    path('auth/protected/', protected_endpoint, name='protected_endpoint'),
    
    # === ENDPOINTS ADMIN/STAFF ===
    path('api/admin/dashboard/', admin_dashboard, name='admin_dashboard'),
    path('api/staff/dashboard/', staff_dashboard, name='staff_dashboard'),
    
    # === DOCUMENTAÇÃO DA API ===
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # === MÉTRICAS PROMETHEUS ===
    path('metrics/', metrics_view, name='prometheus_metrics'),

    # === APIs REST ===
    path('api/', include('fiscalizacao.urls')),
    path('api/multas/', include('multas.api_urls')),
    path('api/produtos/', include('produtos.urls')),
    path('api/teste/', test_api, name='teste_api'),
    path('api/test/', test_api, name='test_api'),
    path('health/', include('health.urls')),
    path('health-check/', health_check, name='health_check'),
    
    # APIs dos novos módulos (apenas as rotas de API, não as views)
    path('api/protocolo/', include(('protocolo.urls', 'protocolo'), namespace='api_protocolo')),
    path('api/protocolo-tramitacao/', include(('protocolo_tramitacao.urls', 'protocolo_tramitacao'), namespace='api_protocolo_tramitacao')),
    path('api/peticionamento/', include(('peticionamento.urls', 'peticionamento'), namespace='api_peticionamento')),
    path('api/analise-juridica/', include(('analise_juridica.urls', 'analise_juridica'), namespace='api_analise_juridica')),
    path('api/portal/', include(('portal_cidadao.urls', 'portal_cidadao'), namespace='api_portal_cidadao')),
    path('api/juridico/', include(('juridico.urls', 'juridico'), namespace='api_juridico')),
    path('api/cobranca/', include(('cobranca.urls', 'cobranca'), namespace='api_cobranca')),
    path('api/notificacoes/', include(('notificacoes.urls', 'notificacoes'), namespace='api_notificacoes')),
    path('api/caixa-entrada/', include(('caixa_entrada.urls', 'caixa_entrada'), namespace='api_caixa_entrada')),
    
    # URLs de template dos novos módulos
    path('peticionamento/', include(('peticionamento.urls', 'peticionamento'), namespace='peticionamento')),
    path('recursos/', include(('recursos.urls', 'recursos'), namespace='recursos')),
    path('caixa-entrada/', include(('caixa_entrada.urls', 'caixa_entrada'), namespace='caixa_entrada')),
    
    # === INTERFACE WEB ===
    # Portal do cidadão - página principal
    path('', include(('portal_cidadao.urls', 'portal_cidadao'), namespace='portal')),
    
    # Apps existentes
    path('dashboard/', include(('dashboard.urls', 'dashboard'), namespace='dashboard')),
    path('multas/', include(('multas.urls', 'multas'), namespace='multas')),
    path('legislacao/', include(('legislacao.urls', 'legislacao'), namespace='legislacao')),
    path('protocolo/', include(('protocolo.urls', 'protocolo'), namespace='protocolo')),
    path('juridico/', include(('juridico.urls', 'juridico'), namespace='juridico'))
]
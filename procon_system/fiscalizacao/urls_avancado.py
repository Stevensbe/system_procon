from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_avancado

app_name = 'fiscalizacao_avancado'

router = DefaultRouter()
router.register(r'tipos', views_avancado.TipoFiscalizacaoViewSet)
router.register(r'evidencias', views_avancado.EvidenciaFiscalizacaoViewSet)
router.register(r'autos-avancados', views_avancado.AutoInfracaoAvancadoViewSet)
router.register(r'historico', views_avancado.HistoricoAutoInfracaoViewSet)
router.register(r'templates', views_avancado.TemplateAutoInfracaoViewSet)
router.register(r'notificacoes', views_avancado.NotificacaoEletronicaViewSet)
router.register(r'configuracoes', views_avancado.ConfiguracaoFiscalizacaoViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/dashboard-avancado/', views_avancado.DashboardFiscalizacaoAvancadoAPIView.as_view(), name='api_dashboard_avancado'),
    path('api/gerar-auto-automatico/', views_avancado.GerarAutoAutomaticoAPIView.as_view(), name='api_gerar_auto_automatico'),
    path('api/upload-evidencia/', views_avancado.UploadEvidenciaAPIView.as_view(), name='api_upload_evidencia'),
]

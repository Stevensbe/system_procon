from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'protocolo_tramitacao'

# API Router
router = DefaultRouter()
router.register(r'protocolos', views.ProtocoloDocumentoViewSet)
router.register(r'tipos-documento', views.TipoDocumentoViewSet)
router.register(r'setores', views.SetorViewSet)
router.register(r'tramitacoes', views.TramitacaoDocumentoViewSet)
router.register(r'anexos', views.AnexoProtocoloViewSet)

urlpatterns = [
    # Dashboard
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    # Protocolo
    path('protocolar/', views.protocolar_documento, name='protocolar'),
    path('consultar/', views.consultar_protocolo, name='consultar'),
    path('protocolo/<str:numero>/', views.detalhe_protocolo, name='detalhe'),
    
    # Tramitação
    path('tramitar/<int:protocolo_id>/', views.tramitar_documento, name='tramitar'),
    path('receber/<int:tramitacao_id>/', views.receber_documento, name='receber'),
    
    # Relatórios
    path('relatorios/', views.relatorios_view, name='relatorios'),
    path('relatorio/por-setor/', views.relatorio_por_setor, name='relatorio_setor'),
    path('relatorio/por-status/', views.relatorio_por_status, name='relatorio_status'),
    path('relatorio/por-prazo/', views.relatorio_por_prazo, name='relatorio_prazo'),
    
    # API
    path('', include(router.urls)),
    
    # APIs específicas
    path('estatisticas/', views.EstatisticasAPIView.as_view(), name='api_estatisticas'),
    path('pendencias/', views.PendenciasAPIView.as_view(), name='api_pendencias'),
    path('tramitacoes-pendentes/', views.TramitacoesPendentesAPIView.as_view(), name='api_tramitacoes_pendentes'),
]
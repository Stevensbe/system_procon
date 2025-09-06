from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'protocolo'

# Router para APIs
router = DefaultRouter()
router.register(r'tipos', views.TipoProtocoloViewSet)
router.register(r'status', views.StatusProtocoloViewSet)
router.register(r'protocolos', views.ProtocoloViewSet)
router.register(r'documentos', views.DocumentoProtocoloViewSet)
router.register(r'tramitacoes', views.TramitacaoProtocoloViewSet)
router.register(r'alertas', views.AlertaProtocoloViewSet)

# URLs de template
urlpatterns = [
    # APIs
    path('', include(router.urls)),

    # Endpoints específicos
    path('dashboard/', views.DashboardProtocoloAPIView.as_view(), name='api_dashboard'),
    
    # Páginas principais
    path('', views.ProtocoloList.as_view(), name='listar_protocolo'),
    path('add/', views.ProtocoloCreate.as_view(), name='criar_protocolo'),
    path('<int:pk>/edit/', views.ProtocoloUpdate.as_view(), name='editar_protocolo'),
    path('<int:pk>/delete/', views.ProtocoloDelete.as_view(), name='excluir_protocolo'),
    
    # Novas páginas
    path('dashboard/', views.ProtocoloDashboardView.as_view(), name='dashboard'),
    path('<int:pk>/documentos/', views.ProtocoloDocumentosView.as_view(), name='documentos'),
    path('<int:pk>/tramitacao/', views.ProtocoloTramitacaoView.as_view(), name='tramitacao'),
    path('protocolos/<int:pk>/tramitar/', views.ProtocoloViewSet.as_view({'post': 'tramitar'}), name='api_tramitar_protocolo'),
    path('protocolos/<int:pk>/concluir/', views.ProtocoloViewSet.as_view({'post': 'concluir'}), name='api_concluir_protocolo'),
    path('protocolos/atrasados/', views.ProtocoloViewSet.as_view({'get': 'atrasados'}), name='api_protocolos_atrasados'),
    path('documentos/<int:pk>/indexar/', views.DocumentoProtocoloViewSet.as_view({'post': 'indexar'}), name='api_indexar_documento'),
    path('alertas/<int:pk>/marcar-lido/', views.AlertaProtocoloViewSet.as_view({'post': 'marcar_lido'}), name='api_marcar_alerta_lido'),
    path('alertas/nao-lidos/', views.AlertaProtocoloViewSet.as_view({'get': 'nao_lidos'}), name='api_alertas_nao_lidos'),
]

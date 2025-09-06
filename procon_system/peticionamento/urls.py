from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'peticionamento'

# Router para APIs
router = DefaultRouter()
router.register(r'tipos', views.TipoPeticaoViewSet)
router.register(r'peticoes', views.PeticaoEletronicaViewSet)
router.register(r'anexos', views.AnexoPeticaoViewSet)
router.register(r'interacoes', views.InteracaoPeticaoViewSet)
router.register(r'respostas', views.RespostaPeticaoViewSet)
router.register(r'configuracoes', views.ConfiguracaoPeticionamentoViewSet)

# URLs de template
urlpatterns = [
    # Páginas principais
    path('', views.dashboard_view, name='dashboard'),
    path('lista/', views.lista_peticoes, name='lista_peticoes'),
    path('nova/', views.nova_peticao, name='nova_peticao'),
    path('<int:pk>/', views.detalhe_peticao, name='detalhe_peticao'),
    
    # Portal do cidadão
    path('portal/', views.portal_cidadao, name='portal_cidadao'),
    
    # APIs
    path('', include(router.urls)),
    
    # Endpoints específicos
    path('api/dashboard/', views.PeticaoEletronicaViewSet.as_view({'get': 'dashboard'}), name='api_dashboard'),
    path('api/peticoes/vencidas/', views.PeticaoEletronicaViewSet.as_view({'get': 'vencidas'}), name='api_peticoes_vencidas'),
    path('api/peticoes/pendentes/', views.PeticaoEletronicaViewSet.as_view({'get': 'pendentes'}), name='api_peticoes_pendentes'),
    path('api/peticoes/<int:pk>/enviar/', views.PeticaoEletronicaViewSet.as_view({'post': 'enviar'}), name='api_enviar_peticao'),
    path('api/peticoes/<int:pk>/receber/', views.PeticaoEletronicaViewSet.as_view({'post': 'receber'}), name='api_receber_peticao'),
    path('api/peticoes/<int:pk>/cancelar/', views.PeticaoEletronicaViewSet.as_view({'post': 'cancelar'}), name='api_cancelar_peticao'),
    path('api/respostas/<int:pk>/enviar/', views.RespostaPeticaoViewSet.as_view({'post': 'enviar'}), name='api_enviar_resposta'),
    
    # APIs públicas
    path('api/portal/peticao/', views.PortalPeticaoAPIView.as_view(), name='api_portal_peticao'),
    path('api/consulta/', views.ConsultaPeticaoAPIView.as_view(), name='api_consulta_peticao'),
    path('api/validar-documento/', views.ValidarDocumentoAPIView.as_view(), name='api_validar_documento'),
    path('api/upload-anexo/', views.UploadAnexoAPIView.as_view(), name='api_upload_anexo'),
]
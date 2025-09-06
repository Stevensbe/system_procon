from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para APIs REST
router = DefaultRouter()
router.register(r'analistas', views.AnalistaJuridicoViewSet)
router.register(r'processos', views.ProcessoJuridicoViewSet)
router.register(r'analises', views.AnaliseJuridicaViewSet)
router.register(r'respostas', views.RespostaJuridicaViewSet)
router.register(r'prazos', views.PrazoJuridicoViewSet)
router.register(r'documentos', views.DocumentoJuridicoViewSet)
router.register(r'historico', views.HistoricoJuridicoViewSet)
router.register(r'configuracoes', views.ConfiguracaoJuridicoViewSet)

# === NOVOS VIEWSETS PARA RECURSOS ADMINISTRATIVOS ===
router.register(r'recursos', views.RecursoAdministrativoViewSet)
router.register(r'pareceres', views.ParecerJuridicoViewSet)
router.register(r'documentos-recurso', views.DocumentoRecursoViewSet)
router.register(r'workflows', views.WorkflowJuridicoViewSet)
router.register(r'historico-recurso', views.HistoricoRecursoViewSet)

app_name = 'juridico'

urlpatterns = [
    # === APIs REST ===
    path('', include(router.urls)),
    
    # === URLs TEMPLATE (LEGACY) ===
    path('', views.JuridicoHomeView.as_view(), name='home'),
    path('processos/', views.ProcessoJuridicoList.as_view(), name='listar_processo'),
    path('processos/novo/', views.ProcessoJuridicoCreate.as_view(), name='criar_processo'),
    path('processos/<int:pk>/editar/', views.ProcessoJuridicoUpdate.as_view(), name='editar_processo'),
    path('processos/<int:pk>/excluir/', views.ProcessoJuridicoDelete.as_view(), name='excluir_processo'),
    
    # === APIs ESPECIAIS ===
    path('dashboard/', views.DashboardJuridicoAPIView.as_view({'get': 'dados'}), name='dashboard'),
    path('estatisticas/', views.DashboardJuridicoAPIView.as_view({'get': 'estatisticas'}), name='estatisticas'),
    path('integracao/', views.IntegracaoPeticaoAPIView.as_view({'post': 'criar_processo'}), name='integracao'),
    path('verificar-prazos/', views.verificar_prazos_vencendo, name='verificar_prazos'),
    
    # === APIs PARA RECURSOS ===
    path('recursos-dashboard/', views.RecursoAdministrativoViewSet.as_view({'get': 'dashboard'}), name='recursos_dashboard'),
    path('recursos-atrasados/', views.RecursoAdministrativoViewSet.as_view({'get': 'atrasados'}), name='recursos_atrasados'),
    path('verificar-recursos-atrasados/', views.verificar_recursos_atrasados, name='verificar_recursos_atrasados'),
]

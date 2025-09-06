from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'relatorios'

# Router para APIs
router = DefaultRouter()
router.register(r'tipos', views.TipoRelatorioViewSet)
router.register(r'relatorios', views.RelatorioViewSet)
router.register(r'agendados', views.RelatorioAgendadoViewSet)
router.register(r'templates', views.TemplateRelatorioViewSet)
router.register(r'filtros', views.FiltroRelatorioViewSet)
router.register(r'compartilhados', views.RelatorioCompartilhadoViewSet)
router.register(r'historico', views.HistoricoRelatorioViewSet)
router.register(r'configuracoes', views.ConfiguracaoRelatorioViewSet)

# URLs de template
urlpatterns = [
    # Páginas principais
    path('', views.relatorios_home, name='home'),
    path('lista/', views.relatorios_lista, name='lista'),
    path('agendados/', views.relatorios_agendados, name='agendados'),
    path('templates/', views.relatorios_templates, name='templates'),
    path('configuracoes/', views.relatorios_configuracoes, name='configuracoes'),
    
    # APIs
    path('', include(router.urls)),
    
    # Endpoints específicos
    path('api/dashboard/', views.RelatorioViewSet.as_view({'get': 'dashboard'}), name='api_dashboard'),
    path('api/estatisticas/', views.RelatorioViewSet.as_view({'get': 'estatisticas'}), name='api_estatisticas'),
    path('api/relatorios/<int:pk>/cancelar/', views.RelatorioViewSet.as_view({'post': 'cancelar'}), name='api_cancelar_relatorio'),
    path('api/relatorios/<int:pk>/compartilhar/', views.RelatorioViewSet.as_view({'post': 'compartilhar'}), name='api_compartilhar_relatorio'),
    path('api/relatorios/<int:pk>/download/', views.RelatorioViewSet.as_view({'get': 'download'}), name='api_download_relatorio'),
    
    # Agendamentos
    path('api/agendados/<int:pk>/ativar/', views.RelatorioAgendadoViewSet.as_view({'post': 'ativar'}), name='api_ativar_agendamento'),
    path('api/agendados/<int:pk>/desativar/', views.RelatorioAgendadoViewSet.as_view({'post': 'desativar'}), name='api_desativar_agendamento'),
    path('api/agendados/<int:pk>/executar/', views.RelatorioAgendadoViewSet.as_view({'post': 'executar_agora'}), name='api_executar_agendamento'),
    
    # Templates
    path('api/templates/<int:pk>/padrao/', views.TemplateRelatorioViewSet.as_view({'post': 'definir_padrao'}), name='api_definir_template_padrao'),
    
    # Compartilhamentos
    path('api/compartilhados/<int:pk>/revogar/', views.RelatorioCompartilhadoViewSet.as_view({'post': 'revogar'}), name='api_revogar_compartilhamento'),
]
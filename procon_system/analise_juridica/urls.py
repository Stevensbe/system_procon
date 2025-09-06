from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'analise_juridica'

# API Router (para futuras implementações de API REST)
router = DefaultRouter()
# router.register(r'analises', views.AnaliseJuridicaViewSet)
# router.register(r'pareceres', views.ParecerTecnicoViewSet)
# router.register(r'decisoes', views.DecisaoAdministrativaViewSet)
# router.register(r'recursos', views.RecursoAdministrativoViewSet)

urlpatterns = [
    # Dashboard
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    # === ANÁLISES JURÍDICAS ===
    path('analises/', views.gestao_analises, name='gestao_analises'),
    path('analises/nova/', views.nova_analise, name='nova_analise'),
    path('analises/<int:analise_id>/', views.detalhe_analise, name='detalhe_analise'),
    path('analises/<int:analise_id>/editar/', views.editar_analise, name='editar_analise'),
    path('analises/<int:analise_id>/iniciar/', views.iniciar_analise, name='iniciar_analise'),
    path('analises/<int:analise_id>/finalizar/', views.finalizar_analise, name='finalizar_analise'),
    
    # === PARECERES TÉCNICOS ===
    path('pareceres/', views.gestao_pareceres, name='gestao_pareceres'),
    path('analises/<int:analise_id>/pareceres/novo/', views.novo_parecer, name='novo_parecer'),
    path('pareceres/<int:parecer_id>/editar/', views.editar_parecer, name='editar_parecer'),
    
    # === DECISÕES ADMINISTRATIVAS ===
    path('decisoes/', views.gestao_decisoes, name='gestao_decisoes'),
    path('analises/<int:analise_id>/decisoes/nova/', views.nova_decisao, name='nova_decisao'),
    path('decisoes/<int:decisao_id>/publicar/', views.publicar_decisao, name='publicar_decisao'),
    
    # === RECURSOS ADMINISTRATIVOS ===
    path('recursos/', views.gestao_recursos, name='gestao_recursos'),
    path('recursos/<int:recurso_id>/', views.detalhe_recurso, name='detalhe_recurso'),
    path('recursos/<int:recurso_id>/julgar/', views.julgar_recurso, name='julgar_recurso'),
    
    # === RELATÓRIOS ===
    path('relatorios/', views.relatorios_view, name='relatorios'),
    path('relatorio/estatisticas/', views.relatorio_estatisticas, name='relatorio_estatisticas'),
    path('relatorio/por-status/', views.relatorio_por_status, name='relatorio_por_status'),
    path('relatorio/por-tipo/', views.relatorio_por_tipo, name='relatorio_por_tipo'),
    path('relatorio/por-analista/', views.relatorio_por_analista, name='relatorio_por_analista'),
    path('relatorio/prazos/', views.relatorio_prazos, name='relatorio_prazos'),
    
    # === CONFIGURAÇÕES ===
    path('configuracoes/', views.configuracoes_view, name='configuracoes'),
    
    # === API ===
    path('', include(router.urls)),
    
    # APIs específicas
    path('api/estatisticas/', views.EstatisticasAPIView.as_view(), name='api_estatisticas'),
    path('api/dashboard-dados/', views.DashboardDadosAPIView.as_view(), name='api_dashboard_dados'),
    
    # === FUNÇÕES AUXILIARES ===
    path('upload-documento/', views.upload_documento, name='upload_documento'),
    path('gerar-numero/', views.gerar_numero_automatico, name='gerar_numero_automatico'),
]
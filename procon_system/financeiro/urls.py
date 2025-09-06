from django.urls import path
from . import views

app_name = 'financeiro'

urlpatterns = [
    # Dashboard principal
    path('', views.dashboard_financeiro, name='dashboard'),
    
    # API para dados dos gráficos (legacy)
    path('api/dados-graficos/', views.dados_graficos_api, name='dados_graficos_api'),
    
    # Exportação de dados
    path('exportar/', views.exportar_dados, name='exportar_dados'),
    
    # Gestão de registros financeiros
    path('registros/', views.FinanceiroListView.as_view(), name='listar_financeiro'),
    path('registros/criar/', views.FinanceiroCreateView.as_view(), name='criar_financeiro'),
    path('registros/<int:pk>/editar/', views.FinanceiroUpdateView.as_view(), name='editar_financeiro'),
    path('registros/<int:pk>/excluir/', views.FinanceiroDeleteView.as_view(), name='excluir_financeiro'),
    
    # ============================================================================
    # APIs REST PARA FRONTEND REACT
    # ============================================================================
    
    # Dashboard KPIs
    path('dashboard/', views.dashboard_api_view, name='dashboard_api'),
    
    # Dados dos gráficos
    path('arrecadacao-mensal/', views.arrecadacao_mensal_api_view, name='arrecadacao_mensal_api'),
    path('composicao-carteira/', views.composicao_carteira_api_view, name='composicao_carteira_api'),
    
    # Relatórios com filtros
    path('relatorios/', views.relatorio_multas_api_view, name='relatorio_multas_api'),
    
    # Lista de empresas para filtros
    path('empresas/', views.empresas_list_api_view, name='empresas_list_api'),
]
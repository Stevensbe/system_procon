from django.urls import path
from . import views

app_name = 'consulta_publica'

urlpatterns = [
    # Página inicial
    path('', views.home, name='home'),
    
    # Consultas públicas
    path('empresas/', views.consultar_empresas, name='empresas'),
    path('empresas/<str:cnpj>/', views.empresa_detalhes, name='empresa_detalhes'),
    
    path('processos/', views.consultar_processos, name='processos'),
    path('processos/<str:numero_processo>/', views.processo_detalhes, name='processo_detalhes'),
    
    path('ranking/', views.ranking_empresas, name='ranking'),
    path('precos/', views.monitoramento_precos, name='precos'),
    path('restricoes/', views.consultar_restricoes, name='restricoes'),
    
    # APIs públicas
    path('api/busca-empresa/', views.api_busca_empresa, name='api_busca_empresa'),
    path('api/estatisticas/', views.api_estatisticas, name='api_estatisticas'),
    path('api/atualizar-dados/', views.atualizar_dados_publicos, name='atualizar_dados_publicos'),
]
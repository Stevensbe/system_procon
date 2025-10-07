from django.urls import path
from . import views

app_name = 'atendimento'

urlpatterns = [
    path('api/dashboard/', views.api_dashboard_atendimento, name='api_dashboard_atendimento'),
    path('api/reclamacoes/', views.api_reclamacoes, name='api_reclamacoes'),
    path('api/reclamacoes/<int:pk>/', views.api_reclamacao_detalhe, name='api_reclamacao_detalhe'),
    path('api/registros-presenciais/', views.api_registro_presencial, name='api_registro_presencial'),
    path('api/consultar-cnpj/', views.api_consultar_cnpj, name='api_consultar_cnpj'),
    path('consultar-cnpj/', views.api_consultar_cnpj, name='api_consultar_cnpj_legacy'),
]

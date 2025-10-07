from django.urls import path
from . import api_views

app_name = 'api'

urlpatterns = [
    path('multas/search/', api_views.multas_search, name='multas-search'),
    path('financeiro/dashboard/', api_views.financeiro_dashboard, name='financeiro-dashboard'),
    path('financeiro/arrecadacao-mensal/', api_views.financeiro_arrecadacao_mensal, name='financeiro-arrecadacao-mensal'),
    path('financeiro/composicao-carteira/', api_views.financeiro_composicao_carteira, name='financeiro-composicao-carteira'),
    path('financeiro/relatorios/', api_views.financeiro_relatorios, name='financeiro-relatorios'),
    path('fiscalizacao/', api_views.fiscalizacao_list, name='fiscalizacao-list'),
]

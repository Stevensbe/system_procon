from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views
from .api_views import BalcaoAtendimentoViewSet, SenhaAtendimentoViewSet, AutoAtendimentoViewSet

app_name = 'atendimento'

urlpatterns = [
    path('api/dashboard/', views.api_dashboard_atendimento, name='api_dashboard_atendimento'),
    path('api/reclamacoes/', views.api_reclamacoes, name='api_reclamacoes'),
    path('api/reclamacoes/<int:pk>/', views.api_reclamacao_detalhe, name='api_reclamacao_detalhe'),
    path('api/registros-presenciais/', views.api_registro_presencial, name='api_registro_presencial'),
    path('api/consultar-cnpj/', views.api_consultar_cnpj, name='api_consultar_cnpj'),
    path('api/empresas/cadastro-rapido/', views.api_cadastro_rapido_empresa, name='api_cadastro_rapido_empresa'),
    path('api/relatorios-detalhados/', views.api_relatorios_detalhados, name='api_relatorios_detalhados'),
    path('api/configuracoes/', views.api_configuracao_atendimento, name='api_configuracao_atendimento'),
    path('api/distribuicao/regras/', views.api_regras_distribuicao, name='api_regras_distribuicao'),
    path('api/distribuicao/regras/<int:pk>/', views.api_regra_distribuicao_detalhe, name='api_regra_distribuicao_detalhe'),
    path('api/atendimentos/<int:atendimento_id>/remocao/solicitar/', views.api_solicitar_remocao_dados, name='api_solicitar_remocao_dados'),
    path('api/atendimentos/<int:atendimento_id>/remocao/confirmar/', views.api_confirmar_remocao_dados, name='api_confirmar_remocao_dados'),
    path('consultar-cnpj/', views.api_consultar_cnpj, name='api_consultar_cnpj_legacy'),
    path('totem/', views.totem_autoatendimento, name='totem_autoatendimento'),
    path('painel-tv/', views.painel_atendimento_tv, name='painel_atendimento_tv'),
]

router = DefaultRouter()
router.register(r'balcoes', BalcaoAtendimentoViewSet, basename='balcao-atendimento')
router.register(r'senhas', SenhaAtendimentoViewSet, basename='senha-atendimento')
router.register(r'autoatendimento', AutoAtendimentoViewSet, basename='autoatendimento')

urlpatterns += router.urls

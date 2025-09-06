from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configurar o router para as APIs
router = DefaultRouter()
router.register(r'boletos', views.BoletoMultaViewSet, basename='boleto')
router.register(r'pagamentos', views.PagamentoMultaViewSet, basename='pagamento')
router.register(r'cobrancas', views.CobrancaMultaViewSet, basename='cobranca-multa')
router.register(r'configuracoes', views.ConfiguracaoCobrancaViewSet, basename='configuracao')
router.register(r'templates', views.TemplateCobrancaViewSet, basename='template')
router.register(r'geral', views.CobrancaViewSet, basename='cobranca-geral')
router.register(r'remessas', views.RemessaViewSet, basename='remessa')
router.register(r'bancos', views.BancoViewSet, basename='banco')

app_name = 'cobranca'

urlpatterns = [
    # URLs específicas para endpoints com hífen (frontend) - DEVEM VIR ANTES DO ROUTER
    path('boletos/boletos-recentes/', 
         views.BoletoMultaViewSet.as_view({'get': 'boletos_recentes'}), 
         name='boletos-recentes'),
    
    path('boletos/boletos-vencidos/', 
         views.BoletoMultaViewSet.as_view({'get': 'boletos_vencidos'}), 
         name='boletos-vencidos'),
    
    path('boletos/boletos-por-status/', 
         views.BoletoMultaViewSet.as_view({'get': 'boletos_por_status'}), 
         name='boletos-por-status'),
    
    path('pagamentos/pagamentos-recentes/', 
         views.PagamentoMultaViewSet.as_view({'get': 'pagamentos_recentes'}), 
         name='pagamentos-recentes'),
    
    path('pagamentos/pagamentos-por-mes/', 
         views.PagamentoMultaViewSet.as_view({'get': 'pagamentos_por_mes'}), 
         name='pagamentos-por-mes'),
    
    path('cobrancas/cobrancas-recentes/', 
         views.CobrancaMultaViewSet.as_view({'get': 'cobrancas_recentes'}), 
         name='cobrancas-recentes'),
    
    path('cobrancas/cobrancas-por-status/', 
         views.CobrancaMultaViewSet.as_view({'get': 'cobrancas_por_status'}), 
         name='cobrancas-por-status'),
    
    # URLs específicas para funcionalidades
    path('boletos/<int:pk>/alterar-status/', 
         views.BoletoMultaViewSet.as_view({'post': 'alterar_status'}), 
         name='boleto-alterar-status'),
    
    path('boletos/<int:pk>/anexar-documento/', 
         views.BoletoMultaViewSet.as_view({'post': 'anexar_documento'}), 
         name='boleto-anexar-documento'),
    
    path('cobrancas/<int:pk>/gerar/', 
         views.CobrancaMultaViewSet.as_view({'post': 'gerar_cobranca'}), 
         name='cobranca-gerar'),
    
    # URLs específicas para remessas
    path('remessas/<int:pk>/gerar/', 
         views.RemessaViewSet.as_view({'post': 'gerar_remessa'}), 
         name='remessa-gerar'),
    
    path('remessas/<int:pk>/processar-retorno/', 
         views.RemessaViewSet.as_view({'post': 'processar_retorno'}), 
         name='remessa-processar-retorno'),
    
    # APIs REST - DEVEM VIR POR ÚLTIMO
    path('', include(router.urls)),
]

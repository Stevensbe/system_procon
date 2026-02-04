from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configurar o router para as APIs
router = DefaultRouter()
router.register(r'boletos', views.BoletoViewSet, basename='boleto')
router.register(r'pagamentos', views.PagamentoViewSet, basename='pagamento')
router.register(r'remessas', views.RemessaViewSet, basename='remessa')
router.register(r'tipos-boleto', views.TipoBoletoViewSet, basename='tipo-boleto')
router.register(r'bancos', views.BancoViewSet, basename='banco')
router.register(r'cobranca', views.CobrancaViewSet, basename='cobranca')

app_name = 'cobranca'

urlpatterns = [
    # APIs REST
    path('api/', include(router.urls)),
    
    # URLs específicas para funcionalidades
    path('api/boletos/<int:pk>/alterar-status/', 
         views.BoletoViewSet.as_view({'post': 'alterar_status'}), 
         name='boleto-alterar-status'),
    
    path('api/boletos/<int:pk>/anexar-documento/', 
         views.BoletoViewSet.as_view({'post': 'anexar_documento'}), 
         name='boleto-anexar-documento'),
    
    path('api/remessas/<int:pk>/gerar/', 
         views.RemessaViewSet.as_view({'post': 'gerar_remessa'}), 
         name='remessa-gerar'),
]

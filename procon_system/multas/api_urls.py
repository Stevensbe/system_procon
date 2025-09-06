from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

# Configurar router DRF
router = DefaultRouter()
router.register(r'multas', api_views.MultaViewSet, basename='multas')
router.register(r'empresas', api_views.EmpresaViewSet, basename='empresas')
router.register(r'departamentos', api_views.DepartamentoViewSet, basename='departamentos')
router.register(r'cobrancas', api_views.CobrancaViewSet, basename='cobrancas')
router.register(r'peticoes', api_views.PeticaoViewSet, basename='peticoes')
router.register(r'recursos', api_views.RecursoViewSet, basename='recursos')
router.register(r'analises', api_views.AnaliseViewSet, basename='analises')
router.register(r'configuracoes-bancarias', api_views.ConfigBancariaViewSet, basename='configuracoes-bancarias')
router.register(r'configuracoes-sistema', api_views.ConfigSistemaViewSet, basename='configuracoes-sistema')

urlpatterns = [
    # Incluir todas as rotas do router
    path('', include(router.urls)),
]

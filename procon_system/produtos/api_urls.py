from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .api_views import (
    ProdutoViewSet, CategoriaProdutoViewSet, FabricanteViewSet,
    RegistroPrecoViewSet, ProdutoInutilizadoViewSet, ControleEstoqueViewSet
)

router = DefaultRouter()
router.register(r'produtos', ProdutoViewSet)
router.register(r'categorias', CategoriaProdutoViewSet)
router.register(r'fabricantes', FabricanteViewSet)
router.register(r'precos', RegistroPrecoViewSet)
router.register(r'inutilizados', ProdutoInutilizadoViewSet)
router.register(r'estoque', ControleEstoqueViewSet)

app_name = 'produtos_api'

urlpatterns = [
    path('', include(router.urls)),
]
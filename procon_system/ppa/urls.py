from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'ppas', views.ProcedimentoPreAdministrativoViewSet, basename='ppa')
router.register(r'movimentacoes', views.MovimentacaoPPAViewSet, basename='movimentacao-ppa')
router.register(r'anexos', views.AnexoPPAViewSet, basename='anexo-ppa')
router.register(r'pareceres', views.ParecerPPAViewSet, basename='parecer-ppa')

app_name = 'ppa'

urlpatterns = [
    path('', include(router.urls)),
]


from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RespostaEmpresaViewSet

router = DefaultRouter()
router.register(r"respostas", RespostaEmpresaViewSet, basename="respostaempresa")

app_name = "resposta_empresa"

urlpatterns = [
    path("", include(router.urls)),
]

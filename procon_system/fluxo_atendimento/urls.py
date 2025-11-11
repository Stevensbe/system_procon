from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FluxoAtendimentoViewSet

router = DefaultRouter()
router.register(r"workflow", FluxoAtendimentoViewSet, basename="fluxo")

app_name = "fluxo_atendimento"

urlpatterns = [
    path("", include(router.urls)),
]

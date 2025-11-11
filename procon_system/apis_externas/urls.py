from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    OrgaoExternoViewSet,
    CredencialAcessoViewSet,
    EnvioDocumentoExternoViewSet,
    TemplateIntegracaoViewSet,
    EventoIntegracaoViewSet,
    MetricasIntegracaoViewSet,
)


router = DefaultRouter()
router.register(r"orgaos", OrgaoExternoViewSet, basename="orgaoexterno")
router.register(r"credenciais", CredencialAcessoViewSet, basename="credencialacesso")
router.register(r"envios", EnvioDocumentoExternoViewSet, basename="enviodocumentoexterno")
router.register(r"templates", TemplateIntegracaoViewSet, basename="templateintegracao")
router.register(r"eventos", EventoIntegracaoViewSet, basename="eventointegracao")
router.register(r"metricas", MetricasIntegracaoViewSet, basename="metricasintegracao")

app_name = "apis_externas"

urlpatterns = [
    path("", include(router.urls)),
]


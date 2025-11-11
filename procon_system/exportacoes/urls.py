from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    TipoExportacaoViewSet,
    DestinacaoExportacaoViewSet,
    TemplateExportacaoViewSet,
    AgendamentoExportacaoViewSet,
    ExecucaoExportacaoViewSet,
    HistoricoExportacaoViewSet,
)


router = DefaultRouter()
router.register(r"tipos", TipoExportacaoViewSet, basename="tipoexportacao")
router.register(r"destinos", DestinacaoExportacaoViewSet, basename="destinacaoexportacao")
router.register(r"templates", TemplateExportacaoViewSet, basename="templateexportacao")
router.register(r"agendamentos", AgendamentoExportacaoViewSet, basename="agendamentoexportacao")
router.register(r"execucoes", ExecucaoExportacaoViewSet, basename="execucaoexportacao")
router.register(r"historicos", HistoricoExportacaoViewSet, basename="historicoexportacao")

app_name = "exportacoes"

urlpatterns = [
    path("", include(router.urls)),
]


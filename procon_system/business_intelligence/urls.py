from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    KPIViewSet,
    DashboardViewSet,
    ValorKPIViewSet,
    RelatorioPersonalizadoViewSet,
    HistoricoRelatorioViewSet,
    AnaliseEmpiricaViewSet,
    PortalConsumidorAnalyticsViewSet,
)

router = DefaultRouter()
router.register(r"kpis", KPIViewSet, basename="kpi")
router.register(r"dashboards", DashboardViewSet, basename="dashboard")
router.register(r"valores", ValorKPIViewSet, basename="valor-kpi")
router.register(r"relatorios", RelatorioPersonalizadoViewSet, basename="relatorio-personalizado")
router.register(r"historicos", HistoricoRelatorioViewSet, basename="historico-relatorio")
router.register(r"analises", AnaliseEmpiricaViewSet, basename="analise-empirica")
router.register(r"portal-consumidor", PortalConsumidorAnalyticsViewSet, basename="portal-consumidor-analytics")

app_name = "business_intelligence"

urlpatterns = [
    path("", include(router.urls)),
]

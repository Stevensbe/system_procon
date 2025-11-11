from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AutomationRuleViewSet, AutomationRunViewSet, InsightTriggerViewSet

router = DefaultRouter()
router.register(r"regras", AutomationRuleViewSet, basename="automation-rule")
router.register(r"execucoes", AutomationRunViewSet, basename="automation-run")
router.register(r"insights", InsightTriggerViewSet, basename="insight-trigger")

app_name = "automated_intelligence"

urlpatterns = [
    path("", include(router.urls)),
]


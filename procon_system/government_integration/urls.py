from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import IntegrationConnectorViewSet, IntegrationSyncRunViewSet, IntegrationEventViewSet

router = DefaultRouter()
router.register(r"conectores", IntegrationConnectorViewSet, basename="integration-connector")
router.register(r"execucoes", IntegrationSyncRunViewSet, basename="integration-sync-run")
router.register(r"eventos", IntegrationEventViewSet, basename="integration-event")

app_name = "government_integration"

urlpatterns = [
    path("", include(router.urls)),
]


from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GeoDataLayerViewSet, GeoMetricViewSet, HeatmapSnapshotViewSet

router = DefaultRouter()
router.register(r"camadas", GeoDataLayerViewSet, basename="geo-layer")
router.register(r"metricas", GeoMetricViewSet, basename="geo-metric")
router.register(r"heatmaps", HeatmapSnapshotViewSet, basename="heatmap-snapshot")

app_name = "geospatial_analytics"

urlpatterns = [
    path("", include(router.urls)),
]


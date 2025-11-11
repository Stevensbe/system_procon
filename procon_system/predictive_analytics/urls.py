from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PredictiveModelViewSet, TrainingJobViewSet, ForecastResultViewSet

router = DefaultRouter()
router.register(r"modelos", PredictiveModelViewSet, basename="predictive-model")
router.register(r"treinos", TrainingJobViewSet, basename="training-job")
router.register(r"previsoes", ForecastResultViewSet, basename="forecast-result")

app_name = "predictive_analytics"

urlpatterns = [
    path("", include(router.urls)),
]


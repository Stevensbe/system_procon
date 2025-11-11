from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CIPAutomaticaViewSet, TipoCIPViewSet

router = DefaultRouter()
router.register(r"tipos", TipoCIPViewSet)
router.register(r"cips", CIPAutomaticaViewSet, basename="cipautomatica")

app_name = "cip_automatica"

urlpatterns = [
    path("", include(router.urls)),
]

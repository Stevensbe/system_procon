from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TriagemDemandaViewSet

router = DefaultRouter()
router.register(r"triagens", TriagemDemandaViewSet, basename="triagem-demanda")

urlpatterns = [
    path("", include(router.urls)),
]


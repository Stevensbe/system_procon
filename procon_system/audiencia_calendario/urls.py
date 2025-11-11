from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AgendamentoAudienciaViewSet, LocalAudienciaViewSet, MediadorViewSet

router = DefaultRouter()
router.register(r"mediadores", MediadorViewSet)
router.register(r"locais", LocalAudienciaViewSet)
router.register(r"agendamentos", AgendamentoAudienciaViewSet)

app_name = "audiencia_calendario"

urlpatterns = [
    path("", include(router.urls)),
]

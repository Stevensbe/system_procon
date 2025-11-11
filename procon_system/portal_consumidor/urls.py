from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import (
    FeedbackConsumidorAdminViewSet,
    FeedbackConsumidorViewSet,
    NotificacaoConsumidorViewSet,
    SessaoConsultaViewSet,
    TicketSuporteAdminViewSet,
    TicketSuporteViewSet,
)

router = DefaultRouter()
router.register("sessoes", SessaoConsultaViewSet, basename="sessoes")
router.register("notificacoes", NotificacaoConsumidorViewSet, basename="notificacoes")
router.register("feedbacks", FeedbackConsumidorViewSet, basename="feedbacks")
router.register("feedbacks-admin", FeedbackConsumidorAdminViewSet, basename="feedbacks-admin")
router.register("tickets", TicketSuporteViewSet, basename="tickets")
router.register("tickets-admin", TicketSuporteAdminViewSet, basename="tickets-admin")

app_name = "portal_consumidor"

urlpatterns = [
    path("", include(router.urls)),
]

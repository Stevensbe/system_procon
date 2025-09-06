from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tipos', views.TipoNotificacaoViewSet, basename='tipo-notificacao')
router.register(r'notificacoes', views.NotificacaoViewSet, basename='notificacao')
router.register(r'preferencias', views.PreferenciaNotificacaoViewSet, basename='preferencia-notificacao')
router.register(r'logs', views.LogNotificacaoViewSet, basename='log-notificacao')
router.register(r'templates', views.TemplateNotificacaoViewSet, basename='template-notificacao')
router.register(r'dashboard', views.NotificacaoDashboardViewSet, basename='dashboard-notificacao')
router.register(r'servicos', views.NotificacaoServiceViewSet, basename='servico-notificacao')

urlpatterns = [
    path('', include(router.urls)),
]
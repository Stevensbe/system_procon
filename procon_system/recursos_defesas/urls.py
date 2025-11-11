from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TipoDefesaViewSet, DefesaAdministrativaViewSet

app_name = 'recursos_defesas'

router = DefaultRouter()
router.register(r'tipos', TipoDefesaViewSet, basename='tipos')
router.register(r'defesas', DefesaAdministrativaViewSet, basename='defesas')

urlpatterns = [
    path('api/', include((router.urls, app_name))),
]

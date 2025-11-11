from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'usuarios', views.TIUserViewSet, basename='ti-usuarios')

urlpatterns = [
    path('', include(router.urls)),
    # Rotas adicionais para auditoria e estatísticas
    path('usuarios/auditoria/', views.TIUserViewSet.as_view({'get': 'auditoria'}), name='ti-auditoria'),
    path('usuarios/estatisticas/', views.TIUserViewSet.as_view({'get': 'estatisticas'}), name='ti-estatisticas'),
]

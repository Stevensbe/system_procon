from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'legislacao'

router = DefaultRouter()
router.register(r'leis', views.LeiViewSet)
router.register(r'artigos', views.ArtigoViewSet)

urlpatterns = [
    path('leis/',     views.LeiList.as_view(),   name='lei_list'),
    path('leis/add/', views.LeiCreate.as_view(), name='lei_add'),
    path('leis/<int:pk>/edit/', views.LeiUpdate.as_view(), name='lei_edit'),
    path('leis/<int:pk>/delete/',views.LeiDelete.as_view(), name='lei_delete'),

    path('artigos/',  views.ArtigoList.as_view(),   name='artigo_list'),
    path('artigos/add/', views.ArtigoCreate.as_view(), name='artigo_add'),

    path('api/', include(router.urls)),
]

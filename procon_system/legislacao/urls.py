from django.urls import path
from . import views

app_name = 'legislacao'
urlpatterns = [
    path('leis/',     views.LeiList.as_view(),   name='lei_list'),
    path('leis/add/', views.LeiCreate.as_view(), name='lei_add'),
    path('leis/<int:pk>/edit/', views.LeiUpdate.as_view(), name='lei_edit'),
    path('leis/<int:pk>/delete/',views.LeiDelete.as_view(), name='lei_delete'),

    path('artigos/',  views.ArtigoList.as_view(),   name='artigo_list'),
    path('artigos/add/', views.ArtigoCreate.as_view(), name='artigo_add'),
    # ...
]

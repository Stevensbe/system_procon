from django.urls import path
from . import views

app_name = 'recursos'

urlpatterns = [
    path('', views.recurso_list, name='list'),
    path('<int:pk>/', views.recurso_detail, name='detail'),
    path('protocolar/', views.protocolar_recurso, name='protocolar'),
    path('prazos/', views.controle_prazos, name='prazos'),
    path('julgamentos/', views.sessao_julgamento_list, name='julgamentos'),
    path('decisoes/', views.modelo_decisao_list, name='decisoes'),
]
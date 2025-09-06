from django.urls import path
from . import views

app_name = 'empresas'

urlpatterns = [
    path('', views.empresa_list, name='list'),
    path('dashboard/', views.empresa_dashboard, name='dashboard'),
    path('nova/', views.empresa_form, name='create'),
    path('<int:pk>/', views.empresa_detail, name='detail'),
    path('<int:pk>/editar/', views.empresa_form, name='edit'),
    path('<int:pk>/historico/', views.empresa_historico, name='historico'),
    path('<int:pk>/atualizar-risco/', views.atualizar_classificacao_risco, name='atualizar_risco'),
    path('buscar-ajax/', views.buscar_empresa_ajax, name='buscar_ajax'),
    path('relatorio/', views.empresa_relatorio, name='relatorio'),
]
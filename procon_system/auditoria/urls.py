from django.urls import path
from . import views

app_name = 'auditoria'

urlpatterns = [
    path('', views.dashboard_auditoria, name='dashboard'),
    path('logs/', views.log_sistema_list, name='logs'),
    path('alteracoes/', views.auditoria_alteracao_list, name='alteracoes'),
    path('sessoes/', views.sessao_usuario_list, name='sessoes'),
    path('seguranca/', views.log_seguranca_list, name='seguranca'),
    path('backups/', views.backup_log_list, name='backups'),
]
from django.urls import path
from . import views

app_name = 'agenda'

urlpatterns = [
    # Dashboard
    path('', views.dashboard_agenda, name='dashboard'),
    
    # Calendário principal
    path('calendario/', views.calendario_principal, name='calendario'),
    
    # Agenda de fiscal
    path('fiscal/', views.agenda_fiscal, name='agenda_fiscal'),
    path('fiscal/<int:fiscal_id>/', views.agenda_fiscal, name='agenda_fiscal_especifico'),
    
    # Eventos
    path('eventos/<int:pk>/', views.evento_detail, name='evento_detail'),
    path('eventos/<int:pk>/confirmar/', views.confirmar_evento, name='confirmar_evento'),
    path('eventos/<int:pk>/cancelar/', views.cancelar_evento, name='cancelar_evento'),
    
    # Fiscalizações
    path('fiscalizacoes/', views.calendario_fiscalizacao, name='calendario_fiscalizacao'),
    path('fiscalizacoes/<int:pk>/', views.fiscalizacao_detail, name='fiscalizacao_detail'),
    path('fiscalizacoes/<int:pk>/iniciar/', views.iniciar_fiscalizacao, name='iniciar_fiscalizacao'),
    
    # APIs e utilitários
    path('api/eventos/', views.eventos_api, name='eventos_api'),
    path('api/conflitos/', views.verificar_conflitos, name='verificar_conflitos'),
]
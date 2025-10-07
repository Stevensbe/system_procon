"""
URLs para o módulo de monitoramento
"""

from django.urls import path
from . import views

app_name = 'monitoring'

urlpatterns = [
    # Dashboards principais
    path('dashboard/prazos/', views.dashboard_prazos_criticos, name='dashboard_prazos'),
    path('dashboard/performance/', views.dashboard_performance, name='dashboard_performance'),
    
    # APIs AJAX
    path('api/prazos/', views.api_dashboard_prazos, name='api_prazos'),
    path('api/alerts-realtime/', views.api_alerts_realtime, name='api_alerts_realtime'),
    
    # Verificações automáticas
    path('sla/checks/', views.run_sla_checks, name='sla_checks'),
]

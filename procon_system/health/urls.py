"""
URLs para health checks
"""
from django.urls import path
from . import views

app_name = 'health'

urlpatterns = [
    path('', views.health_check, name='health'),
    path('detailed/', views.health_detailed, name='health_detailed'),
    path('ready/', views.readiness_check, name='readiness'),
    path('live/', views.liveness_check, name='liveness'),
]
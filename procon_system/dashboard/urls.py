from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # APIs do Dashboard
    path('api/dashboard-stats/', views.DashboardStatsAPIView.as_view(), name='dashboard_stats'),
    path('api/dashboard/graficos/', views.DashboardGraficosAPIView.as_view(), name='dashboard_graficos'),
    path('api/dashboard/alertas/', views.DashboardAlertasAPIView.as_view(), name='dashboard_alertas'),
    path('api/dashboard/atividades/', views.DashboardAtividadesAPIView.as_view(), name='dashboard_atividades'),
    path('api/dashboard/cached/', views.dashboard_cached_view, name='dashboard_cached'),
]
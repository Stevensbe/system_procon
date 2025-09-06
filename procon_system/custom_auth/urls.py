from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    # Autenticação
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
    
    # Perfil do usuário
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Endpoints de teste
    path('protected/', views.protected_endpoint, name='protected'),
    path('admin-only/', views.admin_only_endpoint, name='admin_only'),
    path('staff-only/', views.staff_only_endpoint, name='staff_only'),
]

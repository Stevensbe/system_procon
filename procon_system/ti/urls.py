from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import api_users

router = DefaultRouter()
router.register(r'usuarios', views.TIUserViewSet, basename='ti-usuarios')
router.register(r'configuracoes', views.ConfiguracaoSistemaViewSet, basename='ti-configuracoes')

urlpatterns = [
    path('', include(router.urls)),
    # Rotas adicionais para auditoria e estatísticas
    path('usuarios/auditoria/', views.TIUserViewSet.as_view({'get': 'auditoria'}), name='ti-auditoria'),
    path('usuarios/estatisticas/', views.TIUserViewSet.as_view({'get': 'estatisticas'}), name='ti-estatisticas'),
    
    # API de Gerenciamento de Usuários Supabase
    path('supabase/roles/', api_users.get_available_roles, name='supabase-roles'),
    path('supabase/users/', api_users.list_users, name='supabase-users-list'),
    path('supabase/users/create/', api_users.create_user, name='supabase-users-create'),
    path('supabase/users/<str:user_id>/', api_users.get_user_profile, name='supabase-user-detail'),
    path('supabase/users/<str:user_id>/role/', api_users.update_user_role, name='supabase-user-role'),
    path('supabase/users/<str:user_id>/delete/', api_users.delete_user, name='supabase-user-delete'),
    path('supabase/sync/', api_users.sync_all_users, name='supabase-sync'),
]

from django.urls import path
from . import views, api_views

app_name = 'produtos'

urlpatterns = [
    # Dashboard
    path('', views.dashboard_produtos, name='dashboard'),
    
    # Produtos
    path('produtos/', views.produto_list, name='produto_list'),
    path('produtos/novo/', views.produto_create, name='produto_create'),
    path('produtos/<int:pk>/', views.produto_detail, name='produto_detail'),
    
    # Categorias
    path('categorias/', views.categoria_list, name='categoria_list'),
    
    # Inutilizações
    path('inutilizados/', views.produto_inutilizado_list, name='produto_inutilizado_list'),
    path('inutilizar/', views.criar_auto_inutilizacao, name='criar_auto_inutilizacao'),
    
    # Preços
    path('precos/', views.registro_precos, name='registro_precos'),
    
    # APIs Legadas
    path('api/produtos/search/', views.api_produtos_search, name='api_produtos_search'),
    path('api/produtos/<int:produto_id>/', views.api_produto_info, name='api_produto_info'),
    path('api/produtos/buscar-por-codigo/<str:codigo_barras>/', api_views.api_produto_por_codigo_barras, name='api_produto_por_codigo_barras'),
    path('api/produtos/buscar-externo/<str:codigo_barras>/', api_views.api_produto_externo, name='api_produto_externo'),
    
    # APIs de Código de Barras (Novas)
    path('api/barcode/<str:codigo_barras>/', api_views.BarcodeAPIView.as_view(), name='api_barcode'),
    path('api/produtos/criar/', api_views.ProdutoCreateAPIView.as_view(), name='api_produto_criar'),
]
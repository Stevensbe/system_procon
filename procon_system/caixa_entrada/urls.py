from django.urls import path
from . import views

app_name = 'caixa_entrada'

urlpatterns = [
    # === CAIXAS PRINCIPAIS ===
    path('', views.caixa_entrada_view, name='caixa_entrada'),
    path('pessoal/', views.caixa_pessoal_view, name='caixa_pessoal'),
    path('setor/', views.caixa_setor_view, name='caixa_setor'),
    path('notificados/', views.caixa_notificados_view, name='caixa_notificados'),
    
    # === AÇÕES DE DOCUMENTOS ===
    path('documento/<uuid:documento_id>/', views.documento_detail, name='documento_detail'),
    path('documento/<uuid:documento_id>/marcar-lido/', views.marcar_como_lido, name='marcar_como_lido'),
    path('documento/<uuid:documento_id>/encaminhar/', views.encaminhar_documento, name='encaminhar_documento'),
    path('documento/<uuid:documento_id>/arquivar/', views.arquivar_documento, name='arquivar_documento'),
    
    # === ADMINISTRAÇÃO ===
    path('admin/permissoes/', views.gerenciar_permissoes_view, name='gerenciar_permissoes'),
    path('admin/acesso-especial/', views.gerenciar_acesso_especial_view, name='gerenciar_acesso_especial'),
    
    # === APIs ===
    path('api/documentos/', views.CaixaEntradaViewSet.as_view({'get': 'list', 'post': 'create'}), name='api_documentos'),
    path('api/documentos/<uuid:pk>/', views.CaixaEntradaViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='api_documento_detail'),
    path('api/anexos/', views.AnexoCaixaEntradaViewSet.as_view({'get': 'list', 'post': 'create'}), name='api_anexos'),
    path('api/historico/', views.HistoricoCaixaEntradaViewSet.as_view({'get': 'list'}), name='api_historico'),
    path('api/configuracao/', views.ConfiguracaoCaixaEntradaViewSet.as_view({'get': 'retrieve', 'put': 'update'}), name='api_configuracao'),
    
    # === APIs PÚBLICAS ===
    path('api/criar-documento/', views.CriarDocumentoAPIView.as_view(), name='api_criar_documento'),
    path('api/consultar-documento/', views.ConsultarDocumentoAPIView.as_view(), name='api_consultar_documento'),
    path('api/estatisticas/', views.EstatisticasAPIView.as_view(), name='api_estatisticas'),
]

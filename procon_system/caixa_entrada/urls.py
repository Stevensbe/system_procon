from django.urls import path
from . import views

app_name = 'caixa_entrada'

urlpatterns = [
    # === CAIXAS PRINCIPAIS ===
    path('', views.caixa_entrada_view, name='caixa_entrada'),
    path('pessoal/', views.caixa_pessoal_view, name='caixa_pessoal'),
    path('painel/', views.painel_gerencial_view, name='painel_gerencial'),
    path('setor/', views.caixa_setor_view, name='caixa_setor'),
    path('notificados/', views.caixa_notificados_view, name='caixa_notificados'),

    # === ACOES DE DOCUMENTOS ===
    path('documento/<uuid:documento_id>/', views.documento_detail, name='documento_detail'),
    path('documento/<uuid:documento_id>/marcar-lido/', views.marcar_como_lido, name='marcar_como_lido'),
    path('documento/<uuid:documento_id>/encaminhar/', views.encaminhar_documento, name='encaminhar_documento'),
    path('documento/<uuid:documento_id>/arquivar/', views.arquivar_documento, name='arquivar_documento'),

    # === ADMINISTRACAO ===
    path('admin/permissoes/', views.gerenciar_permissoes_view, name='gerenciar_permissoes'),
    path('admin/acesso-especial/', views.gerenciar_acesso_especial_view, name='gerenciar_acesso_especial'),

    # === APIs ===
    path('api/documentos/', views.CaixaEntradaViewSet.as_view({'get': 'list', 'post': 'create'}), name='api_documentos'),
    path('api/painel-gerencial/', views.PainelGerencialAPIView.as_view(), name='api_painel_gerencial'),
    path('api/documentos/<uuid:pk>/', views.CaixaEntradaViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='api_documento_detail'),
    path('api/documentos/<uuid:pk>/marcar_lido/', views.CaixaEntradaViewSet.as_view({'post': 'marcar_lido'}), name='api_documento_marcar_lido'),
    path('api/documentos/<uuid:pk>/encaminhar/', views.CaixaEntradaViewSet.as_view({'post': 'encaminhar'}), name='api_documento_encaminhar'),
    path('api/destinatarios/', views.CaixaEntradaViewSet.as_view({'get': 'destinatarios'}), name='api_destinatarios'),
    path('api/documentos/<uuid:pk>/arquivar/', views.CaixaEntradaViewSet.as_view({'post': 'arquivar'}), name='api_documento_arquivar'),
    path('api/anexos/', views.AnexoCaixaEntradaViewSet.as_view({'get': 'list', 'post': 'create'}), name='api_anexos'),
    path('api/historico/', views.HistoricoCaixaEntradaViewSet.as_view({'get': 'list'}), name='api_historico'),
    path('api/configuracao/', views.ConfiguracaoCaixaEntradaViewSet.as_view({'get': 'retrieve', 'put': 'update'}), name='api_configuracao'),

    # === APIs PUBLICAS ===
    path('api/criar-documento/', views.CriarDocumentoAPIView.as_view(), name='api_criar_documento'),
    path('api/consultar-documento/', views.ConsultarDocumentoAPIView.as_view(), name='api_consultar_documento'),
    path('api/estatisticas/', views.EstatisticasAPIView.as_view(), name='api_estatisticas'),
]

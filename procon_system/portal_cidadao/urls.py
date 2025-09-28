from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'portal_cidadao'

# API Router (para futuras implementações)
router = DefaultRouter()

urlpatterns = [
    # === PÁGINAS PRINCIPAIS ===
    path('', views.home_view, name='home'),
    path('sobre/', views.sobre_view, name='sobre'),
    path('contato/', views.contato_view, name='contato'),
    
    # === CONTEÚDO INFORMATIVO ===
    path('conteudo/', views.lista_conteudo, name='lista_conteudo'),
    path('conteudo/categoria/<int:categoria_id>/', views.conteudo_por_categoria, name='conteudo_por_categoria'),
    path('conteudo/<slug:slug>/', views.detalhe_conteudo, name='detalhe_conteudo'),
    
    # === PERGUNTAS FREQUENTES ===
    path('faq/', views.faq_view, name='faq'),
    path('faq/categoria/<int:categoria_id>/', views.faq_categoria, name='faq_categoria'),
    
    # === FORMULÁRIOS ===
    path('formularios/', views.lista_formularios, name='lista_formularios'),
    path('formularios/download/<int:formulario_id>/', views.download_formulario, name='download_formulario'),
    
    # === CONSULTA PÚBLICA ===
    path('consulta/', views.consulta_publica, name='consulta_publica'),
    path('consulta/resultado/', views.resultado_consulta, name='resultado_consulta'),
    
    # === PETICIONAMENTO ONLINE ===
    path('peticionar/', views.nova_peticao_cidadao, name='nova_peticao_cidadao'),
    path('peticionar/sucesso/', views.peticao_sucesso, name='peticao_sucesso'),
    path('peticionar/sucesso/<str:numero_peticao>/', views.peticao_sucesso, name='peticao_sucesso_numero'),
    path('consultar-peticao/', views.consultar_peticao, name='consultar_peticao'),
    
    # === DENÚNCIA/RECLAMAÇÃO ===
    path('denuncia/', views.nova_denuncia, name='nova_denuncia'),
    path('reclamacao/', views.nova_reclamacao, name='nova_reclamacao'),
    
    # === ORIENTAÇÕES ===
    path('orientacoes/', views.orientacoes_view, name='orientacoes'),
    path('orientacoes/<slug:slug>/', views.detalhe_orientacao, name='detalhe_orientacao'),
    
    # === APIs ===
    path('api/denuncia/', views.DenunciaCidadaoAPIView.as_view(), name='api_denuncia'),
    path('api/peticao-juridica/', views.PeticaoJuridicaAPIView.as_view(), name='api_peticao_juridica'),
    path('api/tipos-peticao/', views.TiposPeticaoPortalAPIView.as_view(), name='api_tipos_peticao'),
    path('api/acompanhar-processo/', views.AcompanhamentoProcessoAPIView.as_view(), name='api_acompanhar_processo'),
    
    # === PORTAL REACT ===
    path('react/', views.react_portal_view, name='react_portal'),
    
    # === ROUTER ===
    path('', include(router.urls)),
]
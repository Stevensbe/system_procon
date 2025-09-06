from django.urls import path
from . import views

app_name = 'multas'

urlpatterns = [
    # Empresa
    path('empresa/', views.EmpresaList.as_view(), name='listar_empresa'),
    path('empresa/add/', views.EmpresaCreate.as_view(), name='criar_empresa'),
    path('empresa/<int:pk>/edit/', views.EmpresaUpdate.as_view(), name='editar_empresa'),
    path('empresa/<int:pk>/delete/', views.EmpresaDelete.as_view(), name='excluir_empresa'),

    # Departamento
    path('departamento/', views.DepartamentoList.as_view(), name='listar_departamento'),
    path('departamento/add/', views.DepartamentoCreate.as_view(), name='criar_departamento'),
    path('departamento/<int:pk>/edit/', views.DepartamentoUpdate.as_view(), name='editar_departamento'),
    path('departamento/<int:pk>/delete/', views.DepartamentoDelete.as_view(), name='excluir_departamento'),

    # Multa
    path('multa/', views.MultaList.as_view(), name='listar_multa'),
    path('multa/add/', views.MultaCreate.as_view(), name='criar_multa'),
    path('multa/<int:pk>/edit/', views.MultaUpdate.as_view(), name='editar_multa'),
    path('multa/<int:pk>/delete/', views.MultaDelete.as_view(), name='excluir_multa'),

    # Cobranca
    path('cobranca/', views.CobrancaList.as_view(), name='listar_cobranca'),
    path('cobranca/add/', views.CobrancaCreate.as_view(), name='criar_cobranca'),
    path('cobranca/<int:pk>/edit/', views.CobrancaUpdate.as_view(), name='editar_cobranca'),
    path('cobranca/<int:pk>/delete/', views.CobrancaDelete.as_view(), name='excluir_cobranca'),

    # Peticao
    path('peticao/', views.PeticaoList.as_view(), name='listar_peticao'),
    path('peticao/add/', views.PeticaoCreate.as_view(), name='criar_peticao'),
    path('peticao/<int:pk>/edit/', views.PeticaoUpdate.as_view(), name='editar_peticao'),
    path('peticao/<int:pk>/delete/', views.PeticaoDelete.as_view(), name='excluir_peticao'),

    # Recurso
    path('recurso/', views.RecursoList.as_view(), name='listar_recurso'),
    path('recurso/add/', views.RecursoCreate.as_view(), name='criar_recurso'),
    path('recurso/<int:pk>/edit/', views.RecursoUpdate.as_view(), name='editar_recurso'),
    path('recurso/<int:pk>/delete/', views.RecursoDelete.as_view(), name='excluir_recurso'),

    # Analise
    path('analise/', views.AnaliseList.as_view(), name='listar_analise'),
    path('analise/add/', views.AnaliseCreate.as_view(), name='criar_analise'),
    path('analise/<int:pk>/edit/', views.AnaliseUpdate.as_view(), name='editar_analise'),
    path('analise/<int:pk>/delete/', views.AnaliseDelete.as_view(), name='excluir_analise'),

    # Configuracao
    path('configuracao/', views.ConfiguracaoList.as_view(), name='listar_configuracao'),
    path('configuracao/add/', views.ConfiguracaoCreate.as_view(), name='criar_configuracao'),
    path('configuracao/<int:pk>/edit/', views.ConfiguracaoUpdate.as_view(), name='editar_configuracao'),
    path('configuracao/<int:pk>/delete/', views.ConfiguracaoDelete.as_view(), name='excluir_configuracao'),
]

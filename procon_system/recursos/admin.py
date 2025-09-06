from django.contrib import admin
from .models import (
    TipoRecurso, Recurso, MovimentacaoRecurso, ModeloDecisao,
    PrazoRecurso, ComissaoJulgamento, SessaoJulgamento
)


@admin.register(TipoRecurso)
class TipoRecursoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'codigo', 'prazo_dias', 'permite_segunda_instancia', 'ativo', 'ordem']
    list_filter = ['ativo', 'permite_segunda_instancia']
    search_fields = ['nome', 'codigo', 'descricao']
    ordering = ['ordem', 'nome']
    list_editable = ['ativo', 'ordem']


@admin.register(Recurso)
class RecursoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_protocolo', 'requerente_nome', 'tipo_recurso', 'status', 
        'data_protocolo', 'data_limite_analise', 'instancia'
    ]
    list_filter = [
        'status', 'tipo_recurso', 'instancia', 'requerente_tipo', 
        'tem_advogado', 'data_protocolo', 'data_limite_analise'
    ]
    search_fields = [
        'numero_protocolo', 'numero_processo', 'numero_auto', 
        'requerente_nome', 'requerente_documento', 'assunto'
    ]
    readonly_fields = ['data_protocolo']
    date_hierarchy = 'data_protocolo'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_protocolo', 'tipo_recurso', 'instancia', 'numero_processo', 'numero_auto')
        }),
        ('Requerente', {
            'fields': (
                'requerente_nome', 'requerente_tipo', 'requerente_documento', 
                'requerente_endereco', 'requerente_telefone', 'requerente_email'
            )
        }),
        ('Representação', {
            'fields': ('tem_advogado', 'advogado_nome', 'advogado_oab', 'procuracao_anexada'),
            'classes': ('collapse',)
        }),
        ('Datas e Prazos', {
            'fields': ('data_protocolo', 'data_limite_analise', 'data_julgamento', 'data_decisao', 'data_parecer')
        }),
        ('Petição', {
            'fields': ('assunto', 'fundamentacao', 'pedido', 'valor_causa')
        }),
        ('Documentos', {
            'fields': ('peticao_inicial', 'documentos_complementares'),
            'classes': ('collapse',)
        }),
        ('Status e Decisão', {
            'fields': (
                'status', 'decisao', 'fundamentacao_decisao', 'relator', 
                'parecer_tecnico', 'recurso_hierarquico'
            )
        }),
    )


@admin.register(MovimentacaoRecurso)
class MovimentacaoRecursoAdmin(admin.ModelAdmin):
    list_display = ['recurso', 'tipo_movimentacao', 'data_movimentacao', 'responsavel']
    list_filter = ['tipo_movimentacao', 'data_movimentacao']
    search_fields = ['recurso__numero_protocolo', 'descricao']
    date_hierarchy = 'data_movimentacao'
    readonly_fields = ['data_movimentacao']


@admin.register(ModeloDecisao)
class ModeloDecisaoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo_recurso', 'tipo_decisao', 'ativo']
    list_filter = ['tipo_recurso', 'tipo_decisao', 'ativo']
    search_fields = ['nome', 'template_decisao']
    readonly_fields = []


@admin.register(PrazoRecurso)
class PrazoRecursoAdmin(admin.ModelAdmin):
    list_display = ['recurso', 'prazo_analise', 'data_inicio_prazo', 'data_limite_prazo', 'dias_restantes']
    list_filter = ['data_inicio_prazo', 'data_limite_prazo']
    search_fields = ['recurso__numero_protocolo', 'motivo_suspensao']
    readonly_fields = ['dias_restantes']


@admin.register(ComissaoJulgamento)
class ComissaoJulgamentoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'presidente', 'tipo_instancia', 'ativa']
    list_filter = ['tipo_instancia', 'ativa']
    search_fields = ['nome', 'presidente', 'membros']
    readonly_fields = []


@admin.register(SessaoJulgamento)
class SessaoJulgamentoAdmin(admin.ModelAdmin):
    list_display = ['comissao', 'numero_sessao', 'data_sessao', 'local_sessao', 'realizada']
    list_filter = ['comissao', 'data_sessao', 'realizada', 'publicada']
    search_fields = ['comissao__nome', 'numero_sessao', 'local_sessao']
    date_hierarchy = 'data_sessao'

from django.contrib import admin
from .models import (
    TipoProtocolo, StatusProtocolo, Protocolo, DocumentoProtocolo,
    TramitacaoProtocolo, AlertaProtocolo
)


@admin.register(TipoProtocolo)
class TipoProtocoloAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo', 'prazo_padrao', 'ativo', 'data_criacao']
    list_filter = ['tipo', 'ativo', 'data_criacao']
    search_fields = ['nome', 'descricao']
    ordering = ['nome']


@admin.register(StatusProtocolo)
class StatusProtocoloAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cor', 'ordem', 'ativo']
    list_filter = ['ativo']
    search_fields = ['nome', 'descricao']
    ordering = ['ordem']


@admin.register(Protocolo)
class ProtocoloAdmin(admin.ModelAdmin):
    list_display = [
        'numero', 'tipo_protocolo', 'assunto', 'prioridade', 'status',
        'responsavel_atual', 'data_abertura', 'data_limite', 'esta_atrasado'
    ]
    list_filter = [
        'tipo_protocolo', 'status', 'prioridade', 'ativo',
        'data_abertura', 'data_limite'
    ]
    search_fields = ['numero', 'assunto', 'descricao']
    readonly_fields = ['data_abertura', 'esta_atrasado', 'dias_restantes']
    ordering = ['-data_abertura']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('numero', 'tipo_protocolo', 'assunto', 'descricao', 'prioridade')
        }),
        ('Status e Responsabilidade', {
            'fields': ('status', 'responsavel_atual')
        }),
        ('Prazos', {
            'fields': ('data_abertura', 'data_limite', 'data_conclusao')
        }),
        ('Controle', {
            'fields': ('criado_por', 'ativo', 'observacoes', 'tags')
        }),
        ('Propriedades Calculadas', {
            'fields': ('esta_atrasado', 'dias_restantes'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DocumentoProtocolo)
class DocumentoProtocoloAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'protocolo', 'tipo', 'tamanho', 'extensao',
        'enviado_por', 'data_upload', 'indexado'
    ]
    list_filter = ['tipo', 'indexado', 'data_upload']
    search_fields = ['titulo', 'descricao', 'protocolo__numero']
    readonly_fields = ['tamanho', 'extensao', 'data_upload']
    ordering = ['-data_upload']


@admin.register(TramitacaoProtocolo)
class TramitacaoProtocoloAdmin(admin.ModelAdmin):
    list_display = [
        'protocolo', 'responsavel_anterior',
        'responsavel_novo', 'tramitado_por', 'data_tramitacao'
    ]
    list_filter = ['data_tramitacao']
    search_fields = ['protocolo__numero', 'observacoes']
    readonly_fields = ['data_tramitacao']
    ordering = ['-data_tramitacao']


@admin.register(AlertaProtocolo)
class AlertaProtocoloAdmin(admin.ModelAdmin):
    list_display = [
        'protocolo', 'tipo', 'titulo',
        'criado_em', 'data_leitura', 'lido_por'
    ]
    list_filter = ['tipo', 'criado_em']
    search_fields = ['titulo', 'mensagem', 'protocolo__numero']
    readonly_fields = ['criado_em']
    ordering = ['-criado_em']

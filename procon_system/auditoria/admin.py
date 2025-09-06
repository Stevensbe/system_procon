#!/usr/bin/env python
"""
Admin para o módulo de auditoria
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    TipoEvento, LogSistema, AuditoriaAlteracao, SessaoUsuario,
    AcessoRecurso, BackupLog, LogSeguranca
)


@admin.register(TipoEvento)
class TipoEventoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nome', 'categoria', 'nivel_criticidade', 'ativo']
    list_filter = ['categoria', 'nivel_criticidade', 'ativo']
    search_fields = ['codigo', 'nome', 'descricao']
    ordering = ['categoria', 'nome']
    readonly_fields = ['codigo']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('codigo', 'nome', 'descricao')
        }),
        ('Classificação', {
            'fields': ('categoria', 'nivel_criticidade')
        }),
        ('Status', {
            'fields': ('ativo',)
        }),
    )


@admin.register(LogSistema)
class LogSistemaAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'nivel', 'acao', 'usuario', 'ip_origem', 
        'sucesso', 'duracao_ms'
    ]
    list_filter = [
        'nivel', 'sucesso', 'tipo_evento__categoria', 'timestamp'
    ]
    search_fields = ['acao', 'descricao', 'usuario', 'ip_origem']
    readonly_fields = [
        'timestamp', 'tipo_evento', 'nivel', 'acao', 'descricao',
        'usuario', 'ip_origem', 'user_agent', 'sucesso', 'duracao_ms'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('timestamp', 'tipo_evento', 'nivel', 'acao', 'descricao')
        }),
        ('Usuário e Origem', {
            'fields': ('usuario', 'ip_origem', 'user_agent')
        }),
        ('Performance', {
            'fields': ('duracao_ms', 'sucesso')
        }),
        ('Detalhes Técnicos', {
            'fields': ('detalhes', 'dados_anteriores', 'dados_posteriores'),
            'classes': ('collapse',)
        }),
        ('Contexto', {
            'fields': ('modulo', 'funcao', 'linha_codigo', 'session_key'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(AuditoriaAlteracao)
class AuditoriaAlteracaoAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'acao', 'usuario', 'content_type', 'object_repr'
    ]
    list_filter = ['acao', 'content_type', 'timestamp']
    search_fields = ['usuario', 'object_repr', 'acao']
    readonly_fields = [
        'timestamp', 'content_type', 'object_id', 'object_repr',
        'acao', 'usuario', 'campos_alterados', 'valores_anteriores', 'valores_novos'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('timestamp', 'acao', 'usuario')
        }),
        ('Objeto Alterado', {
            'fields': ('content_type', 'object_id', 'object_repr')
        }),
        ('Alterações', {
            'fields': ('campos_alterados', 'valores_anteriores', 'valores_novos')
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SessaoUsuario)
class SessaoUsuarioAdmin(admin.ModelAdmin):
    list_display = [
        'usuario', 'ip_login', 'data_login', 'ultima_atividade', 
        'ativa', 'duracao_sessao_display'
    ]
    list_filter = ['ativa', 'tipo_logout', 'data_login']
    search_fields = ['usuario', 'ip_login']
    readonly_fields = [
        'usuario', 'ip_login', 'user_agent_login', 'data_login', 
        'data_logout', 'ultima_atividade', 'duracao_sessao'
    ]
    date_hierarchy = 'data_login'
    ordering = ['-data_login']
    
    fieldsets = (
        ('Informações da Sessão', {
            'fields': ('usuario', 'ip_login', 'user_agent_login')
        }),
        ('Tempo', {
            'fields': ('data_login', 'data_logout', 'ultima_atividade', 'duracao_sessao')
        }),
        ('Status', {
            'fields': ('ativa', 'tipo_logout', 'total_requisicoes')
        }),
    )
    
    def duracao_sessao_display(self, obj):
        if obj.duracao_sessao:
            minutos = int(obj.duracao_sessao // 60)
            segundos = int(obj.duracao_sessao % 60)
            return f"{minutos}m {segundos}s"
        return "-"
    duracao_sessao_display.short_description = "Duração"
    
    def has_add_permission(self, request):
        return False


@admin.register(AcessoRecurso)
class AcessoRecursoAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'usuario', 'recurso', 'acao', 'metodo_http',
        'codigo_resposta', 'tempo_resposta', 'ip_origem'
    ]
    list_filter = [
        'recurso', 'acao', 'metodo_http', 'codigo_resposta', 'timestamp'
    ]
    search_fields = ['usuario', 'recurso', 'url_completa', 'ip_origem']
    readonly_fields = [
        'timestamp', 'usuario', 'recurso', 'acao', 'metodo_http',
        'url_completa', 'codigo_resposta', 'tempo_resposta', 'ip_origem',
        'user_agent'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('timestamp', 'usuario', 'recurso', 'acao')
        }),
        ('Requisição', {
            'fields': ('metodo_http', 'url_completa', 'codigo_resposta', 'tempo_resposta')
        }),
        ('Origem', {
            'fields': ('ip_origem', 'user_agent')
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(BackupLog)
class BackupLogAdmin(admin.ModelAdmin):
    list_display = [
        'data_inicio', 'nome_backup', 'tipo_backup', 'status', 'tamanho_formatado',
        'duracao', 'executado_por'
    ]
    list_filter = ['tipo_backup', 'status', 'data_inicio', 'sucesso']
    search_fields = ['nome_backup', 'local_armazenamento', 'executado_por']
    readonly_fields = [
        'data_inicio', 'data_fim', 'tipo_backup', 'status', 'tamanho_backup',
        'duracao', 'local_armazenamento', 'erro_detalhes'
    ]
    date_hierarchy = 'data_inicio'
    ordering = ['-data_inicio']
    
    fieldsets = (
        ('Informações do Backup', {
            'fields': ('nome_backup', 'tipo_backup', 'status', 'executado_por')
        }),
        ('Execução', {
            'fields': ('data_inicio', 'data_fim', 'duracao', 'progresso_percentual')
        }),
        ('Dados', {
            'fields': ('tamanho_backup', 'quantidade_arquivos', 'local_armazenamento')
        }),
        ('Resultado', {
            'fields': ('sucesso', 'erro_detalhes', 'hash_verificacao')
        }),
        ('Configuração', {
            'fields': ('automatico',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        return False


@admin.register(LogSeguranca)
class LogSegurancaAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'tipo_evento', 'nivel_severidade', 'usuario',
        'ip_origem', 'bloqueado', 'acao_tomada'
    ]
    list_filter = [
        'tipo_evento', 'nivel_severidade', 'bloqueado', 'timestamp'
    ]
    search_fields = ['descricao', 'usuario', 'ip_origem', 'acao_tomada']
    readonly_fields = [
        'timestamp', 'tipo_evento', 'ip_origem', 'descricao',
        'usuario', 'nivel_severidade', 'bloqueado', 'acao_tomada',
        'detalhes_tecnicos'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('timestamp', 'tipo_evento', 'descricao')
        }),
        ('Origem', {
            'fields': ('ip_origem', 'usuario')
        }),
        ('Segurança', {
            'fields': ('nivel_severidade', 'bloqueado', 'acao_tomada')
        }),
        ('Detalhes Técnicos', {
            'fields': ('detalhes_tecnicos',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

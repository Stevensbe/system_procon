from django.contrib import admin
from .models import (
    TipoNotificacao,
    Notificacao,
    PreferenciaNotificacao,
    LogNotificacao,
    TemplateNotificacao
)

@admin.register(TipoNotificacao)
class TipoNotificacaoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'codigo', 'ativo', 'criado_em']
    list_filter = ['ativo', 'criado_em']
    search_fields = ['nome', 'codigo', 'descricao']
    ordering = ['nome']
    readonly_fields = ['criado_em', 'atualizado_em']

@admin.register(Notificacao)
class NotificacaoAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'destinatario', 'tipo', 'status', 'prioridade', 
        'criado_em', 'agendada_para'
    ]
    list_filter = ['status', 'prioridade', 'tipo', 'criado_em']
    search_fields = ['titulo', 'mensagem', 'destinatario__username']
    ordering = ['-criado_em']
    readonly_fields = ['id', 'criado_em', 'atualizado_em']
    date_hierarchy = 'criado_em'
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('id', 'tipo', 'destinatario', 'remetente', 'titulo', 'mensagem')
        }),
        ('Status e Prioridade', {
            'fields': ('status', 'prioridade', 'dados_extras')
        }),
        ('Agendamento', {
            'fields': ('agendada_para', 'enviada_em', 'lida_em')
        }),
        ('Referência', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        }),
    )

    actions = ['marcar_como_enviadas', 'marcar_como_lidas', 'cancelar_notificacoes']

    def marcar_como_enviadas(self, request, queryset):
        for notificacao in queryset:
            notificacao.marcar_como_enviada()
        self.message_user(request, f"{queryset.count()} notificação(ões) marcada(s) como enviada(s)")
    marcar_como_enviadas.short_description = "Marcar como enviadas"

    def marcar_como_lidas(self, request, queryset):
        for notificacao in queryset:
            notificacao.marcar_como_lida()
        self.message_user(request, f"{queryset.count()} notificação(ões) marcada(s) como lida(s)")
    marcar_como_lidas.short_description = "Marcar como lidas"

    def cancelar_notificacoes(self, request, queryset):
        queryset.update(status='cancelada')
        self.message_user(request, f"{queryset.count()} notificação(ões) cancelada(s)")
    cancelar_notificacoes.short_description = "Cancelar notificações"

@admin.register(PreferenciaNotificacao)
class PreferenciaNotificacaoAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'tipo_notificacao', 'canal', 'ativo', 'criado_em']
    list_filter = ['canal', 'ativo', 'tipo_notificacao', 'criado_em']
    search_fields = ['usuario__username', 'usuario__first_name', 'usuario__last_name']
    ordering = ['usuario', 'tipo_notificacao']
    readonly_fields = ['criado_em', 'atualizado_em']

@admin.register(LogNotificacao)
class LogNotificacaoAdmin(admin.ModelAdmin):
    list_display = ['notificacao', 'canal', 'resultado', 'tentativas', 'criado_em']
    list_filter = ['canal', 'resultado', 'criado_em']
    search_fields = ['notificacao__titulo', 'mensagem_erro']
    ordering = ['-criado_em']
    readonly_fields = ['criado_em']

@admin.register(TemplateNotificacao)
class TemplateNotificacaoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo_notificacao', 'canal', 'ativo', 'criado_em']
    list_filter = ['canal', 'ativo', 'tipo_notificacao', 'criado_em']
    search_fields = ['nome', 'assunto', 'conteudo']
    ordering = ['nome']
    readonly_fields = ['criado_em', 'atualizado_em']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'tipo_notificacao', 'canal', 'ativo')
        }),
        ('Conteúdo', {
            'fields': ('assunto', 'conteudo', 'variaveis')
        }),
        ('Timestamps', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        }),
    )
from django.contrib import admin
from .models import DashboardConfig, DashboardCache, DashboardAlerta, DashboardAtividade


@admin.register(DashboardConfig)
class DashboardConfigAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'tema', 'atualizacao_automatica', 'intervalo_atualizacao', 'alertas_ativos']
    list_filter = ['tema', 'atualizacao_automatica', 'alertas_ativos']
    search_fields = ['usuario__username', 'usuario__email']


@admin.register(DashboardCache)
class DashboardCacheAdmin(admin.ModelAdmin):
    list_display = ['chave', 'ativo', 'data_criacao', 'data_expiracao']
    list_filter = ['ativo', 'data_criacao']
    search_fields = ['chave']


@admin.register(DashboardAlerta)
class DashboardAlertaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'prioridade', 'usuario_destinatario', 'lido', 'ativo', 'data_criacao']
    list_filter = ['tipo', 'prioridade', 'lido', 'ativo', 'data_criacao']
    search_fields = ['titulo', 'mensagem', 'usuario_destinatario__username']
    readonly_fields = ['data_criacao']


@admin.register(DashboardAtividade)
class DashboardAtividadeAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'usuario', 'data_criacao']
    list_filter = ['tipo', 'data_criacao']
    search_fields = ['titulo', 'descricao', 'usuario__username']
    readonly_fields = ['data_criacao']
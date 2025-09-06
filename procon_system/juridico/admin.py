from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    AnalistaJuridico, ProcessoJuridico, AnaliseJuridica, RespostaJuridica,
    PrazoJuridico, DocumentoJuridico, HistoricoJuridico, ConfiguracaoJuridico
)


@admin.register(AnalistaJuridico)
class AnalistaJuridicoAdmin(admin.ModelAdmin):
    list_display = ['user', 'oab', 'especialidade', 'ativo', 'data_cadastro']
    list_filter = ['ativo', 'especialidade', 'data_cadastro']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'oab']
    ordering = ['user__first_name']
    
    fieldsets = (
        ('Informações do Usuário', {
            'fields': ('user', 'ativo')
        }),
        ('Informações Profissionais', {
            'fields': ('oab', 'especialidade')
        }),
    )


@admin.register(ProcessoJuridico)
class ProcessoJuridicoAdmin(admin.ModelAdmin):
    list_display = [
        'numero', 'parte', 'status', 'prioridade', 'analista', 
        'data_abertura', 'dias_restantes_display', 'esta_atrasado_display'
    ]
    list_filter = ['status', 'prioridade', 'analista', 'data_abertura']
    search_fields = ['numero', 'parte', 'assunto', 'empresa_cnpj']
    ordering = ['-data_abertura']
    readonly_fields = ['numero', 'data_abertura', 'data_modificacao', 'dias_restantes', 'esta_atrasado']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('numero', 'numero_peticao', 'parte', 'empresa_cnpj')
        }),
        ('Dados do Processo', {
            'fields': ('assunto', 'descricao', 'valor_causa')
        }),
        ('Controle', {
            'fields': ('status', 'prioridade', 'analista', 'data_limite', 'data_conclusao')
        }),
        ('Metadados', {
            'fields': ('criado_por', 'modificado_por', 'data_abertura', 'data_modificacao'),
            'classes': ('collapse',)
        }),
    )
    
    def dias_restantes_display(self, obj):
        if obj.dias_restantes is not None:
            if obj.dias_restantes < 0:
                return format_html('<span style="color: red;">{} dias atrasado</span>', abs(obj.dias_restantes))
            elif obj.dias_restantes <= 3:
                return format_html('<span style="color: orange;">{} dias</span>', obj.dias_restantes)
            else:
                return format_html('<span style="color: green;">{} dias</span>', obj.dias_restantes)
        return '-'
    dias_restantes_display.short_description = 'Dias Restantes'
    
    def esta_atrasado_display(self, obj):
        if obj.esta_atrasado:
            return format_html('<span style="color: red;">ATRASADO</span>')
        return format_html('<span style="color: green;">NO PRAZO</span>')
    esta_atrasado_display.short_description = 'Status do Prazo'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('analista', 'criado_por', 'modificado_por')


@admin.register(AnaliseJuridica)
class AnaliseJuridicaAdmin(admin.ModelAdmin):
    list_display = ['processo', 'tipo_analise', 'analista', 'data_analise']
    list_filter = ['tipo_analise', 'analista', 'data_analise']
    search_fields = ['processo__numero', 'processo__parte', 'fundamentacao']
    ordering = ['-data_analise']
    readonly_fields = ['data_analise', 'data_modificacao']
    
    fieldsets = (
        ('Processo', {
            'fields': ('processo', 'analista')
        }),
        ('Análise', {
            'fields': ('tipo_analise', 'fundamentacao', 'conclusao', 'recomendacoes')
        }),
        ('Controle', {
            'fields': ('data_analise', 'data_modificacao'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RespostaJuridica)
class RespostaJuridicaAdmin(admin.ModelAdmin):
    list_display = ['processo', 'tipo_resposta', 'titulo', 'analista', 'enviado', 'data_elaboracao']
    list_filter = ['tipo_resposta', 'enviado', 'analista', 'data_elaboracao']
    search_fields = ['processo__numero', 'titulo', 'conteudo']
    ordering = ['-data_elaboracao']
    readonly_fields = ['data_elaboracao']
    
    fieldsets = (
        ('Processo', {
            'fields': ('processo', 'analista')
        }),
        ('Resposta', {
            'fields': ('tipo_resposta', 'titulo', 'conteudo', 'fundamentacao_legal')
        }),
        ('Controle', {
            'fields': ('enviado', 'data_elaboracao', 'data_envio')
        }),
    )


@admin.register(PrazoJuridico)
class PrazoJuridicoAdmin(admin.ModelAdmin):
    list_display = [
        'processo', 'tipo_prazo', 'descricao', 'responsavel', 'status',
        'data_fim', 'dias_restantes_display', 'esta_vencido_display'
    ]
    list_filter = ['tipo_prazo', 'status', 'responsavel', 'data_fim']
    search_fields = ['processo__numero', 'descricao']
    ordering = ['data_fim']
    readonly_fields = ['dias_restantes', 'esta_vencido']
    
    fieldsets = (
        ('Processo', {
            'fields': ('processo', 'responsavel')
        }),
        ('Prazo', {
            'fields': ('tipo_prazo', 'descricao', 'data_inicio', 'data_fim')
        }),
        ('Controle', {
            'fields': ('status', 'data_cumprimento', 'notificar_antes', 'notificado')
        }),
        ('Informações', {
            'fields': ('dias_restantes', 'esta_vencido'),
            'classes': ('collapse',)
        }),
    )
    
    def dias_restantes_display(self, obj):
        if obj.dias_restantes < 0:
            return format_html('<span style="color: red;">{} dias atrasado</span>', abs(obj.dias_restantes))
        elif obj.dias_restantes <= 3:
            return format_html('<span style="color: orange;">{} dias</span>', obj.dias_restantes)
        else:
            return format_html('<span style="color: green;">{} dias</span>', obj.dias_restantes)
    dias_restantes_display.short_description = 'Dias Restantes'
    
    def esta_vencido_display(self, obj):
        if obj.esta_vencido:
            return format_html('<span style="color: red;">VENCIDO</span>')
        return format_html('<span style="color: green;">NO PRAZO</span>')
    esta_vencido_display.short_description = 'Status'


@admin.register(DocumentoJuridico)
class DocumentoJuridicoAdmin(admin.ModelAdmin):
    list_display = ['processo', 'tipo_documento', 'titulo', 'upload_por', 'data_upload', 'tamanho_formatado']
    list_filter = ['tipo_documento', 'upload_por', 'data_upload']
    search_fields = ['processo__numero', 'titulo', 'descricao']
    ordering = ['-data_upload']
    readonly_fields = ['nome_arquivo', 'tamanho_arquivo', 'data_upload']
    
    fieldsets = (
        ('Processo', {
            'fields': ('processo', 'upload_por')
        }),
        ('Documento', {
            'fields': ('tipo_documento', 'titulo', 'descricao', 'arquivo')
        }),
        ('Informações do Arquivo', {
            'fields': ('nome_arquivo', 'tamanho_arquivo', 'data_upload'),
            'classes': ('collapse',)
        }),
    )
    
    def tamanho_formatado(self, obj):
        if obj.tamanho_arquivo:
            if obj.tamanho_arquivo < 1024:
                return f"{obj.tamanho_arquivo} B"
            elif obj.tamanho_arquivo < 1024 * 1024:
                return f"{obj.tamanho_arquivo / 1024:.1f} KB"
            else:
                return f"{obj.tamanho_arquivo / (1024 * 1024):.1f} MB"
        return '-'
    tamanho_formatado.short_description = 'Tamanho'


@admin.register(HistoricoJuridico)
class HistoricoJuridicoAdmin(admin.ModelAdmin):
    list_display = ['processo', 'usuario', 'acao', 'data_alteracao']
    list_filter = ['acao', 'usuario', 'data_alteracao']
    search_fields = ['processo__numero', 'acao', 'descricao']
    ordering = ['-data_alteracao']
    readonly_fields = ['data_alteracao', 'ip_origem']
    
    fieldsets = (
        ('Processo', {
            'fields': ('processo', 'usuario')
        }),
        ('Alteração', {
            'fields': ('acao', 'descricao')
        }),
        ('Dados', {
            'fields': ('dados_anteriores', 'dados_novos'),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('data_alteracao', 'ip_origem'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ConfiguracaoJuridico)
class ConfiguracaoJuridicoAdmin(admin.ModelAdmin):
    list_display = ['data_configuracao', 'configurado_por', 'prazo_resposta_padrao', 'prazo_recurso_padrao']
    readonly_fields = ['data_configuracao', 'configurado_por']
    
    fieldsets = (
        ('Prazos Padrão', {
            'fields': ('prazo_resposta_padrao', 'prazo_recurso_padrao')
        }),
        ('Notificações', {
            'fields': ('notificar_prazos_vencendo', 'dias_antecedencia_notificacao')
        }),
        ('Upload de Documentos', {
            'fields': ('permitir_upload_documentos', 'tamanho_maximo_arquivo', 'tipos_arquivo_permitidos')
        }),
        ('Controle', {
            'fields': ('data_configuracao', 'configurado_por'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Se é uma nova configuração
            obj.configurado_por = request.user
        super().save_model(request, obj, form, change)


# === CUSTOMIZAÇÕES DO ADMIN ===

admin.site.site_header = "Administração do Sistema PROCON"
admin.site.site_title = "PROCON Admin"
admin.site.index_title = "Bem-vindo ao Sistema PROCON"

# Adicionar links rápidos no admin
class JuridicoAdminSite(admin.AdminSite):
    def get_app_list(self, request):
        app_list = super().get_app_list(request)
        
        # Adicionar estatísticas rápidas
        if request.user.is_superuser:
            app_list.append({
                'name': 'Estatísticas Jurídicas',
                'app_label': 'juridico_stats',
                'models': [
                    {
                        'name': 'Processos Atrasados',
                        'object_name': 'processos_atrasados',
                        'admin_url': '/admin/juridico/processojuridico/?status__exact=ABERTO',
                        'view_only': True,
                    },
                    {
                        'name': 'Prazos Vencendo',
                        'object_name': 'prazos_vencendo',
                        'admin_url': '/admin/juridico/prazojuridico/?status__exact=PENDENTE',
                        'view_only': True,
                    },
                ]
            })
        
        return app_list

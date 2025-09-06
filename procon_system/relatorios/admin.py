from django.contrib import admin
from django.utils.html import format_html
from .models import (
    TipoRelatorio, Relatorio, RelatorioAgendado, TemplateRelatorio,
    FiltroRelatorio, RelatorioCompartilhado, HistoricoRelatorio, ConfiguracaoRelatorio
)


@admin.register(TipoRelatorio)
class TipoRelatorioAdmin(admin.ModelAdmin):
    list_display = ['nome', 'modulo', 'ativo', 'data_criacao']
    list_filter = ['modulo', 'ativo']
    search_fields = ['nome', 'descricao']
    ordering = ['nome']


@admin.register(Relatorio)
class RelatorioAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'tipo_relatorio', 'formato', 'status', 'progresso',
        'solicitado_por', 'data_solicitacao', 'tempo_processamento'
    ]
    list_filter = ['tipo_relatorio', 'formato', 'status', 'data_solicitacao']
    search_fields = ['titulo', 'descricao', 'solicitado_por__username']
    readonly_fields = [
        'data_solicitacao', 'data_conclusao', 'tempo_processamento',
        'registros_processados', 'progresso'
    ]
    ordering = ['-data_solicitacao']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                'titulo',
                'descricao',
                ('tipo_relatorio', 'formato'),
                'solicitado_por'
            )
        }),
        ('Configuração', {
            'fields': (
                'parametros',
                'filtros'
            ),
            'classes': ('collapse',)
        }),
        ('Status e Controle', {
            'fields': (
                'status',
                'progresso',
                ('data_solicitacao', 'data_conclusao'),
                'tempo_processamento',
                'registros_processados'
            )
        }),
        ('Arquivo', {
            'fields': (
                'arquivo',
                'nome_arquivo',
                'tamanho_arquivo'
            ),
            'classes': ('collapse',)
        }),
        ('Erro', {
            'fields': (
                'erro_mensagem',
            ),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        return False  # Relatórios são criados via API


@admin.register(RelatorioAgendado)
class RelatorioAgendadoAdmin(admin.ModelAdmin):
    list_display = [
        'nome', 'tipo_relatorio', 'frequencia', 'status', 'ativo',
        'proxima_execucao', 'ultima_execucao', 'criado_por'
    ]
    list_filter = ['tipo_relatorio', 'frequencia', 'status', 'ativo', 'formato']
    search_fields = ['nome', 'descricao', 'criado_por__username']
    readonly_fields = ['data_criacao', 'data_modificacao', 'ultima_execucao']
    ordering = ['proxima_execucao']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                'nome',
                'descricao',
                ('tipo_relatorio', 'formato'),
                'criado_por'
            )
        }),
        ('Configuração', {
            'fields': (
                'parametros',
                'filtros'
            ),
            'classes': ('collapse',)
        }),
        ('Agendamento', {
            'fields': (
                'frequencia',
                'proxima_execucao',
                'ultima_execucao'
            )
        }),
        ('Status', {
            'fields': (
                'status',
                'ativo'
            )
        }),
        ('Controle', {
            'fields': (
                'data_criacao',
                'data_modificacao'
            ),
            'classes': ('collapse',)
        })
    )


@admin.register(TemplateRelatorio)
class TemplateRelatorioAdmin(admin.ModelAdmin):
    list_display = [
        'nome', 'tipo_relatorio', 'ativo', 'padrao', 'criado_por', 'data_criacao'
    ]
    list_filter = ['tipo_relatorio', 'ativo', 'padrao']
    search_fields = ['nome', 'descricao']
    ordering = ['nome']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                'nome',
                'descricao',
                'tipo_relatorio',
                'criado_por'
            )
        }),
        ('Configuração', {
            'fields': (
                'configuracao',
                'layout',
                'css'
            ),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': (
                'ativo',
                'padrao',
                'data_criacao'
            )
        })
    )


@admin.register(FiltroRelatorio)
class FiltroRelatorioAdmin(admin.ModelAdmin):
    list_display = [
        'nome', 'tipo_relatorio', 'tipo_filtro', 'campo', 'obrigatorio', 'ativo', 'ordem'
    ]
    list_filter = ['tipo_relatorio', 'tipo_filtro', 'obrigatorio', 'ativo']
    search_fields = ['nome', 'descricao', 'campo']
    ordering = ['tipo_relatorio', 'ordem']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                'nome',
                'descricao',
                'tipo_relatorio'
            )
        }),
        ('Configuração do Filtro', {
            'fields': (
                'tipo_filtro',
                'campo',
                'opcoes',
                'obrigatorio',
                'valor_padrao'
            )
        }),
        ('Controle', {
            'fields': (
                'ativo',
                'ordem'
            )
        })
    )


@admin.register(RelatorioCompartilhado)
class RelatorioCompartilhadoAdmin(admin.ModelAdmin):
    list_display = [
        'relatorio', 'compartilhado_por', 'compartilhado_com',
        'pode_visualizar', 'pode_baixar', 'pode_compartilhar',
        'data_compartilhamento', 'ativo'
    ]
    list_filter = ['pode_visualizar', 'pode_baixar', 'pode_compartilhar', 'ativo', 'data_compartilhamento']
    search_fields = [
        'relatorio__titulo', 'compartilhado_por__username', 'compartilhado_com__username'
    ]
    readonly_fields = ['data_compartilhamento']
    ordering = ['-data_compartilhamento']
    
    fieldsets = (
        ('Relatório e Usuários', {
            'fields': (
                'relatorio',
                'compartilhado_por',
                'compartilhado_com'
            )
        }),
        ('Permissões', {
            'fields': (
                'pode_visualizar',
                'pode_baixar',
                'pode_compartilhar'
            )
        }),
        ('Controle', {
            'fields': (
                'data_compartilhamento',
                'data_expiracao',
                'ativo'
            )
        })
    )


@admin.register(HistoricoRelatorio)
class HistoricoRelatorioAdmin(admin.ModelAdmin):
    list_display = [
        'relatorio', 'usuario', 'status', 'tempo_processamento',
        'registros_processados', 'data_execucao'
    ]
    list_filter = ['status', 'data_execucao']
    search_fields = ['relatorio__titulo', 'usuario__username']
    readonly_fields = ['data_execucao']
    ordering = ['-data_execucao']
    
    fieldsets = (
        ('Execução', {
            'fields': (
                'relatorio',
                'usuario',
                'status'
            )
        }),
        ('Métricas', {
            'fields': (
                'tempo_processamento',
                'registros_processados'
            )
        }),
        ('Erro', {
            'fields': (
                'erro_mensagem',
            ),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': (
                'data_execucao',
                'ip_origem'
            ),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        return False  # Histórico é criado automaticamente
    
    def has_change_permission(self, request, obj=None):
        return False  # Histórico não deve ser alterado


@admin.register(ConfiguracaoRelatorio)
class ConfiguracaoRelatorioAdmin(admin.ModelAdmin):
    list_display = [
        'max_relatorios_por_usuario', 'max_tamanho_arquivo', 'tempo_maximo_processamento',
        'formato_padrao', 'configurado_por', 'data_configuracao'
    ]
    readonly_fields = ['data_configuracao']
    
    fieldsets = (
        ('Limites', {
            'fields': (
                'max_relatorios_por_usuario',
                'max_tamanho_arquivo',
                'tempo_maximo_processamento'
            )
        }),
        ('Armazenamento', {
            'fields': (
                'dias_retencao_relatorios',
                'dias_retencao_agendados'
            )
        }),
        ('Notificações', {
            'fields': (
                'notificar_conclusao',
                'notificar_erro'
            )
        }),
        ('Formato', {
            'fields': (
                'formato_padrao',
                'compressao_arquivos'
            )
        }),
        ('Controle', {
            'fields': (
                'configurado_por',
                'data_configuracao'
            ),
            'classes': ('collapse',)
        })
    )
    
    def has_add_permission(self, request):
        # Permite apenas uma configuração
        return not ConfiguracaoRelatorio.objects.exists()
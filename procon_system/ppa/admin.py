from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ProcedimentoPreAdministrativo,
    MovimentacaoPPA,
    AnexoPPA,
    ParecerPPA
)


class MovimentacaoPPAInline(admin.TabularInline):
    model = MovimentacaoPPA
    extra = 1
    fields = ('data', 'hora', 'tipo_movimentacao', 'atendimento', 'usuario')
    readonly_fields = ('criado_em',)
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editando
            return self.readonly_fields + ('data', 'hora')
        return self.readonly_fields


class AnexoPPAInline(admin.TabularInline):
    model = AnexoPPA
    extra = 1
    fields = ('tipo_documento', 'numero_documento', 'arquivo', 'descricao', 'anexado_por')
    readonly_fields = ('data_anexacao',)


class ParecerPPAInline(admin.StackedInline):
    model = ParecerPPA
    extra = 0
    fields = (
        'numero_parecer',
        'titulo',
        'relatorio',
        'fundamentacao',
        'conclusao',
        'recomendacoes',
        'elaborado_por',
        'cargo_elaborador',
        'aprovado_por',
        'data_aprovacao',
    )
    readonly_fields = ('numero_parecer', 'criado_em', 'atualizado_em')


@admin.register(ProcedimentoPreAdministrativo)
class ProcedimentoPreAdministrativoAdmin(admin.ModelAdmin):
    list_display = (
        'numero',
        'interessado_display',
        'sigla',
        'status_badge',
        'analista_responsavel',
        'total_anexos_display',
        'prazo_analise_display',
        'criado_em',
    )
    
    list_filter = (
        'status',
        'decisao_final',
        'sigla',
        'analista_responsavel',
        'criado_em',
    )
    
    search_fields = (
        'numero',
        'interessado',
        'cnpj_interessado',
        'assunto',
    )
    
    readonly_fields = (
        'numero',
        'uuid',
        'criado_em',
        'atualizado_em',
        'total_anexos',
        'total_movimentacoes',
        'esta_no_prazo',
        'dias_ate_prazo',
    )
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero', 'uuid', 'sigla')
        }),
        ('Dados do Interessado', {
            'fields': (
                'interessado',
                'cnpj_interessado',
                'endereco_interessado',
                'assunto',
            )
        }),
        ('Responsáveis', {
            'fields': (
                'analista_responsavel',
                'supervisor',
                'criado_por',
            )
        }),
        ('Status e Decisão', {
            'fields': (
                'status',
                'decisao_final',
                'fundamentacao_decisao',
            )
        }),
        ('Prazos', {
            'fields': (
                'prazo_analise',
                'prazo_resposta',
                'data_conclusao',
                'esta_no_prazo',
                'dias_ate_prazo',
            )
        }),
        ('Observações', {
            'fields': (
                'observacoes',
                'observacoes_internas',
            ),
            'classes': ('collapse',)
        }),
        ('Estatísticas', {
            'fields': (
                'total_anexos',
                'total_movimentacoes',
                'criado_em',
                'atualizado_em',
            ),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [MovimentacaoPPAInline, AnexoPPAInline, ParecerPPAInline]
    
    def interessado_display(self, obj):
        """Exibe interessado truncado"""
        if len(obj.interessado) > 40:
            return f"{obj.interessado[:40]}..."
        return obj.interessado
    interessado_display.short_description = 'Interessado'
    
    def status_badge(self, obj):
        """Exibe status com badge colorido"""
        cores = {
            'criado': '#6c757d',
            'em_analise': '#007bff',
            'notificado': '#17a2b8',
            'aguardando_resposta': '#ffc107',
            'com_defesa': '#fd7e14',
            'parecer_elaborado': '#20c997',
            'concluido': '#28a745',
            'arquivado': '#dc3545',
        }
        cor = cores.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            cor,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def total_anexos_display(self, obj):
        """Exibe total de anexos com ícone"""
        total = obj.total_anexos
        if total == 0:
            return format_html('<span style="color: #dc3545;">📎 0</span>')
        elif total < 5:
            return format_html('<span style="color: #ffc107;">📎 {}</span>', total)
        else:
            return format_html('<span style="color: #28a745;">📎 {}</span>', total)
    total_anexos_display.short_description = 'Anexos'
    
    def prazo_analise_display(self, obj):
        """Exibe prazo de análise com indicador visual"""
        if not obj.prazo_analise:
            return format_html('<span style="color: #6c757d;">-</span>')
        
        if obj.esta_no_prazo:
            dias = obj.dias_ate_prazo
            if dias > 5:
                cor = '#28a745'
                icone = '✅'
            elif dias > 0:
                cor = '#ffc107'
                icone = '⚠️'
            else:
                cor = '#dc3545'
                icone = '🔴'
            return format_html(
                '<span style="color: {};">{} {} dias</span>',
                cor, icone, dias
            )
        else:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">🔴 Vencido</span>'
            )
    prazo_analise_display.short_description = 'Prazo'
    
    def save_model(self, request, obj, form, change):
        """Salva modelo e registra movimentação"""
        if not change:  # Novo objeto
            obj.criado_por = request.user
            if not obj.analista_responsavel:
                obj.analista_responsavel = request.user
        super().save_model(request, obj, form, change)
        
        # Registra movimentação
        if not change:
            MovimentacaoPPA.objects.create(
                ppa=obj,
                tipo_movimentacao='criacao',
                atendimento=f"PPA {obj.numero} criado por {request.user.get_full_name() or request.user.username}",
                usuario=request.user
            )


@admin.register(MovimentacaoPPA)
class MovimentacaoPPAAdmin(admin.ModelAdmin):
    list_display = (
        'ppa',
        'data',
        'hora',
        'tipo_movimentacao',
        'atendimento_truncado',
        'usuario',
    )
    
    list_filter = (
        'tipo_movimentacao',
        'data',
        'usuario',
    )
    
    search_fields = (
        'ppa__numero',
        'atendimento',
    )
    
    readonly_fields = ('criado_em',)
    
    def atendimento_truncado(self, obj):
        """Exibe atendimento truncado"""
        if len(obj.atendimento) > 60:
            return f"{obj.atendimento[:60]}..."
        return obj.atendimento
    atendimento_truncado.short_description = 'Atendimento'


@admin.register(AnexoPPA)
class AnexoPPAAdmin(admin.ModelAdmin):
    list_display = (
        'ppa',
        'tipo_documento',
        'numero_documento',
        'arquivo_display',
        'tamanho_arquivo',
        'anexado_por',
        'data_anexacao',
    )
    
    list_filter = (
        'tipo_documento',
        'data_anexacao',
        'anexado_por',
    )
    
    search_fields = (
        'ppa__numero',
        'numero_documento',
        'descricao',
    )
    
    readonly_fields = ('data_anexacao', 'tamanho_arquivo')
    
    def arquivo_display(self, obj):
        """Exibe ícone de arquivo"""
        if obj.arquivo:
            return format_html(
                '<a href="{}" target="_blank">📄 {}</a>',
                obj.arquivo.url,
                obj.nome_arquivo_original or 'Arquivo'
            )
        elif obj.documento_relacionado:
            return format_html('<span style="color: #007bff;">🔗 Documento Vinculado</span>')
        else:
            return format_html('<span style="color: #dc3545;">-</span>')
    arquivo_display.short_description = 'Arquivo'


@admin.register(ParecerPPA)
class ParecerPPAAdmin(admin.ModelAdmin):
    list_display = (
        'numero_parecer',
        'ppa',
        'titulo_truncado',
        'conclusao_badge',
        'elaborado_por',
        'aprovado_display',
        'criado_em',
    )
    
    list_filter = (
        'conclusao',
        'elaborado_por',
        'aprovado_por',
        'criado_em',
    )
    
    search_fields = (
        'numero_parecer',
        'ppa__numero',
        'titulo',
        'relatorio',
    )
    
    readonly_fields = ('numero_parecer', 'criado_em', 'atualizado_em')
    
    def titulo_truncado(self, obj):
        """Exibe título truncado"""
        if len(obj.titulo) > 50:
            return f"{obj.titulo[:50]}..."
        return obj.titulo
    titulo_truncado.short_description = 'Título'
    
    def conclusao_badge(self, obj):
        """Exibe conclusão com badge colorido"""
        cores = {
            'procedente': '#28a745',
            'improcedente': '#dc3545',
            'mais_informacoes': '#ffc107',
            'encaminhar': '#17a2b8',
        }
        cor = cores.get(obj.conclusao, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            cor,
            obj.get_conclusao_display()
        )
    conclusao_badge.short_description = 'Conclusão'
    
    def aprovado_display(self, obj):
        """Exibe status de aprovação"""
        if obj.aprovado_por:
            return format_html(
                '<span style="color: #28a745;">✅ {}</span>',
                obj.aprovado_por.get_full_name() or obj.aprovado_por.username
            )
        else:
            return format_html('<span style="color: #ffc107;">⏳ Pendente</span>')
    aprovado_display.short_description = 'Aprovação'


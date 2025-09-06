from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Financeiro, ConfiguracaoFinanceira, RegistroFinanceiro


@admin.register(Financeiro)
class FinanceiroAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'valor', 'tipo', 'data')
    search_fields = ('descricao',)
    list_filter = ('tipo', 'data')
    date_hierarchy = 'data'
    list_per_page = 20


@admin.register(ConfiguracaoFinanceira)
class ConfiguracaoFinanceiraAdmin(admin.ModelAdmin):
    list_display = ('nome', 'valor', 'ativo', 'data_criacao')
    search_fields = ('nome', 'descricao')
    list_filter = ('ativo', 'data_criacao')
    readonly_fields = ('data_criacao',)


@admin.register(RegistroFinanceiro)
class RegistroFinanceiroAdmin(admin.ModelAdmin):
    list_display = (
        'multa_link', 'empresa', 'valor_original', 'status_badge', 
        'data_vencimento', 'data_pagamento', 'dias_atraso'
    )
    list_filter = (
        'status', 'tipo_pagamento', 'data_vencimento', 
        'data_pagamento', 'criado_em'
    )
    search_fields = (
        'multa__id', 'multa__empresa__razao_social', 
        'multa__empresa__cnpj', 'numero_comprovante'
    )
    readonly_fields = (
        'multa_link', 'valor_total_com_encargos', 'dias_em_atraso', 
        'esta_vencida', 'criado_em', 'atualizado_em'
    )
    date_hierarchy = 'criado_em'
    list_per_page = 25
    
    fieldsets = (
        ('Informações da Multa', {
            'fields': ('multa', 'multa_link')
        }),
        ('Valores Financeiros', {
            'fields': (
                'valor_original', 'valor_juros', 'valor_multa_atraso', 
                'valor_desconto', 'valor_pago', 'valor_total_com_encargos'
            )
        }),
        ('Datas e Status', {
            'fields': (
                'status', 'data_vencimento', 'data_pagamento', 
                'dias_em_atraso', 'esta_vencida'
            )
        }),
        ('Dados do Pagamento', {
            'fields': (
                'tipo_pagamento', 'numero_comprovante', 
                'comprovante_pagamento'
            ),
            'classes': ('collapse',)
        }),
        ('Observações e Controle', {
            'fields': (
                'observacoes', 'criado_por', 'criado_em', 'atualizado_em'
            ),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['marcar_como_paga', 'recalcular_juros', 'gerar_relatorio']

    def multa_link(self, obj):
        if obj.multa:
            url = reverse('admin:multas_multa_change', args=[obj.multa.pk])
            return format_html('<a href="{}">#Multa {}</a>', url, obj.multa.id)
        return '-'
    multa_link.short_description = 'Multa'

    def empresa(self, obj):
        if obj.multa and obj.multa.empresa:
            return obj.multa.empresa.razao_social
        return '-'
    empresa.short_description = 'Empresa'

    def status_badge(self, obj):
        cores = {
            'pendente': '#FFA500',
            'paga': '#28A745', 
            'vencida': '#DC3545',
            'cancelada': '#6C757D',
            'contestada': '#007BFF',
            'parcelada': '#17A2B8'
        }
        cor = cores.get(obj.status, '#6C757D')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">{}</span>',
            cor, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def dias_atraso(self, obj):
        dias = obj.dias_em_atraso
        if dias > 0:
            return format_html('<span style="color: red; font-weight: bold;">{} dias</span>', dias)
        return '-'
    dias_atraso.short_description = 'Dias em Atraso'

    def marcar_como_paga(self, request, queryset):
        count = 0
        for registro in queryset.filter(status__in=['pendente', 'vencida']):
            registro.marcar_como_paga(
                valor_pago=registro.valor_total_com_encargos,
                observacoes=f'Marcado como pago pelo admin em {timezone.now().strftime("%d/%m/%Y %H:%M")}'
            )
            count += 1
        
        self.message_user(
            request, 
            f'{count} registro(s) marcado(s) como pago com sucesso.',
            level='success'
        )
    marcar_como_paga.short_description = 'Marcar como pago'

    def recalcular_juros(self, request, queryset):
        count = 0
        for registro in queryset.filter(status='vencida'):
            registro.calcular_juros_automatico()
            registro.save()
            count += 1
        
        self.message_user(
            request,
            f'Juros recalculados para {count} registro(s).',
            level='success'
        )
    recalcular_juros.short_description = 'Recalcular juros'

    def gerar_relatorio(self, request, queryset):
        # Implementar geração de relatório personalizado
        self.message_user(
            request,
            'Funcionalidade de relatório será implementada em breve.',
            level='info'
        )
    gerar_relatorio.short_description = 'Gerar relatório'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'multa', 'multa__empresa', 'multa__processo'
        )

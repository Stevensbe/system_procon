from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    ConfiguracaoCobranca, BoletoMulta, PagamentoMulta, 
    CobrancaMulta, TemplateCobranca, LogCobranca
)


@admin.register(ConfiguracaoCobranca)
class ConfiguracaoCobrancaAdmin(admin.ModelAdmin):
    list_display = ['beneficiario_nome', 'banco_nome', 'ativo', 'criado_em']
    list_filter = ['ativo', 'banco_nome']
    fieldsets = (
        ('Prazos', {
            'fields': ('prazo_vencimento_boleto', 'prazo_primeira_cobranca', 
                      'prazo_segunda_cobranca', 'prazo_terceira_cobranca')
        }),
        ('Juros e Multas', {
            'fields': ('taxa_juros_mensal', 'taxa_multa_atraso')
        }),
        ('Beneficiário', {
            'fields': ('beneficiario_nome', 'beneficiario_cnpj', 'beneficiario_endereco')
        }),
        ('Dados Bancários', {
            'fields': ('banco_codigo', 'banco_nome', 'agencia', 'conta', 'carteira')
        }),
        ('Configurações de Envio', {
            'fields': ('enviar_boleto_email', 'enviar_cobranca_sms')
        }),
        ('Controle', {
            'fields': ('ativo',),
            'classes': ('collapse',)
        })
    )


class PagamentoMultaInline(admin.TabularInline):
    model = PagamentoMulta
    extra = 0
    readonly_fields = ['numero_pagamento', 'data_pagamento', 'criado_em']
    fields = ['numero_pagamento', 'valor_pago', 'forma_pagamento', 'status', 'data_pagamento']


class CobrancaMultaInline(admin.TabularInline):
    model = CobrancaMulta
    extra = 0
    readonly_fields = ['data_agendamento', 'data_envio', 'tentativas']
    fields = ['tipo_cobranca', 'canal', 'status', 'data_agendamento', 'tentativas']


@admin.register(BoletoMulta)
class BoletoMultaAdmin(admin.ModelAdmin):
    list_display = ['numero_boleto', 'pagador_nome', 'valor_total', 'data_vencimento', 
                   'status_colored', 'data_emissao']
    list_filter = ['status', 'forma_pagamento', 'data_emissao', 'data_vencimento']
    search_fields = ['numero_boleto', 'pagador_nome', 'pagador_documento', 'multa__numero']
    readonly_fields = ['uuid', 'numero_boleto', 'nosso_numero', 'valor_total', 
                      'codigo_barras', 'linha_digitavel', 'tentativas_envio']
    inlines = [PagamentoMultaInline, CobrancaMultaInline]
    
    fieldsets = (
        ('Identificação', {
            'fields': ('uuid', 'numero_boleto', 'nosso_numero', 'multa')
        }),
        ('Pagador', {
            'fields': ('pagador_nome', 'pagador_documento', 'pagador_endereco',
                      'pagador_email', 'pagador_telefone')
        }),
        ('Valores', {
            'fields': ('valor_principal', 'valor_juros', 'valor_multa', 
                      'valor_desconto', 'valor_total')
        }),
        ('Datas', {
            'fields': ('data_emissao', 'data_vencimento', 'data_pagamento', 'data_envio')
        }),
        ('Status', {
            'fields': ('status', 'forma_pagamento')
        }),
        ('Códigos Bancários', {
            'fields': ('codigo_barras', 'linha_digitavel'),
            'classes': ('collapse',)
        }),
        ('PIX', {
            'fields': ('pix_codigo', 'pix_qr_code'),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('instrucoes', 'observacoes'),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('tentativas_envio', 'criado_por'),
            'classes': ('collapse',)
        })
    )
    
    def status_colored(self, obj):
        colors = {
            'pendente': 'orange',
            'enviado': 'blue',
            'pago': 'green',
            'vencido': 'red',
            'cancelado': 'gray',
            'protestado': 'darkred',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    
    actions = ['gerar_codigo_barras', 'gerar_pix', 'atualizar_valores_vencimento']
    
    def gerar_codigo_barras(self, request, queryset):
        for boleto in queryset:
            boleto.gerar_codigo_barras()
        self.message_user(request, f"Código de barras gerado para {queryset.count()} boletos.")
    gerar_codigo_barras.short_description = "Gerar código de barras"
    
    def gerar_pix(self, request, queryset):
        for boleto in queryset:
            boleto.gerar_pix()
        self.message_user(request, f"PIX gerado para {queryset.count()} boletos.")
    gerar_pix.short_description = "Gerar PIX"
    
    def atualizar_valores_vencimento(self, request, queryset):
        vencidos = queryset.filter(status='vencido')
        for boleto in vencidos:
            boleto.atualizar_valores_vencimento()
        self.message_user(request, f"Valores atualizados para {vencidos.count()} boletos vencidos.")
    atualizar_valores_vencimento.short_description = "Atualizar valores vencidos"


@admin.register(PagamentoMulta)
class PagamentoMultaAdmin(admin.ModelAdmin):
    list_display = ['numero_pagamento', 'boleto_numero', 'valor_pago', 
                   'forma_pagamento', 'status_colored', 'data_pagamento']
    list_filter = ['status', 'forma_pagamento', 'data_pagamento']
    search_fields = ['numero_pagamento', 'boleto__numero_boleto', 'boleto__pagador_nome']
    readonly_fields = ['uuid', 'numero_pagamento', 'data_confirmacao']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('uuid', 'numero_pagamento', 'boleto')
        }),
        ('Pagamento', {
            'fields': ('valor_pago', 'forma_pagamento', 'data_pagamento')
        }),
        ('Comprovante', {
            'fields': ('comprovante', 'numero_transacao')
        }),
        ('Status', {
            'fields': ('status', 'data_confirmacao', 'confirmado_por')
        }),
        ('Observações', {
            'fields': ('observacoes', 'motivo_rejeicao'),
            'classes': ('collapse',)
        })
    )
    
    def boleto_numero(self, obj):
        return obj.boleto.numero_boleto
    boleto_numero.short_description = 'Boleto'
    
    def status_colored(self, obj):
        colors = {
            'pendente': 'orange',
            'confirmado': 'green',
            'rejeitado': 'red',
            'estornado': 'darkred',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    
    actions = ['confirmar_pagamentos', 'rejeitar_pagamentos']
    
    def confirmar_pagamentos(self, request, queryset):
        pendentes = queryset.filter(status='pendente')
        for pagamento in pendentes:
            pagamento.confirmar_pagamento(request.user.username)
        self.message_user(request, f"{pendentes.count()} pagamentos confirmados.")
    confirmar_pagamentos.short_description = "Confirmar pagamentos"
    
    def rejeitar_pagamentos(self, request, queryset):
        pendentes = queryset.filter(status='pendente')
        for pagamento in pendentes:
            pagamento.rejeitar_pagamento("Rejeitado via admin")
        self.message_user(request, f"{pendentes.count()} pagamentos rejeitados.")
    rejeitar_pagamentos.short_description = "Rejeitar pagamentos"


@admin.register(CobrancaMulta)
class CobrancaMultaAdmin(admin.ModelAdmin):
    list_display = ['boleto_numero', 'tipo_cobranca', 'canal', 'status_colored', 
                   'data_agendamento', 'tentativas']
    list_filter = ['tipo_cobranca', 'canal', 'status', 'data_agendamento']
    search_fields = ['boleto__numero_boleto', 'boleto__pagador_nome', 'assunto']
    readonly_fields = ['data_envio', 'data_entrega', 'tentativas']
    
    fieldsets = (
        ('Boleto', {
            'fields': ('boleto',)
        }),
        ('Cobrança', {
            'fields': ('tipo_cobranca', 'canal', 'data_agendamento')
        }),
        ('Conteúdo', {
            'fields': ('assunto', 'mensagem')
        }),
        ('Status', {
            'fields': ('status', 'tentativas', 'max_tentativas')
        }),
        ('Datas', {
            'fields': ('data_envio', 'data_entrega'),
            'classes': ('collapse',)
        }),
        ('Logs', {
            'fields': ('log_envio', 'erro_envio'),
            'classes': ('collapse',)
        })
    )
    
    def boleto_numero(self, obj):
        return obj.boleto.numero_boleto
    boleto_numero.short_description = 'Boleto'
    
    def status_colored(self, obj):
        colors = {
            'pendente': 'orange',
            'enviada': 'blue',
            'entregue': 'green',
            'falhada': 'red',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    
    actions = ['enviar_cobrancas']
    
    def enviar_cobrancas(self, request, queryset):
        pendentes = queryset.filter(status='pendente')
        enviadas = 0
        for cobranca in pendentes:
            if cobranca.enviar_cobranca():
                enviadas += 1
        self.message_user(request, f"{enviadas} cobranças enviadas de {pendentes.count()} tentativas.")
    enviar_cobrancas.short_description = "Enviar cobranças"


@admin.register(TemplateCobranca)
class TemplateCobrancaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo_cobranca', 'canal', 'ativo', 'padrao']
    list_filter = ['tipo_cobranca', 'canal', 'ativo', 'padrao']
    search_fields = ['nome', 'assunto_template']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('nome', 'tipo_cobranca', 'canal')
        }),
        ('Templates', {
            'fields': ('assunto_template', 'mensagem_template')
        }),
        ('Configuração', {
            'fields': ('ativo', 'padrao', 'variaveis_disponiveis')
        })
    )


class LogCobrancaInline(admin.TabularInline):
    model = LogCobranca
    extra = 0
    readonly_fields = ['timestamp', 'acao', 'descricao']
    fields = ['timestamp', 'acao', 'descricao', 'usuario']


@admin.register(LogCobranca)
class LogCobrancaAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'acao', 'boleto_info', 'usuario']
    list_filter = ['acao', 'timestamp']
    search_fields = ['boleto__numero_boleto', 'descricao', 'usuario']
    readonly_fields = ['timestamp']
    
    def boleto_info(self, obj):
        if obj.boleto:
            return f"{obj.boleto.numero_boleto} - {obj.boleto.pagador_nome}"
        return "-"
    boleto_info.short_description = 'Boleto'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
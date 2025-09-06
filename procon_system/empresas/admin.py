from django.contrib import admin
from .models import Empresa, PorteEmpresa, SegmentoEconomico, ResponsavelLegal, HistoricoEmpresa, EnderecoFilial


@admin.register(PorteEmpresa)
class PorteEmpresaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'faturamento_min', 'faturamento_max']
    search_fields = ['nome']
    ordering = ['faturamento_min']


@admin.register(SegmentoEconomico)
class SegmentoEconomicoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'codigo', 'ativo']
    list_filter = ['ativo']
    search_fields = ['nome', 'codigo']
    ordering = ['nome']


class ResponsavelLegalInline(admin.TabularInline):
    model = ResponsavelLegal
    extra = 1
    fields = ['nome', 'cpf', 'cargo', 'telefone', 'email', 'ativo']


class EnderecoFilialInline(admin.TabularInline):
    model = EnderecoFilial
    extra = 0
    fields = ['nome', 'endereco', 'numero', 'bairro', 'cidade', 'telefone', 'ativo']


class HistoricoEmpresaInline(admin.TabularInline):
    model = HistoricoEmpresa
    extra = 0
    readonly_fields = ['data_evento']
    fields = ['tipo_evento', 'descricao', 'data_evento', 'usuario']
    ordering = ['-data_evento']


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = [
        'razao_social', 'nome_fantasia', 'cnpj', 'situacao', 
        'classificacao_risco', 'total_infracoes', 'total_multas', 'ativo'
    ]
    list_filter = [
        'situacao', 'classificacao_risco', 'porte', 'segmento', 
        'tipo', 'estado', 'ativo'
    ]
    search_fields = [
        'razao_social', 'nome_fantasia', 'cnpj', 
        'inscricao_estadual', 'inscricao_municipal'
    ]
    readonly_fields = [
        'data_cadastro', 'data_atualizacao', 'total_infracoes', 
        'total_multas', 'valor_total_multas', 'multas_pendentes'
    ]
    
    fieldsets = (
        ('Dados Básicos', {
            'fields': (
                ('razao_social', 'nome_fantasia'),
                ('cnpj', 'inscricao_estadual', 'inscricao_municipal'),
                ('tipo', 'situacao', 'ativo'),
                'matriz'
            )
        }),
        ('Classificação', {
            'fields': (
                ('porte', 'segmento'),
                'classificacao_risco',
                'data_abertura'
            )
        }),
        ('Endereço', {
            'fields': (
                ('endereco', 'numero', 'complemento'),
                ('bairro', 'cep'),
                ('cidade', 'estado')
            )
        }),
        ('Contatos', {
            'fields': (
                ('telefone', 'celular'),
                ('email', 'site')
            )
        }),
        ('Informações do Sistema', {
            'fields': (
                ('data_cadastro', 'data_atualizacao'),
                ('total_infracoes', 'total_multas'),
                ('valor_total_multas', 'multas_pendentes')
            ),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        })
    )
    
    inlines = [ResponsavelLegalInline, EnderecoFilialInline, HistoricoEmpresaInline]
    
    actions = ['atualizar_classificacao_risco', 'marcar_como_ativa', 'marcar_como_inativa']
    
    def atualizar_classificacao_risco(self, request, queryset):
        for empresa in queryset:
            empresa.atualizar_classificacao_risco()
        self.message_user(request, f"Classificação de risco atualizada para {queryset.count()} empresas.")
    atualizar_classificacao_risco.short_description = "Atualizar classificação de risco"
    
    def marcar_como_ativa(self, request, queryset):
        queryset.update(situacao='ativa', ativo=True)
        self.message_user(request, f"{queryset.count()} empresas marcadas como ativas.")
    marcar_como_ativa.short_description = "Marcar como ativa"
    
    def marcar_como_inativa(self, request, queryset):
        queryset.update(situacao='inativa', ativo=False)
        self.message_user(request, f"{queryset.count()} empresas marcadas como inativas.")
    marcar_como_inativa.short_description = "Marcar como inativa"


@admin.register(ResponsavelLegal)
class ResponsavelLegalAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cargo', 'empresa', 'telefone', 'email', 'ativo']
    list_filter = ['cargo', 'ativo']
    search_fields = ['nome', 'cpf', 'empresa__razao_social']
    ordering = ['empresa__razao_social', 'nome']


@admin.register(HistoricoEmpresa)
class HistoricoEmpresaAdmin(admin.ModelAdmin):
    list_display = ['empresa', 'tipo_evento', 'descricao', 'data_evento', 'usuario']
    list_filter = ['tipo_evento', 'data_evento']
    search_fields = ['empresa__razao_social', 'descricao', 'usuario']
    readonly_fields = ['data_evento']
    ordering = ['-data_evento']


@admin.register(EnderecoFilial)
class EnderecoFilialAdmin(admin.ModelAdmin):
    list_display = ['nome', 'empresa', 'cidade', 'estado', 'telefone', 'ativo']
    list_filter = ['estado', 'cidade', 'ativo']
    search_fields = ['nome', 'empresa__razao_social', 'endereco']
    ordering = ['empresa__razao_social', 'nome']
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ConsultaPublica, EmpresaPublica, ProcessoPublico, 
    RankingPublico, MonitoramentoPrecos, RestricaoEmpresa
)


@admin.register(ConsultaPublica)
class ConsultaPublicaAdmin(admin.ModelAdmin):
    list_display = [
        'tipo_consulta', 'termo_pesquisado', 'resultados_encontrados',
        'ip_consultante', 'data_consulta', 'sucesso'
    ]
    list_filter = ['tipo_consulta', 'sucesso', 'data_consulta']
    search_fields = ['termo_pesquisado', 'ip_consultante']
    readonly_fields = ['data_consulta', 'tempo_resposta']
    ordering = ['-data_consulta']
    
    def has_add_permission(self, request):
        return False  # Logs são criados automaticamente
    
    def has_change_permission(self, request, obj=None):
        return False  # Logs não devem ser alterados


@admin.register(EmpresaPublica)
class EmpresaPublicaAdmin(admin.ModelAdmin):
    list_display = [
        'razao_social', 'cnpj', 'situacao_publica', 'total_processos',
        'total_multas', 'valor_total_multas', 'exibir_detalhes'
    ]
    list_filter = ['situacao_publica', 'porte', 'estado', 'exibir_detalhes']
    search_fields = ['razao_social', 'nome_fantasia', 'cnpj']
    readonly_fields = ['data_atualizacao']
    ordering = ['razao_social']
    
    fieldsets = (
        ('Dados Básicos', {
            'fields': (
                ('razao_social', 'nome_fantasia'),
                'cnpj',
                ('segmento', 'porte')
            )
        }),
        ('Endereço', {
            'fields': (
                'endereco',
                ('bairro', 'cidade', 'estado')
            )
        }),
        ('Status Público', {
            'fields': (
                ('situacao_publica', 'ativo'),
                'exibir_detalhes'
            )
        }),
        ('Estatísticas', {
            'fields': (
                ('total_processos', 'total_multas'),
                'valor_total_multas',
                'data_ultima_infracao'
            ),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('data_atualizacao',),
            'classes': ('collapse',)
        })
    )
    
    actions = ['atualizar_dados_publicos', 'ocultar_detalhes', 'exibir_detalhes']
    
    def atualizar_dados_publicos(self, request, queryset):
        EmpresaPublica.atualizar_dados_publicos()
        self.message_user(request, "Dados públicos atualizados com sucesso.")
    atualizar_dados_publicos.short_description = "Atualizar dados públicos"
    
    def ocultar_detalhes(self, request, queryset):
        queryset.update(exibir_detalhes=False)
        self.message_user(request, f"{queryset.count()} empresas com detalhes ocultados.")
    ocultar_detalhes.short_description = "Ocultar detalhes"
    
    def exibir_detalhes(self, request, queryset):
        queryset.update(exibir_detalhes=True)
        self.message_user(request, f"{queryset.count()} empresas com detalhes visíveis.")
    exibir_detalhes.short_description = "Exibir detalhes"


@admin.register(ProcessoPublico)
class ProcessoPublicoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_processo', 'empresa_nome', 'tipo_auto',
        'data_auto', 'status_publico', 'tem_multa', 'visivel_publico'
    ]
    list_filter = ['status_publico', 'tipo_auto', 'tem_multa', 'visivel_publico']
    search_fields = ['numero_processo', 'empresa_nome', 'empresa_cnpj']
    readonly_fields = ['data_atualizacao']
    ordering = ['-data_auto']
    
    fieldsets = (
        ('Identificação', {
            'fields': (
                'numero_processo',
                ('empresa_cnpj', 'empresa_nome')
            )
        }),
        ('Dados do Auto', {
            'fields': (
                ('tipo_auto', 'data_auto'),
                'local_infracao'
            )
        }),
        ('Status', {
            'fields': (
                'status_publico',
                'visivel_publico'
            )
        }),
        ('Multa', {
            'fields': (
                'tem_multa',
                ('valor_multa', 'status_multa')
            ),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('data_atualizacao',),
            'classes': ('collapse',)
        })
    )
    
    actions = ['tornar_visivel', 'tornar_invisivel']
    
    def tornar_visivel(self, request, queryset):
        queryset.update(visivel_publico=True)
        self.message_user(request, f"{queryset.count()} processos tornados visíveis.")
    tornar_visivel.short_description = "Tornar visível ao público"
    
    def tornar_invisivel(self, request, queryset):
        queryset.update(visivel_publico=False)
        self.message_user(request, f"{queryset.count()} processos ocultados do público.")
    tornar_invisivel.short_description = "Ocultar do público"


@admin.register(RankingPublico)
class RankingPublicoAdmin(admin.ModelAdmin):
    list_display = [
        'tipo_ranking', 'periodo', 'data_referencia',
        'total_empresas', 'ativo', 'gerado_em'
    ]
    list_filter = ['tipo_ranking', 'periodo', 'ativo']
    readonly_fields = ['gerado_em', 'atualizado_em']
    ordering = ['-data_referencia']
    
    fieldsets = (
        ('Configuração', {
            'fields': (
                ('tipo_ranking', 'periodo'),
                'data_referencia',
                'ativo'
            )
        }),
        ('Dados', {
            'fields': (
                'dados_ranking',
                'total_empresas'
            )
        }),
        ('Exibição', {
            'fields': (
                ('exibir_valores', 'limite_posicoes'),
            ),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': (
                ('gerado_em', 'atualizado_em'),
            ),
            'classes': ('collapse',)
        })
    )


@admin.register(MonitoramentoPrecos)
class MonitoramentoPrecosAdmin(admin.ModelAdmin):
    list_display = [
        'produto', 'categoria', 'preco_medio', 'variacao_formatada',
        'regiao', 'data_pesquisa', 'publicar'
    ]
    list_filter = ['categoria', 'regiao', 'publicar', 'data_pesquisa']
    search_fields = ['produto', 'especificacao']
    ordering = ['-data_pesquisa', 'categoria']
    
    fieldsets = (
        ('Produto/Serviço', {
            'fields': (
                ('produto', 'categoria'),
                ('unidade', 'especificacao')
            )
        }),
        ('Preços', {
            'fields': (
                ('preco_minimo', 'preco_maximo', 'preco_medio'),
                ('preco_anterior', 'variacao_percentual')
            )
        }),
        ('Pesquisa', {
            'fields': (
                ('regiao', 'total_estabelecimentos'),
                ('data_pesquisa', 'periodo_referencia')
            )
        }),
        ('Configuração', {
            'fields': (
                ('ativo', 'publicar'),
            )
        })
    )
    
    def variacao_formatada(self, obj):
        return obj.variacao_formatada
    variacao_formatada.short_description = 'Variação %'


@admin.register(RestricaoEmpresa)
class RestricaoEmpresaAdmin(admin.ModelAdmin):
    list_display = [
        'empresa_nome', 'tipo_restricao', 'data_restricao',
        'data_validade', 'nivel_severidade', 'ativa', 'publicar'
    ]
    list_filter = [
        'tipo_restricao', 'nivel_severidade', 'ativa', 
        'publicar', 'data_restricao'
    ]
    search_fields = ['empresa_nome', 'empresa_cnpj', 'numero_processo']
    readonly_fields = ['criado_em']
    ordering = ['-data_restricao']
    
    fieldsets = (
        ('Empresa', {
            'fields': (
                ('empresa_cnpj', 'empresa_nome'),
            )
        }),
        ('Restrição', {
            'fields': (
                ('tipo_restricao', 'nivel_severidade'),
                'descricao',
                ('data_restricao', 'data_validade')
            )
        }),
        ('Status', {
            'fields': (
                ('ativa', 'publicar'),
            )
        }),
        ('Relacionamento', {
            'fields': ('numero_processo',),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('criado_em',),
            'classes': ('collapse',)
        })
    )
    
    actions = ['ativar_restricoes', 'desativar_restricoes', 'publicar_restricoes']
    
    def ativar_restricoes(self, request, queryset):
        queryset.update(ativa=True)
        self.message_user(request, f"{queryset.count()} restrições ativadas.")
    ativar_restricoes.short_description = "Ativar restrições"
    
    def desativar_restricoes(self, request, queryset):
        queryset.update(ativa=False)
        self.message_user(request, f"{queryset.count()} restrições desativadas.")
    desativar_restricoes.short_description = "Desativar restrições"
    
    def publicar_restricoes(self, request, queryset):
        queryset.update(publicar=True)
        self.message_user(request, f"{queryset.count()} restrições publicadas.")
    publicar_restricoes.short_description = "Publicar restrições"
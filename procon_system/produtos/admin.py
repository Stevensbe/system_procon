from django.contrib import admin
from django.utils.html import format_html
from .models import (
    CategoriaProduto, Fabricante, Produto, RegistroPreco, 
    ProdutoInutilizado, FotoProdutoInutilizado, ControleEstoque
)


@admin.register(CategoriaProduto)
class CategoriaProdutoAdmin(admin.ModelAdmin):
    list_display = [
        'nome', 'codigo', 'categoria_pai', 'nivel_hierarquico',
        'requer_inspecao', 'permite_inutilizacao', 'ativo'
    ]
    list_filter = ['ativo', 'requer_inspecao', 'permite_inutilizacao', 'categoria_pai']
    search_fields = ['nome', 'codigo', 'descricao']
    ordering = ['ordem', 'nome']
    
    def nivel_hierarquico(self, obj):
        return '—' * obj.nivel + ' ' + obj.nome
    nivel_hierarquico.short_description = 'Hierarquia'


@admin.register(Fabricante)
class FabricanteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cnpj', 'pais_origem', 'telefone', 'email', 'ativo']
    list_filter = ['ativo', 'pais_origem']
    search_fields = ['nome', 'cnpj']
    ordering = ['nome']


class RegistroPrecoInline(admin.TabularInline):
    model = RegistroPreco
    extra = 0
    readonly_fields = ['data_coleta']
    fields = ['estabelecimento', 'preco', 'data_coleta', 'coletado_por', 'ativo']


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = [
        'nome', 'codigo_interno', 'categoria', 'fabricante',
        'classificacao_risco', 'preco_referencia', 'ativo'
    ]
    list_filter = [
        'categoria', 'classificacao_risco', 'ativo', 'descontinuado',
        'tem_validade', 'requer_licenca', 'controlado_anvisa'
    ]
    search_fields = ['nome', 'codigo_interno', 'codigo_barras', 'codigo_ncm']
    readonly_fields = ['criado_em', 'atualizado_em']
    
    fieldsets = (
        ('Identificação', {
            'fields': (
                ('nome', 'codigo_interno'),
                ('codigo_barras', 'codigo_ncm'),
                ('categoria', 'fabricante')
            )
        }),
        ('Características', {
            'fields': (
                'descricao',
                'especificacoes',
                ('unidade_medida', 'peso_liquido', 'peso_bruto'),
                'dimensoes'
            )
        }),
        ('Preços de Referência', {
            'fields': (
                ('preco_referencia', 'data_atualizacao_preco'),
                ('preco_minimo', 'preco_maximo')
            ),
            'classes': ('collapse',)
        }),
        ('Validade e Conservação', {
            'fields': (
                ('tem_validade', 'prazo_validade_dias'),
                'condicoes_armazenamento',
                'temperatura_conservacao'
            ),
            'classes': ('collapse',)
        }),
        ('Classificação de Risco', {
            'fields': (
                'classificacao_risco',
                ('requer_licenca', 'controlado_anvisa')
            )
        }),
        ('Status', {
            'fields': (
                ('ativo', 'descontinuado'),
                'data_descontinuacao'
            )
        }),
        ('Controle', {
            'fields': (
                ('criado_por', 'criado_em', 'atualizado_em'),
            ),
            'classes': ('collapse',)
        })
    )
    
    inlines = [RegistroPrecoInline]
    
    actions = ['marcar_como_descontinuado', 'ativar_produtos']
    
    def marcar_como_descontinuado(self, request, queryset):
        from django.utils import timezone
        queryset.update(descontinuado=True, data_descontinuacao=timezone.now().date())
        self.message_user(request, f"{queryset.count()} produtos marcados como descontinuados.")
    marcar_como_descontinuado.short_description = "Marcar como descontinuado"
    
    def ativar_produtos(self, request, queryset):
        queryset.update(ativo=True, descontinuado=False, data_descontinuacao=None)
        self.message_user(request, f"{queryset.count()} produtos ativados.")
    ativar_produtos.short_description = "Ativar produtos"


@admin.register(RegistroPreco)
class RegistroPrecoAdmin(admin.ModelAdmin):
    list_display = [
        'produto', 'estabelecimento', 'preco', 'preco_promocional',
        'data_coleta', 'coletado_por', 'verificado', 'ativo'
    ]
    list_filter = ['ativo', 'verificado', 'data_coleta', 'produto__categoria']
    search_fields = [
        'produto__nome', 'estabelecimento', 'cnpj_estabelecimento'
    ]
    readonly_fields = ['data_coleta']
    ordering = ['-data_coleta']
    
    fieldsets = (
        ('Produto', {
            'fields': ('produto',)
        }),
        ('Estabelecimento', {
            'fields': (
                'estabelecimento',
                'cnpj_estabelecimento',
                'endereco_estabelecimento'
            )
        }),
        ('Preço', {
            'fields': (
                ('preco', 'preco_promocional'),
                'unidade_venda'
            )
        }),
        ('Data e Responsável', {
            'fields': (
                ('data_coleta', 'hora_coleta'),
                'coletado_por',
                'fiscalizacao_relacionada'
            )
        }),
        ('Validade', {
            'fields': ('data_validade',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': (
                ('ativo', 'verificado'),
                'observacoes'
            )
        })
    )


class FotoProdutoInutilizadoInline(admin.TabularInline):
    model = FotoProdutoInutilizado
    extra = 1
    fields = ['foto', 'descricao', 'ordem']


@admin.register(ProdutoInutilizado)
class ProdutoInutilizadoAdmin(admin.ModelAdmin):
    list_display = [
        'produto', 'estabelecimento_nome', 'motivo',
        'quantidade_inutilizada', 'valor_estimado', 'data_inutilizacao',
        'auto_inutilizacao_gerado', 'destino_confirmado'
    ]
    list_filter = [
        'motivo', 'destino_produto', 'data_inutilizacao',
        'auto_inutilizacao_gerado', 'destino_confirmado'
    ]
    search_fields = [
        'numero_auto', 'produto__nome', 'estabelecimento_nome',
        'estabelecimento_cnpj'
    ]
    readonly_fields = ['criado_em', 'valor_total_inutilizado']
    ordering = ['-data_inutilizacao']
    
    fieldsets = (
        ('Identificação', {
            'fields': (
                ('numero_auto', 'produto'),
            )
        }),
        ('Estabelecimento', {
            'fields': (
                'estabelecimento_nome',
                'estabelecimento_cnpj',
                'estabelecimento_endereco'
            )
        }),
        ('Detalhes da Inutilização', {
            'fields': (
                ('motivo', 'quantidade_inutilizada', 'unidade'),
                'descricao_motivo',
                ('valor_estimado', 'valor_total_inutilizado')
            )
        }),
        ('Dados do Produto', {
            'fields': (
                ('lote', 'codigo_barras_produto'),
                ('data_fabricacao', 'data_validade')
            ),
            'classes': ('collapse',)
        }),
        ('Processo de Inutilização', {
            'fields': (
                ('data_inutilizacao', 'hora_inutilizacao'),
                'forma_inutilizacao',
                ('destino_produto', 'destino_observacoes')
            )
        }),
        ('Responsáveis', {
            'fields': (
                ('fiscal_responsavel', 'responsavel_estabelecimento'),
                'testemunhas'
            )
        }),
        ('Documentação', {
            'fields': (
                ('auto_inutilizacao_gerado', 'fotos_anexadas', 'termo_assinado'),
            )
        }),
        ('Acompanhamento', {
            'fields': (
                ('destino_confirmado', 'data_confirmacao_destino'),
                'comprovante_destino'
            ),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes_gerais',),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': (
                ('criado_por', 'criado_em'),
            ),
            'classes': ('collapse',)
        })
    )
    
    inlines = [FotoProdutoInutilizadoInline]
    
    actions = ['gerar_auto_inutilizacao', 'confirmar_destino']
    
    def gerar_auto_inutilizacao(self, request, queryset):
        gerados = 0
        for produto in queryset:
            if produto.gerar_auto_inutilizacao():
                gerados += 1
        
        self.message_user(request, f"{gerados} autos de inutilização gerados.")
    gerar_auto_inutilizacao.short_description = "Gerar auto de inutilização"
    
    def confirmar_destino(self, request, queryset):
        from django.utils import timezone
        queryset.update(
            destino_confirmado=True,
            data_confirmacao_destino=timezone.now().date()
        )
        self.message_user(request, f"{queryset.count()} destinos confirmados.")
    confirmar_destino.short_description = "Confirmar destino"
    
    def valor_total_inutilizado(self, obj):
        if obj.valor_total_inutilizado:
            return f"R$ {obj.valor_total_inutilizado:,.2f}"
        return "-"
    valor_total_inutilizado.short_description = "Valor Total"


@admin.register(ControleEstoque)
class ControleEstoqueAdmin(admin.ModelAdmin):
    list_display = [
        'produto', 'estabelecimento_nome', 'quantidade_estoque',
        'produtos_vencidos', 'produtos_proximos_vencimento',
        'situacao_visual', 'data_verificacao'
    ]
    list_filter = [
        'data_verificacao', 'verificado_por', 'produto__categoria'
    ]
    search_fields = [
        'produto__nome', 'estabelecimento_nome', 'estabelecimento_cnpj'
    ]
    ordering = ['-data_verificacao']
    
    fieldsets = (
        ('Identificação', {
            'fields': (
                'produto',
                ('estabelecimento_cnpj', 'estabelecimento_nome')
            )
        }),
        ('Estoque', {
            'fields': (
                'quantidade_estoque',
                ('quantidade_minima', 'quantidade_maxima')
            )
        }),
        ('Localização', {
            'fields': (
                'setor_armazenamento',
                'condicoes_armazenamento'
            ),
            'classes': ('collapse',)
        }),
        ('Controle de Validade', {
            'fields': (
                ('produtos_proximos_vencimento', 'produtos_vencidos'),
            )
        }),
        ('Verificação', {
            'fields': (
                ('data_verificacao', 'verificado_por'),
                'fiscalizacao_relacionada'
            )
        }),
        ('Observações', {
            'fields': (
                'observacoes',
                'irregularidades'
            ),
            'classes': ('collapse',)
        })
    )
    
    def situacao_visual(self, obj):
        situacao = obj.situacao_estoque
        cores = {
            'critica': 'red',
            'atencao': 'orange',
            'baixo': 'yellow',
            'normal': 'green'
        }
        
        textos = {
            'critica': 'Crítica',
            'atencao': 'Atenção',
            'baixo': 'Baixo',
            'normal': 'Normal'
        }
        
        cor = cores.get(situacao, 'gray')
        texto = textos.get(situacao, 'Indefinida')
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            cor, texto
        )
    situacao_visual.short_description = 'Situação'
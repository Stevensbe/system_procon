from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.contrib.contenttypes.admin import GenericTabularInline
from datetime import timedelta 
from .models import *

# === CONFIGURAÇÕES GERAIS DO ADMIN ===
admin.site.site_header = "PROCON AMAZONAS - Sistema de Fiscalização"
admin.site.site_title = "PROCON AM"
admin.site.index_title = "Administração do Sistema de Fiscalização"

# === INLINES GENÉRICOS ===
class AnexoAutoInline(GenericTabularInline):
    model = AnexoAuto
    extra = 0
    fields = ('arquivo', 'descricao')

# === INLINES ESPECÍFICOS ===
class AtendimentoCaixaBancoInline(admin.TabularInline):
    model = AtendimentoCaixaBanco
    extra = 1
    fields = ('letra_senha', 'horario_chegada', 'horario_atendimento', 'tempo_decorrido')
    readonly_fields = ('tempo_espera_formatado',)
    
    def tempo_espera_formatado(self, obj):
        if obj.pk:
            return obj.tempo_espera_formatado
        return "-"
    tempo_espera_formatado.short_description = "Tempo de Espera"

class NotaFiscalPostoInline(admin.TabularInline):
    model = NotaFiscalPosto
    extra = 1
    fields = ('tipo_nota', 'produto', 'numero_nota', 'data', 'preco')

class CupomFiscalPostoInline(admin.TabularInline):
    model = CupomFiscalPosto
    extra = 1
    fields = ('item_tabela', 'dia', 'numero_cupom', 'produto', 'valor', 'percentual_diferenca')

class HistoricoStatusInfracaoInline(admin.TabularInline):
    model = HistoricoStatusInfracao
    extra = 0
    readonly_fields = ('data_mudanca', 'status_anterior', 'status_novo')
    fields = ('status_anterior', 'status_novo', 'observacoes', 'usuario', 'data_mudanca')

# === ADMINS PRINCIPAIS ===
@admin.register(AutoBanco)
class AutoBancoAdmin(admin.ModelAdmin):
    list_display = (
        'numero', 'razao_social', 'cnpj', 'data_fiscalizacao', 
        'nada_consta', 'total_atendimentos_display', 'status_display', 'acoes'
    )
    list_filter = (
        'data_fiscalizacao', 'origem', 'nada_consta', 'sem_irregularidades',
        'todos_caixas_funcionando', 'distribuiu_senha', 'criado_em'
    )
    search_fields = ('numero', 'razao_social', 'nome_fantasia', 'cnpj')
    readonly_fields = ('numero', 'criado_em', 'atualizado_em', 'total_atendimentos_display')
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero', 'razao_social', 'nome_fantasia', 'porte', 'atuacao', 'atividade')
        }),
        ('Endereço e Contato', {
            'fields': ('endereco', 'cep', 'municipio', 'estado', 'cnpj', 'telefone')
        }),
        ('Fiscalização', {
            'fields': ('data_fiscalizacao', 'hora_fiscalizacao', 'origem', 'origem_outros')
        }),
        ('Cominação Legal', {
            'fields': ('nada_consta', 'sem_irregularidades')
        }),
        ('Lei das Filas', {
            'fields': (
                'todos_caixas_funcionando', 'distribuiu_senha', 'distribuiu_senha_fora_padrao',
                'senha_sem_nome_estabelecimento', 'senha_sem_horarios', 'senha_sem_rubrica',
                'ausencia_cartaz_informativo', 'ausencia_profissional_libras'
            )
        }),
        ('Responsáveis', {
            'fields': (
                'fiscal_nome_1', 'fiscal_nome_2', 
                'responsavel_nome', 'responsavel_cpf'
            )
        }),
        ('Assinaturas', {
            'fields': ('assinatura_fiscal_1', 'assinatura_fiscal_2', 'assinatura_representante'),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes',)
        }),
        ('Controle', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [AtendimentoCaixaBancoInline, AnexoAutoInline]
    
    def total_atendimentos_display(self, obj):
        return obj.total_atendimentos
    total_atendimentos_display.short_description = "Atendimentos"
    
    def status_display(self, obj):
        if obj.nada_consta:
            return format_html('<span style="color: green;">✓ Nada Consta</span>')
        elif obj.sem_irregularidades:
            return format_html('<span style="color: blue;">✓ Sem Irregularidades</span>')
        else:
            return format_html('<span style="color: red;">⚠ Com Irregularidades</span>')
    status_display.short_description = "Status"
    
    def acoes(self, obj):
        if obj.pk:
            try:
                url = reverse('fiscalizacao:gerar_documento_banco', args=[obj.pk])
                return format_html(
                    '<a class="button" href="{}" target="_blank">📄 Gerar Documento</a>',
                    url
                )
            except:
                return format_html(
                    '<a class="button" href="#" onclick="alert(\'Função em desenvolvimento\')">📄 Gerar Documento</a>'
                )
        return "-"
    acoes.short_description = "Ações"
    acoes.allow_tags = True


@admin.register(AutoPosto)
class AutoPostoAdmin(admin.ModelAdmin):
    list_display = (
        'numero', 'razao_social', 'cnpj', 'data_fiscalizacao', 
        'nada_consta', 'total_combustiveis', 'acoes'
    )
    list_filter = (
        'data_fiscalizacao', 'origem', 'nada_consta', 'sem_irregularidades', 'criado_em'
    )
    search_fields = ('numero', 'razao_social', 'nome_fantasia', 'cnpj')
    readonly_fields = ('numero', 'criado_em', 'atualizado_em')
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero', 'razao_social', 'nome_fantasia', 'porte', 'atuacao', 'atividade')
        }),
        ('Endereço e Contato', {
            'fields': ('endereco', 'cep', 'municipio', 'estado', 'cnpj', 'telefone')
        }),
        ('Fiscalização', {
            'fields': ('data_fiscalizacao', 'hora_fiscalizacao', 'origem', 'origem_outros')
        }),
        ('Cominação Legal', {
            'fields': ('nada_consta', 'sem_irregularidades')
        }),
        ('Preços dos Combustíveis', {
            'fields': (
                'preco_gasolina_comum', 'preco_gasolina_aditivada', 'preco_etanol',
                'preco_diesel_comum', 'preco_diesel_s10', 'preco_gnv'
            )
        }),
        ('Produtos Não Vendidos', {
            'fields': (
                'nao_vende_gas_comum', 'nao_vende_gas_aditivada', 'nao_vende_etanol',
                'nao_vende_diesel_comum', 'nao_vende_diesel_s10', 'nao_vende_gnv'
            ),
            'classes': ('collapse',)
        }),
        ('Informações Adicionais', {
            'fields': ('prazo_envio_documentos', 'info_adicionais', 'outras_irregularidades', 'dispositivos_legais')
        }),
        ('Responsáveis', {
            'fields': ('fiscal_nome_1', 'fiscal_nome_2', 'responsavel_nome', 'responsavel_cpf')
        }),
        ('Assinaturas', {
            'fields': ('assinatura_fiscal_1', 'assinatura_fiscal_2', 'assinatura_representante'),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [NotaFiscalPostoInline, CupomFiscalPostoInline, AnexoAutoInline]
    
    def total_combustiveis(self, obj):
        count = 0
        precos = [
            obj.preco_gasolina_comum, obj.preco_gasolina_aditivada, obj.preco_etanol,
            obj.preco_diesel_comum, obj.preco_diesel_s10, obj.preco_gnv
        ]
        return sum(1 for preco in precos if preco is not None)
    total_combustiveis.short_description = "Combustíveis"
    
    def acoes(self, obj):
        if obj.pk:
            try:
                url = reverse('fiscalizacao:gerar_documento_posto', args=[obj.pk])
                return format_html(
                    '<a class="button" href="{}" target="_blank">📄 Gerar Documento</a>',
                    url
                )
            except Exception as e:
                return format_html(
                    '<a class="button" href="#" onclick="alert(\'Erro: {}\')">📄 Gerar Documento</a>',
                    str(e)
                )
        return "-"
    acoes.short_description = "Ações"



@admin.register(AutoSupermercado)
class AutoSupermercadoAdmin(admin.ModelAdmin):
    list_display = (
        'numero', 'razao_social', 'cnpj', 'data_fiscalizacao', 
        'tem_irregularidades', 'possui_anexo', 'auto_apreensao', 'acoes'
    )
    list_filter = (
        'data_fiscalizacao', 'origem', 'nada_consta', 'possui_anexo', 'auto_apreensao', 
        'receita_bruta_notificada', 'criado_em'
    )
    search_fields = ('numero', 'razao_social', 'nome_fantasia', 'cnpj')
    readonly_fields = ('numero', 'criado_em', 'atualizado_em', 'tem_irregularidades')
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero', 'razao_social', 'nome_fantasia', 'atividade')
        }),
        ('Endereço e Contato', {
            'fields': ('endereco', 'cep', 'municipio', 'estado', 'cnpj', 'telefone')
        }),
        ('Fiscalização', {
            'fields': ('data_fiscalizacao', 'hora_fiscalizacao', 'origem', 'origem_outros')
        }),
        ('Resultado da Fiscalização', {
            'fields': ('nada_consta', 'tem_irregularidades')
        }),
        ('Irregularidades - Produtos', {
            'fields': (
                'comercializar_produtos_vencidos', 'comercializar_embalagem_violada',
                'comercializar_lata_amassada', 'comercializar_sem_validade',
                'comercializar_mal_armazenados', 'comercializar_descongelados'
            ),
            'classes': ('collapse',)
        }),
        ('Irregularidades - Publicidade e Preços', {
            'fields': (
                'publicidade_enganosa', 'obstrucao_monitor', 'afixacao_precos_fora_padrao',
                'ausencia_afixacao_precos', 'afixacao_precos_fracionados_fora_padrao',
                'ausencia_visibilidade_descontos', 'ausencia_placas_promocao_vencimento'
            ),
            'classes': ('collapse',)
        }),
        ('Prazos e Obrigações', {
            'fields': ('prazo_cumprimento_dias', 'receita_bruta_notificada')
        }),
        ('Narrativa e Outras Informações', {
            'fields': ('outras_irregularidades', 'narrativa_fatos')
        }),
        ('Anexos e Apreensão', {
            'fields': (
                'possui_anexo', 'auto_apreensao', 'auto_apreensao_numero', 'necessita_pericia'
            )
        }),
        ('Responsáveis', {
            'fields': ('fiscal_nome_1', 'fiscal_nome_2', 'responsavel_nome', 'responsavel_cpf')
        }),
        ('Assinaturas', {
            'fields': ('assinatura_fiscal_1', 'assinatura_fiscal_2', 'assinatura_representante'),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [AnexoAutoInline]
    
    def acoes(self, obj):
        if obj.pk:
            try:
                url = reverse('fiscalizacao:gerar_documento_supermercado', args=[obj.pk])
                return format_html(
                    '<a class="button" href="{}" target="_blank">📄 Gerar Documento</a>',
                    url
                )
            except Exception as e:
                return format_html(
                    '<a class="button" href="#" onclick="alert(\'Erro: {}\')">📄 Gerar Documento</a>',
                    str(e)
                )
        return "-"
    acoes.short_description = "Ações"


@admin.register(AutoDiversos)
class AutoDiversosAdmin(admin.ModelAdmin):
    list_display = (
        'numero', 'razao_social', 'cnpj', 'data_fiscalizacao', 
        'tem_irregularidades', 'advertencia', 'acoes'
    )
    list_filter = (
        'data_fiscalizacao', 'origem', 'porte', 'advertencia', 
        'receita_bruta_notificada', 'criado_em'
    )
    search_fields = ('numero', 'razao_social', 'nome_fantasia', 'cnpj')
    readonly_fields = ('numero', 'criado_em', 'atualizado_em', 'tem_irregularidades')
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero', 'razao_social', 'nome_fantasia', 'porte', 'atuacao', 'atividade')
        }),
        ('Endereço e Contato', {
            'fields': ('endereco', 'cep', 'municipio', 'estado', 'cnpj', 'telefone')
        }),
        ('Fiscalização', {
            'fields': ('data_fiscalizacao', 'hora_fiscalizacao', 'origem', 'origem_outros')
        }),
        ('Resultado da Fiscalização', {
            'fields': ('tem_irregularidades', 'advertencia')
        }),
        ('Irregularidades - Publicidade e Preços', {
            'fields': (
                'publicidade_enganosa', 'afixacao_precos_fora_padrao', 'ausencia_afixacao_precos',
                'afixacao_precos_fracionados_fora_padrao', 'ausencia_visibilidade_descontos'
            ),
            'classes': ('collapse',)
        }),
        ('Irregularidades - Comércio Eletrônico', {
            'fields': (
                'afixacao_precos_eletronico_fora_padrao', 'ausencia_afixacao_precos_eletronico'
            ),
            'classes': ('collapse',)
        }),
        ('Irregularidades - Outras', {
            'fields': ('ausencia_exemplar_cdc', 'substituicao_troco'),
            'classes': ('collapse',)
        }),
        ('Informações Adicionais', {
            'fields': ('outras_irregularidades', 'narrativa_fatos', 'receita_bruta_notificada')
        }),
        ('Responsáveis', {
            'fields': ('fiscal_nome_1', 'fiscal_nome_2', 'responsavel_nome', 'responsavel_cpf')
        }),
        ('Assinaturas', {
            'fields': ('assinatura_fiscal_1', 'assinatura_fiscal_2', 'assinatura_representante'),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [AnexoAutoInline]
    
    def acoes(self, obj):
        if obj.pk:
            try:
                url = reverse('fiscalizacao:gerar_documento_diversos', args=[obj.pk])
                return format_html(
                    '<a class="button" href="{}" target="_blank">📄 Gerar Documento</a>',
                    url
                )
            except Exception as e:
                return format_html(
                    '<a class="button" href="#" onclick="alert(\'Erro: {}\')">📄 Gerar Documento</a>',
                    str(e)
                )
        return "-"
    acoes.short_description = "Ações"
    acoes.allow_tags = True
    
# Substitua a classe AutoInfracaoAdmin no seu admin.py por esta versão corrigida:

@admin.register(AutoInfracao)
class AutoInfracaoAdmin(admin.ModelAdmin):
    list_display = (
        'numero', 'razao_social', 'cnpj', 'status', 
        'data_fiscalizacao', 'valor_multa_formatado', 'tem_infracoes_marcadas'
    )
    list_filter = (
        'status', 'data_fiscalizacao', 'municipio', 'estado', 'criado_em'
    )
    search_fields = (
        'numero', 'razao_social', 'cnpj', 'relatorio', 
        'base_legal_cdc', 'outras_infracoes'
    )
    readonly_fields = (
        'numero', 'criado_em', 'atualizado_em', 'valor_multa_formatado'
    )
    
    fieldsets = (
        ('Dados Básicos', {
            'fields': (
                'numero', 'data_fiscalizacao', 'hora_fiscalizacao', 
                'municipio', 'estado'
            )
        }),
        ('Dados do Estabelecimento', {
            'fields': (
                'razao_social', 'nome_fantasia', 'atividade', 
                'endereco', 'cnpj', 'telefone'
            )
        }),
        ('Parecer Prévio', {
            'fields': ('parecer_numero', 'parecer_origem'),
            'classes': ('collapse',),
        }),
        ('Relatório e Base Legal', {
            'fields': (
                'relatorio', 'base_legal_cdc', 'base_legal_outras'
            )
        }),
        ('Infrações', {
            'fields': (
                'infracao_art_34', 'infracao_art_35', 'infracao_art_36',
                'infracao_art_55', 'infracao_art_56',
                'infracao_publicidade_enganosa', 'infracao_precos_abusivos',
                'infracao_produtos_vencidos', 'infracao_falta_informacao',
                'outras_infracoes'
            )
        }),
        ('Fundamentação', {
            'fields': ('fundamentacao_tecnica', 'fundamentacao_juridica'),
            'classes': ('collapse',),
        }),
        ('Multa e Status', {
            'fields': ('valor_multa', 'status', 'data_notificacao', 'data_vencimento')
        }),
        ('Responsáveis', {
            'fields': (
                'responsavel_nome', 'responsavel_cpf', 'responsavel_funcao',
                'fiscal_nome', 'fiscal_cargo', 'estabelecimento_responsavel'
            )
        }),
        ('Anexos', {
            'fields': ('possui_anexo', 'descricao_anexo'),
            'classes': ('collapse',),
        }),
        ('Assinaturas', {
            'fields': ('assinatura_fiscal', 'assinatura_responsavel'),
            'classes': ('collapse',),
        }),
        ('Observações', {
            'fields': ('observacoes',),
            'classes': ('collapse',),
        }),
        ('Metadados', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',),
        }),
    )
    
    inlines = [HistoricoStatusInfracaoInline]
    
    def get_razao_social(self, obj):
        """Obtém a razão social do auto relacionado"""
        if obj.content_object and hasattr(obj.content_object, 'razao_social'):
            return obj.content_object.razao_social
        return "N/A"
    get_razao_social.short_description = "Razão Social"
    get_razao_social.admin_order_field = 'content_object__razao_social'
    
    def get_cnpj(self, obj):
        """Obtém o CNPJ do auto relacionado"""
        if obj.content_object and hasattr(obj.content_object, 'cnpj'):
            return obj.content_object.cnpj
        return "N/A"
    get_cnpj.short_description = "CNPJ"
    
    def get_endereco(self, obj):
        """Obtém o endereço do auto relacionado"""
        if obj.content_object and hasattr(obj.content_object, 'endereco'):
            return obj.content_object.endereco
        return "N/A"
    get_endereco.short_description = "Endereço"
    
    def get_municipio(self, obj):
        """Obtém o município do auto relacionado"""
        if obj.content_object and hasattr(obj.content_object, 'municipio'):
            return obj.content_object.municipio
        return "N/A"
    get_municipio.short_description = "Município"
    
    def get_auto_origem(self, obj):
        """Mostra qual auto originou esta infração"""
        if obj.content_object:
            tipo_auto = obj.content_type.name.replace('auto ', '').title()
            numero_auto = getattr(obj.content_object, 'numero', 'S/N')
            return f"{tipo_auto} {numero_auto}"
        return "N/A"
    get_auto_origem.short_description = "Auto de Origem"
    
    def gravidade_display(self, obj):
        colors = {
            'leve': 'green',
            'media': 'orange', 
            'grave': 'red',
            'gravissima': 'darkred'
        }
        color = colors.get(obj.gravidade, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_gravidade_display()
        )
    gravidade_display.short_description = "Gravidade"
    
    def status_display(self, obj):
        colors = {
            'autuado': 'red',
            'notificado': 'orange',
            'em_defesa': 'blue',
            'em_recurso': 'purple',
            'finalizado': 'green',
            'arquivado': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_display.short_description = "Status"
    
    def acoes(self, obj):
        if obj.pk:
            # Link para o auto relacionado
            auto_link = ""
            if obj.content_object:
                try:
                    auto_url = reverse(
                        f'admin:fiscalizacao_{obj.content_type.model}_change',
                        args=[obj.content_object.pk]
                    )
                    auto_link = format_html(
                        '<a class="button" href="{}" target="_blank">🔍 Ver Auto Original</a> ',
                        auto_url
                    )
                except:
                    auto_link = ""
            
            # Link para gerar documento
            doc_link = format_html(
                '<a class="button" href="#" onclick="alert(\'Função em desenvolvimento\')">📄 Gerar Documento</a>'
            )
            
            return format_html('{} {}', auto_link, doc_link)
        return "-"
    acoes.short_description = "Ações"
    
    def get_queryset(self, request):
        """Otimiza as consultas incluindo o content_object"""
        return super().get_queryset(request).select_related('content_type').prefetch_related('content_object')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Customiza o campo content_type para mostrar apenas os tipos de auto válidos"""
        if db_field.name == 'content_type':
            from django.contrib.contenttypes.models import ContentType
            kwargs['queryset'] = ContentType.objects.filter(
                model__in=['autobanco', 'autoposto', 'autosupermercado', 'autodiversos']
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    
# === ADMINS DOS MODELOS AUXILIARES ===
@admin.register(AtendimentoCaixaBanco)
class AtendimentoCaixaBancoAdmin(admin.ModelAdmin):
    list_display = ('auto_banco', 'letra_senha', 'horario_chegada', 'horario_atendimento', 'tempo_espera_formatado')
    list_filter = ('tempo_decorrido', 'horario_chegada')
    search_fields = ('auto_banco__numero', 'auto_banco__razao_social', 'letra_senha')
    ordering = ['-auto_banco__data_fiscalizacao', 'horario_chegada']


@admin.register(NotaFiscalPosto)
class NotaFiscalPostoAdmin(admin.ModelAdmin):
    list_display = ('auto_posto', 'get_produto_display', 'get_tipo_nota_display', 'numero_nota', 'data', 'preco')
    list_filter = ('tipo_nota', 'produto', 'data')
    search_fields = ('auto_posto__numero', 'auto_posto__razao_social', 'numero_nota')
    ordering = ['-data']

    def get_produto_display(self, obj):
        return obj.get_produto_display()
    get_produto_display.short_description = 'Produto'

    def get_tipo_nota_display(self, obj):
        return obj.get_tipo_nota_display()
    get_tipo_nota_display.short_description = 'Tipo'


@admin.register(CupomFiscalPosto)
class CupomFiscalPostoAdmin(admin.ModelAdmin):
    list_display = ('auto_posto', 'numero_cupom', 'produto', 'dia', 'valor', 'percentual_diferenca')
    list_filter = ('dia', 'produto')
    search_fields = ('auto_posto__numero', 'numero_cupom', 'produto')
    ordering = ['-dia']


@admin.register(AnexoAuto)
class AnexoAutoAdmin(admin.ModelAdmin):
    list_display = ('content_object', 'descricao', 'arquivo', 'enviado_em')
    list_filter = ('content_type', 'enviado_em')
    search_fields = ('descricao',)
    ordering = ['-enviado_em']


@admin.register(HistoricoStatusInfracao)
class HistoricoStatusInfracaoAdmin(admin.ModelAdmin):
    list_display = ('auto_infracao', 'status_anterior', 'status_novo', 'data_mudanca', 'usuario')
    list_filter = ('status_anterior', 'status_novo', 'data_mudanca')
    search_fields = ('auto_infracao__numero', 'auto_infracao__razao_social', 'usuario')
    readonly_fields = ('data_mudanca',)
    ordering = ['-data_mudanca']

class StatusProcessoFilter(admin.SimpleListFilter):
    title = 'Status do Processo'
    parameter_name = 'status'

    def lookups(self, request, model_admin):
        return Processo.STATUS_CHOICES

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset


class PrioridadeProcessoFilter(admin.SimpleListFilter):
    title = 'Prioridade'
    parameter_name = 'prioridade'

    def lookups(self, request, model_admin):
        return Processo.PRIORIDADE_CHOICES

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(prioridade=self.value())
        return queryset


class PrazoFilter(admin.SimpleListFilter):
    title = 'Situação do Prazo'
    parameter_name = 'prazo_situacao'

    def lookups(self, request, model_admin):
        return (
            ('vencido', 'Prazo Vencido'),
            ('proximo_vencimento', 'Próximo do Vencimento (7 dias)'),
            ('em_dia', 'Em Dia'),
        )

    def queryset(self, request, queryset):
        hoje = timezone.now().date()
        proxima_semana = hoje + timedelta(days=7)
        
        if self.value() == 'vencido':
            return queryset.filter(
                models.Q(status='aguardando_defesa', prazo_defesa__lt=hoje) |
                models.Q(status='aguardando_recurso', prazo_recurso__lt=hoje)
            )
        elif self.value() == 'proximo_vencimento':
            return queryset.filter(
                models.Q(status='aguardando_defesa', prazo_defesa__range=[hoje, proxima_semana]) |
                models.Q(status='aguardando_recurso', prazo_recurso__range=[hoje, proxima_semana])
            )
        elif self.value() == 'em_dia':
            return queryset.filter(
                models.Q(status='aguardando_defesa', prazo_defesa__gte=proxima_semana) |
                models.Q(status='aguardando_recurso', prazo_recurso__gte=proxima_semana) |
                models.Q(status__in=['finalizado_procedente', 'finalizado_improcedente', 'arquivado'])
            )
        
        return queryset


# === INLINES ===

class HistoricoProcessoInline(admin.TabularInline):
    model = HistoricoProcesso
    extra = 0
    readonly_fields = ['data_mudanca']
    fields = ['status_anterior', 'status_novo', 'observacao', 'usuario', 'data_mudanca']
    
    def has_add_permission(self, request, obj=None):
        return False  # Só permite visualização


class DocumentoProcessoInline(admin.TabularInline):
    model = DocumentoProcesso
    extra = 0
    readonly_fields = ['data_upload']
    fields = ['tipo', 'titulo', 'arquivo', 'descricao', 'usuario_upload', 'data_upload']


# === ADMIN PRINCIPAL ===

@admin.register(Processo)
class ProcessoAdmin(admin.ModelAdmin):
    # Configurações de exibição
    list_display = [
        'numero_processo_link',
        'autuado_resumido', 
        'status_colorido',
        'prioridade_colorida',
        'prazo_situacao',
        'valor_multa_formatado',
        'fiscal_responsavel',
        'dias_tramitacao',
        'acoes_rapidas'
    ]
    
    list_filter = [
        StatusProcessoFilter,
        PrioridadeProcessoFilter, 
        PrazoFilter,
        'criado_em',
        'data_notificacao',
        'auto_infracao__status'
    ]
    
    search_fields = [
        'numero_processo',
        'autuado',
        'cnpj',
        'fiscal_responsavel',
        'analista_responsavel',
        'auto_infracao__numero'
    ]
    
    # Ordenação
    ordering = ['-criado_em']
    list_per_page = 25
    
    # Actions personalizadas
    actions = ['marcar_alta_prioridade', 'arquivar_processos']
    
    # Configuração do formulário
    fieldsets = (
        ('Dados Básicos', {
            'fields': ('numero_processo', 'auto_infracao', 'autuado', 'cnpj')
        }),
        ('Status e Prioridade', {
            'fields': ('status', 'prioridade'),
            'classes': ('wide',)
        }),
        ('Prazos Importantes', {
            'fields': (
                ('prazo_defesa', 'data_defesa'),
                ('prazo_recurso', 'data_recurso'),
                ('data_notificacao', 'data_julgamento', 'data_finalizacao')
            ),
            'classes': ('wide',)
        }),
        ('Valores Financeiros', {
            'fields': ('valor_multa', 'valor_final'),
            'classes': ('collapse',)
        }),
        ('Responsáveis', {
            'fields': ('fiscal_responsavel', 'analista_responsavel'),
        }),
        ('Observações', {
            'fields': ('observacoes', 'observacoes_internas'),
            'classes': ('collapse',)
        }),
        ('Metadados', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ['numero_processo', 'criado_em', 'atualizado_em']
    
    # Inlines
    inlines = [HistoricoProcessoInline, DocumentoProcessoInline]
    
    # === MÉTODOS CUSTOMIZADOS ===
    
    @admin.display(description='Número do Processo', ordering='numero_processo')
    def numero_processo_link(self, obj):
        url = reverse('admin:fiscalizacao_processo_change', args=[obj.pk])
        return format_html(
            '<a href="{}" style="font-family: monospace; font-weight: bold; '
            'color: #0066cc; text-decoration: none;">{}</a>',
            url, obj.numero_processo
        )
    
    @admin.display(description='Autuado', ordering='autuado')
    def autuado_resumido(self, obj):
        nome = obj.autuado
        if len(nome) > 40:
            nome = nome[:37] + '...'
        
        return format_html(
            '<div style="max-width: 200px;">'
            '<div style="font-weight: 500; font-size: 13px;">{}</div>'
            '<div style="color: #666; font-size: 11px; font-family: monospace;">{}</div>'
            '</div>',
            nome, obj.cnpj
        )
    
    @admin.display(description='Status', ordering='status')
    def status_colorido(self, obj):
        cores = {
            'aguardando_defesa': {'bg': '#fff3cd', 'color': '#856404', 'icon': '⏳'},
            'defesa_apresentada': {'bg': '#d4edda', 'color': '#155724', 'icon': '📝'},
            'em_analise': {'bg': '#cce5ff', 'color': '#004085', 'icon': '🔍'},
            'aguardando_recurso': {'bg': '#f8d7da', 'color': '#721c24', 'icon': '⚖️'},
            'recurso_apresentado': {'bg': '#d1ecf1', 'color': '#0c5460', 'icon': '📋'},
            'julgamento': {'bg': '#e2e3e5', 'color': '#495057', 'icon': '⚖️'},
            'finalizado_procedente': {'bg': '#d4edda', 'color': '#155724', 'icon': '✅'},
            'finalizado_improcedente': {'bg': '#f8d7da', 'color': '#721c24', 'icon': '❌'},
            'arquivado': {'bg': '#e9ecef', 'color': '#6c757d', 'icon': '📦'},
            'prescrito': {'bg': '#f8f9fa', 'color': '#6c757d', 'icon': '⏰'},
        }
        
        config = cores.get(obj.status, {'bg': '#f8f9fa', 'color': '#6c757d', 'icon': '❓'})
        
        return format_html(
            '<span style="background: {}; color: {}; padding: 4px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: 500; '
            'white-space: nowrap;">{} {}</span>',
            config['bg'], config['color'], config['icon'], obj.get_status_display()
        )
    
    @admin.display(description='Prioridade', ordering='prioridade')
    def prioridade_colorida(self, obj):
        cores = {
            'baixa': {'bg': '#e9ecef', 'color': '#6c757d', 'icon': '⬇️'},
            'normal': {'bg': '#cce5ff', 'color': '#004085', 'icon': '➡️'},
            'alta': {'bg': '#fff3cd', 'color': '#856404', 'icon': '⬆️'},
            'urgente': {'bg': '#f8d7da', 'color': '#721c24', 'icon': '🚨'},
        }
        
        config = cores.get(obj.prioridade, cores['normal'])
        
        return format_html(
            '<span style="background: {}; color: {}; padding: 3px 6px; '
            'border-radius: 8px; font-size: 10px; font-weight: bold; '
            'white-space: nowrap;">{} {}</span>',
            config['bg'], config['color'], config['icon'], obj.get_prioridade_display()
        )
    
    @admin.display(description='Situação do Prazo')
    def prazo_situacao(self, obj):
        hoje = timezone.now().date()
        
        # Determina qual prazo verificar baseado no status
        if obj.status == 'aguardando_defesa' and obj.prazo_defesa:
            prazo = obj.prazo_defesa
            tipo = 'Defesa'
        elif obj.status == 'aguardando_recurso' and obj.prazo_recurso:
            prazo = obj.prazo_recurso
            tipo = 'Recurso'
        else:
            return format_html('<span style="color: #6c757d;">N/A</span>')
        
        dias = (prazo - hoje).days
        
        if dias < 0:
            # Vencido
            cor = '#dc3545'
            icone = '🔴'
            texto = f'{tipo}: {abs(dias)} dias vencido'
        elif dias <= 7:
            # Próximo do vencimento
            cor = '#ffc107'
            icone = '🟡'
            texto = f'{tipo}: {dias} dias restantes'
        else:
            # Em dia
            cor = '#28a745'
            icone = '🟢'
            texto = f'{tipo}: {dias} dias restantes'
        
        return format_html(
            '<div style="color: {}; font-size: 12px;">'
            '<div>{} <strong>{}</strong></div>'
            '<div style="font-size: 10px; color: #666;">{}</div>'
            '</div>',
            cor, icone, texto, prazo.strftime('%d/%m/%Y')
        )
    
    @admin.display(description='Valor da Multa', ordering='valor_multa')
    def valor_multa_formatado(self, obj):
        if obj.valor_multa:
            return format_html(
                '<span style="font-family: monospace; color: #198754; font-weight: 500;">'
                'R$ {:,.2f}</span>',
                obj.valor_multa
            )
        return '-'
    
    @admin.display(description='Dias em Tramitação')
    def dias_tramitacao(self, obj):
        dias = obj.tempo_tramitacao
        
        if dias <= 30:
            cor = '#28a745'  # Verde
        elif dias <= 90:
            cor = '#ffc107'  # Amarelo
        else:
            cor = '#dc3545'  # Vermelho
        
        return format_html(
            '<span style="color: {}; font-weight: 500;">{} dias</span>',
            cor, dias
        )
    
    @admin.display(description='Ações')
    def acoes_rapidas(self, obj):
        acoes = []
        
        # Link para ver detalhes do auto de infração
        if obj.auto_infracao:
            auto_url = reverse('admin:fiscalizacao_autoinfracao_change', args=[obj.auto_infracao.pk])
            acoes.append(f'<a href="{auto_url}" title="Ver Auto de Infração">📄</a>')
        
        # Link para adicionar documento
        doc_url = f"/admin/fiscalizacao/documentoprocesso/add/?processo={obj.pk}"
        acoes.append(f'<a href="{doc_url}" title="Adicionar Documento">📎</a>')
        
        # Ação rápida baseada no status
        if obj.status == 'aguardando_defesa' and obj.prazo_vencido:
            acoes.append('<span title="Prazo Vencido" style="color: red;">⚠️</span>')
        
        return format_html(' '.join(acoes))
    
    # === ACTIONS ===
    
    @admin.action(description='Marcar processos selecionados como Alta Prioridade')
    def marcar_alta_prioridade(self, request, queryset):
        updated = queryset.update(prioridade='alta')
        self.message_user(
            request,
            f'{updated} processo(s) marcado(s) como Alta Prioridade.',
        )
    
    @admin.action(description='Arquivar processos selecionados')
    def arquivar_processos(self, request, queryset):
        # Só arquiva processos que podem ser arquivados
        arquivaveis = queryset.exclude(
            status__in=['arquivado', 'finalizado_procedente', 'finalizado_improcedente']
        )
        
        count = 0
        for processo in arquivaveis:
            processo.atualizar_status('arquivado', 'Arquivado via ação em massa do admin')
            count += 1
        
        self.message_user(
            request,
            f'{count} processo(s) arquivado(s).',
        )
    
    # === CONFIGURAÇÕES ADICIONAIS ===
    
    def get_queryset(self, request):
        # Otimiza queries
        return super().get_queryset(request).select_related(
            'auto_infracao'
        ).prefetch_related('historico', 'documentos')
    
    def changelist_view(self, request, extra_context=None):
        """Adiciona estatísticas ao changelist"""
        extra_context = extra_context or {}
        
        # Estatísticas rápidas
        hoje = timezone.now().date()
        
        total_processos = Processo.objects.count()
        prazos_vencidos = Processo.objects.filter(
            models.Q(status='aguardando_defesa', prazo_defesa__lt=hoje) |
            models.Q(status='aguardando_recurso', prazo_recurso__lt=hoje)
        ).count()
        
        alta_prioridade = Processo.objects.filter(
            prioridade__in=['alta', 'urgente']
        ).exclude(
            status__in=['finalizado_procedente', 'finalizado_improcedente', 'arquivado']
        ).count()
        
        extra_context['estatisticas_processo'] = {
            'total': total_processos,
            'prazos_vencidos': prazos_vencidos,
            'alta_prioridade': alta_prioridade,
        }
        
        return super().changelist_view(request, extra_context=extra_context)


# === ADMIN PARA HISTÓRICO ===

@admin.register(HistoricoProcesso)
class HistoricoProcessoAdmin(admin.ModelAdmin):
    list_display = [
        'processo_link',
        'status_anterior',
        'status_novo', 
        'observacao_resumida',
        'usuario',
        'data_mudanca'
    ]
    
    list_filter = [
        'status_novo',
        'data_mudanca',
        'usuario'
    ]
    
    search_fields = [
        'processo__numero_processo',
        'processo__autuado',
        'observacao',
        'usuario'
    ]
    
    ordering = ['-data_mudanca']
    list_per_page = 50
    
    readonly_fields = ['data_mudanca']
    
    @admin.display(description='Processo', ordering='processo__numero_processo')
    def processo_link(self, obj):
        url = reverse('admin:fiscalizacao_processo_change', args=[obj.processo.pk])
        return format_html(
            '<a href="{}" style="font-family: monospace;">{}</a>',
            url, obj.processo.numero_processo
        )
    
    @admin.display(description='Observação')
    def observacao_resumida(self, obj):
        obs = obj.observacao or ''
        if len(obs) > 50:
            obs = obs[:47] + '...'
        return obs


# === ADMIN PARA DOCUMENTOS ===

@admin.register(DocumentoProcesso)
class DocumentoProcessoAdmin(admin.ModelAdmin):
    list_display = [
        'processo_link',
        'tipo_badge',
        'titulo',
        'arquivo_link',
        'usuario_upload',
        'data_upload'
    ]
    
    list_filter = [
        'tipo',
        'data_upload'
    ]
    
    search_fields = [
        'processo__numero_processo',
        'processo__autuado',
        'titulo',
        'descricao'
    ]
    
    ordering = ['-data_upload']
    list_per_page = 25
    
    readonly_fields = ['data_upload']
    
    fieldsets = (
        ('Documento', {
            'fields': ('processo', 'tipo', 'titulo', 'arquivo')
        }),
        ('Detalhes', {
            'fields': ('descricao', 'usuario_upload', 'data_upload'),
            'classes': ('wide',)
        }),
    )
    
    @admin.display(description='Processo', ordering='processo__numero_processo')
    def processo_link(self, obj):
        url = reverse('admin:fiscalizacao_processo_change', args=[obj.processo.pk])
        return format_html(
            '<a href="{}">{}</a><br>'
            '<small style="color: #666;">{}</small>',
            url, obj.processo.numero_processo, obj.processo.autuado[:30] + '...' if len(obj.processo.autuado) > 30 else obj.processo.autuado
        )
    
    @admin.display(description='Tipo', ordering='tipo')
    def tipo_badge(self, obj):
        cores = {
            'defesa': {'bg': '#d4edda', 'color': '#155724'},
            'recurso': {'bg': '#fff3cd', 'color': '#856404'},
            'parecer': {'bg': '#cce5ff', 'color': '#004085'},
            'decisao': {'bg': '#f8d7da', 'color': '#721c24'},
            'outros': {'bg': '#e9ecef', 'color': '#6c757d'},
        }
        
        config = cores.get(obj.tipo, cores['outros'])
        
        return format_html(
            '<span style="background: {}; color: {}; padding: 3px 8px; '
            'border-radius: 8px; font-size: 11px; font-weight: 500;">{}</span>',
            config['bg'], config['color'], obj.get_tipo_display()
        )
    
    @admin.display(description='Arquivo')
    def arquivo_link(self, obj):
        if obj.arquivo:
            # Calcula tamanho do arquivo
            try:
                size = obj.arquivo.size
                if size < 1024:
                    size_str = f"{size} B"
                elif size < 1024**2:
                    size_str = f"{size/1024:.1f} KB"
                else:
                    size_str = f"{size/(1024**2):.1f} MB"
            except:
                size_str = "N/A"
            
            return format_html(
                '<a href="{}" target="_blank" style="text-decoration: none;">'
                '📄 Download</a><br>'
                '<small style="color: #666;">{}</small>',
                obj.arquivo.url, size_str
            )
        return '-'


# === MELHORIAS NO ADMIN ORIGINAL (se já existir) ===

# Adicione estas melhorias ao ProcessoAdmin existente se você já tiver um:
def melhorar_admin_processo_existente():
    """
    Função helper para melhorar admin existente.
    Use estas configurações se você já tem um ProcessoAdmin.
    """
    configuracoes_extras = {
        'list_max_show_all': 200,
        'save_as': True,
        'save_on_top': True,
        'preserve_filters': True,
    }
    
    # CSS customizado (adicionar em Media class)
    css_customizado = """
    <style>
    .processo-vencido { background-color: #ffe6e6; }
    .processo-urgente { background-color: #fff2e6; }
    .processo-finalizado { background-color: #e6f7e6; }
    
    .prazo-vencido { 
        color: #dc3545; 
        font-weight: bold; 
    }
    
    .prazo-proximo {
        color: #ffc107;
        font-weight: bold;
    }
    
    .valor-multa {
        font-family: 'Courier New', monospace;
        color: #198754;
        font-weight: 500;
    }
    </style>
    """
    
    return configuracoes_extras, css_customizado


# === FUNÇÃO PARA REGISTRAR TODOS OS ADMINS ===
def registrar_admins_processo():
    """
    Registra todos os admins relacionados a processo.
    Chame esta função no final do admin.py se necessário.
    """
    try:
        # Verifica se já estão registrados
        admin.site.unregister(Processo)
        admin.site.unregister(HistoricoProcesso)
        admin.site.unregister(DocumentoProcesso)
    except:
        pass  # Não estavam registrados ainda
    
    # Registra novamente com as configurações melhoradas
    admin.site.register(Processo, ProcessoAdmin)
    admin.site.register(HistoricoProcesso, HistoricoProcessoAdmin)
    admin.site.register(DocumentoProcesso, DocumentoProcessoAdmin)
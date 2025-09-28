from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    CategoriaConteudo, ConteudoPortal, FormularioPublico, BannerPortal,
    ConsultaPublica, AvaliacaoServico, ConfiguracaoPortal, EstatisticaPortal,
    PerfilCidadao
)


@admin.register(CategoriaConteudo)
class CategoriaConteudoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'icone', 'cor_display', 'ordem', 'ativo', 'criado_em']
    list_filter = ['ativo', 'criado_em']
    search_fields = ['nome', 'descricao']
    ordering = ['ordem', 'nome']
    
    fieldsets = (
        ('Dados Básicos', {
            'fields': ('nome', 'descricao')
        }),
        ('Aparência', {
            'fields': ('icone', 'cor', 'ordem')
        }),
        ('Status', {
            'fields': ('ativo',)
        }),
    )
    
    def cor_display(self, obj):
        return format_html(
            '<span style="display: inline-block; width: 20px; height: 20px; '
            'background-color: {}; border: 1px solid #ccc; margin-right: 5px;"></span>{}',
            obj.cor, obj.cor
        )
    cor_display.short_description = 'Cor'


@admin.register(ConteudoPortal)
class ConteudoPortalAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'categoria', 'tipo', 'destaque_display', 'ativo',
        'visualizacoes', 'data_publicacao', 'autor'
    ]
    list_filter = [
        'categoria', 'tipo', 'destaque', 'fixo', 'ativo',
        'data_publicacao', 'autor'
    ]
    search_fields = ['titulo', 'subtitulo', 'resumo', 'conteudo', 'palavras_chave']
    ordering = ['-destaque', '-fixo', 'ordem', '-data_publicacao']
    date_hierarchy = 'data_publicacao'
    
    fieldsets = (
        ('Dados Básicos', {
            'fields': ('categoria', 'tipo', 'titulo', 'subtitulo', 'resumo')
        }),
        ('Conteúdo', {
            'fields': ('conteudo',)
        }),
        ('SEO', {
            'fields': ('slug', 'palavras_chave', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Mídia', {
            'fields': ('imagem_destaque', 'arquivo_anexo'),
            'classes': ('collapse',)
        }),
        ('Configurações', {
            'fields': ('destaque', 'fixo', 'ativo', 'ordem')
        }),
        ('Publicação', {
            'fields': ('data_publicacao', 'data_validade', 'autor', 'autor_nome')
        }),
        ('Métricas', {
            'fields': ('visualizacoes', 'downloads'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['visualizacoes', 'downloads', 'criado_em', 'atualizado_em']
    
    actions = ['marcar_destaque', 'desmarcar_destaque', 'ativar', 'desativar']
    
    def destaque_display(self, obj):
        if obj.destaque:
            return format_html('<span style="color: gold;">★ Destaque</span>')
        elif obj.fixo:
            return format_html('<span style="color: blue;">📌 Fixo</span>')
        else:
            return '-'
    destaque_display.short_description = 'Status'
    
    def marcar_destaque(self, request, queryset):
        count = queryset.update(destaque=True)
        self.message_user(request, f'{count} conteúdo(s) marcado(s) como destaque.')
    marcar_destaque.short_description = 'Marcar como destaque'
    
    def desmarcar_destaque(self, request, queryset):
        count = queryset.update(destaque=False)
        self.message_user(request, f'{count} conteúdo(s) desmarcado(s) como destaque.')
    desmarcar_destaque.short_description = 'Desmarcar destaque'
    
    def ativar(self, request, queryset):
        count = queryset.update(ativo=True)
        self.message_user(request, f'{count} conteúdo(s) ativado(s).')
    ativar.short_description = 'Ativar conteúdos'
    
    def desativar(self, request, queryset):
        count = queryset.update(ativo=False)
        self.message_user(request, f'{count} conteúdo(s) desativado(s).')
    desativar.short_description = 'Desativar conteúdos'


@admin.register(FormularioPublico)
class FormularioPublicoAdmin(admin.ModelAdmin):
    list_display = [
        'nome', 'categoria', 'versao', 'tamanho_formatado',
        'downloads', 'destaque', 'ativo', 'criado_em'
    ]
    list_filter = ['categoria', 'destaque', 'ativo', 'criado_em']
    search_fields = ['nome', 'descricao', 'instrucoes']
    ordering = ['-destaque', 'ordem', 'nome']
    
    fieldsets = (
        ('Dados Básicos', {
            'fields': ('nome', 'descricao', 'categoria', 'versao')
        }),
        ('Arquivo', {
            'fields': ('arquivo', 'tamanho_bytes')
        }),
        ('Configurações', {
            'fields': ('destaque', 'ativo', 'ordem')
        }),
        ('Instruções', {
            'fields': ('instrucoes',),
            'classes': ('collapse',)
        }),
        ('Métricas', {
            'fields': ('downloads',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['tamanho_bytes', 'downloads', 'criado_em', 'atualizado_em']
    
    actions = ['marcar_destaque', 'desmarcar_destaque']
    
    def marcar_destaque(self, request, queryset):
        count = queryset.update(destaque=True)
        self.message_user(request, f'{count} formulário(s) marcado(s) como destaque.')
    marcar_destaque.short_description = 'Marcar como destaque'
    
    def desmarcar_destaque(self, request, queryset):
        count = queryset.update(destaque=False)
        self.message_user(request, f'{count} formulário(s) desmarcado(s) como destaque.')
    desmarcar_destaque.short_description = 'Desmarcar destaque'


@admin.register(PerfilCidadao)
class PerfilCidadaoAdmin(admin.ModelAdmin):
    list_display = ['nome_completo', 'cpf', 'cidade', 'estado', 'telefone', 'criado_em']
    search_fields = ['nome_completo', 'cpf', 'cidade', 'estado', 'user__username', 'user__email']
    list_filter = ['estado', 'cidade']
    readonly_fields = ['criado_em', 'atualizado_em']
    ordering = ['nome_completo']


@admin.register(BannerPortal)
class BannerPortalAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'ativo_display', 'ordem', 'data_inicio', 'data_fim',
        'visualizacoes', 'cliques', 'criado_em'
    ]
    list_filter = ['ativo', 'data_inicio', 'data_fim']
    search_fields = ['titulo', 'subtitulo', 'texto']
    ordering = ['ordem', '-data_inicio']
    date_hierarchy = 'data_inicio'
    
    fieldsets = (
        ('Conteúdo', {
            'fields': ('titulo', 'subtitulo', 'texto')
        }),
        ('Mídia e Link', {
            'fields': ('imagem', 'link', 'link_texto')
        }),
        ('Configurações', {
            'fields': ('ativo', 'ordem')
        }),
        ('Período de Exibição', {
            'fields': ('data_inicio', 'data_fim')
        }),
        ('Métricas', {
            'fields': ('visualizacoes', 'cliques'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['visualizacoes', 'cliques', 'criado_em', 'atualizado_em']
    
    def ativo_display(self, obj):
        if obj.esta_ativo:
            return format_html('<span style="color: green;">✓ Ativo</span>')
        else:
            return format_html('<span style="color: red;">✗ Inativo</span>')
    ativo_display.short_description = 'Status'


@admin.register(ConsultaPublica)
class ConsultaPublicaAdmin(admin.ModelAdmin):
    list_display = [
        'numero_protocolo', 'tipo_consulta', 'documento_consulta',
        'ip_origem', 'data_consulta'
    ]
    list_filter = ['tipo_consulta', 'data_consulta']
    search_fields = ['numero_protocolo', 'documento_consulta', 'ip_origem']
    ordering = ['-data_consulta']
    date_hierarchy = 'data_consulta'
    
    fieldsets = (
        ('Dados da Consulta', {
            'fields': ('tipo_consulta', 'numero_protocolo', 'documento_consulta')
        }),
        ('Dados Encontrados', {
            'fields': ('dados_encontrados',),
            'classes': ('collapse',)
        }),
        ('Controle de Acesso', {
            'fields': ('ip_origem', 'user_agent'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['data_consulta']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(AvaliacaoServico)
class AvaliacaoServicoAdmin(admin.ModelAdmin):
    list_display = [
        'tipo_servico', 'nota_display', 'nome', 'numero_protocolo',
        'ip_origem', 'data_avaliacao'
    ]
    list_filter = ['tipo_servico', 'nota', 'data_avaliacao']
    search_fields = ['nome', 'email', 'numero_protocolo', 'comentario']
    ordering = ['-data_avaliacao']
    date_hierarchy = 'data_avaliacao'
    
    fieldsets = (
        ('Avaliação', {
            'fields': ('tipo_servico', 'nota')
        }),
        ('Comentários', {
            'fields': ('comentario', 'sugestao')
        }),
        ('Dados do Avaliador', {
            'fields': ('nome', 'email', 'numero_protocolo'),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('ip_origem', 'data_avaliacao'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['ip_origem', 'data_avaliacao']
    
    def nota_display(self, obj):
        stars = '★' * obj.nota + '☆' * (5 - obj.nota)
        return format_html(f'<span style="color: gold;">{stars}</span> ({obj.nota})')
    nota_display.short_description = 'Nota'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ConfiguracaoPortal)
class ConfiguracaoPortalAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Informações da Instituição', {
            'fields': (
                'nome_instituicao', 'endereco', 'telefone', 'email', 'site'
            )
        }),
        ('Funcionamento', {
            'fields': ('horario_funcionamento',)
        }),
        ('Redes Sociais', {
            'fields': ('facebook', 'instagram', 'twitter', 'youtube'),
            'classes': ('collapse',)
        }),
        ('Configurações do Portal', {
            'fields': ('manutencao', 'mensagem_manutencao')
        }),
        ('Sobre a Instituição', {
            'fields': ('sobre_instituicao', 'missao', 'visao', 'valores'),
            'classes': ('collapse',)
        }),
        ('Configurações Funcionais', {
            'fields': (
                'permitir_consulta_publica', 'exigir_captcha', 'permitir_avaliacao'
            )
        }),
        ('Analytics', {
            'fields': ('google_analytics_id',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Permite apenas uma configuração
        return not ConfiguracaoPortal.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Não permite deletar a configuração
        return False


@admin.register(EstatisticaPortal)
class EstatisticaPortalAdmin(admin.ModelAdmin):
    list_display = [
        'data', 'visitas_unicas', 'pageviews', 'consultas_realizadas',
        'formularios_baixados', 'avaliacoes_recebidas', 'tempo_medio_sessao'
    ]
    list_filter = ['data']
    ordering = ['-data']
    date_hierarchy = 'data'
    
    fieldsets = (
        ('Data', {
            'fields': ('data',)
        }),
        ('Acessos', {
            'fields': ('visitas_unicas', 'pageviews')
        }),
        ('Ações', {
            'fields': ('consultas_realizadas', 'formularios_baixados', 'avaliacoes_recebidas')
        }),
        ('Engajamento', {
            'fields': ('tempo_medio_sessao',)
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

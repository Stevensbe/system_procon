from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    AnaliseJuridica, ParecerTecnico, DecisaoAdministrativa,
    RecursoAdministrativo, DocumentoJuridico, ConfiguracaoAnalise
)


@admin.register(AnaliseJuridica)
class AnaliseJuridicaAdmin(admin.ModelAdmin):
    list_display = [
        'numero_analise', 'assunto', 'tipo_processo', 'status',
        'analista_responsavel', 'prioridade', 'prazo_analise_display',
        'esta_no_prazo_display', 'criado_em'
    ]
    list_filter = [
        'status', 'tipo_processo', 'complexidade', 'prioridade',
        'analista_responsavel', 'supervisor', 'criado_em'
    ]
    search_fields = [
        'numero_analise', 'numero_processo', 'assunto',
        'empresa_nome', 'empresa_cnpj', 'resumo_fatos'
    ]
    ordering = ['-criado_em']
    date_hierarchy = 'criado_em'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_analise', 'uuid', 'tipo_processo', 'numero_processo')
        }),
        ('Dados Básicos', {
            'fields': ('assunto', 'resumo_fatos', 'questoes_juridicas')
        }),
        ('Status e Controle', {
            'fields': ('status', 'complexidade', 'prioridade')
        }),
        ('Responsáveis', {
            'fields': ('analista_responsavel', 'supervisor', 'relator')
        }),
        ('Dados da Empresa/Autuado', {
            'fields': ('empresa_nome', 'empresa_cnpj', 'empresa_endereco'),
            'classes': ('collapse',)
        }),
        ('Valores', {
            'fields': ('valor_multa_aplicada', 'valor_multa_final'),
            'classes': ('collapse',)
        }),
        ('Prazos', {
            'fields': ('prazo_analise', 'prazo_decisao')
        }),
        ('Datas Importantes', {
            'fields': (
                'data_distribuicao', 'data_inicio_analise',
                'data_conclusao_analise', 'data_decisao', 'data_finalizacao'
            ),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes', 'observacoes_internas'),
            'classes': ('collapse',)
        }),
        ('Relações com Outros Módulos', {
            'fields': ('processo_fiscalizacao_id', 'peticao_id', 'protocolo_id'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['numero_analise', 'uuid', 'data_distribuicao', 'criado_em', 'atualizado_em']
    
    actions = ['iniciar_analise', 'finalizar_analise', 'arquivar_analise']
    
    def prazo_analise_display(self, obj):
        if not obj.prazo_analise:
            return '-'
        
        if obj.prazo_analise < timezone.now():
            return format_html(
                '<span style="color: red; font-weight: bold;">{}</span>',
                obj.prazo_analise.strftime('%d/%m/%Y %H:%M')
            )
        elif obj.dias_para_vencimento <= 3:
            return format_html(
                '<span style="color: orange; font-weight: bold;">{}</span>',
                obj.prazo_analise.strftime('%d/%m/%Y %H:%M')
            )
        else:
            return obj.prazo_analise.strftime('%d/%m/%Y %H:%M')
    prazo_analise_display.short_description = 'Prazo de Análise'
    
    def esta_no_prazo_display(self, obj):
        if obj.esta_no_prazo:
            return format_html('<span style="color: green;">✓ No prazo</span>')
        else:
            return format_html('<span style="color: red;">✗ Vencido</span>')
    esta_no_prazo_display.short_description = 'Situação'
    
    def iniciar_analise(self, request, queryset):
        count = 0
        for analise in queryset:
            if analise.status == 'PENDENTE':
                analise.status = 'EM_ANALISE'
                analise.data_inicio_analise = timezone.now()
                analise.save()
                count += 1
        
        self.message_user(request, f'{count} análise(s) iniciada(s) com sucesso.')
    iniciar_analise.short_description = 'Iniciar análise selecionadas'
    
    def finalizar_analise(self, request, queryset):
        count = 0
        for analise in queryset:
            if analise.status in ['EM_ANALISE', 'PARECER_ELABORADO', 'REVISAO']:
                analise.status = 'FINALIZADO'
                analise.data_finalizacao = timezone.now()
                analise.save()
                count += 1
        
        self.message_user(request, f'{count} análise(s) finalizada(s) com sucesso.')
    finalizar_analise.short_description = 'Finalizar análises selecionadas'
    
    def arquivar_analise(self, request, queryset):
        count = queryset.update(status='ARQUIVADO')
        self.message_user(request, f'{count} análise(s) arquivada(s) com sucesso.')
    arquivar_analise.short_description = 'Arquivar análises selecionadas'


@admin.register(ParecerTecnico)
class ParecerTecnicoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_parecer', 'analise', 'tipo_parecer', 'conclusao',
        'elaborado_por', 'status', 'data_revisao', 'data_aprovacao', 'criado_em'
    ]
    list_filter = [
        'tipo_parecer', 'conclusao', 'status', 'elaborado_por',
        'revisado_por', 'aprovado_por', 'criado_em'
    ]
    search_fields = [
        'numero_parecer', 'titulo', 'analise__numero_analise',
        'analise__assunto', 'relatorio', 'fundamentacao_juridica'
    ]
    ordering = ['-criado_em']
    date_hierarchy = 'criado_em'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_parecer', 'analise', 'tipo_parecer')
        }),
        ('Conteúdo do Parecer', {
            'fields': (
                'titulo', 'relatorio', 'fundamentacao_tecnica',
                'fundamentacao_juridica', 'conclusao', 'recomendacoes'
            )
        }),
        ('Base Legal', {
            'fields': ('legislacao_aplicada', 'jurisprudencia', 'doutrina'),
            'classes': ('collapse',)
        }),
        ('Responsável', {
            'fields': ('elaborado_por', 'cargo_elaborador')
        }),
        ('Revisão', {
            'fields': ('revisado_por', 'data_revisao', 'observacoes_revisao'),
            'classes': ('collapse',)
        }),
        ('Aprovação', {
            'fields': ('aprovado_por', 'data_aprovacao')
        }),
        ('Arquivo', {
            'fields': ('arquivo_parecer',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['numero_parecer', 'criado_em', 'atualizado_em']
    
    actions = ['marcar_como_elaborado', 'enviar_para_revisao', 'aprovar_parecer']
    
    def marcar_como_elaborado(self, request, queryset):
        count = queryset.filter(status='RASCUNHO').update(status='ELABORADO')
        self.message_user(request, f'{count} parecer(es) marcado(s) como elaborado(s).')
    marcar_como_elaborado.short_description = 'Marcar como elaborado'
    
    def enviar_para_revisao(self, request, queryset):
        count = queryset.filter(status='ELABORADO').update(status='EM_REVISAO')
        self.message_user(request, f'{count} parecer(es) enviado(s) para revisão.')
    enviar_para_revisao.short_description = 'Enviar para revisão'
    
    def aprovar_parecer(self, request, queryset):
        count = 0
        for parecer in queryset:
            if parecer.status == 'EM_REVISAO':
                parecer.status = 'APROVADO'
                parecer.data_aprovacao = timezone.now()
                parecer.aprovado_por = request.user
                parecer.save()
                count += 1
        
        self.message_user(request, f'{count} parecer(es) aprovado(s) com sucesso.')
    aprovar_parecer.short_description = 'Aprovar pareceres selecionados'


@admin.register(DecisaoAdministrativa)
class DecisaoAdministrativaAdmin(admin.ModelAdmin):
    list_display = [
        'numero_decisao', 'analise', 'tipo_decisao', 'julgador',
        'data_julgamento', 'data_publicacao', 'transitou_em_julgado_display',
        'recurso_apresentado', 'cumprida'
    ]
    list_filter = [
        'tipo_decisao', 'julgador', 'permite_recurso', 'recurso_apresentado',
        'cumprida', 'notificado_interessado', 'data_julgamento'
    ]
    search_fields = [
        'numero_decisao', 'titulo', 'analise__numero_analise',
        'analise__assunto', 'ementa', 'relatorio', 'dispositivo'
    ]
    ordering = ['-data_julgamento']
    date_hierarchy = 'data_julgamento'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_decisao', 'analise', 'tipo_decisao')
        }),
        ('Conteúdo da Decisão', {
            'fields': ('titulo', 'ementa', 'relatorio', 'fundamentacao', 'dispositivo')
        }),
        ('Valores Decididos', {
            'fields': ('valor_multa_decidido', 'percentual_reducao'),
            'classes': ('collapse',)
        }),
        ('Prazos', {
            'fields': ('prazo_cumprimento_dias', 'prazo_recurso_dias')
        }),
        ('Autoridade Julgadora', {
            'fields': ('julgador', 'cargo_julgador')
        }),
        ('Controle Processual', {
            'fields': (
                'data_julgamento', 'data_publicacao', 'data_transito_julgado'
            )
        }),
        ('Recursos', {
            'fields': (
                'permite_recurso', 'recurso_apresentado', 'data_recurso'
            ),
            'classes': ('collapse',)
        }),
        ('Cumprimento', {
            'fields': ('cumprida', 'data_cumprimento', 'forma_cumprimento'),
            'classes': ('collapse',)
        }),
        ('Notificações', {
            'fields': (
                'notificado_interessado', 'data_notificacao', 'forma_notificacao'
            ),
            'classes': ('collapse',)
        }),
        ('Arquivo', {
            'fields': ('arquivo_decisao',),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['numero_decisao', 'criado_em', 'atualizado_em']
    
    actions = ['publicar_decisao', 'marcar_transito_julgado', 'marcar_cumprida']
    
    def transitou_em_julgado_display(self, obj):
        if obj.transitou_em_julgado:
            return format_html('<span style="color: green;">✓ Sim</span>')
        else:
            return format_html('<span style="color: orange;">⧖ Não</span>')
    transitou_em_julgado_display.short_description = 'Trânsito em Julgado'
    
    def publicar_decisao(self, request, queryset):
        count = 0
        for decisao in queryset:
            if not decisao.data_publicacao:
                decisao.data_publicacao = timezone.now()
                decisao.save()
                count += 1
        
        self.message_user(request, f'{count} decisão(ões) publicada(s) com sucesso.')
    publicar_decisao.short_description = 'Publicar decisões selecionadas'
    
    def marcar_transito_julgado(self, request, queryset):
        count = 0
        for decisao in queryset:
            if not decisao.data_transito_julgado and decisao.prazo_recurso_vencido:
                decisao.data_transito_julgado = timezone.now()
                decisao.save()
                count += 1
        
        self.message_user(request, f'{count} decisão(ões) marcada(s) como transitada(s) em julgado.')
    marcar_transito_julgado.short_description = 'Marcar trânsito em julgado'
    
    def marcar_cumprida(self, request, queryset):
        count = 0
        for decisao in queryset:
            if not decisao.cumprida:
                decisao.cumprida = True
                decisao.data_cumprimento = timezone.now()
                decisao.save()
                count += 1
        
        self.message_user(request, f'{count} decisão(ões) marcada(s) como cumprida(s).')
    marcar_cumprida.short_description = 'Marcar como cumpridas'


@admin.register(RecursoAdministrativo)
class RecursoAdministrativoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_recurso', 'decisao_recorrida', 'tipo_recurso',
        'recorrente_nome', 'status', 'relator', 'data_protocolo',
        'prazo_julgamento', 'data_julgamento'
    ]
    list_filter = [
        'tipo_recurso', 'status', 'relator', 'data_protocolo', 'data_julgamento'
    ]
    search_fields = [
        'numero_recurso', 'recorrente_nome', 'recorrente_documento',
        'representante_nome', 'fundamentacao', 'pedidos'
    ]
    ordering = ['-data_protocolo']
    date_hierarchy = 'data_protocolo'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_recurso', 'decisao_recorrida', 'tipo_recurso')
        }),
        ('Dados do Recorrente', {
            'fields': (
                'recorrente_nome', 'recorrente_documento', 'representante_nome'
            )
        }),
        ('Conteúdo do Recurso', {
            'fields': ('fundamentacao', 'pedidos', 'valor_causas')
        }),
        ('Processamento', {
            'fields': ('status', 'relator')
        }),
        ('Prazos', {
            'fields': ('data_protocolo', 'prazo_julgamento', 'data_julgamento')
        }),
        ('Resultado', {
            'fields': ('resultado', 'valor_final_recurso'),
            'classes': ('collapse',)
        }),
        ('Arquivos', {
            'fields': ('arquivo_recurso', 'arquivo_decisao_recurso'),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['numero_recurso', 'data_protocolo', 'criado_em', 'atualizado_em']
    
    actions = ['iniciar_analise_recurso', 'julgar_provido', 'julgar_improvido']
    
    def iniciar_analise_recurso(self, request, queryset):
        count = queryset.filter(status='PROTOCOLADO').update(status='EM_ANALISE')
        self.message_user(request, f'{count} recurso(s) enviado(s) para análise.')
    iniciar_analise_recurso.short_description = 'Iniciar análise dos recursos'
    
    def julgar_provido(self, request, queryset):
        count = 0
        for recurso in queryset:
            if recurso.status == 'EM_ANALISE':
                recurso.status = 'JULGADO_PROVIDO'
                recurso.data_julgamento = timezone.now()
                recurso.save()
                count += 1
        
        self.message_user(request, f'{count} recurso(s) julgado(s) como provido(s).')
    julgar_provido.short_description = 'Julgar como providos'
    
    def julgar_improvido(self, request, queryset):
        count = 0
        for recurso in queryset:
            if recurso.status == 'EM_ANALISE':
                recurso.status = 'JULGADO_IMPROVIDO'
                recurso.data_julgamento = timezone.now()
                recurso.save()
                count += 1
        
        self.message_user(request, f'{count} recurso(s) julgado(s) como improvido(s).')
    julgar_improvido.short_description = 'Julgar como improvidos'


@admin.register(DocumentoJuridico)
class DocumentoJuridicoAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'analise', 'tipo_documento', 'nome_arquivo_original',
        'tamanho_formatado', 'enviado_por', 'data_envio', 'validado'
    ]
    list_filter = [
        'tipo_documento', 'validado', 'enviado_por', 'validado_por', 'data_envio'
    ]
    search_fields = [
        'titulo', 'descricao', 'analise__numero_analise',
        'nome_arquivo_original', 'hash_arquivo'
    ]
    ordering = ['-data_envio']
    date_hierarchy = 'data_envio'
    
    fieldsets = (
        ('Dados do Documento', {
            'fields': ('analise', 'tipo_documento', 'titulo', 'descricao')
        }),
        ('Arquivo', {
            'fields': (
                'arquivo', 'nome_arquivo_original', 'tamanho_bytes',
                'tipo_mime', 'hash_arquivo'
            )
        }),
        ('Dados de Envio', {
            'fields': ('enviado_por', 'data_envio')
        }),
        ('Validação', {
            'fields': (
                'validado', 'validado_por', 'data_validacao', 'observacoes_validacao'
            ),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['data_envio', 'tamanho_bytes', 'tipo_mime', 'hash_arquivo']
    
    actions = ['validar_documentos', 'invalidar_documentos']
    
    def validar_documentos(self, request, queryset):
        count = 0
        for documento in queryset:
            if not documento.validado:
                documento.validado = True
                documento.validado_por = request.user
                documento.data_validacao = timezone.now()
                documento.save()
                count += 1
        
        self.message_user(request, f'{count} documento(s) validado(s) com sucesso.')
    validar_documentos.short_description = 'Validar documentos selecionados'
    
    def invalidar_documentos(self, request, queryset):
        count = queryset.filter(validado=True).update(
            validado=False,
            validado_por=None,
            data_validacao=None
        )
        self.message_user(request, f'{count} documento(s) invalidado(s).')
    invalidar_documentos.short_description = 'Invalidar documentos selecionados'


@admin.register(ConfiguracaoAnalise)
class ConfiguracaoAnaliseAdmin(admin.ModelAdmin):
    list_display = [
        '__str__', 'prazo_analise_dias', 'prazo_parecer_dias',
        'prazo_decisao_dias', 'notificar_prazo_vencimento',
        'exigir_revisao_parecer', 'exigir_aprovacao_supervisor'
    ]
    
    fieldsets = (
        ('Prazos Padrão', {
            'fields': (
                'prazo_analise_dias', 'prazo_parecer_dias',
                'prazo_decisao_dias', 'prazo_recurso_dias'
            )
        }),
        ('Notificações', {
            'fields': (
                'notificar_prazo_vencimento', 'dias_antecedencia_notificacao',
                'email_coordenacao', 'email_supervisao'
            )
        }),
        ('Configurações de Documento', {
            'fields': (
                'tamanho_maximo_documento_mb', 'tipos_arquivo_permitidos'
            )
        }),
        ('Fluxo de Trabalho', {
            'fields': ('exigir_revisao_parecer', 'exigir_aprovacao_supervisor')
        }),
        ('Templates', {
            'fields': ('template_parecer', 'template_decisao'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Permite apenas uma configuração
        return not ConfiguracaoAnalise.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Não permite deletar a configuração
        return False


# Personalização do admin site
admin.site.site_header = "SISPROCON - Sistema de Controle de Processos Administrativos"
admin.site.site_title = "SISPROCON Admin"
admin.site.index_title = "Administração do Sistema"

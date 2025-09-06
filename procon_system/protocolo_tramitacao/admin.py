from django.contrib import admin
from .models import TipoDocumento, Setor, ProtocoloDocumento, AnexoProtocolo, TramitacaoDocumento, ConfiguracaoProtocolo


@admin.register(TipoDocumento)
class TipoDocumentoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'prazo_resposta_dias', 'requer_assinatura', 'ativo', 'criado_em']
    list_filter = ['ativo', 'requer_assinatura']
    search_fields = ['nome', 'descricao']
    ordering = ['nome']


@admin.register(Setor)
class SetorAdmin(admin.ModelAdmin):
    list_display = ['sigla', 'nome', 'responsavel', 'pode_protocolar', 'pode_tramitar', 'ativo']
    list_filter = ['ativo', 'pode_protocolar', 'pode_tramitar']
    search_fields = ['nome', 'sigla']
    ordering = ['nome']


class AnexoProtocoloInline(admin.TabularInline):
    model = AnexoProtocolo
    extra = 0
    readonly_fields = ['hash_arquivo', 'tamanho_bytes', 'upload_em']


class TramitacaoDocumentoInline(admin.TabularInline):
    model = TramitacaoDocumento
    extra = 0
    readonly_fields = ['hash_tramitacao', 'data_tramitacao', 'data_recebimento']


@admin.register(ProtocoloDocumento)
class ProtocoloDocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_protocolo', 'assunto', 'tipo_documento', 'status', 
        'setor_atual', 'prioridade', 'esta_no_prazo', 'data_protocolo'
    ]
    list_filter = [
        'status', 'prioridade', 'origem', 'tipo_documento', 
        'setor_atual', 'data_protocolo', 'sigiloso'
    ]
    search_fields = [
        'numero_protocolo', 'assunto', 'remetente_nome', 
        'remetente_documento', 'descricao'
    ]
    readonly_fields = [
        'numero_protocolo', 'uuid', 'data_protocolo', 'atualizado_em',
        'esta_no_prazo', 'dias_para_vencimento'
    ]
    
    inlines = [AnexoProtocoloInline, TramitacaoDocumentoInline]
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_protocolo', 'uuid', 'tipo_documento', 'origem')
        }),
        ('Conteúdo', {
            'fields': ('assunto', 'descricao', 'observacoes', 'sigiloso')
        }),
        ('Remetente', {
            'fields': (
                'remetente_nome', 'remetente_documento', 'remetente_email',
                'remetente_telefone', 'remetente_endereco'
            )
        }),
        ('Tramitação', {
            'fields': (
                'status', 'prioridade', 'setor_atual', 'setor_origem',
                'responsavel_atual'
            )
        }),
        ('Prazos', {
            'fields': (
                'prazo_resposta', 'esta_no_prazo', 'dias_para_vencimento',
                'data_protocolo', 'data_conclusao'
            )
        }),
        ('Controle', {
            'fields': ('protocolado_por', 'atualizado_em')
        }),
    )
    
    def esta_no_prazo(self, obj):
        return "✅ Sim" if obj.esta_no_prazo else "❌ Não"
    esta_no_prazo.short_description = "No Prazo"


@admin.register(TramitacaoDocumento)
class TramitacaoDocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'protocolo', 'acao', 'setor_origem', 'setor_destino',
        'usuario', 'data_tramitacao', 'data_recebimento'
    ]
    list_filter = [
        'acao', 'setor_origem', 'setor_destino', 'data_tramitacao'
    ]
    search_fields = [
        'protocolo__numero_protocolo', 'motivo', 'observacoes'
    ]
    readonly_fields = ['hash_tramitacao', 'data_tramitacao']
    
    fieldsets = (
        ('Tramitação', {
            'fields': ('protocolo', 'acao', 'setor_origem', 'setor_destino')
        }),
        ('Detalhes', {
            'fields': ('motivo', 'observacoes', 'prazo_dias')
        }),
        ('Controle', {
            'fields': (
                'usuario', 'data_tramitacao', 'data_recebimento',
                'recebido_por', 'hash_tramitacao'
            )
        }),
    )


@admin.register(ConfiguracaoProtocolo)
class ConfiguracaoProtocoloAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Numeração', {
            'fields': ('formato_protocolo', 'prefixo_protocolo')
        }),
        ('Prazos', {
            'fields': ('prazo_padrao_dias', 'prazo_urgente_dias')
        }),
        ('Notificações', {
            'fields': (
                'notificar_vencimento_dias', 'notificar_responsavel', 'notificar_setor'
            )
        }),
        ('Arquivos', {
            'fields': ('tamanho_maximo_mb', 'tipos_arquivo_permitidos')
        }),
        ('Backup', {
            'fields': ('dias_backup_automatico', 'dias_arquivamento_automatico')
        }),
    )

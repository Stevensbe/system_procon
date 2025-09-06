from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    TipoPeticao, PeticaoEletronica, AnexoPeticao,
    InteracaoPeticao, RespostaPeticao, ConfiguracaoPeticionamento
)


@admin.register(TipoPeticao)
class TipoPeticaoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'categoria', 'prazo_resposta_dias', 'requer_documentos', 'permite_anonimo', 'ativo', 'ordem_exibicao']
    list_filter = ['categoria', 'requer_documentos', 'permite_anonimo', 'notificar_email', 'notificar_sms', 'ativo']
    search_fields = ['nome', 'descricao']
    ordering = ['ordem_exibicao', 'nome']
    list_editable = ['ativo', 'ordem_exibicao']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'descricao', 'categoria')
        }),
        ('Configurações', {
            'fields': ('prazo_resposta_dias', 'requer_documentos', 'permite_anonimo')
        }),
        ('Notificações', {
            'fields': ('notificar_email', 'notificar_sms')
        }),
        ('Formulário Dinâmico', {
            'fields': ('campos_obrigatorios', 'campos_opcionais'),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': ('ativo', 'ordem_exibicao')
        }),
    )


@admin.register(PeticaoEletronica)
class PeticaoEletronicaAdmin(admin.ModelAdmin):
    list_display = [
        'numero_peticao', 'tipo_peticao', 'assunto', 'status', 'prioridade',
        'peticionario_nome', 'peticionario_documento', 'data_envio', 'prazo_resposta',
        'esta_no_prazo', 'dias_para_vencimento'
    ]
    list_filter = [
        'status', 'prioridade', 'tipo_peticao', 'origem', 'anonima', 'confidencial',
        'data_envio'
    ]
    search_fields = [
        'numero_peticao', 'protocolo_numero', 'assunto', 'peticionario_nome',
        'peticionario_documento', 'empresa_nome', 'empresa_cnpj'
    ]
    readonly_fields = [
        'numero_peticao', 'protocolo_numero', 'uuid', 'data_envio',
        'prazo_resposta', 'criado_em', 'atualizado_em',
        'esta_no_prazo', 'dias_para_vencimento'
    ]
    ordering = ['-criado_em']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_peticao', 'protocolo_numero', 'uuid')
        }),
        ('Tipo e Origem', {
            'fields': ('tipo_peticao', 'origem')
        }),
        ('Dados Básicos', {
            'fields': ('assunto', 'descricao', 'observacoes', 'status', 'prioridade')
        }),
        ('Peticionário', {
            'fields': (
                'peticionario_nome', 'peticionario_documento', 'peticionario_email',
                'peticionario_telefone', 'peticionario_endereco', 'peticionario_cep',
                'peticionario_cidade', 'peticionario_uf'
            )
        }),
        ('Empresa Reclamada', {
            'fields': (
                'empresa_nome', 'empresa_cnpj', 'empresa_endereco',
                'empresa_telefone', 'empresa_email'
            )
        }),
        ('Dados da Causa', {
            'fields': ('valor_causa', 'data_fato', 'dados_especificos')
        }),
        ('Datas', {
            'fields': ('data_envio', 'prazo_resposta')
        }),
        ('Controle', {
            'fields': ('usuario_criacao', 'responsavel_atual', 'anonima', 'confidencial', 'notificar_peticionario')
        }),
        ('Metadados', {
            'fields': ('ip_origem', 'user_agent', 'criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        }),
        ('Propriedades Calculadas', {
            'fields': ('esta_no_prazo', 'dias_para_vencimento'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AnexoPeticao)
class AnexoPeticaoAdmin(admin.ModelAdmin):
    list_display = ['nome_original', 'peticao', 'tipo', 'tamanho_formatado', 'enviado_por', 'data_upload']
    list_filter = ['tipo', 'data_upload']
    search_fields = ['nome_original', 'descricao', 'peticao__numero_peticao']
    readonly_fields = ['tamanho_formatado', 'data_upload']
    ordering = ['-data_upload']
    
    fieldsets = (
        ('Arquivo', {
            'fields': ('peticao', 'arquivo', 'nome_original', 'tipo', 'descricao')
        }),
        ('Metadados', {
            'fields': ('tamanho_bytes', 'extensao', 'tamanho_formatado')
        }),
        ('Controle', {
            'fields': ('enviado_por', 'data_upload')
        }),
    )


@admin.register(InteracaoPeticao)
class InteracaoPeticaoAdmin(admin.ModelAdmin):
    list_display = ['peticao', 'tipo_interacao', 'titulo', 'usuario', 'data_interacao']
    list_filter = ['tipo_interacao', 'data_interacao']
    search_fields = ['titulo', 'descricao', 'peticao__numero_peticao']
    readonly_fields = ['data_interacao']
    ordering = ['-data_interacao']
    
    fieldsets = (
        ('Interação', {
            'fields': ('peticao', 'tipo_interacao', 'titulo', 'descricao', 'observacoes')
        }),
        ('Mudanças de Status', {
            'fields': ('status_anterior', 'status_novo')
        }),
        ('Usuário', {
            'fields': ('usuario', 'nome_usuario')
        }),
        ('Sistema', {
            'fields': ('ip_origem', 'user_agent', 'arquivo_anexo', 'data_interacao')
        }),
    )


@admin.register(RespostaPeticao)
class RespostaPeticaoAdmin(admin.ModelAdmin):
    list_display = ['peticao', 'tipo_resposta', 'titulo', 'responsavel', 'data_elaboracao', 'data_envio']
    list_filter = ['tipo_resposta', 'data_elaboracao', 'data_envio', 'enviado_email', 'enviado_sms', 'enviado_portal']
    search_fields = ['titulo', 'conteudo', 'peticao__numero_peticao']
    readonly_fields = ['data_elaboracao']
    ordering = ['-data_elaboracao']
    
    fieldsets = (
        ('Resposta', {
            'fields': ('peticao', 'tipo_resposta', 'titulo', 'conteudo', 'fundamentacao', 'orientacoes')
        }),
        ('Responsável', {
            'fields': ('responsavel', 'cargo_responsavel')
        }),
        ('Documento', {
            'fields': ('numero_documento', 'arquivo_resposta')
        }),
        ('Datas', {
            'fields': ('data_elaboracao', 'data_envio')
        }),
        ('Notificações', {
            'fields': ('enviado_email', 'enviado_sms', 'enviado_portal')
        }),
    )


@admin.register(ConfiguracaoPeticionamento)
class ConfiguracaoPeticionamentoAdmin(admin.ModelAdmin):
    list_display = ['sistema_ativo', 'manutencao', 'prazo_padrao_resposta_dias', 'tamanho_maximo_arquivo_mb']
    
    fieldsets = (
        ('Status do Sistema', {
            'fields': ('sistema_ativo', 'manutencao', 'mensagem_manutencao')
        }),
        ('Prazos', {
            'fields': ('prazo_padrao_resposta_dias', 'prazo_urgente_resposta_dias', 'prazo_notificacao_vencimento_dias')
        }),
        ('Limites de Arquivo', {
            'fields': ('tamanho_maximo_arquivo_mb', 'numero_maximo_anexos', 'tipos_arquivo_permitidos')
        }),
        ('Notificações', {
            'fields': ('notificar_nova_peticao', 'notificar_vencimento_prazo', 'email_notificacao')
        }),
        ('Templates de E-mail', {
            'fields': ('template_confirmacao_envio', 'template_recebimento', 'template_resposta'),
            'classes': ('collapse',)
        }),
        ('Segurança', {
            'fields': ('exigir_captcha', 'limitar_ip', 'peticoes_por_ip_dia')
        }),
        ('Backup', {
            'fields': ('backup_automatico', 'dias_retencao_backup')
        }),
    )
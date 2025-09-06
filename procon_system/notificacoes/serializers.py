from rest_framework import serializers
from .models import (
    TipoNotificacao, 
    Notificacao, 
    PreferenciaNotificacao, 
    LogNotificacao, 
    TemplateNotificacao
)

class TipoNotificacaoSerializer(serializers.ModelSerializer):
    """Serializer para TipoNotificacao"""
    
    class Meta:
        model = TipoNotificacao
        fields = [
            'id', 'nome', 'codigo', 'descricao', 'template_email', 
            'template_sms', 'template_push', 'ativo', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id', 'criado_em', 'atualizado_em']

class NotificacaoSerializer(serializers.ModelSerializer):
    """Serializer para Notificacao"""
    tipo_nome = serializers.CharField(source='tipo.nome', read_only=True)
    destinatario_nome = serializers.CharField(source='destinatario.get_full_name', read_only=True)
    destinatario_username = serializers.CharField(source='destinatario.username', read_only=True)
    remetente_nome = serializers.CharField(source='remetente.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    prioridade_display = serializers.CharField(source='get_prioridade_display', read_only=True)
    
    class Meta:
        model = Notificacao
        fields = [
            'id', 'tipo', 'tipo_nome', 'destinatario', 'destinatario_nome', 
            'destinatario_username', 'remetente', 'remetente_nome', 'titulo', 
            'mensagem', 'dados_extras', 'status', 'status_display', 'prioridade', 
            'prioridade_display', 'content_type', 'object_id', 'agendada_para', 
            'enviada_em', 'lida_em', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = [
            'id', 'tipo_nome', 'destinatario_nome', 'destinatario_username', 
            'remetente_nome', 'status_display', 'prioridade_display', 
            'enviada_em', 'lida_em', 'criado_em', 'atualizado_em'
        ]

class NotificacaoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de notificações"""
    
    class Meta:
        model = Notificacao
        fields = [
            'tipo', 'destinatario', 'remetente', 'titulo', 'mensagem', 
            'dados_extras', 'prioridade', 'content_type', 'object_id', 'agendada_para'
        ]

class NotificacaoUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de notificações"""
    
    class Meta:
        model = Notificacao
        fields = [
            'titulo', 'mensagem', 'dados_extras', 'prioridade', 'agendada_para'
        ]

class PreferenciaNotificacaoSerializer(serializers.ModelSerializer):
    """Serializer para PreferenciaNotificacao"""
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    tipo_notificacao_nome = serializers.CharField(source='tipo_notificacao.nome', read_only=True)
    canal_display = serializers.CharField(source='get_canal_display', read_only=True)
    
    class Meta:
        model = PreferenciaNotificacao
        fields = [
            'id', 'usuario', 'usuario_nome', 'tipo_notificacao', 
            'tipo_notificacao_nome', 'canal', 'canal_display', 'ativo', 
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = [
            'id', 'usuario_nome', 'tipo_notificacao_nome', 'canal_display', 
            'criado_em', 'atualizado_em'
        ]

class LogNotificacaoSerializer(serializers.ModelSerializer):
    """Serializer para LogNotificacao"""
    notificacao_titulo = serializers.CharField(source='notificacao.titulo', read_only=True)
    canal_display = serializers.CharField(source='get_canal_display', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    
    class Meta:
        model = LogNotificacao
        fields = [
            'id', 'notificacao', 'notificacao_titulo', 'canal', 'canal_display',
            'resultado', 'resultado_display', 'mensagem_erro', 'tentativas', 'criado_em'
        ]
        read_only_fields = [
            'id', 'notificacao_titulo', 'canal_display', 'resultado_display', 'criado_em'
        ]

class TemplateNotificacaoSerializer(serializers.ModelSerializer):
    """Serializer para TemplateNotificacao"""
    tipo_notificacao_nome = serializers.CharField(source='tipo_notificacao.nome', read_only=True)
    canal_display = serializers.CharField(source='get_canal_display', read_only=True)
    
    class Meta:
        model = TemplateNotificacao
        fields = [
            'id', 'nome', 'tipo_notificacao', 'tipo_notificacao_nome', 'canal', 
            'canal_display', 'assunto', 'conteudo', 'variaveis', 'ativo', 
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = [
            'id', 'tipo_notificacao_nome', 'canal_display', 'criado_em', 'atualizado_em'
        ]

class DashboardNotificacoesSerializer(serializers.Serializer):
    """Serializer para dados do dashboard de notificações"""
    total_notificacoes = serializers.IntegerField()
    notificacoes_pendentes = serializers.IntegerField()
    notificacoes_enviadas = serializers.IntegerField()
    notificacoes_lidas = serializers.IntegerField()
    notificacoes_falhadas = serializers.IntegerField()
    notificacoes_por_tipo = serializers.DictField()
    notificacoes_por_canal = serializers.DictField()
    notificacoes_recentes = NotificacaoSerializer(many=True)

class NotificacaoBulkSerializer(serializers.Serializer):
    """Serializer para operações em lote de notificações"""
    notificacao_ids = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="Lista de IDs das notificações"
    )
    acao = serializers.ChoiceField(
        choices=['marcar_lidas', 'marcar_enviadas', 'cancelar'],
        help_text="Ação a ser executada nas notificações"
    )

class NotificacaoFilterSerializer(serializers.Serializer):
    """Serializer para filtros de notificação"""
    status = serializers.ChoiceField(
        choices=['pendente', 'enviada', 'lida', 'falhada', 'cancelada'],
        required=False
    )
    prioridade = serializers.ChoiceField(
        choices=['baixa', 'normal', 'alta', 'urgente'],
        required=False
    )
    tipo = serializers.IntegerField(required=False)
    destinatario = serializers.IntegerField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    search = serializers.CharField(required=False)
    ordering = serializers.CharField(required=False, default='-criado_em')

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    TipoProtocolo, StatusProtocolo, Protocolo, DocumentoProtocolo,
    TramitacaoProtocolo, AlertaProtocolo
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer para usuários"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class TipoProtocoloSerializer(serializers.ModelSerializer):
    """Serializer para tipos de protocolo"""
    class Meta:
        model = TipoProtocolo
        fields = '__all__'


class StatusProtocoloSerializer(serializers.ModelSerializer):
    """Serializer para status de protocolo"""
    class Meta:
        model = StatusProtocolo
        fields = '__all__'


class ProtocoloListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de protocolos"""
    tipo_protocolo = TipoProtocoloSerializer(read_only=True)
    status = StatusProtocoloSerializer(read_only=True)
    responsavel_atual = UserSerializer(read_only=True)
    criado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = Protocolo
        fields = [
            'id', 'numero', 'tipo_protocolo', 'assunto', 'prioridade',
            'status', 'responsavel_atual', 'data_abertura', 'data_limite',
            'data_conclusao', 'criado_por', 'esta_atrasado', 'dias_restantes'
        ]


class ProtocoloDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalhes de protocolo"""
    tipo_protocolo = TipoProtocoloSerializer(read_only=True)
    status = StatusProtocoloSerializer(read_only=True)
    responsavel_atual = UserSerializer(read_only=True)
    criado_por = UserSerializer(read_only=True)
    documentos = serializers.SerializerMethodField()
    tramitacoes = serializers.SerializerMethodField()
    alertas = serializers.SerializerMethodField()
    
    class Meta:
        model = Protocolo
        fields = '__all__'
    
    def get_documentos(self, obj):
        return DocumentoProtocoloListSerializer(obj.documentos.all(), many=True).data
    
    def get_tramitacoes(self, obj):
        return TramitacaoProtocoloListSerializer(obj.tramitacoes.all(), many=True).data
    
    def get_alertas(self, obj):
        return AlertaProtocoloListSerializer(obj.alertas.filter(lido=False), many=True).data


class ProtocoloCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de protocolo"""
    class Meta:
        model = Protocolo
        fields = [
            'numero', 'tipo_protocolo', 'assunto', 'descricao', 'prioridade',
            'status', 'responsavel_atual', 'data_limite', 'observacoes', 'tags'
        ]
    
    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class DocumentoProtocoloListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de documentos"""
    enviado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = DocumentoProtocolo
        fields = [
            'id', 'tipo', 'titulo', 'tamanho', 'extensao', 'data_upload',
            'enviado_por', 'indexado'
        ]


class DocumentoProtocoloDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalhes de documento"""
    protocolo = ProtocoloListSerializer(read_only=True)
    enviado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = DocumentoProtocolo
        fields = '__all__'


class DocumentoProtocoloCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de documento"""
    class Meta:
        model = DocumentoProtocolo
        fields = ['protocolo', 'tipo', 'titulo', 'descricao', 'arquivo']
    
    def create(self, validated_data):
        validated_data['enviado_por'] = self.context['request'].user
        return super().create(validated_data)


class TramitacaoProtocoloListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de tramitações"""
    protocolo = ProtocoloListSerializer(read_only=True)
    responsavel_anterior = UserSerializer(read_only=True)
    responsavel_novo = UserSerializer(read_only=True)
    tramitado_por = UserSerializer(read_only=True)

    class Meta:
        model = TramitacaoProtocolo
        fields = [
            'id',
            'protocolo',
            'responsavel_anterior',
            'responsavel_novo',
            'observacao',
            'tramitado_por',
            'data_tramitacao',
        ]


class TramitacaoProtocoloCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de tramitação"""

    class Meta:
        model = TramitacaoProtocolo
        fields = ['protocolo', 'responsavel_novo', 'observacao']

    def create(self, validated_data):
        protocolo = validated_data['protocolo']
        validated_data['responsavel_anterior'] = protocolo.responsavel_atual
        validated_data['tramitado_por'] = self.context['request'].user
        instance = super().create(validated_data)

        protocolo.responsavel_atual = validated_data['responsavel_novo']
        protocolo.save(update_fields=['responsavel_atual'])
        return instance

class AlertaProtocoloListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de alertas"""
    lido_por = UserSerializer(read_only=True)
    
    class Meta:
        model = AlertaProtocolo
        fields = [
            'id', 'tipo', 'titulo', 'mensagem', 'lido', 'criado_em', 'data_leitura',
            'lido_por'
        ]


class AlertaProtocoloDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalhes de alerta"""
    protocolo = ProtocoloListSerializer(read_only=True)
    lido_por = UserSerializer(read_only=True)
    
    class Meta:
        model = AlertaProtocolo
        fields = '__all__'


class AlertaProtocoloCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de alerta"""
    class Meta:
        model = AlertaProtocolo
        fields = ['protocolo', 'tipo', 'titulo', 'mensagem']


# Serializers para dashboard e estatísticas
class DashboardProtocoloSerializer(serializers.Serializer):
    """Serializer para dashboard de protocolos"""
    total_protocolos = serializers.IntegerField()
    protocolos_abertos = serializers.IntegerField()
    protocolos_concluidos = serializers.IntegerField()
    protocolos_atrasados = serializers.IntegerField()
    protocolos_urgentes = serializers.IntegerField()
    protocolos_por_tipo = serializers.DictField()
    protocolos_por_status = serializers.DictField()
    protocolos_por_mes = serializers.ListField()


class ProtocoloStatsSerializer(serializers.Serializer):
    """Serializer para estatísticas de protocolos"""
    tempo_medio_processamento = serializers.FloatField()
    taxa_conclusao = serializers.FloatField()
    protocolos_por_prioridade = serializers.DictField()
    responsaveis_mais_ativos = serializers.ListField()


# Serializers para filtros
class ProtocoloFilterSerializer(serializers.Serializer):
    """Serializer para filtros de protocolo"""
    tipo_protocolo = serializers.IntegerField(required=False)
    status = serializers.IntegerField(required=False)
    responsavel = serializers.IntegerField(required=False)
    prioridade = serializers.CharField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    atrasados = serializers.BooleanField(required=False)
    search = serializers.CharField(required=False)


# Serializers para ações específicas
class TramitarProtocoloSerializer(serializers.Serializer):
    """Serializer para tramitação de protocolo"""
    status_novo = serializers.IntegerField()
    responsavel_novo = serializers.IntegerField(required=False)
    observacoes = serializers.CharField(required=False)


class ConcluirProtocoloSerializer(serializers.Serializer):
    """Serializer para conclusão de protocolo"""
    observacoes = serializers.CharField(required=False)


class MarcarAlertaLidoSerializer(serializers.Serializer):
    """Serializer para marcar alerta como lido"""
    pass









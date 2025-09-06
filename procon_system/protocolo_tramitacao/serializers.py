from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    ProtocoloDocumento, TipoDocumento, Setor, 
    TramitacaoDocumento, AnexoProtocolo, ConfiguracaoProtocolo
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer para User"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class TipoDocumentoSerializer(serializers.ModelSerializer):
    """Serializer para TipoDocumento"""
    
    class Meta:
        model = TipoDocumento
        fields = [
            'id', 'nome', 'descricao', 'prazo_resposta_dias',
            'requer_assinatura', 'ativo', 'criado_em'
        ]
        read_only_fields = ['criado_em']


class SetorSerializer(serializers.ModelSerializer):
    """Serializer para Setor"""
    responsavel_nome = serializers.CharField(source='responsavel.get_full_name', read_only=True)
    
    class Meta:
        model = Setor
        fields = [
            'id', 'nome', 'sigla', 'responsavel', 'responsavel_nome',
            'email', 'pode_protocolar', 'pode_tramitar', 'ativo', 'criado_em'
        ]
        read_only_fields = ['criado_em', 'responsavel_nome']


class ProtocoloDocumentoSerializer(serializers.ModelSerializer):
    """Serializer para ProtocoloDocumento"""
    
    # Campos relacionados somente leitura
    tipo_documento_nome = serializers.CharField(source='tipo_documento.nome', read_only=True)
    setor_atual_nome = serializers.CharField(source='setor_atual.nome', read_only=True)
    setor_origem_nome = serializers.CharField(source='setor_origem.nome', read_only=True)
    protocolado_por_nome = serializers.CharField(source='protocolado_por.get_full_name', read_only=True)
    responsavel_atual_nome = serializers.CharField(source='responsavel_atual.get_full_name', read_only=True)
    
    # Propriedades calculadas
    esta_no_prazo = serializers.ReadOnlyField()
    dias_para_vencimento = serializers.ReadOnlyField()
    
    # Campos de display
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    prioridade_display = serializers.CharField(source='get_prioridade_display', read_only=True)
    origem_display = serializers.CharField(source='get_origem_display', read_only=True)
    
    class Meta:
        model = ProtocoloDocumento
        fields = [
            'id', 'numero_protocolo', 'uuid',
            'tipo_documento', 'tipo_documento_nome',
            'origem', 'origem_display', 'assunto', 'descricao',
            'status', 'status_display', 'prioridade', 'prioridade_display',
            'remetente_nome', 'remetente_documento', 'remetente_email',
            'remetente_telefone', 'remetente_endereco',
            'setor_atual', 'setor_atual_nome',
            'setor_origem', 'setor_origem_nome',
            'responsavel_atual', 'responsavel_atual_nome',
            'protocolado_por', 'protocolado_por_nome',
            'prazo_resposta', 'data_protocolo', 'data_conclusao',
            'observacoes', 'sigiloso',
            'esta_no_prazo', 'dias_para_vencimento',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = [
            'numero_protocolo', 'uuid', 'data_protocolo',
            'criado_em', 'atualizado_em', 'esta_no_prazo', 
            'dias_para_vencimento'
        ]


class TramitacaoDocumentoSerializer(serializers.ModelSerializer):
    """Serializer para TramitacaoDocumento"""
    
    # Campos relacionados
    protocolo_numero = serializers.CharField(source='protocolo.numero_protocolo', read_only=True)
    protocolo_assunto = serializers.CharField(source='protocolo.assunto', read_only=True)
    setor_origem_nome = serializers.CharField(source='setor_origem.nome', read_only=True)
    setor_destino_nome = serializers.CharField(source='setor_destino.nome', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    recebido_por_nome = serializers.CharField(source='recebido_por.get_full_name', read_only=True)
    
    # Campo de display
    acao_display = serializers.CharField(source='get_acao_display', read_only=True)
    
    class Meta:
        model = TramitacaoDocumento
        fields = [
            'id', 'protocolo', 'protocolo_numero', 'protocolo_assunto',
            'acao', 'acao_display',
            'setor_origem', 'setor_origem_nome',
            'setor_destino', 'setor_destino_nome',
            'motivo', 'observacoes', 'prazo_dias',
            'usuario', 'usuario_nome',
            'data_tramitacao', 'data_recebimento',
            'recebido_por', 'recebido_por_nome',
            'hash_tramitacao'
        ]
        read_only_fields = [
            'data_tramitacao', 'hash_tramitacao',
            'protocolo_numero', 'protocolo_assunto',
            'setor_origem_nome', 'setor_destino_nome',
            'usuario_nome', 'recebido_por_nome'
        ]


class AnexoProtocoloSerializer(serializers.ModelSerializer):
    """Serializer para AnexoProtocolo"""
    
    # Campos relacionados
    protocolo_numero = serializers.CharField(source='protocolo.numero_protocolo', read_only=True)
    uploaded_by_nome = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    # Campo para tamanho formatado
    tamanho_formatado = serializers.SerializerMethodField()
    
    class Meta:
        model = AnexoProtocolo
        fields = [
            'id', 'protocolo', 'protocolo_numero',
            'nome_arquivo', 'arquivo', 'tipo_mime',
            'tamanho_bytes', 'tamanho_formatado',
            'hash_arquivo', 'uploaded_by', 'uploaded_by_nome',
            'upload_em', 'descricao'
        ]
        read_only_fields = [
            'tamanho_bytes', 'hash_arquivo', 'upload_em',
            'protocolo_numero', 'uploaded_by_nome', 'tamanho_formatado'
        ]
    
    def get_tamanho_formatado(self, obj):
        """Formata o tamanho do arquivo em KB, MB, etc."""
        tamanho = obj.tamanho_bytes
        if tamanho < 1024:
            return f"{tamanho} B"
        elif tamanho < 1024**2:
            return f"{tamanho/1024:.1f} KB"
        elif tamanho < 1024**3:
            return f"{tamanho/(1024**2):.1f} MB"
        else:
            return f"{tamanho/(1024**3):.1f} GB"


class ConfiguracaoProtocoloSerializer(serializers.ModelSerializer):
    """Serializer para ConfiguracaoProtocolo"""
    
    class Meta:
        model = ConfiguracaoProtocolo
        fields = [
            'id', 'formato_protocolo', 'prefixo_protocolo',
            'prazo_padrao_dias', 'prazo_urgente_dias',
            'notificar_vencimento_dias', 'notificar_responsavel', 'notificar_setor',
            'tamanho_maximo_mb', 'tipos_arquivo_permitidos',
            'dias_backup_automatico', 'dias_arquivamento_automatico'
        ]


# === SERIALIZERS PARA RELATÓRIOS ===

class EstatisticasProtocoloSerializer(serializers.Serializer):
    """Serializer para estatísticas do dashboard"""
    total_protocolos = serializers.IntegerField()
    protocolos_hoje = serializers.IntegerField()
    protocolos_vencidos = serializers.IntegerField()
    protocolos_prox_vencimento = serializers.IntegerField()
    tramitacoes_pendentes = serializers.IntegerField()


class RelatorioSetorSerializer(serializers.Serializer):
    """Serializer para relatório por setor"""
    setor_nome = serializers.CharField()
    setor_sigla = serializers.CharField()
    total = serializers.IntegerField()
    protocolados = serializers.IntegerField()
    em_tramitacao = serializers.IntegerField()
    finalizados = serializers.IntegerField()


class RelatorioStatusSerializer(serializers.Serializer):
    """Serializer para relatório por status"""
    status = serializers.CharField()
    count = serializers.IntegerField()


class RelatorioPrazoSerializer(serializers.Serializer):
    """Serializer para relatório por prazo"""
    situacao = serializers.CharField()
    count = serializers.IntegerField()


# === SERIALIZERS PARA OPERAÇÕES ESPECÍFICAS ===

class TramitarProtocoloSerializer(serializers.Serializer):
    """Serializer para tramitar protocolo"""
    setor_destino = serializers.PrimaryKeyRelatedField(queryset=Setor.objects.filter(ativo=True))
    motivo = serializers.CharField(max_length=500)
    observacoes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    prazo_dias = serializers.IntegerField(required=False, min_value=1, max_value=365)
    
    def validate_setor_destino(self, value):
        """Valida se o setor pode receber tramitações"""
        if not value.pode_tramitar:
            raise serializers.ValidationError("Setor não habilitado para receber tramitações")
        return value


class ReceberTramitacaoSerializer(serializers.Serializer):
    """Serializer para receber tramitação"""
    observacoes = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class ProtocolarDocumentoSerializer(serializers.Serializer):
    """Serializer para protocolar novo documento"""
    tipo_documento = serializers.PrimaryKeyRelatedField(
        queryset=TipoDocumento.objects.filter(ativo=True)
    )
    origem = serializers.ChoiceField(choices=ProtocoloDocumento.ORIGEM_CHOICES)
    assunto = serializers.CharField(max_length=200)
    descricao = serializers.CharField(max_length=2000)
    
    # Dados do remetente
    remetente_nome = serializers.CharField(max_length=200)
    remetente_documento = serializers.CharField(max_length=50)
    remetente_email = serializers.EmailField(required=False, allow_blank=True)
    remetente_telefone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    remetente_endereco = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    # Configurações
    setor_destino = serializers.PrimaryKeyRelatedField(
        queryset=Setor.objects.filter(ativo=True, pode_protocolar=True)
    )
    prioridade = serializers.ChoiceField(
        choices=ProtocoloDocumento.PRIORIDADE_CHOICES,
        default='NORMAL'
    )
    sigiloso = serializers.BooleanField(default=False)
    observacoes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    def validate_remetente_documento(self, value):
        """Valida formato do documento (CPF/CNPJ)"""
        import re
        # Remove caracteres especiais
        doc = re.sub(r'[^0-9]', '', value)
        
        if len(doc) == 11:  # CPF
            return value
        elif len(doc) == 14:  # CNPJ
            return value
        else:
            raise serializers.ValidationError("Documento deve ser um CPF ou CNPJ válido")


# === SERIALIZERS PARA BUSCA E FILTROS ===

class FiltroProtocoloSerializer(serializers.Serializer):
    """Serializer para filtros de busca de protocolos"""
    numero = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=ProtocoloDocumento.STATUS_CHOICES,
        required=False,
        allow_blank=True
    )
    setor_atual = serializers.PrimaryKeyRelatedField(
        queryset=Setor.objects.filter(ativo=True),
        required=False
    )
    tipo_documento = serializers.PrimaryKeyRelatedField(
        queryset=TipoDocumento.objects.filter(ativo=True),
        required=False
    )
    prioridade = serializers.ChoiceField(
        choices=ProtocoloDocumento.PRIORIDADE_CHOICES,
        required=False,
        allow_blank=True
    )
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    remetente = serializers.CharField(required=False, allow_blank=True)
    assunto = serializers.CharField(required=False, allow_blank=True)
    vencidos = serializers.BooleanField(required=False, default=False)
    prox_vencimento = serializers.BooleanField(required=False, default=False)
    
    def validate(self, data):
        """Validações gerais"""
        data_inicio = data.get('data_inicio')
        data_fim = data.get('data_fim')
        
        if data_inicio and data_fim and data_inicio > data_fim:
            raise serializers.ValidationError({
                'data_fim': 'Data fim deve ser posterior à data início'
            })
        
        return data


class BuscaRapidaSerializer(serializers.Serializer):
    """Serializer para busca rápida"""
    termo = serializers.CharField(max_length=200)
    limite = serializers.IntegerField(default=10, min_value=1, max_value=50)
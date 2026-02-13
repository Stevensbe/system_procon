from rest_framework import serializers
from .models import (
    CaixaEntrada, AnexoCaixaEntrada, HistoricoCaixaEntrada, ConfiguracaoCaixaEntrada
)
from .constants import DESPACHO_PREDEFINIDOS

try:
    from protocolo_tramitacao.models import TramitacaoDocumento
except ImportError:  # pragma: no cover - dependencia opcional
    TramitacaoDocumento = None


def _obter_tramitacoes(obj):
    protocolo = getattr(obj, 'protocolo', None)
    if not protocolo or not TramitacaoDocumento:
        return []
    if hasattr(protocolo, 'tramitacoes_ordenadas'):
        return protocolo.tramitacoes_ordenadas
    return protocolo.tramitacoes.select_related(
        'setor_origem',
        'setor_destino',
        'usuario',
        'recebido_por',
    ).order_by('-data_tramitacao')


def _obter_ultima_tramitacao(obj):
    tramitacoes = _obter_tramitacoes(obj)
    if isinstance(tramitacoes, list):
        return tramitacoes[0] if tramitacoes else None
    return tramitacoes.first()


def _serializar_tramitacao(tramitacao):
    if not tramitacao:
        return None
    usuario_nome = ''
    if getattr(tramitacao, 'usuario', None):
        usuario_nome = tramitacao.usuario.get_full_name() or tramitacao.usuario.username
    return {
        'id': tramitacao.id,
        'acao': tramitacao.acao,
        'acao_display': tramitacao.get_acao_display(),
        'setor_origem_nome': getattr(tramitacao.setor_origem, 'nome', ''),
        'setor_destino_nome': getattr(tramitacao.setor_destino, 'nome', ''),
        'motivo': tramitacao.motivo,
        'observacoes': tramitacao.observacoes,
        'prazo_dias': tramitacao.prazo_dias,
        'usuario_nome': usuario_nome,
        'data_tramitacao': tramitacao.data_tramitacao,
    }


def _obter_processo(obj):
    protocolo = getattr(obj, 'protocolo', None)
    if not protocolo:
        return None
    processo = getattr(protocolo, 'processo_fiscalizacao', None)
    if processo:
        return processo
    auto_infracao = getattr(protocolo, 'auto_infracao', None)
    if not auto_infracao:
        return None
    try:
        from fiscalizacao.models import Processo
    except Exception:  # pragma: no cover - dependencia opcional
        return None
    return Processo.objects.filter(auto_infracao=auto_infracao).first()


class CaixaEntradaSerializer(serializers.ModelSerializer):
    """Serializer básico para caixa de entrada"""
    
    responsavel_atual_nome = serializers.CharField(source='responsavel_atual.get_full_name', read_only=True)
    destinatario_direto_nome = serializers.CharField(source='destinatario_direto.get_full_name', read_only=True)
    bloqueado_por_nome = serializers.CharField(source='bloqueado_por.get_full_name', read_only=True)
    pode_bloquear = serializers.SerializerMethodField()
    ultima_tramitacao = serializers.SerializerMethodField()
    processo_id = serializers.SerializerMethodField()
    processo_numero = serializers.SerializerMethodField()
    documento_relacionado_tipo = serializers.SerializerMethodField()
    documento_relacionado_id = serializers.SerializerMethodField()
    denuncia_id = serializers.SerializerMethodField()
    
    class Meta:
        model = CaixaEntrada
        fields = [
            'id', 'numero_protocolo', 'tipo_documento', 'assunto', 'descricao',
            'prioridade', 'status', 'remetente_nome', 'remetente_documento',
            'remetente_email', 'remetente_telefone', 'empresa_nome', 'empresa_cnpj',
            'setor_destino', 'setor_lotacao', 'responsavel_atual', 'responsavel_atual_nome',
            'destinatario_direto', 'destinatario_direto_nome', 'notificado_dte',
            'bloqueado', 'bloqueado_por', 'bloqueado_por_nome', 'bloqueado_em', 'motivo_bloqueio',
            'pode_bloquear', 'data_entrada', 'prazo_resposta', 'versao',
            'ultima_tramitacao', 'processo_id', 'processo_numero',
            'documento_relacionado_tipo', 'documento_relacionado_id', 'denuncia_id'
        ]
        read_only_fields = ['id', 'numero_protocolo', 'data_entrada', 'versao', 'protocolo',
                             'responsavel_atual_nome', 'destinatario_direto', 'destinatario_direto_nome',
                             'bloqueado', 'bloqueado_por', 'bloqueado_por_nome', 'bloqueado_em', 'motivo_bloqueio',
                             'pode_bloquear']

    def get_pode_bloquear(self, obj):
        request = self.context.get('request')
        func = self.context.get('pode_bloquear_func')
        if not request or not func or not getattr(request, 'user', None):
            return False
        if not request.user.is_authenticated:
            return False
        return bool(func(request.user, obj))

    def get_ultima_tramitacao(self, obj):
        tramitacao = _obter_ultima_tramitacao(obj)
        return _serializar_tramitacao(tramitacao)

    def get_processo_id(self, obj):
        processo = _obter_processo(obj)
        return processo.id if processo else None

    def get_processo_numero(self, obj):
        processo = _obter_processo(obj)
        if not processo:
            return None
        return getattr(processo, 'numero_processo', None)

    def get_documento_relacionado_tipo(self, obj):
        if not obj.content_type:
            return None
        return f"{obj.content_type.app_label}.{obj.content_type.model}"

    def get_documento_relacionado_id(self, obj):
        return obj.object_id

    def get_denuncia_id(self, obj):
        if not obj.content_type:
            return None
        if obj.content_type.app_label == 'portal_cidadao' and obj.content_type.model == 'denunciacidadao':
            return obj.object_id
        return None


class CaixaEntradaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para caixa de entrada"""
    
    responsavel_atual_nome = serializers.CharField(source='responsavel_atual.get_full_name', read_only=True)
    destinatario_direto_nome = serializers.CharField(source='destinatario_direto.get_full_name', read_only=True)
    lido_por_nome = serializers.CharField(source='lido_por.get_full_name', read_only=True)
    bloqueado_por_nome = serializers.CharField(source='bloqueado_por.get_full_name', read_only=True)
    pode_bloquear = serializers.SerializerMethodField()
    dias_para_vencimento = serializers.SerializerMethodField()
    esta_atrasado = serializers.SerializerMethodField()
    ultima_tramitacao = serializers.SerializerMethodField()
    tramitacoes = serializers.SerializerMethodField()
    processo_id = serializers.SerializerMethodField()
    processo_numero = serializers.SerializerMethodField()
    documento_relacionado_tipo = serializers.SerializerMethodField()
    documento_relacionado_id = serializers.SerializerMethodField()
    denuncia_id = serializers.SerializerMethodField()
    
    class Meta:
        model = CaixaEntrada
        fields = [
            'id', 'numero_protocolo', 'tipo_documento', 'assunto', 'descricao',
            'prioridade', 'status', 'lido_em', 'lido_por', 'lido_por_nome',
            'remetente_nome', 'remetente_documento', 'remetente_email',
            'remetente_telefone', 'empresa_nome', 'empresa_cnpj', 'setor_destino',
            'setor_lotacao', 'responsavel_atual', 'responsavel_atual_nome',
            'destinatario_direto', 'destinatario_direto_nome', 'origem', 'ip_origem',
            'notificado_dte', 'bloqueado', 'bloqueado_por', 'bloqueado_por_nome',
            'bloqueado_em', 'motivo_bloqueio', 'pode_bloquear', 'prazo_resposta', 'data_entrada',
            'data_atualizacao', 'versao',
            'dias_para_vencimento', 'esta_atrasado',
            'ultima_tramitacao', 'tramitacoes',
            'processo_id', 'processo_numero',
            'documento_relacionado_tipo', 'documento_relacionado_id', 'denuncia_id'
        ]
        read_only_fields = [
            'id', 'numero_protocolo', 'data_entrada', 'data_atualizacao',
            'versao', 'dias_para_vencimento', 'esta_atrasado', 'protocolo_id', 'protocolo_numero',
            'responsavel_atual_nome', 'destinatario_direto', 'destinatario_direto_nome',
            'bloqueado', 'bloqueado_por', 'bloqueado_por_nome', 'bloqueado_em', 'motivo_bloqueio',
            'pode_bloquear'
        ]
    
    def get_dias_para_vencimento(self, obj):
        return obj.dias_para_vencimento()
    
    def get_esta_atrasado(self, obj):
        return obj.esta_atrasado()

    def get_pode_bloquear(self, obj):
        request = self.context.get('request')
        func = self.context.get('pode_bloquear_func')
        if not request or not func or not getattr(request, 'user', None):
            return False
        if not request.user.is_authenticated:
            return False
        return bool(func(request.user, obj))

    def get_ultima_tramitacao(self, obj):
        tramitacao = _obter_ultima_tramitacao(obj)
        return _serializar_tramitacao(tramitacao)

    def get_tramitacoes(self, obj):
        tramitacoes = _obter_tramitacoes(obj)
        if isinstance(tramitacoes, list):
            lista = tramitacoes[:20]
        else:
            lista = list(tramitacoes[:20])
        return [_serializar_tramitacao(item) for item in lista if item]

    def get_processo_id(self, obj):
        processo = _obter_processo(obj)
        return processo.id if processo else None

    def get_processo_numero(self, obj):
        processo = _obter_processo(obj)
        if not processo:
            return None
        return getattr(processo, 'numero_processo', None)

    def get_documento_relacionado_tipo(self, obj):
        if not obj.content_type:
            return None
        return f"{obj.content_type.app_label}.{obj.content_type.model}"

    def get_documento_relacionado_id(self, obj):
        return obj.object_id

    def get_denuncia_id(self, obj):
        if not obj.content_type:
            return None
        if obj.content_type.app_label == 'portal_cidadao' and obj.content_type.model == 'denunciacidadao':
            return obj.object_id
        return None


class AnexoCaixaEntradaSerializer(serializers.ModelSerializer):
    """Serializer para anexos da caixa de entrada"""
    
    upload_por_nome = serializers.CharField(source='upload_por.get_full_name', read_only=True)
    tamanho_formatado = serializers.SerializerMethodField()
    
    class Meta:
        model = AnexoCaixaEntrada
        fields = [
            'id', 'documento', 'arquivo', 'nome_original', 'tipo_mime',
            'tamanho', 'tamanho_formatado', 'descricao', 'upload_em',
            'upload_por', 'upload_por_nome'
        ]
        read_only_fields = ['id', 'upload_em', 'upload_por_nome']
    
    def get_tamanho_formatado(self, obj):
        """Formata tamanho do arquivo"""
        if obj.tamanho < 1024:
            return f"{obj.tamanho} B"
        elif obj.tamanho < 1024 * 1024:
            return f"{obj.tamanho / 1024:.1f} KB"
        else:
            return f"{obj.tamanho / (1024 * 1024):.1f} MB"


class HistoricoCaixaEntradaSerializer(serializers.ModelSerializer):
    """Serializer para histórico da caixa de entrada"""
    
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = HistoricoCaixaEntrada
        fields = [
            'id', 'documento', 'acao', 'usuario', 'usuario_nome',
            'detalhes', 'dados_anteriores', 'dados_novos', 'data_acao'
        ]
        read_only_fields = ['id', 'data_acao']


class ConfiguracaoCaixaEntradaSerializer(serializers.ModelSerializer):
    """Serializer para configurações da caixa de entrada"""
    
    class Meta:
        model = ConfiguracaoCaixaEntrada
        fields = '__all__'


class CriarDocumentoCaixaEntradaSerializer(serializers.ModelSerializer):
    """Serializer para criar documento na caixa de entrada"""
    
    class Meta:
        model = CaixaEntrada
        fields = [
            'tipo_documento', 'assunto', 'descricao', 'prioridade',
            'remetente_nome', 'remetente_documento', 'remetente_email',
            'remetente_telefone', 'empresa_nome', 'empresa_cnpj',
            'setor_destino', 'prazo_resposta', 'origem', 'ip_origem'
        ]
    
    def create(self, validated_data):
        """Cria documento na caixa de entrada"""
        # Definir setor destino baseado no tipo de documento
        if 'setor_destino' not in validated_data:
            tipo_doc = validated_data.get('tipo_documento', '')
            if tipo_doc in ['PETICAO', 'RECURSO']:
                validated_data['setor_destino'] = 'Jurídico'
            elif tipo_doc in ['DENUNCIA', 'AUTO_INFRACAO']:
                validated_data['setor_destino'] = 'Fiscalização'
            elif tipo_doc in ['MULTA']:
                validated_data['setor_destino'] = 'Cobrança'
            else:
                validated_data['setor_destino'] = 'Atendimento'
        
        # Definir prioridade baseada no tipo
        if 'prioridade' not in validated_data:
            tipo_doc = validated_data.get('tipo_documento', '')
            if tipo_doc in ['RECURSO', 'AUTO_INFRACAO']:
                validated_data['prioridade'] = 'ALTA'
            elif tipo_doc in ['PETICAO']:
                validated_data['prioridade'] = 'NORMAL'
            else:
                validated_data['prioridade'] = 'BAIXA'
        
        return super().create(validated_data)


class ConsultarDocumentoSerializer(serializers.Serializer):
    """Serializer para consulta de documentos"""
    
    numero_protocolo = serializers.CharField(required=False)
    cpf_cnpj = serializers.CharField(required=False)
    
    def validate(self, data):
        """Valida que pelo menos um campo foi fornecido"""
        if not data.get('numero_protocolo') and not data.get('cpf_cnpj'):
            raise serializers.ValidationError(
                "Número de protocolo ou CPF/CNPJ é obrigatório"
            )
        return data


class EncaminharDocumentoSerializer(serializers.Serializer):
    """Serializer para encaminhar documento"""
    
    destino_tipo = serializers.ChoiceField(choices=['setor', 'usuario'], required=False, default='setor')
    setor_destino = serializers.CharField(max_length=100, required=False)
    responsavel = serializers.IntegerField(required=False)
    destinatario_direto = serializers.IntegerField(required=False)
    observacoes = serializers.CharField(max_length=500, required=False)
    
    def validate_setor_destino(self, value):
        """Valida setor destino"""
        setores_validos = [
            'Jurídico', 'Fiscalização', 'Cobrança', 'Atendimento',
            'Protocolo', 'Administrativo', 'Financeiro'
        ]
        if value and value not in setores_validos:
            raise serializers.ValidationError(
                f"Setor deve ser um dos seguintes: {', '.join(setores_validos)}"
            )
        return value

    def validate(self, attrs):
        destino_tipo = (attrs.get('destino_tipo') or 'setor').lower()
        setor_destino = attrs.get('setor_destino')
        destinatario = attrs.get('destinatario_direto') or attrs.get('responsavel')

        if destino_tipo == 'usuario' and not destinatario:
            raise serializers.ValidationError({'destinatario_direto': 'Destinatario obrigatorio para destino pessoal.'})
        if destino_tipo == 'setor' and not setor_destino:
            raise serializers.ValidationError({'setor_destino': 'Setor destino obrigatorio.'})

        motivo = (attrs.get('motivo_predefinido') or '').strip()
        if motivo and motivo not in [opcao for opcao, _ in DESPACHO_PREDEFINIDOS]:
            raise serializers.ValidationError({'motivo_predefinido': 'Motivo predefinido invalido.'})
        return attrs


class MarcarLidoSerializer(serializers.Serializer):
    """Serializer para marcar documento como lido"""
    
    observacoes = serializers.CharField(max_length=500, required=False)


class ArquivarDocumentoSerializer(serializers.Serializer):
    """Serializer para arquivar documento"""
    
    motivo = serializers.CharField(max_length=500, required=False)
    observacoes = serializers.CharField(max_length=1000, required=False)



class DistribuicaoStatusSerializer(serializers.Serializer):
    status = serializers.CharField(allow_null=True)
    total = serializers.IntegerField()


class DistribuicaoTipoSerializer(serializers.Serializer):
    tipo_documento = serializers.CharField(allow_null=True)
    total = serializers.IntegerField()


class CaixaEntradaDashboardSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    nao_lidos = serializers.IntegerField()
    atrasados = serializers.IntegerField()
    urgentes = serializers.IntegerField()
    distribuicao_status = DistribuicaoStatusSerializer(many=True)
    distribuicao_tipo = DistribuicaoTipoSerializer(many=True)
    recentes = CaixaEntradaSerializer(many=True)


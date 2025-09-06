from rest_framework import serializers
from .models import (
    CaixaEntrada, AnexoCaixaEntrada, HistoricoCaixaEntrada, ConfiguracaoCaixaEntrada
)


class CaixaEntradaSerializer(serializers.ModelSerializer):
    """Serializer básico para caixa de entrada"""
    
    class Meta:
        model = CaixaEntrada
        fields = [
            'id', 'numero_protocolo', 'tipo_documento', 'assunto', 'descricao',
            'prioridade', 'status', 'remetente_nome', 'remetente_documento',
            'remetente_email', 'empresa_nome', 'empresa_cnpj', 'setor_destino',
            'responsavel_atual', 'data_entrada', 'prazo_resposta', 'versao'
        ]
        read_only_fields = ['id', 'numero_protocolo', 'data_entrada', 'versao']


class CaixaEntradaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para caixa de entrada"""
    
    responsavel_atual_nome = serializers.CharField(source='responsavel_atual.get_full_name', read_only=True)
    lido_por_nome = serializers.CharField(source='lido_por.get_full_name', read_only=True)
    dias_para_vencimento = serializers.SerializerMethodField()
    esta_atrasado = serializers.SerializerMethodField()
    
    class Meta:
        model = CaixaEntrada
        fields = [
            'id', 'numero_protocolo', 'tipo_documento', 'assunto', 'descricao',
            'prioridade', 'status', 'lido_em', 'lido_por', 'lido_por_nome',
            'remetente_nome', 'remetente_documento', 'remetente_email',
            'remetente_telefone', 'empresa_nome', 'empresa_cnpj', 'setor_destino',
            'responsavel_atual', 'responsavel_atual_nome', 'origem', 'ip_origem',
            'prazo_resposta', 'data_entrada', 'data_atualizacao', 'versao',
            'dias_para_vencimento', 'esta_atrasado'
        ]
        read_only_fields = [
            'id', 'numero_protocolo', 'data_entrada', 'data_atualizacao',
            'versao', 'dias_para_vencimento', 'esta_atrasado'
        ]
    
    def get_dias_para_vencimento(self, obj):
        return obj.dias_para_vencimento()
    
    def get_esta_atrasado(self, obj):
        return obj.esta_atrasado()


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
    
    setor_destino = serializers.CharField(max_length=100)
    responsavel = serializers.IntegerField(required=False)
    observacoes = serializers.CharField(max_length=500, required=False)
    
    def validate_setor_destino(self, value):
        """Valida setor destino"""
        setores_validos = [
            'Jurídico', 'Fiscalização', 'Cobrança', 'Atendimento',
            'Protocolo', 'Administrativo', 'Financeiro'
        ]
        if value not in setores_validos:
            raise serializers.ValidationError(
                f"Setor deve ser um dos seguintes: {', '.join(setores_validos)}"
            )
        return value


class MarcarLidoSerializer(serializers.Serializer):
    """Serializer para marcar documento como lido"""
    
    observacoes = serializers.CharField(max_length=500, required=False)


class ArquivarDocumentoSerializer(serializers.Serializer):
    """Serializer para arquivar documento"""
    
    motivo = serializers.CharField(max_length=500, required=False)
    observacoes = serializers.CharField(max_length=1000, required=False)

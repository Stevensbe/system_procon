from rest_framework import serializers
from .models import (
    TipoPeticao, PeticaoEletronica, AnexoPeticao, 
    InteracaoPeticao, RespostaPeticao, ConfiguracaoPeticionamento
)
from django.contrib.auth.models import User


class TipoPeticaoSerializer(serializers.ModelSerializer):
    """Serializer para TipoPeticao"""
    
    class Meta:
        model = TipoPeticao
        fields = [
            'id', 'nome', 'descricao', 'categoria', 'prazo_resposta_dias',
            'requer_documentos', 'permite_anonimo', 'notificar_email', 
            'notificar_sms', 'campos_obrigatorios', 'campos_opcionais',
            'ativo', 'ordem_exibicao', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['criado_em', 'atualizado_em']


class UserSerializer(serializers.ModelSerializer):
    """Serializer simplificado para User"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class AnexoPeticaoSerializer(serializers.ModelSerializer):
    """Serializer para AnexoPeticao"""
    
    uploaded_por = UserSerializer(read_only=True)
    tamanho_formatado = serializers.ReadOnlyField()
    
    class Meta:
        model = AnexoPeticao
        fields = [
            'id', 'peticao', 'arquivo', 'nome_arquivo', 'tipo_anexo',
            'tamanho_bytes', 'tamanho_formatado', 'uploaded_por', 'uploaded_em'
        ]
        read_only_fields = ['uploaded_por', 'uploaded_em', 'tamanho_bytes', 'tipo_anexo']


class AnexoPeticaoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de anexos"""
    
    class Meta:
        model = AnexoPeticao
        fields = ['peticao', 'arquivo', 'tipo_anexo', 'descricao']
    
    def create(self, validated_data):
        validated_data['uploaded_por'] = self.context['request'].user
        return super().create(validated_data)


class InteracaoPeticaoSerializer(serializers.ModelSerializer):
    """Serializer para InteracaoPeticao"""
    
    usuario = UserSerializer(read_only=True)
    
    class Meta:
        model = InteracaoPeticao
        fields = [
            'id', 'peticao', 'tipo_interacao', 'titulo', 'descricao',
            'observacoes', 'status_anterior', 'status_novo', 'usuario',
            'nome_usuario', 'ip_origem', 'user_agent', 'arquivo_anexo',
            'data_interacao', 'visivel_peticionario'
        ]
        read_only_fields = ['usuario', 'data_interacao']


class InteracaoPeticaoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de interações"""
    
    class Meta:
        model = InteracaoPeticao
        fields = [
            'peticao', 'tipo_interacao', 'titulo', 'descricao',
            'observacoes', 'status_anterior', 'status_novo', 'arquivo_anexo',
            'visivel_peticionario'
        ]
    
    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        validated_data['nome_usuario'] = self.context['request'].user.get_full_name() or self.context['request'].user.username
        validated_data['ip_origem'] = self.context['request'].META.get('REMOTE_ADDR')
        validated_data['user_agent'] = self.context['request'].META.get('HTTP_USER_AGENT', '')
        return super().create(validated_data)


class RespostaPeticaoSerializer(serializers.ModelSerializer):
    """Serializer para RespostaPeticao"""
    
    responsavel = UserSerializer(read_only=True)
    
    class Meta:
        model = RespostaPeticao
        fields = [
            'id', 'peticao', 'tipo_resposta', 'titulo', 'conteudo',
            'fundamentacao', 'orientacoes', 'responsavel', 'cargo_responsavel',
            'numero_documento', 'arquivo_resposta', 'data_elaboracao',
            'data_envio', 'enviado_email', 'enviado_sms', 'enviado_portal'
        ]
        read_only_fields = ['responsavel', 'data_elaboracao']


class RespostaPeticaoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de respostas"""
    
    class Meta:
        model = RespostaPeticao
        fields = [
            'peticao', 'tipo_resposta', 'titulo', 'conteudo',
            'fundamentacao', 'orientacoes', 'cargo_responsavel',
            'numero_documento', 'arquivo_resposta'
        ]
    
    def create(self, validated_data):
        validated_data['responsavel'] = self.context['request'].user
        return super().create(validated_data)


class PeticaoEletronicaListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de petições"""
    
    tipo_peticao = TipoPeticaoSerializer(read_only=True)
    usuario_criacao = UserSerializer(read_only=True)
    responsavel_atual = UserSerializer(read_only=True)
    esta_no_prazo = serializers.ReadOnlyField()
    dias_para_vencimento = serializers.ReadOnlyField()
    tempo_tramitacao = serializers.ReadOnlyField()
    
    class Meta:
        model = PeticaoEletronica
        fields = [
            'id', 'numero_peticao', 'protocolo_numero', 'uuid',
            'tipo_peticao', 'origem', 'assunto', 'status', 'prioridade',
            'peticionario_nome', 'peticionario_documento', 'peticionario_email',
            'empresa_nome', 'empresa_cnpj', 'valor_causa', 'data_fato',
            'data_envio', 'data_recebimento', 'prazo_resposta', 'data_resposta',
            'usuario_criacao', 'responsavel_atual', 'anonima', 'confidencial',
            'criado_em', 'atualizado_em', 'esta_no_prazo', 'dias_para_vencimento',
            'tempo_tramitacao'
        ]


class PeticaoEletronicaDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalhes de petição"""
    
    tipo_peticao = TipoPeticaoSerializer(read_only=True)
    usuario_criacao = UserSerializer(read_only=True)
    responsavel_atual = UserSerializer(read_only=True)
    anexos = AnexoPeticaoSerializer(many=True, read_only=True)
    interacoes = InteracaoPeticaoSerializer(many=True, read_only=True)
    resposta = RespostaPeticaoSerializer(read_only=True)
    esta_no_prazo = serializers.ReadOnlyField()
    dias_para_vencimento = serializers.ReadOnlyField()
    tempo_tramitacao = serializers.ReadOnlyField()
    
    class Meta:
        model = PeticaoEletronica
        fields = '__all__'


class PeticaoEletronicaCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de petições"""
    
    class Meta:
        model = PeticaoEletronica
        fields = [
            'tipo_peticao', 'origem', 'assunto', 'descricao', 'observacoes',
            'prioridade', 'peticionario_nome', 'peticionario_documento',
            'peticionario_email', 'peticionario_telefone', 'peticionario_endereco',
            'peticionario_cep', 'peticionario_cidade', 'peticionario_uf',
            'empresa_nome', 'empresa_cnpj', 'empresa_endereco', 'empresa_telefone',
            'empresa_email', 'valor_causa', 'data_fato', 'anonima', 'confidencial',
            'notificar_peticionario', 'dados_especificos'
        ]
    
    def create(self, validated_data):
        validated_data['usuario_criacao'] = self.context['request'].user
        validated_data['ip_origem'] = self.context['request'].META.get('REMOTE_ADDR')
        validated_data['user_agent'] = self.context['request'].META.get('HTTP_USER_AGENT', '')
        return super().create(validated_data)


class PeticaoPortalSerializer(serializers.ModelSerializer):
    """Serializer para petições do portal do cidadão"""
    
    class Meta:
        model = PeticaoEletronica
        fields = [
            'tipo_peticao', 'assunto', 'descricao', 'peticionario_nome',
            'peticionario_documento', 'peticionario_email', 'peticionario_telefone',
            'peticionario_endereco', 'peticionario_cep', 'peticionario_cidade',
            'peticionario_uf', 'empresa_nome', 'empresa_cnpj', 'empresa_endereco',
            'empresa_telefone', 'empresa_email', 'valor_causa', 'data_fato',
            'dados_especificos'
        ]
    
    def create(self, validated_data):
        validated_data['origem'] = 'PORTAL_CIDADAO'
        validated_data['status'] = 'RASCUNHO'
        validated_data['ip_origem'] = self.context['request'].META.get('REMOTE_ADDR')
        validated_data['user_agent'] = self.context['request'].META.get('HTTP_USER_AGENT', '')
        return super().create(validated_data)


class ConsultaPeticaoSerializer(serializers.Serializer):
    """Serializer para consulta de petições"""
    
    numero_peticao = serializers.CharField(required=False)
    protocolo_numero = serializers.CharField(required=False)
    peticionario_documento = serializers.CharField(required=False)
    peticionario_email = serializers.EmailField(required=False)
    
    def validate(self, data):
        """Valida que pelo menos um campo foi preenchido"""
        if not any(data.values()):
            raise serializers.ValidationError("Pelo menos um campo deve ser preenchido")
        return data


class ValidarDocumentoSerializer(serializers.Serializer):
    """Serializer para validação de documentos"""
    
    documento = serializers.CharField()
    tipo = serializers.ChoiceField(choices=[('CPF', 'CPF'), ('CNPJ', 'CNPJ')])
    
    def validate_documento(self, value):
        """Valida formato do documento"""
        import re
        
        # Remove caracteres especiais
        documento = re.sub(r'[^\d]', '', value)
        
        if self.initial_data.get('tipo') == 'CPF':
            if len(documento) != 11:
                raise serializers.ValidationError("CPF deve ter 11 dígitos")
        elif self.initial_data.get('tipo') == 'CNPJ':
            if len(documento) != 14:
                raise serializers.ValidationError("CNPJ deve ter 14 dígitos")
        
        return documento


class UploadAnexoSerializer(serializers.Serializer):
    """Serializer para upload de anexos"""
    
    arquivo = serializers.FileField()
    tipo = serializers.ChoiceField(choices=AnexoPeticao.TIPO_CHOICES)
    descricao = serializers.CharField(required=False, allow_blank=True)
    
    def validate_arquivo(self, value):
        """Valida o arquivo"""
        # Verifica tamanho máximo (10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Arquivo muito grande. Máximo 10MB")
        
        # Verifica extensão
        extensoes_permitidas = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in extensoes_permitidas:
            raise serializers.ValidationError(f"Tipo de arquivo não permitido. Permitidos: {', '.join(extensoes_permitidas)}")
        
        return value


class DashboardPeticionamentoSerializer(serializers.Serializer):
    """Serializer para dados do dashboard"""
    
    total_peticoes = serializers.IntegerField()
    peticoes_hoje = serializers.IntegerField()
    peticoes_vencidas = serializers.IntegerField()
    peticoes_prox_vencimento = serializers.IntegerField()
    peticoes_por_status = serializers.ListField()
    peticoes_por_tipo = serializers.ListField()
    ultimas_peticoes = PeticaoEletronicaListSerializer(many=True)
    peticoes_pendentes = PeticaoEletronicaListSerializer(many=True)


class ConfiguracaoPeticionamentoSerializer(serializers.ModelSerializer):
    """Serializer para configurações"""
    
    class Meta:
        model = ConfiguracaoPeticionamento
        fields = '__all__'

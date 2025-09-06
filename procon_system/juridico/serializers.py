from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    AnalistaJuridico, ProcessoJuridico, AnaliseJuridica, RespostaJuridica,
    PrazoJuridico, DocumentoJuridico, HistoricoJuridico, ConfiguracaoJuridico,
    RecursoAdministrativo, ParecerJuridico, DocumentoRecurso, WorkflowJuridico,
    HistoricoRecurso
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer para usuários"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class AnalistaJuridicoSerializer(serializers.ModelSerializer):
    """Serializer para analistas jurídicos"""
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AnalistaJuridico
        fields = [
            'id', 'user', 'user_id', 'oab', 'especialidade', 'ativo',
            'data_cadastro'
        ]
        read_only_fields = ['data_cadastro']


class ProcessoJuridicoListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de processos"""
    analista = AnalistaJuridicoSerializer(read_only=True)
    dias_restantes = serializers.ReadOnlyField()
    esta_atrasado = serializers.ReadOnlyField()
    
    class Meta:
        model = ProcessoJuridico
        fields = [
            'id', 'numero', 'numero_peticao', 'parte', 'empresa_cnpj',
            'assunto', 'status', 'prioridade', 'data_abertura', 'data_limite',
            'analista', 'dias_restantes', 'esta_atrasado'
        ]


class ProcessoJuridicoDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para processos"""
    analista = AnalistaJuridicoSerializer(read_only=True)
    criado_por = UserSerializer(read_only=True)
    modificado_por = UserSerializer(read_only=True)
    dias_restantes = serializers.ReadOnlyField()
    esta_atrasado = serializers.ReadOnlyField()
    
    class Meta:
        model = ProcessoJuridico
        fields = [
            'id', 'numero', 'numero_peticao', 'parte', 'empresa_cnpj',
            'assunto', 'descricao', 'valor_causa', 'status', 'prioridade',
            'data_abertura', 'data_limite', 'data_conclusao', 'analista',
            'criado_por', 'modificado_por', 'data_modificacao',
            'dias_restantes', 'esta_atrasado'
        ]
        read_only_fields = ['numero', 'data_abertura', 'data_modificacao']


class ProcessoJuridicoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de processos"""
    class Meta:
        model = ProcessoJuridico
        fields = [
            'numero_peticao', 'parte', 'empresa_cnpj', 'assunto', 'descricao',
            'valor_causa', 'status', 'prioridade', 'data_limite', 'analista'
        ]
    
    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class AnaliseJuridicaSerializer(serializers.ModelSerializer):
    """Serializer para análises jurídicas"""
    analista = AnalistaJuridicoSerializer(read_only=True)
    processo = ProcessoJuridicoListSerializer(read_only=True)
    
    class Meta:
        model = AnaliseJuridica
        fields = [
            'id', 'processo', 'tipo_analise', 'analista', 'fundamentacao',
            'conclusao', 'recomendacoes', 'data_analise', 'data_modificacao'
        ]
        read_only_fields = ['data_analise', 'data_modificacao']


class AnaliseJuridicaCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de análises"""
    class Meta:
        model = AnaliseJuridica
        fields = [
            'processo', 'tipo_analise', 'fundamentacao', 'conclusao', 'recomendacoes'
        ]
    
    def create(self, validated_data):
        # Buscar analista do usuário atual
        try:
            analista = AnalistaJuridico.objects.get(user=self.context['request'].user)
            validated_data['analista'] = analista
        except AnalistaJuridico.DoesNotExist:
            raise serializers.ValidationError("Usuário não é um analista jurídico")
        
        return super().create(validated_data)


class RespostaJuridicaSerializer(serializers.ModelSerializer):
    """Serializer para respostas jurídicas"""
    analista = AnalistaJuridicoSerializer(read_only=True)
    processo = ProcessoJuridicoListSerializer(read_only=True)
    
    class Meta:
        model = RespostaJuridica
        fields = [
            'id', 'processo', 'tipo_resposta', 'analista', 'titulo',
            'conteudo', 'fundamentacao_legal', 'data_elaboracao', 'data_envio', 'enviado'
        ]
        read_only_fields = ['data_elaboracao']


class RespostaJuridicaCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de respostas"""
    class Meta:
        model = RespostaJuridica
        fields = [
            'processo', 'tipo_resposta', 'titulo', 'conteudo', 'fundamentacao_legal'
        ]
    
    def create(self, validated_data):
        # Buscar analista do usuário atual
        try:
            analista = AnalistaJuridico.objects.get(user=self.context['request'].user)
            validated_data['analista'] = analista
        except AnalistaJuridico.DoesNotExist:
            raise serializers.ValidationError("Usuário não é um analista jurídico")
        
        return super().create(validated_data)


class PrazoJuridicoSerializer(serializers.ModelSerializer):
    """Serializer para prazos jurídicos"""
    responsavel = AnalistaJuridicoSerializer(read_only=True)
    processo = ProcessoJuridicoListSerializer(read_only=True)
    dias_restantes = serializers.ReadOnlyField()
    esta_vencido = serializers.ReadOnlyField()
    
    class Meta:
        model = PrazoJuridico
        fields = [
            'id', 'processo', 'tipo_prazo', 'descricao', 'data_inicio',
            'data_fim', 'data_cumprimento', 'status', 'responsavel',
            'notificar_antes', 'notificado', 'dias_restantes', 'esta_vencido'
        ]


class PrazoJuridicoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de prazos"""
    class Meta:
        model = PrazoJuridico
        fields = [
            'processo', 'tipo_prazo', 'descricao', 'data_inicio', 'data_fim',
            'notificar_antes'
        ]
    
    def create(self, validated_data):
        # Buscar analista do usuário atual
        try:
            analista = AnalistaJuridico.objects.get(user=self.context['request'].user)
            validated_data['responsavel'] = analista
        except AnalistaJuridico.DoesNotExist:
            raise serializers.ValidationError("Usuário não é um analista jurídico")
        
        return super().create(validated_data)


class DocumentoJuridicoSerializer(serializers.ModelSerializer):
    """Serializer para documentos jurídicos"""
    upload_por = UserSerializer(read_only=True)
    processo = ProcessoJuridicoListSerializer(read_only=True)
    
    class Meta:
        model = DocumentoJuridico
        fields = [
            'id', 'processo', 'tipo_documento', 'titulo', 'descricao',
            'arquivo', 'nome_arquivo', 'tamanho_arquivo', 'data_upload', 'upload_por'
        ]
        read_only_fields = ['nome_arquivo', 'tamanho_arquivo', 'data_upload']


class DocumentoJuridicoCreateSerializer(serializers.ModelSerializer):
    """Serializer para upload de documentos"""
    class Meta:
        model = DocumentoJuridico
        fields = [
            'processo', 'tipo_documento', 'titulo', 'descricao', 'arquivo'
        ]
    
    def create(self, validated_data):
        arquivo = validated_data.get('arquivo')
        if arquivo:
            validated_data['nome_arquivo'] = arquivo.name
            validated_data['tamanho_arquivo'] = arquivo.size
        
        validated_data['upload_por'] = self.context['request'].user
        return super().create(validated_data)


class HistoricoJuridicoSerializer(serializers.ModelSerializer):
    """Serializer para histórico jurídico"""
    usuario = UserSerializer(read_only=True)
    processo = ProcessoJuridicoListSerializer(read_only=True)
    
    class Meta:
        model = HistoricoJuridico
        fields = [
            'id', 'processo', 'usuario', 'acao', 'descricao',
            'dados_anteriores', 'dados_novos', 'data_alteracao', 'ip_origem'
        ]
        read_only_fields = ['data_alteracao']


class ConfiguracaoJuridicoSerializer(serializers.ModelSerializer):
    """Serializer para configurações jurídicas"""
    configurado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = ConfiguracaoJuridico
        fields = [
            'id', 'prazo_resposta_padrao', 'prazo_recurso_padrao',
            'notificar_prazos_vencendo', 'dias_antecedencia_notificacao',
            'permitir_upload_documentos', 'tamanho_maximo_arquivo',
            'tipos_arquivo_permitidos', 'data_configuracao', 'configurado_por'
        ]
        read_only_fields = ['data_configuracao']


# === SERIALIZERS PARA DASHBOARD ===

class DashboardJuridicoSerializer(serializers.Serializer):
    """Serializer para dados do dashboard jurídico"""
    total_processos = serializers.IntegerField()
    processos_abertos = serializers.IntegerField()
    processos_em_analise = serializers.IntegerField()
    processos_respondidos = serializers.IntegerField()
    processos_atrasados = serializers.IntegerField()
    prazos_vencendo = serializers.IntegerField()
    prazos_vencidos = serializers.IntegerField()
    
    # Estatísticas por status
    processos_por_status = serializers.DictField()
    
    # Estatísticas por prioridade
    processos_por_prioridade = serializers.DictField()
    
    # Processos recentes
    processos_recentes = ProcessoJuridicoListSerializer(many=True)
    
    # Prazos urgentes
    prazos_urgentes = PrazoJuridicoSerializer(many=True)


class ProcessoJuridicoStatsSerializer(serializers.Serializer):
    """Serializer para estatísticas de processos"""
    periodo = serializers.CharField()
    total_processos = serializers.IntegerField()
    processos_por_mes = serializers.ListField()
    analistas_mais_ativos = serializers.ListField()
    tipos_mais_comuns = serializers.ListField()


# === SERIALIZERS PARA FILTROS ===

class ProcessoJuridicoFilterSerializer(serializers.Serializer):
    """Serializer para filtros de processos"""
    status = serializers.CharField(required=False)
    prioridade = serializers.CharField(required=False)
    analista = serializers.IntegerField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    parte = serializers.CharField(required=False)
    assunto = serializers.CharField(required=False)
    atrasados = serializers.BooleanField(required=False)


class PrazoJuridicoFilterSerializer(serializers.Serializer):
    """Serializer para filtros de prazos"""
    status = serializers.CharField(required=False)
    tipo_prazo = serializers.CharField(required=False)
    responsavel = serializers.IntegerField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    vencidos = serializers.BooleanField(required=False)
    vencendo = serializers.BooleanField(required=False)

# === SERIALIZERS PARA RECURSOS ADMINISTRATIVOS ===

class RecursoAdministrativoListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de recursos"""
    analista_responsavel = AnalistaJuridicoSerializer(read_only=True)
    dias_restantes = serializers.ReadOnlyField()
    esta_atrasado = serializers.ReadOnlyField()
    
    class Meta:
        model = RecursoAdministrativo
        fields = [
            'id', 'numero', 'tipo_recurso', 'status', 'nome_recorrente',
            'cpf_cnpj_recorrente', 'valor_questionado', 'data_protocolo',
            'data_limite_analise', 'analista_responsavel', 'dias_restantes', 'esta_atrasado'
        ]


class RecursoAdministrativoDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para recursos"""
    analista_responsavel = AnalistaJuridicoSerializer(read_only=True)
    criado_por = UserSerializer(read_only=True)
    modificado_por = UserSerializer(read_only=True)
    dias_restantes = serializers.ReadOnlyField()
    esta_atrasado = serializers.ReadOnlyField()
    
    class Meta:
        model = RecursoAdministrativo
        fields = [
            'id', 'numero', 'tipo_recurso', 'status', 'processo_origem',
            'auto_infracao', 'multa', 'nome_recorrente', 'cpf_cnpj_recorrente',
            'email_recorrente', 'telefone_recorrente', 'fundamentacao', 'pedido',
            'valor_questionado', 'data_protocolo', 'data_limite_analise',
            'data_conclusao', 'analista_responsavel', 'criado_por', 'modificado_por',
            'data_modificacao', 'dias_restantes', 'esta_atrasado'
        ]
        read_only_fields = ['numero', 'data_protocolo', 'data_modificacao']


class RecursoAdministrativoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de recursos"""
    class Meta:
        model = RecursoAdministrativo
        fields = [
            'tipo_recurso', 'processo_origem', 'auto_infracao', 'multa',
            'nome_recorrente', 'cpf_cnpj_recorrente', 'email_recorrente',
            'telefone_recorrente', 'fundamentacao', 'pedido', 'valor_questionado',
            'data_limite_analise', 'analista_responsavel'
        ]
    
    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class ParecerJuridicoSerializer(serializers.ModelSerializer):
    """Serializer para pareceres jurídicos"""
    analista = AnalistaJuridicoSerializer(read_only=True)
    recurso = RecursoAdministrativoListSerializer(read_only=True)
    
    class Meta:
        model = ParecerJuridico
        fields = [
            'id', 'recurso', 'tipo_parecer', 'analista', 'fundamentacao_juridica',
            'analise_fatos', 'conclusao', 'recomendacao', 'observacoes',
            'data_elaboracao', 'data_modificacao', 'assinado', 'data_assinatura'
        ]
        read_only_fields = ['data_elaboracao', 'data_modificacao']


class ParecerJuridicoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de pareceres"""
    class Meta:
        model = ParecerJuridico
        fields = [
            'recurso', 'tipo_parecer', 'fundamentacao_juridica', 'analise_fatos',
            'conclusao', 'recomendacao', 'observacoes'
        ]
    
    def create(self, validated_data):
        # Buscar analista do usuário atual
        try:
            analista = AnalistaJuridico.objects.get(user=self.context['request'].user)
            validated_data['analista'] = analista
        except AnalistaJuridico.DoesNotExist:
            raise serializers.ValidationError("Usuário não é um analista jurídico")
        
        return super().create(validated_data)


class DocumentoRecursoSerializer(serializers.ModelSerializer):
    """Serializer para documentos de recursos"""
    upload_por = UserSerializer(read_only=True)
    recurso = RecursoAdministrativoListSerializer(read_only=True)
    
    class Meta:
        model = DocumentoRecurso
        fields = [
            'id', 'recurso', 'tipo_documento', 'titulo', 'descricao',
            'arquivo', 'nome_arquivo', 'tamanho_arquivo', 'data_upload', 'upload_por'
        ]
        read_only_fields = ['nome_arquivo', 'tamanho_arquivo', 'data_upload']


class DocumentoRecursoCreateSerializer(serializers.ModelSerializer):
    """Serializer para upload de documentos de recursos"""
    class Meta:
        model = DocumentoRecurso
        fields = [
            'recurso', 'tipo_documento', 'titulo', 'descricao', 'arquivo'
        ]
    
    def create(self, validated_data):
        arquivo = validated_data.get('arquivo')
        if arquivo:
            validated_data['nome_arquivo'] = arquivo.name
            validated_data['tamanho_arquivo'] = arquivo.size
        
        validated_data['upload_por'] = self.context['request'].user
        return super().create(validated_data)


class WorkflowJuridicoSerializer(serializers.ModelSerializer):
    """Serializer para workflows jurídicos"""
    responsavel_atual = AnalistaJuridicoSerializer(read_only=True)
    processo = ProcessoJuridicoListSerializer(read_only=True)
    recurso = RecursoAdministrativoListSerializer(read_only=True)
    parecer = ParecerJuridicoSerializer(read_only=True)
    
    class Meta:
        model = WorkflowJuridico
        fields = [
            'id', 'tipo_workflow', 'status', 'processo', 'recurso', 'parecer',
            'responsavel_atual', 'data_inicio', 'data_conclusao', 'observacoes'
        ]
        read_only_fields = ['data_inicio']


class HistoricoRecursoSerializer(serializers.ModelSerializer):
    """Serializer para histórico de recursos"""
    usuario = UserSerializer(read_only=True)
    recurso = RecursoAdministrativoListSerializer(read_only=True)
    
    class Meta:
        model = HistoricoRecurso
        fields = [
            'id', 'recurso', 'usuario', 'acao', 'descricao',
            'dados_anteriores', 'dados_novos', 'data_alteracao', 'ip_origem'
        ]
        read_only_fields = ['data_alteracao']


# === SERIALIZERS PARA DASHBOARD DE RECURSOS ===

class DashboardRecursosSerializer(serializers.Serializer):
    """Serializer para dados do dashboard de recursos"""
    total_recursos = serializers.IntegerField()
    recursos_protocolados = serializers.IntegerField()
    recursos_em_analise = serializers.IntegerField()
    recursos_deferidos = serializers.IntegerField()
    recursos_indefiridos = serializers.IntegerField()
    recursos_atrasados = serializers.IntegerField()
    
    # Estatísticas por tipo
    recursos_por_tipo = serializers.DictField()
    
    # Estatísticas por status
    recursos_por_status = serializers.DictField()
    
    # Recursos recentes
    recursos_recentes = RecursoAdministrativoListSerializer(many=True)
    
    # Pareceres pendentes
    pareceres_pendentes = ParecerJuridicoSerializer(many=True)


class RecursoFilterSerializer(serializers.Serializer):
    """Serializer para filtros de recursos"""
    tipo_recurso = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    analista = serializers.IntegerField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    nome_recorrente = serializers.CharField(required=False)
    cpf_cnpj = serializers.CharField(required=False)
    atrasados = serializers.BooleanField(required=False)

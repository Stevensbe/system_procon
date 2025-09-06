from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    TipoRelatorio, Relatorio, RelatorioAgendado, TemplateRelatorio,
    FiltroRelatorio, RelatorioCompartilhado, HistoricoRelatorio, ConfiguracaoRelatorio
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer para usuários"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class TipoRelatorioSerializer(serializers.ModelSerializer):
    """Serializer para tipos de relatórios"""
    class Meta:
        model = TipoRelatorio
        fields = [
            'id', 'nome', 'descricao', 'modulo', 'ativo', 'data_criacao'
        ]
        read_only_fields = ['data_criacao']


class RelatorioListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de relatórios"""
    tipo_relatorio = TipoRelatorioSerializer(read_only=True)
    solicitado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = Relatorio
        fields = [
            'id', 'titulo', 'tipo_relatorio', 'formato', 'status', 'progresso',
            'data_solicitacao', 'data_conclusao', 'solicitado_por', 'tempo_processamento'
        ]


class RelatorioDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para relatórios"""
    tipo_relatorio = TipoRelatorioSerializer(read_only=True)
    solicitado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = Relatorio
        fields = [
            'id', 'titulo', 'descricao', 'tipo_relatorio', 'parametros', 'filtros',
            'formato', 'status', 'progresso', 'data_solicitacao', 'data_conclusao',
            'arquivo', 'nome_arquivo', 'tamanho_arquivo', 'solicitado_por',
            'tempo_processamento', 'registros_processados', 'erro_mensagem'
        ]
        read_only_fields = [
            'data_solicitacao', 'data_conclusao', 'tempo_processamento',
            'registros_processados', 'progresso', 'nome_arquivo', 'tamanho_arquivo'
        ]


class RelatorioCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de relatórios"""
    class Meta:
        model = Relatorio
        fields = [
            'titulo', 'descricao', 'tipo_relatorio', 'parametros', 'filtros', 'formato'
        ]
    
    def create(self, validated_data):
        validated_data['solicitado_por'] = self.context['request'].user
        return super().create(validated_data)


class RelatorioAgendadoSerializer(serializers.ModelSerializer):
    """Serializer para relatórios agendados"""
    tipo_relatorio = TipoRelatorioSerializer(read_only=True)
    criado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = RelatorioAgendado
        fields = [
            'id', 'nome', 'descricao', 'tipo_relatorio', 'parametros', 'filtros',
            'formato', 'frequencia', 'proxima_execucao', 'ultima_execucao',
            'status', 'ativo', 'criado_por', 'data_criacao', 'data_modificacao'
        ]
        read_only_fields = ['data_criacao', 'data_modificacao', 'ultima_execucao']


class RelatorioAgendadoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de relatórios agendados"""
    class Meta:
        model = RelatorioAgendado
        fields = [
            'nome', 'descricao', 'tipo_relatorio', 'parametros', 'filtros',
            'formato', 'frequencia', 'proxima_execucao', 'status', 'ativo'
        ]
    
    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class TemplateRelatorioSerializer(serializers.ModelSerializer):
    """Serializer para templates de relatórios"""
    tipo_relatorio = TipoRelatorioSerializer(read_only=True)
    criado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = TemplateRelatorio
        fields = [
            'id', 'nome', 'descricao', 'tipo_relatorio', 'configuracao',
            'layout', 'css', 'ativo', 'padrao', 'criado_por', 'data_criacao'
        ]
        read_only_fields = ['data_criacao']


class TemplateRelatorioCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de templates"""
    class Meta:
        model = TemplateRelatorio
        fields = [
            'nome', 'descricao', 'tipo_relatorio', 'configuracao', 'layout', 'css',
            'ativo', 'padrao'
        ]
    
    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class FiltroRelatorioSerializer(serializers.ModelSerializer):
    """Serializer para filtros de relatórios"""
    tipo_relatorio = TipoRelatorioSerializer(read_only=True)
    
    class Meta:
        model = FiltroRelatorio
        fields = [
            'id', 'nome', 'descricao', 'tipo_relatorio', 'tipo_filtro', 'campo',
            'opcoes', 'obrigatorio', 'valor_padrao', 'ativo', 'ordem'
        ]


class RelatorioCompartilhadoSerializer(serializers.ModelSerializer):
    """Serializer para relatórios compartilhados"""
    relatorio = RelatorioListSerializer(read_only=True)
    compartilhado_por = UserSerializer(read_only=True)
    compartilhado_com = UserSerializer(read_only=True)
    
    class Meta:
        model = RelatorioCompartilhado
        fields = [
            'id', 'relatorio', 'compartilhado_por', 'compartilhado_com',
            'pode_visualizar', 'pode_baixar', 'pode_compartilhar',
            'data_compartilhamento', 'data_expiracao', 'ativo'
        ]
        read_only_fields = ['data_compartilhamento']


class RelatorioCompartilhadoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de compartilhamentos"""
    class Meta:
        model = RelatorioCompartilhado
        fields = [
            'relatorio', 'compartilhado_com', 'pode_visualizar', 'pode_baixar',
            'pode_compartilhar', 'data_expiracao', 'ativo'
        ]
    
    def create(self, validated_data):
        validated_data['compartilhado_por'] = self.context['request'].user
        return super().create(validated_data)


class HistoricoRelatorioSerializer(serializers.ModelSerializer):
    """Serializer para histórico de relatórios"""
    relatorio = RelatorioListSerializer(read_only=True)
    usuario = UserSerializer(read_only=True)
    
    class Meta:
        model = HistoricoRelatorio
        fields = [
            'id', 'relatorio', 'usuario', 'status', 'tempo_processamento',
            'registros_processados', 'erro_mensagem', 'data_execucao', 'ip_origem'
        ]
        read_only_fields = ['data_execucao']


class ConfiguracaoRelatorioSerializer(serializers.ModelSerializer):
    """Serializer para configurações de relatórios"""
    configurado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = ConfiguracaoRelatorio
        fields = [
            'id', 'max_relatorios_por_usuario', 'max_tamanho_arquivo',
            'tempo_maximo_processamento', 'dias_retencao_relatorios',
            'dias_retencao_agendados', 'notificar_conclusao', 'notificar_erro',
            'formato_padrao', 'compressao_arquivos', 'configurado_por', 'data_configuracao'
        ]
        read_only_fields = ['data_configuracao']


# === SERIALIZERS PARA DASHBOARD ===

class DashboardRelatoriosSerializer(serializers.Serializer):
    """Serializer para dados do dashboard de relatórios"""
    total_relatorios = serializers.IntegerField()
    relatorios_pendentes = serializers.IntegerField()
    relatorios_concluidos = serializers.IntegerField()
    relatorios_erro = serializers.IntegerField()
    relatorios_agendados = serializers.IntegerField()
    
    # Estatísticas por formato
    relatorios_por_formato = serializers.DictField()
    
    # Estatísticas por status
    relatorios_por_status = serializers.DictField()
    
    # Relatórios recentes
    relatorios_recentes = RelatorioListSerializer(many=True)
    
    # Agendamentos próximos
    agendamentos_proximos = RelatorioAgendadoSerializer(many=True)


class RelatorioStatsSerializer(serializers.Serializer):
    """Serializer para estatísticas de relatórios"""
    periodo = serializers.CharField()
    total_relatorios = serializers.IntegerField()
    relatorios_por_mes = serializers.ListField()
    usuarios_mais_ativos = serializers.ListField()
    tipos_mais_utilizados = serializers.ListField()


# === SERIALIZERS PARA FILTROS ===

class RelatorioFilterSerializer(serializers.Serializer):
    """Serializer para filtros de relatórios"""
    tipo_relatorio = serializers.IntegerField(required=False)
    status = serializers.CharField(required=False)
    formato = serializers.CharField(required=False)
    solicitado_por = serializers.IntegerField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    titulo = serializers.CharField(required=False)


class RelatorioAgendadoFilterSerializer(serializers.Serializer):
    """Serializer para filtros de relatórios agendados"""
    tipo_relatorio = serializers.IntegerField(required=False)
    frequencia = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    ativo = serializers.BooleanField(required=False)
    criado_por = serializers.IntegerField(required=False)
    proxima_execucao_inicio = serializers.DateTimeField(required=False)
    proxima_execucao_fim = serializers.DateTimeField(required=False)


# === SERIALIZERS PARA EXECUÇÃO ===

class ExecutarRelatorioSerializer(serializers.Serializer):
    """Serializer para execução de relatórios"""
    tipo_relatorio = serializers.IntegerField()
    titulo = serializers.CharField(max_length=200)
    descricao = serializers.CharField(required=False, allow_blank=True)
    parametros = serializers.DictField(required=False, default=dict)
    filtros = serializers.DictField(required=False, default=dict)
    formato = serializers.ChoiceField(choices=Relatorio.FORMATO_CHOICES, default='PDF')


class CancelarRelatorioSerializer(serializers.Serializer):
    """Serializer para cancelamento de relatórios"""
    motivo = serializers.CharField(required=False, allow_blank=True)


class CompartilharRelatorioSerializer(serializers.Serializer):
    """Serializer para compartilhamento de relatórios"""
    relatorio = serializers.IntegerField()
    usuarios = serializers.ListField(child=serializers.IntegerField())
    pode_visualizar = serializers.BooleanField(default=True)
    pode_baixar = serializers.BooleanField(default=True)
    pode_compartilhar = serializers.BooleanField(default=False)
    data_expiracao = serializers.DateTimeField(required=False)

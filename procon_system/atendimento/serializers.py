from rest_framework import serializers
from portal_cidadao.models import ReclamacaoDenuncia, HistoricoReclamacao, AnexoReclamacao
from .models import (
    BalcaoAtendimento,
    SenhaAtendimento,
    FilaAtendimento,
    ConfiguracaoAtendimento,
    RegraDistribuicaoAtendimento,
)


class HistoricoReclamacaoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.SerializerMethodField()

    class Meta:
        model = HistoricoReclamacao
        fields = [
            'id',
            'acao',
            'descricao',
            'observacoes',
            'data_acao',
            'usuario_nome',
        ]

    def get_usuario_nome(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or obj.usuario.get_username()
        return None


class AnexoReclamacaoSerializer(serializers.ModelSerializer):
    arquivo_url = serializers.SerializerMethodField()

    class Meta:
        model = AnexoReclamacao
        fields = [
            'id',
            'descricao',
            'tipo_documento',
            'data_upload',
            'tamanho_bytes',
            'content_type',
            'checksum_sha256',
            'armazenamento_origem',
            'removido_em',
            'arquivo_url',
        ]

    def get_arquivo_url(self, obj):
        if obj.removido_em or not obj.arquivo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.arquivo.url)
        return obj.arquivo.url


class ReclamacaoDenunciaListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tipo_demanda_display = serializers.CharField(source='get_tipo_demanda_display', read_only=True)

    class Meta:
        model = ReclamacaoDenuncia
        fields = [
            'id',
            'numero_protocolo',
            'tipo_demanda',
            'tipo_demanda_display',
            'status',
            'status_display',
            'consumidor_nome',
            'consumidor_cpf',
            'consumidor_cidade',
            'consumidor_uf',
            'empresa_razao_social',
            'empresa_cnpj',
            'criado_em',
            'atualizado_em',
        ]


class ReclamacaoDenunciaDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tipo_demanda_display = serializers.CharField(source='get_tipo_demanda_display', read_only=True)
    tipo_classificacao_display = serializers.CharField(source='get_tipo_classificacao_display', read_only=True)
    resultado_conciliacao_display = serializers.CharField(source='get_resultado_conciliacao_display', read_only=True)
    tipo_decisao_display = serializers.CharField(source='get_tipo_decisao_display', read_only=True)
    tipo_penalidade_display = serializers.CharField(source='get_tipo_penalidade_display', read_only=True)
    historico = HistoricoReclamacaoSerializer(many=True, read_only=True)
    anexos = AnexoReclamacaoSerializer(many=True, read_only=True)
    atendente_responsavel_nome = serializers.SerializerMethodField()
    analista_responsavel_nome = serializers.SerializerMethodField()
    atendimento = serializers.SerializerMethodField()
    ata_conciliacao_url = serializers.SerializerMethodField()
    decisao_documento_url = serializers.SerializerMethodField()

    class Meta:
        model = ReclamacaoDenuncia
        fields = [
            'id',
            'numero_protocolo',
            'tipo_demanda',
            'tipo_demanda_display',
            'status',
            'status_display',
            'tipo_classificacao',
            'tipo_classificacao_display',
            'assunto_classificado',
            'competencia_procon',
            'observacoes_analise',
            'consumidor_nome',
            'consumidor_cpf',
            'consumidor_email',
            'consumidor_telefone',
            'consumidor_endereco',
            'consumidor_cep',
            'consumidor_cidade',
            'consumidor_uf',
            'empresa_razao_social',
            'empresa_cnpj',
            'empresa_endereco',
            'empresa_telefone',
            'empresa_email',
            'descricao_fatos',
            'data_ocorrencia',
            'valor_envolvido',
            'notificacao_enviada',
            'data_notificacao',
            'prazo_resposta',
            'resposta_recebida',
            'data_resposta',
            'conteudo_resposta',
            'conciliacao_marcada',
            'data_conciliacao',
            'conciliacao_realizada',
            'resultado_conciliacao',
            'resultado_conciliacao_display',
            'valor_acordo',
            'instrucao_iniciada',
            'data_inicio_instrucao',
            'provas_coletadas',
            'impugnacao_consumidor',
            'encaminhado_juridico_1',
            'encaminhado_juridico_2',
            'decisao_elaborada',
            'data_decisao',
            'tipo_decisao',
            'tipo_decisao_display',
            'fundamentacao_decisao',
            'penalidade_aplicada',
            'tipo_penalidade',
            'tipo_penalidade_display',
            'valor_multa',
            'boleto_emitido',
            'auto_infracao_relacionado',
            'recurso_apresentado',
            'data_recurso',
            'tipo_recurso',
            'decisao_recurso',
            'atendente_responsavel',
            'atendente_responsavel_nome',
            'analista_responsavel',
            'analista_responsavel_nome',
            'criado_em',
            'atualizado_em',
            'historico',
            'anexos',
            'atendimento',
            'ata_conciliacao_url',
            'decisao_documento_url',
        ]

    def get_atendente_responsavel_nome(self, obj):
        if obj.atendente_responsavel:
            return obj.atendente_responsavel.get_full_name() or obj.atendente_responsavel.get_username()
        return None

    def get_analista_responsavel_nome(self, obj):
        if obj.analista_responsavel:
            return obj.analista_responsavel.get_full_name() or obj.analista_responsavel.get_username()
        return None

    def get_atendimento(self, obj):
        atendimento = getattr(obj, 'atendimento', None)
        if not atendimento:
            return None

        return {
            'id': atendimento.id,
            'consentimento_lgpd': atendimento.consentimento_lgpd,
            'consentimento_origem': atendimento.consentimento_origem,
            'consentimento_registrado_em': atendimento.consentimento_registrado_em,
            'dados_remocao_solicitada_em': atendimento.dados_remocao_solicitada_em,
            'dados_removidos_em': atendimento.dados_removidos_em,
            'dados_remocao_observacoes': atendimento.dados_remocao_observacoes,
        }

    def get_ata_conciliacao_url(self, obj):
        if not obj.ata_conciliacao:
            return None
        request = self.context.get('request')
        url = obj.ata_conciliacao.url
        return request.build_absolute_uri(url) if request else url

    def get_decisao_documento_url(self, obj):
        if not obj.decisao_documento:
            return None
        request = self.context.get('request')
        url = obj.decisao_documento.url
        return request.build_absolute_uri(url) if request else url

    def to_representation(self, instance):
        """Inclui contexto para gerar URLs absolutas dos anexos"""
        representation = super().to_representation(instance)
        anexos_serializer = AnexoReclamacaoSerializer(
            instance.anexos.all(),
            many=True,
            context=self.context,
        )
        representation['anexos'] = anexos_serializer.data
        return representation


class ConfiguracaoAtendimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoAtendimento
        fields = [
            'prazo_resposta_dias',
            'prazo_conciliacao_dias',
            'prazo_decisao_dias',
        ]

    @staticmethod
    def _validate_positive(name, value):
        if value is None:
            return value
        if value < 0:
            raise serializers.ValidationError(f'{name} deve ser um valor positivo.')
        return value

    def validate_prazo_resposta_dias(self, value):
        return self._validate_positive('Prazo de resposta', value)

    def validate_prazo_conciliacao_dias(self, value):
        return self._validate_positive('Prazo de conciliação', value)

    def validate_prazo_decisao_dias(self, value):
        return self._validate_positive('Prazo de decisão', value)


class RegraDistribuicaoSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.SerializerMethodField()

    class Meta:
        model = RegraDistribuicaoAtendimento
        fields = [
            'id',
            'nome',
            'prioridade',
            'ativo',
            'gravidade',
            'assunto',
            'tipo_classificacao',
            'responsavel',
            'responsavel_nome',
            'criado_em',
            'atualizado_em',
        ]
        read_only_fields = ['criado_em', 'atualizado_em']

    def get_responsavel_nome(self, obj):
        return obj.responsavel.get_full_name() or obj.responsavel.get_username()


class BalcaoAtendimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BalcaoAtendimento
        fields = [
            'id', 'nome', 'codigo', 'descricao', 'localizacao', 'ativo',
            'ordem_prioridade', 'capacidade_simultanea', 'ultima_chamada_em',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['ultima_chamada_em', 'criado_em', 'atualizado_em']


class SenhaAtendimentoSerializer(serializers.ModelSerializer):
    balcao_codigo = serializers.CharField(source='balcao.codigo', read_only=True)
    balcao_nome = serializers.CharField(source='balcao.nome', read_only=True)

    class Meta:
        model = SenhaAtendimento
        fields = [
            'id', 'balcao', 'balcao_codigo', 'balcao_nome', 'sequencia_diaria',
            'identificador', 'prioridade', 'status', 'emitido_em', 'chamado_em',
            'iniciado_em', 'finalizado_em', 'cancelado_em', 'atendente_responsavel',
            'observacoes'
        ]
        read_only_fields = [
            'sequencia_diaria', 'identificador', 'status', 'emitido_em',
            'chamado_em', 'iniciado_em', 'finalizado_em', 'cancelado_em',
            'atendente_responsavel'
        ]


class FilaAtendimentoSerializer(serializers.ModelSerializer):
    balcao = BalcaoAtendimentoSerializer(read_only=True)

    class Meta:
        model = FilaAtendimento
        fields = [
            'id',
            'balcao',
            'data_referencia',
            'status',
            'quantidade_emitidas',
            'quantidade_chamadas',
            'quantidade_finalizadas',
            'ultima_senha_emitida',
            'ultima_senha_chamada',
            'criado_em',
            'atualizado_em',
        ]


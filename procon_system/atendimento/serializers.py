from rest_framework import serializers
from portal_cidadao.models import ReclamacaoDenuncia, HistoricoReclamacao, AnexoReclamacao


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
            'arquivo_url',
        ]

    def get_arquivo_url(self, obj):
        request = self.context.get('request')
        if obj.arquivo:
            if request:
                return request.build_absolute_uri(obj.arquivo.url)
            return obj.arquivo.url
        return None


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
        ]

    def get_atendente_responsavel_nome(self, obj):
        if obj.atendente_responsavel:
            return obj.atendente_responsavel.get_full_name() or obj.atendente_responsavel.get_username()
        return None

    def get_analista_responsavel_nome(self, obj):
        if obj.analista_responsavel:
            return obj.analista_responsavel.get_full_name() or obj.analista_responsavel.get_username()
        return None

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

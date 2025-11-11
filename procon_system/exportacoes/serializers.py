from rest_framework import serializers

from .models import (
    TipoExportacao,
    DestinacaoExportacao,
    TemplateExportacao,
    AgendamentoExportacao,
    ExecucaoExportacao,
    HistoricoExportacao,
)


class TipoExportacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoExportacao
        fields = [
            "id",
            "codigo",
            "nome_exibicao",
            "descricao",
            "frequencia_automatica",
            "tipos_documentos_incluir",
            "filtros_aplicar",
            "campos_exportar",
            "orgao_destino_nome",
            "formato_arquivo",
            "ativo",
            "validação_obrigatoria",
            "enviar_email_notificacao",
            "criado_por",
            "data_criacao",
            "data_atualizacao",
        ]
        read_only_fields = ["data_criacao", "data_atualizacao", "criado_por"]


class DestinacaoExportacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinacaoExportacao
        fields = [
            "id",
            "nome_destinacao",
            "destinatario_orgao",
            "destinatario_email",
            "destinatario_endpoint_api",
            "destinatario_friendly_name",
            "metodo_envio",
            "configuracao_envio",
            "credencial_envio",
            "require_confirmacao_envio",
            "template_confirmacao",
            "ativo",
        ]


class TemplateExportacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateExportacao
        fields = [
            "id",
            "tipo_exportacao",
            "nome_template",
            "versao_template",
            "estrutura_cabecalho",
            "estrutura_rodape",
            "template_registro_reclamacao",
            "template_registro_cip",
            "template_registro_audiencia",
            "template_registro_decisions",
            "separador_campos",
            "encoding_arquivo",
            "include_bom",
            "aplicar_validacoes",
            "requer_assinatura_digital",
            "ativo",
            "criado_por",
            "data_criacao",
            "data_atualizacao",
        ]
        read_only_fields = ["data_criacao", "data_atualizacao", "criado_por"]


class AgendamentoExportacaoSerializer(serializers.ModelSerializer):
    tipo_exportacao_info = TipoExportacaoSerializer(source="tipo_exportacao", read_only=True)

    class Meta:
        model = AgendamentoExportacao
        fields = [
            "id",
            "tipo_exportacao",
            "tipo_exportacao_info",
            "periodo_de",
            "periodo_ate",
            "status",
            "data_agendamento",
            "data_execucao_inicio",
            "data_execucao_fim",
            "parametros_especificos",
            "arquivo_gerado",
            "tamanho_arquivo_mb",
            "quantidade_registros",
            "executado_por",
            "log_execucao",
            "erros_processamento",
        ]
        read_only_fields = [
            "data_agendamento",
            "data_execucao_inicio",
            "data_execucao_fim",
            "arquivo_gerado",
            "tamanho_arquivo_mb",
            "quantidade_registros",
            "executado_por",
            "log_execucao",
            "erros_processamento",
        ]


class ExecucaoExportacaoSerializer(serializers.ModelSerializer):
    agendamento_info = AgendamentoExportacaoSerializer(source="agendamento", read_only=True)

    class Meta:
        model = ExecucaoExportacao
        fields = [
            "id",
            "agendamento",
            "agendamento_info",
            "status",
            "data_inicio",
            "data_fim",
            "total_consulta_db",
            "registros_processados",
            "tamanho_dados_processados_mb",
            "arquivos_gerados",
            "stats_processamento",
            "erros_criticidade_alta",
            "erros_criticidade_media",
            "erros_criticidade_baixa",
            "warnings_processamento",
            "observacoes_execucao",
            "validações_realizadas",
        ]
        read_only_fields = ["data_inicio", "data_fim"]


class HistoricoExportacaoSerializer(serializers.ModelSerializer):
    agendamento_info = AgendamentoExportacaoSerializer(source="agendamento", read_only=True)

    class Meta:
        model = HistoricoExportacao
        fields = [
            "id",
            "agendamento",
            "agendamento_info",
            "evento_acao",
            "descricao_evento",
            "dados_contextuais",
            "data_evento",
            "duracao_parte_segundos",
            "usuario_responsavel",
        ]
        read_only_fields = ["data_evento"]


from rest_framework import serializers

from .models import (
    OrgaoExterno,
    CredencialAcesso,
    EnvioDocumentoExterno,
    TemplateIntegracao,
    EventoIntegracao,
    MetricasIntegracao,
)


class CredencialAcessoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CredencialAcesso
        fields = [
            "id",
            "orgao",
            "nome_credencial",
            "status",
            "api_key_value",
            "bearer_token",
            "username_auth",
            "password_auth",
            "certificate_file",
            "data_criacao",
            "data_expiracao",
            "data_ultimo_usado",
            "criado_por",
            "responsavel_atual",
            "ambiente",
            "escopo_limitado",
            "limite_requests_hora",
        ]
        read_only_fields = ["data_criacao", "data_ultimo_usado"]


class OrgaoExternoSerializer(serializers.ModelSerializer):
    credenciais = CredencialAcessoSerializer(many=True, read_only=True)

    class Meta:
        model = OrgaoExterno
        fields = [
            "id",
            "nome",
            "codigo_identificacao",
            "tipo_orgao",
            "status",
            "email_contato",
            "telefone_contato",
            "responsavel_contato",
            "endereco_completo",
            "cidade",
            "estado",
            "possui_api_integrada",
            "api_endpoint_base",
            "api_authentication_type",
            "automatic_sync_enabled",
            "automatic_sync_interval_hours",
            "tipos_documentos_enviados",
            "data_registro",
            "data_ultimo_sync",
            "data_proximo_sync",
            "formato_dados",
            "require_ssl",
            "timeout_segundos",
            "retry_max_tentativas",
            "credenciais",
        ]
        read_only_fields = ["data_registro", "data_ultimo_sync", "data_proximo_sync", "credenciais"]


class EnvioDocumentoExternoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnvioDocumentoExterno
        fields = [
            "id",
            "orgao_destino",
            "credencial_usada",
            "tipo_documento",
            "protocolo_interno",
            "cip_relacionada",
            "audiencia_relacionada",
            "dados_enviados",
            "payload_completo",
            "status_envio",
            "tentativas_envio",
            "maximo_tentativas",
            "data_criacao",
            "data_envio",
            "data_aceite_rejeicao",
            "protocolo_externo",
            "codigo_resposta_http",
            "resposta_orcao_externo",
            "header_resposta",
            "erro_envio",
            "detalhes_erro",
            "enviado_por",
            "observacoes",
        ]
        read_only_fields = [
            "data_criacao",
            "data_envio",
            "data_aceite_rejeicao",
            "tentativas_envio",
            "codigo_resposta_http",
            "resposta_orcao_externo",
            "header_resposta",
        ]


class TemplateIntegracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateIntegracao
        fields = [
            "id",
            "orgao",
            "nome_template",
            "tipo_documento_aplicavel",
            "versao_template",
            "template_payload",
            "campos_obrigatorios",
            "campos_opcionais",
            "url_envio",
            "metodo_http",
            "ativo",
            "require_validação",
            "criado_por",
            "data_criacao",
            "data_atualizacao",
        ]
        read_only_fields = ["data_criacao", "data_atualizacao"]


class EventoIntegracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoIntegracao
        fields = [
            "id",
            "tipo_evento",
            "orgao_relacionado",
            "envio_relacionado",
            "titulo_evento",
            "descricao_evento",
            "severity",
            "dados_evento",
            "processado",
            "data_evento",
            "processado_em",
            "acoes_tomadas",
            "notificacoes_enviadas",
        ]
        read_only_fields = ["data_evento", "processado_em"]


class MetricasIntegracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricasIntegracao
        fields = [
            "id",
            "orgao",
            "data_analise",
            "periodo_horas",
            "total_envios",
            "envios_sucesso",
            "envios_falha",
            "taxa_sucesso_percent",
            "tempo_resposta_medio_ms",
            "tempo_resposta_max_ms",
            "bandwidth_usado_mb",
            "requests_api_feitos",
            "limite_erro_atingido",
            "sla_atingido",
        ]


from rest_framework import serializers

from django.contrib.auth import get_user_model

from atendimento.models import Atendimento
from portal_cidadao.models import ReclamacaoDenuncia

from portal_empresa.models import (
    APIAnalytics,
    EmpresaAutorizada,
    HistoricoEmpresaPortal,
    RespostaEmpresaPortal,
    TokenEmpresa,
    UsuarioEmpresaAutorizado,
    WebhookConfiguration,
    SolicitacaoCadastroEmpresa,
)

User = get_user_model()


class EmpresaAutorizadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpresaAutorizada
        fields = [
            "id",
            "razao_social",
            "nome_fantasia",
            "cnpj",
            "email_principal",
            "telefone_principal",
            "responsavel_legal",
            "endereco_completo",
            "cidade",
            "estado",
            "cep",
            "status",
            "nivel_acesso",
            "api_key",
            "webhook_endpoint",
            "data_registro",
            "data_ultimo_acesso",
            "data_expiracao_acesso",
            "receber_notificacoes_cip",
            "receber_notificacoes_audiencia",
            "receber_comunicacoes_gerais",
            "canal_contato_preferencial",
            "integracao_automatica",
            "sistema_interno_nome",
            "sistema_interno_url",
        ]
        read_only_fields = fields


class UsuarioEmpresaAutorizadoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source="usuario.get_full_name", read_only=True)
    usuario_email = serializers.EmailField(source="usuario.email", read_only=True)

    class Meta:
        model = UsuarioEmpresaAutorizado
        fields = [
            "id",
            "empresa",
            "usuario",
            "usuario_nome",
            "usuario_email",
            "nivel_permissao",
            "pode_responder_cip",
            "pode_agendar_audiencia",
            "pode_visualizar_relatorios",
            "pode_configurar_webhook",
            "pode_gerenciar_usuarios",
            "data_autorizacao",
            "data_ultimo_acesso",
            "ativo",
        ]
        read_only_fields = [
            "id",
            "empresa",
            "usuario",
            "usuario_nome",
            "usuario_email",
            "nivel_permissao",
            "data_autorizacao",
            "data_ultimo_acesso",
        ]


class TokenEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TokenEmpresa
        fields = [
            "id",
            "empresa",
            "token",
            "refresh_token",
            "data_criacao",
            "data_expiracao",
            "usado_em",
            "contador_acesso",
            "ultimo_ip_acesso",
            "escopo_permitido",
            "ips_permitidos",
            "ativo",
            "revogado_em",
            "motivo_revocacao",
        ]
        read_only_fields = fields


class RespostaEmpresaPortalSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = RespostaEmpresaPortal
        fields = [
            "id",
            "empresa",
            "reclamacao_relacionada",
            "usuario_enviador",
            "token_usado",
            "cip_relacionada",
            "audiencia_relacionada",
            "tipo_documento",
            "titulo_resposta",
            "conteudo_resposta",
            "documentos_anexados",
            "quantidade_anexos",
            "valor_proposta",
            "prazo_pagamento_proposta",
            "forma_pagamento_proposta",
            "status",
            "status_label",
            "data_criacao",
            "data_envio",
            "data_recebimento",
            "prazo_analise",
            "revisado_por",
            "data_revisao",
            "parecer_revisor",
        ]
        read_only_fields = fields


class RespostaEmpresaEnvioSerializer(serializers.Serializer):
    empresa = serializers.PrimaryKeyRelatedField(queryset=EmpresaAutorizada.objects.all())
    usuario_enviador = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    token_usado = serializers.PrimaryKeyRelatedField(queryset=TokenEmpresa.objects.all(), required=False, allow_null=True)
    tipo_documento = serializers.ChoiceField(choices=RespostaEmpresaPortal.TIPO_DOCUMENTO_CHOICES)
    titulo = serializers.CharField(max_length=200)
    conteudo = serializers.CharField()
    anexos = serializers.ListField(child=serializers.DictField(), required=False)
    valor_proposta = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    prazo_pagamento = serializers.IntegerField(required=False, allow_null=True)
    forma_pagamento = serializers.CharField(max_length=50, required=False, allow_blank=True)
    cip_id = serializers.UUIDField(required=False)
    audiencia_id = serializers.UUIDField(required=False)


class ReclamacaoEmpresaSerializer(serializers.ModelSerializer):
    anexos = serializers.SerializerMethodField()
    historico = serializers.SerializerMethodField()
    atendimento = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    pode_responder = serializers.SerializerMethodField()
    respostas_enviadas = serializers.SerializerMethodField()

    class Meta:
        model = ReclamacaoDenuncia
        fields = [
            "id",
            "numero_protocolo",
            "tipo_demanda",
            "status",
            "status_label",
            "criado_em",
            "prazo_resposta",
            "valor_envolvido",
            "descricao_fatos",
            "empresa_razao_social",
            "empresa_cnpj",
            "anexos",
            "historico",
            "atendimento",
            "pode_responder",
            "respostas_enviadas",
        ]
        read_only_fields = fields

    def get_anexos(self, obj):
        queryset = obj.anexos.filter(removido_em__isnull=True).order_by("-data_upload")
        request = self.context.get("request")
        resultado = []
        for anexo in queryset:
            arquivo_url = ""
            if anexo.arquivo and hasattr(anexo.arquivo, "url"):
                arquivo_url = anexo.arquivo.url
                if request is not None:
                    arquivo_url = request.build_absolute_uri(arquivo_url)
            resultado.append(
                {
                    "id": anexo.id,
                    "descricao": anexo.descricao,
                    "tipo_documento": anexo.tipo_documento,
                    "tamanho_bytes": anexo.tamanho_bytes,
                    "checksum": anexo.checksum_sha256,
                    "content_type": anexo.content_type,
                    "data_upload": anexo.data_upload,
                    "arquivo_url": arquivo_url,
                }
            )
        return resultado

    def get_historico(self, obj):
        registros = obj.historico.all().order_by("-data_acao")[:10]
        return [
            {
                "id": item.id,
                "acao": item.acao,
                "descricao": item.descricao,
                "observacoes": item.observacoes,
                "data_acao": item.data_acao,
                "usuario": item.usuario.get_full_name() if item.usuario else None,
            }
            for item in registros
        ]

    def get_atendimento(self, obj):
        atendimento = getattr(obj, "atendimento", None)
        if not isinstance(atendimento, Atendimento):
            return None
        return {
            "id": atendimento.id,
            "numero_atendimento": atendimento.numero_atendimento,
            "status": atendimento.status,
            "canal_atendimento": atendimento.canal_atendimento,
            "gravidade": atendimento.gravidade,
            "atendente": atendimento.atendente.username if atendimento.atendente else None,
            "consentimento_registrado_em": atendimento.consentimento_registrado_em,
        }

    def get_pode_responder(self, obj):
        return obj.status not in {"arquivada"}

    def get_respostas_enviadas(self, obj):
        respostas_qs = getattr(obj, "respostas_portal", None)
        if respostas_qs is None:
            return []
        return [
            {
                "id": resposta.id,
                "titulo": resposta.titulo_resposta,
                "tipo_documento": resposta.tipo_documento,
                "status": resposta.status,
                "data_envio": resposta.data_envio or resposta.data_criacao,
                "valor_proposta": resposta.valor_proposta,
                "prazo_pagamento_proposta": resposta.prazo_pagamento_proposta,
            }
            for resposta in respostas_qs.order_by("-data_envio", "-data_criacao")
        ]


class HistoricoEmpresaPortalSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricoEmpresaPortal
        fields = [
            "id",
            "empresa",
            "acao",
            "descricao",
            "usuario_responsavel",
            "nivel_criticidade",
            "metadados",
            "criado_em",
        ]
        read_only_fields = fields


class WebhookConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookConfiguration
        fields = [
            "id",
            "empresa",
            "endpoint_url",
            "segredo_assinatura",
            "eventos_habilitados",
            "ativo",
            "ultimo_envio",
            "total_eventos_enviados",
            "tentativas_falhas",
        ]
        read_only_fields = fields


class APIAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIAnalytics
        fields = [
            "id",
            "empresa",
            "endpoint",
            "metodo",
            "sucesso",
            "codigo_resposta",
            "tempo_resposta_ms",
            "data_chamada",
            "payload_resumido",
            "erro_reportado",
        ]
        read_only_fields = fields


class SolicitacaoCadastroEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitacaoCadastroEmpresa
        fields = "__all__"
        read_only_fields = [
            "status",
            "analisado_por",
            "analisado_em",
            "motivo_rejeicao",
            "criado_em",
            "atualizado_em",
        ]

from django.utils import timezone
from rest_framework import serializers

from .models import (
    SessaoConsulta,
    HistoricoConsulta,
    NotificacaoConsumidor,
    FeedbackConsumidor,
    TipoConsulta,
    TicketSuporteConsumidor,
)


class SessaoConsultaCreateSerializer(serializers.Serializer):
    """Payload apresentado pelo portal externo para abertura de sessão."""

    tipo_consulta = serializers.ChoiceField(
        choices=TipoConsulta.choices,
        default=TipoConsulta.PROTOCOLO,
    )


class SessaoConsultaSerializer(serializers.ModelSerializer):
    """Serializa detalhes da sessão expostos à aplicação externa."""

    is_valida = serializers.SerializerMethodField()

    class Meta:
        model = SessaoConsulta
        fields = [
            "id",
            "token_consulta",
            "tipo_consulta",
            "ip_address",
            "user_agent",
            "data_criacao",
            "data_expiracao",
            "status",
            "limite_maximo_consultas",
            "consultas_realizadas",
            "tentativas_falhadas",
            "paginas_acessadas",
            "is_valida",
        ]
        read_only_fields = [
            "id",
            "token_consulta",
            "ip_address",
            "user_agent",
            "data_criacao",
            "data_expiracao",
            "status",
            "consultas_realizadas",
            "tentativas_falhadas",
            "paginas_acessadas",
        ]

    def get_is_valida(self, obj: SessaoConsulta) -> bool:
        return obj.is_valid()


class ConsultaRequestSerializer(serializers.Serializer):
    """Parâmetros aceitos ao consultar documentos na sessão."""

    token = serializers.CharField(max_length=100)
    protocolo = serializers.CharField(max_length=50, required=False, allow_blank=True)
    cpf = serializers.CharField(max_length=15, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not any(attrs.get(field) for field in ("protocolo", "cpf", "email")):
            raise serializers.ValidationError(
                "Informe ao menos um critério (protocolo, cpf ou email)."
            )
        return attrs


class HistoricoConsultaSerializer(serializers.ModelSerializer):
    """Histórico de consultas executadas pelo consumidor."""

    class Meta:
        model = HistoricoConsulta
        fields = [
            "id",
            "sessao",
            "protocolo_buscado",
            "cpf_informado",
            "tipo_reclamacao_buscada",
            "resultado",
            "documentos_encontrados",
            "quantidade_encontrada",
            "data_consulta",
            "tempo_gasto_esta_consulta",
            "satisfacao_usuario",
            "comentario_usuario",
        ]
        read_only_fields = fields


class NotificacaoConsumidorSerializer(serializers.ModelSerializer):
    """Dados das notificações entregues ao consumidor."""

    status_label = serializers.CharField(source="get_status_display", read_only=True)
    canal_label = serializers.CharField(source="get_canal_escolhido_display", read_only=True)

    class Meta:
        model = NotificacaoConsumidor
        fields = [
            "id",
            "consumidor_email",
            "consumidor_telefone",
            "consumidor_cpf",
            "titulo",
            "mensagem",
            "canal_escolhido",
            "canal_label",
            "prioridade",
            "protocolo_relacionado",
            "tipo_reclamacao_relacionada",
            "data_criacao",
            "data_envio_programada",
            "data_envio_real",
            "status",
            "status_label",
            "tentativas_envio",
            "maximo_tentativas",
            "codigo_entrega",
            "detalhes_entrega",
            "erro_envio",
            "data_leitura",
            "data_interacao",
            "tipo_interacao",
        ]
        read_only_fields = fields


class FeedbackConsumidorSerializer(serializers.ModelSerializer):
    """Interface pública para envio de feedback pelo consumidor."""

    class Meta:
        model = FeedbackConsumidor
        fields = [
            "id",
            "consumidor_email",
            "consumidor_cpf",
            "tipo_feedback",
            "protocolo_relacionado",
            "nota_geral",
            "aspecto_positivo",
            "aspecto_melhoria",
            "sugestoes",
            "analise_sentimento",
            "confianca_analise_sentimento",
            "data_feedback",
            "ip_address",
            "user_agent",
            "revisado",
            "revisado_por",
            "data_revisao",
            "acoes_tomadas",
            "categoria_feedback",
            "tags",
        ]
        read_only_fields = [
            "id",
            "analise_sentimento",
            "confianca_analise_sentimento",
            "data_feedback",
            "ip_address",
            "user_agent",
            "revisado",
            "revisado_por",
            "data_revisao",
            "acoes_tomadas",
            "categoria_feedback",
            "tags",
        ]


class FeedbackConsumidorAdminSerializer(serializers.ModelSerializer):
    """Serializer para painel interno de tratamento dos feedbacks."""

    revisado_por_nome = serializers.SerializerMethodField()

    class Meta:
        model = FeedbackConsumidor
        fields = [
            "id",
            "consumidor_email",
            "consumidor_cpf",
            "tipo_feedback",
            "protocolo_relacionado",
            "nota_geral",
            "aspecto_positivo",
            "aspecto_melhoria",
            "sugestoes",
            "analise_sentimento",
            "confianca_analise_sentimento",
            "data_feedback",
            "ip_address",
            "user_agent",
            "revisado",
            "revisado_por",
            "revisado_por_nome",
            "data_revisao",
            "acoes_tomadas",
            "categoria_feedback",
            "tags",
        ]
        read_only_fields = [
            "analise_sentimento",
            "confianca_analise_sentimento",
            "data_feedback",
            "ip_address",
            "user_agent",
            "revisado_por",
            "revisado_por_nome",
            "data_revisao",
            "tags",
        ]

    def get_revisado_por_nome(self, obj):
        if obj.revisado_por:
            return obj.revisado_por.get_full_name() or obj.revisado_por.get_username()
        return None

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        feedback = super().update(instance, validated_data)
        if tags is not None:
            feedback.tags = tags
            feedback.save(update_fields=["tags"])
        return feedback


class TicketSuporteSerializer(serializers.ModelSerializer):
    """Serializer público para abertura/acompanhamento de tickets."""

    status_label = serializers.CharField(source="get_status_display", read_only=True)
    prioridade_label = serializers.CharField(source="get_prioridade_display", read_only=True)

    class Meta:
        model = TicketSuporteConsumidor
        fields = [
            "id",
            "consumidor_email",
            "consumidor_nome",
            "consumidor_cpf",
            "protocolo_relacionado",
            "assunto",
            "categoria",
            "descricao",
            "status",
            "status_label",
            "prioridade",
            "prioridade_label",
            "resposta",
            "data_resposta",
            "tags",
            "metadados",
            "data_criacao",
            "atualizado_em",
        ]
        read_only_fields = [
            "id",
            "status",
            "status_label",
            "prioridade_label",
            "resposta",
            "data_resposta",
            "tags",
            "metadados",
            "data_criacao",
            "atualizado_em",
        ]


class TicketSuporteAdminSerializer(serializers.ModelSerializer):
    """Serializer para gestão interna dos tickets."""

    respondido_por_nome = serializers.SerializerMethodField()

    class Meta:
        model = TicketSuporteConsumidor
        fields = [
            "id",
            "consumidor_email",
            "consumidor_nome",
            "consumidor_cpf",
            "protocolo_relacionado",
            "assunto",
            "categoria",
            "descricao",
            "status",
            "prioridade",
            "resposta",
            "respondido_por",
            "respondido_por_nome",
            "data_resposta",
            "tags",
            "metadados",
            "data_criacao",
            "atualizado_em",
        ]
        read_only_fields = [
            "respondido_por",
            "respondido_por_nome",
            "data_criacao",
            "atualizado_em",
        ]

    def get_respondido_por_nome(self, obj):
        if obj.respondido_por:
            return obj.respondido_por.get_full_name() or obj.respondido_por.get_username()
        return None

    def update(self, instance, validated_data):
        user = self.context["request"].user
        resposta = validated_data.get("resposta")
        status = validated_data.get("status")

        ticket = super().update(instance, validated_data)

        updates = []
        if resposta and not ticket.resposta:
            ticket.resposta = resposta
            updates.append("resposta")

        if resposta:
            ticket.respondido_por = user
            ticket.data_resposta = ticket.data_resposta or timezone.now()
            updates.extend(["respondido_por", "data_resposta"])

        if status and status in (TicketSuporteConsumidor.Status.RESPONDIDO, TicketSuporteConsumidor.Status.FECHADO):
            if not ticket.data_resposta:
                ticket.data_resposta = timezone.now()
                updates.append("data_resposta")
            if not ticket.respondido_por:
                ticket.respondido_por = user
                updates.append("respondido_por")

        if updates:
            ticket.save(update_fields=list(set(updates)))

        return ticket

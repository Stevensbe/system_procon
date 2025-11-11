from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.db import models
from django.db.models import Count
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import mixins, status, viewsets
from rest_framework.authentication import BaseAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    FeedbackConsumidor,
    HistoricoConsulta,
    NotificacaoConsumidor,
    SessaoConsulta,
    TicketSuporteConsumidor,
)
from .serializers import (
    ConsultaRequestSerializer,
    FeedbackConsumidorAdminSerializer,
    FeedbackConsumidorSerializer,
    HistoricoConsultaSerializer,
    NotificacaoConsumidorSerializer,
    SessaoConsultaCreateSerializer,
    SessaoConsultaSerializer,
    TicketSuporteAdminSerializer,
    TicketSuporteSerializer,
)
from .services import ConsultaPortalService, ticket_service


PORTAL_HEADER_NAME = "X-PORTAL-API-KEY"


class PortalAPIKeyAuthentication(BaseAuthentication):
    """Autenticação baseada em API Key para consumo público do portal."""

    def authenticate(self, request):
        expected_key = getattr(settings, "PORTAL_API_KEY", "portal-dev-key")
        provided_key = request.headers.get(PORTAL_HEADER_NAME)

        if not expected_key:
            return AnonymousUser(), None

        if provided_key == expected_key:
            return AnonymousUser(), None

        raise AuthenticationFailed("Chave de API do portal inválida.")


class BasePortalViewSet(viewsets.GenericViewSet):
    """ViewSet base com autenticação e permissões aplicadas."""

    authentication_classes = [PortalAPIKeyAuthentication]
    permission_classes = []

    def _extract_client_ip(self, request):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "0.0.0.0")


@method_decorator(csrf_exempt, name="dispatch")
class SessaoConsultaViewSet(
    BasePortalViewSet,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
):
    """Gerencia sessões de consulta de consumidores."""

    queryset = SessaoConsulta.objects.all().order_by("-data_criacao")
    serializer_class = SessaoConsultaSerializer
    service_class = ConsultaPortalService

    def get_serializer_class(self):
        if self.action == "create":
            return SessaoConsultaCreateSerializer
        if self.action in {"consultar"}:
            return ConsultaRequestSerializer
        if self.action == "historicos":
            return HistoricoConsultaSerializer
        return super().get_serializer_class()

    def get_service(self):
        return self.service_class()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ip_address = self._extract_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "portal-consumidor")

        sessao = self.get_service().criar_sessao_consulta(
            ip_address=ip_address,
            user_agent=user_agent,
            tipo_consulta=data.get("tipo_consulta"),
        )
        output = SessaoConsultaSerializer(sessao)
        return Response(output.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        sessao = self._get_session_with_token()
        serializer = SessaoConsultaSerializer(sessao)
        return Response(serializer.data)

    def _get_session_with_token(self):
        session = super().get_object()
        provided_token = (
            self.request.query_params.get("token") or self.request.data.get("token")
        )
        if provided_token and provided_token != session.token_consulta:
            raise PermissionDenied("Token da sessão inválido.")
        return session

    @action(detail=True, methods=["post"])
    def consultar(self, request, pk=None):
        sessao = self._get_session_with_token()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        if not sessao.is_valid():
            raise ValidationError({"detail": "Sessão expirada ou limite excedido."})

        historico = self.get_service().buscar_documento_consumidor(
            sessao,
            protocolo=validated.get("protocolo", ""),
            cpf=validated.get("cpf", ""),
            email=validated.get("email", ""),
        )
        output = HistoricoConsultaSerializer(historico)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def historicos(self, request, pk=None):
        sessao = self._get_session_with_token()
        historicos = HistoricoConsulta.objects.filter(sessao=sessao).order_by("-data_consulta")
        serializer = HistoricoConsultaSerializer(historicos, many=True)
        return Response(serializer.data)


class NotificacaoConsumidorViewSet(BasePortalViewSet, viewsets.ReadOnlyModelViewSet):
    """Consulta notificações emitidas ao consumidor autenticado via API key."""

    serializer_class = NotificacaoConsumidorSerializer
    queryset = NotificacaoConsumidor.objects.all().order_by("-data_criacao")
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        email = self.request.query_params.get("email")
        cpf = self.request.query_params.get("cpf")
        if email:
            queryset = queryset.filter(consumidor_email__iexact=email)
        if cpf:
            queryset = queryset.filter(consumidor_cpf__iexact=cpf)
        return queryset


class FeedbackConsumidorViewSet(
    BasePortalViewSet,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Recebe feedback dos consumidores sobre o portal."""

    queryset = FeedbackConsumidor.objects.all().order_by("-data_feedback")
    serializer_class = FeedbackConsumidorSerializer

    def perform_create(self, serializer):
        serializer.save(
            ip_address=self._extract_client_ip(self.request),
            user_agent=self.request.META.get("HTTP_USER_AGENT", "portal-consumidor"),
        )


class FeedbackConsumidorAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Painel interno para acompanhamento e tratativa dos feedbacks enviados pelos consumidores."""

    queryset = FeedbackConsumidor.objects.all().order_by("-data_feedback")
    serializer_class = FeedbackConsumidorAdminSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        revisado_param = self.request.query_params.get("revisado")
        tipo_feedback = self.request.query_params.get("tipo_feedback")
        categoria = self.request.query_params.get("categoria")
        search = self.request.query_params.get("search")

        if revisado_param is not None:
            revisado_bool = revisado_param.lower() in {"1", "true", "sim", "yes"}
            queryset = queryset.filter(revisado=revisado_bool)

        if tipo_feedback:
            queryset = queryset.filter(tipo_feedback=tipo_feedback)

        if categoria:
            queryset = queryset.filter(categoria_feedback__iexact=categoria)

        if search:
            queryset = queryset.filter(
                models.Q(consumidor_email__icontains=search)
                | models.Q(protocolo_relacionado__icontains=search)
                | models.Q(aspecto_positivo__icontains=search)
                | models.Q(aspecto_melhoria__icontains=search)
                | models.Q(sugestoes__icontains=search)
            )

        return queryset

    def perform_update(self, serializer):
        feedback = serializer.save()
        user = self.request.user
        validated = serializer.validated_data

        revisado_flag = validated.get("revisado")
        if revisado_flag is True:
            updates = []
            if not feedback.revisado:
                feedback.revisado = True
                updates.append("revisado")
            if feedback.revisado_por != user:
                feedback.revisado_por = user
                updates.append("revisado_por")
            if not feedback.data_revisao:
                feedback.data_revisao = timezone.now()
                updates.append("data_revisao")
            if updates:
                feedback.save(update_fields=updates)
        elif revisado_flag is False:
            feedback.revisado = False
            feedback.revisado_por = None
            feedback.data_revisao = None
            feedback.save(update_fields=["revisado", "revisado_por", "data_revisao"])


class TicketSuporteViewSet(
    BasePortalViewSet,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Abertura e acompanhamento de tickets de suporte pelos consumidores."""

    queryset = TicketSuporteConsumidor.objects.all().order_by("-data_criacao")
    serializer_class = TicketSuporteSerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        email = self.request.query_params.get("email")
        cpf = self.request.query_params.get("cpf")
        protocolo = self.request.query_params.get("protocolo")
        status_param = self.request.query_params.get("status")

        if email:
            qs = qs.filter(consumidor_email__iexact=email)
        if cpf:
            qs = qs.filter(consumidor_cpf__iexact=cpf)
        if protocolo:
            qs = qs.filter(protocolo_relacionado__iexact=protocolo)
        if status_param:
            status_values = [s.strip().upper() for s in status_param.split(",") if s.strip()]
            if status_values:
                qs = qs.filter(status__in=status_values)

        # Caso não seja informado nenhum identificador, retornar queryset vazio
        if not any([email, cpf, protocolo]):
            return qs.none()

        return qs

    def perform_create(self, serializer):
        ticket = serializer.save(
            metadados={
                "ip": self._extract_client_ip(self.request),
                "user_agent": self.request.META.get("HTTP_USER_AGENT", "portal-consumidor"),
            }
        )
        try:
            ticket_service.enviar_confirmacao_abertura(ticket)
        except Exception as exc:
            ticket_service.logger.error(f'Falha ao enviar confirmação do ticket {ticket.id}: {exc}', exc_info=True)


class TicketSuporteAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Painel interno para tratamento dos tickets de suporte dos consumidores."""

    queryset = TicketSuporteConsumidor.objects.all().order_by("-data_criacao")
    serializer_class = TicketSuporteAdminSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get("status")
        prioridade = self.request.query_params.get("prioridade")
        search = self.request.query_params.get("search")

        if status_param:
            status_values = [s.strip().upper() for s in status_param.split(",") if s.strip()]
            queryset = queryset.filter(status__in=status_values)

        if prioridade:
            prioridade_values = [p.strip().upper() for p in prioridade.split(",") if p.strip()]
            queryset = queryset.filter(prioridade__in=prioridade_values)

        if search:
            queryset = queryset.filter(
                models.Q(consumidor_email__icontains=search)
                | models.Q(consumidor_nome__icontains=search)
                | models.Q(consumidor_cpf__icontains=search)
                | models.Q(protocolo_relacionado__icontains=search)
                | models.Q(assunto__icontains=search)
            )

        return queryset

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def resumo(self, request):
        queryset = self.filter_queryset(self.get_queryset())

        total = queryset.count()
        por_status = {item["status"]: item["total"] for item in queryset.values("status").annotate(total=Count("id"))}
        por_prioridade = {item["prioridade"]: item["total"] for item in queryset.values("prioridade").annotate(total=Count("id"))}

        pendentes = queryset.filter(
            status__in=[TicketSuporteConsumidor.Status.ABERTO, TicketSuporteConsumidor.Status.EM_ANALISE]
        )
        pendentes_por_prioridade = {
            item["prioridade"]: item["total"] for item in pendentes.values("prioridade").annotate(total=Count("id"))
        }

        respondidos = queryset.filter(data_resposta__isnull=False)
        duracoes_segundos = [
            (ticket.data_resposta - ticket.data_criacao).total_seconds()
            for ticket in respondidos
            if ticket.data_resposta and ticket.data_criacao
        ]
        tempo_medio_resposta = round(sum(duracoes_segundos) / len(duracoes_segundos) / 3600, 2) if duracoes_segundos else 0.0

        limite_7_dias = timezone.now() - timedelta(days=7)
        respondidos_7_dias = respondidos.filter(data_resposta__gte=limite_7_dias).count()
        abertos_7_dias = queryset.filter(data_criacao__gte=limite_7_dias).count()

        return Response(
            {
                "total": total,
                "por_status": por_status,
                "por_prioridade": por_prioridade,
                "pendentes_por_prioridade": pendentes_por_prioridade,
                "tempo_medio_resposta_horas": tempo_medio_resposta,
                "respondidos_ultimos_7_dias": respondidos_7_dias,
                "abertos_ultimos_7_dias": abertos_7_dias,
            }
        )

    def perform_update(self, serializer):
        instancia = serializer.instance
        status_anterior = instancia.status
        resposta_anterior = instancia.resposta

        ticket = serializer.save()

        try:
            ticket_service.processar_atualizacao(ticket, status_anterior, resposta_anterior)
        except Exception as exc:
            ticket_service.logger.error(f'Falha ao notificar atualização do ticket {ticket.id}: {exc}', exc_info=True)

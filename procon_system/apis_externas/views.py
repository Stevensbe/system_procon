import json

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    OrgaoExterno,
    CredencialAcesso,
    EnvioDocumentoExterno,
    TemplateIntegracao,
    EventoIntegracao,
    MetricasIntegracao,
)
from .serializers import (
    OrgaoExternoSerializer,
    CredencialAcessoSerializer,
    EnvioDocumentoExternoSerializer,
    TemplateIntegracaoSerializer,
    EventoIntegracaoSerializer,
    MetricasIntegracaoSerializer,
)
from .services import ExternalAPIError, enviar_documento_externo, ping_external_api


class OrgaoExternoViewSet(viewsets.ModelViewSet):
    queryset = OrgaoExterno.objects.all().order_by("nome")
    serializer_class = OrgaoExternoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_orgao", "status", "possui_api_integrada"]
    search_fields = ["nome", "codigo_identificacao", "responsavel_contato"]

    @action(detail=True, methods=["post"], url_path="testar-conexao")
    def testar_conexao(self, request, pk=None):
        orgao = self.get_object()
        if not orgao.api_endpoint_base:
            return Response(
                {"success": False, "error": "O órgão externo não possui endpoint configurado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        path = request.data.get("path", "health")
        headers = request.data.get("headers", {})

        try:
            resultado_teste = ping_external_api(
                orgao.api_endpoint_base,
                path=path,
                headers=headers,
                timeout=orgao.timeout_segundos or 10,
            )
        except ExternalAPIError as exc:
            return Response(
                {
                    "success": False,
                    "error": str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        orgao.data_ultimo_sync = timezone.now()
        orgao.save(update_fields=["data_ultimo_sync"])

        return Response({"success": True, "resultado": resultado_teste}, status=status.HTTP_200_OK)


class CredencialAcessoViewSet(viewsets.ModelViewSet):
    queryset = CredencialAcesso.objects.select_related("orgao").all().order_by("-data_criacao")
    serializer_class = CredencialAcessoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["orgao", "status", "ambiente"]
    search_fields = ["nome_credencial"]


class EnvioDocumentoExternoViewSet(viewsets.ModelViewSet):
    queryset = (
        EnvioDocumentoExterno.objects.select_related("orgao_destino", "credencial_usada")
        .all()
        .order_by("-data_criacao")
    )
    serializer_class = EnvioDocumentoExternoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["orgao_destino", "tipo_documento", "status_envio"]
    search_fields = ["protocolo_interno", "protocolo_externo"]

    @action(detail=True, methods=["post"], url_path="simular-envio")
    def simular_envio(self, request, pk=None):
        envio = self.get_object()
        orgao = envio.orgao_destino
        if not orgao.api_endpoint_base:
            return Response(
                {"success": False, "error": "O órgão externo não possui endpoint configurado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = request.data.get("headers", {})
        path = request.data.get("path", "")
        payload = request.data.get("payload", envio.dados_enviados)

        try:
            resultado = enviar_documento_externo(
                orgao.api_endpoint_base,
                path=path,
                payload=payload,
                headers=headers,
                timeout=orgao.timeout_segundos or 10,
                method=request.data.get("method", "POST"),
            )
        except ExternalAPIError as exc:
            envio.tentativas_envio += 1
            envio.status_envio = "ERRO_ENVIO"
            envio.erro_envio = str(exc)
            envio.detalhes_erro = {"origem": "simulacao", "mensagem": str(exc)}
            envio.save(update_fields=["tentativas_envio", "status_envio", "erro_envio", "detalhes_erro"])
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        envio.status_envio = "ENVIADO" if resultado["status_code"] < 400 else "REJEITADO"
        envio.tentativas_envio += 1
        envio.data_envio = timezone.now()
        envio.codigo_resposta_http = resultado["status_code"]
        envio.resposta_orcao_externo = (
            json.dumps(resultado["payload"]) if isinstance(resultado["payload"], (dict, list)) else str(resultado["payload"])
        )
        envio.header_resposta = resultado["headers"]
        envio.payload_completo = (
            resultado["request_payload_raw"]
            if isinstance(resultado["request_payload_raw"], (str, bytes))
            else json.dumps(resultado["request_payload_raw"])
        )
        envio.save(
            update_fields=[
                "status_envio",
                "tentativas_envio",
                "data_envio",
                "codigo_resposta_http",
                "resposta_orcao_externo",
                "header_resposta",
                "payload_completo",
            ]
        )

        return Response({"success": True, "resultado": resultado}, status=status.HTTP_200_OK)


class TemplateIntegracaoViewSet(viewsets.ModelViewSet):
    queryset = TemplateIntegracao.objects.select_related("orgao").all().order_by("orgao__nome", "nome_template")
    serializer_class = TemplateIntegracaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["orgao", "tipo_documento_aplicavel", "ativo"]
    search_fields = ["nome_template"]


class EventoIntegracaoViewSet(viewsets.ModelViewSet):
    queryset = EventoIntegracao.objects.select_related("orgao_relacionado", "envio_relacionado").all()
    serializer_class = EventoIntegracaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_evento", "severity", "orgao_relacionado", "processado"]
    search_fields = ["titulo_evento"]


class MetricasIntegracaoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MetricasIntegracao.objects.select_related("orgao").all()
    serializer_class = MetricasIntegracaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["orgao", "data_analise", "periodo_horas"]


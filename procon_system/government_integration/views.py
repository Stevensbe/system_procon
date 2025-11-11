from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import IntegrationConnector, IntegrationSyncRun, IntegrationEvent
from .serializers import (
    IntegrationConnectorSerializer,
    IntegrationSyncRunSerializer,
    IntegrationEventSerializer,
)


class IntegrationConnectorViewSet(viewsets.ModelViewSet):
    queryset = IntegrationConnector.objects.all()
    serializer_class = IntegrationConnectorSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["orgao_responsavel", "tipo_autenticacao", "ativo"]
    search_fields = ["nome", "slug", "orgao_responsavel", "descricao"]

    @action(detail=True, methods=["post"], url_path="executar-sync")
    def executar_sync(self, request, pk=None):
        connector = self.get_object()
        payload_envio = request.data.get("payload_envio", {})
        responsavel = request.user if request.user.is_authenticated else None

        execucao = IntegrationSyncRun.objects.create(
            connector=connector,
            payload_envio=payload_envio,
            status="EXECUTANDO",
            responsavel=responsavel,
        )
        connector.ultima_sincronizacao = timezone.now()
        connector.save(update_fields=["ultima_sincronizacao"])
        serializer = IntegrationSyncRunSerializer(execucao)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IntegrationSyncRunViewSet(viewsets.ModelViewSet):
    queryset = IntegrationSyncRun.objects.select_related("connector").all()
    serializer_class = IntegrationSyncRunSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["connector", "status"]
    search_fields = ["connector__nome", "erros_encontrados"]
    ordering_fields = ["iniciado_em", "finalizado_em", "registros_processados"]

    @action(detail=True, methods=["post"], url_path="finalizar")
    def finalizar(self, request, pk=None):
        execucao = self.get_object()
        status_execucao = request.data.get("status", "SUCESSO")
        retorno = request.data.get("retorno_bruto")
        erros = request.data.get("erros_encontrados")
        registros = request.data.get("registros_processados")
        execucao.finalizar(status_execucao, retorno=retorno, erros=erros, registros=registros)
        serializer = self.get_serializer(execucao)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IntegrationEventViewSet(viewsets.ModelViewSet):
    queryset = IntegrationEvent.objects.select_related("connector").all()
    serializer_class = IntegrationEventSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["connector", "tipo_evento", "processado"]
    search_fields = ["tipo_evento", "referencia_externa", "observacoes"]
    ordering_fields = ["recebido_em", "processado_em"]

    @action(detail=True, methods=["post"], url_path="marcar-processado")
    def marcar_processado(self, request, pk=None):
        evento = self.get_object()
        evento.processado = True
        evento.processado_em = timezone.now()
        evento.observacoes = request.data.get("observacoes", evento.observacoes)
        evento.save(update_fields=["processado", "processado_em", "observacoes"])
        serializer = self.get_serializer(evento)
        return Response(serializer.data, status=status.HTTP_200_OK)


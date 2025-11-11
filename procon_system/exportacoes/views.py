from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    TipoExportacao,
    DestinacaoExportacao,
    TemplateExportacao,
    AgendamentoExportacao,
    ExecucaoExportacao,
    HistoricoExportacao,
)
from .serializers import (
    TipoExportacaoSerializer,
    DestinacaoExportacaoSerializer,
    TemplateExportacaoSerializer,
    AgendamentoExportacaoSerializer,
    ExecucaoExportacaoSerializer,
    HistoricoExportacaoSerializer,
)
from .services import exportacao_service


class TipoExportacaoViewSet(viewsets.ModelViewSet):
    queryset = TipoExportacao.objects.all().order_by("orgao_destino_nome", "nome_exibicao")
    serializer_class = TipoExportacaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["codigo", "frequencia_automatica", "ativo"]
    search_fields = ["nome_exibicao", "codigo", "orgao_destino_nome"]

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)


class DestinacaoExportacaoViewSet(viewsets.ModelViewSet):
    queryset = DestinacaoExportacao.objects.select_related("destinatario_orgao", "credencial_envio").all()
    serializer_class = DestinacaoExportacaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["destinatario_orgao", "metodo_envio", "ativo"]
    search_fields = ["nome_destinacao", "destinatario_friendly_name"]


class TemplateExportacaoViewSet(viewsets.ModelViewSet):
    queryset = TemplateExportacao.objects.select_related("tipo_exportacao").all()
    serializer_class = TemplateExportacaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_exportacao", "ativo", "versao_template"]
    search_fields = ["nome_template"]

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)


class AgendamentoExportacaoViewSet(viewsets.ModelViewSet):
    queryset = (
        AgendamentoExportacao.objects.select_related("tipo_exportacao", "executado_por")
        .prefetch_related("execucoes")
        .all()
        .order_by("-data_agendamento")
    )
    serializer_class = AgendamentoExportacaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_exportacao", "status"]
    search_fields = ["tipo_exportacao__nome_exibicao"]

    @action(detail=True, methods=["post"], url_path="executar")
    def executar(self, request, pk=None):
        agendamento = self.get_object()
        try:
            execucao = exportacao_service.executar_exportacao(agendamento, request.user)
        except Exception as exc:  # pragma: no cover
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        serializer = ExecucaoExportacaoSerializer(execucao, context={"request": request})
        return Response(
            {"success": True, "execucao": serializer.data},
            status=status.HTTP_202_ACCEPTED,
        )


class ExecucaoExportacaoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExecucaoExportacao.objects.select_related("agendamento", "agendamento__tipo_exportacao").all()
    serializer_class = ExecucaoExportacaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "agendamento"]
    search_fields = ["agendamento__tipo_exportacao__nome_exibicao"]


class HistoricoExportacaoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistoricoExportacao.objects.select_related("agendamento", "agendamento__tipo_exportacao").all()
    serializer_class = HistoricoExportacaoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["agendamento", "evento_acao"]
    search_fields = ["descricao_evento"]


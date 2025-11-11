from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    KPI,
    Dashboard,
    ValorKPI,
    RelatorioPersonalizado,
    HistoricoRelatorio,
    AnaliseEmpirica,
)
from .serializers import (
    KPISerializer,
    DashboardSerializer,
    ValorKPISerializer,
    RelatorioPersonalizadoSerializer,
    HistoricoRelatorioSerializer,
    AnaliseEmpiricaSerializer,
)
from .services import KPIComputationService, portal_consumidor_analytics_service


class KPIViewSet(viewsets.ModelViewSet):
    queryset = KPI.objects.all()
    serializer_class = KPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["categoria", "tipo_kpi", "ativo"]
    search_fields = ["codigo", "nome", "descricao"]

    @action(detail=True, methods=["post"], url_path="recalcular")
    def recalcular(self, request, pk=None):
        kpi = self.get_object()
        periodo = request.data.get("periodo_tipo", "DIA")
        filtros = request.data.get("filtros_aplicados", {})

        service = KPIComputationService()
        valor = service.compute_kpi_value(
            kpi,
            data_referencia=timezone.now(),
            periodo_tipo=periodo,
            filtros_aplicados=filtros,
        )
        serializer = ValorKPISerializer(valor)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardViewSet(viewsets.ModelViewSet):
    queryset = Dashboard.objects.prefetch_related("dashboard_kpis").all()
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_dashboard", "ativo", "padrao"]
    search_fields = ["nome", "descricao"]


class ValorKPIViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ValorKPI.objects.select_related("kpi").all()
    serializer_class = ValorKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["kpi", "periodo_tipo", "status_calculo"]
    search_fields = ["kpi__codigo", "kpi__nome"]
    ordering_fields = ["data_referencia", "calculado_em"]


class RelatorioPersonalizadoViewSet(viewsets.ModelViewSet):
    queryset = RelatorioPersonalizado.objects.all()
    serializer_class = RelatorioPersonalizadoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_relatorio", "formato", "frequencia_geracao", "ativo"]
    search_fields = ["codigo", "nome", "descricao"]


class HistoricoRelatorioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistoricoRelatorio.objects.select_related("relatorio").all()
    serializer_class = HistoricoRelatorioSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["relatorio", "status", "solicitado_por"]
    search_fields = ["relatorio__codigo", "relatorio__nome"]
    ordering_fields = ["executado_em", "tempo_execucao_segundos"]


class AnaliseEmpiricaViewSet(viewsets.ModelViewSet):
    queryset = AnaliseEmpirica.objects.all()
    serializer_class = AnaliseEmpiricaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_analise", "atualizacao_automatica", "validacao_realizada"]
    search_fields = ["codigo", "nome", "descricao", "fonte_dados"]


class PortalConsumidorAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        dados = portal_consumidor_analytics_service.get_overview(start_date, end_date)
        return Response(dados)

    @action(detail=False, methods=["post"], url_path="sync")
    def sync(self, request):
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")
        overview = portal_consumidor_analytics_service.get_overview(start_date, end_date)
        analise = portal_consumidor_analytics_service.persist_overview(
            overview,
            usuario=request.user if request.user.is_authenticated else None,
        )
        serializer = AnaliseEmpiricaSerializer(analise)
        return Response({"overview": overview, "analise": serializer.data}, status=status.HTTP_201_CREATED)


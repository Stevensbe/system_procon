from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import GeoDataLayer, GeoMetric, HeatmapSnapshot
from .serializers import GeoDataLayerSerializer, GeoMetricSerializer, HeatmapSnapshotSerializer


class GeoDataLayerViewSet(viewsets.ModelViewSet):
    queryset = GeoDataLayer.objects.all()
    serializer_class = GeoDataLayerSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_camada", "ativo"]
    search_fields = ["nome", "slug", "descricao", "fonte_dados"]


class GeoMetricViewSet(viewsets.ModelViewSet):
    queryset = GeoMetric.objects.select_related("layer").all()
    serializer_class = GeoMetricSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["layer", "indicador", "identificador_geografico"]
    search_fields = ["indicador", "identificador_geografico"]
    ordering_fields = ["periodo_referencia", "calculado_em", "valor"]


class HeatmapSnapshotViewSet(viewsets.ModelViewSet):
    queryset = HeatmapSnapshot.objects.select_related("layer").all()
    serializer_class = HeatmapSnapshotSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["layer", "indicador"]
    search_fields = ["indicador"]
    ordering_fields = ["gerado_em", "expiracao"]

    @action(detail=True, methods=["post"], url_path="renovar")
    def renovar(self, request, pk=None):
        snapshot = self.get_object()
        minutos = int(request.data.get("minutos", 60))
        snapshot.expiracao = timezone.now() + timezone.timedelta(minutes=minutos)
        snapshot.save(update_fields=["expiracao"])
        serializer = self.get_serializer(snapshot)
        return Response(serializer.data, status=status.HTTP_200_OK)


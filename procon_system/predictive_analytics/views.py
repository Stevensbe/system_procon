from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PredictiveModel, TrainingJob, ForecastResult
from .serializers import (
    PredictiveModelSerializer,
    TrainingJobSerializer,
    ForecastResultSerializer,
)


class PredictiveModelViewSet(viewsets.ModelViewSet):
    queryset = PredictiveModel.objects.all()
    serializer_class = PredictiveModelSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tipo_algoritmo", "ativo"]
    search_fields = ["codigo", "nome", "descricao", "origem_dados"]


class TrainingJobViewSet(viewsets.ModelViewSet):
    queryset = TrainingJob.objects.select_related("modelo").all()
    serializer_class = TrainingJobSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["modelo", "status", "conjunto_dados"]
    search_fields = ["modelo__codigo", "modelo__nome", "conjunto_dados"]
    ordering_fields = ["iniciado_em", "finalizado_em", "duracao_segundos"]

    @action(detail=True, methods=["post"], url_path="finalizar")
    def finalizar(self, request, pk=None):
        job = self.get_object()
        status_execucao = request.data.get("status", "SUCESSO")
        metricas = request.data.get("metricas_resultado")
        job.marcar_finalizacao(status_execucao, metricas=metricas)
        serializer = self.get_serializer(job)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ForecastResultViewSet(viewsets.ModelViewSet):
    queryset = ForecastResult.objects.select_related("modelo").all()
    serializer_class = ForecastResultSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["modelo", "status", "horizonte"]
    search_fields = ["modelo__codigo", "modelo__nome"]
    ordering_fields = ["gerado_em", "referencia"]

    def perform_create(self, serializer):
        if not serializer.validated_data.get("gerado_por"):
            serializer.save(gerado_por=self.request.user)
        else:
            serializer.save()


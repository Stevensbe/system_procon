from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AutomationRule, AutomationRun, InsightTrigger
from .serializers import AutomationRuleSerializer, AutomationRunSerializer, InsightTriggerSerializer


class AutomationRuleViewSet(viewsets.ModelViewSet):
    queryset = AutomationRule.objects.all()
    serializer_class = AutomationRuleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["trigger_type", "action_type", "ativo"]
    search_fields = ["nome", "slug", "descricao"]
    ordering_fields = ["prioridade", "criado_em"]


class AutomationRunViewSet(viewsets.ModelViewSet):
    queryset = AutomationRun.objects.select_related("regra").all()
    serializer_class = AutomationRunSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["regra", "status"]
    search_fields = ["regra__nome"]
    ordering_fields = ["disparado_em", "finalizado_em"]

    @action(detail=True, methods=["post"], url_path="finalizar")
    def finalizar(self, request, pk=None):
        execucao = self.get_object()
        status_execucao = request.data.get("status", "SUCESSO")
        resultado = request.data.get("resultado")
        mensagem_erro = request.data.get("mensagem_erro")
        execucao.finalizar(status_execucao, resultado=resultado, mensagem_erro=mensagem_erro)
        serializer = self.get_serializer(execucao)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InsightTriggerViewSet(viewsets.ModelViewSet):
    queryset = InsightTrigger.objects.select_related("regra").all()
    serializer_class = InsightTriggerSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["regra", "severidade", "reconhecido"]
    search_fields = ["titulo", "descricao", "regra__nome"]
    ordering_fields = ["criado_em", "severidade"]

    @action(detail=True, methods=["post"], url_path="reconhecer")
    def reconhecer(self, request, pk=None):
        insight = self.get_object()
        usuario = request.user if request.user.is_authenticated else None
        insight.marcar_reconhecido(usuario=usuario)
        serializer = self.get_serializer(insight)
        return Response(serializer.data, status=status.HTTP_200_OK)


from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import FluxoAtendimentoRequestSerializer
from .services import FluxoAtendimentoCompletoService


class FluxoAtendimentoViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FluxoAtendimentoRequestSerializer
    workflow_service = FluxoAtendimentoCompletoService()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultado = self.workflow_service.iniciar_workflow_atendimento(
            serializer.validated_data,
            request.user,
        )

        status_code = status.HTTP_200_OK if resultado.get("status") != "erro" else status.HTTP_400_BAD_REQUEST
        return Response(resultado, status=status_code)

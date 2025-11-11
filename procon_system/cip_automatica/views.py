from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CIPAutomatica, TipoCIP
from .serializers import (
    CIPAutomaticaSerializer,
    CIPDispatchSerializer,
    CIPGenerateSerializer,
    CIPOverdueAlertSerializer,
    CIPStatusUpdateSerializer,
    TipoCIPSerializer,
)
from .services import cip_dispatch, cip_generation, cip_tracking


class TipoCIPViewSet(viewsets.ModelViewSet):
    queryset = TipoCIP.objects.all().order_by("nome")
    serializer_class = TipoCIPSerializer


class CIPAutomaticaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = CIPAutomatica.objects.select_related("tipo_cip").all().order_by("-data_geracao")
    serializer_class = CIPAutomaticaSerializer

    @action(detail=False, methods=["post"])
    def generate(self, request):
        serializer = CIPGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        cip = cip_generation.gerar_cip_automatica(
            reclamacao_id=data["reclamacao_id"],
            tipo_cip_id=data["tipo_cip_id"],
            valor_indenizacao=data["valor_indenizacao"],
            observacoes=data.get("observacoes", ""),
        )
        output = CIPAutomaticaSerializer(instance=cip, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="dispatch", url_name="dispatch")
    def dispatch_cip(self, request, pk=None):
        cip = self.get_object()
        serializer = CIPDispatchSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        resultados = cip_dispatch.enviar_cip_empresa(
            cip,
            metodo_envio=serializer.validated_data["metodo_envio"],
        )
        return Response(resultados, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def update_status(self, request, pk=None):
        cip = self.get_object()
        serializer = CIPStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        cip_tracking.atualizar_status_cip(
            cip,
            novo_status=data["novo_status"],
            observacoes=data.get("observacoes", ""),
        )
        cip.refresh_from_db()
        output = CIPAutomaticaSerializer(instance=cip, context={"request": request})
        return Response(output.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def overdue(self, request):
        alertas = cip_tracking.verificar_prazos_vencidos()
        serializer = CIPOverdueAlertSerializer(alertas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

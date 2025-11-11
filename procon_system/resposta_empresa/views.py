from datetime import datetime

from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    AnaliseResumoSerializer,
    RespostaEmpresaCreateSerializer,
    RespostaEmpresaSerializer,
    RespostaRelatorioSerializer,
)
from .services import analise_service, relatorio_resposta_service
from cip_automatica.models import RespostaEmpresa


class RespostaEmpresaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = RespostaEmpresa.objects.select_related("cip").all().order_by("-data_recebimento")
    serializer_class = RespostaEmpresaSerializer

    def create(self, request, *args, **kwargs):
        serializer = RespostaEmpresaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        resposta = analise_service.analisar_resposta_recebida(
            cip_id=str(data["cip_id"]),
            texto_resposta=data["texto_resposta"],
            valor_oferecido=data.get("valor_oferecido"),
            usuario_analista=request.user if request.user.is_authenticated else None,
        )
        output = RespostaEmpresaSerializer(instance=resposta, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def relatorio(self, request):
        params_serializer = RespostaRelatorioSerializer(data=request.query_params)
        params_serializer.is_valid(raise_exception=True)
        data = params_serializer.validated_data
        tz = timezone.get_current_timezone()
        inicio = timezone.make_aware(datetime.combine(data["data_inicio"], datetime.min.time()), tz)
        fim = timezone.make_aware(datetime.combine(data["data_fim"], datetime.max.time()), tz)

        relatorio = relatorio_resposta_service.gerar_relatorio_periodo(inicio, fim)
        serializer = AnaliseResumoSerializer(relatorio)
        return Response(serializer.data, status=status.HTTP_200_OK)

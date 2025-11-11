from datetime import datetime, timedelta, time

from django.utils import timezone
from django.utils.dateparse import parse_datetime, parse_date
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import AgendamentoAudiencia, LocalAudiencia, Mediador
from .serializers import (
    AgendamentoAudienciaSerializer,
    LocalAudienciaSerializer,
    MediadorSerializer,
)
from .services import relatorio_service


class MediadorViewSet(viewsets.ModelViewSet):
    queryset = Mediador.objects.select_related("usuario").all().order_by("numero_registro")
    serializer_class = MediadorSerializer


class LocalAudienciaViewSet(viewsets.ModelViewSet):
    queryset = LocalAudiencia.objects.all().order_by("nome")
    serializer_class = LocalAudienciaSerializer


class AgendamentoAudienciaViewSet(viewsets.ModelViewSet):
    queryset = (
        AgendamentoAudiencia.objects.select_related("mediador", "local")
        .prefetch_related("cips_relacionadas")
        .all()
        .order_by("-data_agendamento")
    )
    serializer_class = AgendamentoAudienciaSerializer

    @action(detail=False, methods=["get"], url_path="relatorio")
    def relatorio(self, request):
        def _parse_param(valor: str, horario_padrao: time):
            if not valor:
                return None
            dt = parse_datetime(valor)
            if dt:
                return dt
            data = parse_date(valor)
            if data:
                return timezone.make_aware(datetime.combine(data, horario_padrao))
            return None

        agora = timezone.now()
        inicio_param = request.query_params.get("inicio")
        fim_param = request.query_params.get("fim")

        inicio = _parse_param(inicio_param, time.min) or (agora - timedelta(days=30))
        fim = _parse_param(fim_param, time.max) or agora

        if inicio > fim:
            fim = agora
            inicio = fim - timedelta(days=30)

        relatorio = relatorio_service.gerar_relatorio_periodo(inicio, fim)
        periodo = relatorio.get("periodo", {})
        if isinstance(periodo.get("inicio"), datetime):
            periodo["inicio"] = periodo["inicio"].isoformat()
        elif periodo.get("inicio"):
            periodo["inicio"] = datetime.combine(periodo["inicio"], time.min).isoformat()
        if isinstance(periodo.get("fim"), datetime):
            periodo["fim"] = periodo["fim"].isoformat()
        elif periodo.get("fim"):
            periodo["fim"] = datetime.combine(periodo["fim"], time.max).isoformat()
        relatorio["periodo"] = periodo
        return Response(relatorio)

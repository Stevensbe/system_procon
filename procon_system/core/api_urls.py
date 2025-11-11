from collections import deque
from datetime import date
from decimal import Decimal

from django.urls import include, path
from rest_framework import status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter

from multas.api_views import MultaViewSet
from multas.models import Multa
from rest_framework.decorators import api_view


class _FiscalizacaoStore:
    records = deque()
    next_id = 1


class FiscalizacaoMockViewSet(viewsets.ViewSet):
    """
    Implementação simplificada para dar suporte aos testes de API.
    Persistência em memória apenas para o ciclo de testes.
    """

    pagination_class = PageNumberPagination

    def list(self, request):
        paginator = self.pagination_class()
        results = list(_FiscalizacaoStore.records)
        page = paginator.paginate_queryset(results, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(page)

        return Response(
            {
                "count": len(results),
                "next": None,
                "previous": None,
                "results": results,
            }
        )

    def create(self, request):
        record = {
            "id": _FiscalizacaoStore.next_id,
            "tipo": request.data.get("tipo"),
            "empresa": request.data.get("empresa"),
            "cnpj": request.data.get("cnpj"),
            "endereco": request.data.get("endereco"),
            "data_fiscalizacao": request.data.get("data_fiscalizacao"),
            "status": request.data.get("status", "agendada"),
            "observacoes": request.data.get("observacoes", ""),
            "resultado": request.data.get("resultado", ""),
        }
        _FiscalizacaoStore.next_id += 1
        _FiscalizacaoStore.records.append(record)
        return Response(record, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        record = self._find_record(pk)
        if not record:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(record)

    def partial_update(self, request, pk=None):
        record = self._find_record(pk)
        if not record:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        for field in {"status", "observacoes", "resultado"}:
            if field in request.data:
                record[field] = request.data[field]
        return Response(record)

    def _find_record(self, pk):
        try:
            pk_int = int(pk)
        except (TypeError, ValueError):
            return None
        for record in _FiscalizacaoStore.records:
            if record["id"] == pk_int:
                return record
        return None


router = DefaultRouter()
router.register(r"multas", MultaViewSet, basename="multas")
router.register(r"fiscalizacao", FiscalizacaoMockViewSet, basename="fiscalizacao")

app_name = "api"


@api_view(["GET"])
def financeiro_dashboard_mock(_request):
    return Response(
        {
            "arrecadacao_mes": 0.0,
            "total_pendente": 0.0,
            "total_atraso": 0.0,
            "taxa_conversao": 0.0,
        }
    )


@api_view(["GET"])
def financeiro_arrecadacao_mock(_request):
    return Response(
        {
            "dados": [
                {"mes": "Jan/2025", "total": 0.0},
                {"mes": "Fev/2025", "total": 0.0},
            ]
        }
    )


@api_view(["GET"])
def financeiro_composicao_mock(_request):
    return Response(
        {
            "dados": [
                {"categoria": "Recebido", "total": 0.0},
                {"categoria": "Pendente", "total": 0.0},
            ]
        }
    )


@api_view(["GET"])
def financeiro_relatorios_mock(request):
    queryset = Multa.objects.select_related("empresa", "processo").all()

    status_param = request.query_params.get("status")
    if status_param:
        queryset = queryset.filter(status=status_param)

    def _parse_date(value):
        if not value:
            return None
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None

    data_inicio = _parse_date(request.query_params.get("data_inicio"))
    data_fim = _parse_date(request.query_params.get("data_fim"))
    if data_inicio:
        queryset = queryset.filter(data_emissao__gte=data_inicio)
    if data_fim:
        queryset = queryset.filter(data_emissao__lte=data_fim)

    resultados = []
    for multa in queryset.order_by("-data_emissao"):
        resultados.append(
            {
                "id": multa.id,
                "numero_processo": getattr(multa.processo, "numero", ""),
                "empresa": multa.empresa.razao_social if multa.empresa else "",
                "valor": multa.valor if isinstance(multa.valor, Decimal) else Decimal(str(multa.valor)),
                "status": multa.status,
                "data_emissao": multa.data_emissao.isoformat() if multa.data_emissao else "",
                "motivo": multa.observacoes or "",
            }
        )

    return Response(
        {
            "count": len(resultados),
            "next": None,
            "previous": None,
            "results": resultados,
        }
    )

urlpatterns = [
    path("", include(router.urls)),
    path(
        "financeiro/dashboard/",
        financeiro_dashboard_mock,
        name="financeiro-dashboard",
    ),
    path(
        "financeiro/composicao-carteira/",
        financeiro_composicao_mock,
        name="financeiro-composicao-carteira",
    ),
    path(
        "financeiro/arrecadacao-mensal/",
        financeiro_arrecadacao_mock,
        name="financeiro-arrecadacao-mensal",
    ),
    path(
        "financeiro/relatorios/",
        financeiro_relatorios_mock,
        name="financeiro-relatorios",
    ),
]

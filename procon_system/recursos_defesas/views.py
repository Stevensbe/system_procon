from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import TipoDefesa, DefesaAdministrativa
from .serializers import TipoDefesaSerializer, DefesaAdministrativaSerializer


class TipoDefesaViewSet(viewsets.ModelViewSet):
    """
    API CRUD para tipos de defesa disponíveis no módulo.
    """

    queryset = TipoDefesa.objects.all().order_by("nome")
    serializer_class = TipoDefesaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nome", "descricao"]
    ordering_fields = ["nome", "prazo_dias"]
    ordering = ["nome"]


class DefesaAdministrativaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API de consulta às defesas administrativas protocoladas.
    """

    queryset = (
        DefesaAdministrativa.objects.select_related("processo", "tipo_defesa")
        .all()
        .order_by("-data_protocolo")
    )
    serializer_class = DefesaAdministrativaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["numero_defesa", "processo__numero_processo", "status"]
    ordering_fields = ["data_protocolo", "status", "prazo_resposta"]
    ordering = ["-data_protocolo"]
    http_method_names = ["get", "head", "options"]

    @action(detail=False, methods=["get"])
    def stats(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        total = queryset.count()
        por_status = {
            status: queryset.filter(status=status).count()
            for status, _ in DefesaAdministrativa.STATUS_CHOICES
        }
        atrasadas = queryset.filter(
            prazo_resposta__lt=self._today(), prazo_resposta__isnull=False
        ).count()
        payload = {
            "total": total,
            "por_status": por_status,
            "atrasadas": atrasadas,
        }
        return Response(payload)

    @staticmethod
    def _today():
        from datetime import date

        return date.today()

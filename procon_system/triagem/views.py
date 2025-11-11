from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import TriagemDemanda
from .serializers import TriagemDemandaSerializer


class TriagemDemandaViewSet(viewsets.ModelViewSet):
    """
    API para gerenciamento das triagens de denúncias e fiscalizações.
    """

    queryset = (
        TriagemDemanda.objects.select_related(
            "denuncia_portal",
            "ppa",
            "criado_por",
            "responsavel_triagem",
            "ultima_atualizacao_por",
        )
        .all()
    )
    serializer_class = TriagemDemandaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        "origem",
        "status",
        "decisao",
        "prioridade_sugerida",
        "prioridade_definida",
        "ppa",
    ]
    search_fields = [
        "numero_protocolo",
        "assunto",
        "empresa_alvo",
        "cnpj_empresa",
        "descricao",
    ]
    ordering_fields = ["criado_em", "prioridade_sugerida", "prioridade_definida", "status"]
    ordering = ["-criado_em"]

    def perform_create(self, serializer):
        serializer.save()

import json

from django.conf import settings
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import TriagemDemanda

try:
    from ti.models import ConfiguracaoSistema
except Exception:  # pragma: no cover - fallback seguro
    ConfiguracaoSistema = None
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

    def _normalizar_payload_captura(self, data, origem):
        def _get(*keys, default=""):
            for key in keys:
                valor = data.get(key)
                if valor not in (None, ""):
                    return valor
            return default

        dados_extras_raw = data.get("dados_extras")
        if isinstance(dados_extras_raw, str):
            try:
                dados_extras = json.loads(dados_extras_raw)
            except json.JSONDecodeError:
                dados_extras = {"raw": dados_extras_raw}
        elif isinstance(dados_extras_raw, dict):
            dados_extras = dados_extras_raw
        else:
            dados_extras = {}

        dados_extras.setdefault("capturado_em", timezone.now().isoformat())
        dados_extras.setdefault("canal", origem.lower())

        assunto_padrao = f"Demanda via {origem.title()}"

        return {
            "origem": origem,
            "assunto": _get("assunto", "titulo", "subject", "tema", default=assunto_padrao),
            "descricao": _get("descricao", "mensagem", "texto", "corpo", default=""),
            "empresa_alvo": _get("empresa_alvo", "empresa", "empresa_nome", "fornecedor", default=""),
            "cnpj_empresa": _get("cnpj_empresa", "cnpj", default=""),
            "endereco_empresa": _get("endereco_empresa", "endereco", default=""),
            "denunciante_nome": _get("denunciante_nome", "nome", "remetente_nome", "contato_nome", default=""),
            "denunciante_contato": _get("denunciante_contato", "contato", "email", "telefone", default=""),
            "prioridade_sugerida": _get("prioridade_sugerida", "prioridade", default="media"),
            "prazo_atendimento": data.get("prazo_atendimento"),
            "observacoes": data.get("observacoes", ""),
            "dados_extras": dados_extras,
        }

    def _capturadores_ativos(self):
        if ConfiguracaoSistema:
            try:
                config = ConfiguracaoSistema.objects.filter(
                    chave="triagem_capturadores_ativos"
                ).first()
                if config:
                    return ConfiguracaoSistema._parse_bool(config.valor)
            except Exception:
                return getattr(settings, "TRIAGEM_CAPTURADORES_ATIVOS", False)
        return getattr(settings, "TRIAGEM_CAPTURADORES_ATIVOS", False)

    def _criar_captura(self, request, origem):
        if not self._capturadores_ativos():
            return Response(
                {"detail": "Endpoint nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        payload = self._normalizar_payload_captura(request.data, origem)
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        triagem = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="capturar-email")
    def capturar_email(self, request):
        return self._criar_captura(request, "EMAIL")

    @action(detail=False, methods=["post"], url_path="capturar-telefone")
    def capturar_telefone(self, request):
        return self._criar_captura(request, "TELEFONE")

    @action(detail=False, methods=["post"], url_path="capturar-presencial")
    def capturar_presencial(self, request):
        return self._criar_captura(request, "PRESENCIAL")

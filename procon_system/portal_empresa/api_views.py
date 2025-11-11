import re
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Prefetch
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import mixins, status, viewsets
from rest_framework.authentication import BaseAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed, NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from portal_cidadao.models import AnexoReclamacao, HistoricoReclamacao, ReclamacaoDenuncia

from portal_empresa.models import (
    APIAnalytics,
    EmpresaAutorizada,
    HistoricoEmpresaPortal,
    RespostaEmpresaPortal,
    TokenEmpresa,
    UsuarioEmpresaAutorizado,
    WebhookConfiguration,
    SolicitacaoCadastroEmpresa,
)
from portal_empresa.serializers import (
    APIAnalyticsSerializer,
    EmpresaAutorizadaSerializer,
    HistoricoEmpresaPortalSerializer,
    RespostaEmpresaPortalSerializer,
    TokenEmpresaSerializer,
    UsuarioEmpresaAutorizadoSerializer,
    WebhookConfigurationSerializer,
    SolicitacaoCadastroEmpresaSerializer,
    ReclamacaoEmpresaSerializer,
)
from portal_empresa.services import (
    RespostaEmpresaService,
    gestao_empresa_service,
)
from portal_empresa.permissions import IsEmpresaAutorizada, empresas_do_usuario

User = get_user_model()


DEFAULT_ALLOWED_EXTENSIONS = set(
    getattr(
        settings,
        "PORTAL_EMPRESA_ALLOWED_EXTENSIONS",
        ["pdf", "doc", "docx", "jpg", "jpeg", "png", "txt"],
    )
)
DEFAULT_ALLOWED_MIME_TYPES = set(
    getattr(
        settings,
        "PORTAL_EMPRESA_ALLOWED_MIME_TYPES",
        [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "text/plain",
        ],
    )
)
MAX_ANEXOS_PORTAL = getattr(settings, "PORTAL_EMPRESA_MAX_ANEXOS", 5)
MAX_ANEXO_MB = getattr(settings, "PORTAL_EMPRESA_MAX_ANEXO_MB", 10)
MAX_ANEXO_BYTES = int(MAX_ANEXO_MB * 1024 * 1024)


def _normalize_documento(valor: str | None) -> str:
    return re.sub(r"\D", "", valor or "")


def _nome_arquivo_valido(nome: str) -> bool:
    if not nome:
        return False
    extensao = nome.rsplit(".", 1)[-1].lower() if "." in nome else ""
    return extensao in DEFAULT_ALLOWED_EXTENSIONS


def _mime_valido(content_type: str) -> bool:
    if not content_type:
        return False
    return content_type in DEFAULT_ALLOWED_MIME_TYPES


class ReclamacaoEmpresaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ReclamacaoEmpresaSerializer
    permission_classes = [IsAuthenticated, IsEmpresaAutorizada]
    renderer_classes = [JSONRenderer]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = (
            ReclamacaoDenuncia.objects.all()
            .select_related("atendimento__atendente")
            .prefetch_related(
                "anexos",
                "historico",
                Prefetch(
                    "respostas_portal",
                    queryset=RespostaEmpresaPortal.objects.select_related("empresa").order_by("-data_envio", "-data_criacao"),
                ),
            )
            .order_by("-criado_em")
        )

        user = self.request.user
        if not (user.is_staff or user.is_superuser):
            cnpjs = IsEmpresaAutorizada.cnpjs_permitidos(user)
            if not cnpjs:
                return queryset.none()
            queryset = queryset.filter(empresa_cnpj__in=cnpjs)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        protocolo = self.request.query_params.get("protocolo")
        if protocolo:
            queryset = queryset.filter(numero_protocolo__icontains=protocolo)

        return queryset

    def _resolver_empresa(self, request, reclamacao: ReclamacaoDenuncia) -> EmpresaAutorizada:
        user = request.user
        alvo = _normalize_documento(reclamacao.empresa_cnpj)

        if user.is_staff or user.is_superuser:
            empresa_id = request.data.get("empresa_id")
            if empresa_id:
                try:
                    return EmpresaAutorizada.objects.get(id=empresa_id)
                except EmpresaAutorizada.DoesNotExist:
                    raise ValidationError({"empresa_id": "Empresa informada não foi localizada."})

            for empresa in EmpresaAutorizada.objects.exclude(status__in=["BLOQUEADA", "REVOGADA", "SUSPENSA"]):
                if _normalize_documento(empresa.cnpj) == alvo:
                    return empresa
            raise ValidationError(
                {"empresa": "Não existe empresa autorizada vinculada ao CNPJ informado. Aprove a empresa no módulo administrativo."}
            )

        for empresa in empresas_do_usuario(user):
            if _normalize_documento(empresa.cnpj) == alvo:
                return empresa

        raise PermissionDenied("Você não possui permissão para responder esta reclamação.")

    @staticmethod
    def _validar_vinculo_usuario(usuario, empresa: EmpresaAutorizada):
        if usuario.is_staff or usuario.is_superuser:
            return None

        vinculo = UsuarioEmpresaAutorizado.objects.filter(
            usuario=usuario,
            empresa=empresa,
            ativo=True,
        ).first()

        if not vinculo:
            raise PermissionDenied("Seu usuário não está autorizado a responder em nome desta empresa.")

        if not vinculo.pode_responder_cip:
            raise PermissionDenied("Seu perfil atual não possui permissão para enviar respostas.")

        return vinculo

    @staticmethod
    def _parse_valor_proposta(raw_valor):
        if raw_valor in (None, "", "null"):
            return None
        valor_normalizado = str(raw_valor).replace(".", "").replace(",", ".")
        try:
            return Decimal(valor_normalizado)
        except (ArithmeticError, ValueError):
            raise ValidationError({"valor_proposta": "Valor informado é inválido."})

    @staticmethod
    def _parse_prazo_pagamento(raw_prazo):
        if raw_prazo in (None, "", "null"):
            return None
        try:
            prazo = int(raw_prazo)
            if prazo < 0:
                raise ValidationError({"prazo_pagamento": "Prazo deve ser maior ou igual a zero."})
            return prazo
        except (TypeError, ValueError):
            raise ValidationError({"prazo_pagamento": "Prazo de pagamento inválido."})

    def _coletar_anexos(self, request, reclamacao: ReclamacaoDenuncia):
        arquivos = []
        if "anexos" in request.FILES:
            arquivos = request.FILES.getlist("anexos")
        elif request.FILES:
            for chave in request.FILES:
                arquivos.extend(request.FILES.getlist(chave))

        if len(arquivos) > MAX_ANEXOS_PORTAL:
            raise ValidationError(
                {"anexos": f"É permitido enviar no máximo {MAX_ANEXOS_PORTAL} arquivos por resposta."}
            )

        anexos_criados = []
        anexos_payload = []
        try:
            for arquivo in arquivos:
                if getattr(arquivo, "size", 0) > MAX_ANEXO_BYTES:
                    raise ValidationError(
                        {"anexos": f"O arquivo {arquivo.name} excede o limite de {MAX_ANEXO_MB}MB."}
                    )

                content_type = getattr(getattr(arquivo, "file", None), "content_type", "") or getattr(arquivo, "content_type", "")
                if not _nome_arquivo_valido(arquivo.name) or not _mime_valido(content_type):
                    raise ValidationError(
                        {
                            "anexos": f"O arquivo {arquivo.name} possui formato não suportado. Tipos permitidos: {', '.join(sorted(DEFAULT_ALLOWED_EXTENSIONS))}."
                        }
                    )

                anexo = AnexoReclamacao.objects.create(
                    reclamacao=reclamacao,
                    arquivo=arquivo,
                    descricao=arquivo.name[:200],
                    tipo_documento="OUTROS",
                    armazenamento_origem="portal_empresa",
                )
                anexos_criados.append(anexo)

                arquivo_url = ""
                if anexo.arquivo and hasattr(anexo.arquivo, "url"):
                    arquivo_url = anexo.arquivo.url
                    if request is not None:
                        arquivo_url = request.build_absolute_uri(arquivo_url)

                anexos_payload.append(
                    {
                        "id": anexo.id,
                        "nome": anexo.descricao,
                        "arquivo_url": arquivo_url,
                        "tamanho_bytes": anexo.tamanho_bytes,
                        "checksum": anexo.checksum_sha256,
                        "content_type": anexo.content_type,
                    }
                )
        except Exception:
            for anexo in anexos_criados:
                anexo.delete()
            raise

        return anexos_criados, anexos_payload

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def respostas(self, request, pk=None):
        reclamacao = self.get_object()
        empresa = self._resolver_empresa(request, reclamacao)
        vinculo = self._validar_vinculo_usuario(request.user, empresa)

        dados = request.data
        tipo_documento = dados.get("tipo_documento")
        titulo = dados.get("titulo")
        conteudo = dados.get("conteudo")

        if not tipo_documento:
            raise ValidationError({"tipo_documento": "Informe o tipo do documento."})
        if tipo_documento not in dict(RespostaEmpresaPortal.TIPO_DOCUMENTO_CHOICES):
            raise ValidationError({"tipo_documento": "Tipo de documento inválido."})
        if not titulo or not titulo.strip():
            raise ValidationError({"titulo": "Informe um título para a resposta."})
        if not conteudo or not conteudo.strip():
            raise ValidationError({"conteudo": "Informe o conteúdo da resposta."})

        anexos_criados = []
        anexos_payload = []

        try:
            with transaction.atomic():
                if request.FILES:
                    anexos_criados, anexos_payload = self._coletar_anexos(request, reclamacao)

                valor_proposta = self._parse_valor_proposta(dados.get("valor_proposta"))
                prazo_pagamento = self._parse_prazo_pagamento(dados.get("prazo_pagamento"))

                resposta = RespostaEmpresaService().enviar_resposta_empresa(
                    empresa=empresa,
                    usuario=request.user,
                    dados_resposta={
                        "tipo_documento": tipo_documento,
                        "titulo": titulo.strip(),
                        "conteudo": conteudo.strip(),
                        "anexos": anexos_payload,
                        "valor_proposta": valor_proposta,
                        "prazo_pagamento": prazo_pagamento,
                        "forma_pagamento": dados.get("forma_pagamento", "").strip(),
                        "cip_id": dados.get("cip_id"),
                        "audiencia_id": dados.get("audiencia_id"),
                        "reclamacao": reclamacao,
                    },
                    token_usado=None,
                )

                # Atualiza status da reclamação para indicar que há resposta aguardando análise
                if reclamacao.status != "em_analise":
                    reclamacao.status = "em_analise"
                    reclamacao.save(update_fields=["status"])

                HistoricoReclamacao.objects.create(
                    reclamacao=reclamacao,
                    acao="RESPOSTA_EMPRESA",
                    descricao=f"Resposta enviada via Portal da Empresa: {resposta.titulo_resposta}",
                    usuario=request.user if request.user.is_staff else None,
                    observacoes="Registro automático do portal da empresa.",
                )
        except Exception:
            for anexo in anexos_criados:
                try:
                    anexo.delete()
                except Exception:
                    pass
            raise

        resposta_data = RespostaEmpresaPortalSerializer(resposta, context={"request": request}).data
        reclamacao_atualizada = self.get_serializer(reclamacao).data

        return Response(
            {
                "mensagem": "Resposta enviada com sucesso.",
                "resposta": resposta_data,
                "reclamacao": reclamacao_atualizada,
                "anexos_ids": [anexo.id for anexo in anexos_criados],
                "permissoes": {
                    "pode_responder": bool(vinculo.pode_responder_cip if vinculo else True),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class EmpresaPortalAuthentication(BaseAuthentication):
    """Autenticação baseada em chave de API para empresas autorizadas."""

    header = "X-PORTAL-EMPRESA-KEY"

    def authenticate(self, request):
        provided_key = request.headers.get(self.header)
        expected_key = getattr(settings, "PORTAL_EMPRESA_API_KEY", None)
        if expected_key and provided_key == expected_key:
            return (User(is_staff=True), None)
        if expected_key:
            raise AuthenticationFailed("Chave da API do portal da empresa inválida.")
        return (User(is_staff=True), None)


class EngajamentoResumoAPIView(APIView):
    """Endpoint resumido para métricas globais de engajamento."""

    authentication_classes = [EmpresaPortalAuthentication]
    permission_classes = []

    def get(self, request):
        metricas = gestao_empresa_service.obter_metricas_globais_engajamento()
        return Response(metricas, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class EmpresaAutorizadaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmpresaAutorizada.objects.all().order_by("razao_social")
    serializer_class = EmpresaAutorizadaSerializer
    authentication_classes = [EmpresaPortalAuthentication]
    permission_classes = []

    @action(detail=True, methods=["get"])
    def usuarios(self, request, pk=None):
        empresa = self.get_object()
        qs = UsuarioEmpresaAutorizado.objects.filter(empresa=empresa, ativo=True)
        serializer = UsuarioEmpresaAutorizadoSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def tokens(self, request, pk=None):
        empresa = self.get_object()
        gestao_empresa_service.sincronizar_tokens_expirados()
        qs = TokenEmpresa.objects.filter(empresa=empresa)
        serializer = TokenEmpresaSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="engajamento")
    def engajamento(self, request, pk=None):
        empresa = self.get_object()
        metricas = gestao_empresa_service.obter_metricas_engajamento(empresa)
        return Response(metricas)


class TokenEmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TokenEmpresa.objects.select_related("empresa").all()
    serializer_class = TokenEmpresaSerializer
    authentication_classes = [EmpresaPortalAuthentication]
    permission_classes = []

    def get_queryset(self):
        gestao_empresa_service.sincronizar_tokens_expirados()
        qs = super().get_queryset()
        empresa_id = self.request.query_params.get("empresa_id")
        if empresa_id:
            qs = qs.filter(empresa_id=empresa_id)
        return qs


class UsuarioEmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UsuarioEmpresaAutorizado.objects.select_related("empresa", "usuario").all()
    serializer_class = UsuarioEmpresaAutorizadoSerializer
    authentication_classes = [EmpresaPortalAuthentication]
    permission_classes = []


class RespostaEmpresaPortalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RespostaEmpresaPortal.objects.select_related("empresa").all()
    serializer_class = RespostaEmpresaPortalSerializer
    authentication_classes = [EmpresaPortalAuthentication]
    permission_classes = []

    def get_serializer_class(self):
        if self.action == "enviar":
            from portal_empresa.serializers import RespostaEmpresaEnvioSerializer

            return RespostaEmpresaEnvioSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=["post"])
    def enviar(self, request):
        from portal_empresa.serializers import RespostaEmpresaEnvioSerializer

        serializer = RespostaEmpresaEnvioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        empresa = data["empresa"]
        usuario = data.get("usuario_enviador") or User.objects.filter(is_staff=True).first()
        resposta = RespostaEmpresaService().enviar_resposta_empresa(
            empresa=empresa,
            usuario=usuario,
            dados_resposta={
                "tipo_documento": data["tipo_documento"],
                "titulo": data["titulo"],
                "conteudo": data["conteudo"],
                "anexos": data.get("anexos", []),
                "valor_proposta": data.get("valor_proposta"),
                "prazo_pagamento": data.get("prazo_pagamento"),
                "forma_pagamento": data.get("forma_pagamento", ""),
                "cip_id": data.get("cip_id"),
                "audiencia_id": data.get("audiencia_id"),
            },
            token_usado=data.get("token_usado"),
        )
        output = RespostaEmpresaPortalSerializer(resposta)
        return Response(output.data, status=status.HTTP_201_CREATED)


class HistoricoEmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistoricoEmpresaPortal.objects.select_related("empresa", "usuario").all()
    serializer_class = HistoricoEmpresaPortalSerializer
    authentication_classes = [EmpresaPortalAuthentication]
    permission_classes = []

    def get_queryset(self):
        qs = super().get_queryset()
        empresa_id = self.request.query_params.get("empresa_id")
        if empresa_id:
            qs = qs.filter(empresa_id=empresa_id)
        return qs


class WebhookConfigurationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebhookConfiguration.objects.select_related("empresa").all()
    serializer_class = WebhookConfigurationSerializer
    authentication_classes = [EmpresaPortalAuthentication]
    permission_classes = []


class APIAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = APIAnalytics.objects.select_related("empresa").all()
    serializer_class = APIAnalyticsSerializer
    authentication_classes = [EmpresaPortalAuthentication]
    permission_classes = []


class SolicitacaoCadastroEmpresaViewSet(viewsets.ModelViewSet):
    queryset = SolicitacaoCadastroEmpresa.objects.all()
    serializer_class = SolicitacaoCadastroEmpresaSerializer

    def get_permissions(self):
        if self.action in ["create"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(status="PENDENTE")

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def aprovar(self, request, pk=None):
        solicitacao = self.get_object()
        if solicitacao.status != "PENDENTE":
            raise ValidationError("Solicitação já analisada.")

        empresa, token = solicitacao.aprovar(request.user)
        email_enviado = gestao_empresa_service.enviar_email_boas_vindas(empresa) or True

        empresa_data = EmpresaAutorizadaSerializer(empresa, context={"request": request}).data
        token_data = TokenEmpresaSerializer(token, context={"request": request}).data
        return Response(
            {
                "message": "Solicitação aprovada com sucesso.",
                "empresa": empresa_data,
                "token": token_data,
                "email_enviado": email_enviado,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def rejeitar(self, request, pk=None):
        solicitacao = self.get_object()
        if solicitacao.status != "PENDENTE":
            raise ValidationError("Solicitação já analisada.")

        motivo = request.data.get("motivo", "")
        solicitacao.marcar_rejeitada(request.user, motivo)
        serializer = self.get_serializer(solicitacao)
        return Response(
            {"message": "Solicitação rejeitada.", "solicitacao": serializer.data},
            status=status.HTTP_200_OK,
        )

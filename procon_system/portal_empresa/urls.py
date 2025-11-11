from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import (
    APIAnalyticsViewSet,
    EmpresaAutorizadaViewSet,
    HistoricoEmpresaViewSet,
    ReclamacaoEmpresaViewSet,
    RespostaEmpresaPortalViewSet,
    TokenEmpresaViewSet,
    UsuarioEmpresaViewSet,
    WebhookConfigurationViewSet,
    SolicitacaoCadastroEmpresaViewSet,
    EngajamentoResumoAPIView,
)

router = DefaultRouter()
router.register("empresas", EmpresaAutorizadaViewSet, basename="empresas")
router.register("tokens", TokenEmpresaViewSet, basename="tokens")
router.register("usuarios", UsuarioEmpresaViewSet, basename="usuarios")
router.register("respostas", RespostaEmpresaPortalViewSet, basename="respostas")
router.register("historicos", HistoricoEmpresaViewSet, basename="historicos")
router.register("webhooks", WebhookConfigurationViewSet, basename="webhooks")
router.register("analytics", APIAnalyticsViewSet, basename="analytics")
router.register("solicitacoes", SolicitacaoCadastroEmpresaViewSet, basename="solicitacaocadastroempresa")
router.register("reclamacoes", ReclamacaoEmpresaViewSet, basename="portal-empresa-reclamacoes")

app_name = "portal_empresa"

urlpatterns = [
    path("", include(router.urls)),
    path("engajamento/resumo/", EngajamentoResumoAPIView.as_view(), name="engajamento-resumo"),
]

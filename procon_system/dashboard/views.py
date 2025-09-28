from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
import logging

logger = logging.getLogger(__name__)


def _period_multiplier(periodo: str) -> int:
    periodo = (periodo or 'mes').lower()
    if periodo == 'ano':
        return 12
    if periodo in {'trimestre', 'trim'}:
        return 3
    return 1


def _build_stats(periodo: str) -> dict:
    fator = _period_multiplier(periodo)
    base = {
        'totalProcessos': 1247,
        'processosEmAndamento': 892,
        'processosConcluidos': 355,
        'processosPendentes': 234,
        'totalMultas': 567,
        'multasPagas': 423,
        'multasPendentes': 144,
        'multasVencidas': 45,
        'arrecadacaoMes': 1_250_000,
        'arrecadacaoAno': 15_800_000,
        'denunciasRecebidas': 234,
        'fiscalizacoesRealizadas': 89,
        'usuariosAtivos': 45,
        'taxaResolucao': 78.5,
        'tempoMedioResolucao': 12.3,
    }

    ajustado = {}
    for chave, valor in base.items():
        if chave in {'taxaResolucao', 'tempoMedioResolucao'}:
            ajustado[chave] = valor
        elif isinstance(valor, (int, float)):
            ajustado[chave] = valor * fator
        else:
            ajustado[chave] = valor

    ajustado['periodo'] = periodo
    ajustado['atualizadoEm'] = timezone.now().isoformat()
    return ajustado


def _build_chart_data(periodo: str) -> dict:
    return {
        'arrecadacaoMensal': [
            {'mes': 'Jan', 'valor': 1_200_000, 'meta': 1_000_000},
            {'mes': 'Fev', 'valor': 1_350_000, 'meta': 1_000_000},
            {'mes': 'Mar', 'valor': 1_100_000, 'meta': 1_000_000},
            {'mes': 'Abr', 'valor': 1_400_000, 'meta': 1_000_000},
            {'mes': 'Mai', 'valor': 1_250_000, 'meta': 1_000_000},
            {'mes': 'Jun', 'valor': 1_300_000, 'meta': 1_000_000},
        ],
        'processosPorStatus': [
            {'status': 'Em andamento', 'quantidade': 892, 'percentual': 71.5},
            {'status': 'Concluidos', 'quantidade': 355, 'percentual': 28.5},
            {'status': 'Pendentes', 'quantidade': 234, 'percentual': 18.8},
        ],
        'multasPorTipo': [
            {'tipo': 'Bancos', 'quantidade': 156, 'valor': 4_500_000},
            {'tipo': 'Supermercados', 'quantidade': 234, 'valor': 3_200_000},
            {'tipo': 'Postos', 'quantidade': 89, 'valor': 1_800_000},
        ],
        'denunciasPorMes': [
            {'mes': 'Jan', 'quantidade': 45, 'resolvidas': 38},
            {'mes': 'Fev', 'quantidade': 52, 'resolvidas': 45},
            {'mes': 'Mar', 'quantidade': 38, 'resolvidas': 32},
        ],
        'performanceMensal': [
            {'mes': 'Jan', 'taxa': 76, 'meta': 80},
            {'mes': 'Fev', 'taxa': 82, 'meta': 80},
            {'mes': 'Mar', 'taxa': 79, 'meta': 80},
            {'mes': 'Abr', 'taxa': 85, 'meta': 80},
        ],
        'fiscalizacoesPorMes': [
            {'mes': 'Jan', 'quantidade': 65},
            {'mes': 'Fev', 'quantidade': 72},
            {'mes': 'Mar', 'quantidade': 58},
            {'mes': 'Abr', 'quantidade': 80},
        ],
    }


def _build_alertas() -> list:
    agora = timezone.now().isoformat()
    return [
        {
            'id': 1,
            'tipo': 'warning',
            'titulo': 'Multas vencendo',
            'mensagem': '15 multas vencem nos proximos 7 dias',
            'acao': 'Ver detalhes',
            'dataCriacao': agora,
        },
        {
            'id': 2,
            'tipo': 'info',
            'titulo': 'Novos processos',
            'mensagem': '23 novos processos foram protocolados hoje',
            'acao': 'Revisar',
            'dataCriacao': agora,
        },
    ]


def _build_atividades(limite: int) -> list:
    agora = timezone.now().isoformat()
    atividades = [
        {
            'id': 1,
            'tipo': 'processo',
            'titulo': 'Processo #2025-001234 protocolado',
            'descricao': 'Denuncia contra Loja XYZ',
            'usuario': 'Maria Silva',
            'dataCriacao': agora,
        },
        {
            'id': 2,
            'tipo': 'multa',
            'titulo': 'Multa #M2025-000567 paga',
            'descricao': 'Valor: R$ 15.000,00',
            'usuario': 'Sistema',
            'dataCriacao': agora,
        },
        {
            'id': 3,
            'tipo': 'fiscalizacao',
            'titulo': 'Fiscalizacao concluida',
            'descricao': 'Equipe realizou vistoria no estabelecimento ABC',
            'usuario': 'Equipe Fiscalizacao',
            'dataCriacao': agora,
        },
    ]
    return atividades[:limite]


def _build_cached_payload(periodo: str) -> dict:
    return {
        'estatisticas': _build_stats(periodo),
        'graficos': _build_chart_data(periodo),
        'alertas': _build_alertas(),
        'atividades': _build_atividades(10),
        'dataAtualizacao': timezone.now().isoformat(),
    }


class DashboardStatsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            periodo = request.GET.get('periodo', 'mes')
            return Response(_build_stats(periodo))
        except Exception as exc:
            logger.exception('Erro ao carregar estatisticas do dashboard', exc_info=exc)
            return Response({'error': 'Erro interno do servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardGraficosAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            periodo = request.GET.get('periodo', 'mes')
            return Response(_build_chart_data(periodo))
        except Exception as exc:
            logger.exception('Erro ao carregar dados dos graficos', exc_info=exc)
            return Response({'error': 'Erro interno do servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardAlertasAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            return Response(_build_alertas())
        except Exception as exc:
            logger.exception('Erro ao carregar alertas do dashboard', exc_info=exc)
            return Response({'error': 'Erro interno do servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardAtividadesAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            limite = max(int(request.GET.get('limite', 10)), 1)
            return Response(_build_atividades(limite))
        except Exception as exc:
            logger.exception('Erro ao carregar atividades do dashboard', exc_info=exc)
            return Response({'error': 'Erro interno do servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_cached_view(request):
    try:
        periodo = request.GET.get('periodo', 'mes')
        return Response(_build_cached_payload(periodo))
    except Exception as exc:
        logger.exception('Erro ao carregar dashboard completo', exc_info=exc)
        return Response({'error': 'Erro interno do servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

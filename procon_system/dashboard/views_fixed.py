from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class DashboardStatsAPIView(APIView):
    """API para estatísticas do dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            periodo = request.GET.get('periodo', 'mes')
            
            # Mock data para desenvolvimento - sem consultas ao banco
            stats = {
                'periodo': periodo,
                'data_atualizacao': timezone.now().isoformat(),
                'processos': {
                    'total': 1247,
                    'periodo': 89,
                    'em_andamento': 892,
                    'concluidos': 355,
                    'pendentes': 234
                },
                'multas': {
                    'total': 567,
                    'periodo': 45,
                    'valor_total': 8500000.0,
                    'pagas': 423,
                    'pendentes': 144,
                    'vencidas': 45
                },
                'protocolos': {
                    'total': 456,
                    'periodo': 23,
                    'abertos': 234,
                    'tramitando': 156,
                    'concluidos': 66
                },
                'usuarios': {
                    'ativos': 45,
                    'total': 50
                },
                'performance': {
                    'taxa_resolucao': 78.5,
                    'tempo_medio_resolucao': 12.3,
                    'satisfacao': 4.2
                }
            }
            
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Erro ao carregar estatísticas: {e}")
            return Response({
                'error': 'Erro interno do servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardGraficosAPIView(APIView):
    """API para dados dos gráficos do dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            periodo = request.GET.get('periodo', 'mes')
            
            # Mock data para desenvolvimento
            graficos_data = {
                'arrecadacao_mensal': [
                    {'mes': 'Jan', 'valor': 1200000, 'meta': 1000000},
                    {'mes': 'Fev', 'valor': 1350000, 'meta': 1000000},
                    {'mes': 'Mar', 'valor': 1100000, 'meta': 1000000},
                    {'mes': 'Abr', 'valor': 1400000, 'meta': 1000000},
                    {'mes': 'Mai', 'valor': 1250000, 'meta': 1000000},
                    {'mes': 'Jun', 'valor': 1300000, 'meta': 1000000}
                ],
                'processos_por_status': [
                    {'status': 'Em Andamento', 'quantidade': 892, 'percentual': 71.5},
                    {'status': 'Concluído', 'quantidade': 355, 'percentual': 28.5},
                    {'status': 'Pendente', 'quantidade': 234, 'percentual': 18.8}
                ],
                'multas_por_tipo': [
                    {'tipo': 'Bancos', 'quantidade': 156, 'valor': 4500000},
                    {'tipo': 'Supermercados', 'quantidade': 234, 'valor': 3200000},
                    {'tipo': 'Postos', 'quantidade': 89, 'valor': 1800000}
                ],
                'denuncias_por_mes': [
                    {'mes': 'Jan', 'quantidade': 45, 'resolvidas': 38},
                    {'mes': 'Fev', 'quantidade': 52, 'resolvidas': 45},
                    {'mes': 'Mar', 'quantidade': 38, 'resolvidas': 32}
                ]
            }
            
            return Response(graficos_data)
            
        except Exception as e:
            logger.error(f"Erro ao carregar dados dos gráficos: {e}")
            return Response({
                'error': 'Erro interno do servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardAlertasAPIView(APIView):
    """API para alertas do dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Mock data para desenvolvimento
            alertas_data = [
                {
                    'id': 1,
                    'tipo': 'warning',
                    'titulo': 'Multas vencendo',
                    'mensagem': '15 multas vencem nos próximos 7 dias',
                    'acao': 'Ver detalhes',
                    'data_criacao': timezone.now().isoformat()
                },
                {
                    'id': 2,
                    'tipo': 'info',
                    'titulo': 'Novos processos',
                    'mensagem': '23 novos processos foram protocolados hoje',
                    'acao': 'Revisar',
                    'data_criacao': timezone.now().isoformat()
                }
            ]
            
            return Response({
                'alertas': alertas_data,
                'total': len(alertas_data)
            })
            
        except Exception as e:
            logger.error(f"Erro ao carregar alertas: {e}")
            return Response({
                'error': 'Erro interno do servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardAtividadesAPIView(APIView):
    """API para atividades recentes do dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            limite = int(request.GET.get('limite', 10))
            
            # Mock data para desenvolvimento
            atividades_data = [
                {
                    'id': 1,
                    'tipo': 'processo',
                    'titulo': 'Processo #2025-001234 protocolado',
                    'descricao': 'Denúncia contra Loja XYZ',
                    'usuario': 'Maria Silva',
                    'data_criacao': timezone.now().isoformat()
                },
                {
                    'id': 2,
                    'tipo': 'multa',
                    'titulo': 'Multa #M2025-000567 paga',
                    'descricao': 'Valor: R$ 15.000,00',
                    'usuario': 'Sistema',
                    'data_criacao': timezone.now().isoformat()
                }
            ]
            
            return Response({
                'atividades': atividades_data[:limite],
                'total': len(atividades_data)
            })
            
        except Exception as e:
            logger.error(f"Erro ao carregar atividades: {e}")
            return Response({
                'error': 'Erro interno do servidor',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_cached_view(request):
    """View cached para dados completos do dashboard"""
    try:
        periodo = request.GET.get('periodo', 'mes')
        
        # Mock data completo para desenvolvimento
        complete_data = {
            'estatisticas': {
                'periodo': periodo,
                'data_atualizacao': timezone.now().isoformat(),
                'processos': {
                    'total': 1247,
                    'periodo': 89,
                    'em_andamento': 892,
                    'concluidos': 355,
                    'pendentes': 234
                },
                'multas': {
                    'total': 567,
                    'periodo': 45,
                    'valor_total': 8500000.0,
                    'pagas': 423,
                    'pendentes': 144,
                    'vencidas': 45
                },
                'protocolos': {
                    'total': 456,
                    'periodo': 23,
                    'abertos': 234,
                    'tramitando': 156,
                    'concluidos': 66
                },
                'usuarios': {
                    'ativos': 45,
                    'total': 50
                },
                'performance': {
                    'taxa_resolucao': 78.5,
                    'tempo_medio_resolucao': 12.3,
                    'satisfacao': 4.2
                }
            },
            'graficos': {
                'arrecadacao_mensal': [
                    {'mes': 'Jan', 'valor': 1200000, 'meta': 1000000},
                    {'mes': 'Fev', 'valor': 1350000, 'meta': 1000000}
                ],
                'processos_por_status': [
                    {'status': 'Em Andamento', 'quantidade': 892, 'percentual': 71.5},
                    {'status': 'Concluído', 'quantidade': 355, 'percentual': 28.5}
                ]
            },
            'alertas': [
                {
                    'id': 1,
                    'tipo': 'warning',
                    'titulo': 'Multas vencendo',
                    'mensagem': '15 multas vencem nos próximos 7 dias',
                    'data_criacao': timezone.now().isoformat()
                }
            ],
            'atividades': [
                {
                    'id': 1,
                    'tipo': 'processo',
                    'titulo': 'Processo #2025-001234 protocolado',
                    'descricao': 'Denúncia contra Loja XYZ',
                    'usuario': 'Maria Silva',
                    'data_criacao': timezone.now().isoformat()
                }
            ],
            'data_atualizacao': timezone.now().isoformat()
        }
        
        return Response(complete_data)
        
    except Exception as e:
        logger.error(f"Erro ao carregar dashboard completo: {e}")
        return Response({
            'error': 'Erro interno do servidor',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


"""
Views para Dashboard e Estatísticas - System Procon

Este módulo contém views para exibição de dados agregados,
estatísticas e informações para o dashboard do sistema.
"""

from django.http import JsonResponse
from django.db.models import Count, Q, Sum, Avg
from django.utils import timezone
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime, timedelta
import concurrent.futures
import threading

from ..models import (
    AutoBanco,
    AutoPosto,
    AutoSupermercado,
    AutoDiversos,
    AutoInfracao,
    Processo,
)

from ..serializers import (
    DashboardResponseSerializer,
    EstatisticasResponseSerializer,
)


# ========================================
# DASHBOARD PRINCIPAL
# ========================================

@api_view(['GET'])
def dashboard_stats(request):
    """
    Retorna estatísticas principais para o dashboard.
    Otimizado para performance com queries paralelas.
    """
    try:
        def get_auto_stats():
            """Estatísticas dos autos de constatação"""
            return {
                'total_bancos': AutoBanco.objects.count(),
                'total_postos': AutoPosto.objects.count(),
                'total_supermercados': AutoSupermercado.objects.count(),
                'total_diversos': AutoDiversos.objects.count(),
            }
        
        def get_infracao_stats():
            """Estatísticas das infrações"""
            hoje = timezone.now().date()
            mes_atual = hoje.replace(day=1)
            
            return {
                'total_infracoes': AutoInfracao.objects.count(),
                'infracoes_mes': AutoInfracao.objects.filter(
                    data_fiscalizacao__gte=mes_atual
                ).count(),
                'infracoes_pendentes': AutoInfracao.objects.filter(
                    status__in=['autuado', 'notificado']
                ).count(),
                'por_gravidade': dict(
                    AutoInfracao.objects.values('gravidade').annotate(
                        count=Count('id')
                    ).values_list('gravidade', 'count')
                ),
            }
        
        def get_processo_stats():
            """Estatísticas dos processos"""
            return {
                'total_processos': Processo.objects.count(),
                'processos_pendentes': Processo.objects.filter(
                    status__in=['aguardando_defesa', 'aguardando_recurso']
                ).count(),
                'processos_finalizados': Processo.objects.filter(
                    status__in=['finalizado_procedente', 'finalizado_improcedente']
                ).count(),
                'por_status': dict(
                    Processo.objects.values('status').annotate(
                        count=Count('id')
                    ).values_list('status', 'count')
                ),
            }
        
        def get_tendencias():
            """Tendências dos últimos 6 meses"""
            hoje = timezone.now().date()
            seis_meses_atras = hoje - timedelta(days=180)
            
            # Autos por mês
            autos_por_mes = {}
            for i in range(6):
                data_inicio = hoje.replace(day=1) - timedelta(days=30*i)
                data_fim = (data_inicio + timedelta(days=31)).replace(day=1) - timedelta(days=1)
                
                total_banco = AutoBanco.objects.filter(
                    data_fiscalizacao__range=[data_inicio, data_fim]
                ).count()
                total_posto = AutoPosto.objects.filter(
                    data_fiscalizacao__range=[data_inicio, data_fim]
                ).count()
                total_super = AutoSupermercado.objects.filter(
                    data_fiscalizacao__range=[data_inicio, data_fim]
                ).count()
                total_diversos = AutoDiversos.objects.filter(
                    data_fiscalizacao__range=[data_inicio, data_fim]
                ).count()
                
                mes_key = data_inicio.strftime('%Y-%m')
                autos_por_mes[mes_key] = {
                    'banco': total_banco,
                    'posto': total_posto,
                    'supermercado': total_super,
                    'diversos': total_diversos,
                    'total': total_banco + total_posto + total_super + total_diversos
                }
            
            return autos_por_mes
        
        # Executar queries em paralelo para melhor performance
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_autos = executor.submit(get_auto_stats)
            future_infracoes = executor.submit(get_infracao_stats)
            future_processos = executor.submit(get_processo_stats)
            future_tendencias = executor.submit(get_tendencias)
            
            # Coletar resultados
            stats = {
                'autos': future_autos.result(),
                'infracoes': future_infracoes.result(),
                'processos': future_processos.result(),
                'tendencias': future_tendencias.result(),
                'resumo': {}
            }
        
        # Calcular resumo geral
        stats['resumo'] = {
            'total_documentos': (
                stats['autos']['total_bancos'] +
                stats['autos']['total_postos'] +
                stats['autos']['total_supermercados'] +
                stats['autos']['total_diversos'] +
                stats['infracoes']['total_infracoes']
            ),
            'atividade_recente': stats['infracoes']['infracoes_mes'],
            'pendencias': (
                stats['infracoes']['infracoes_pendentes'] +
                stats['processos']['processos_pendentes']
            ),
        }
        
        # Validar com serializer
        serializer = DashboardResponseSerializer(data=stats)
        if serializer.is_valid():
            return Response(serializer.data)
        else:
            return Response(stats)  # Retorna dados brutos se serializer falhar
            
    except Exception as e:
        return Response({
            'error': str(e),
            'message': 'Erro ao carregar estatísticas do dashboard'
        }, status=500)


@api_view(['GET'])
def estatisticas_gerais(request):
    """
    Estatísticas gerais mais detalhadas do sistema.
    """
    try:
        # Filtros opcionais
        data_inicio = request.GET.get('data_inicio')
        data_fim = request.GET.get('data_fim')
        municipio = request.GET.get('municipio')
        
        # Queries base
        autos_banco = AutoBanco.objects.all()
        autos_posto = AutoPosto.objects.all()
        autos_super = AutoSupermercado.objects.all()
        autos_diversos = AutoDiversos.objects.all()
        infracoes = AutoInfracao.objects.all()
        
        # Aplicar filtros se fornecidos
        if data_inicio:
            autos_banco = autos_banco.filter(data_fiscalizacao__gte=data_inicio)
            autos_posto = autos_posto.filter(data_fiscalizacao__gte=data_inicio)
            autos_super = autos_super.filter(data_fiscalizacao__gte=data_inicio)
            autos_diversos = autos_diversos.filter(data_fiscalizacao__gte=data_inicio)
            infracoes = infracoes.filter(data_fiscalizacao__gte=data_inicio)
        
        if data_fim:
            autos_banco = autos_banco.filter(data_fiscalizacao__lte=data_fim)
            autos_posto = autos_posto.filter(data_fiscalizacao__lte=data_fim)
            autos_super = autos_super.filter(data_fiscalizacao__lte=data_fim)
            autos_diversos = autos_diversos.filter(data_fiscalizacao__lte=data_fim)
            infracoes = infracoes.filter(data_fiscalizacao__lte=data_fim)
        
        if municipio:
            autos_banco = autos_banco.filter(municipio__icontains=municipio)
            autos_posto = autos_posto.filter(municipio__icontains=municipio)
            autos_super = autos_super.filter(municipio__icontains=municipio)
            autos_diversos = autos_diversos.filter(municipio__icontains=municipio)
        
        # Calcular estatísticas
        stats = {
            'periodo': {
                'data_inicio': data_inicio,
                'data_fim': data_fim,
                'municipio': municipio,
            },
            'totais': {
                'autos_banco': autos_banco.count(),
                'autos_posto': autos_posto.count(),
                'autos_supermercado': autos_super.count(),
                'autos_diversos': autos_diversos.count(),
                'total_autos': (
                    autos_banco.count() + autos_posto.count() + 
                    autos_super.count() + autos_diversos.count()
                ),
                'total_infracoes': infracoes.count(),
            },
            'por_origem': {
                'acao_fiscalizatoria': (
                    autos_banco.filter(origem='acao').count() +
                    autos_posto.filter(origem='acao').count() +
                    autos_super.filter(origem='acao').count() +
                    autos_diversos.filter(origem='acao').count()
                ),
                'denuncia': (
                    autos_banco.filter(origem='denuncia').count() +
                    autos_posto.filter(origem='denuncia').count() +
                    autos_super.filter(origem='denuncia').count() +
                    autos_diversos.filter(origem='denuncia').count()
                ),
                'forca_tarefa': (
                    autos_banco.filter(origem='forca_tarefa').count() +
                    autos_posto.filter(origem='forca_tarefa').count() +
                    autos_super.filter(origem='forca_tarefa').count() +
                    autos_diversos.filter(origem='forca_tarefa').count()
                ),
            },
            'irregularidades': {
                'bancos_com_irregularidades': autos_banco.exclude(
                    Q(nada_consta=True) | Q(sem_irregularidades=True)
                ).count(),
                'postos_com_irregularidades': autos_posto.exclude(
                    Q(nada_consta=True) | Q(sem_irregularidades=True)
                ).count(),
                'supermercados_com_irregularidades': autos_super.exclude(
                    nada_consta=True
                ).count(),
            },
            'infracoes_por_gravidade': dict(
                infracoes.values('gravidade').annotate(
                    count=Count('id')
                ).values_list('gravidade', 'count')
            ),
            'infracoes_por_tipo': dict(
                infracoes.values('tipo_infracao').annotate(
                    count=Count('id')
                ).values_list('tipo_infracao', 'count')
            ),
        }
        
        # Validar com serializer
        serializer = EstatisticasResponseSerializer(data=stats)
        if serializer.is_valid():
            return Response(serializer.data)
        else:
            return Response(stats)
            
    except Exception as e:
        return Response({
            'error': str(e),
            'message': 'Erro ao calcular estatísticas gerais'
        }, status=500)


# ========================================
# DASHBOARD COM CACHE
# ========================================

@cache_page(60 * 15)  # Cache por 15 minutos
@api_view(['GET'])
def processos_dashboard_cached(request):
    """
    Dashboard de processos com cache para melhor performance.
    """
    cache_key = 'processos_dashboard_stats'
    stats = cache.get(cache_key)
    
    if not stats:
        try:
            hoje = timezone.now().date()
            
            stats = {
                'resumo': {
                    'total': Processo.objects.count(),
                    'pendentes': Processo.objects.filter(
                        status__in=['aguardando_defesa', 'aguardando_recurso']
                    ).count(),
                    'finalizados_mes': Processo.objects.filter(
                        data_finalizacao__month=hoje.month,
                        data_finalizacao__year=hoje.year
                    ).count(),
                    'vencendo_prazo': Processo.objects.filter(
                        Q(prazo_defesa__lte=hoje + timedelta(days=3)) |
                        Q(prazo_recurso__lte=hoje + timedelta(days=3))
                    ).count(),
                },
                'por_status': dict(
                    Processo.objects.values('status').annotate(
                        count=Count('id')
                    ).values_list('status', 'count')
                ),
                'por_prioridade': dict(
                    Processo.objects.values('prioridade').annotate(
                        count=Count('id')
                    ).values_list('prioridade', 'count')
                ),
                'valores': {
                    'total_multas': Processo.objects.aggregate(
                        total=Sum('valor_multa')
                    )['total'] or 0,
                    'valor_medio': Processo.objects.aggregate(
                        media=Avg('valor_multa')
                    )['media'] or 0,
                },
                'tempo_medio_tramitacao': Processo.objects.filter(
                    data_finalizacao__isnull=False
                ).aggregate(
                    tempo_medio=Avg('data_finalizacao') - Avg('criado_em')
                ),
            }
            
            # Cache por 15 minutos
            cache.set(cache_key, stats, 60 * 15)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Erro ao carregar dashboard de processos'
            }, status=500)
    
    return Response(stats)

"""
Views para Processos Administrativos - System Procon

Este módulo contém views relacionadas aos Processos Administrativos,
incluindo gestão completa do ciclo de vida dos processos.
"""

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Sum, Avg
from django.utils import timezone
from django.core.cache import cache
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from datetime import datetime, timedelta

from ..models import (
    Processo,
    HistoricoProcesso,
    DocumentoProcesso,
    AutoInfracao,
)

from ..serializers import (
    ProcessoSimpleSerializer,
    ProcessoDetailSerializer,
    ProcessoCreateUpdateSerializer,
    ProcessoEstatisticasSerializer,
    ProcessoResumoMensalSerializer,
    ProcessoFiltroSerializer,
    ProcessoBuscaSerializer,
    DocumentoUploadSerializer,
    DocumentoProcessoSerializer,
    AtualizarStatusProcessoSerializer,
    HistoricoProcessoSerializer,
)


# ========================================
# VIEWS PRINCIPAIS DE PROCESSO
# ========================================

class ProcessoListCreateAPIView(generics.ListCreateAPIView):
    queryset = Processo.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProcessoCreateUpdateSerializer
        return ProcessoSimpleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        status_filter = self.request.query_params.get('status')
        prioridade = self.request.query_params.get('prioridade')
        prazo_vencendo = self.request.query_params.get('prazo_vencendo')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if prioridade:
            queryset = queryset.filter(prioridade=prioridade)
        if data_inicio:
            queryset = queryset.filter(criado_em__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(criado_em__lte=data_fim)
        if prazo_vencendo == 'true':
            hoje = timezone.now().date()
            limite = hoje + timedelta(days=3)
            queryset = queryset.filter(
                Q(prazo_defesa__lte=limite) | Q(prazo_recurso__lte=limite)
            )
        
        return queryset


class ProcessoDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Processo.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProcessoCreateUpdateSerializer
        return ProcessoDetailSerializer


# ========================================
# VIEWS FUNCIONAIS PARA PROCESSOS
# ========================================

@api_view(['POST'])
def atualizar_status_processo(request, pk):
    """
    Atualiza status do processo e registra no histórico.
    """
    try:
        processo = get_object_or_404(Processo, pk=pk)
        
        serializer = AtualizarStatusProcessoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        novo_status = serializer.validated_data['status']
        observacao = serializer.validated_data.get('observacao', '')
        usuario = serializer.validated_data.get('usuario', 'Sistema')
        
        # Atualizar usando método do modelo
        processo.atualizar_status(novo_status, observacao)
        
        return Response({
            'message': 'Status atualizado com sucesso',
            'processo': ProcessoDetailSerializer(processo).data
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def historico_processo(request, pk):
    """
    Retorna histórico completo de mudanças do processo.
    """
    try:
        processo = get_object_or_404(Processo, pk=pk)
        historico = processo.historico.all().order_by('-data_mudanca')
        
        serializer = HistoricoProcessoSerializer(historico, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def processos_dashboard(request):
    """
    Dashboard específico para processos.
    """
    try:
        hoje = timezone.now().date()
        
        dashboard_data = {
            'resumo_geral': {
                'total_processos': Processo.objects.count(),
                'processos_ativos': Processo.objects.exclude(
                    status__in=['finalizado_procedente', 'finalizado_improcedente', 'arquivado']
                ).count(),
                'processos_vencendo': Processo.objects.filter(
                    Q(prazo_defesa__lte=hoje + timedelta(days=3)) |
                    Q(prazo_recurso__lte=hoje + timedelta(days=3))
                ).count(),
                'processos_finalizados_mes': Processo.objects.filter(
                    data_finalizacao__month=hoje.month,
                    data_finalizacao__year=hoje.year
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
            'valores_financeiros': {
                'total_multas': Processo.objects.aggregate(
                    total=Sum('valor_multa')
                )['total'] or 0,
                'valor_medio_multa': Processo.objects.aggregate(
                    media=Avg('valor_multa')
                )['media'] or 0,
                'total_valores_finais': Processo.objects.aggregate(
                    total=Sum('valor_final')
                )['total'] or 0,
            },
            'prazos_criticos': list(
                Processo.objects.filter(
                    Q(prazo_defesa__lte=hoje + timedelta(days=3)) |
                    Q(prazo_recurso__lte=hoje + timedelta(days=3))
                ).values(
                    'id', 'numero_processo', 'autuado', 'prazo_defesa', 'prazo_recurso', 'status'
                )
            ),
        }
        
        return Response(dashboard_data)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def relatorio_mensal_processos(request):
    """
    Relatório mensal detalhado dos processos.
    """
    try:
        mes = int(request.GET.get('mes', timezone.now().month))
        ano = int(request.GET.get('ano', timezone.now().year))
        
        # Filtrar processos do mês
        processos_mes = Processo.objects.filter(
            criado_em__month=mes,
            criado_em__year=ano
        )
        
        finalizados_mes = Processo.objects.filter(
            data_finalizacao__month=mes,
            data_finalizacao__year=ano
        )
        
        relatorio = {
            'periodo': {
                'mes': mes,
                'ano': ano,
                'nome_mes': [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ][mes - 1]
            },
            'criados_no_mes': {
                'total': processos_mes.count(),
                'por_prioridade': dict(
                    processos_mes.values('prioridade').annotate(
                        count=Count('id')
                    ).values_list('prioridade', 'count')
                ),
                'valor_total_multas': processos_mes.aggregate(
                    total=Sum('valor_multa')
                )['total'] or 0,
            },
            'finalizados_no_mes': {
                'total': finalizados_mes.count(),
                'por_status': dict(
                    finalizados_mes.values('status').annotate(
                        count=Count('id')
                    ).values_list('status', 'count')
                ),
                'tempo_medio_tramitacao': finalizados_mes.aggregate(
                    tempo_medio=Avg('tempo_tramitacao')
                )['tempo_medio'],
            },
            'detalhes': ProcessoResumoMensalSerializer(processos_mes, many=True).data
        }
        
        return Response(relatorio)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def buscar_processos(request):
    """
    Busca avançada de processos.
    """
    try:
        serializer = ProcessoBuscaSerializer(data=request.GET)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        filtros = serializer.validated_data
        queryset = Processo.objects.all()
        
        # Aplicar filtros
        if filtros.get('termo'):
            termo = filtros['termo']
            queryset = queryset.filter(
                Q(numero_processo__icontains=termo) |
                Q(autuado__icontains=termo) |
                Q(cnpj__icontains=termo)
            )
        
        if filtros.get('status'):
            queryset = queryset.filter(status__in=filtros['status'])
        
        if filtros.get('prioridade'):
            queryset = queryset.filter(prioridade__in=filtros['prioridade'])
        
        if filtros.get('data_inicio'):
            queryset = queryset.filter(criado_em__gte=filtros['data_inicio'])
        
        if filtros.get('data_fim'):
            queryset = queryset.filter(criado_em__lte=filtros['data_fim'])
        
        if filtros.get('valor_min'):
            queryset = queryset.filter(valor_multa__gte=filtros['valor_min'])
        
        if filtros.get('valor_max'):
            queryset = queryset.filter(valor_multa__lte=filtros['valor_max'])
        
        # Ordenação
        ordem = filtros.get('ordem', '-criado_em')
        queryset = queryset.order_by(ordem)
        
        # Paginação
        paginator = PageNumberPagination()
        paginator.page_size = filtros.get('limite', 20)
        resultado_paginado = paginator.paginate_queryset(queryset, request)
        
        serializer_resultado = ProcessoSimpleSerializer(resultado_paginado, many=True)
        return paginator.get_paginated_response(serializer_resultado.data)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def opcoes_filtros(request):
    """
    Retorna opções disponíveis para filtros de processos.
    """
    try:
        opcoes = {
            'status': [
                {'value': choice[0], 'label': choice[1]}
                for choice in Processo.STATUS_CHOICES
            ],
            'prioridade': [
                {'value': choice[0], 'label': choice[1]}
                for choice in Processo.PRIORIDADE_CHOICES
            ],
            'anos_disponiveis': list(
                Processo.objects.dates('criado_em', 'year').values_list(
                    'criado_em__year', flat=True
                )
            ),
        }
        
        return Response(opcoes)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========================================
# VIEWS DE DOCUMENTOS DO PROCESSO
# ========================================

class DocumentoProcessoListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = DocumentoProcessoSerializer
    
    def get_queryset(self):
        processo_id = self.kwargs['processo_id']
        return DocumentoProcesso.objects.filter(processo_id=processo_id)
    
    def perform_create(self, serializer):
        processo_id = self.kwargs['processo_id']
        processo = get_object_or_404(Processo, id=processo_id)
        serializer.save(processo=processo)


@api_view(['POST'])
def upload_documento_processo(request, processo_id):
    """
    Upload de documento para um processo específico.
    """
    try:
        processo = get_object_or_404(Processo, id=processo_id)
        
        serializer = DocumentoUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        documento = serializer.save(processo=processo)
        
        return Response(
            DocumentoProcessoSerializer(documento).data,
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========================================
# VIEWS DE VALIDAÇÃO E UTILITÁRIOS
# ========================================

@api_view(['POST'])
def validar_numero_processo(request):
    """
    Valida se um número de processo já existe.
    """
    try:
        numero = request.data.get('numero_processo')
        
        if not numero:
            return Response({
                'valido': False,
                'erro': 'Número não fornecido'
            })
        
        existe = Processo.objects.filter(numero_processo=numero).exists()
        
        return Response({
            'valido': not existe,
            'numero': numero,
            'existe': existe
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)


@api_view(['GET'])
def sugerir_numero_processo(request):
    """
    Sugere próximo número de processo disponível.
    """
    try:
        ano_atual = timezone.now().year
        
        # Buscar último processo do ano
        ultimo_processo = Processo.objects.filter(
            numero_processo__endswith=f"/{ano_atual}"
        ).order_by('-id').first()
        
        seq = 1
        if ultimo_processo and '-' in ultimo_processo.numero_processo:
            try:
                seq = int(ultimo_processo.numero_processo.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        numero_sugerido = f"PROC-{seq:05d}/{ano_atual}"
        
        return Response({
            'numero_sugerido': numero_sugerido,
            'sequencia': seq,
            'ano': ano_atual
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)


# ========================================
# VIEWS EXTRAS E RELATÓRIOS
# ========================================

@api_view(['GET'])
def exportar_processos(request):
    """
    Exporta lista de processos em formato CSV.
    """
    # Implementação de exportação seria aqui
    pass


@api_view(['GET'])
def estatisticas_avancadas(request):
    """
    Estatísticas avançadas dos processos.
    """
    # Implementação de estatísticas avançadas seria aqui
    pass


@api_view(['POST'])
def operacoes_lote(request):
    """
    Operações em lote para múltiplos processos.
    """
    # Implementação de operações em lote seria aqui
    pass


# ========================================
# VIEWS UNIFICADAS E PERFORMANCE
# ========================================

@api_view(['GET'])
def buscar_processo_unificado(request, processo_id):
    """
    Busca unificada que retorna processo com todos os dados relacionados.
    """
    try:
        processo = get_object_or_404(Processo, id=processo_id)
        
        dados = {
            'processo': ProcessoDetailSerializer(processo).data,
            'historico': HistoricoProcessoSerializer(
                processo.historico.all()[:10], many=True
            ).data,
            'documentos': DocumentoProcessoSerializer(
                processo.documentos.all(), many=True
            ).data,
            'auto_infracao': None
        }
        
        # Incluir dados da infração se existir
        if hasattr(processo, 'auto_infracao'):
            from ..serializers import AutoInfracaoSimpleSerializer
            dados['auto_infracao'] = AutoInfracaoSimpleSerializer(
                processo.auto_infracao
            ).data
        
        return Response(dados)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def listar_todos_processos(request):
    """
    Lista otimizada de todos os processos com informações essenciais.
    """
    try:
        # Usar select_related para otimizar queries
        queryset = Processo.objects.select_related('auto_infracao').all()
        
        # Aplicar filtros básicos
        status_filter = request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        limite = int(request.GET.get('limite', 50))
        offset = int(request.GET.get('offset', 0))
        
        processos = queryset[offset:offset + limite]
        
        # Serializar com dados essenciais
        dados = ProcessoSimpleSerializer(processos, many=True).data
        
        return Response({
            'processos': dados,
            'total': queryset.count(),
            'offset': offset,
            'limite': limite
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def teste_performance_busca(request, processo_id):
    """
    Endpoint para testar performance de busca.
    """
    # Implementação de teste de performance seria aqui
    pass


@api_view(['GET'])
def busca_avancada_processos(request):
    """
    Busca avançada de processos com múltiplos filtros.
    """
    try:
        queryset = Processo.objects.select_related('auto_infracao').all()
        
        # Filtros de busca
        q = request.GET.get('q', '')
        if q:
            queryset = queryset.filter(
                Q(numero_processo__icontains=q) |
                Q(autuado__icontains=q) |
                Q(cnpj__icontains=q) |
                Q(observacoes__icontains=q)
            )
        
        # Filtros adicionais
        status = request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        prioridade = request.GET.get('prioridade')
        if prioridade:
            queryset = queryset.filter(prioridade=prioridade)
        
        # Limite de resultados
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        
        total = queryset.count()
        processos = queryset[offset:offset + limit]
        
        dados = ProcessoSimpleSerializer(processos, many=True).data
        
        return Response({
            'resultados': dados,
            'total_encontrados': total,
            'offset': offset,
            'limite': limit
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def processos_dashboard_cached(request):
    """
    Dashboard de processos com cache para melhor performance.
    """
    try:
        # Cache key baseada nos parâmetros da requisição
        cache_key = f"dashboard_processos_{request.GET.get('periodo', 'mes')}"
        
        # Tentar buscar do cache primeiro
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        # Se não estiver em cache, calcular dados
        hoje = timezone.now().date()
        inicio_mes = hoje.replace(day=1)
        
        # Estatísticas básicas
        total_processos = Processo.objects.count()
        processos_abertos = Processo.objects.filter(status='aberto').count()
        processos_vencidos = Processo.objects.filter(
            Q(prazo_defesa__lt=hoje) | Q(prazo_recurso__lt=hoje)
        ).count()
        
        # Processos próximos do vencimento (próximos 3 dias)
        limite_vencimento = hoje + timedelta(days=3)
        processos_proximos_vencimento = Processo.objects.filter(
            Q(prazo_defesa__lte=limite_vencimento) | Q(prazo_recurso__lte=limite_vencimento)
        ).count()
        
        # Valor total em tramitação
        valor_total = Processo.objects.aggregate(
            total=Sum('valor_multa')
        )['total'] or 0
        
        dados = {
            'resumo': {
                'total_processos': total_processos,
                'processos_abertos': processos_abertos,
                'processos_vencidos': processos_vencidos,
                'processos_proximos_vencimento': processos_proximos_vencimento,
                'valor_total_tramitacao': float(valor_total),
                'tempo_medio_tramitacao': 0  # Seria calculado se necessário
            },
            'periodo': request.GET.get('periodo', 'mes'),
            'atualizado_em': timezone.now().isoformat()
        }
        
        # Salvar no cache por 5 minutos
        cache.set(cache_key, dados, 300)
        
        return Response(dados)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

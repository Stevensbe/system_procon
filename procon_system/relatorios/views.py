from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from datetime import datetime, timedelta
import json
import os

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    TipoRelatorio, Relatorio, RelatorioAgendado, TemplateRelatorio,
    FiltroRelatorio, RelatorioCompartilhado, HistoricoRelatorio, ConfiguracaoRelatorio
)
from .serializers import (
    TipoRelatorioSerializer, RelatorioListSerializer, RelatorioDetailSerializer,
    RelatorioCreateSerializer, RelatorioAgendadoSerializer, RelatorioAgendadoCreateSerializer,
    TemplateRelatorioSerializer, TemplateRelatorioCreateSerializer, FiltroRelatorioSerializer,
    RelatorioCompartilhadoSerializer, RelatorioCompartilhadoCreateSerializer,
    HistoricoRelatorioSerializer, ConfiguracaoRelatorioSerializer,
    DashboardRelatoriosSerializer, RelatorioStatsSerializer,
    ExecutarRelatorioSerializer, CancelarRelatorioSerializer, CompartilharRelatorioSerializer
)


# === VIEWS TEMPLATE ===

@login_required
def relatorios_home(request):
    """Página principal do módulo de relatórios"""
    return render(request, 'relatorios/home.html')


@login_required
def relatorios_lista(request):
    """Lista de relatórios"""
    return render(request, 'relatorios/lista.html')


@login_required
def relatorios_agendados(request):
    """Relatórios agendados"""
    return render(request, 'relatorios/agendados.html')


@login_required
def relatorios_templates(request):
    """Templates de relatórios"""
    return render(request, 'relatorios/templates.html')


@login_required
def relatorios_configuracoes(request):
    """Configurações de relatórios"""
    return render(request, 'relatorios/configuracoes.html')


# === VIEWSETS API ===

class TipoRelatorioViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de relatórios"""
    queryset = TipoRelatorio.objects.all()
    serializer_class = TipoRelatorioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['modulo', 'ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
    ordering = ['nome']
    pagination_class = PageNumberPagination


class RelatorioViewSet(viewsets.ModelViewSet):
    """ViewSet para relatórios"""
    queryset = Relatorio.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_relatorio', 'status', 'formato', 'solicitado_por']
    search_fields = ['titulo', 'descricao']
    ordering_fields = ['data_solicitacao', 'data_conclusao', 'titulo']
    ordering = ['-data_solicitacao']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return Relatorio.objects.select_related(
            'tipo_relatorio', 'solicitado_por'
        ).prefetch_related('compartilhamentos')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RelatorioListSerializer
        elif self.action == 'create':
            return RelatorioCreateSerializer
        return RelatorioDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(solicitado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard de relatórios"""
        # Estatísticas gerais
        total_relatorios = Relatorio.objects.count()
        relatorios_pendentes = Relatorio.objects.filter(status='PENDENTE').count()
        relatorios_concluidos = Relatorio.objects.filter(status='CONCLUIDO').count()
        relatorios_erro = Relatorio.objects.filter(status='ERRO').count()
        relatorios_agendados = RelatorioAgendado.objects.filter(ativo=True).count()
        
        # Relatórios por formato
        relatorios_por_formato = {}
        for formato, _ in Relatorio.FORMATO_CHOICES:
            count = Relatorio.objects.filter(formato=formato).count()
            if count > 0:
                relatorios_por_formato[formato] = count
        
        # Relatórios por status
        relatorios_por_status = {}
        for status, _ in Relatorio.STATUS_CHOICES:
            count = Relatorio.objects.filter(status=status).count()
            if count > 0:
                relatorios_por_status[status] = count
        
        # Relatórios recentes
        relatorios_recentes = Relatorio.objects.select_related(
            'tipo_relatorio', 'solicitado_por'
        ).order_by('-data_solicitacao')[:10]
        
        # Agendamentos próximos
        agendamentos_proximos = RelatorioAgendado.objects.select_related(
            'tipo_relatorio', 'criado_por'
        ).filter(
            ativo=True,
            proxima_execucao__gte=timezone.now()
        ).order_by('proxima_execucao')[:5]
        
        data = {
            'total_relatorios': total_relatorios,
            'relatorios_pendentes': relatorios_pendentes,
            'relatorios_concluidos': relatorios_concluidos,
            'relatorios_erro': relatorios_erro,
            'relatorios_agendados': relatorios_agendados,
            'relatorios_por_formato': relatorios_por_formato,
            'relatorios_por_status': relatorios_por_status,
            'relatorios_recentes': RelatorioListSerializer(relatorios_recentes, many=True).data,
            'agendamentos_proximos': RelatorioAgendadoSerializer(agendamentos_proximos, many=True).data,
        }
        
        serializer = DashboardRelatoriosSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Estatísticas detalhadas de relatórios"""
        periodo = request.query_params.get('periodo', '30')
        dias = int(periodo)
        data_inicio = timezone.now() - timedelta(days=dias)
        
        # Relatórios no período
        relatorios_periodo = Relatorio.objects.filter(
            data_solicitacao__gte=data_inicio
        )
        
        # Relatórios por mês
        relatorios_por_mes = []
        for i in range(dias):
            data = timezone.now() - timedelta(days=i)
            count = Relatorio.objects.filter(
                data_solicitacao__date=data.date()
            ).count()
            relatorios_por_mes.append({
                'data': data.date().isoformat(),
                'total': count
            })
        
        # Usuários mais ativos
        usuarios_mais_ativos = Relatorio.objects.filter(
            data_solicitacao__gte=data_inicio
        ).values('solicitado_por__username').annotate(
            total=Count('id')
        ).order_by('-total')[:10]
        
        # Tipos mais utilizados
        tipos_mais_utilizados = Relatorio.objects.filter(
            data_solicitacao__gte=data_inicio
        ).values('tipo_relatorio__nome').annotate(
            total=Count('id')
        ).order_by('-total')[:10]
        
        data = {
            'periodo': f'{dias} dias',
            'total_relatorios': relatorios_periodo.count(),
            'relatorios_por_mes': relatorios_por_mes,
            'usuarios_mais_ativos': list(usuarios_mais_ativos),
            'tipos_mais_utilizados': list(tipos_mais_utilizados),
        }
        
        serializer = RelatorioStatsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar relatório"""
        relatorio = self.get_object()
        
        if relatorio.status not in ['PENDENTE', 'PROCESSANDO']:
            return Response(
                {'error': 'Relatório não pode ser cancelado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CancelarRelatorioSerializer(data=request.data)
        if serializer.is_valid():
            relatorio.status = 'CANCELADO'
            relatorio.erro_mensagem = serializer.validated_data.get('motivo', 'Cancelado pelo usuário')
            relatorio.save()
            
            # Registrar no histórico
            HistoricoRelatorio.objects.create(
                relatorio=relatorio,
                usuario=request.user,
                status='CANCELADO',
                ip_origem=request.META.get('REMOTE_ADDR', '')
            )
            
            return Response({'message': 'Relatório cancelado com sucesso'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def compartilhar(self, request, pk=None):
        """Compartilhar relatório"""
        relatorio = self.get_object()
        
        serializer = CompartilharRelatorioSerializer(data=request.data)
        if serializer.is_valid():
            usuarios = serializer.validated_data['usuarios']
            
            for user_id in usuarios:
                RelatorioCompartilhado.objects.create(
                    relatorio=relatorio,
                    compartilhado_por=request.user,
                    compartilhado_com_id=user_id,
                    pode_visualizar=serializer.validated_data['pode_visualizar'],
                    pode_baixar=serializer.validated_data['pode_baixar'],
                    pode_compartilhar=serializer.validated_data['pode_compartilhar'],
                    data_expiracao=serializer.validated_data.get('data_expiracao'),
                    ativo=True
                )
            
            return Response({'message': f'Relatório compartilhado com {len(usuarios)} usuário(s)'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download do relatório"""
        relatorio = self.get_object()
        
        if not relatorio.arquivo:
            return Response(
                {'error': 'Arquivo não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar permissões
        if relatorio.solicitado_por != request.user:
            compartilhamento = RelatorioCompartilhado.objects.filter(
                relatorio=relatorio,
                compartilhado_com=request.user,
                ativo=True,
                pode_baixar=True
            ).first()
            
            if not compartilhamento:
                return Response(
                    {'error': 'Sem permissão para baixar este relatório'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Registrar download no histórico
        HistoricoRelatorio.objects.create(
            relatorio=relatorio,
            usuario=request.user,
            status='DOWNLOAD',
            ip_origem=request.META.get('REMOTE_ADDR', '')
        )
        
        response = HttpResponse(relatorio.arquivo, content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{relatorio.nome_arquivo}"'
        return response


class RelatorioAgendadoViewSet(viewsets.ModelViewSet):
    """ViewSet para relatórios agendados"""
    queryset = RelatorioAgendado.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_relatorio', 'frequencia', 'status', 'ativo', 'criado_por']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['proxima_execucao', 'data_criacao']
    ordering = ['proxima_execucao']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return RelatorioAgendado.objects.select_related(
            'tipo_relatorio', 'criado_por'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RelatorioAgendadoCreateSerializer
        return RelatorioAgendadoSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def ativar(self, request, pk=None):
        """Ativar agendamento"""
        agendamento = self.get_object()
        agendamento.ativo = True
        agendamento.save()
        return Response({'message': 'Agendamento ativado'})
    
    @action(detail=True, methods=['post'])
    def desativar(self, request, pk=None):
        """Desativar agendamento"""
        agendamento = self.get_object()
        agendamento.ativo = False
        agendamento.save()
        return Response({'message': 'Agendamento desativado'})
    
    @action(detail=True, methods=['post'])
    def executar_agora(self, request, pk=None):
        """Executar agendamento imediatamente"""
        agendamento = self.get_object()
        
        # Criar relatório baseado no agendamento
        relatorio = Relatorio.objects.create(
            titulo=f"{agendamento.nome} - Execução Manual",
            descricao=agendamento.descricao,
            tipo_relatorio=agendamento.tipo_relatorio,
            parametros=agendamento.parametros,
            filtros=agendamento.filtros,
            formato=agendamento.formato,
            solicitado_por=request.user,
            status='PENDENTE'
        )
        
        # Atualizar última execução
        agendamento.ultima_execucao = timezone.now()
        agendamento.save()
        
        return Response({
            'message': 'Relatório criado e enviado para processamento',
            'relatorio_id': relatorio.id
        })


class TemplateRelatorioViewSet(viewsets.ModelViewSet):
    """ViewSet para templates de relatórios"""
    queryset = TemplateRelatorio.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_relatorio', 'ativo', 'padrao', 'criado_por']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
    ordering = ['nome']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return TemplateRelatorio.objects.select_related(
            'tipo_relatorio', 'criado_por'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TemplateRelatorioCreateSerializer
        return TemplateRelatorioSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def definir_padrao(self, request, pk=None):
        """Definir template como padrão"""
        template = self.get_object()
        
        # Remover padrão de outros templates do mesmo tipo
        TemplateRelatorio.objects.filter(
            tipo_relatorio=template.tipo_relatorio,
            padrao=True
        ).update(padrao=False)
        
        # Definir este como padrão
        template.padrao = True
        template.save()
        
        return Response({'message': 'Template definido como padrão'})


class FiltroRelatorioViewSet(viewsets.ModelViewSet):
    """ViewSet para filtros de relatórios"""
    queryset = FiltroRelatorio.objects.all()
    serializer_class = FiltroRelatorioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_relatorio', 'tipo_filtro', 'obrigatorio', 'ativo']
    search_fields = ['nome', 'descricao', 'campo']
    ordering_fields = ['nome', 'ordem']
    ordering = ['tipo_relatorio', 'ordem']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return FiltroRelatorio.objects.select_related('tipo_relatorio')


class RelatorioCompartilhadoViewSet(viewsets.ModelViewSet):
    """ViewSet para relatórios compartilhados"""
    queryset = RelatorioCompartilhado.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['relatorio', 'compartilhado_por', 'compartilhado_com', 'ativo']
    search_fields = ['relatorio__titulo']
    ordering_fields = ['data_compartilhamento']
    ordering = ['-data_compartilhamento']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return RelatorioCompartilhado.objects.select_related(
            'relatorio', 'compartilhado_por', 'compartilhado_com'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RelatorioCompartilhadoCreateSerializer
        return RelatorioCompartilhadoSerializer
    
    def perform_create(self, serializer):
        serializer.save(compartilhado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def revogar(self, request, pk=None):
        """Revogar compartilhamento"""
        compartilhamento = self.get_object()
        compartilhamento.ativo = False
        compartilhamento.save()
        return Response({'message': 'Compartilhamento revogado'})


class HistoricoRelatorioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para histórico de relatórios"""
    queryset = HistoricoRelatorio.objects.all()
    serializer_class = HistoricoRelatorioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['relatorio', 'usuario', 'status']
    search_fields = ['relatorio__titulo', 'usuario__username']
    ordering_fields = ['data_execucao']
    ordering = ['-data_execucao']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return HistoricoRelatorio.objects.select_related(
            'relatorio', 'usuario'
        )


class ConfiguracaoRelatorioViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações de relatórios"""
    queryset = ConfiguracaoRelatorio.objects.all()
    serializer_class = ConfiguracaoRelatorioSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(configurado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(configurado_por=self.request.user)


# === FUNÇÕES UTILITÁRIAS ===

def executar_relatorio_async(tipo_relatorio_id, parametros, filtros, formato, solicitado_por):
    """Executar relatório de forma assíncrona"""
    try:
        tipo_relatorio = TipoRelatorio.objects.get(id=tipo_relatorio_id)
        
        # Aqui você implementaria a lógica específica de cada tipo de relatório
        # Por enquanto, vamos simular o processamento
        
        relatorio = Relatorio.objects.create(
            titulo=f"Relatório {tipo_relatorio.nome}",
            tipo_relatorio=tipo_relatorio,
            parametros=parametros,
            filtros=filtros,
            formato=formato,
            solicitado_por=solicitado_por,
            status='PROCESSANDO'
        )
        
        # Simular processamento
        import time
        time.sleep(2)  # Simular tempo de processamento
        
        # Atualizar relatório como concluído
        relatorio.status = 'CONCLUIDO'
        relatorio.progresso = 100
        relatorio.data_conclusao = timezone.now()
        relatorio.tempo_processamento = 2.0
        relatorio.registros_processados = 150
        relatorio.save()
        
        # Registrar no histórico
        HistoricoRelatorio.objects.create(
            relatorio=relatorio,
            usuario=solicitado_por,
            status='CONCLUIDO',
            tempo_processamento=2.0,
            registros_processados=150,
            ip_origem='127.0.0.1'
        )
        
        return relatorio
        
    except Exception as e:
        if 'relatorio' in locals():
            relatorio.status = 'ERRO'
            relatorio.erro_mensagem = str(e)
            relatorio.save()
        
        raise e


def verificar_agendamentos():
    """Verificar e executar agendamentos pendentes"""
    agora = timezone.now()
    agendamentos = RelatorioAgendado.objects.filter(
        ativo=True,
        proxima_execucao__lte=agora
    )
    
    for agendamento in agendamentos:
        try:
            # Executar relatório
            executar_relatorio_async(
                agendamento.tipo_relatorio.id,
                agendamento.parametros,
                agendamento.filtros,
                agendamento.formato,
                agendamento.criado_por
            )
            
            # Calcular próxima execução
            if agendamento.frequencia == 'DIARIO':
                proxima = agora + timedelta(days=1)
            elif agendamento.frequencia == 'SEMANAL':
                proxima = agora + timedelta(weeks=1)
            elif agendamento.frequencia == 'MENSAL':
                proxima = agora + timedelta(days=30)
            else:
                proxima = None
            
            # Atualizar agendamento
            agendamento.ultima_execucao = agora
            agendamento.proxima_execucao = proxima
            agendamento.save()
            
        except Exception as e:
            # Registrar erro
            agendamento.status = 'ERRO'
            agendamento.save()
            print(f"Erro ao executar agendamento {agendamento.id}: {e}")
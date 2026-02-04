from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    Boleto, Pagamento, Remessa, TipoBoleto, Banco, 
    Processo, DocumentoBoleto, HistoricoBoleto
)
from .serializers import (
    BoletoSerializer, BoletoCreateSerializer, PagamentoSerializer, 
    RemessaSerializer, TipoBoletoSerializer, BancoSerializer,
    DashboardSerializer, BoletosPorStatusSerializer, 
    PagamentosPorMesSerializer, RemessasPorStatusSerializer
)
from .permissions import BoletoPermission, PagamentoPermission, RemessaPermission


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class BoletoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de boletos
    """
    queryset = Boleto.objects.all().order_by('-data_criacao')
    serializer_class = BoletoSerializer
    permission_classes = [BoletoPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo', 'banco', 'processo']
    search_fields = ['numero', 'devedor', 'documento', 'descricao']
    ordering_fields = ['numero', 'devedor', 'valor', 'vencimento', 'data_criacao']
    ordering = ['-data_criacao']

    def get_serializer_class(self):
        if self.action == 'create':
            return BoletoCreateSerializer
        return BoletoSerializer

    def perform_create(self, serializer):
        serializer.save(usuario_criacao=self.request.user)

    def perform_update(self, serializer):
        serializer.save(usuario_atualizacao=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Estatísticas do dashboard
        """
        hoje = timezone.now().date()
        ontem = hoje - timedelta(days=1)
        
        # Total em aberto
        total_em_aberto = Boleto.objects.filter(
            status__in=['pendente', 'vencido']
        ).aggregate(total=Sum('valor'))['total'] or 0
        
        # Recebido hoje
        recebido_hoje = Pagamento.objects.filter(
            data_pagamento__date=hoje
        ).aggregate(total=Sum('valor_pago'))['total'] or 0
        
        # Boletos vencidos
        boletos_vencidos = Boleto.objects.filter(
            status='vencido'
        ).count()
        
        # Taxa de pagamento
        total_boletos = Boleto.objects.count()
        boletos_pagos = Boleto.objects.filter(status='pago').count()
        taxa_pagamento = (boletos_pagos / total_boletos * 100) if total_boletos > 0 else 0
        
        # Variações (comparação com ontem)
        total_em_aberto_ontem = Boleto.objects.filter(
            status__in=['pendente', 'vencido'],
            data_criacao__date__lt=hoje
        ).aggregate(total=Sum('valor'))['total'] or 0
        
        recebido_ontem = Pagamento.objects.filter(
            data_pagamento__date=ontem
        ).aggregate(total=Sum('valor_pago'))['total'] or 0
        
        boletos_vencidos_ontem = Boleto.objects.filter(
            status='vencido',
            data_criacao__date__lt=hoje
        ).count()
        
        variacao_em_aberto = ((total_em_aberto - total_em_aberto_ontem) / total_em_aberto_ontem * 100) if total_em_aberto_ontem > 0 else 0
        variacao_recebido = ((recebido_hoje - recebido_ontem) / recebido_ontem * 100) if recebido_ontem > 0 else 0
        variacao_vencidos = boletos_vencidos - boletos_vencidos_ontem
        
        data = {
            'total_em_aberto': total_em_aberto,
            'recebido_hoje': recebido_hoje,
            'boletos_vencidos': boletos_vencidos,
            'taxa_pagamento': taxa_pagamento,
            'variacao_em_aberto': variacao_em_aberto,
            'variacao_recebido': variacao_recebido,
            'variacao_vencidos': variacao_vencidos,
            'variacao_taxa': 0  # Implementar cálculo se necessário
        }
        
        serializer = DashboardSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def boletos_por_status(self, request):
        """
        Boletos agrupados por status
        """
        total_boletos = Boleto.objects.count()
        
        status_counts = Boleto.objects.values('status').annotate(
            quantidade=Count('id')
        ).order_by('status')
        
        data = []
        for item in status_counts:
            percentual = (item['quantidade'] / total_boletos * 100) if total_boletos > 0 else 0
            data.append({
                'status': item['status'],
                'quantidade': item['quantidade'],
                'percentual': percentual
            })
        
        serializer = BoletosPorStatusSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def boletos_vencidos(self, request):
        """
        Lista de boletos vencidos
        """
        boletos = Boleto.objects.filter(status='vencido').order_by('vencimento')
        serializer = self.get_serializer(boletos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def boletos_recentes(self, request):
        """
        Boletos criados recentemente
        """
        boletos = Boleto.objects.all().order_by('-data_criacao')[:10]
        serializer = self.get_serializer(boletos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def alterar_status(self, request, pk=None):
        """
        Alterar status de um boleto
        """
        boleto = self.get_object()
        novo_status = request.data.get('status')
        
        if novo_status not in ['pendente', 'pago', 'vencido', 'cancelado']:
            return Response(
                {'error': 'Status inválido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        boleto.status = novo_status
        boleto.usuario_atualizacao = request.user
        boleto.save()
        
        # Registrar no histórico
        HistoricoBoleto.objects.create(
            boleto=boleto,
            acao='alteracao_status',
            descricao=f'Status alterado para {novo_status}',
            usuario=request.user
        )
        
        serializer = self.get_serializer(boleto)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def anexar_documento(self, request, pk=None):
        """
        Anexar documento ao boleto
        """
        boleto = self.get_object()
        arquivo = request.FILES.get('arquivo')
        nome = request.data.get('nome', arquivo.name if arquivo else '')
        
        if not arquivo:
            return Response(
                {'error': 'Arquivo é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documento = DocumentoBoleto.objects.create(
            boleto=boleto,
            nome=nome,
            arquivo=arquivo,
            tipo=arquivo.content_type
        )
        
        return Response({'id': documento.id, 'nome': documento.nome})


class PagamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de pagamentos
    """
    queryset = Pagamento.objects.all().order_by('-data_criacao')
    serializer_class = PagamentoSerializer
    permission_classes = [PagamentoPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['forma_pagamento', 'data_pagamento']
    search_fields = ['numero_boleto', 'observacoes']
    ordering_fields = ['data_pagamento', 'valor_pago', 'data_criacao']
    ordering = ['-data_criacao']

    def perform_create(self, serializer):
        pagamento = serializer.save(usuario_criacao=self.request.user)
        
        # Atualizar status do boleto
        boleto = pagamento.boleto
        boleto.status = 'pago'
        boleto.usuario_atualizacao = self.request.user
        boleto.save()
        
        # Registrar no histórico
        HistoricoBoleto.objects.create(
            boleto=boleto,
            acao='pagamento_registrado',
            descricao=f'Pagamento de R$ {pagamento.valor_pago} registrado',
            usuario=self.request.user
        )

    @action(detail=False, methods=['get'])
    def pagamentos_recentes(self, request):
        """
        Pagamentos realizados recentemente
        """
        pagamentos = Pagamento.objects.all().order_by('-data_criacao')[:10]
        serializer = self.get_serializer(pagamentos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pagamentos_por_mes(self, request):
        """
        Pagamentos agrupados por mês
        """
        pagamentos = Pagamento.objects.extra(
            select={'mes': "strftime('%%Y-%%m', data_pagamento)"}
        ).values('mes').annotate(
            valor=Sum('valor_pago'),
            quantidade=Count('id')
        ).order_by('-mes')[:12]
        
        data = []
        for item in pagamentos:
            data.append({
                'mes': item['mes'],
                'valor': item['valor'],
                'quantidade': item['quantidade']
            })
        
        serializer = PagamentosPorMesSerializer(data, many=True)
        return Response(serializer.data)


class RemessaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de remessas
    """
    queryset = Remessa.objects.all().order_by('-data_criacao')
    serializer_class = RemessaSerializer
    permission_classes = [RemessaPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['banco', 'status']
    search_fields = ['numero', 'observacoes']
    ordering_fields = ['data_geracao', 'data_envio', 'data_criacao']
    ordering = ['-data_criacao']

    def perform_create(self, serializer):
        serializer.save(usuario_criacao=self.request.user)

    @action(detail=False, methods=['get'])
    def remessas_recentes(self, request):
        """
        Remessas geradas recentemente
        """
        remessas = Remessa.objects.all().order_by('-data_criacao')[:10]
        serializer = self.get_serializer(remessas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def remessas_por_status(self, request):
        """
        Remessas agrupadas por status
        """
        total_remessas = Remessa.objects.count()
        
        status_counts = Remessa.objects.values('status').annotate(
            quantidade=Count('id')
        ).order_by('status')
        
        data = []
        for item in status_counts:
            percentual = (item['quantidade'] / total_remessas * 100) if total_remessas > 0 else 0
            data.append({
                'status': item['status'],
                'quantidade': item['quantidade'],
                'percentual': percentual
            })
        
        serializer = RemessasPorStatusSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def gerar_remessa(self, request, pk=None):
        """
        Gerar arquivo de remessa
        """
        remessa = self.get_object()
        
        # Aqui você implementaria a lógica para gerar o arquivo de remessa
        # Por enquanto, apenas simular
        
        remessa.status = 'gerada'
        remessa.data_geracao = timezone.now()
        remessa.save()
        
        serializer = self.get_serializer(remessa)
        return Response(serializer.data)


class TipoBoletoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para tipos de boleto (somente leitura)
    """
    queryset = TipoBoleto.objects.all()
    serializer_class = TipoBoletoSerializer
    permission_classes = [BoletoPermission]


class BancoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para bancos (somente leitura)
    """
    queryset = Banco.objects.all()
    serializer_class = BancoSerializer
    permission_classes = [BoletoPermission]


class CobrancaViewSet(viewsets.ViewSet):
    """
    ViewSet para funcionalidades gerais de cobrança
    """
    permission_classes = [BoletoPermission]

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """
        Estatísticas gerais de cobrança
        """
        hoje = timezone.now().date()
        
        # Estatísticas básicas
        total_boletos = Boleto.objects.count()
        boletos_pendentes = Boleto.objects.filter(status='pendente').count()
        boletos_pagos = Boleto.objects.filter(status='pago').count()
        boletos_vencidos = Boleto.objects.filter(status='vencido').count()
        
        # Valores
        valor_total = Boleto.objects.aggregate(total=Sum('valor'))['total'] or 0
        valor_pendente = Boleto.objects.filter(status='pendente').aggregate(total=Sum('valor'))['total'] or 0
        valor_pago = Boleto.objects.filter(status='pago').aggregate(total=Sum('valor'))['total'] or 0
        
        # Pagamentos hoje
        pagamentos_hoje = Pagamento.objects.filter(data_pagamento__date=hoje).count()
        valor_hoje = Pagamento.objects.filter(data_pagamento__date=hoje).aggregate(total=Sum('valor_pago'))['total'] or 0
        
        data = {
            'total_boletos': total_boletos,
            'boletos_pendentes': boletos_pendentes,
            'boletos_pagos': boletos_pagos,
            'boletos_vencidos': boletos_vencidos,
            'valor_total': valor_total,
            'valor_pendente': valor_pendente,
            'valor_pago': valor_pago,
            'pagamentos_hoje': pagamentos_hoje,
            'valor_hoje': valor_hoje
        }
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def processos(self, request):
        """
        Lista de processos para seleção
        """
        processos = Processo.objects.filter(status='ativo').values('id', 'numero', 'empresa')
        return Response(processos)

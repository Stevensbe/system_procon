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
    BoletoMulta, PagamentoMulta, CobrancaMulta, ConfiguracaoCobranca,
    TemplateCobranca, LogCobranca, Remessa, Banco
)
from .serializers import (
    BoletoMultaSerializer, BoletoMultaCreateSerializer, PagamentoMultaSerializer, 
    CobrancaMultaSerializer, ConfiguracaoCobrancaSerializer, TemplateCobrancaSerializer,
    DashboardSerializer, BoletosPorStatusSerializer, 
    PagamentosPorMesSerializer, CobrancasPorStatusSerializer,
    RemessaSerializer, RemessaCreateSerializer, RemessasPorStatusSerializer, BancoSerializer
)
from .permissions import BoletoPermission, PagamentoPermission, RemessaPermission


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class BoletoMultaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de boletos de multa
    """
    queryset = BoletoMulta.objects.all()
    serializer_class = BoletoMultaSerializer
    permission_classes = [BoletoPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'data_vencimento']
    search_fields = ['numero_boleto', 'pagador_nome', 'pagador_documento']
    ordering_fields = ['numero_boleto', 'pagador_nome', 'valor_total', 'data_vencimento', 'criado_em']
    ordering = ['-criado_em']

    def get_serializer_class(self):
        if self.action == 'create':
            return BoletoMultaCreateSerializer
        return BoletoMultaSerializer

    def perform_create(self, serializer):
        serializer.save(usuario_criacao=self.request.user)

    def perform_update(self, serializer):
        serializer.save(usuario_atualizacao=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Estatísticas do dashboard de boletos"""
        hoje = timezone.now().date()
        ontem = hoje - timedelta(days=1)
        
        # Dados atuais
        total_em_aberto = BoletoMulta.objects.filter(status='pendente').aggregate(
            total=Sum('valor_total'))['total'] or 0
        
        recebido_hoje = PagamentoMulta.objects.filter(
            data_pagamento=hoje
        ).aggregate(total=Sum('valor_pago'))['total'] or 0
        
        boletos_vencidos = BoletoMulta.objects.filter(
            status='pendente', data_vencimento__lt=hoje
        ).count()
        
        total_boletos = BoletoMulta.objects.count()
        boletos_pagos = BoletoMulta.objects.filter(status='pago').count()
        taxa_pagamento = (boletos_pagos / total_boletos * 100) if total_boletos > 0 else 0
        
        # Variações (comparação com ontem)
        em_aberto_ontem = BoletoMulta.objects.filter(
            status='pendente', 
            criado_em__date__lt=hoje
        ).aggregate(total=Sum('valor_total'))['total'] or 0
        
        recebido_ontem = PagamentoMulta.objects.filter(
            data_pagamento=ontem
        ).aggregate(total=Sum('valor_pago'))['total'] or 0
        
        boletos_vencidos_ontem = BoletoMulta.objects.filter(
            status='pendente', 
            data_vencimento__lt=ontem
        ).count()
        
        variacao_em_aberto = ((total_em_aberto - em_aberto_ontem) / em_aberto_ontem * 100) if em_aberto_ontem > 0 else 0
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
        """Boletos agrupados por status"""
        status_counts = BoletoMulta.objects.values('status').annotate(
            quantidade=Count('id')
        ).order_by('status')
        
        total = BoletoMulta.objects.count()
        
        data = []
        for item in status_counts:
            percentual = (item['quantidade'] / total * 100) if total > 0 else 0
            data.append({
                'status': item['status'],
                'quantidade': item['quantidade'],
                'percentual': round(percentual, 2)
            })
        
        serializer = BoletosPorStatusSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def boletos_vencidos(self, request):
        """Lista de boletos vencidos"""
        hoje = timezone.now().date()
        boletos = BoletoMulta.objects.filter(
            status='pendente', 
            data_vencimento__lt=hoje
        ).order_by('data_vencimento')
        
        page = self.paginate_queryset(boletos)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(boletos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def boletos_recentes(self, request):
        """Boletos criados recentemente"""
        boletos = BoletoMulta.objects.filter(
            criado_em__date=timezone.now().date()
        ).order_by('-criado_em')[:10]
        
        serializer = self.get_serializer(boletos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def alterar_status(self, request, pk=None):
        """Altera o status de um boleto"""
        boleto = self.get_object()
        novo_status = request.data.get('status')
        
        if novo_status not in ['pendente', 'pago', 'vencido', 'cancelado']:
            return Response(
                {'error': 'Status inválido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        boleto.status = novo_status
        boleto.save()
        
        # Registrar no log
        LogCobranca.objects.create(
            acao='alterar_status',
            descricao=f'Status do boleto {boleto.numero_boleto} alterado para {novo_status}',
            usuario=request.user
        )
        
        serializer = self.get_serializer(boleto)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def anexar_documento(self, request, pk=None):
        """Anexa um documento ao boleto"""
        boleto = self.get_object()
        arquivo = request.FILES.get('arquivo')
        nome = request.data.get('nome', 'Documento')
        
        if not arquivo:
            return Response(
                {'error': 'Arquivo não fornecido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Aqui você implementaria a lógica para anexar documento
        # Por enquanto, apenas registrar no log
        LogCobranca.objects.create(
            acao='anexar_documento',
            descricao=f'Documento "{nome}" anexado ao boleto {boleto.numero_boleto}',
            usuario=request.user
        )
        
        return Response({'message': 'Documento anexado com sucesso'})


class PagamentoMultaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de pagamentos de multa
    """
    queryset = PagamentoMulta.objects.all()
    serializer_class = PagamentoMultaSerializer
    permission_classes = [PagamentoPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['forma_pagamento', 'data_pagamento']
    search_fields = ['boleto__numero_boleto']
    ordering_fields = ['data_pagamento', 'valor_pago']
    ordering = ['-data_pagamento']

    def perform_create(self, serializer):
        pagamento = serializer.save()
        
        # Atualizar status do boleto
        boleto = pagamento.boleto
        boleto.status = 'pago'
        boleto.save()
        
        # Registrar no log
        LogCobranca.objects.create(
            acao='pagamento_registrado',
            descricao=f'Pagamento registrado: R$ {pagamento.valor_pago} para boleto {boleto.numero_boleto}',
            usuario=self.request.user
        )

    @action(detail=False, methods=['get'])
    def pagamentos_recentes(self, request):
        """Pagamentos realizados recentemente"""
        pagamentos = PagamentoMulta.objects.filter(
            data_pagamento=timezone.now().date()
        ).order_by('-criado_em')[:10]
        
        serializer = self.get_serializer(pagamentos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pagamentos_por_mes(self, request):
        """Pagamentos agrupados por mês"""
        pagamentos = PagamentoMulta.objects.extra(
            select={'mes': "strftime('%Y-%m', data_pagamento)"}
        ).values('mes').annotate(
            valor=Sum('valor_pago'),
            quantidade=Count('id')
        ).order_by('-mes')[:12]
        
        serializer = PagamentosPorMesSerializer(pagamentos, many=True)
        return Response(serializer.data)


class CobrancaMultaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de cobranças de multa
    """
    queryset = CobrancaMulta.objects.all()
    serializer_class = CobrancaMultaSerializer
    permission_classes = [RemessaPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo_cobranca']
    search_fields = ['numero']
    ordering_fields = ['data_cobranca', 'data_envio']
    ordering = ['-criado_em']

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def cobrancas_recentes(self, request):
        """Cobranças geradas recentemente"""
        cobrancas = CobrancaMulta.objects.filter(
            criado_em__date=timezone.now().date()
        ).order_by('-criado_em')[:10]
        
        serializer = self.get_serializer(cobrancas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def cobrancas_por_status(self, request):
        """Cobranças agrupadas por status"""
        status_counts = CobrancaMulta.objects.values('status').annotate(
            quantidade=Count('id')
        ).order_by('status')
        
        total = CobrancaMulta.objects.count()
        
        data = []
        for item in status_counts:
            percentual = (item['quantidade'] / total * 100) if total > 0 else 0
            data.append({
                'status': item['status'],
                'quantidade': item['quantidade'],
                'percentual': round(percentual, 2)
            })
        
        serializer = CobrancasPorStatusSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def gerar_cobranca(self, request, pk=None):
        """Gera a cobrança"""
        cobranca = self.get_object()
        
        # Aqui você implementaria a lógica para gerar a cobrança
        # Por enquanto, apenas simular
        cobranca.status = 'gerada'
        cobranca.save()
        
        return Response({'message': 'Cobrança gerada com sucesso'})


class ConfiguracaoCobrancaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para configurações de cobrança (somente leitura)
    """
    queryset = ConfiguracaoCobranca.objects.all()
    serializer_class = ConfiguracaoCobrancaSerializer
    permission_classes = [BoletoPermission]


class TemplateCobrancaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para templates de cobrança (somente leitura)
    """
    queryset = TemplateCobranca.objects.all()
    serializer_class = TemplateCobrancaSerializer
    permission_classes = [BoletoPermission]


class CobrancaViewSet(viewsets.ViewSet):
    """
    ViewSet para funcionalidades gerais de cobrança
    """
    permission_classes = [BoletoPermission]

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Estatísticas gerais de cobrança"""
        hoje = timezone.now().date()
        
        # Estatísticas de boletos
        total_boletos = BoletoMulta.objects.count()
        boletos_pendentes = BoletoMulta.objects.filter(status='pendente').count()
        boletos_pagos = BoletoMulta.objects.filter(status='pago').count()
        boletos_vencidos = BoletoMulta.objects.filter(
            status='pendente', data_vencimento__lt=hoje
        ).count()
        
        # Valores
        valor_total = BoletoMulta.objects.aggregate(
            total=Sum('valor_total'))['total'] or 0
        valor_pendente = BoletoMulta.objects.filter(
            status='pendente').aggregate(
            total=Sum('valor_total'))['total'] or 0
        valor_pago = BoletoMulta.objects.filter(
            status='pago').aggregate(
            total=Sum('valor_total'))['total'] or 0
        
        # Pagamentos de hoje
        pagamentos_hoje = PagamentoMulta.objects.filter(
            data_pagamento=hoje).count()
        valor_hoje = PagamentoMulta.objects.filter(
            data_pagamento=hoje).aggregate(
            total=Sum('valor_pago'))['total'] or 0
        
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
        """Lista processos ativos para seleção"""
        # Aqui você implementaria a busca de processos
        # Por enquanto, retornar dados simulados
        processos = [
            {
                'id': 1,
                'numero': '2025-001234',
                'empresa': 'Empresa Teste LTDA',
                'status': 'ativo'
            }
        ]
        
        return Response(processos)


class RemessaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de remessas bancárias
    """
    queryset = Remessa.objects.all().order_by('-criado_em')
    serializer_class = RemessaSerializer
    permission_classes = [RemessaPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['banco', 'status', 'tipo']
    search_fields = ['numero', 'observacoes']
    ordering_fields = ['data_geracao', 'data_envio', 'criado_em']
    ordering = ['-criado_em']

    def get_serializer_class(self):
        if self.action == 'create':
            return RemessaCreateSerializer
        return RemessaSerializer

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user.username)

    @action(detail=False, methods=['get'])
    def remessas_recentes(self, request):
        """
        Remessas geradas recentemente
        """
        remessas = Remessa.objects.all().order_by('-criado_em')[:10]
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
                'percentual': round(percentual, 2)
            })
        
        serializer = RemessasPorStatusSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def gerar_remessa(self, request, pk=None):
        """
        Gerar arquivo de remessa CNAB
        """
        try:
            remessa = self.get_object()
            
            # Gerar arquivo de remessa
            arquivo_path = remessa.gerar_arquivo_remessa()
            
            # Atualizar status
            remessa.status = 'gerado'
            remessa.data_geracao = timezone.now()
            remessa.save()
            
            serializer = self.get_serializer(remessa)
            return Response({
                'message': 'Remessa gerada com sucesso',
                'arquivo': arquivo_path,
                'remessa': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def processar_retorno(self, request, pk=None):
        """
        Processar arquivo de retorno
        """
        try:
            remessa = self.get_object()
            
            # Aqui você implementaria o upload e processamento do arquivo de retorno
            # Por enquanto, apenas simular
            
            remessa.status = 'processado'
            remessa.data_processamento = timezone.now()
            remessa.save()
            
            serializer = self.get_serializer(remessa)
            return Response({
                'message': 'Retorno processado com sucesso',
                'remessa': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class BancoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para bancos (somente leitura)
    """
    queryset = Banco.objects.filter(ativo=True)
    serializer_class = BancoSerializer
    permission_classes = [RemessaPermission]

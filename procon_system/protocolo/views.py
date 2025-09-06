from django.views import generic
from django.urls import reverse_lazy
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta

# DRF imports
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

# Models
from .models import (
    TipoProtocolo, StatusProtocolo, Protocolo, DocumentoProtocolo,
    TramitacaoProtocolo, AlertaProtocolo
)

# Serializers
from .serializers import (
    TipoProtocoloSerializer, StatusProtocoloSerializer,
    ProtocoloListSerializer, ProtocoloDetailSerializer, ProtocoloCreateSerializer,
    DocumentoProtocoloListSerializer, DocumentoProtocoloDetailSerializer, DocumentoProtocoloCreateSerializer,
    TramitacaoProtocoloListSerializer, TramitacaoProtocoloCreateSerializer,
    AlertaProtocoloListSerializer, AlertaProtocoloDetailSerializer, AlertaProtocoloCreateSerializer,
    DashboardProtocoloSerializer, ProtocoloStatsSerializer,
    TramitarProtocoloSerializer, ConcluirProtocoloSerializer, MarcarAlertaLidoSerializer
)

# Services
from .services import (
    ocr_service, indexing_service, digitization_service, quality_service
)


# Template Views (mantidas para compatibilidade)
class ProtocoloList(generic.ListView):
    model = Protocolo
    template_name = 'protocolo/protocolo_list.html'
    context_object_name = 'protocolos'

class ProtocoloCreate(generic.CreateView):
    model = Protocolo
    fields = ['numero', 'assunto']
    template_name = 'protocolo/protocolo_form.html'
    success_url = reverse_lazy('protocolo:listar_protocolo')

class ProtocoloUpdate(generic.UpdateView):
    model = Protocolo
    fields = ['numero', 'assunto']
    template_name = 'protocolo/protocolo_form.html'
    success_url = reverse_lazy('protocolo:listar_protocolo')

class ProtocoloDelete(generic.DeleteView):
    model = Protocolo
    template_name = 'protocolo/protocolo_confirm_delete.html'
    success_url = reverse_lazy('protocolo:listar_protocolo')


# Template Views para novas funcionalidades
@method_decorator(login_required, name='dispatch')
class ProtocoloDashboardView(generic.TemplateView):
    template_name = 'protocolo/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['total_protocolos'] = Protocolo.objects.count()
        context['protocolos_abertos'] = Protocolo.objects.filter(ativo=True).count()
        context['protocolos_atrasados'] = Protocolo.objects.filter(ativo=True, data_limite__lt=timezone.now()).count()
        return context


@method_decorator(login_required, name='dispatch')
class ProtocoloDocumentosView(generic.DetailView):
    model = Protocolo
    template_name = 'protocolo/documentos.html'
    context_object_name = 'protocolo'


@method_decorator(login_required, name='dispatch')
class ProtocoloTramitacaoView(generic.DetailView):
    model = Protocolo
    template_name = 'protocolo/tramitacao.html'
    context_object_name = 'protocolo'


# DRF ViewSets
class TipoProtocoloViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de protocolo"""
    queryset = TipoProtocolo.objects.all()
    serializer_class = TipoProtocoloSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
    ordering = ['nome']
    pagination_class = PageNumberPagination


class StatusProtocoloViewSet(viewsets.ModelViewSet):
    """ViewSet para status de protocolo"""
    queryset = StatusProtocolo.objects.all()
    serializer_class = StatusProtocoloSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'ordem']
    ordering = ['ordem']
    pagination_class = PageNumberPagination


class ProtocoloViewSet(viewsets.ModelViewSet):
    """ViewSet para protocolos"""
    queryset = Protocolo.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_protocolo', 'status', 'prioridade', 'responsavel_atual', 'ativo']
    search_fields = ['numero', 'assunto', 'descricao']
    ordering_fields = ['data_abertura', 'data_limite', 'numero', 'assunto']
    ordering = ['-data_abertura']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return Protocolo.objects.select_related(
            'tipo_protocolo', 'status', 'responsavel_atual', 'criado_por'
        ).prefetch_related('documentos', 'tramitacoes', 'alertas')

    def get_serializer_class(self):
        if self.action == 'list':
            return ProtocoloListSerializer
        elif self.action == 'create':
            return ProtocoloCreateSerializer
        return ProtocoloDetailSerializer

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard com estatísticas de protocolos"""
        # Estatísticas básicas
        total_protocolos = Protocolo.objects.count()
        protocolos_abertos = Protocolo.objects.filter(ativo=True).count()
        protocolos_concluidos = Protocolo.objects.filter(data_conclusao__isnull=False).count()
        protocolos_atrasados = Protocolo.objects.filter(
            ativo=True, 
            data_limite__lt=timezone.now(),
            data_conclusao__isnull=True
        ).count()
        protocolos_urgentes = Protocolo.objects.filter(prioridade='URGENTE', ativo=True).count()

        # Protocolos por tipo
        protocolos_por_tipo = {}
        for tipo in TipoProtocolo.objects.all():
            count = Protocolo.objects.filter(tipo_protocolo=tipo).count()
            protocolos_por_tipo[tipo.nome] = count

        # Protocolos por status
        protocolos_por_status = {}
        for status in StatusProtocolo.objects.all():
            count = Protocolo.objects.filter(status=status).count()
            protocolos_por_status[status.nome] = count

        # Protocolos por mês (últimos 12 meses)
        protocolos_por_mes = []
        for i in range(12):
            data = timezone.now() - timedelta(days=30*i)
            count = Protocolo.objects.filter(
                data_abertura__year=data.year,
                data_abertura__month=data.month
            ).count()
            protocolos_por_mes.append({
                'mes': data.strftime('%Y-%m'),
                'quantidade': count
            })

        data = {
            'total_protocolos': total_protocolos,
            'protocolos_abertos': protocolos_abertos,
            'protocolos_concluidos': protocolos_concluidos,
            'protocolos_atrasados': protocolos_atrasados,
            'protocolos_urgentes': protocolos_urgentes,
            'protocolos_por_tipo': protocolos_por_tipo,
            'protocolos_por_status': protocolos_por_status,
            'protocolos_por_mes': protocolos_por_mes
        }

        serializer = DashboardProtocoloSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def atrasados(self, request):
        """Lista protocolos atrasados"""
        protocolos = self.get_queryset().filter(
            ativo=True,
            data_limite__lt=timezone.now(),
            data_conclusao__isnull=True
        )
        page = self.paginate_queryset(protocolos)
        serializer = ProtocoloListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['post'])
    def tramitar(self, request, pk=None):
        """Tramitar protocolo"""
        protocolo = self.get_object()
        serializer = TramitarProtocoloSerializer(data=request.data)
        
        if serializer.is_valid():
            status_novo = get_object_or_404(StatusProtocolo, id=serializer.validated_data['status_novo'])
            responsavel_novo = None
            if 'responsavel_novo' in serializer.validated_data:
                from django.contrib.auth.models import User
                responsavel_novo = get_object_or_404(User, id=serializer.validated_data['responsavel_novo'])
            
            # Criar tramitação
            TramitacaoProtocolo.objects.create(
                protocolo=protocolo,
                status_anterior=protocolo.status,
                status_novo=status_novo,
                responsavel_anterior=protocolo.responsavel_atual,
                responsavel_novo=responsavel_novo,
                observacoes=serializer.validated_data.get('observacoes', ''),
                tramitado_por=request.user
            )
            
            # Atualizar protocolo
            protocolo.status = status_novo
            if responsavel_novo:
                protocolo.responsavel_atual = responsavel_novo
            protocolo.save()
            
            return Response({'message': 'Protocolo tramitado com sucesso'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        """Concluir protocolo"""
        protocolo = self.get_object()
        serializer = ConcluirProtocoloSerializer(data=request.data)
        
        if serializer.is_valid():
            protocolo.data_conclusao = timezone.now()
            protocolo.save()
            
            # Criar tramitação de conclusão
            status_concluido = StatusProtocolo.objects.filter(nome__icontains='concluído').first()
            if status_concluido:
                TramitacaoProtocolo.objects.create(
                    protocolo=protocolo,
                    status_anterior=protocolo.status,
                    status_novo=status_concluido,
                    responsavel_anterior=protocolo.responsavel_atual,
                    observacoes=serializer.validated_data.get('observacoes', 'Protocolo concluído'),
                    tramitado_por=request.user
                )
                protocolo.status = status_concluido
                protocolo.save()
            
            return Response({'message': 'Protocolo concluído com sucesso'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentoProtocoloViewSet(viewsets.ModelViewSet):
    """ViewSet para documentos de protocolo"""
    queryset = DocumentoProtocolo.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['protocolo', 'tipo', 'indexado']
    search_fields = ['titulo', 'descricao']
    ordering_fields = ['data_upload', 'titulo']
    ordering = ['-data_upload']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return DocumentoProtocolo.objects.select_related('protocolo', 'enviado_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentoProtocoloListSerializer
        elif self.action == 'create':
            return DocumentoProtocoloCreateSerializer
        return DocumentoProtocoloDetailSerializer

    def perform_create(self, serializer):
        serializer.save(enviado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def indexar(self, request, pk=None):
        """Indexar documento com OCR e processamento avançado"""
        documento = self.get_object()
        
        try:
            # Processar documento com OCR e indexação
            result = digitization_service.process_document_upload(documento)
            
            if result['success']:
                return Response({
                    'message': 'Documento indexado com sucesso',
                    'texto_extraido': result['ocr_text'][:500] + '...' if len(result['ocr_text']) > 500 else result['ocr_text'],
                    'palavras_chave': result['keywords'][:10],  # Primeiras 10 palavras-chave
                    'metadata': result['metadata']
                })
            else:
                return Response({
                    'message': 'Falha na indexação do documento',
                    'errors': result['errors']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'message': 'Erro interno no processamento',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def analisar_qualidade(self, request, pk=None):
        """Analisar qualidade do documento"""
        documento = self.get_object()
        
        try:
            quality = quality_service.analyze_document_quality(documento)
            return Response(quality)
        except Exception as e:
            return Response({
                'message': 'Erro ao analisar qualidade',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def buscar_texto(self, request):
        """Buscar documentos por texto extraído"""
        query = request.query_params.get('q', '')
        protocolo_id = request.query_params.get('protocolo', None)
        
        if not query:
            return Response({
                'message': 'Parâmetro de busca obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            protocolo = None
            if protocolo_id:
                protocolo = get_object_or_404(Protocolo, id=protocolo_id)
            
            documentos = digitization_service.search_documents(query, protocolo)
            serializer = DocumentoProtocoloListSerializer(documentos, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({
                'message': 'Erro na busca',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Estatísticas dos documentos processados"""
        protocolo_id = request.query_params.get('protocolo', None)
        
        try:
            protocolo = None
            if protocolo_id:
                protocolo = get_object_or_404(Protocolo, id=protocolo_id)
            
            stats = digitization_service.get_document_statistics(protocolo)
            return Response(stats)
            
        except Exception as e:
            return Response({
                'message': 'Erro ao calcular estatísticas',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def processar_lote(self, request):
        """Processar múltiplos documentos em lote"""
        documento_ids = request.data.get('documento_ids', [])
        forcar = request.data.get('forcar', False)
        
        if not documento_ids:
            return Response({
                'message': 'Lista de documentos obrigatória'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            documentos = DocumentoProtocolo.objects.filter(id__in=documento_ids)
            
            if not forcar:
                documentos = documentos.filter(indexado=False)
            
            results = digitization_service.batch_process_documents(list(documentos))
            return Response(results)
            
        except Exception as e:
            return Response({
                'message': 'Erro no processamento em lote',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TramitacaoProtocoloViewSet(viewsets.ModelViewSet):
    """ViewSet para tramitações de protocolo"""
    queryset = TramitacaoProtocolo.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['protocolo', 'status_novo', 'tramitado_por']
    search_fields = ['observacoes']
    ordering_fields = ['data_tramitacao']
    ordering = ['-data_tramitacao']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return TramitacaoProtocolo.objects.select_related(
            'protocolo', 'status_anterior', 'status_novo',
            'responsavel_anterior', 'responsavel_novo', 'tramitado_por'
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return TramitacaoProtocoloCreateSerializer
        return TramitacaoProtocoloListSerializer

    def perform_create(self, serializer):
        serializer.save(tramitado_por=self.request.user)


class AlertaProtocoloViewSet(viewsets.ModelViewSet):
    """ViewSet para alertas de protocolo"""
    queryset = AlertaProtocolo.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['protocolo', 'tipo', 'nivel', 'ativo']
    search_fields = ['titulo', 'mensagem']
    ordering_fields = ['data_criacao', 'data_leitura']
    ordering = ['-data_criacao']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return AlertaProtocolo.objects.select_related('protocolo', 'lido_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return AlertaProtocoloListSerializer
        elif self.action == 'create':
            return AlertaProtocoloCreateSerializer
        return AlertaProtocoloDetailSerializer

    @action(detail=True, methods=['post'])
    def marcar_lido(self, request, pk=None):
        """Marcar alerta como lido"""
        alerta = self.get_object()
        alerta.data_leitura = timezone.now()
        alerta.lido_por = request.user
        alerta.save()
        return Response({'message': 'Alerta marcado como lido'})

    @action(detail=False, methods=['get'])
    def nao_lidos(self, request):
        """Lista alertas não lidos"""
        alertas = self.get_queryset().filter(
            ativo=True,
            data_leitura__isnull=True
        )
        page = self.paginate_queryset(alertas)
        serializer = AlertaProtocoloListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


# API Views específicas
class DashboardProtocoloAPIView(APIView):
    """API para dashboard de protocolos"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Implementação similar ao método dashboard do ProtocoloViewSet
        total_protocolos = Protocolo.objects.count()
        protocolos_abertos = Protocolo.objects.filter(ativo=True).count()
        protocolos_concluidos = Protocolo.objects.filter(data_conclusao__isnull=False).count()
        protocolos_atrasados = Protocolo.objects.filter(
            ativo=True, 
            data_limite__lt=timezone.now(),
            data_conclusao__isnull=True
        ).count()
        
        data = {
            'total_protocolos': total_protocolos,
            'protocolos_abertos': protocolos_abertos,
            'protocolos_concluidos': protocolos_concluidos,
            'protocolos_atrasados': protocolos_atrasados,
        }
        
        serializer = DashboardProtocoloSerializer(data)
        return Response(serializer.data)

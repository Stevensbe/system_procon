from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Q
from django.utils import timezone
from django.core.paginator import Paginator
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
import hashlib
import os

from .models import (
    TipoPeticao, PeticaoEletronica, AnexoPeticao,
    InteracaoPeticao, RespostaPeticao, ConfiguracaoPeticionamento
)
from .serializers import (
    TipoPeticaoSerializer, PeticaoEletronicaListSerializer, PeticaoEletronicaDetailSerializer,
    PeticaoEletronicaCreateSerializer, AnexoPeticaoSerializer, AnexoPeticaoCreateSerializer,
    InteracaoPeticaoSerializer, InteracaoPeticaoCreateSerializer, RespostaPeticaoSerializer,
    RespostaPeticaoCreateSerializer, PeticaoPortalSerializer, ConsultaPeticaoSerializer,
    ValidarDocumentoSerializer, UploadAnexoSerializer, DashboardPeticionamentoSerializer,
    ConfiguracaoPeticionamentoSerializer
)


# === VIEWSETS ===

class TipoPeticaoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de petição"""
    queryset = TipoPeticao.objects.all()
    serializer_class = TipoPeticaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'ordem_exibicao']
    ordering = ['ordem_exibicao', 'nome']
    pagination_class = PageNumberPagination

    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Lista apenas tipos ativos"""
        tipos = TipoPeticao.objects.filter(ativo=True).order_by('ordem_exibicao')
        serializer = self.get_serializer(tipos, many=True)
        return Response(serializer.data)


class PeticaoEletronicaViewSet(viewsets.ModelViewSet):
    """ViewSet para petições eletrônicas"""
    queryset = PeticaoEletronica.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'prioridade', 'tipo_peticao', 'origem', 'responsavel_atual']
    search_fields = ['numero_peticao', 'protocolo_numero', 'assunto', 'peticionario_nome', 'empresa_nome']
    ordering_fields = ['criado_em', 'data_envio', 'prazo_resposta', 'assunto']
    ordering = ['-criado_em']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return PeticaoEletronica.objects.select_related(
            'tipo_peticao', 'usuario_criacao', 'responsavel_atual'
        ).prefetch_related('anexos', 'interacoes')

    def get_serializer_class(self):
        if self.action == 'list':
            return PeticaoEletronicaListSerializer
        elif self.action == 'create':
            return PeticaoEletronicaCreateSerializer
        return PeticaoEletronicaDetailSerializer

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dados do dashboard"""
        # Estatísticas gerais
        total_peticoes = PeticaoEletronica.objects.count()
        peticoes_hoje = PeticaoEletronica.objects.filter(
            criado_em__date=timezone.now().date()
        ).count()
        
        # Petições por status
        peticoes_por_status = list(PeticaoEletronica.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status'))
        
        # Petições com prazo vencido
        peticoes_vencidas = PeticaoEletronica.objects.filter(
            prazo_resposta__lt=timezone.now(),
            status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
        ).count()
        
        # Petições próximas ao vencimento (3 dias)
        limite_vencimento = timezone.now() + timedelta(days=3)
        peticoes_prox_vencimento = PeticaoEletronica.objects.filter(
            prazo_resposta__lte=limite_vencimento,
            prazo_resposta__gte=timezone.now(),
            status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
        ).count()
        
        # Petições por tipo
        peticoes_por_tipo = list(PeticaoEletronica.objects.values(
            'tipo_peticao__nome', 'tipo_peticao__categoria'
        ).annotate(count=Count('id')).order_by('-count')[:10])
        
        # Últimas petições
        ultimas_peticoes = PeticaoEletronica.objects.select_related(
            'tipo_peticao', 'responsavel_atual'
        ).order_by('-criado_em')[:10]
        
        # Petições pendentes de resposta
        peticoes_pendentes = PeticaoEletronica.objects.filter(
            status__in=['RECEBIDA', 'EM_ANALISE']
        ).select_related('tipo_peticao').order_by('prazo_resposta')[:10]
        
        data = {
            'total_peticoes': total_peticoes,
            'peticoes_hoje': peticoes_hoje,
            'peticoes_por_status': peticoes_por_status,
            'peticoes_vencidas': peticoes_vencidas,
            'peticoes_prox_vencimento': peticoes_prox_vencimento,
            'peticoes_por_tipo': peticoes_por_tipo,
            'ultimas_peticoes': PeticaoEletronicaListSerializer(ultimas_peticoes, many=True).data,
            'peticoes_pendentes': PeticaoEletronicaListSerializer(peticoes_pendentes, many=True).data,
        }
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Lista petições com prazo vencido"""
        peticoes = PeticaoEletronica.objects.filter(
            prazo_resposta__lt=timezone.now(),
            status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
        ).select_related('tipo_peticao', 'responsavel_atual')
        
        page = self.paginate_queryset(peticoes)
        if page is not None:
            serializer = PeticaoEletronicaListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PeticaoEletronicaListSerializer(peticoes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """Lista petições pendentes de resposta"""
        peticoes = PeticaoEletronica.objects.filter(
            status__in=['RECEBIDA', 'EM_ANALISE']
        ).select_related('tipo_peticao', 'responsavel_atual').order_by('prazo_resposta')
        
        page = self.paginate_queryset(peticoes)
        if page is not None:
            serializer = PeticaoEletronicaListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PeticaoEletronicaListSerializer(peticoes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """Envia a petição"""
        peticao = self.get_object()
        if peticao.status == 'RASCUNHO':
            peticao.enviar()
            return Response({'message': 'Petição enviada com sucesso'})
        return Response({'error': 'Petição não pode ser enviada'}, status=400)

    @action(detail=True, methods=['post'])
    def receber(self, request, pk=None):
        """Marca petição como recebida"""
        peticao = self.get_object()
        if peticao.status == 'ENVIADA':
            peticao.receber(request.user)
            return Response({'message': 'Petição recebida com sucesso'})
        return Response({'error': 'Petição não pode ser recebida'}, status=400)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela a petição"""
        peticao = self.get_object()
        if peticao.pode_cancelar():
            peticao.status = 'CANCELADA'
            peticao.save()
            return Response({'message': 'Petição cancelada com sucesso'})
        return Response({'error': 'Petição não pode ser cancelada'}, status=400)


class AnexoPeticaoViewSet(viewsets.ModelViewSet):
    """ViewSet para anexos de petição"""
    queryset = AnexoPeticao.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['peticao', 'tipo_anexo']
    search_fields = ['nome_arquivo', 'descricao']
    ordering_fields = ['uploaded_em', 'nome_arquivo']
    ordering = ['-uploaded_em']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return AnexoPeticao.objects.select_related('peticao', 'uploaded_por')

    def get_serializer_class(self):
        if self.action == 'create':
            return AnexoPeticaoCreateSerializer
        return AnexoPeticaoSerializer


class InteracaoPeticaoViewSet(viewsets.ModelViewSet):
    """ViewSet para interações de petição"""
    queryset = InteracaoPeticao.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['peticao', 'tipo_interacao', 'usuario']
    search_fields = ['titulo', 'descricao']
    ordering_fields = ['data_interacao', 'titulo']
    ordering = ['-data_interacao']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return InteracaoPeticao.objects.select_related('peticao', 'usuario')

    def get_serializer_class(self):
        if self.action == 'create':
            return InteracaoPeticaoCreateSerializer
        return InteracaoPeticaoSerializer


class RespostaPeticaoViewSet(viewsets.ModelViewSet):
    """ViewSet para respostas de petição"""
    queryset = RespostaPeticao.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['peticao', 'tipo_resposta', 'responsavel']
    search_fields = ['titulo', 'conteudo']
    ordering_fields = ['data_elaboracao', 'data_envio']
    ordering = ['-data_elaboracao']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return RespostaPeticao.objects.select_related('peticao', 'responsavel')

    def get_serializer_class(self):
        if self.action == 'create':
            return RespostaPeticaoCreateSerializer
        return RespostaPeticaoSerializer

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """Envia a resposta"""
        resposta = self.get_object()
        resposta.enviar()
        return Response({'message': 'Resposta enviada com sucesso'})


class ConfiguracaoPeticionamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações"""
    queryset = ConfiguracaoPeticionamento.objects.all()
    serializer_class = ConfiguracaoPeticionamentoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination


# === API VIEWS ===

class PortalPeticaoAPIView(APIView):
    """API para petições do portal do cidadão"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Cria nova petição do portal"""
        serializer = PeticaoPortalSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            peticao = serializer.save()
            return Response({
                'message': 'Petição criada com sucesso',
                'numero_peticao': peticao.numero_peticao,
                'uuid': peticao.uuid
            }, status=201)
        return Response(serializer.errors, status=400)


class ConsultaPeticaoAPIView(APIView):
    """API para consulta de petições"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Consulta petição por dados do peticionário"""
        serializer = ConsultaPeticaoSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Busca petição
            peticao = None
            if data.get('numero_peticao'):
                peticao = PeticaoEletronica.objects.filter(
                    numero_peticao=data['numero_peticao']
                ).first()
            elif data.get('protocolo_numero'):
                peticao = PeticaoEletronica.objects.filter(
                    protocolo_numero=data['protocolo_numero']
                ).first()
            elif data.get('peticionario_documento'):
                peticao = PeticaoEletronica.objects.filter(
                    peticionario_documento=data['peticionario_documento']
                ).first()
            elif data.get('peticionario_email'):
                peticao = PeticaoEletronica.objects.filter(
                    peticionario_email=data['peticionario_email']
                ).first()
            
            if peticao:
                serializer = PeticaoEletronicaDetailSerializer(peticao)
                return Response(serializer.data)
            else:
                return Response({'error': 'Petição não encontrada'}, status=404)
        
        return Response(serializer.errors, status=400)


class ValidarDocumentoAPIView(APIView):
    """API para validação de documentos"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Valida formato de documento"""
        serializer = ValidarDocumentoSerializer(data=request.data)
        if serializer.is_valid():
            documento = serializer.validated_data['documento']
            tipo = serializer.validated_data['tipo']
            
            # Aqui você pode adicionar validação mais robusta (algoritmo de validação)
            return Response({
                'documento': documento,
                'tipo': tipo,
                'valido': True,
                'formatado': self._formatar_documento(documento, tipo)
            })
        
        return Response(serializer.errors, status=400)
    
    def _formatar_documento(self, documento, tipo):
        """Formata documento para exibição"""
        if tipo == 'CPF':
            return f"{documento[:3]}.{documento[3:6]}.{documento[6:9]}-{documento[9:]}"
        elif tipo == 'CNPJ':
            return f"{documento[:2]}.{documento[2:5]}.{documento[5:8]}/{documento[8:12]}-{documento[12:]}"
        return documento


class UploadAnexoAPIView(APIView):
    """API para upload de anexos"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Faz upload de anexo"""
        serializer = UploadAnexoSerializer(data=request.data)
        if serializer.is_valid():
            arquivo = serializer.validated_data['arquivo']
            tipo_anexo = serializer.validated_data['tipo_anexo']
            descricao = serializer.validated_data.get('descricao', '')
            
            # Gera hash do arquivo
            hash_arquivo = self._gerar_hash_arquivo(arquivo)
            
            # Salva anexo
            anexo = AnexoPeticao.objects.create(
                peticao_id=request.data.get('peticao_id'),
                arquivo=arquivo,
                nome_arquivo=arquivo.name,
                tipo_anexo=tipo_anexo,
                descricao=descricao,
                tipo_mime=arquivo.content_type,
                tamanho_bytes=arquivo.size,
                hash_arquivo=hash_arquivo
            )
            
            return Response({
                'message': 'Anexo enviado com sucesso',
                'anexo_id': anexo.id,
                'nome_arquivo': anexo.nome_arquivo,
                'tamanho_formatado': anexo.tamanho_formatado
            }, status=201)
        
        return Response(serializer.errors, status=400)
    
    def _gerar_hash_arquivo(self, arquivo):
        """Gera hash SHA-256 do arquivo"""
        hash_sha256 = hashlib.sha256()
        for chunk in arquivo.chunks():
            hash_sha256.update(chunk)
        return hash_sha256.hexdigest()


# === VIEWS DE TEMPLATE ===

@login_required
def dashboard_view(request):
    """Dashboard principal do módulo de peticionamento"""
    
    # Estatísticas gerais
    total_peticoes = PeticaoEletronica.objects.count()
    peticoes_hoje = PeticaoEletronica.objects.filter(
        criado_em__date=timezone.now().date()
    ).count()
    
    # Petições por status
    peticoes_por_status = PeticaoEletronica.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Petições com prazo vencido
    peticoes_vencidas = PeticaoEletronica.objects.filter(
        prazo_resposta__lt=timezone.now(),
        status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
    ).count()
    
    # Petições próximas ao vencimento (3 dias)
    limite_vencimento = timezone.now() + timedelta(days=3)
    peticoes_prox_vencimento = PeticaoEletronica.objects.filter(
        prazo_resposta__lte=limite_vencimento,
        prazo_resposta__gte=timezone.now(),
        status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
    ).count()
    
    # Petições por tipo
    peticoes_por_tipo = PeticaoEletronica.objects.values(
        'tipo_peticao__nome', 'tipo_peticao__categoria'
    ).annotate(count=Count('id')).order_by('-count')[:10]
    
    # Últimas petições
    ultimas_peticoes = PeticaoEletronica.objects.select_related(
        'tipo_peticao', 'responsavel_atual'
    ).order_by('-criado_em')[:10]
    
    # Petições pendentes de resposta
    peticoes_pendentes = PeticaoEletronica.objects.filter(
        status__in=['RECEBIDA', 'EM_ANALISE']
    ).select_related('tipo_peticao').order_by('prazo_resposta')[:10]
    
    context = {
        'total_peticoes': total_peticoes,
        'peticoes_hoje': peticoes_hoje,
        'peticoes_por_status': peticoes_por_status,
        'peticoes_vencidas': peticoes_vencidas,
        'peticoes_prox_vencimento': peticoes_prox_vencimento,
        'peticoes_por_tipo': peticoes_por_tipo,
        'ultimas_peticoes': ultimas_peticoes,
        'peticoes_pendentes': peticoes_pendentes,
    }
    
    return render(request, 'peticionamento/dashboard.html', context)


def portal_cidadao(request):
    """Portal do cidadão para peticionamento"""
    tipos_peticao = TipoPeticao.objects.filter(ativo=True).order_by('ordem_exibicao')
    
    context = {
        'tipos_peticao': tipos_peticao,
    }
    
    return render(request, 'peticionamento/portal/home.html', context)


def nova_peticao(request):
    """Formulário para nova petição"""
    if request.method == 'POST':
        # Lógica para salvar nova petição
        pass
    
    tipos_peticao = TipoPeticao.objects.filter(ativo=True).order_by('ordem_exibicao')
    
    context = {
        'tipos_peticao': tipos_peticao,
    }
    
    return render(request, 'peticionamento/nova_peticao.html', context)


@login_required
def lista_peticoes(request):
    """Lista de petições"""
    peticoes = PeticaoEletronica.objects.select_related(
        'tipo_peticao', 'responsavel_atual'
    ).order_by('-criado_em')
    
    # Filtros
    status_filter = request.GET.get('status')
    if status_filter:
        peticoes = peticoes.filter(status=status_filter)
    
    tipo_filter = request.GET.get('tipo')
    if tipo_filter:
        peticoes = peticoes.filter(tipo_peticao_id=tipo_filter)
    
    # Paginação
    paginator = Paginator(peticoes, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'tipos_peticao': TipoPeticao.objects.filter(ativo=True),
    }
    
    return render(request, 'peticionamento/lista_peticoes.html', context)


@login_required
def detalhe_peticao(request, pk):
    """Detalhes de uma petição"""
    peticao = get_object_or_404(PeticaoEletronica, pk=pk)
    
    context = {
        'peticao': peticao,
    }
    
    return render(request, 'peticionamento/detalhe_peticao.html', context)
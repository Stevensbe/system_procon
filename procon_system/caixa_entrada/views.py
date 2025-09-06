from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Q
from django.utils import timezone
from django.core.paginator import Paginator
from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
import json

from .models import (
    CaixaEntrada, AnexoCaixaEntrada, HistoricoCaixaEntrada, ConfiguracaoCaixaEntrada,
    PermissaoSetorCaixaEntrada, AcessoEspecialCaixaEntrada
)
from .serializers import (
    CaixaEntradaSerializer, CaixaEntradaDetailSerializer, AnexoCaixaEntradaSerializer,
    HistoricoCaixaEntradaSerializer, ConfiguracaoCaixaEntradaSerializer
)
from .mixins import AdminPermissionMixin


# === VIEWS PRINCIPAIS ===

@login_required
def caixa_entrada_view(request):
    """View principal da caixa de entrada - similar ao SIGED"""
    
    # Filtros
    status_filter = request.GET.get('status', '')
    tipo_filter = request.GET.get('tipo', '')
    prioridade_filter = request.GET.get('prioridade', '')
    setor_filter = request.GET.get('setor', '')
    busca = request.GET.get('busca', '')
    
    # Query base
    documentos = CaixaEntrada.objects.all()
    
    # Aplicar filtros
    if status_filter:
        documentos = documentos.filter(status=status_filter)
    if tipo_filter:
        documentos = documentos.filter(tipo_documento=tipo_filter)
    if prioridade_filter:
        documentos = documentos.filter(prioridade=prioridade_filter)
    if setor_filter:
        documentos = documentos.filter(setor_destino__icontains=setor_filter)
    if busca:
        documentos = documentos.filter(
            Q(assunto__icontains=busca) |
            Q(remetente_nome__icontains=busca) |
            Q(numero_protocolo__icontains=busca) |
            Q(empresa_nome__icontains=busca)
        )
    
    # Ordenação
    ordenacao = request.GET.get('ordenacao', '-data_entrada')
    documentos = documentos.order_by(ordenacao)
    
    # Paginação
    paginator = Paginator(documentos, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Estatísticas
    total_documentos = documentos.count()
    nao_lidos = documentos.filter(status='NAO_LIDO').count()
    atrasados = documentos.filter(prazo_resposta__lt=timezone.now()).count()
    urgentes = documentos.filter(prioridade='URGENTE').count()
    
    # Distribuição por status
    distribuicao_status = documentos.values('status').annotate(
        total=Count('id')
    ).order_by('-total')
    
    # Distribuição por tipo
    distribuicao_tipo = documentos.values('tipo_documento').annotate(
        total=Count('id')
    ).order_by('-total')
    
    context = {
        'page_obj': page_obj,
        'total_documentos': total_documentos,
        'nao_lidos': nao_lidos,
        'atrasados': atrasados,
        'urgentes': urgentes,
        'distribuicao_status': distribuicao_status,
        'distribuicao_tipo': distribuicao_tipo,
        'filtros': {
            'status': status_filter,
            'tipo': tipo_filter,
            'prioridade': prioridade_filter,
            'setor': setor_filter,
            'busca': busca,
            'ordenacao': ordenacao
        },
        'ordenacao': ordenacao,
        'tipos_documento': CaixaEntrada.TIPO_DOCUMENTO_CHOICES,
        'status_choices': CaixaEntrada.STATUS_CHOICES,
        'prioridade_choices': CaixaEntrada.PRIORIDADE_CHOICES,
        'setores': CaixaEntrada.objects.values_list('setor_destino', flat=True).distinct()
    }
    
    return render(request, 'caixa_entrada/caixa_entrada.html', context)


@login_required
def caixa_pessoal_view(request):
    """Caixa Pessoal - Documentos destinados diretamente ao usuário logado"""
    
    # Filtros
    status_filter = request.GET.get('status', '')
    tipo_filter = request.GET.get('tipo', '')
    prioridade_filter = request.GET.get('prioridade', '')
    busca = request.GET.get('busca', '')
    
    # Query base - documentos destinados diretamente ao usuário
    documentos = CaixaEntrada.objects.filter(
        destinatario_direto=request.user
    ).exclude(
        notificado_dte=True  # Excluir documentos notificados no DTE
    )
    
    # Aplicar filtros
    if status_filter:
        documentos = documentos.filter(status=status_filter)
    if tipo_filter:
        documentos = documentos.filter(tipo_documento=tipo_filter)
    if prioridade_filter:
        documentos = documentos.filter(prioridade=prioridade_filter)
    if busca:
        documentos = documentos.filter(
            Q(assunto__icontains=busca) |
            Q(remetente_nome__icontains=busca) |
            Q(numero_protocolo__icontains=busca) |
            Q(empresa_nome__icontains=busca)
        )
    
    # Ordenação
    ordenacao = request.GET.get('ordenacao', '-data_entrada')
    documentos = documentos.order_by(ordenacao)
    
    # Paginação
    paginator = Paginator(documentos, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Estatísticas
    total_documentos = documentos.count()
    nao_lidos = documentos.filter(status='NAO_LIDO').count()
    atrasados = documentos.filter(prazo_resposta__lt=timezone.now()).count()
    urgentes = documentos.filter(prioridade='URGENTE').count()
    
    context = {
        'page_obj': page_obj,
        'total_documentos': total_documentos,
        'nao_lidos': nao_lidos,
        'atrasados': atrasados,
        'urgentes': urgentes,
        'filtros': {
            'status': status_filter,
            'tipo': tipo_filter,
            'prioridade': prioridade_filter,
            'busca': busca,
        },
        'ordenacao': ordenacao,
        'tipos_documento': CaixaEntrada.TIPO_DOCUMENTO_CHOICES,
        'status_choices': CaixaEntrada.STATUS_CHOICES,
        'prioridade_choices': CaixaEntrada.PRIORIDADE_CHOICES,
        'tipo_caixa': 'pessoal'
    }
    
    return render(request, 'caixa_entrada/caixa_pessoal.html', context)


@login_required
def caixa_setor_view(request):
    """Caixa Setor - Documentos do setor de lotação e setores com acesso"""
    
    # Filtros
    status_filter = request.GET.get('status', '')
    tipo_filter = request.GET.get('tipo', '')
    prioridade_filter = request.GET.get('prioridade', '')
    setor_filter = request.GET.get('setor', '')
    busca = request.GET.get('busca', '')
    
    # Buscar permissões do usuário
    permissoes = PermissaoSetorCaixaEntrada.objects.filter(
        usuarios=request.user,
        ativo=True,
        pode_visualizar=True
    )
    
    # Query base - documentos do setor
    documentos = CaixaEntrada.objects.none()
    
    for permissao in permissoes:
        # Se tem acesso geral
        if permissao.setor == 'GERAL':
            documentos = CaixaEntrada.objects.all()
            break
        
        # Documentos do próprio setor
        setor_display = permissao.get_setor_display()
        documentos_setor = CaixaEntrada.objects.filter(setor_destino=setor_display)
        
        # Documentos de setores permitidos
        for setor_permitido in permissao.setores_permitidos:
            documentos_setor = documentos_setor | CaixaEntrada.objects.filter(
                setor_destino=setor_permitido
            )
        
        # Documentos por tipo permitido
        for tipo_permitido in permissao.tipos_documento_permitidos:
            documentos_setor = documentos_setor | CaixaEntrada.objects.filter(
                tipo_documento=tipo_permitido
            )
        
        documentos = documentos | documentos_setor
    
    # Excluir documentos notificados no DTE
    documentos = documentos.exclude(notificado_dte=True)
    
    # Aplicar filtros
    if status_filter:
        documentos = documentos.filter(status=status_filter)
    if tipo_filter:
        documentos = documentos.filter(tipo_documento=tipo_filter)
    if prioridade_filter:
        documentos = documentos.filter(prioridade=prioridade_filter)
    if setor_filter:
        documentos = documentos.filter(setor_destino__icontains=setor_filter)
    if busca:
        documentos = documentos.filter(
            Q(assunto__icontains=busca) |
            Q(remetente_nome__icontains=busca) |
            Q(numero_protocolo__icontains=busca) |
            Q(empresa_nome__icontains=busca)
        )
    
    # Ordenação
    ordenacao = request.GET.get('ordenacao', '-data_entrada')
    documentos = documentos.order_by(ordenacao)
    
    # Paginação
    paginator = Paginator(documentos, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Estatísticas
    total_documentos = documentos.count()
    nao_lidos = documentos.filter(status='NAO_LIDO').count()
    atrasados = documentos.filter(prazo_resposta__lt=timezone.now()).count()
    urgentes = documentos.filter(prioridade='URGENTE').count()
    
    context = {
        'page_obj': page_obj,
        'total_documentos': total_documentos,
        'nao_lidos': nao_lidos,
        'atrasados': atrasados,
        'urgentes': urgentes,
        'filtros': {
            'status': status_filter,
            'tipo': tipo_filter,
            'prioridade': prioridade_filter,
            'setor': setor_filter,
            'busca': busca,
        },
        'ordenacao': ordenacao,
        'tipos_documento': CaixaEntrada.TIPO_DOCUMENTO_CHOICES,
        'status_choices': CaixaEntrada.STATUS_CHOICES,
        'prioridade_choices': CaixaEntrada.PRIORIDADE_CHOICES,
        'setores': documentos.values_list('setor_destino', flat=True).distinct(),
        'tipo_caixa': 'setor'
    }
    
    return render(request, 'caixa_entrada/caixa_setor.html', context)


@login_required
def caixa_notificados_view(request):
    """Caixa de Notificados - Documentos notificados no DTE"""
    
    # Filtros
    status_filter = request.GET.get('status', '')
    tipo_filter = request.GET.get('tipo', '')
    prioridade_filter = request.GET.get('prioridade', '')
    busca = request.GET.get('busca', '')
    
    # Query base - documentos notificados no DTE
    documentos = CaixaEntrada.objects.filter(notificado_dte=True)
    
    # Aplicar permissões do usuário
    permissoes = PermissaoSetorCaixaEntrada.objects.filter(
        usuarios=request.user,
        ativo=True,
        pode_visualizar=True
    )
    
    documentos_permitidos = CaixaEntrada.objects.none()
    
    for permissao in permissoes:
        if permissao.setor == 'GERAL':
            documentos_permitidos = documentos
            break
        
        setor_display = permissao.get_setor_display()
        documentos_setor = documentos.filter(setor_destino=setor_display)
        
        for setor_permitido in permissao.setores_permitidos:
            documentos_setor = documentos_setor | documentos.filter(
                setor_destino=setor_permitido
            )
        
        for tipo_permitido in permissao.tipos_documento_permitidos:
            documentos_setor = documentos_setor | documentos.filter(
                tipo_documento=tipo_permitido
            )
        
        documentos_permitidos = documentos_permitidos | documentos_setor
    
    documentos = documentos_permitidos.distinct()
    
    # Aplicar filtros
    if status_filter:
        documentos = documentos.filter(status=status_filter)
    if tipo_filter:
        documentos = documentos.filter(tipo_documento=tipo_filter)
    if prioridade_filter:
        documentos = documentos.filter(prioridade=prioridade_filter)
    if busca:
        documentos = documentos.filter(
            Q(assunto__icontains=busca) |
            Q(remetente_nome__icontains=busca) |
            Q(numero_protocolo__icontains=busca) |
            Q(empresa_nome__icontains=busca)
        )
    
    # Ordenação
    ordenacao = request.GET.get('ordenacao', '-data_notificacao_dte')
    documentos = documentos.order_by(ordenacao)
    
    # Paginação
    paginator = Paginator(documentos, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Estatísticas
    total_documentos = documentos.count()
    nao_lidos = documentos.filter(status='NAO_LIDO').count()
    atrasados = documentos.filter(prazo_resposta__lt=timezone.now()).count()
    urgentes = documentos.filter(prioridade='URGENTE').count()
    
    context = {
        'page_obj': page_obj,
        'total_documentos': total_documentos,
        'nao_lidos': nao_lidos,
        'atrasados': atrasados,
        'urgentes': urgentes,
        'filtros': {
            'status': status_filter,
            'tipo': tipo_filter,
            'prioridade': prioridade_filter,
            'busca': busca,
        },
        'ordenacao': ordenacao,
        'tipos_documento': CaixaEntrada.TIPO_DOCUMENTO_CHOICES,
        'status_choices': CaixaEntrada.STATUS_CHOICES,
        'prioridade_choices': CaixaEntrada.PRIORIDADE_CHOICES,
        'tipo_caixa': 'notificados'
    }
    
    return render(request, 'caixa_entrada/caixa_notificados.html', context)


@login_required
def documento_detail(request, documento_id):
    """Detalhes de um documento na caixa de entrada"""
    documento = get_object_or_404(CaixaEntrada, id=documento_id)
    
    # Marcar como lido se não foi lido
    if documento.status == 'NAO_LIDO':
        documento.marcar_como_lido(request.user)
    
    # Histórico do documento
    historico = documento.historico.all().order_by('-data_acao')
    
    # Anexos
    anexos = documento.anexos.all().order_by('-upload_em')
    
    # Versões anteriores
    versoes_anteriores = documento.versoes_posteriores.all().order_by('-versao')
    
    context = {
        'documento': documento,
        'historico': historico,
        'anexos': anexos,
        'versoes_anteriores': versoes_anteriores,
    }
    
    return render(request, 'caixa_entrada/documento_detail.html', context)


@login_required
def marcar_como_lido(request, documento_id):
    """Marca documento como lido"""
    documento = get_object_or_404(CaixaEntrada, id=documento_id)
    documento.marcar_como_lido(request.user)
    
    # Registrar no histórico
    HistoricoCaixaEntrada.objects.create(
        documento=documento,
        acao='LIDO',
        usuario=request.user,
        detalhes='Documento marcado como lido'
    )
    
    messages.success(request, 'Documento marcado como lido')
    return redirect('caixa_entrada:documento_detail', documento_id=documento_id)


@login_required
def encaminhar_documento(request, documento_id):
    """Encaminha documento para outro setor"""
    documento = get_object_or_404(CaixaEntrada, id=documento_id)
    
    if request.method == 'POST':
        setor_destino = request.POST.get('setor_destino')
        responsavel_id = request.POST.get('responsavel')
        observacoes = request.POST.get('observacoes', '')
        
        if setor_destino:
            responsavel = None
            if responsavel_id:
                from django.contrib.auth.models import User
                responsavel = User.objects.get(id=responsavel_id)
            
            # Encaminhar documento
            nova_versao = documento.encaminhar_para_setor(
                setor_destino=setor_destino,
                responsavel=responsavel,
                observacoes=observacoes
            )
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='ENCAMINHADO',
                usuario=request.user,
                detalhes=f'Encaminhado para {setor_destino}',
                dados_novos={'setor_destino': setor_destino, 'responsavel': responsavel_id}
            )
            
            messages.success(request, f'Documento encaminhado para {setor_destino}')
            return redirect('caixa_entrada:documento_detail', documento_id=nova_versao.id)
    
    # Buscar setores disponíveis
    setores = CaixaEntrada.objects.values_list('setor_destino', flat=True).distinct()
    usuarios = User.objects.filter(is_active=True).order_by('first_name', 'last_name')
    
    context = {
        'documento': documento,
        'setores': setores,
        'usuarios': usuarios,
    }
    
    return render(request, 'caixa_entrada/encaminhar_documento.html', context)


@login_required
def arquivar_documento(request, documento_id):
    """Arquiva um documento"""
    documento = get_object_or_404(CaixaEntrada, id=documento_id)
    
    if request.method == 'POST':
        motivo = request.POST.get('motivo', '')
        documento.status = 'ARQUIVADO'
        documento.save()
        
        # Registrar no histórico
        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='ARQUIVADO',
            usuario=request.user,
            detalhes=f'Documento arquivado: {motivo}'
        )
        
        messages.success(request, 'Documento arquivado com sucesso')
        return redirect('caixa_entrada:caixa_entrada')
    
    return render(request, 'caixa_entrada/arquivar_documento.html', {'documento': documento})


# === VIEWSETS ===

class CaixaEntradaViewSet(viewsets.ModelViewSet):
    """ViewSet para caixa de entrada"""
    queryset = CaixaEntrada.objects.all()
    serializer_class = CaixaEntradaSerializer
    permission_classes = [AllowAny]  # Temporariamente AllowAny para desenvolvimento
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo_documento', 'prioridade', 'setor_destino']
    search_fields = ['assunto', 'remetente_nome', 'numero_protocolo', 'empresa_nome']
    ordering_fields = ['data_entrada', 'prazo_resposta', 'prioridade']
    ordering = ['-data_entrada']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        """Filtra documentos por usuário e permissões"""
        queryset = super().get_queryset()
        
        # Se usuário é anônimo ou não autenticado, retorna todos (para desenvolvimento)
        if not self.request.user.is_authenticated:
            return queryset
        
        # Se usuário é staff, vê todos
        if self.request.user.is_staff:
            return queryset
        
        # Senão, vê apenas documentos do seu setor ou onde é responsável
        return queryset.filter(
            Q(setor_destino__icontains=self.request.user.groups.first().name if self.request.user.groups.exists() else '') |
            Q(responsavel_atual=self.request.user)
        )
    
    @action(detail=True, methods=['post'])
    def marcar_lido(self, request, pk=None):
        """Marca documento como lido"""
        documento = self.get_object()
        documento.marcar_como_lido(request.user)
        
        # Registrar no histórico
        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='LIDO',
            usuario=request.user,
            detalhes='Documento marcado como lido via API'
        )
        
        return Response({'status': 'success'})
    
    @action(detail=True, methods=['post'])
    def encaminhar(self, request, pk=None):
        """Encaminha documento para outro setor"""
        documento = self.get_object()
        setor_destino = request.data.get('setor_destino')
        responsavel_id = request.data.get('responsavel')
        observacoes = request.data.get('observacoes', '')
        
        if not setor_destino:
            return Response({'error': 'Setor destino é obrigatório'}, status=400)
        
        responsavel = None
        if responsavel_id:
            from django.contrib.auth.models import User
            responsavel = User.objects.get(id=responsavel_id)
        
        nova_versao = documento.encaminhar_para_setor(
            setor_destino=setor_destino,
            responsavel=responsavel,
            observacoes=observacoes
        )
        
        # Registrar no histórico
        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='ENCAMINHADO',
            usuario=request.user,
            detalhes=f'Encaminhado para {setor_destino}',
            dados_novos={'setor_destino': setor_destino, 'responsavel': responsavel_id}
        )
        
        serializer = CaixaEntradaSerializer(nova_versao)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dados do dashboard da caixa de entrada"""
        queryset = self.get_queryset()
        
        # Estatísticas
        total = queryset.count()
        nao_lidos = queryset.filter(status='NAO_LIDO').count()
        atrasados = queryset.filter(prazo_resposta__lt=timezone.now()).count()
        urgentes = queryset.filter(prioridade='URGENTE').count()
        
        # Distribuição por status
        distribuicao_status = queryset.values('status').annotate(
            total=Count('id')
        ).order_by('-total')
        
        # Distribuição por tipo
        distribuicao_tipo = queryset.values('tipo_documento').annotate(
            total=Count('id')
        ).order_by('-total')
        
        # Documentos recentes
        recentes = queryset.order_by('-data_entrada')[:10]
        
        dados = {
            'total': total,
            'nao_lidos': nao_lidos,
            'atrasados': atrasados,
            'urgentes': urgentes,
            'distribuicao_status': list(distribuicao_status),
            'distribuicao_tipo': list(distribuicao_tipo),
            'recentes': CaixaEntradaSerializer(recentes, many=True).data
        }
        
        return Response(dados)
    
    @action(detail=False, methods=['get'])
    def atrasados(self, request):
        """Lista documentos atrasados"""
        queryset = self.get_queryset().filter(
            prazo_resposta__lt=timezone.now(),
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).order_by('prazo_resposta')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def urgentes(self, request):
        """Lista documentos urgentes"""
        queryset = self.get_queryset().filter(
            prioridade='URGENTE',
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).order_by('-data_entrada')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AnexoCaixaEntradaViewSet(viewsets.ModelViewSet):
    """ViewSet para anexos da caixa de entrada"""
    queryset = AnexoCaixaEntrada.objects.all()
    serializer_class = AnexoCaixaEntradaSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(upload_por=self.request.user)


class HistoricoCaixaEntradaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para histórico da caixa de entrada"""
    queryset = HistoricoCaixaEntrada.objects.all()
    serializer_class = HistoricoCaixaEntradaSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-data_acao']


class ConfiguracaoCaixaEntradaViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações da caixa de entrada"""
    queryset = ConfiguracaoCaixaEntrada.objects.all()
    serializer_class = ConfiguracaoCaixaEntradaSerializer
    permission_classes = [IsAuthenticated]


# === API VIEWS ===

class CriarDocumentoAPIView(APIView):
    """API para criar documento na caixa de entrada"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Cria novo documento na caixa de entrada"""
        serializer = CaixaEntradaSerializer(data=request.data)
        if serializer.is_valid():
            documento = serializer.save()
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='CRIADO',
                usuario=request.user if request.user.is_authenticated else None,
                detalhes='Documento criado via API'
            )
            
            return Response({
                'message': 'Documento criado com sucesso',
                'numero_protocolo': documento.numero_protocolo,
                'id': documento.id
            }, status=201)
        
        return Response(serializer.errors, status=400)


class ConsultarDocumentoAPIView(APIView):
    """API para consultar documento por número de protocolo"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Consulta documento por número de protocolo"""
        numero_protocolo = request.GET.get('numero_protocolo')
        cpf_cnpj = request.GET.get('cpf_cnpj')
        
        if not numero_protocolo and not cpf_cnpj:
            return Response({'error': 'Número de protocolo ou CPF/CNPJ é obrigatório'}, status=400)
        
        try:
            if numero_protocolo:
                documento = CaixaEntrada.objects.get(numero_protocolo=numero_protocolo)
            else:
                documento = CaixaEntrada.objects.filter(
                    remetente_documento__contains=cpf_cnpj
                ).order_by('-data_entrada').first()
            
            if not documento:
                return Response({'error': 'Documento não encontrado'}, status=404)
            
            serializer = CaixaEntradaDetailSerializer(documento)
            return Response(serializer.data)
            
        except CaixaEntrada.DoesNotExist:
            return Response({'error': 'Documento não encontrado'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# Views administrativas para gerenciar permissões
@login_required
def gerenciar_permissoes_view(request):
    """View para gerenciar permissões de setor"""
    mixin = AdminPermissionMixin()
    
    if not mixin.test_func():
        messages.error(request, "Você não tem permissão para gerenciar permissões.")
        return redirect('caixa_entrada:caixa_entrada')
    
    if request.method == 'POST':
        # Lógica para salvar permissões
        setor = request.POST.get('setor')
        usuarios_ids = request.POST.getlist('usuarios')
        
        permissao, created = PermissaoSetorCaixaEntrada.objects.get_or_create(setor=setor)
        permissao.usuarios.set(usuarios_ids)
        
        messages.success(request, f'Permissões do setor {setor} atualizadas.')
        return redirect('caixa_entrada:gerenciar_permissoes')
    
    permissoes = PermissaoSetorCaixaEntrada.objects.all().order_by('setor')
    usuarios = User.objects.filter(is_active=True).order_by('username')
    
    context = {
        'permissoes': permissoes,
        'usuarios': usuarios,
    }
    
    return render(request, 'caixa_entrada/gerenciar_permissoes.html', context)


@login_required
def gerenciar_acesso_especial_view(request):
    """View para gerenciar acessos especiais"""
    mixin = AdminPermissionMixin()
    
    if not mixin.test_func():
        messages.error(request, "Você não tem permissão para gerenciar acessos especiais.")
        return redirect('caixa_entrada:caixa_entrada')
    
    if request.method == 'POST':
        # Lógica para conceder acesso especial
        usuario_id = request.POST.get('usuario')
        documento_id = request.POST.get('documento')
        motivo = request.POST.get('motivo')
        observacoes = request.POST.get('observacoes', '')
        data_fim = request.POST.get('data_fim')
        
        try:
            usuario = User.objects.get(id=usuario_id)
            documento = CaixaEntrada.objects.get(id=documento_id)
            
            acesso = AcessoEspecialCaixaEntrada.objects.create(
                usuario=usuario,
                documento=documento,
                motivo=motivo,
                observacoes=observacoes,
                data_fim=data_fim if data_fim else None,
                concedido_por=request.user
            )
            
            messages.success(request, f'Acesso especial concedido para {usuario.username}.')
            
        except (User.DoesNotExist, CaixaEntrada.DoesNotExist):
            messages.error(request, 'Usuário ou documento não encontrado.')
        
        return redirect('caixa_entrada:gerenciar_acesso_especial')
    
    acessos = AcessoEspecialCaixaEntrada.objects.filter(ativo=True).order_by('-criado_em')
    usuarios = User.objects.filter(is_active=True).order_by('username')
    documentos = CaixaEntrada.objects.all().order_by('-data_entrada')
    
    context = {
        'acessos': acessos,
        'usuarios': usuarios,
        'documentos': documentos,
    }
    
    return render(request, 'caixa_entrada/gerenciar_acesso_especial.html', context)


class EstatisticasAPIView(APIView):
    """API para obter estatísticas da caixa de entrada"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Parâmetros de filtro
            setor = request.GET.get('setor', '')
            tipo_documento = request.GET.get('tipo_documento', '')
            
            # Query base
            documentos = CaixaEntrada.objects.all()
            
            # Aplicar filtros
            if setor:
                documentos = documentos.filter(setor_destino__icontains=setor)
            if tipo_documento:
                documentos = documentos.filter(tipo_documento=tipo_documento)
            
            # Calcular estatísticas
            total = documentos.count()
            nao_lidos = documentos.filter(status='NAO_LIDO').count()
            em_analise = documentos.filter(status='EM_ANALISE').count()
            encaminhados = documentos.filter(status='ENCAMINHADO').count()
            arquivados = documentos.filter(status='ARQUIVADO').count()
            
            # Estatísticas por setor
            estatisticas_setor = documentos.values('setor_destino').annotate(
                total=Count('id'),
                nao_lidos=Count('id', filter=Q(status='NAO_LIDO')),
                em_analise=Count('id', filter=Q(status='EM_ANALISE')),
                encaminhados=Count('id', filter=Q(status='ENCAMINHADO'))
            ).order_by('-total')
            
            # Estatísticas por tipo
            estatisticas_tipo = documentos.values('tipo_documento').annotate(
                total=Count('id')
            ).order_by('-total')
            
            # Documentos atrasados
            atrasados = documentos.filter(
                prazo_resposta__lt=timezone.now(),
                status__in=['NAO_LIDO', 'EM_ANALISE']
            ).count()
            
            # Documentos urgentes
            urgentes = documentos.filter(prioridade='URGENTE').count()
            
            estatisticas = {
                'total': total,
                'nao_lidos': nao_lidos,
                'em_analise': em_analise,
                'encaminhados': encaminhados,
                'arquivados': arquivados,
                'atrasados': atrasados,
                'urgentes': urgentes,
                'por_setor': list(estatisticas_setor),
                'por_tipo': list(estatisticas_tipo),
                'filtros_aplicados': {
                    'setor': setor,
                    'tipo_documento': tipo_documento
                }
            }
            
            return Response(estatisticas)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

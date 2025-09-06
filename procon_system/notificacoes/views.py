from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import timedelta
from .models import (
    TipoNotificacao, 
    Notificacao, 
    PreferenciaNotificacao, 
    LogNotificacao, 
    TemplateNotificacao
)

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    TipoNotificacao, 
    Notificacao, 
    PreferenciaNotificacao, 
    LogNotificacao, 
    TemplateNotificacao
)
from .serializers import (
    TipoNotificacaoSerializer,
    NotificacaoSerializer,
    NotificacaoCreateSerializer,
    NotificacaoUpdateSerializer,
    PreferenciaNotificacaoSerializer,
    LogNotificacaoSerializer,
    TemplateNotificacaoSerializer,
    DashboardNotificacoesSerializer,
    NotificacaoBulkSerializer,
    NotificacaoFilterSerializer
)


def notificacao_list(request):
    notificacoes = Notificacao.objects.select_related('tipo').all()
    
    # Filtros
    search = request.GET.get('search', '')
    status = request.GET.get('status', '')
    canal = request.GET.get('canal', '')
    tipo = request.GET.get('tipo', '')
    prioridade = request.GET.get('prioridade', '')
    
    if search:
        notificacoes = notificacoes.filter(
            Q(assunto__icontains=search) |
            Q(destinatario_nome__icontains=search) |
            Q(destinatario_email__icontains=search) |
            Q(conteudo__icontains=search)
        )
    
    if status:
        notificacoes = notificacoes.filter(status=status)
    
    if canal:
        notificacoes = notificacoes.filter(canal=canal)
    
    if tipo:
        notificacoes = notificacoes.filter(tipo_id=tipo)
    
    if prioridade:
        notificacoes = notificacoes.filter(prioridade=prioridade)
    
    # Paginação
    paginator = Paginator(notificacoes, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Dados para filtros
    tipos = TipoNotificacao.objects.filter(ativo=True)
    
    context = {
        'page_obj': page_obj,
        'tipos': tipos,
        'search': search,
        'status': status,
        'canal': canal,
        'tipo': tipo,
        'prioridade': prioridade,
        'status_choices': Notificacao.STATUS_CHOICES,
        'canal_choices': Notificacao.CANAL_CHOICES,
        'prioridade_choices': Notificacao.PRIORIDADE_CHOICES,
    }
    
    return render(request, 'notificacoes/notificacao_list.html', context)


def notificacao_detail(request, pk):
    notificacao = get_object_or_404(Notificacao.objects.select_related('tipo'), pk=pk)
    logs = notificacao.logs.all()[:10]
    
    context = {
        'notificacao': notificacao,
        'logs': logs,
    }
    
    return render(request, 'notificacoes/notificacao_detail.html', context)


def notificacao_dashboard(request):
    # Estatísticas gerais
    hoje = timezone.now().date()
    ontem = hoje - timedelta(days=1)
    semana_passada = hoje - timedelta(days=7)
    
    stats = {
        'total_notificacoes': Notificacao.objects.count(),
        'pendentes': Notificacao.objects.filter(status='pendente').count(),
        'enviadas_hoje': Notificacao.objects.filter(
            data_envio__date=hoje
        ).count(),
        'falhadas': Notificacao.objects.filter(status='falhada').count(),
    }
    
    # Distribuição por status
    distribuicao_status = Notificacao.objects.values('status').annotate(
        total=Count('id')
    ).order_by('-total')
    
    # Distribuição por canal
    distribuicao_canal = Notificacao.objects.values('canal').annotate(
        total=Count('id')
    ).order_by('-total')
    
    # Distribuição por tipo
    distribuicao_tipo = Notificacao.objects.values('tipo__nome').annotate(
        total=Count('id')
    ).order_by('-total')[:10]
    
    # Notificações pendentes por prioridade
    pendentes_prioridade = Notificacao.objects.filter(
        status='pendente'
    ).values('prioridade').annotate(
        total=Count('id')
    ).order_by('-total')
    
    # Evolução nos últimos 7 dias
    evolucao_semanal = []
    for i in range(7):
        data = hoje - timedelta(days=i)
        count = Notificacao.objects.filter(data_envio__date=data).count()
        evolucao_semanal.append({
            'data': data.strftime('%d/%m'),
            'total': count
        })
    evolucao_semanal.reverse()
    
    context = {
        'stats': stats,
        'distribuicao_status': distribuicao_status,
        'distribuicao_canal': distribuicao_canal,
        'distribuicao_tipo': distribuicao_tipo,
        'pendentes_prioridade': pendentes_prioridade,
        'evolucao_semanal': evolucao_semanal,
    }
    
    return render(request, 'notificacoes/dashboard.html', context)


@require_http_methods(["POST"])
def enviar_notificacao(request, pk):
    notificacao = get_object_or_404(Notificacao, pk=pk)
    
    if notificacao.status != 'pendente':
        return JsonResponse({
            'success': False,
            'error': 'Notificação não está pendente'
        })
    
    sucesso = notificacao.enviar()
    
    return JsonResponse({
        'success': sucesso,
        'status': notificacao.get_status_display(),
        'data_envio': notificacao.data_envio.strftime('%d/%m/%Y %H:%M') if notificacao.data_envio else None,
        'erro': notificacao.erro_envio if not sucesso else None
    })


@require_http_methods(["POST"])
def cancelar_notificacao(request, pk):
    notificacao = get_object_or_404(Notificacao, pk=pk)
    motivo = request.POST.get('motivo', '')
    
    notificacao.cancelar(motivo)
    
    return JsonResponse({
        'success': True,
        'status': notificacao.get_status_display()
    })


@require_http_methods(["POST"])
def marcar_como_lida(request, pk):
    notificacao = get_object_or_404(Notificacao, pk=pk)
    notificacao.marcar_como_lida()
    
    return JsonResponse({
        'success': True,
        'status': notificacao.get_status_display(),
        'data_leitura': notificacao.data_leitura.strftime('%d/%m/%Y %H:%M') if notificacao.data_leitura else None
    })


def processar_fila_notificacoes(request):
    """Processa notificações pendentes na fila"""
    notificacoes_pendentes = Notificacao.objects.filter(
        status='pendente',
        data_agendamento__lte=timezone.now()
    ).order_by('prioridade', 'data_agendamento')[:50]  # Processa no máximo 50 por vez
    
    processadas = 0
    enviadas = 0
    falhadas = 0
    
    for notificacao in notificacoes_pendentes:
        processadas += 1
        if notificacao.enviar():
            enviadas += 1
        else:
            falhadas += 1
    
    context = {
        'processadas': processadas,
        'enviadas': enviadas,
        'falhadas': falhadas,
    }
    
    return render(request, 'notificacoes/processar_fila.html', context)


def template_list(request):
    templates = TemplateNotificacao.objects.select_related('tipo').filter(ativo=True)
    
    context = {
        'templates': templates,
    }
    
    return render(request, 'notificacoes/template_list.html', context)


def template_preview(request, pk):
    template = get_object_or_404(TemplateNotificacao, pk=pk)
    
    # Contexto de exemplo para preview
    contexto_exemplo = {
        'nome_empresa': 'Empresa Exemplo LTDA',
        'cnpj': '12.345.678/0001-90',
        'numero_processo': '2024.001.000001',
        'valor_multa': '1.500,00',
        'data_vencimento': '31/12/2024',
        'nome_responsavel': 'João da Silva',
    }
    
    if request.method == 'POST':
        # Permite testar com contexto personalizado
        for key in contexto_exemplo.keys():
            valor = request.POST.get(key, '')
            if valor:
                contexto_exemplo[key] = valor
    
    assunto, conteudo = template.renderizar(contexto_exemplo)
    
    context = {
        'template': template,
        'assunto_renderizado': assunto,
        'conteudo_renderizado': conteudo,
        'contexto_exemplo': contexto_exemplo,
    }
    
    return render(request, 'notificacoes/template_preview.html', context)


def notificacoes_sistema(request):
    """Lista notificações do sistema para o usuário atual"""
    # Aqui você pegaria o usuário logado
    # usuario = request.user.username
    usuario = "admin"  # Placeholder
    
    notificacoes = NotificacaoSistema.objects.filter(
        usuario_destinatario=usuario
    ).order_by('-data_criacao')
    
    # Marcar como lidas se solicitado
    if request.GET.get('marcar_lidas'):
        notificacoes.filter(lida=False).update(lida=True, data_leitura=timezone.now())
        return redirect('notificacoes:sistema')
    
    # Paginação
    paginator = Paginator(notificacoes, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Contador de não lidas
    nao_lidas = notificacoes.filter(lida=False).count()
    
    context = {
        'page_obj': page_obj,
        'nao_lidas': nao_lidas,
    }
    
    return render(request, 'notificacoes/sistema.html', context)


def criar_notificacao_manual(request):
    """Cria uma notificação manual"""
    if request.method == 'POST':
        # Aqui você implementaria a criação manual
        # Por simplicidade, vou deixar um placeholder
        messages.success(request, 'Notificação criada com sucesso!')
        return redirect('notificacoes:list')
    
    tipos = TipoNotificacao.objects.filter(ativo=True)
    templates = TemplateNotificacao.objects.filter(ativo=True)
    
    context = {
        'tipos': tipos,
        'templates': templates,
        'canal_choices': Notificacao.CANAL_CHOICES,
        'prioridade_choices': Notificacao.PRIORIDADE_CHOICES,
    }
    
    return render(request, 'notificacoes/criar_manual.html', context)


def relatorio_notificacoes(request):
    """Gera relatório de notificações"""
    # Filtros de data
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    
    notificacoes = Notificacao.objects.all()
    
    if data_inicio:
        notificacoes = notificacoes.filter(criado_em__date__gte=data_inicio)
    
    if data_fim:
        notificacoes = notificacoes.filter(criado_em__date__lte=data_fim)
    
    # Estatísticas do relatório
    total = notificacoes.count()
    por_status = notificacoes.values('status').annotate(total=Count('id'))
    por_canal = notificacoes.values('canal').annotate(total=Count('id'))
    por_tipo = notificacoes.values('tipo__nome').annotate(total=Count('id'))
    
    context = {
        'total': total,
        'por_status': por_status,
        'por_canal': por_canal,
        'por_tipo': por_tipo,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
    }
    
    return render(request, 'notificacoes/relatorio.html', context)


class TipoNotificacaoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para tipos de notificação"""
    queryset = TipoNotificacao.objects.filter(ativo=True)
    serializer_class = TipoNotificacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['codigo', 'ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'criado_em']
    ordering = ['nome']

class NotificacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para notificações"""
    serializer_class = NotificacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'prioridade', 'tipo', 'destinatario']
    search_fields = ['titulo', 'mensagem']
    ordering_fields = ['criado_em', 'agendada_para', 'prioridade']
    ordering = ['-criado_em']

    def get_queryset(self):
        """Filtra notificações do usuário logado"""
        user = self.request.user
        if user.is_staff:
            return Notificacao.objects.all()
        return Notificacao.objects.filter(destinatario=user)

    def get_serializer_class(self):
        """Retorna o serializer apropriado para cada ação"""
        if self.action == 'create':
            return NotificacaoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return NotificacaoUpdateSerializer
        return NotificacaoSerializer

    @action(detail=True, methods=['post'])
    def marcar_como_lida(self, request, pk=None):
        """Marca uma notificação como lida"""
        notificacao = self.get_object()
        notificacao.marcar_como_lida()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def marcar_como_enviada(self, request, pk=None):
        """Marca uma notificação como enviada"""
        notificacao = self.get_object()
        notificacao.marcar_como_enviada()
        return Response({'status': 'success'})

    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Executa ações em lote nas notificações"""
        serializer = NotificacaoBulkSerializer(data=request.data)
        if serializer.is_valid():
            notificacao_ids = serializer.validated_data['notificacao_ids']
            acao = serializer.validated_data['acao']
            
            notificacoes = self.get_queryset().filter(id__in=notificacao_ids)
            
            if acao == 'marcar_lidas':
                for notificacao in notificacoes:
                    notificacao.marcar_como_lida()
            elif acao == 'marcar_enviadas':
                for notificacao in notificacoes:
                    notificacao.marcar_como_enviada()
            elif acao == 'cancelar':
                notificacoes.update(status='cancelada')
            
            return Response({'status': 'success', 'processadas': len(notificacoes)})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def nao_lidas(self, request):
        """Retorna notificações não lidas do usuário"""
        notificacoes = self.get_queryset().filter(status='pendente')
        serializer = self.get_serializer(notificacoes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def contador(self, request):
        """Retorna contadores de notificações"""
        user = request.user
        queryset = Notificacao.objects.filter(destinatario=user)
        
        contadores = {
            'total': queryset.count(),
            'pendentes': queryset.filter(status='pendente').count(),
            'enviadas': queryset.filter(status='enviada').count(),
            'lidas': queryset.filter(status='lida').count(),
            'falhadas': queryset.filter(status='falhada').count(),
        }
        
        return Response(contadores)

class PreferenciaNotificacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para preferências de notificação"""
    serializer_class = PreferenciaNotificacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['usuario', 'tipo_notificacao', 'canal', 'ativo']
    ordering_fields = ['usuario', 'tipo_notificacao']
    ordering = ['usuario', 'tipo_notificacao']

    def get_queryset(self):
        """Filtra preferências do usuário logado"""
        user = self.request.user
        if user.is_staff:
            return PreferenciaNotificacao.objects.all()
        return PreferenciaNotificacao.objects.filter(usuario=user)

    @action(detail=False, methods=['get'])
    def minhas_preferencias(self, request):
        """Retorna preferências do usuário logado"""
        preferencias = self.get_queryset().filter(usuario=request.user)
        serializer = self.get_serializer(preferencias, many=True)
        return Response(serializer.data)

class LogNotificacaoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para logs de notificação"""
    queryset = LogNotificacao.objects.all()
    serializer_class = LogNotificacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notificacao', 'canal', 'resultado']
    ordering_fields = ['criado_em']
    ordering = ['-criado_em']

class TemplateNotificacaoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para templates de notificação"""
    queryset = TemplateNotificacao.objects.filter(ativo=True)
    serializer_class = TemplateNotificacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_notificacao', 'canal', 'ativo']
    search_fields = ['nome', 'assunto', 'conteudo']
    ordering_fields = ['nome', 'criado_em']
    ordering = ['nome']

class NotificacaoDashboardViewSet(viewsets.ViewSet):
    """ViewSet para dashboard de notificações"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Retorna dados do dashboard de notificações"""
        user = request.user
        queryset = Notificacao.objects.filter(destinatario=user)
        
        # Contadores básicos
        total_notificacoes = queryset.count()
        notificacoes_pendentes = queryset.filter(status='pendente').count()
        notificacoes_enviadas = queryset.filter(status='enviada').count()
        notificacoes_lidas = queryset.filter(status='lida').count()
        notificacoes_falhadas = queryset.filter(status='falhada').count()
        
        # Notificações por tipo
        notificacoes_por_tipo = queryset.values('tipo__nome').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Notificações por canal (baseado nas preferências)
        notificacoes_por_canal = PreferenciaNotificacao.objects.filter(
            usuario=user, ativo=True
        ).values('canal').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Notificações recentes
        notificacoes_recentes = queryset.order_by('-criado_em')[:10]
        
        dados = {
            'total_notificacoes': total_notificacoes,
            'notificacoes_pendentes': notificacoes_pendentes,
            'notificacoes_enviadas': notificacoes_enviadas,
            'notificacoes_lidas': notificacoes_lidas,
            'notificacoes_falhadas': notificacoes_falhadas,
            'notificacoes_por_tipo': {item['tipo__nome']: item['count'] for item in notificacoes_por_tipo},
            'notificacoes_por_canal': {item['canal']: item['count'] for item in notificacoes_por_canal},
            'notificacoes_recentes': NotificacaoSerializer(notificacoes_recentes, many=True).data
        }
        
        serializer = DashboardNotificacoesSerializer(dados)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Retorna estatísticas detalhadas de notificações"""
        user = request.user
        queryset = Notificacao.objects.filter(destinatario=user)
        
        # Estatísticas por período
        hoje = timezone.now().date()
        ontem = hoje - timedelta(days=1)
        semana_passada = hoje - timedelta(days=7)
        mes_passado = hoje - timedelta(days=30)
        
        estatisticas = {
            'hoje': queryset.filter(criado_em__date=hoje).count(),
            'ontem': queryset.filter(criado_em__date=ontem).count(),
            'semana_passada': queryset.filter(criado_em__date__gte=semana_passada).count(),
            'mes_passado': queryset.filter(criado_em__date__gte=mes_passado).count(),
        }
        
        return Response(estatisticas)

    @action(detail=False, methods=['get'])
    def notificacoes_vencidas(self, request):
        """Retorna notificações vencidas"""
        user = request.user
        notificacoes_vencidas = Notificacao.objects.filter(
            destinatario=user,
            agendada_para__lt=timezone.now(),
            status='pendente'
        )
        
        serializer = NotificacaoSerializer(notificacoes_vencidas, many=True)
        return Response(serializer.data)

class NotificacaoServiceViewSet(viewsets.ViewSet):
    """ViewSet para serviços de notificação"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def enviar_notificacao(self, request):
        """Envia uma notificação"""
        serializer = NotificacaoCreateSerializer(data=request.data)
        if serializer.is_valid():
            notificacao = serializer.save()
            
            # Aqui você implementaria a lógica de envio real
            # Por enquanto, apenas marca como enviada
            notificacao.marcar_como_enviada()
            
            return Response({
                'status': 'success',
                'notificacao': NotificacaoSerializer(notificacao).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def enviar_notificacao_massa(self, request):
        """Envia notificação para múltiplos usuários"""
        # Implementar lógica de envio em massa
        return Response({'status': 'em desenvolvimento'})

    @action(detail=False, methods=['post'])
    def agendar_notificacao(self, request):
        """Agenda uma notificação para envio futuro"""
        serializer = NotificacaoCreateSerializer(data=request.data)
        if serializer.is_valid():
            notificacao = serializer.save()
            return Response({
                'status': 'success',
                'notificacao': NotificacaoSerializer(notificacao).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
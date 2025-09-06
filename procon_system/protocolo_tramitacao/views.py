from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Q
from django.utils import timezone
from django.core.paginator import Paginator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime, timedelta

from .models import (
    ProtocoloDocumento, TipoDocumento, Setor, 
    TramitacaoDocumento, AnexoProtocolo, ConfiguracaoProtocolo
)
from .serializers import (
    ProtocoloDocumentoSerializer, TipoDocumentoSerializer,
    SetorSerializer, TramitacaoDocumentoSerializer,
    AnexoProtocoloSerializer
)


# === VIEWS PRINCIPAIS ===

@login_required
def dashboard_view(request):
    """Dashboard principal do módulo de protocolo"""
    
    # Estatísticas gerais
    total_protocolos = ProtocoloDocumento.objects.count()
    protocolos_hoje = ProtocoloDocumento.objects.filter(
        data_protocolo__date=timezone.now().date()
    ).count()
    
    # Protocolos por status
    protocolos_por_status = ProtocoloDocumento.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Protocolos com prazo vencido
    protocolos_vencidos = ProtocoloDocumento.objects.filter(
        prazo_resposta__lt=timezone.now(),
        status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
    ).count()
    
    # Protocolos próximos ao vencimento (3 dias)
    limite_vencimento = timezone.now() + timedelta(days=3)
    protocolos_prox_vencimento = ProtocoloDocumento.objects.filter(
        prazo_resposta__lte=limite_vencimento,
        prazo_resposta__gte=timezone.now(),
        status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
    ).count()
    
    # Protocolos por setor
    protocolos_por_setor = ProtocoloDocumento.objects.values(
        'setor_atual__nome', 'setor_atual__sigla'
    ).annotate(count=Count('id')).order_by('-count')[:10]
    
    # Últimos protocolos
    ultimos_protocolos = ProtocoloDocumento.objects.select_related(
        'tipo_documento', 'setor_atual'
    ).order_by('-data_protocolo')[:10]
    
    # Tramitações pendentes
    tramitacoes_pendentes = TramitacaoDocumento.objects.filter(
        data_recebimento__isnull=True
    ).select_related('protocolo', 'setor_destino').order_by('-data_tramitacao')[:10]
    
    context = {
        'total_protocolos': total_protocolos,
        'protocolos_hoje': protocolos_hoje,
        'protocolos_por_status': protocolos_por_status,
        'protocolos_vencidos': protocolos_vencidos,
        'protocolos_prox_vencimento': protocolos_prox_vencimento,
        'protocolos_por_setor': protocolos_por_setor,
        'ultimos_protocolos': ultimos_protocolos,
        'tramitacoes_pendentes': tramitacoes_pendentes,
    }
    
    return render(request, 'protocolo_tramitacao/dashboard.html', context)


@login_required
def protocolar_documento(request):
    """Formulário para protocolar novo documento"""
    if request.method == 'POST':
        # Lógica para salvar novo protocolo
        try:
            # Aqui implementaria a lógica de salvamento
            messages.success(request, 'Documento protocolado com sucesso!')
            return redirect('protocolo_tramitacao:dashboard')
        except Exception as e:
            messages.error(request, f'Erro ao protocolar documento: {str(e)}')
    
    # Dados para o formulário
    tipos_documento = TipoDocumento.objects.filter(ativo=True)
    setores = Setor.objects.filter(ativo=True, pode_protocolar=True)
    
    context = {
        'tipos_documento': tipos_documento,
        'setores': setores,
    }
    
    return render(request, 'protocolo_tramitacao/protocolar.html', context)


@login_required
def consultar_protocolo(request):
    """Consulta de protocolos com filtros"""
    protocolos = ProtocoloDocumento.objects.select_related(
        'tipo_documento', 'setor_atual', 'protocolado_por'
    ).order_by('-data_protocolo')
    
    # Filtros
    numero = request.GET.get('numero')
    status = request.GET.get('status')
    setor = request.GET.get('setor')
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    
    if numero:
        protocolos = protocolos.filter(numero_protocolo__icontains=numero)
    
    if status:
        protocolos = protocolos.filter(status=status)
    
    if setor:
        protocolos = protocolos.filter(setor_atual_id=setor)
    
    if data_inicio:
        protocolos = protocolos.filter(data_protocolo__date__gte=data_inicio)
    
    if data_fim:
        protocolos = protocolos.filter(data_protocolo__date__lte=data_fim)
    
    # Paginação
    paginator = Paginator(protocolos, 20)
    page = request.GET.get('page')
    protocolos_paginados = paginator.get_page(page)
    
    # Dados para filtros
    setores = Setor.objects.filter(ativo=True)
    status_choices = ProtocoloDocumento.STATUS_CHOICES
    
    context = {
        'protocolos': protocolos_paginados,
        'setores': setores,
        'status_choices': status_choices,
        'filtros': {
            'numero': numero,
            'status': status,
            'setor': setor,
            'data_inicio': data_inicio,
            'data_fim': data_fim,
        }
    }
    
    return render(request, 'protocolo_tramitacao/consultar.html', context)


@login_required
def detalhe_protocolo(request, numero):
    """Detalhes de um protocolo específico"""
    protocolo = get_object_or_404(ProtocoloDocumento, numero_protocolo=numero)
    
    # Histórico de tramitação
    tramitacoes = protocolo.tramitacoes.select_related(
        'setor_origem', 'setor_destino', 'usuario'
    ).order_by('-data_tramitacao')
    
    # Anexos
    anexos = protocolo.anexos.select_related('uploaded_by')
    
    context = {
        'protocolo': protocolo,
        'tramitacoes': tramitacoes,
        'anexos': anexos,
    }
    
    return render(request, 'protocolo_tramitacao/detalhe.html', context)


@login_required
def tramitar_documento(request, protocolo_id):
    """Tramitar documento para outro setor"""
    protocolo = get_object_or_404(ProtocoloDocumento, id=protocolo_id)
    
    if request.method == 'POST':
        # Lógica para tramitar documento
        try:
            # Aqui implementaria a lógica de tramitação
            messages.success(request, 'Documento tramitado com sucesso!')
            return redirect('protocolo_tramitacao:detalhe', numero=protocolo.numero_protocolo)
        except Exception as e:
            messages.error(request, f'Erro ao tramitar documento: {str(e)}')
    
    setores = Setor.objects.filter(ativo=True, pode_tramitar=True).exclude(
        id=protocolo.setor_atual_id
    )
    
    context = {
        'protocolo': protocolo,
        'setores': setores,
    }
    
    return render(request, 'protocolo_tramitacao/tramitar.html', context)


@login_required
def receber_documento(request, tramitacao_id):
    """Receber documento tramitado"""
    tramitacao = get_object_or_404(TramitacaoDocumento, id=tramitacao_id)
    
    if request.method == 'POST':
        try:
            tramitacao.data_recebimento = timezone.now()
            tramitacao.recebido_por = request.user
            tramitacao.save()
            
            # Atualizar protocolo
            protocolo = tramitacao.protocolo
            protocolo.setor_atual = tramitacao.setor_destino
            protocolo.status = 'EM_TRAMITACAO'
            protocolo.save()
            
            messages.success(request, 'Documento recebido com sucesso!')
            return redirect('protocolo_tramitacao:dashboard')
        except Exception as e:
            messages.error(request, f'Erro ao receber documento: {str(e)}')
    
    context = {
        'tramitacao': tramitacao,
    }
    
    return render(request, 'protocolo_tramitacao/receber.html', context)


@login_required
def relatorios_view(request):
    """Página de relatórios"""
    return render(request, 'protocolo_tramitacao/relatorios.html')


def relatorio_por_setor(request):
    """Relatório de protocolos por setor"""
    relatorio = ProtocoloDocumento.objects.values(
        'setor_atual__nome', 'setor_atual__sigla'
    ).annotate(
        total=Count('id'),
        protocolados=Count('id', filter=Q(status='PROTOCOLADO')),
        em_tramitacao=Count('id', filter=Q(status='EM_TRAMITACAO')),
        finalizados=Count('id', filter=Q(status__in=['DECIDIDO', 'ARQUIVADO']))
    ).order_by('-total')
    
    return JsonResponse(list(relatorio), safe=False)


def relatorio_por_status(request):
    """Relatório de protocolos por status"""
    relatorio = ProtocoloDocumento.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    return JsonResponse(list(relatorio), safe=False)


def relatorio_por_prazo(request):
    """Relatório de protocolos por situação de prazo"""
    hoje = timezone.now()
    
    vencidos = ProtocoloDocumento.objects.filter(
        prazo_resposta__lt=hoje,
        status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
    ).count()
    
    prox_vencimento = ProtocoloDocumento.objects.filter(
        prazo_resposta__lte=hoje + timedelta(days=3),
        prazo_resposta__gte=hoje,
        status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
    ).count()
    
    no_prazo = ProtocoloDocumento.objects.filter(
        prazo_resposta__gt=hoje + timedelta(days=3),
        status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
    ).count()
    
    relatorio = [
        {'situacao': 'Vencidos', 'count': vencidos},
        {'situacao': 'Próximos ao Vencimento', 'count': prox_vencimento},
        {'situacao': 'No Prazo', 'count': no_prazo},
    ]
    
    return JsonResponse(relatorio, safe=False)


# === API VIEWSETS ===

class ProtocoloDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para API de Protocolos"""
    queryset = ProtocoloDocumento.objects.select_related(
        'tipo_documento', 'setor_atual', 'setor_origem', 'protocolado_por'
    ).order_by('-data_protocolo')
    serializer_class = ProtocoloDocumentoSerializer
    
    @action(detail=True, methods=['post'])
    def tramitar(self, request, pk=None):
        """Endpoint para tramitar protocolo"""
        protocolo = self.get_object()
        # Implementar lógica de tramitação
        return Response({'status': 'Protocolo tramitado com sucesso'})
    
    @action(detail=False)
    def vencidos(self, request):
        """Protocolos com prazo vencido"""
        vencidos = self.queryset.filter(
            prazo_resposta__lt=timezone.now(),
            status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
        )
        serializer = self.get_serializer(vencidos, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def prox_vencimento(self, request):
        """Protocolos próximos ao vencimento"""
        limite = timezone.now() + timedelta(days=3)
        proximos = self.queryset.filter(
            prazo_resposta__lte=limite,
            prazo_resposta__gte=timezone.now(),
            status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
        )
        serializer = self.get_serializer(proximos, many=True)
        return Response(serializer.data)


class TipoDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para API de Tipos de Documento"""
    queryset = TipoDocumento.objects.filter(ativo=True).order_by('nome')
    serializer_class = TipoDocumentoSerializer


class SetorViewSet(viewsets.ModelViewSet):
    """ViewSet para API de Setores"""
    queryset = Setor.objects.filter(ativo=True).order_by('nome')
    serializer_class = SetorSerializer


class TramitacaoDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para API de Tramitações"""
    queryset = TramitacaoDocumento.objects.select_related(
        'protocolo', 'setor_origem', 'setor_destino', 'usuario'
    ).order_by('-data_tramitacao')
    serializer_class = TramitacaoDocumentoSerializer
    
    @action(detail=False)
    def pendentes(self, request):
        """Tramitações pendentes de recebimento"""
        pendentes = self.queryset.filter(data_recebimento__isnull=True)
        serializer = self.get_serializer(pendentes, many=True)
        return Response(serializer.data)


class AnexoProtocoloViewSet(viewsets.ModelViewSet):
    """ViewSet para API de Anexos"""
    queryset = AnexoProtocolo.objects.select_related(
        'protocolo', 'uploaded_by'
    ).order_by('-upload_em')
    serializer_class = AnexoProtocoloSerializer


# === API VIEWS ESPECÍFICAS ===

class EstatisticasAPIView(APIView):
    """API para estatísticas do dashboard"""
    
    def get(self, request):
        hoje = timezone.now()
        
        stats = {
            'total_protocolos': ProtocoloDocumento.objects.count(),
            'protocolos_hoje': ProtocoloDocumento.objects.filter(
                data_protocolo__date=hoje.date()
            ).count(),
            'protocolos_vencidos': ProtocoloDocumento.objects.filter(
                prazo_resposta__lt=hoje,
                status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
            ).count(),
            'protocolos_prox_vencimento': ProtocoloDocumento.objects.filter(
                prazo_resposta__lte=hoje + timedelta(days=3),
                prazo_resposta__gte=hoje,
                status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
            ).count(),
            'tramitacoes_pendentes': TramitacaoDocumento.objects.filter(
                data_recebimento__isnull=True
            ).count(),
        }
        
        return Response(stats)


class PendenciasAPIView(APIView):
    """API para pendências do usuário logado"""
    
    def get(self, request):
        # Protocolos no setor do usuário (simulando setor do usuário)
        # Em produção, associar usuário ao setor
        pendencias = ProtocoloDocumento.objects.filter(
            status__in=['EM_TRAMITACAO', 'AGUARDANDO_ANALISE']
        ).count()
        
        return Response({'pendencias': pendencias})


class TramitacoesPendentesAPIView(APIView):
    """API para tramitações pendentes de recebimento"""
    
    def get(self, request):
        tramitacoes = TramitacaoDocumento.objects.filter(
            data_recebimento__isnull=True
        ).select_related(
            'protocolo', 'setor_origem', 'setor_destino'
        ).order_by('-data_tramitacao')[:10]
        
        data = []
        for t in tramitacoes:
            data.append({
                'id': t.id,
                'protocolo': t.protocolo.numero_protocolo,
                'assunto': t.protocolo.assunto,
                'setor_origem': t.setor_origem.nome,
                'setor_destino': t.setor_destino.nome,
                'data_tramitacao': t.data_tramitacao.strftime('%d/%m/%Y %H:%M'),
                'motivo': t.motivo,
            })
        
        return Response(data)
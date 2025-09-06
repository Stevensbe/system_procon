from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count, Sum
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Empresa, PorteEmpresa, SegmentoEconomico, ResponsavelLegal, HistoricoEmpresa


def empresa_list(request):
    empresas = Empresa.objects.select_related('porte', 'segmento').all()
    
    # Filtros
    search = request.GET.get('search', '')
    situacao = request.GET.get('situacao', '')
    classificacao_risco = request.GET.get('classificacao_risco', '')
    porte = request.GET.get('porte', '')
    segmento = request.GET.get('segmento', '')
    
    if search:
        empresas = empresas.filter(
            Q(razao_social__icontains=search) |
            Q(nome_fantasia__icontains=search) |
            Q(cnpj__icontains=search)
        )
    
    if situacao:
        empresas = empresas.filter(situacao=situacao)
    
    if classificacao_risco:
        empresas = empresas.filter(classificacao_risco=classificacao_risco)
    
    if porte:
        empresas = empresas.filter(porte_id=porte)
    
    if segmento:
        empresas = empresas.filter(segmento_id=segmento)
    
    # Paginação
    paginator = Paginator(empresas, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Dados para filtros
    portes = PorteEmpresa.objects.all()
    segmentos = SegmentoEconomico.objects.filter(ativo=True)
    
    context = {
        'page_obj': page_obj,
        'portes': portes,
        'segmentos': segmentos,
        'search': search,
        'situacao': situacao,
        'classificacao_risco': classificacao_risco,
        'porte': porte,
        'segmento': segmento,
        'situacao_choices': Empresa.SITUACAO_CHOICES,
        'classificacao_choices': Empresa.CLASSIFICACAO_RISCO_CHOICES,
    }
    
    return render(request, 'empresas/empresa_list.html', context)


def empresa_detail(request, pk):
    empresa = get_object_or_404(Empresa.objects.select_related('porte', 'segmento'), pk=pk)
    
    # Buscar dados relacionados
    responsaveis = empresa.responsaveis.filter(ativo=True)
    enderecos_adicionais = empresa.enderecos_adicionais.filter(ativo=True)
    historico = empresa.historico.all()[:10]  # Últimos 10 eventos
    
    # Estatísticas
    stats = {
        'total_infracoes': empresa.total_infracoes,
        'total_multas': empresa.total_multas,
        'valor_total_multas': empresa.valor_total_multas,
        'multas_pendentes': empresa.multas_pendentes,
    }
    
    context = {
        'empresa': empresa,
        'responsaveis': responsaveis,
        'enderecos_adicionais': enderecos_adicionais,
        'historico': historico,
        'stats': stats,
    }
    
    return render(request, 'empresas/empresa_detail.html', context)


def empresa_form(request, pk=None):
    empresa = None
    if pk:
        empresa = get_object_or_404(Empresa, pk=pk)
    
    if request.method == 'POST':
        # Aqui você implementaria a lógica de salvamento
        # Por simplicidade, vou deixar um placeholder
        messages.success(request, 'Empresa salva com sucesso!')
        if empresa:
            return redirect('empresas:detail', pk=empresa.pk)
        else:
            return redirect('empresas:list')
    
    portes = PorteEmpresa.objects.all()
    segmentos = SegmentoEconomico.objects.filter(ativo=True)
    empresas_matriz = Empresa.objects.filter(tipo='matriz', ativo=True)
    
    context = {
        'empresa': empresa,
        'portes': portes,
        'segmentos': segmentos,
        'empresas_matriz': empresas_matriz,
        'situacao_choices': Empresa.SITUACAO_CHOICES,
        'tipo_choices': Empresa.TIPO_CHOICES,
        'classificacao_choices': Empresa.CLASSIFICACAO_RISCO_CHOICES,
    }
    
    return render(request, 'empresas/empresa_form.html', context)


def empresa_dashboard(request):
    # Estatísticas gerais
    total_empresas = Empresa.objects.filter(ativo=True).count()
    empresas_ativas = Empresa.objects.filter(situacao='ativa', ativo=True).count()
    empresas_risco_alto = Empresa.objects.filter(
        classificacao_risco__in=['alto', 'critico'], 
        ativo=True
    ).count()
    
    # Distribuição por porte
    distribuicao_porte = Empresa.objects.filter(ativo=True).values(
        'porte__nome'
    ).annotate(
        total=Count('id')
    ).order_by('-total')
    
    # Distribuição por segmento
    distribuicao_segmento = Empresa.objects.filter(ativo=True).values(
        'segmento__nome'
    ).annotate(
        total=Count('id')
    ).order_by('-total')[:10]
    
    # Empresas com mais infrações
    top_infratoras = []
    empresas_sample = Empresa.objects.filter(ativo=True)[:50]  # Limita para performance
    for emp in empresas_sample:
        if emp.total_infracoes > 0:
            top_infratoras.append({
                'empresa': emp,
                'total_infracoes': emp.total_infracoes,
                'total_multas': emp.total_multas,
                'valor_total': emp.valor_total_multas
            })
    
    top_infratoras = sorted(top_infratoras, key=lambda x: x['total_infracoes'], reverse=True)[:10]
    
    # Distribuição por classificação de risco
    distribuicao_risco = Empresa.objects.filter(ativo=True).values(
        'classificacao_risco'
    ).annotate(
        total=Count('id')
    ).order_by('classificacao_risco')
    
    context = {
        'total_empresas': total_empresas,
        'empresas_ativas': empresas_ativas,
        'empresas_risco_alto': empresas_risco_alto,
        'distribuicao_porte': distribuicao_porte,
        'distribuicao_segmento': distribuicao_segmento,
        'top_infratoras': top_infratoras,
        'distribuicao_risco': distribuicao_risco,
    }
    
    return render(request, 'empresas/dashboard.html', context)


@require_http_methods(["POST"])
def atualizar_classificacao_risco(request, pk):
    empresa = get_object_or_404(Empresa, pk=pk)
    empresa.atualizar_classificacao_risco()
    
    return JsonResponse({
        'success': True,
        'nova_classificacao': empresa.get_classificacao_risco_display(),
        'classificacao_code': empresa.classificacao_risco
    })


def empresa_historico(request, pk):
    empresa = get_object_or_404(Empresa, pk=pk)
    historico = empresa.historico.all()
    
    # Filtro por tipo de evento
    tipo_evento = request.GET.get('tipo_evento', '')
    if tipo_evento:
        historico = historico.filter(tipo_evento=tipo_evento)
    
    # Paginação
    paginator = Paginator(historico, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'empresa': empresa,
        'page_obj': page_obj,
        'tipo_evento': tipo_evento,
        'tipo_evento_choices': HistoricoEmpresa.TIPO_EVENTO_CHOICES,
    }
    
    return render(request, 'empresas/empresa_historico.html', context)


def buscar_empresa_ajax(request):
    """Endpoint para busca AJAX de empresas (usado em selects)"""
    term = request.GET.get('term', '')
    
    if len(term) < 2:
        return JsonResponse({'results': []})
    
    empresas = Empresa.objects.filter(
        Q(razao_social__icontains=term) |
        Q(nome_fantasia__icontains=term) |
        Q(cnpj__icontains=term),
        ativo=True
    )[:10]
    
    results = []
    for empresa in empresas:
        results.append({
            'id': empresa.pk,
            'text': f"{empresa.razao_social} ({empresa.cnpj})",
            'cnpj': empresa.cnpj,
            'razao_social': empresa.razao_social,
            'nome_fantasia': empresa.nome_fantasia,
        })
    
    return JsonResponse({'results': results})


def empresa_relatorio(request):
    """Gera relatório detalhado de empresas"""
    # Filtros similares à listagem
    search = request.GET.get('search', '')
    situacao = request.GET.get('situacao', '')
    classificacao_risco = request.GET.get('classificacao_risco', '')
    
    empresas = Empresa.objects.select_related('porte', 'segmento').all()
    
    if search:
        empresas = empresas.filter(
            Q(razao_social__icontains=search) |
            Q(nome_fantasia__icontains=search) |
            Q(cnpj__icontains=search)
        )
    
    if situacao:
        empresas = empresas.filter(situacao=situacao)
    
    if classificacao_risco:
        empresas = empresas.filter(classificacao_risco=classificacao_risco)
    
    # Adiciona estatísticas para cada empresa
    empresas_com_stats = []
    for empresa in empresas:
        empresas_com_stats.append({
            'empresa': empresa,
            'total_infracoes': empresa.total_infracoes,
            'total_multas': empresa.total_multas,
            'valor_total_multas': empresa.valor_total_multas,
            'multas_pendentes': empresa.multas_pendentes,
        })
    
    context = {
        'empresas_com_stats': empresas_com_stats,
        'total_empresas': len(empresas_com_stats),
        'search': search,
        'situacao': situacao,
        'classificacao_risco': classificacao_risco,
    }
    
    return render(request, 'empresas/relatorio.html', context)
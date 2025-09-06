from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime, timedelta

from .models import (
    ConsultaPublica, EmpresaPublica, ProcessoPublico, 
    RankingPublico, MonitoramentoPrecos, RestricaoEmpresa
)


def registrar_consulta(request, tipo_consulta, termo_pesquisado, resultados_encontrados):
    """Registra uma consulta pública para estatísticas"""
    try:
        ConsultaPublica.objects.create(
            ip_consultante=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            tipo_consulta=tipo_consulta,
            termo_pesquisado=termo_pesquisado[:255],
            resultados_encontrados=resultados_encontrados
        )
    except Exception:
        pass  # Não falhar se não conseguir registrar


def home(request):
    """Página inicial da consulta pública"""
    # Estatísticas para a home
    hoje = timezone.now().date()
    mes_atual = hoje.replace(day=1)
    
    stats = {
        'total_empresas': EmpresaPublica.objects.filter(ativo=True).count(),
        'empresas_regulares': EmpresaPublica.objects.filter(situacao_publica='regular').count(),
        'empresas_com_restricoes': EmpresaPublica.objects.filter(situacao_publica='com_restricoes').count(),
        'processos_mes': ProcessoPublico.objects.filter(
            data_auto__gte=mes_atual,
            visivel_publico=True
        ).count(),
        'consultas_hoje': ConsultaPublica.objects.filter(data_consulta__date=hoje).count(),
    }
    
    # Rankings recentes
    ranking_recente = RankingPublico.objects.filter(ativo=True).order_by('-data_referencia').first()
    
    # Preços monitorados recentes
    precos_recentes = MonitoramentoPrecos.objects.filter(
        ativo=True, publicar=True
    ).order_by('-data_pesquisa')[:5]
    
    # Restrições ativas
    restricoes_ativas = RestricaoEmpresa.objects.filter(
        ativa=True, publicar=True
    ).count()
    
    context = {
        'stats': stats,
        'ranking_recente': ranking_recente,
        'precos_recentes': precos_recentes,
        'restricoes_ativas': restricoes_ativas,
    }
    
    return render(request, 'consulta_publica/home.html', context)


def consultar_empresas(request):
    """Consulta pública de empresas"""
    empresas = EmpresaPublica.objects.filter(ativo=True)
    
    # Filtros
    search = request.GET.get('search', '')
    situacao = request.GET.get('situacao', '')
    cidade = request.GET.get('cidade', '')
    segmento = request.GET.get('segmento', '')
    
    if search:
        empresas = empresas.filter(
            Q(razao_social__icontains=search) |
            Q(nome_fantasia__icontains=search) |
            Q(cnpj__icontains=search.replace('.', '').replace('/', '').replace('-', ''))
        )
    
    if situacao:
        empresas = empresas.filter(situacao_publica=situacao)
    
    if cidade:
        empresas = empresas.filter(cidade__icontains=cidade)
    
    if segmento:
        empresas = empresas.filter(segmento__icontains=segmento)
    
    # Paginação
    paginator = Paginator(empresas, 20)
    page = request.GET.get('page')
    empresas_paginadas = paginator.get_page(page)
    
    # Registrar consulta
    if search:
        registrar_consulta(request, 'empresa', search, empresas.count())
    
    # Dados para filtros
    cidades = EmpresaPublica.objects.filter(ativo=True).values_list('cidade', flat=True).distinct().order_by('cidade')
    segmentos = EmpresaPublica.objects.filter(ativo=True).values_list('segmento', flat=True).distinct().order_by('segmento')
    
    context = {
        'empresas': empresas_paginadas,
        'search': search,
        'situacao': situacao,
        'cidade': cidade,
        'segmento': segmento,
        'cidades': [c for c in cidades if c],
        'segmentos': [s for s in segmentos if s],
        'situacoes': EmpresaPublica._meta.get_field('situacao_publica').choices,
        'total_encontradas': empresas.count(),
    }
    
    return render(request, 'consulta_publica/empresas.html', context)


def empresa_detalhes(request, cnpj):
    """Detalhes públicos de uma empresa"""
    empresa = get_object_or_404(EmpresaPublica, cnpj=cnpj, ativo=True)
    
    # Processos públicos da empresa
    processos = ProcessoPublico.objects.filter(
        empresa_cnpj=cnpj,
        visivel_publico=True
    ).order_by('-data_auto')[:10]
    
    # Restrições ativas
    restricoes = RestricaoEmpresa.objects.filter(
        empresa_cnpj=cnpj,
        ativa=True,
        publicar=True
    ).order_by('-data_restricao')
    
    # Registrar consulta
    registrar_consulta(request, 'empresa', empresa.razao_social, 1)
    
    context = {
        'empresa': empresa,
        'processos': processos,
        'restricoes': restricoes,
    }
    
    return render(request, 'consulta_publica/empresa_detalhes.html', context)


def consultar_processos(request):
    """Consulta pública de processos"""
    processos = ProcessoPublico.objects.filter(visivel_publico=True)
    
    # Filtros
    search = request.GET.get('search', '')
    status = request.GET.get('status', '')
    tipo_auto = request.GET.get('tipo_auto', '')
    data_inicio = request.GET.get('data_inicio', '')
    data_fim = request.GET.get('data_fim', '')
    
    if search:
        processos = processos.filter(
            Q(numero_processo__icontains=search) |
            Q(empresa_nome__icontains=search) |
            Q(empresa_cnpj__icontains=search.replace('.', '').replace('/', '').replace('-', ''))
        )
    
    if status:
        processos = processos.filter(status_publico=status)
    
    if tipo_auto:
        processos = processos.filter(tipo_auto__icontains=tipo_auto)
    
    if data_inicio:
        processos = processos.filter(data_auto__gte=data_inicio)
    
    if data_fim:
        processos = processos.filter(data_auto__lte=data_fim)
    
    # Ordenação
    processos = processos.order_by('-data_auto')
    
    # Paginação
    paginator = Paginator(processos, 15)
    page = request.GET.get('page')
    processos_paginados = paginator.get_page(page)
    
    # Registrar consulta
    if search:
        registrar_consulta(request, 'processo', search, processos.count())
    
    # Dados para filtros
    tipos_auto = ProcessoPublico.objects.filter(visivel_publico=True).values_list('tipo_auto', flat=True).distinct().order_by('tipo_auto')
    
    context = {
        'processos': processos_paginados,
        'search': search,
        'status': status,
        'tipo_auto': tipo_auto,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
        'tipos_auto': tipos_auto,
        'status_choices': ProcessoPublico.STATUS_PUBLICO_CHOICES,
        'total_encontrados': processos.count(),
    }
    
    return render(request, 'consulta_publica/processos.html', context)


def processo_detalhes(request, numero_processo):
    """Detalhes públicos de um processo"""
    processo = get_object_or_404(ProcessoPublico, numero_processo=numero_processo, visivel_publico=True)
    
    # Registrar consulta
    registrar_consulta(request, 'processo', numero_processo, 1)
    
    context = {
        'processo': processo,
    }
    
    return render(request, 'consulta_publica/processo_detalhes.html', context)


def ranking_empresas(request):
    """Rankings públicos de empresas"""
    # Filtros
    tipo_ranking = request.GET.get('tipo', 'mais_infracoes')
    periodo = request.GET.get('periodo', 'anual')
    
    # Busca ranking mais recente
    ranking = RankingPublico.objects.filter(
        tipo_ranking=tipo_ranking,
        periodo=periodo,
        ativo=True
    ).order_by('-data_referencia').first()
    
    # Se não encontrou, pega qualquer ranking recente
    if not ranking:
        ranking = RankingPublico.objects.filter(ativo=True).order_by('-data_referencia').first()
    
    # Dados do ranking
    dados_ranking = []
    if ranking and ranking.dados_ranking:
        try:
            dados_ranking = json.loads(ranking.dados_ranking)
        except (json.JSONDecodeError, TypeError):
            dados_ranking = []
    
    # Registrar consulta
    registrar_consulta(request, 'ranking', f'{tipo_ranking}_{periodo}', len(dados_ranking))
    
    # Todos os rankings disponíveis
    rankings_disponiveis = RankingPublico.objects.filter(ativo=True).order_by('-data_referencia')[:12]
    
    context = {
        'ranking': ranking,
        'dados_ranking': dados_ranking,
        'tipo_ranking': tipo_ranking,
        'periodo': periodo,
        'rankings_disponiveis': rankings_disponiveis,
        'tipos_ranking': RankingPublico.TIPO_RANKING_CHOICES,
        'periodos': RankingPublico.PERIODO_CHOICES,
    }
    
    return render(request, 'consulta_publica/ranking.html', context)


def monitoramento_precos(request):
    """Monitoramento público de preços"""
    precos = MonitoramentoPrecos.objects.filter(ativo=True, publicar=True)
    
    # Filtros
    categoria = request.GET.get('categoria', '')
    produto = request.GET.get('produto', '')
    regiao = request.GET.get('regiao', '')
    
    if categoria:
        precos = precos.filter(categoria=categoria)
    
    if produto:
        precos = precos.filter(produto__icontains=produto)
    
    if regiao:
        precos = precos.filter(regiao__icontains=regiao)
    
    # Ordenação
    precos = precos.order_by('-data_pesquisa', 'categoria', 'produto')
    
    # Paginação
    paginator = Paginator(precos, 20)
    page = request.GET.get('page')
    precos_paginados = paginator.get_page(page)
    
    # Registrar consulta
    if produto:
        registrar_consulta(request, 'precos', produto, precos.count())
    
    # Dados para filtros
    regioes = MonitoramentoPrecos.objects.filter(ativo=True, publicar=True).values_list('regiao', flat=True).distinct().order_by('regiao')
    
    # Estatísticas por categoria
    stats_categorias = precos.values('categoria').annotate(
        total_produtos=Count('id'),
        preco_medio_geral=Avg('preco_medio')
    ).order_by('categoria')
    
    context = {
        'precos': precos_paginados,
        'categoria': categoria,
        'produto': produto,
        'regiao': regiao,
        'categorias': MonitoramentoPrecos.CATEGORIA_CHOICES,
        'regioes': regioes,
        'stats_categorias': stats_categorias,
        'total_encontrados': precos.count(),
    }
    
    return render(request, 'consulta_publica/precos.html', context)


def consultar_restricoes(request):
    """Consulta pública de restrições"""
    restricoes = RestricaoEmpresa.objects.filter(ativa=True, publicar=True)
    
    # Filtros
    search = request.GET.get('search', '')
    tipo_restricao = request.GET.get('tipo', '')
    nivel = request.GET.get('nivel', '')
    
    if search:
        restricoes = restricoes.filter(
            Q(empresa_nome__icontains=search) |
            Q(empresa_cnpj__icontains=search.replace('.', '').replace('/', '').replace('-', '')) |
            Q(descricao__icontains=search)
        )
    
    if tipo_restricao:
        restricoes = restricoes.filter(tipo_restricao=tipo_restricao)
    
    if nivel:
        restricoes = restricoes.filter(nivel_severidade=nivel)
    
    # Remove restrições vencidas
    restricoes = [r for r in restricoes if not r.esta_vencida]
    
    # Converte de volta para QuerySet simples para paginação
    restricoes_ids = [r.id for r in restricoes]
    restricoes = RestricaoEmpresa.objects.filter(id__in=restricoes_ids).order_by('-data_restricao')
    
    # Paginação
    paginator = Paginator(restricoes, 15)
    page = request.GET.get('page')
    restricoes_paginadas = paginator.get_page(page)
    
    # Registrar consulta
    if search:
        registrar_consulta(request, 'restricoes', search, restricoes.count())
    
    # Estatísticas
    stats = {
        'total_restricoes': restricoes.count(),
        'por_tipo': restricoes.values('tipo_restricao').annotate(count=Count('id')),
        'por_nivel': restricoes.values('nivel_severidade').annotate(count=Count('id')),
    }
    
    context = {
        'restricoes': restricoes_paginadas,
        'search': search,
        'tipo_restricao': tipo_restricao,
        'nivel': nivel,
        'tipos_restricao': RestricaoEmpresa.TIPO_RESTRICAO_CHOICES,
        'niveis': [('baixo', 'Baixo'), ('medio', 'Médio'), ('alto', 'Alto')],
        'stats': stats,
        'total_encontradas': restricoes.count(),
    }
    
    return render(request, 'consulta_publica/restricoes.html', context)


# === APIs PÚBLICAS ===

@require_http_methods(["GET"])
def api_busca_empresa(request):
    """API para busca rápida de empresas"""
    search = request.GET.get('q', '')
    
    if len(search) < 3:
        return JsonResponse({'empresas': []})
    
    empresas = EmpresaPublica.objects.filter(
        Q(razao_social__icontains=search) |
        Q(nome_fantasia__icontains=search) |
        Q(cnpj__icontains=search.replace('.', '').replace('/', '').replace('-', '')),
        ativo=True
    )[:10]
    
    data = [{
        'cnpj': e.cnpj,
        'razao_social': e.razao_social,
        'nome_fantasia': e.nome_fantasia,
        'cidade': e.cidade,
        'situacao': e.get_situacao_publica_display(),
        'total_processos': e.total_processos,
    } for e in empresas]
    
    return JsonResponse({'empresas': data})


@require_http_methods(["GET"])
def api_estatisticas(request):
    """API com estatísticas públicas gerais"""
    hoje = timezone.now().date()
    mes_atual = hoje.replace(day=1)
    
    stats = {
        'empresas': {
            'total': EmpresaPublica.objects.filter(ativo=True).count(),
            'regulares': EmpresaPublica.objects.filter(situacao_publica='regular').count(),
            'com_restricoes': EmpresaPublica.objects.filter(situacao_publica='com_restricoes').count(),
        },
        'processos': {
            'total': ProcessoPublico.objects.filter(visivel_publico=True).count(),
            'em_andamento': ProcessoPublico.objects.filter(status_publico='em_andamento').count(),
            'mes_atual': ProcessoPublico.objects.filter(
                data_auto__gte=mes_atual,
                visivel_publico=True
            ).count(),
        },
        'restricoes': {
            'ativas': RestricaoEmpresa.objects.filter(ativa=True, publicar=True).count(),
            'alto_risco': RestricaoEmpresa.objects.filter(
                ativa=True, publicar=True, nivel_severidade='alto'
            ).count(),
        },
        'consultas': {
            'hoje': ConsultaPublica.objects.filter(data_consulta__date=hoje).count(),
            'mes': ConsultaPublica.objects.filter(data_consulta__gte=mes_atual).count(),
        }
    }
    
    return JsonResponse(stats)


@csrf_exempt
def atualizar_dados_publicos(request):
    """Endpoint para atualizar dados públicos (uso interno)"""
    if request.method == 'POST':
        try:
            # Atualizar dados das empresas
            EmpresaPublica.atualizar_dados_publicos()
            
            return JsonResponse({
                'success': True,
                'message': 'Dados públicos atualizados com sucesso'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Método não permitido'}, status=405)
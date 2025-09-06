from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count, Avg, Sum, Min, Max
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    Produto, CategoriaProduto, Fabricante, RegistroPreco,
    ProdutoInutilizado, FotoProdutoInutilizado, ControleEstoque
)


# === VIEWS DE PRODUTOS ===

def produto_list(request):
    """Lista de produtos com filtros e paginação"""
    produtos = Produto.objects.select_related('categoria', 'fabricante').filter(ativo=True)
    
    # Filtros
    search = request.GET.get('search')
    categoria_id = request.GET.get('categoria')
    fabricante_id = request.GET.get('fabricante')
    classificacao = request.GET.get('classificacao')
    
    if search:
        produtos = produtos.filter(
            Q(nome__icontains=search) |
            Q(codigo_interno__icontains=search) |
            Q(codigo_barras__icontains=search)
        )
    
    if categoria_id:
        produtos = produtos.filter(categoria_id=categoria_id)
    
    if fabricante_id:
        produtos = produtos.filter(fabricante_id=fabricante_id)
    
    if classificacao:
        produtos = produtos.filter(classificacao_risco=classificacao)
    
    # Estatísticas
    stats = {
        'total_produtos': produtos.count(),
        'por_classificacao': produtos.values('classificacao_risco').annotate(count=Count('id')),
        'produtos_vencidos': produtos.filter(tem_validade=True, descontinuado=True).count(),
        'produtos_criticos': produtos.filter(classificacao_risco='critico').count(),
    }
    
    # Paginação
    paginator = Paginator(produtos, 20)
    page = request.GET.get('page')
    produtos = paginator.get_page(page)
    
    # Dados para filtros
    categorias = CategoriaProduto.objects.filter(ativo=True).order_by('nome')
    fabricantes = Fabricante.objects.filter(ativo=True).order_by('nome')
    
    context = {
        'produtos': produtos,
        'categorias': categorias,
        'fabricantes': fabricantes,
        'stats': stats,
        'search': search,
        'categoria_id': categoria_id,
        'fabricante_id': fabricante_id,
        'classificacao': classificacao,
    }
    
    return render(request, 'produtos/produto_list.html', context)


def produto_detail(request, pk):
    """Detalhes do produto com histórico de preços"""
    produto = get_object_or_404(Produto, pk=pk)
    
    # Histórico de preços recentes
    registros_preco = produto.registros_preco.filter(ativo=True).order_by('-data_coleta')[:10]
    
    # Estatísticas de preços
    if registros_preco.exists():
        preco_stats = {
            'preco_medio': registros_preco.aggregate(media=Avg('preco'))['media'],
            'preco_min': registros_preco.aggregate(minimo=Min('preco'))['minimo'],
            'preco_max': registros_preco.aggregate(maximo=Max('preco'))['maximo'],
            'ultima_coleta': registros_preco.first().data_coleta,
        }
    else:
        preco_stats = None
    
    # Produtos inutilizados relacionados
    inutilizacoes = produto.produtoinutilizado_set.order_by('-data_inutilizacao')[:5]
    
    # Controle de estoque recente
    estoques = produto.controleestoque_set.order_by('-data_verificacao')[:5]
    
    context = {
        'produto': produto,
        'registros_preco': registros_preco,
        'preco_stats': preco_stats,
        'inutilizacoes': inutilizacoes,
        'estoques': estoques,
    }
    
    return render(request, 'produtos/produto_detail.html', context)


def produto_create(request):
    """Criar novo produto"""
    if request.method == 'POST':
        try:
            # Criar produto a partir dos dados do POST
            produto = Produto.objects.create(
                nome=request.POST['nome'],
                codigo_interno=request.POST['codigo_interno'],
                codigo_barras=request.POST.get('codigo_barras', ''),
                codigo_ncm=request.POST.get('codigo_ncm', ''),
                categoria_id=request.POST['categoria'],
                fabricante_id=request.POST.get('fabricante') or None,
                descricao=request.POST.get('descricao', ''),
                unidade_medida=request.POST.get('unidade_medida', 'un'),
                classificacao_risco=request.POST.get('classificacao_risco', 'baixo'),
                tem_validade=request.POST.get('tem_validade') == 'on',
                requer_licenca=request.POST.get('requer_licenca') == 'on',
                controlado_anvisa=request.POST.get('controlado_anvisa') == 'on',
                criado_por=request.user.username if request.user.is_authenticated else 'Sistema'
            )
            
            # Campos de preço opcionais
            if request.POST.get('preco_referencia'):
                produto.preco_referencia = float(request.POST['preco_referencia'])
            if request.POST.get('peso_liquido'):
                produto.peso_liquido = float(request.POST['peso_liquido'])
            
            produto.save()
            
            messages.success(request, f'Produto "{produto.nome}" criado com sucesso!')
            return redirect('produtos:produto_detail', pk=produto.pk)
            
        except Exception as e:
            messages.error(request, f'Erro ao criar produto: {str(e)}')
    
    # Dados para formulário
    categorias = CategoriaProduto.objects.filter(ativo=True).order_by('nome')
    fabricantes = Fabricante.objects.filter(ativo=True).order_by('nome')
    
    context = {
        'categorias': categorias,
        'fabricantes': fabricantes,
    }
    
    return render(request, 'produtos/produto_form.html', context)


# === VIEWS DE CATEGORIAS ===

def categoria_list(request):
    """Lista de categorias com hierarquia"""
    categorias = CategoriaProduto.objects.filter(ativo=True).order_by('ordem', 'nome')
    
    # Adicionar contagem de produtos por categoria
    categorias = categorias.annotate(total_produtos=Count('produto'))
    
    # Estatísticas
    stats = {
        'total_categorias': categorias.count(),
        'categorias_com_produtos': categorias.filter(total_produtos__gt=0).count(),
        'categoria_mais_produtos': categorias.order_by('-total_produtos').first(),
    }
    
    context = {
        'categorias': categorias,
        'stats': stats,
    }
    
    return render(request, 'produtos/categoria_list.html', context)


# === VIEWS DE PRODUTOS INUTILIZADOS ===

def produto_inutilizado_list(request):
    """Lista de produtos inutilizados"""
    inutilizacoes = ProdutoInutilizado.objects.select_related('produto').order_by('-data_inutilizacao')
    
    # Filtros
    search = request.GET.get('search')
    motivo = request.GET.get('motivo')
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    
    if search:
        inutilizacoes = inutilizacoes.filter(
            Q(produto__nome__icontains=search) |
            Q(estabelecimento_nome__icontains=search) |
            Q(numero_auto__icontains=search)
        )
    
    if motivo:
        inutilizacoes = inutilizacoes.filter(motivo=motivo)
    
    if data_inicio:
        inutilizacoes = inutilizacoes.filter(data_inutilizacao__gte=data_inicio)
    
    if data_fim:
        inutilizacoes = inutilizacoes.filter(data_inutilizacao__lte=data_fim)
    
    # Estatísticas
    stats = {
        'total_inutilizacoes': inutilizacoes.count(),
        'valor_total': inutilizacoes.aggregate(total=Sum('valor_estimado'))['total'] or 0,
        'por_motivo': inutilizacoes.values('motivo').annotate(count=Count('id')),
        'mes_atual': inutilizacoes.filter(
            data_inutilizacao__month=timezone.now().month,
            data_inutilizacao__year=timezone.now().year
        ).count(),
    }
    
    # Paginação
    paginator = Paginator(inutilizacoes, 15)
    page = request.GET.get('page')
    inutilizacoes = paginator.get_page(page)
    
    context = {
        'inutilizacoes': inutilizacoes,
        'stats': stats,
        'motivos': ProdutoInutilizado.MOTIVO_CHOICES,
        'search': search,
        'motivo': motivo,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
    }
    
    return render(request, 'produtos/inutilizados.html', context)


def criar_auto_inutilizacao(request):
    """Criar auto de inutilização"""
    if request.method == 'POST':
        try:
            inutilizacao = ProdutoInutilizado.objects.create(
                numero_auto=request.POST['numero_auto'],
                produto_id=request.POST['produto'],
                estabelecimento_nome=request.POST['estabelecimento_nome'],
                estabelecimento_cnpj=request.POST['estabelecimento_cnpj'],
                estabelecimento_endereco=request.POST['estabelecimento_endereco'],
                motivo=request.POST['motivo'],
                descricao_motivo=request.POST['descricao_motivo'],
                quantidade_inutilizada=float(request.POST['quantidade_inutilizada']),
                unidade=request.POST['unidade'],
                data_inutilizacao=request.POST['data_inutilizacao'],
                hora_inutilizacao=request.POST['hora_inutilizacao'],
                forma_inutilizacao=request.POST['forma_inutilizacao'],
                destino_produto=request.POST['destino_produto'],
                fiscal_responsavel=request.POST['fiscal_responsavel'],
                responsavel_estabelecimento=request.POST['responsavel_estabelecimento'],
                criado_por=request.user.username if request.user.is_authenticated else 'Sistema'
            )
            
            # Campos opcionais
            if request.POST.get('valor_estimado'):
                inutilizacao.valor_estimado = float(request.POST['valor_estimado'])
            if request.POST.get('lote'):
                inutilizacao.lote = request.POST['lote']
            if request.POST.get('data_validade'):
                inutilizacao.data_validade = request.POST['data_validade']
                
            inutilizacao.save()
            
            messages.success(request, f'Auto de inutilização {inutilizacao.numero_auto} criado com sucesso!')
            return redirect('produtos:produto_inutilizado_list')
            
        except Exception as e:
            messages.error(request, f'Erro ao criar auto de inutilização: {str(e)}')
    
    # Dados para formulário
    produtos = Produto.objects.filter(ativo=True).order_by('nome')
    
    context = {
        'produtos': produtos,
        'motivos': ProdutoInutilizado.MOTIVO_CHOICES,
        'destinos': ProdutoInutilizado.DESTINO_CHOICES,
    }
    
    return render(request, 'produtos/auto_inutilizacao.html', context)


# === VIEWS DE REGISTRO DE PREÇOS ===

def registro_precos(request):
    """Dashboard de preços com análises"""
    registros = RegistroPreco.objects.select_related('produto').filter(ativo=True)
    
    # Filtros
    produto_id = request.GET.get('produto')
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    
    if produto_id:
        registros = registros.filter(produto_id=produto_id)
    
    if data_inicio:
        registros = registros.filter(data_coleta__gte=data_inicio)
    
    if data_fim:
        registros = registros.filter(data_coleta__lte=data_fim)
    
    # Análise de preços por produto
    analise_precos = registros.values('produto__nome', 'produto_id').annotate(
        preco_medio=Avg('preco'),
        preco_min=Min('preco'),
        preco_max=Max('preco'),
        total_registros=Count('id'),
        variacao=Max('preco') - Min('preco')
    ).order_by('-variacao')[:20]
    
    # Estabelecimentos com mais registros
    estabelecimentos_ativos = registros.values('estabelecimento', 'cnpj_estabelecimento').annotate(
        total_registros=Count('id'),
        ultima_coleta=Max('data_coleta')
    ).order_by('-total_registros')[:10]
    
    # Estatísticas gerais
    stats = {
        'total_registros': registros.count(),
        'produtos_monitorados': registros.values('produto').distinct().count(),
        'estabelecimentos_ativos': registros.values('cnpj_estabelecimento').distinct().count(),
        'registros_mes': registros.filter(
            data_coleta__month=timezone.now().month,
            data_coleta__year=timezone.now().year
        ).count(),
    }
    
    # Produtos para filtro
    produtos = Produto.objects.filter(ativo=True).order_by('nome')
    
    context = {
        'registros': registros.order_by('-data_coleta')[:50],
        'analise_precos': analise_precos,
        'estabelecimentos_ativos': estabelecimentos_ativos,
        'stats': stats,
        'produtos': produtos,
        'produto_id': produto_id,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
    }
    
    return render(request, 'produtos/precos.html', context)


# === VIEWS DE API/AJAX ===

@require_http_methods(["GET"])
def api_produtos_search(request):
    """API para busca de produtos (AJAX)"""
    search = request.GET.get('q', '')
    produtos = Produto.objects.filter(
        Q(nome__icontains=search) | Q(codigo_interno__icontains=search),
        ativo=True
    )[:20]
    
    data = [{
        'id': p.id,
        'nome': p.nome,
        'codigo': p.codigo_interno,
        'categoria': p.categoria.nome,
        'fabricante': p.fabricante.nome if p.fabricante else '',
        'preco_referencia': float(p.preco_referencia) if p.preco_referencia else None,
    } for p in produtos]
    
    return JsonResponse({'produtos': data})


@require_http_methods(["GET"])
def api_produto_info(request, produto_id):
    """API para informações do produto"""
    try:
        produto = Produto.objects.get(id=produto_id, ativo=True)
        data = {
            'id': produto.id,
            'nome': produto.nome,
            'codigo_interno': produto.codigo_interno,
            'codigo_barras': produto.codigo_barras,
            'unidade_medida': produto.unidade_medida,
            'tem_validade': produto.tem_validade,
            'preco_referencia': float(produto.preco_referencia) if produto.preco_referencia else None,
            'categoria': produto.categoria.nome,
            'fabricante': produto.fabricante.nome if produto.fabricante else '',
            'classificacao_risco': produto.get_classificacao_risco_display(),
        }
        return JsonResponse(data)
    except Produto.DoesNotExist:
        return JsonResponse({'error': 'Produto não encontrado'}, status=404)


@require_http_methods(["GET"])
def api_produto_por_codigo_barras(request, codigo_barras):
    """API para buscar produto por código de barras"""
    try:
        produto = Produto.objects.get(codigo_barras=codigo_barras, ativo=True)
        data = {
            'id': produto.id,
            'nome': produto.nome,
            'codigo_interno': produto.codigo_interno,
            'codigo_barras': produto.codigo_barras,
            'descricao': produto.descricao,
            'especificacao': produto.especificacoes,
            'unidade_medida': produto.unidade_medida,
            'valor_unitario': float(produto.preco_referencia) if produto.preco_referencia else 0,
            'tem_validade': produto.tem_validade,
            'classificacao_risco': produto.classificacao_risco,
            'categoria': produto.categoria.nome,
            'fabricante': produto.fabricante.nome if produto.fabricante else '',
            'peso_liquido': float(produto.peso_liquido) if produto.peso_liquido else None,
            'peso_bruto': float(produto.peso_bruto) if produto.peso_bruto else None,
            'dimensoes': produto.dimensoes,
        }
        return JsonResponse(data)
    except Produto.DoesNotExist:
        return JsonResponse({'error': 'Produto não encontrado'}, status=404)


@require_http_methods(["GET"])
def api_produto_externo(request, codigo_barras):
    """API para buscar produto em fontes externas (Open Food Facts, etc.)"""
    import requests
    
    try:
        # Tentar buscar no Open Food Facts (exemplo)
        url = f"https://world.openfoodfacts.org/api/v0/product/{codigo_barras}.json"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 1 and data.get('product'):
                product = data['product']
                
                return JsonResponse({
                    'nome': product.get('product_name_pt', product.get('product_name', f'Produto {codigo_barras}')),
                    'descricao': product.get('generic_name_pt', product.get('generic_name', '')),
                    'especificacao': product.get('ingredients_text_pt', product.get('ingredients_text', '')),
                    'unidade_medida': 'un',
                    'valor_unitario': 0,
                    'fabricante': product.get('brands', ''),
                    'peso_liquido': product.get('quantity', ''),
                    'codigo_barras': codigo_barras,
                    'fonte': 'Open Food Facts'
                })
        
        # Se não encontrar, retornar produto básico
        return JsonResponse({
            'nome': f'Produto {codigo_barras}',
            'descricao': 'Produto identificado por código de barras',
            'especificacao': 'Produto escaneado',
            'unidade_medida': 'un',
            'valor_unitario': 0,
            'fabricante': '',
            'codigo_barras': codigo_barras,
            'fonte': 'Sistema'
        })
        
    except Exception as e:
        # Em caso de erro, retornar produto básico
        return JsonResponse({
            'nome': f'Produto {codigo_barras}',
            'descricao': 'Produto identificado por código de barras',
            'especificacao': 'Produto escaneado',
            'unidade_medida': 'un',
            'valor_unitario': 0,
            'fabricante': '',
            'codigo_barras': codigo_barras,
            'fonte': 'Sistema'
        })


# === VIEWS UTILITÁRIAS ===

def dashboard_produtos(request):
    """Dashboard geral do módulo produtos"""
    hoje = timezone.now().date()
    mes_atual = hoje.replace(day=1)
    
    # Estatísticas gerais
    stats = {
        'total_produtos': Produto.objects.filter(ativo=True).count(),
        'total_categorias': CategoriaProduto.objects.filter(ativo=True).count(),
        'total_fabricantes': Fabricante.objects.filter(ativo=True).count(),
        'produtos_criticos': Produto.objects.filter(classificacao_risco='critico', ativo=True).count(),
        'inutilizacoes_mes': ProdutoInutilizado.objects.filter(data_inutilizacao__gte=mes_atual).count(),
        'registros_preco_mes': RegistroPreco.objects.filter(data_coleta__gte=mes_atual).count(),
    }
    
    # Produtos mais fiscalizados
    produtos_fiscalizados = RegistroPreco.objects.values('produto__nome').annotate(
        total=Count('id')
    ).order_by('-total')[:10]
    
    # Inutilizações recentes
    inutilizacoes_recentes = ProdutoInutilizado.objects.select_related('produto').order_by('-data_inutilizacao')[:5]
    
    # Produtos por classificação de risco
    classificacao_risco = Produto.objects.filter(ativo=True).values('classificacao_risco').annotate(
        count=Count('id')
    )
    
    context = {
        'stats': stats,
        'produtos_fiscalizados': produtos_fiscalizados,
        'inutilizacoes_recentes': inutilizacoes_recentes,
        'classificacao_risco': classificacao_risco,
    }
    
    return render(request, 'produtos/dashboard.html', context)
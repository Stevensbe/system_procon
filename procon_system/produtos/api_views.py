import requests
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
import logging

from .models import Produto, CategoriaProduto, Fabricante
from .serializers import ProdutoSerializer

logger = logging.getLogger(__name__)

class BarcodeAPIView(View):
    """API para busca de produtos por código de barras"""
    
    def get(self, request, codigo_barras):
        """
        Busca produto por código de barras
        Primeiro tenta buscar no banco interno, depois em APIs externas
        """
        try:
            # Limpar código de barras
            codigo_barras = codigo_barras.strip()
            
            if not codigo_barras:
                return JsonResponse({
                    'success': False,
                    'error': 'Código de barras não fornecido'
                }, status=400)
            
            # 1. Buscar no banco interno
            produto_interno = self._buscar_produto_interno(codigo_barras)
            if produto_interno:
                return JsonResponse({
                    'success': True,
                    'source': 'internal',
                    'produto': produto_interno
                })
            
            # 2. Buscar em APIs externas
            produto_externo = self._buscar_produto_externo(codigo_barras)
            if produto_externo:
                return JsonResponse({
                    'success': True,
                    'source': 'external',
                    'produto': produto_externo
                })
            
            # 3. Criar produto genérico se não encontrado
            produto_generico = self._criar_produto_generico(codigo_barras)
            return JsonResponse({
                'success': True,
                'source': 'generic',
                'produto': produto_generico
            })
            
        except Exception as e:
            logger.error(f"Erro na busca de produto por código de barras {codigo_barras}: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }, status=500)
    
    def _buscar_produto_interno(self, codigo_barras):
        """Busca produto no banco de dados interno"""
        try:
            produto = Produto.objects.get(
                Q(codigo_barras=codigo_barras) | Q(codigo_interno=codigo_barras),
                ativo=True
            )
            
            return {
                'id': produto.id,
                'nome': produto.nome,
                'especificacao': produto.especificacoes or produto.descricao or produto.nome,
                'codigo_barras': produto.codigo_barras,
                'codigo_interno': produto.codigo_interno,
                'categoria': produto.categoria.nome if produto.categoria else '',
                'fabricante': produto.fabricante.nome if produto.fabricante else '',
                'unidade_medida': produto.unidade_medida,
                'peso_liquido': str(produto.peso_liquido) if produto.peso_liquido else None,
                'peso_bruto': str(produto.peso_bruto) if produto.peso_bruto else None,
                'dimensoes': produto.dimensoes,
                'preco_referencia': str(produto.preco_referencia) if produto.preco_referencia else None,
                'classificacao_risco': produto.classificacao_risco,
                'controlado_anvisa': produto.controlado_anvisa,
                'tem_validade': produto.tem_validade,
                'condicoes_armazenamento': produto.condicoes_armazenamento,
                'source': 'internal'
            }
        except ObjectDoesNotExist:
            return None
    
    def _buscar_produto_externo(self, codigo_barras):
        """Busca produto em APIs externas (Open Food Facts, etc.)"""
        try:
            # Open Food Facts API
            url = f"https://world.openfoodfacts.org/api/v0/product/{codigo_barras}.json"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 1 and data.get('product'):
                    product = data['product']
                    
                    return {
                        'id': None,
                        'nome': product.get('product_name_pt', product.get('product_name', 'Produto não identificado')),
                        'especificacao': self._extrair_especificacao(product),
                        'codigo_barras': codigo_barras,
                        'codigo_interno': codigo_barras,
                        'categoria': product.get('categories_tags', [''])[0].replace('en:', '') if product.get('categories_tags') else '',
                        'fabricante': product.get('brands', ''),
                        'unidade_medida': self._determinar_unidade(product),
                        'peso_liquido': product.get('quantity', ''),
                        'peso_bruto': None,
                        'dimensoes': None,
                        'preco_referencia': None,
                        'classificacao_risco': 'medio',
                        'controlado_anvisa': False,
                        'tem_validade': bool(product.get('expiration_date')),
                        'condicoes_armazenamento': product.get('storage_conditions_pt', product.get('storage_conditions', '')),
                        'source': 'external',
                        'external_data': {
                            'ingredients': product.get('ingredients_text_pt', product.get('ingredients_text', '')),
                            'nutrition_grade': product.get('nutrition_grade_fr', ''),
                            'allergens': product.get('allergens_tags', []),
                            'image_url': product.get('image_front_url', ''),
                            'nova_group': product.get('nova_group', ''),
                            'ecoscore_grade': product.get('ecoscore_grade', '')
                        }
                    }
            
            # Se Open Food Facts falhar, tentar outras APIs
            return self._buscar_outras_apis(codigo_barras)
            
        except Exception as e:
            logger.warning(f"Erro ao buscar produto externo {codigo_barras}: {str(e)}")
            return None
    
    def _buscar_outras_apis(self, codigo_barras):
        """Busca em outras APIs de produtos"""
        try:
            # API do Brasil (exemplo)
            if codigo_barras.startswith('789'):
                # Código brasileiro - tentar API específica
                pass
            
            # API genérica de produtos
            url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={codigo_barras}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('items'):
                    item = data['items'][0]
                    return {
                        'id': None,
                        'nome': item.get('title', 'Produto não identificado'),
                        'especificacao': item.get('description', ''),
                        'codigo_barras': codigo_barras,
                        'codigo_interno': codigo_barras,
                        'categoria': item.get('category', ''),
                        'fabricante': item.get('brand', ''),
                        'unidade_medida': 'un',
                        'peso_liquido': None,
                        'peso_bruto': None,
                        'dimensoes': None,
                        'preco_referencia': str(item.get('lowest_recorded_price', 0)),
                        'classificacao_risco': 'baixo',
                        'controlado_anvisa': False,
                        'tem_validade': False,
                        'condicoes_armazenamento': '',
                        'source': 'external'
                    }
        except Exception as e:
            logger.warning(f"Erro ao buscar em outras APIs {codigo_barras}: {str(e)}")
        
        return None
    
    def _criar_produto_generico(self, codigo_barras):
        """Cria produto genérico quando não encontrado"""
        return {
            'id': None,
            'nome': f'Produto - {codigo_barras}',
            'especificacao': f'Produto identificado pelo código de barras {codigo_barras}. Especificações devem ser preenchidas manualmente.',
            'codigo_barras': codigo_barras,
            'codigo_interno': codigo_barras,
            'categoria': 'Não categorizado',
            'fabricante': 'Não identificado',
            'unidade_medida': 'un',
            'peso_liquido': None,
            'peso_bruto': None,
            'dimensoes': None,
            'preco_referencia': None,
            'classificacao_risco': 'baixo',
            'controlado_anvisa': False,
            'tem_validade': False,
            'condicoes_armazenamento': '',
            'source': 'generic'
        }
    
    def _extrair_especificacao(self, product):
        """Extrai especificação do produto da API externa"""
        especificacoes = []
        
        # Informações nutricionais
        if product.get('nutriments'):
            nutriments = product['nutriments']
            if nutriments.get('energy_100g'):
                especificacoes.append(f"Energia: {nutriments['energy_100g']} kcal/100g")
            if nutriments.get('proteins_100g'):
                especificacoes.append(f"Proteínas: {nutriments['proteins_100g']}g/100g")
            if nutriments.get('carbohydrates_100g'):
                especificacoes.append(f"Carboidratos: {nutriments['carbohydrates_100g']}g/100g")
            if nutriments.get('fat_100g'):
                especificacoes.append(f"Gorduras: {nutriments['fat_100g']}g/100g")
        
        # Ingredientes
        if product.get('ingredients_text_pt'):
            especificacoes.append(f"Ingredientes: {product['ingredients_text_pt']}")
        elif product.get('ingredients_text'):
            especificacoes.append(f"Ingredientes: {product['ingredients_text']}")
        
        # Quantidade
        if product.get('quantity'):
            especificacoes.append(f"Quantidade: {product['quantity']}")
        
        # Alergênicos
        if product.get('allergens_tags'):
            alergenos = [tag.replace('en:', '') for tag in product['allergens_tags']]
            especificacoes.append(f"Alergênicos: {', '.join(alergenos)}")
        
        return ' | '.join(especificacoes) if especificacoes else product.get('product_name_pt', product.get('product_name', ''))
    
    def _determinar_unidade(self, product):
        """Determina unidade de medida baseado nos dados do produto"""
        quantity = product.get('quantity', '').lower()
        
        if 'kg' in quantity or 'quilo' in quantity:
            return 'kg'
        elif 'g' in quantity and 'kg' not in quantity:
            return 'g'
        elif 'l' in quantity and 'ml' not in quantity:
            return 'l'
        elif 'ml' in quantity:
            return 'ml'
        elif 'm' in quantity and 'cm' not in quantity:
            return 'm'
        elif 'cm' in quantity:
            return 'cm'
        elif 'un' in quantity or 'unidade' in quantity:
            return 'un'
        else:
            return 'un'  # Padrão


@method_decorator(csrf_exempt, name='dispatch')
class ProdutoCreateAPIView(View):
    """API para criar produto a partir de dados escaneados"""
    
    def post(self, request):
        """Cria ou atualiza produto no banco interno"""
        try:
            data = json.loads(request.body)
            
            # Validar dados obrigatórios
            if not data.get('nome') or not data.get('codigo_barras'):
                return JsonResponse({
                    'success': False,
                    'error': 'Nome e código de barras são obrigatórios'
                }, status=400)
            
            # Verificar se produto já existe
            produto, created = Produto.objects.get_or_create(
                codigo_barras=data['codigo_barras'],
                defaults={
                    'nome': data['nome'],
                    'codigo_interno': data.get('codigo_interno', data['codigo_barras']),
                    'especificacoes': data.get('especificacao', ''),
                    'descricao': data.get('descricao', ''),
                    'unidade_medida': data.get('unidade_medida', 'un'),
                    'peso_liquido': data.get('peso_liquido'),
                    'peso_bruto': data.get('peso_bruto'),
                    'dimensoes': data.get('dimensoes'),
                    'preco_referencia': data.get('preco_referencia'),
                    'classificacao_risco': data.get('classificacao_risco', 'baixo'),
                    'controlado_anvisa': data.get('controlado_anvisa', False),
                    'tem_validade': data.get('tem_validade', False),
                    'condicoes_armazenamento': data.get('condicoes_armazenamento', ''),
                    'criado_por': 'API Scanner'
                }
            )
            
            if not created:
                # Atualizar produto existente
                produto.nome = data['nome']
                produto.especificacoes = data.get('especificacao', produto.especificacoes)
                produto.descricao = data.get('descricao', produto.descricao)
                produto.unidade_medida = data.get('unidade_medida', produto.unidade_medida)
                produto.save()
            
            return JsonResponse({
                'success': True,
                'created': created,
                'produto': {
                    'id': produto.id,
                    'nome': produto.nome,
                    'especificacao': produto.especificacoes,
                    'codigo_barras': produto.codigo_barras,
                    'unidade_medida': produto.unidade_medida
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'JSON inválido'
            }, status=400)
        except Exception as e:
            logger.error(f"Erro ao criar produto: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }, status=500)


# Funções auxiliares para compatibilidade com views existentes
@csrf_exempt
@require_http_methods(["GET"])
def api_produto_por_codigo_barras(request, codigo_barras):
    """API legada para compatibilidade"""
    view = BarcodeAPIView()
    return view.get(request, codigo_barras)


@csrf_exempt
@require_http_methods(["GET"])
def api_produto_externo(request, codigo_barras):
    """API legada para compatibilidade"""
    view = BarcodeAPIView()
    return view.get(request, codigo_barras)
"""
Views Utilitárias - System Procon

Este módulo contém views para funcionalidades auxiliares como:
- Validações (CNPJ, números)
- Uploads de arquivos
- Geração de documentos
- Busca e filtros
- Relatórios
"""

import io
import os
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from docx import Document
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
import re

from ..models import (
    AutoBanco,
    AutoPosto,
    AutoSupermercado,
    AutoDiversos,
    AutoInfracao,
    AnexoAuto,
    SequenciaAutos,
)

from ..serializers import (
    AutoSimpleSerializer,
)


# ========================================
# VIEWS DE VALIDAÇÃO
# ========================================

@api_view(['POST'])
def validar_cnpj(request):
    """
    Valida formato do CNPJ.
    """
    try:
        cnpj = request.data.get('cnpj', '').strip()
        
        if not cnpj:
            return Response({
                'valido': False,
                'erro': 'CNPJ não fornecido'
            })
        
        # Remove formatação
        cnpj_numeros = re.sub(r'[^\d]', '', cnpj)
        
        # Verifica se tem 14 dígitos
        if len(cnpj_numeros) != 14:
            return Response({
                'valido': False,
                'erro': 'CNPJ deve ter 14 dígitos'
            })
        
        # Verifica se não é sequência de números iguais
        if len(set(cnpj_numeros)) == 1:
            return Response({
                'valido': False,
                'erro': 'CNPJ não pode ter todos os dígitos iguais'
            })
        
        # Validação dos dígitos verificadores
        def calcular_digito(cnpj_base, pesos):
            soma = sum(int(cnpj_base[i]) * pesos[i] for i in range(len(pesos)))
            resto = soma % 11
            return 0 if resto < 2 else 11 - resto
        
        # Primeiro dígito verificador
        pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        digito1 = calcular_digito(cnpj_numeros[:12], pesos1)
        
        # Segundo dígito verificador
        pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        digito2 = calcular_digito(cnpj_numeros[:13], pesos2)
        
        # Verifica se os dígitos conferem
        if int(cnpj_numeros[12]) == digito1 and int(cnpj_numeros[13]) == digito2:
            # Formatar CNPJ
            cnpj_formatado = f"{cnpj_numeros[:2]}.{cnpj_numeros[2:5]}.{cnpj_numeros[5:8]}/{cnpj_numeros[8:12]}-{cnpj_numeros[12:14]}"
            
            return Response({
                'valido': True,
                'cnpj_formatado': cnpj_formatado,
                'cnpj_numeros': cnpj_numeros
            })
        else:
            return Response({
                'valido': False,
                'erro': 'CNPJ inválido - dígitos verificadores não conferem'
            })
            
    except Exception as e:
        return Response({
            'valido': False,
            'erro': f'Erro na validação: {str(e)}'
        })


@api_view(['GET'])
def proximos_numeros(request):
    """
    Retorna os próximos números disponíveis para cada tipo de auto.
    """
    try:
        ano_atual = timezone.now().year
        
        # Buscar ou criar sequência para o ano atual
        sequencia, created = SequenciaAutos.objects.get_or_create(
            ano=ano_atual,
            defaults={'ultimo_numero': 0}
        )
        
        proximo_numero = sequencia.ultimo_numero + 1
        numero_formatado = f"{proximo_numero:03d}/{ano_atual}"
        
        return Response({
            'proximo_numero': proximo_numero,
            'numero_formatado': numero_formatado,
            'ano': ano_atual,
            'total_gerados_ano': sequencia.ultimo_numero
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)


# ========================================
# VIEWS DE BUSCA
# ========================================

@api_view(['GET'])
def buscar_autos(request):
    """
    Busca unificada em todos os tipos de auto.
    """
    try:
        query = request.GET.get('q', '').strip()
        tipo = request.GET.get('tipo', 'todos')  # 'banco', 'posto', 'supermercado', 'diversos', 'todos'
        limite = int(request.GET.get('limite', 20))
        
        if not query:
            return Response({
                'resultados': [],
                'total': 0,
                'message': 'Termo de busca não fornecido'
            })
        
        resultados = []
        
        # Função para buscar em um modelo específico
        def buscar_modelo(model_class, tipo_nome):
            if tipo != 'todos' and tipo != tipo_nome:
                return []
            
            autos = model_class.objects.filter(
                Q(numero__icontains=query) |
                Q(razao_social__icontains=query) |
                Q(cnpj__icontains=query) |
                Q(nome_fantasia__icontains=query)
            ).order_by('-data_fiscalizacao')[:limite]
            
            return [{
                'tipo': tipo_nome,
                'id': auto.id,
                'numero': auto.numero,
                'razao_social': auto.razao_social,
                'cnpj': auto.cnpj,
                'data_fiscalizacao': auto.data_fiscalizacao,
                'municipio': auto.municipio,
                'url': f'/fiscalizacao/{tipo_nome}s/{auto.id}/'
            } for auto in autos]
        
        # Buscar em todos os modelos
        resultados.extend(buscar_modelo(AutoBanco, 'banco'))
        resultados.extend(buscar_modelo(AutoPosto, 'posto'))
        resultados.extend(buscar_modelo(AutoSupermercado, 'supermercado'))
        resultados.extend(buscar_modelo(AutoDiversos, 'diversos'))
        
        # Ordenar por data mais recente
        resultados.sort(key=lambda x: x['data_fiscalizacao'], reverse=True)
        
        # Limitar resultados
        resultados = resultados[:limite]
        
        return Response({
            'resultados': resultados,
            'total': len(resultados),
            'termo_busca': query,
            'tipo_filtro': tipo
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'resultados': [],
            'total': 0
        }, status=500)


# ========================================
# VIEWS DE UPLOAD
# ========================================

@api_view(['POST'])
def upload_anexo(request):
    """
    Upload de anexos para autos.
    """
    try:
        arquivo = request.FILES.get('arquivo')
        content_type_id = request.data.get('content_type_id')
        object_id = request.data.get('object_id')
        descricao = request.data.get('descricao', '')
        
        if not arquivo:
            return Response({
                'error': 'Nenhum arquivo fornecido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not content_type_id or not object_id:
            return Response({
                'error': 'content_type_id e object_id são obrigatórios'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar tamanho do arquivo (max 10MB por padrão)
        max_size = getattr(settings, 'MAX_FILE_SIZE_MB', 10) * 1024 * 1024
        if arquivo.size > max_size:
            return Response({
                'error': f'Arquivo muito grande. Máximo permitido: {max_size // (1024*1024)}MB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar extensão
        allowed_extensions = getattr(settings, 'ALLOWED_EXTENSIONS', 
                                   ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])
        
        file_extension = arquivo.name.split('.')[-1].lower()
        if file_extension not in allowed_extensions:
            return Response({
                'error': f'Extensão não permitida. Permitidas: {", ".join(allowed_extensions)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Criar anexo
        anexo = AnexoAuto.objects.create(
            content_type_id=content_type_id,
            object_id=object_id,
            arquivo=arquivo,
            descricao=descricao
        )
        
        return Response({
            'id': anexo.id,
            'arquivo_url': anexo.arquivo.url,
            'descricao': anexo.descricao,
            'enviado_em': anexo.enviado_em,
            'message': 'Arquivo enviado com sucesso'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========================================
# VIEWS DE GERAÇÃO DE DOCUMENTOS
# ========================================

@api_view(['GET'])
def gerar_documento_banco(request, pk):
    """
    Gera documento Word para Auto de Banco.
    """
    try:
        auto = get_object_or_404(AutoBanco, pk=pk)
        
        # Criar documento
        doc = Document()
        
        # Título
        titulo = doc.add_heading('AUTO DE CONSTATAÇÃO - AGÊNCIA BANCÁRIA', 0)
        titulo.alignment = 1  # Centralizar
        
        # Informações básicas
        doc.add_paragraph(f"Número: {auto.numero}")
        doc.add_paragraph(f"Data: {auto.data_fiscalizacao}")
        doc.add_paragraph(f"Hora: {auto.hora_fiscalizacao}")
        
        # Dados da empresa
        doc.add_heading('DADOS DO ESTABELECIMENTO', level=1)
        doc.add_paragraph(f"Razão Social: {auto.razao_social}")
        doc.add_paragraph(f"Nome Fantasia: {auto.nome_fantasia}")
        doc.add_paragraph(f"CNPJ: {auto.cnpj}")
        doc.add_paragraph(f"Endereço: {auto.endereco}")
        doc.add_paragraph(f"Município: {auto.municipio}")
        
        # Irregularidades encontradas
        doc.add_heading('IRREGULARIDADES CONSTATADAS', level=1)
        
        if auto.nada_consta:
            doc.add_paragraph("✓ NADA CONSTA")
        elif auto.sem_irregularidades:
            doc.add_paragraph("✓ NÃO FORAM ENCONTRADAS IRREGULARIDADES")
        else:
            if auto.ausencia_cartaz_informativo:
                doc.add_paragraph("• Ausência de Cartaz Informativo")
            if auto.ausencia_profissional_libras:
                doc.add_paragraph("• Ausência de profissional de LIBRAS")
            # ... outras irregularidades
        
        if auto.observacoes:
            doc.add_heading('OBSERVAÇÕES', level=1)
            doc.add_paragraph(auto.observacoes)
        
        # Salvar em buffer
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        # Preparar resposta
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'attachment; filename="auto_banco_{auto.numero}.docx"'
        
        return response
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)


@api_view(['GET'])
def gerar_documento_posto(request, pk):
    """
    Gera documento Word para Auto de Posto.
    """
    try:
        auto = get_object_or_404(AutoPosto, pk=pk)
        
        # Similar ao banco, mas específico para posto
        doc = Document()
        
        titulo = doc.add_heading('AUTO DE CONSTATAÇÃO - POSTO DE COMBUSTÍVEL', 0)
        titulo.alignment = 1
        
        # ... implementação similar
        
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'attachment; filename="auto_posto_{auto.numero}.docx"'
        
        return response
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)


@api_view(['GET'])
def gerar_documento_supermercado(request, pk):
    """
    Gera documento Word para Auto de Supermercado.
    """
    try:
        auto = get_object_or_404(AutoSupermercado, pk=pk)
        
        # Implementação similar para supermercado
        doc = Document()
        
        titulo = doc.add_heading('AUTO DE CONSTATAÇÃO - SUPERMERCADO', 0)
        titulo.alignment = 1
        
        # ... implementação específica
        
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'attachment; filename="auto_supermercado_{auto.numero}.docx"'
        
        return response
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)


@api_view(['GET'])
def gerar_documento_diversos(request, pk):
    """
    Gera documento Word para Auto Diversos.
    """
    try:
        auto = get_object_or_404(AutoDiversos, pk=pk)
        
        # Implementação para diversos
        doc = Document()
        
        titulo = doc.add_heading('AUTO DE CONSTATAÇÃO - LEGISLAÇÃO DIVERSA', 0)
        titulo.alignment = 1
        
        # ... implementação específica
        
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'attachment; filename="auto_diversos_{auto.numero}.docx"'
        
        return response
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)


# ========================================
# RELATÓRIOS
# ========================================

@api_view(['GET'])
def relatorio_consolidado(request):
    """
    Gera relatório consolidado de todas as atividades.
    """
    try:
        data_inicio = request.GET.get('data_inicio')
        data_fim = request.GET.get('data_fim')
        
        if not data_inicio or not data_fim:
            return Response({
                'error': 'data_inicio e data_fim são obrigatórios'
            }, status=400)
        
        # Filtros de data
        filtro_data = {
            'data_fiscalizacao__range': [data_inicio, data_fim]
        }
        
        # Coletar dados
        dados = {
            'periodo': {
                'inicio': data_inicio,
                'fim': data_fim
            },
            'autos': {
                'banco': {
                    'total': AutoBanco.objects.filter(**filtro_data).count(),
                    'com_irregularidades': AutoBanco.objects.filter(
                        **filtro_data
                    ).exclude(Q(nada_consta=True) | Q(sem_irregularidades=True)).count()
                },
                'posto': {
                    'total': AutoPosto.objects.filter(**filtro_data).count(),
                    'com_irregularidades': AutoPosto.objects.filter(
                        **filtro_data
                    ).exclude(Q(nada_consta=True) | Q(sem_irregularidades=True)).count()
                },
                'supermercado': {
                    'total': AutoSupermercado.objects.filter(**filtro_data).count(),
                    'com_irregularidades': AutoSupermercado.objects.filter(
                        **filtro_data
                    ).exclude(nada_consta=True).count()
                },
                'diversos': {
                    'total': AutoDiversos.objects.filter(**filtro_data).count()
                }
            },
            'infracoes': {
                'total': AutoInfracao.objects.filter(**filtro_data).count(),
                'por_gravidade': dict(
                    AutoInfracao.objects.filter(**filtro_data).values('gravidade').annotate(
                        count=Count('id')
                    ).values_list('gravidade', 'count')
                )
            }
        }
        
        return Response(dados)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

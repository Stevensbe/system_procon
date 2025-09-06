from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Sum, Count, Q, Case, When, Value, CharField, F
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib import messages
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import csv
import json
from multas.models import Multa, Empresa
from .models import Financeiro, RegistroFinanceiro


def dashboard_financeiro(request):
    """
    Dashboard principal do módulo financeiro com KPIs e gráficos
    """
    # Obter data atual e cálculos de período
    hoje = timezone.now().date()
    inicio_mes = hoje.replace(day=1)
    fim_mes = (inicio_mes + relativedelta(months=1)) - timedelta(days=1)
    
    # 1. KPIs PRINCIPAIS
    # Arrecadação no mês (multas pagas no mês corrente)
    arrecadacao_mes = Multa.objects.filter(
        pago=True,
        data_emissao__gte=inicio_mes,
        data_emissao__lte=fim_mes
    ).aggregate(total=Sum('valor'))['total'] or 0
    
    # Total a receber (multas pendentes)
    total_pendente = Multa.objects.filter(
        pago=False
    ).aggregate(total=Sum('valor'))['total'] or 0
    
    # Total em atraso (multas vencidas e não pagas)
    total_atraso = Multa.objects.filter(
        pago=False,
        data_emissao__lt=hoje - timedelta(days=30)  # Vencidas há mais de 30 dias
    ).aggregate(total=Sum('valor'))['total'] or 0
    
    # Taxa de conversão (multas pagas vs total)
    total_multas = Multa.objects.count()
    multas_pagas = Multa.objects.filter(pago=True).count()
    taxa_conversao = (multas_pagas / total_multas * 100) if total_multas > 0 else 0
    
    # 2. DADOS PARA GRÁFICOS
    # Dados para gráfico de barras - Arrecadação mensal (últimos 12 meses)
    dados_arrecadacao_mensal = []
    for i in range(12):
        data = hoje - relativedelta(months=i)
        inicio_periodo = data.replace(day=1)
        fim_periodo = (inicio_periodo + relativedelta(months=1)) - timedelta(days=1)
        
        total_periodo = Multa.objects.filter(
            pago=True,
            data_emissao__gte=inicio_periodo,
            data_emissao__lte=fim_periodo
        ).aggregate(total=Sum('valor'))['total'] or 0
        
        dados_arrecadacao_mensal.append({
            'mes': data.strftime('%b/%Y'),
            'total': float(total_periodo)
        })
    
    dados_arrecadacao_mensal.reverse()  # Ordenar cronologicamente
    
    # Dados para gráfico de pizza - Composição da carteira
    total_carteira = Multa.objects.aggregate(total=Sum('valor'))['total'] or 0
    
    if total_carteira > 0:
        valor_pago = Multa.objects.filter(pago=True).aggregate(total=Sum('valor'))['total'] or 0
        valor_pendente = Multa.objects.filter(pago=False).aggregate(total=Sum('valor'))['total'] or 0
        
        composicao_carteira = [
            {'status': 'Pago', 'valor': float(valor_pago), 'percentual': (valor_pago / total_carteira) * 100},
            {'status': 'Pendente', 'valor': float(valor_pendente), 'percentual': (valor_pendente / total_carteira) * 100}
        ]
    else:
        composicao_carteira = []
    
    # 3. DADOS PARA TABELA DE RELATÓRIOS
    # Aplicar filtros se fornecidos
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    status = request.GET.get('status')
    empresa_id = request.GET.get('empresa')
    
    queryset = Multa.objects.select_related('empresa', 'processo').all()
    
    if data_inicio:
        queryset = queryset.filter(data_emissao__gte=data_inicio)
    if data_fim:
        queryset = queryset.filter(data_emissao__lte=data_fim)
    if status:
        if status == 'paga':
            queryset = queryset.filter(pago=True)
        elif status == 'pendente':
            queryset = queryset.filter(pago=False)
    if empresa_id:
        queryset = queryset.filter(empresa_id=empresa_id)
    
    # Paginação simples
    page = request.GET.get('page', 1)
    try:
        page = int(page)
    except ValueError:
        page = 1
    
    per_page = 20
    start = (page - 1) * per_page
    end = start + per_page
    
    multas_paginadas = queryset[start:end]
    total_multas_filtradas = queryset.count()
    total_pages = (total_multas_filtradas + per_page - 1) // per_page
    
    # Lista de empresas para filtro
    empresas = Empresa.objects.filter(ativo=True).order_by('razao_social')
    
    context = {
        # KPIs
        'arrecadacao_mes': float(arrecadacao_mes),
        'total_pendente': float(total_pendente),
        'total_atraso': float(total_atraso),
        'taxa_conversao': round(taxa_conversao, 1),
        
        # Dados para gráficos
        'dados_arrecadacao_mensal': json.dumps(dados_arrecadacao_mensal),
        'composicao_carteira': json.dumps(composicao_carteira),
        
        # Dados para tabela
        'multas': multas_paginadas,
        'empresas': empresas,
        'total_multas_filtradas': total_multas_filtradas,
        'page': page,
        'total_pages': total_pages,
        'has_previous': page > 1,
        'has_next': page < total_pages,
        'previous_page': page - 1,
        'next_page': page + 1,
        
        # Filtros aplicados
        'filtros': {
            'data_inicio': data_inicio,
            'data_fim': data_fim,
            'status': status,
            'empresa_id': empresa_id
        }
    }
    
    return render(request, 'financeiro/dashboard.html', context)


def exportar_dados(request):
    """
    Exporta dados filtrados para CSV
    """
    # Aplicar os mesmos filtros do dashboard
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    status = request.GET.get('status')
    empresa_id = request.GET.get('empresa')
    
    queryset = Multa.objects.select_related('empresa', 'processo').all()
    
    if data_inicio:
        queryset = queryset.filter(data_emissao__gte=data_inicio)
    if data_fim:
        queryset = queryset.filter(data_emissao__lte=data_fim)
    if status:
        if status == 'paga':
            queryset = queryset.filter(pago=True)
        elif status == 'pendente':
            queryset = queryset.filter(pago=False)
    if empresa_id:
        queryset = queryset.filter(empresa_id=empresa_id)
    
    # Criar resposta CSV
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="relatorio_financeiro_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    # Configurar encoding para UTF-8 com BOM
    response.write('\ufeff')
    
    writer = csv.writer(response, delimiter=';')
    
    # Cabeçalho
    writer.writerow([
        'ID da Multa',
        'Empresa',
        'CNPJ',
        'Valor (R$)',
        'Data de Emissão',
        'Data de Vencimento',
        'Status',
        'Pago',
        'Processo'
    ])
    
    # Dados
    for multa in queryset:
        writer.writerow([
            multa.id,
            multa.empresa.razao_social,
            multa.empresa.cnpj,
            f"{multa.valor:.2f}",
            multa.data_emissao.strftime('%d/%m/%Y'),
            multa.data_vencimento.strftime('%d/%m/%Y'),
            multa.status,
            'Sim' if multa.pago else 'Não',
            multa.processo.numero if multa.processo else ''
        ])
    
    return response


def dados_graficos_api(request):
    """
    API para fornecer dados dos gráficos via AJAX
    """
    hoje = timezone.now().date()
    
    # Dados para gráfico de barras - Arrecadação mensal
    dados_arrecadacao_mensal = []
    for i in range(12):
        data = hoje - relativedelta(months=i)
        inicio_periodo = data.replace(day=1)
        fim_periodo = (inicio_periodo + relativedelta(months=1)) - timedelta(days=1)
        
        total_periodo = Multa.objects.filter(
            pago=True,
            data_emissao__gte=inicio_periodo,
            data_emissao__lte=fim_periodo
        ).aggregate(total=Sum('valor'))['total'] or 0
        
        dados_arrecadacao_mensal.append({
            'mes': data.strftime('%b/%Y'),
            'total': float(total_periodo)
        })
    
    dados_arrecadacao_mensal.reverse()
    
    # Dados para gráfico de pizza - Composição da carteira
    total_carteira = Multa.objects.aggregate(total=Sum('valor'))['total'] or 0
    
    if total_carteira > 0:
        valor_pago = Multa.objects.filter(pago=True).aggregate(total=Sum('valor'))['total'] or 0
        valor_pendente = Multa.objects.filter(pago=False).aggregate(total=Sum('valor'))['total'] or 0
        
        composicao_carteira = [
            {'status': 'Pago', 'valor': float(valor_pago), 'percentual': (valor_pago / total_carteira) * 100},
            {'status': 'Pendente', 'valor': float(valor_pendente), 'percentual': (valor_pendente / total_carteira) * 100}
        ]
    else:
        composicao_carteira = []
    
    return JsonResponse({
        'arrecadacao_mensal': dados_arrecadacao_mensal,
        'composicao_carteira': composicao_carteira
    })


# Views para gerenciar registros financeiros
class FinanceiroListView(ListView):
    """Lista todos os registros financeiros"""
    model = Financeiro
    template_name = 'financeiro/financeiro_list.html'
    context_object_name = 'financeiros'
    ordering = ['-data']
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Calcular totais
        context['total_entradas'] = Financeiro.objects.filter(tipo='entrada').aggregate(
            total=Sum('valor'))['total'] or 0
        context['total_saidas'] = Financeiro.objects.filter(tipo='saida').aggregate(
            total=Sum('valor'))['total'] or 0
        return context


class FinanceiroCreateView(CreateView):
    """Criar novo registro financeiro"""
    model = Financeiro
    template_name = 'financeiro/financeiro_form.html'
    fields = ['descricao', 'valor', 'tipo']
    success_url = reverse_lazy('financeiro:listar_financeiro')
    
    def form_valid(self, form):
        messages.success(self.request, 'Registro financeiro criado com sucesso!')
        return super().form_valid(form)


class FinanceiroUpdateView(UpdateView):
    """Editar registro financeiro"""
    model = Financeiro
    template_name = 'financeiro/financeiro_form.html'
    fields = ['descricao', 'valor', 'tipo']
    success_url = reverse_lazy('financeiro:listar_financeiro')
    
    def form_valid(self, form):
        messages.success(self.request, 'Registro financeiro atualizado com sucesso!')
        return super().form_valid(form)


class FinanceiroDeleteView(DeleteView):
    """Excluir registro financeiro"""
    model = Financeiro
    template_name = 'financeiro/financeiro_confirm_delete.html'
    success_url = reverse_lazy('financeiro:listar_financeiro')
    
    def delete(self, request, *args, **kwargs):
        messages.success(request, 'Registro financeiro excluído com sucesso!')
        return super().delete(request, *args, **kwargs)


# ============================================================================
# FUNÇÕES AUXILIARES PARA TRABALHAR COM AMBOS OS MODELOS
# ============================================================================

def get_registros_financeiros_query():
    """
    Retorna um queryset que funciona com RegistroFinanceiro ou fallback para Multa
    """
    # Verificar se existem registros financeiros
    if RegistroFinanceiro.objects.exists():
        return RegistroFinanceiro.objects.select_related('multa', 'multa__empresa', 'multa__processo')
    else:
        # Fallback para usar dados das multas diretamente
        return None

def get_status_from_multa(multa, hoje=None):
    """Calcula status baseado nos dados da multa (fallback)"""
    if hoje is None:
        hoje = timezone.now().date()
    
    if multa.pago:
        return 'paga'
    elif multa.data_emissao < hoje - timedelta(days=30):
        return 'vencida'
    else:
        return 'pendente'

def get_dados_financeiros_agregados():
    """
    Retorna dados agregados priorizando RegistroFinanceiro, com fallback para Multa
    """
    hoje = timezone.now().date()
    inicio_mes = hoje.replace(day=1)
    fim_mes = (inicio_mes + relativedelta(months=1)) - timedelta(days=1)
    
    registros_financeiros = get_registros_financeiros_query()
    
    if registros_financeiros and registros_financeiros.exists():
        # Usar dados do RegistroFinanceiro
        arrecadacao_mes = registros_financeiros.filter(
            status='paga',
            data_pagamento__gte=inicio_mes,
            data_pagamento__lte=fim_mes
        ).aggregate(total=Sum('valor_pago'))['total'] or 0
        
        total_pendente = registros_financeiros.filter(
            status='pendente'
        ).aggregate(total=Sum('valor_total_com_encargos'))['total'] or 0
        
        total_atraso = registros_financeiros.filter(
            status='vencida'
        ).aggregate(total=Sum('valor_total_com_encargos'))['total'] or 0
        
        total_registros = registros_financeiros.count()
        registros_pagos = registros_financeiros.filter(status='paga').count()
        
    else:
        # Fallback para dados das multas
        arrecadacao_mes = Multa.objects.filter(
            pago=True,
            data_emissao__gte=inicio_mes,
            data_emissao__lte=fim_mes
        ).aggregate(total=Sum('valor'))['total'] or 0
        
        total_pendente = Multa.objects.filter(
            pago=False,
            data_emissao__gte=hoje - timedelta(days=30)
        ).aggregate(total=Sum('valor'))['total'] or 0
        
        total_atraso = Multa.objects.filter(
            pago=False,
            data_emissao__lt=hoje - timedelta(days=30)
        ).aggregate(total=Sum('valor'))['total'] or 0
        
        total_registros = Multa.objects.count()
        registros_pagos = Multa.objects.filter(pago=True).count()
    
    taxa_conversao = (registros_pagos / total_registros * 100) if total_registros > 0 else 0
    
    return {
        'arrecadacao_mes': float(arrecadacao_mes),
        'total_pendente': float(total_pendente),
        'total_atraso': float(total_atraso),
        'taxa_conversao': round(taxa_conversao, 1),
        'total_registros': total_registros,
        'registros_pagos': registros_pagos,
        'periodo': {
            'inicio_mes': inicio_mes.strftime('%Y-%m-%d'),
            'fim_mes': fim_mes.strftime('%Y-%m-%d')
        }
    }


# ============================================================================
# APIs REST PARA O FRONTEND REACT (VERSÃO ATUALIZADA)
# ============================================================================

@api_view(['GET'])
def dashboard_api_view(request):
    """
    API endpoint para o dashboard principal - KPIs
    URL: /api/financeiro/dashboard/
    """
    dados = get_dados_financeiros_agregados()
    return Response(dados)


@api_view(['GET'])
def arrecadacao_mensal_api_view(request):
    """
    API endpoint para dados do gráfico de arrecadação mensal
    URL: /api/financeiro/arrecadacao-mensal/
    """
    hoje = timezone.now().date()
    dados_arrecadacao = []
    registros_financeiros = get_registros_financeiros_query()
    
    for i in range(12):
        data = hoje - relativedelta(months=i)
        inicio_periodo = data.replace(day=1)
        fim_periodo = (inicio_periodo + relativedelta(months=1)) - timedelta(days=1)
        
        if registros_financeiros and registros_financeiros.exists():
            # Usar RegistroFinanceiro
            total_periodo = registros_financeiros.filter(
                status='paga',
                data_pagamento__gte=inicio_periodo,
                data_pagamento__lte=fim_periodo
            ).aggregate(total=Sum('valor_pago'))['total'] or 0
        else:
            # Fallback para Multa
            total_periodo = Multa.objects.filter(
                pago=True,
                data_emissao__gte=inicio_periodo,
                data_emissao__lte=fim_periodo
            ).aggregate(total=Sum('valor'))['total'] or 0
        
        dados_arrecadacao.append({
            'mes': data.strftime('%b/%Y'),
            'ano_mes': data.strftime('%Y-%m'),
            'total': float(total_periodo),
            'periodo': {
                'inicio': inicio_periodo.strftime('%Y-%m-%d'),
                'fim': fim_periodo.strftime('%Y-%m-%d')
            }
        })
    
    dados_arrecadacao.reverse()
    
    return Response({
        'dados': dados_arrecadacao,
        'meta': {
            'total_periodos': 12,
            'data_geracao': hoje.strftime('%Y-%m-%d'),
            'fonte_dados': 'RegistroFinanceiro' if registros_financeiros and registros_financeiros.exists() else 'Multa'
        }
    })


@api_view(['GET'])
def composicao_carteira_api_view(request):
    """
    API endpoint para dados do gráfico de composição da carteira
    URL: /api/financeiro/composicao-carteira/
    """
    registros_financeiros = get_registros_financeiros_query()
    hoje = timezone.now().date()
    
    if registros_financeiros and registros_financeiros.exists():
        # Usar RegistroFinanceiro
        total_carteira = registros_financeiros.aggregate(
            total=Sum('valor_original')
        )['total'] or 0
        
        if total_carteira > 0:
            # Agregar por status
            stats_por_status = registros_financeiros.values('status').annotate(
                valor_total=Sum('valor_original'),
                count=Count('id')
            )
            
            composicao = []
            for stat in stats_por_status:
                status_label = {
                    'paga': 'Pago',
                    'pendente': 'Pendente', 
                    'vencida': 'Vencido',
                    'cancelada': 'Cancelado',
                    'contestada': 'Contestado',
                    'parcelada': 'Parcelado'
                }.get(stat['status'], stat['status'].title())
                
                composicao.append({
                    'status': status_label,
                    'valor': float(stat['valor_total']),
                    'percentual': round((stat['valor_total'] / total_carteira) * 100, 1),
                    'count': stat['count']
                })
        else:
            composicao = []
            
        total_registros = registros_financeiros.count()
        fonte_dados = 'RegistroFinanceiro'
        
    else:
        # Fallback para Multa
        total_carteira = Multa.objects.aggregate(total=Sum('valor'))['total'] or 0
        
        if total_carteira > 0:
            valor_pago = Multa.objects.filter(pago=True).aggregate(total=Sum('valor'))['total'] or 0
            valor_pendente = Multa.objects.filter(pago=False).aggregate(total=Sum('valor'))['total'] or 0
            
            # Calcular vencidas (não pagas e com mais de 30 dias)
            valor_vencido = Multa.objects.filter(
                pago=False,
                data_emissao__lt=hoje - timedelta(days=30)
            ).aggregate(total=Sum('valor'))['total'] or 0
            
            valor_pendente_atual = valor_pendente - valor_vencido
            
            composicao = [
                {
                    'status': 'Pago',
                    'valor': float(valor_pago),
                    'percentual': round((valor_pago / total_carteira) * 100, 1),
                    'count': Multa.objects.filter(pago=True).count()
                },
                {
                    'status': 'Pendente',
                    'valor': float(valor_pendente_atual),
                    'percentual': round((valor_pendente_atual / total_carteira) * 100, 1),
                    'count': Multa.objects.filter(
                        pago=False,
                        data_emissao__gte=hoje - timedelta(days=30)
                    ).count()
                },
                {
                    'status': 'Vencido',
                    'valor': float(valor_vencido),
                    'percentual': round((valor_vencido / total_carteira) * 100, 1),
                    'count': Multa.objects.filter(
                        pago=False,
                        data_emissao__lt=hoje - timedelta(days=30)
                    ).count()
                }
            ]
        else:
            composicao = []
            
        total_registros = Multa.objects.count()
        fonte_dados = 'Multa'
    
    return Response({
        'dados': composicao,
        'meta': {
            'total_carteira': float(total_carteira),
            'total_registros': total_registros,
            'data_calculo': hoje.strftime('%Y-%m-%d'),
            'fonte_dados': fonte_dados
        }
    })


class MultasPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
def relatorio_multas_api_view(request):
    """
    API endpoint para relatório detalhado com filtros
    URL: /api/financeiro/relatorios/
    """
    # Obter parâmetros de filtro
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    status = request.GET.get('status')
    empresa_id = request.GET.get('empresa')
    search = request.GET.get('search', '')
    
    queryset = Multa.objects.select_related('empresa', 'processo').all()
    
    # Aplicar filtros
    if data_inicio:
        try:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
            queryset = queryset.filter(data_emissao__gte=data_inicio)
        except ValueError:
            pass
    
    if data_fim:
        try:
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
            queryset = queryset.filter(data_emissao__lte=data_fim)
        except ValueError:
            pass
    
    if status:
        if status == 'paga':
            queryset = queryset.filter(pago=True)
        elif status == 'pendente':
            hoje = timezone.now().date()
            queryset = queryset.filter(
                pago=False,
                data_emissao__gte=hoje - timedelta(days=30)
            )
        elif status == 'vencida':
            hoje = timezone.now().date()
            queryset = queryset.filter(
                pago=False,
                data_emissao__lt=hoje - timedelta(days=30)
            )
    
    if empresa_id:
        try:
            queryset = queryset.filter(empresa_id=int(empresa_id))
        except ValueError:
            pass
    
    if search:
        queryset = queryset.filter(
            Q(empresa__razao_social__icontains=search) |
            Q(empresa__cnpj__icontains=search) |
            Q(processo__numero__icontains=search)
        )
    
    # Paginação
    paginator = MultasPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    # Serializar dados
    multas_data = []
    for multa in page:
        hoje = timezone.now().date()
        status_calculado = 'paga' if multa.pago else (
            'vencida' if multa.data_emissao < hoje - timedelta(days=30) else 'pendente'
        )
        
        multas_data.append({
            'id': multa.id,
            'empresa': {
                'id': multa.empresa.id,
                'razao_social': multa.empresa.razao_social,
                'cnpj': multa.empresa.cnpj
            },
            'valor': float(multa.valor),
            'data_emissao': multa.data_emissao.strftime('%Y-%m-%d'),
            'data_vencimento': multa.data_vencimento.strftime('%Y-%m-%d'),
            'status': status_calculado,
            'pago': multa.pago,
            'processo': {
                'numero': multa.processo.numero if multa.processo else None,
                'id': multa.processo.id if multa.processo else None
            }
        })
    
    # Calcular resumos
    total_valor = queryset.aggregate(total=Sum('valor'))['total'] or 0
    total_count = queryset.count()
    
    response_data = {
        'results': multas_data,
        'count': total_count,
        'next': paginator.get_next_link(),
        'previous': paginator.get_previous_link(),
        'resumo': {
            'total_valor': float(total_valor),
            'total_registros': total_count,
            'filtros_aplicados': {
                'data_inicio': data_inicio.strftime('%Y-%m-%d') if data_inicio else None,
                'data_fim': data_fim.strftime('%Y-%m-%d') if data_fim else None,
                'status': status,
                'empresa_id': empresa_id,
                'search': search if search else None
            }
        }
    }
    
    return paginator.get_paginated_response(response_data)


@api_view(['GET'])
def empresas_list_api_view(request):
    """
    API endpoint para listar empresas ativas (para filtros)
    URL: /api/financeiro/empresas/
    """
    empresas = Empresa.objects.filter(ativo=True).order_by('razao_social')
    
    empresas_data = [
        {
            'id': empresa.id,
            'razao_social': empresa.razao_social,
            'cnpj': empresa.cnpj,
            'total_multas': empresa.multas.count(),
            'valor_total': float(empresa.multas.aggregate(total=Sum('valor'))['total'] or 0)
        }
        for empresa in empresas
    ]
    
    return Response({
        'empresas': empresas_data,
        'total': len(empresas_data)
    })

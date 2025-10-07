from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Q, Sum, Count
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from multas.models import Multa, Empresa
from fiscalizacao.models import AutoInfracao


class BasicPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def _paginate_queryset(queryset, request, item_serializer):
    paginator = BasicPagination()
    page = paginator.paginate_queryset(queryset, request)
    data = [item_serializer(obj) for obj in page]
    return paginator.get_paginated_response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def multas_search(request):
    """Busca paginada de multas com filtros simples."""
    qs = Multa.objects.select_related('processo', 'empresa').all()

    termo = request.query_params.get('q')
    if termo:
        qs = qs.filter(
            Q(empresa__razao_social__icontains=termo)
            | Q(empresa__nome_fantasia__icontains=termo)
            | Q(processo__numero__icontains=termo)
        )

    status_param = request.query_params.get('status')
    if status_param:
        qs = qs.filter(status=status_param)

    valor_min = request.query_params.get('valor_min')
    valor_max = request.query_params.get('valor_max')
    if valor_min:
        try:
            qs = qs.filter(valor__gte=Decimal(str(valor_min)))
        except (ArithmeticError, TypeError, ValueError):
            pass
    if valor_max:
        try:
            qs = qs.filter(valor__lte=Decimal(str(valor_max)))
        except (ArithmeticError, TypeError, ValueError):
            pass

    qs = qs.order_by('-data_emissao', '-id')

    def _serialize(multa):
        return {
            'id': multa.id,
            'processo': getattr(multa.processo, 'numero', None),
            'empresa': multa.empresa.razao_social if multa.empresa else None,
            'status': multa.status,
            'valor': float(multa.valor) if multa.valor is not None else None,
            'data_emissao': multa.data_emissao,
        }

    return _paginate_queryset(qs, request, _serialize)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financeiro_dashboard(request):
    """Retorna indicadores financeiros consolidados."""
    valores = Multa.objects.aggregate(
        total_recebido=Sum('valor', filter=Q(status='paga')),
        total_pendente=Sum('valor', filter=Q(status__in=['pendente', 'vencida'])),
        total_atraso=Sum('valor', filter=Q(status='vencida')),
    )

    total_recebido = valores['total_recebido'] or Decimal('0')
    total_pendente = valores['total_pendente'] or Decimal('0')
    total_atraso = valores['total_atraso'] or Decimal('0')

    total_emitido = Multa.objects.aggregate(total=Sum('valor'))['total'] or Decimal('0')
    taxa_conversao = float(total_recebido / total_emitido) if total_emitido else 0.0

    return Response({
        'arrecadacao_mes': float(total_recebido),
        'total_pendente': float(total_pendente),
        'total_atraso': float(total_atraso),
        'taxa_conversao': round(taxa_conversao, 4),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financeiro_arrecadacao_mensal(request):
    """Retorna série mensal de arrecadação (últimos 6 meses)."""
    hoje = timezone.now().date().replace(day=1)
    meses = [(hoje - timedelta(days=30 * i)) for i in range(6)]
    meses = sorted(set(meses))

    dados = []
    for mes in meses:
        prox_mes = (mes + timedelta(days=32)).replace(day=1)
        total_mes = Multa.objects.filter(
            status='paga',
            atualizado_em__gte=mes,
            atualizado_em__lt=prox_mes,
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0')
        dados.append({
            'mes': mes.strftime('%Y-%m'),
            'valor_pago': float(total_mes),
        })

    return Response({'dados': dados})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financeiro_composicao_carteira(request):
    """Distribuição de multas por status."""
    contagem = Multa.objects.values('status').annotate(total=Count('id'))
    mapa = {item['status']: item['total'] for item in contagem}

    dados = []
    for status_codigo, status_nome in Multa.STATUS_CHOICES:
        dados.append({
            'status': status_codigo,
            'status_display': status_nome,
            'total': mapa.get(status_codigo, 0),
        })

    return Response({'dados': dados})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financeiro_relatorios(request):
    """Listagem paginada para relatórios com filtros simples."""
    qs = Multa.objects.select_related('empresa').order_by('-data_emissao', '-id')

    data_inicio = request.query_params.get('data_inicio')
    data_fim = request.query_params.get('data_fim')
    status_param = request.query_params.get('status')

    if data_inicio:
        try:
            qs = qs.filter(data_emissao__gte=datetime.fromisoformat(data_inicio).date())
        except ValueError:
            pass
    if data_fim:
        try:
            qs = qs.filter(data_emissao__lte=datetime.fromisoformat(data_fim).date())
        except ValueError:
            pass
    if status_param:
        qs = qs.filter(status=status_param)

    def _serialize(multa):
        return {
            'id': multa.id,
            'empresa': multa.empresa.razao_social if multa.empresa else None,
            'valor': float(multa.valor) if multa.valor is not None else None,
            'status': multa.status,
            'data_emissao': multa.data_emissao,
        }

    return _paginate_queryset(qs, request, _serialize)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def fiscalizacao_list(request):
    """Lista ou cria autos de infração simplificados via API pública."""
    if request.method == 'GET':
        qs = AutoInfracao.objects.order_by('-data_fiscalizacao', '-id')

        def _serialize(auto):
            return {
                'id': auto.id,
                'numero': auto.numero,
                'razao_social': auto.razao_social,
                'cnpj': auto.cnpj,
                'status': auto.status,
                'data_fiscalizacao': auto.data_fiscalizacao,
            }

        return _paginate_queryset(qs, request, _serialize)

    # POST - criação simplificada
    payload = request.data

    empresa_nome = payload.get('empresa') or 'Empresa Não Informada'
    cnpj = payload.get('cnpj') or '00.000.000/0000-00'
    endereco = payload.get('endereco') or 'Endereço não informado'
    valor = payload.get('valor_multa') or payload.get('valor') or 0
    status_param = payload.get('status') or 'autuado'
    tipo = payload.get('tipo') or 'fiscalizacao'

    empresa, _ = Empresa.objects.get_or_create(
        cnpj=cnpj,
        defaults={
            'razao_social': empresa_nome,
            'nome_fantasia': empresa_nome,
            'endereco': endereco,
            'telefone': payload.get('telefone', ''),
        }
    )

    try:
        data_fiscalizacao = datetime.fromisoformat(payload.get('data_fiscalizacao')).date()
    except (TypeError, ValueError):
        data_fiscalizacao = timezone.now().date()

    auto = AutoInfracao.objects.create(
        numero=payload.get('numero') or '',
        data_fiscalizacao=data_fiscalizacao,
        hora_fiscalizacao=timezone.now().time(),
        razao_social=empresa_nome,
        nome_fantasia=empresa_nome,
        endereco=endereco,
        cnpj=cnpj,
        relatorio=f'Fiscalização {tipo} registrada via API.',
        base_legal_cdc='Art. 55 do CDC',
        valor_multa=Decimal(str(valor)) if valor else Decimal('0'),
        responsavel_nome=payload.get('responsavel', 'Responsável designado'),
        responsavel_cpf=payload.get('responsavel_cpf', '000.000.000-00'),
        fiscal_nome=payload.get('fiscal', 'Fiscal API'),
        status=status_param if status_param in dict(AutoInfracao.STATUS_CHOICES) else 'autuado',
    )

    multa = None
    if not Multa.objects.filter(processo=auto).exists():
        multa = Multa.objects.create(
            processo=auto,
            empresa=empresa,
            valor=Decimal(str(valor)) if valor else Decimal('0'),
            status='pendente',
        )
    else:
        multa = auto.multa

    return Response(
        {
            'id': auto.id,
            'numero': auto.numero,
            'razao_social': auto.razao_social,
            'status': auto.status,
            'multa_id': multa.id if multa else None,
            'tipo': tipo,
        },
        status=status.HTTP_201_CREATED,
    )

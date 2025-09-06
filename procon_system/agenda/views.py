from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import datetime, timedelta, date
import json

from .models import (
    EventoAgenda, Fiscal, TipoEvento, CalendarioFiscalizacao,
    ParticipacaoEvento, LembreteEvento
)


def calendario_principal(request):
    """Exibe calendário principal com todos os eventos"""
    # Parâmetros de visualização
    mes = int(request.GET.get('mes', timezone.now().month))
    ano = int(request.GET.get('ano', timezone.now().year))
    fiscal_id = request.GET.get('fiscal', '')
    tipo_id = request.GET.get('tipo', '')
    
    # Data base para o calendário
    data_base = date(ano, mes, 1)
    
    # Eventos do mês
    eventos = EventoAgenda.objects.filter(
        data_inicio__year=ano,
        data_inicio__month=mes
    ).select_related('tipo', 'fiscal_responsavel')
    
    # Filtros
    if fiscal_id:
        eventos = eventos.filter(fiscal_responsavel_id=fiscal_id)
    
    if tipo_id:
        eventos = eventos.filter(tipo_id=tipo_id)
    
    # Agrupa eventos por dia
    eventos_por_dia = {}
    for evento in eventos:
        dia = evento.data_inicio.day
        if dia not in eventos_por_dia:
            eventos_por_dia[dia] = []
        eventos_por_dia[dia].append(evento)
    
    # Dados para filtros
    fiscais = Fiscal.objects.filter(ativo=True)
    tipos = TipoEvento.objects.filter(ativo=True)
    
    # Navegação do calendário
    mes_anterior = data_base - timedelta(days=1)
    mes_proximo = data_base.replace(day=28) + timedelta(days=4)
    mes_proximo = mes_proximo.replace(day=1)
    
    context = {
        'data_base': data_base,
        'eventos_por_dia': eventos_por_dia,
        'fiscais': fiscais,
        'tipos': tipos,
        'fiscal_selecionado': fiscal_id,
        'tipo_selecionado': tipo_id,
        'mes_anterior': mes_anterior,
        'mes_proximo': mes_proximo,
    }
    
    return render(request, 'agenda/calendario_principal.html', context)


def agenda_fiscal(request, fiscal_id=None):
    """Agenda específica de um fiscal"""
    if fiscal_id:
        fiscal = get_object_or_404(Fiscal, pk=fiscal_id, ativo=True)
    else:
        # Se não especificado, pega o primeiro fiscal (ou do usuário logado)
        fiscal = Fiscal.objects.filter(ativo=True).first()
        if not fiscal:
            messages.warning(request, "Nenhum fiscal cadastrado.")
            return redirect('agenda:calendario')
    
    # Período (próximos 30 dias por padrão)
    data_inicio = timezone.now().date()
    data_fim = data_inicio + timedelta(days=30)
    
    # Eventos do fiscal
    eventos = EventoAgenda.objects.filter(
        Q(fiscal_responsavel=fiscal) | Q(fiscais_participantes=fiscal),
        data_inicio__date__gte=data_inicio,
        data_inicio__date__lte=data_fim
    ).distinct().order_by('data_inicio')
    
    # Eventos por status
    stats_eventos = {
        'agendados': eventos.filter(status='agendado').count(),
        'confirmados': eventos.filter(status='confirmado').count(),
        'em_andamento': eventos.filter(status='em_andamento').count(),
        'concluidos': eventos.filter(status='concluido').count(),
    }
    
    # Próximos eventos (próximos 7 dias)
    proximos_eventos = eventos.filter(
        data_inicio__date__gte=data_inicio,
        data_inicio__date__lte=data_inicio + timedelta(days=7)
    )[:5]
    
    # Conflitos de horário
    conflitos = []
    for evento in eventos.filter(status__in=['agendado', 'confirmado']):
        conflitos_evento = evento.verificar_conflitos()
        if conflitos_evento:
            conflitos.append({
                'evento': evento,
                'conflitos': conflitos_evento
            })
    
    context = {
        'fiscal': fiscal,
        'eventos': eventos,
        'stats_eventos': stats_eventos,
        'proximos_eventos': proximos_eventos,
        'conflitos': conflitos,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
    }
    
    return render(request, 'agenda/agenda_fiscal.html', context)


def evento_detail(request, pk):
    """Detalhes de um evento"""
    evento = get_object_or_404(EventoAgenda.objects.select_related('tipo', 'fiscal_responsavel'), pk=pk)
    
    # Participantes
    participantes = evento.participacaoevento_set.select_related('fiscal').all()
    
    # Lembretes
    lembretes = evento.lembretes.all()
    
    # Conflitos
    conflitos = evento.verificar_conflitos()
    
    context = {
        'evento': evento,
        'participantes': participantes,
        'lembretes': lembretes,
        'conflitos': conflitos,
    }
    
    return render(request, 'agenda/evento_detail.html', context)


def calendario_fiscalizacao(request):
    """Calendário específico de fiscalizações"""
    # Período
    mes = int(request.GET.get('mes', timezone.now().month))
    ano = int(request.GET.get('ano', timezone.now().year))
    
    # Fiscalizações do mês
    fiscalizacoes = CalendarioFiscalizacao.objects.filter(
        data_programada__year=ano,
        data_programada__month=mes
    ).select_related('fiscal_responsavel', 'fiscal_apoio')
    
    # Filtros
    fiscal_id = request.GET.get('fiscal', '')
    tipo = request.GET.get('tipo', '')
    status = request.GET.get('status', '')
    
    if fiscal_id:
        fiscalizacoes = fiscalizacoes.filter(
            Q(fiscal_responsavel_id=fiscal_id) | 
            Q(fiscal_apoio_id=fiscal_id)
        )
    
    if tipo:
        fiscalizacoes = fiscalizacoes.filter(tipo_fiscalizacao=tipo)
    
    if status:
        fiscalizacoes = fiscalizacoes.filter(status=status)
    
    # Estatísticas do mês
    stats = {
        'total_programadas': fiscalizacoes.count(),
        'concluidas': fiscalizacoes.filter(status='concluida').count(),
        'em_execucao': fiscalizacoes.filter(status='em_execucao').count(),
        'canceladas': fiscalizacoes.filter(status='cancelada').count(),
        'total_autos': sum(f.autos_lavrados for f in fiscalizacoes),
    }
    
    # Agrupa por dia
    fiscalizacoes_por_dia = {}
    for fisc in fiscalizacoes:
        dia = fisc.data_programada.day
        if dia not in fiscalizacoes_por_dia:
            fiscalizacoes_por_dia[dia] = []
        fiscalizacoes_por_dia[dia].append(fisc)
    
    # Dados para filtros
    fiscais = Fiscal.objects.filter(ativo=True)
    
    context = {
        'fiscalizacoes_por_dia': fiscalizacoes_por_dia,
        'stats': stats,
        'fiscais': fiscais,
        'mes': mes,
        'ano': ano,
        'fiscal_selecionado': fiscal_id,
        'tipo_selecionado': tipo,
        'status_selecionado': status,
        'tipo_choices': CalendarioFiscalizacao.TIPO_FISCALIZACAO_CHOICES,
        'status_choices': CalendarioFiscalizacao.STATUS_CHOICES,
    }
    
    return render(request, 'agenda/calendario_fiscalizacao.html', context)


def fiscalizacao_detail(request, pk):
    """Detalhes de uma fiscalização programada"""
    fiscalizacao = get_object_or_404(
        CalendarioFiscalizacao.objects.select_related('fiscal_responsavel', 'fiscal_apoio'), 
        pk=pk
    )
    
    # Empresas alvo (lista)
    empresas_lista = []
    if fiscalizacao.empresas_alvo:
        empresas_lista = [linha.strip() for linha in fiscalizacao.empresas_alvo.split('\n') if linha.strip()]
    
    context = {
        'fiscalizacao': fiscalizacao,
        'empresas_lista': empresas_lista,
    }
    
    return render(request, 'agenda/fiscalizacao_detail.html', context)


def dashboard_agenda(request):
    """Dashboard da agenda com visão geral"""
    hoje = timezone.now().date()
    
    # Eventos hoje
    eventos_hoje = EventoAgenda.objects.filter(
        data_inicio__date=hoje
    ).select_related('tipo', 'fiscal_responsavel')
    
    # Próximos eventos (próximos 7 dias)
    proximos_eventos = EventoAgenda.objects.filter(
        data_inicio__date__gt=hoje,
        data_inicio__date__lte=hoje + timedelta(days=7),
        status__in=['agendado', 'confirmado']
    ).order_by('data_inicio')[:10]
    
    # Fiscalizações programadas para hoje
    fiscalizacoes_hoje = CalendarioFiscalizacao.objects.filter(
        data_programada=hoje,
        status='programada'
    )
    
    # Estatísticas gerais
    stats = {
        'eventos_hoje': eventos_hoje.count(),
        'eventos_semana': EventoAgenda.objects.filter(
            data_inicio__date__gte=hoje,
            data_inicio__date__lte=hoje + timedelta(days=7)
        ).count(),
        'fiscalizacoes_mes': CalendarioFiscalizacao.objects.filter(
            data_programada__year=hoje.year,
            data_programada__month=hoje.month
        ).count(),
        'conflitos_pendentes': 0,  # Seria calculado verificando conflitos
    }
    
    # Lembretes pendentes
    lembretes_pendentes = LembreteEvento.objects.filter(
        status='pendente',
        data_agendada__lte=timezone.now()
    ).select_related('evento', 'fiscal')[:10]
    
    # Distribuição de eventos por tipo
    distribuicao_tipos = EventoAgenda.objects.filter(
        data_inicio__date__gte=hoje.replace(day=1),  # Início do mês
        data_inicio__date__lte=hoje
    ).values('tipo__nome').annotate(
        total=Count('id')
    ).order_by('-total')
    
    # Produtividade dos fiscais (eventos/fiscalizações no mês)
    produtividade_fiscais = []
    fiscais = Fiscal.objects.filter(ativo=True)
    for fiscal in fiscais:
        eventos_mes = EventoAgenda.objects.filter(
            fiscal_responsavel=fiscal,
            data_inicio__year=hoje.year,
            data_inicio__month=hoje.month
        ).count()
        
        fiscalizacoes_mes = CalendarioFiscalizacao.objects.filter(
            Q(fiscal_responsavel=fiscal) | Q(fiscal_apoio=fiscal),
            data_programada__year=hoje.year,
            data_programada__month=hoje.month
        ).count()
        
        if eventos_mes > 0 or fiscalizacoes_mes > 0:
            produtividade_fiscais.append({
                'fiscal': fiscal,
                'eventos': eventos_mes,
                'fiscalizacoes': fiscalizacoes_mes,
                'total': eventos_mes + fiscalizacoes_mes
            })
    
    produtividade_fiscais = sorted(produtividade_fiscais, key=lambda x: x['total'], reverse=True)
    
    context = {
        'eventos_hoje': eventos_hoje,
        'proximos_eventos': proximos_eventos,
        'fiscalizacoes_hoje': fiscalizacoes_hoje,
        'stats': stats,
        'lembretes_pendentes': lembretes_pendentes,
        'distribuicao_tipos': distribuicao_tipos,
        'produtividade_fiscais': produtividade_fiscais[:10],
    }
    
    return render(request, 'agenda/dashboard.html', context)


@require_http_methods(["POST"])
def confirmar_evento(request, pk):
    """Confirma um evento"""
    evento = get_object_or_404(EventoAgenda, pk=pk)
    evento.status = 'confirmado'
    evento.save()
    
    return JsonResponse({
        'success': True,
        'status': evento.get_status_display()
    })


@require_http_methods(["POST"])
def cancelar_evento(request, pk):
    """Cancela um evento"""
    evento = get_object_or_404(EventoAgenda, pk=pk)
    motivo = request.POST.get('motivo', '')
    
    evento.status = 'cancelado'
    if motivo:
        evento.descricao += f"\n\nCancelado: {motivo}"
    evento.save()
    
    return JsonResponse({
        'success': True,
        'status': evento.get_status_display()
    })


@require_http_methods(["POST"])
def iniciar_fiscalizacao(request, pk):
    """Marca fiscalização como em execução"""
    fiscalizacao = get_object_or_404(CalendarioFiscalizacao, pk=pk)
    fiscalizacao.status = 'em_execucao'
    fiscalizacao.data_execucao = timezone.now().date()
    fiscalizacao.save()
    
    return JsonResponse({
        'success': True,
        'status': fiscalizacao.get_status_display()
    })


def verificar_conflitos(request):
    """Verifica conflitos de horário para uma data/hora/fiscal"""
    fiscal_id = request.GET.get('fiscal_id')
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    evento_id = request.GET.get('evento_id')  # Para edição
    
    if not all([fiscal_id, data_inicio, data_fim]):
        return JsonResponse({'conflitos': []})
    
    try:
        data_inicio = datetime.fromisoformat(data_inicio.replace('Z', '+00:00'))
        data_fim = datetime.fromisoformat(data_fim.replace('Z', '+00:00'))
        fiscal = Fiscal.objects.get(pk=fiscal_id)
    except (ValueError, Fiscal.DoesNotExist):
        return JsonResponse({'conflitos': []})
    
    # Busca conflitos
    conflitos = EventoAgenda.objects.filter(
        Q(fiscal_responsavel=fiscal) | Q(fiscais_participantes=fiscal),
        data_inicio__lt=data_fim,
        data_fim__gt=data_inicio,
        status__in=['agendado', 'confirmado', 'em_andamento']
    )
    
    if evento_id:
        conflitos = conflitos.exclude(pk=evento_id)
    
    conflitos_data = []
    for conflito in conflitos.distinct():
        conflitos_data.append({
            'id': conflito.id,
            'titulo': conflito.titulo,
            'data_inicio': conflito.data_inicio.isoformat(),
            'data_fim': conflito.data_fim.isoformat(),
            'tipo': conflito.tipo.nome,
        })
    
    return JsonResponse({'conflitos': conflitos_data})


def eventos_api(request):
    """API para eventos (formato FullCalendar)"""
    start = request.GET.get('start')
    end = request.GET.get('end')
    
    if not start or not end:
        return JsonResponse({'events': []})
    
    try:
        start_date = datetime.fromisoformat(start.replace('Z', '+00:00')).date()
        end_date = datetime.fromisoformat(end.replace('Z', '+00:00')).date()
    except ValueError:
        return JsonResponse({'events': []})
    
    eventos = EventoAgenda.objects.filter(
        data_inicio__date__gte=start_date,
        data_inicio__date__lte=end_date
    ).select_related('tipo', 'fiscal_responsavel')
    
    events = []
    for evento in eventos:
        events.append({
            'id': evento.id,
            'title': evento.titulo,
            'start': evento.data_inicio.isoformat(),
            'end': evento.data_fim.isoformat(),
            'color': evento.tipo.cor,
            'textColor': '#ffffff',
            'extendedProps': {
                'fiscal': evento.fiscal_responsavel.nome,
                'tipo': evento.tipo.nome,
                'status': evento.get_status_display(),
                'local': evento.local,
            }
        })
    
    return JsonResponse(events, safe=False)
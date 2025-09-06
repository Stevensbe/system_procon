from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta

from .models import LogSistema, TipoEvento, AuditoriaAlteracao, LogSeguranca


def dashboard_auditoria(request):
    """Dashboard principal de auditoria"""
    hoje = timezone.now().date()
    mes_atual = hoje.replace(day=1)
    
    # Estatísticas gerais
    stats = {
        'total_logs': LogSistema.objects.count(),
        'logs_hoje': LogSistema.objects.filter(timestamp__date=hoje).count(),
        'logs_mes': LogSistema.objects.filter(timestamp__gte=mes_atual).count(),
        'logs_criticos': LogSistema.objects.filter(nivel='CRITICAL').count(),
        'logs_erro': LogSistema.objects.filter(nivel='ERROR').count(),
    }
    
    # Logs por nível (últimos 30 dias)
    trinta_dias = hoje - timedelta(days=30)
    logs_por_nivel = LogSistema.objects.filter(
        timestamp__date__gte=trinta_dias
    ).values('nivel').annotate(count=Count('id'))
    
    # Eventos mais frequentes
    eventos_frequentes = LogSistema.objects.filter(
        timestamp__date__gte=trinta_dias
    ).values('tipo_evento__nome').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Logs recentes críticos
    logs_criticos = LogSistema.objects.filter(
        nivel__in=['CRITICAL', 'ERROR']
    ).order_by('-timestamp')[:10]
    
    context = {
        'stats': stats,
        'logs_por_nivel': logs_por_nivel,
        'eventos_frequentes': eventos_frequentes,
        'logs_criticos': logs_criticos,
    }
    
    return render(request, 'auditoria/dashboard.html', context)


def log_sistema_list(request):
    """Lista de logs do sistema"""
    logs = LogSistema.objects.all().order_by('-timestamp')
    
    # Filtros
    search = request.GET.get('search')
    nivel = request.GET.get('nivel')
    tipo_evento = request.GET.get('tipo_evento')
    usuario = request.GET.get('usuario')
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    
    if search:
        logs = logs.filter(
            Q(descricao__icontains=search) |
            Q(detalhes__icontains=search) |
            Q(ip_usuario__icontains=search)
        )
    
    if nivel:
        logs = logs.filter(nivel=nivel)
    
    if tipo_evento:
        logs = logs.filter(tipo_evento_id=tipo_evento)
    
    if usuario:
        logs = logs.filter(usuario__icontains=usuario)
    
    if data_inicio:
        logs = logs.filter(timestamp__date__gte=data_inicio)
    
    if data_fim:
        logs = logs.filter(timestamp__date__lte=data_fim)
    
    # Paginação
    paginator = Paginator(logs, 50)
    page = request.GET.get('page')
    logs = paginator.get_page(page)
    
    # Dados para filtros
    tipos_evento = TipoEvento.objects.filter(ativo=True)
    
    context = {
        'logs': logs,
        'tipos_evento': tipos_evento,
        'niveis': LogSistema.NIVEL_CHOICES,
        'search': search,
        'nivel': nivel,
        'tipo_evento': tipo_evento,
        'usuario': usuario,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
    }
    
    return render(request, 'auditoria/logs.html', context)


def auditoria_alteracao_list(request):
    """Lista de trilha de auditoria"""
    audits = AuditoriaAlteracao.objects.all().order_by('-timestamp')
    
    # Filtros
    search = request.GET.get('search')
    acao = request.GET.get('acao')
    modelo = request.GET.get('modelo')
    usuario = request.GET.get('usuario')
    
    if search:
        audits = audits.filter(
            Q(object_id__icontains=search) |
            Q(valores_anteriores__icontains=search) |
            Q(valores_novos__icontains=search)
        )
    
    if acao:
        audits = audits.filter(acao=acao)
    
    if modelo:
        audits = audits.filter(content_type__model=modelo)
    
    if usuario:
        audits = audits.filter(usuario__icontains=usuario)
    
    # Paginação
    paginator = Paginator(audits, 30)
    page = request.GET.get('page')
    audits = paginator.get_page(page)
    
    context = {
        'audits': audits,
        'acoes': AuditoriaAlteracao._meta.get_field('acao').choices,
        'search': search,
        'acao': acao,
        'modelo': modelo,
        'usuario': usuario,
    }
    
    return render(request, 'auditoria/alteracoes.html', context)


def sessao_usuario_list(request):
    """Logs de sessões de usuário"""
    logs = LogSistema.objects.filter(
        tipo_evento__categoria='usuario'
    ).order_by('-timestamp')
    
    # Filtros
    usuario = request.GET.get('usuario')
    if usuario:
        logs = logs.filter(usuario__icontains=usuario)
    
    # Paginação
    paginator = Paginator(logs, 30)
    page = request.GET.get('page')
    logs = paginator.get_page(page)
    
    # Estatísticas de sessões
    hoje = timezone.now().date()
    stats = {
        'sessoes_hoje': logs.filter(timestamp__date=hoje).count(),
        'usuarios_ativos': logs.filter(timestamp__date=hoje).values('usuario').distinct().count(),
    }
    
    context = {
        'logs': logs,
        'stats': stats,
        'usuario': usuario,
    }
    
    return render(request, 'auditoria/sessoes.html', context)


def log_seguranca_list(request):
    """Logs de segurança"""
    logs = LogSeguranca.objects.all().order_by('-timestamp')
    
    # Filtros
    tipo_evento = request.GET.get('tipo_evento')
    nivel_severidade = request.GET.get('nivel_severidade')
    bloqueado = request.GET.get('bloqueado')
    
    if tipo_evento:
        logs = logs.filter(tipo_evento=tipo_evento)
    
    if nivel_severidade:
        logs = logs.filter(nivel_severidade=nivel_severidade)
    
    if bloqueado == 'sim':
        logs = logs.filter(bloqueado=True)
    
    # Paginação
    paginator = Paginator(logs, 30)
    page = request.GET.get('page')
    logs = paginator.get_page(page)
    
    # Estatísticas de segurança
    hoje = timezone.now().date()
    stats = {
        'tentativas_hoje': LogSeguranca.objects.filter(timestamp__date=hoje).count(),
        'bloqueados_hoje': LogSeguranca.objects.filter(
            timestamp__date=hoje,
            bloqueado=True
        ).count(),
        'ataques_alto_risco': LogSeguranca.objects.filter(nivel_severidade='alto').count(),
    }
    
    context = {
        'logs': logs,
        'stats': stats,
        'tipos_evento': LogSeguranca._meta.get_field('tipo_evento').choices,
        'niveis_severidade': LogSeguranca._meta.get_field('nivel_severidade').choices,
        'tipo_evento': tipo_evento,
        'nivel_severidade': nivel_severidade,
        'bloqueado': bloqueado,
    }
    
    return render(request, 'auditoria/seguranca.html', context)


def backup_log_list(request):
    """Logs de backup"""
    logs = LogSistema.objects.filter(
        tipo_evento__categoria='sistema',
        descricao__icontains='backup'
    ).order_by('-timestamp')
    
    # Paginação
    paginator = Paginator(logs, 20)
    page = request.GET.get('page')
    logs = paginator.get_page(page)
    
    # Último backup
    ultimo_backup = logs.first()
    
    context = {
        'logs': logs,
        'ultimo_backup': ultimo_backup,
    }
    
    return render(request, 'auditoria/backups.html', context)


# === APIs ===

def api_estatisticas_auditoria(request):
    """API com estatísticas de auditoria"""
    hoje = timezone.now().date()
    
    stats = {
        'logs_hoje': LogSistema.objects.filter(timestamp__date=hoje).count(),
        'logs_criticos': LogSistema.objects.filter(nivel='CRITICAL').count(),
        'logs_erro': LogSistema.objects.filter(nivel='ERROR').count(),
        'tentativas_bloqueadas': LogSeguranca.objects.filter(
            timestamp__date=hoje,
            bloqueado=True
        ).count() if 'LogSeguranca' in globals() else 0,
    }
    
    return JsonResponse(stats)
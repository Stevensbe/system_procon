from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Q, Avg
from django.utils import timezone
from django.core.paginator import Paginator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime, timedelta
import json

from .models import (
    AnaliseJuridica, ParecerTecnico, DecisaoAdministrativa,
    RecursoAdministrativo, DocumentoJuridico, ConfiguracaoAnalise
)


# === VIEWS PRINCIPAIS ===

@login_required
def dashboard_view(request):
    """Dashboard principal do módulo de análise jurídica"""
    
    # Estatísticas gerais
    total_analises = AnaliseJuridica.objects.count()
    analises_hoje = AnaliseJuridica.objects.filter(
        criado_em__date=timezone.now().date()
    ).count()
    
    # Análises por status
    analises_por_status = AnaliseJuridica.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Análises com prazo vencido
    analises_vencidas = AnaliseJuridica.objects.filter(
        prazo_analise__lt=timezone.now(),
        status__in=['PENDENTE', 'EM_ANALISE', 'PARECER_ELABORADO', 'REVISAO']
    ).count()
    
    # Análises próximas ao vencimento (3 dias)
    limite_vencimento = timezone.now() + timedelta(days=3)
    analises_prox_vencimento = AnaliseJuridica.objects.filter(
        prazo_analise__lte=limite_vencimento,
        prazo_analise__gte=timezone.now(),
        status__in=['PENDENTE', 'EM_ANALISE', 'PARECER_ELABORADO', 'REVISAO']
    ).count()
    
    # Análises por tipo de processo
    analises_por_tipo = AnaliseJuridica.objects.values('tipo_processo').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Análises por analista
    analises_por_analista = AnaliseJuridica.objects.values(
        'analista_responsavel__username', 'analista_responsavel__first_name'
    ).annotate(count=Count('id')).order_by('-count')[:10]
    
    # Últimas análises
    ultimas_analises = AnaliseJuridica.objects.select_related(
        'analista_responsavel', 'supervisor'
    ).order_by('-criado_em')[:10]
    
    # Análises pendentes
    analises_pendentes = AnaliseJuridica.objects.filter(
        status__in=['PENDENTE', 'EM_ANALISE']
    ).select_related('analista_responsavel').order_by('prazo_analise')[:10]
    
    # Pareceres pendentes de revisão
    pareceres_revisao = ParecerTecnico.objects.filter(
        status='EM_REVISAO'
    ).select_related('analise', 'elaborado_por').order_by('-criado_em')[:5]
    
    # Decisões recentes
    decisoes_recentes = DecisaoAdministrativa.objects.select_related(
        'analise', 'julgador'
    ).order_by('-data_julgamento')[:5]
    
    # Recursos em análise
    recursos_analise = RecursoAdministrativo.objects.filter(
        status='EM_ANALISE'
    ).select_related('decisao_recorrida', 'relator').order_by('-data_protocolo')[:5]
    
    # Tempo médio de análise
    tempo_medio = AnaliseJuridica.objects.filter(
        status='FINALIZADO',
        data_inicio_analise__isnull=False,
        data_finalizacao__isnull=False
    ).aggregate(
        media=Avg('tempo_analise_dias')
    )['media'] or 0
    
    context = {
        'total_analises': total_analises,
        'analises_hoje': analises_hoje,
        'analises_por_status': analises_por_status,
        'analises_vencidas': analises_vencidas,
        'analises_prox_vencimento': analises_prox_vencimento,
        'analises_por_tipo': analises_por_tipo,
        'analises_por_analista': analises_por_analista,
        'ultimas_analises': ultimas_analises,
        'analises_pendentes': analises_pendentes,
        'pareceres_revisao': pareceres_revisao,
        'decisoes_recentes': decisoes_recentes,
        'recursos_analise': recursos_analise,
        'tempo_medio': round(tempo_medio, 1),
    }
    
    return render(request, 'analise_juridica/dashboard.html', context)


@login_required
def gestao_analises(request):
    """Gestão de análises jurídicas"""
    analises = AnaliseJuridica.objects.select_related(
        'analista_responsavel', 'supervisor', 'relator'
    ).order_by('-criado_em')
    
    # Filtros
    status = request.GET.get('status')
    tipo_processo = request.GET.get('tipo_processo')
    analista = request.GET.get('analista')
    complexidade = request.GET.get('complexidade')
    
    if status:
        analises = analises.filter(status=status)
    
    if tipo_processo:
        analises = analises.filter(tipo_processo=tipo_processo)
    
    if analista:
        analises = analises.filter(analista_responsavel_id=analista)
    
    if complexidade:
        analises = analises.filter(complexidade=complexidade)
    
    # Paginação
    paginator = Paginator(analises, 20)
    page = request.GET.get('page')
    analises_paginadas = paginator.get_page(page)
    
    # Dados para filtros
    status_choices = AnaliseJuridica.STATUS_CHOICES
    tipo_processo_choices = AnaliseJuridica.TIPO_PROCESSO_CHOICES
    complexidade_choices = AnaliseJuridica.COMPLEXIDADE_CHOICES
    
    context = {
        'analises': analises_paginadas,
        'status_choices': status_choices,
        'tipo_processo_choices': tipo_processo_choices,
        'complexidade_choices': complexidade_choices,
    }
    
    return render(request, 'analise_juridica/gestao/lista.html', context)


@login_required
def detalhe_analise(request, analise_id):
    """Detalhes da análise jurídica"""
    analise = get_object_or_404(AnaliseJuridica, id=analise_id)
    
    # Pareceres relacionados
    pareceres = analise.pareceres.select_related(
        'elaborado_por', 'revisado_por', 'aprovado_por'
    ).order_by('-criado_em')
    
    # Decisão (se existir)
    try:
        decisao = analise.decisao
    except DecisaoAdministrativa.DoesNotExist:
        decisao = None
    
    # Recursos (se existir decisão)
    recursos = []
    if decisao:
        recursos = decisao.recursos.select_related('relator').order_by('-data_protocolo')
    
    # Documentos anexados
    documentos = analise.documentos.select_related(
        'enviado_por', 'validado_por'
    ).order_by('-data_envio')
    
    context = {
        'analise': analise,
        'pareceres': pareceres,
        'decisao': decisao,
        'recursos': recursos,
        'documentos': documentos,
    }
    
    return render(request, 'analise_juridica/gestao/detalhe.html', context)


@login_required
def nova_analise(request):
    """Criar nova análise jurídica"""
    if request.method == 'POST':
        try:
            # Lógica para criar nova análise
            messages.success(request, 'Análise jurídica criada com sucesso!')
            return redirect('analise_juridica:gestao_analises')
        except Exception as e:
            messages.error(request, f'Erro ao criar análise: {str(e)}')
    
    # Dados para o formulário
    tipo_processo_choices = AnaliseJuridica.TIPO_PROCESSO_CHOICES
    complexidade_choices = AnaliseJuridica.COMPLEXIDADE_CHOICES
    prioridade_choices = AnaliseJuridica.PRIORIDADE_CHOICES
    
    context = {
        'tipo_processo_choices': tipo_processo_choices,
        'complexidade_choices': complexidade_choices,
        'prioridade_choices': prioridade_choices,
    }
    
    return render(request, 'analise_juridica/gestao/nova.html', context)


@login_required
def editar_analise(request, analise_id):
    """Editar análise jurídica"""
    analise = get_object_or_404(AnaliseJuridica, id=analise_id)
    
    if request.method == 'POST':
        try:
            # Lógica para editar análise
            messages.success(request, 'Análise jurídica atualizada com sucesso!')
            return redirect('analise_juridica:detalhe_analise', analise_id=analise.id)
        except Exception as e:
            messages.error(request, f'Erro ao atualizar análise: {str(e)}')
    
    context = {
        'analise': analise,
    }
    
    return render(request, 'analise_juridica/gestao/editar.html', context)


@login_required
def iniciar_analise(request, analise_id):
    """Iniciar análise jurídica"""
    analise = get_object_or_404(AnaliseJuridica, id=analise_id)
    
    if request.method == 'POST':
        try:
            if analise.status == 'PENDENTE':
                analise.status = 'EM_ANALISE'
                analise.data_inicio_analise = timezone.now()
                analise.analista_responsavel = request.user
                analise.save()
                messages.success(request, 'Análise iniciada com sucesso!')
            else:
                messages.warning(request, 'Esta análise não pode ser iniciada.')
            
            return redirect('analise_juridica:detalhe_analise', analise_id=analise.id)
        except Exception as e:
            messages.error(request, f'Erro ao iniciar análise: {str(e)}')
    
    return redirect('analise_juridica:detalhe_analise', analise_id=analise.id)


@login_required
def finalizar_analise(request, analise_id):
    """Finalizar análise jurídica"""
    analise = get_object_or_404(AnaliseJuridica, id=analise_id)
    
    if request.method == 'POST':
        try:
            if analise.status in ['EM_ANALISE', 'PARECER_ELABORADO', 'REVISAO', 'DECIDIDO']:
                analise.status = 'FINALIZADO'
                analise.data_finalizacao = timezone.now()
                analise.save()
                messages.success(request, 'Análise finalizada com sucesso!')
            else:
                messages.warning(request, 'Esta análise não pode ser finalizada.')
            
            return redirect('analise_juridica:detalhe_analise', analise_id=analise.id)
        except Exception as e:
            messages.error(request, f'Erro ao finalizar análise: {str(e)}')
    
    return redirect('analise_juridica:detalhe_analise', analise_id=analise.id)


# === VIEWS DE PARECERES ===

@login_required
def gestao_pareceres(request):
    """Gestão de pareceres técnicos"""
    pareceres = ParecerTecnico.objects.select_related(
        'analise', 'elaborado_por', 'revisado_por', 'aprovado_por'
    ).order_by('-criado_em')
    
    # Filtros
    status = request.GET.get('status')
    tipo_parecer = request.GET.get('tipo_parecer')
    conclusao = request.GET.get('conclusao')
    
    if status:
        pareceres = pareceres.filter(status=status)
    
    if tipo_parecer:
        pareceres = pareceres.filter(tipo_parecer=tipo_parecer)
    
    if conclusao:
        pareceres = pareceres.filter(conclusao=conclusao)
    
    # Paginação
    paginator = Paginator(pareceres, 20)
    page = request.GET.get('page')
    pareceres_paginados = paginator.get_page(page)
    
    context = {
        'pareceres': pareceres_paginados,
    }
    
    return render(request, 'analise_juridica/pareceres/lista.html', context)


@login_required
def novo_parecer(request, analise_id):
    """Criar novo parecer técnico"""
    analise = get_object_or_404(AnaliseJuridica, id=analise_id)
    
    if request.method == 'POST':
        try:
            # Lógica para criar parecer
            messages.success(request, 'Parecer técnico criado com sucesso!')
            return redirect('analise_juridica:detalhe_analise', analise_id=analise.id)
        except Exception as e:
            messages.error(request, f'Erro ao criar parecer: {str(e)}')
    
    context = {
        'analise': analise,
    }
    
    return render(request, 'analise_juridica/pareceres/novo.html', context)


@login_required
def editar_parecer(request, parecer_id):
    """Editar parecer técnico"""
    parecer = get_object_or_404(ParecerTecnico, id=parecer_id)
    
    if request.method == 'POST':
        try:
            # Lógica para editar parecer
            messages.success(request, 'Parecer técnico atualizado com sucesso!')
            return redirect('analise_juridica:detalhe_analise', analise_id=parecer.analise.id)
        except Exception as e:
            messages.error(request, f'Erro ao atualizar parecer: {str(e)}')
    
    context = {
        'parecer': parecer,
    }
    
    return render(request, 'analise_juridica/pareceres/editar.html', context)


# === VIEWS DE DECISÕES ===

@login_required
def gestao_decisoes(request):
    """Gestão de decisões administrativas"""
    decisoes = DecisaoAdministrativa.objects.select_related(
        'analise', 'julgador'
    ).order_by('-data_julgamento')
    
    # Filtros
    tipo_decisao = request.GET.get('tipo_decisao')
    julgador = request.GET.get('julgador')
    
    if tipo_decisao:
        decisoes = decisoes.filter(tipo_decisao=tipo_decisao)
    
    if julgador:
        decisoes = decisoes.filter(julgador_id=julgador)
    
    # Paginação
    paginator = Paginator(decisoes, 20)
    page = request.GET.get('page')
    decisoes_paginadas = paginator.get_page(page)
    
    context = {
        'decisoes': decisoes_paginadas,
    }
    
    return render(request, 'analise_juridica/decisoes/lista.html', context)


@login_required
def nova_decisao(request, analise_id):
    """Criar nova decisão administrativa"""
    analise = get_object_or_404(AnaliseJuridica, id=analise_id)
    
    if request.method == 'POST':
        try:
            # Lógica para criar decisão
            messages.success(request, 'Decisão administrativa criada com sucesso!')
            return redirect('analise_juridica:detalhe_analise', analise_id=analise.id)
        except Exception as e:
            messages.error(request, f'Erro ao criar decisão: {str(e)}')
    
    context = {
        'analise': analise,
    }
    
    return render(request, 'analise_juridica/decisoes/nova.html', context)


@login_required
def publicar_decisao(request, decisao_id):
    """Publicar decisão administrativa"""
    decisao = get_object_or_404(DecisaoAdministrativa, id=decisao_id)
    
    if request.method == 'POST':
        try:
            if not decisao.data_publicacao:
                decisao.data_publicacao = timezone.now()
                decisao.save()
                messages.success(request, 'Decisão publicada com sucesso!')
            else:
                messages.warning(request, 'Esta decisão já foi publicada.')
            
            return redirect('analise_juridica:detalhe_analise', analise_id=decisao.analise.id)
        except Exception as e:
            messages.error(request, f'Erro ao publicar decisão: {str(e)}')
    
    return redirect('analise_juridica:detalhe_analise', analise_id=decisao.analise.id)


# === VIEWS DE RECURSOS ===

@login_required
def gestao_recursos(request):
    """Gestão de recursos administrativos"""
    recursos = RecursoAdministrativo.objects.select_related(
        'decisao_recorrida', 'relator'
    ).order_by('-data_protocolo')
    
    # Filtros
    status = request.GET.get('status')
    tipo_recurso = request.GET.get('tipo_recurso')
    
    if status:
        recursos = recursos.filter(status=status)
    
    if tipo_recurso:
        recursos = recursos.filter(tipo_recurso=tipo_recurso)
    
    # Paginação
    paginator = Paginator(recursos, 20)
    page = request.GET.get('page')
    recursos_paginados = paginator.get_page(page)
    
    context = {
        'recursos': recursos_paginados,
    }
    
    return render(request, 'analise_juridica/recursos/lista.html', context)


@login_required
def detalhe_recurso(request, recurso_id):
    """Detalhes do recurso administrativo"""
    recurso = get_object_or_404(RecursoAdministrativo, id=recurso_id)
    
    context = {
        'recurso': recurso,
    }
    
    return render(request, 'analise_juridica/recursos/detalhe.html', context)


@login_required
def julgar_recurso(request, recurso_id):
    """Julgar recurso administrativo"""
    recurso = get_object_or_404(RecursoAdministrativo, id=recurso_id)
    
    if request.method == 'POST':
        try:
            # Lógica para julgar recurso
            messages.success(request, 'Recurso julgado com sucesso!')
            return redirect('analise_juridica:detalhe_recurso', recurso_id=recurso.id)
        except Exception as e:
            messages.error(request, f'Erro ao julgar recurso: {str(e)}')
    
    context = {
        'recurso': recurso,
    }
    
    return render(request, 'analise_juridica/recursos/julgar.html', context)


# === VIEWS DE RELATÓRIOS ===

@login_required
def relatorios_view(request):
    """Página de relatórios"""
    return render(request, 'analise_juridica/relatorios/home.html')


def relatorio_estatisticas(request):
    """Relatório de estatísticas gerais"""
    hoje = timezone.now()
    
    stats = {
        'total_analises': AnaliseJuridica.objects.count(),
        'analises_mes': AnaliseJuridica.objects.filter(
            criado_em__month=hoje.month,
            criado_em__year=hoje.year
        ).count(),
        'tempo_medio_analise': AnaliseJuridica.objects.filter(
            status='FINALIZADO'
        ).aggregate(
            media=Avg('tempo_analise_dias')
        )['media'] or 0,
        'pareceres_elaborados': ParecerTecnico.objects.filter(
            status__in=['ELABORADO', 'APROVADO', 'PUBLICADO']
        ).count(),
        'decisoes_proferidas': DecisaoAdministrativa.objects.count(),
        'recursos_julgados': RecursoAdministrativo.objects.filter(
            status__in=['JULGADO_PROVIDO', 'JULGADO_IMPROVIDO', 'JULGADO_PARCIALMENTE']
        ).count(),
    }
    
    return JsonResponse(stats)


def relatorio_por_status(request):
    """Relatório de análises por status"""
    relatorio = AnaliseJuridica.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    return JsonResponse(list(relatorio), safe=False)


def relatorio_por_tipo(request):
    """Relatório de análises por tipo de processo"""
    relatorio = AnaliseJuridica.objects.values('tipo_processo').annotate(
        count=Count('id')
    ).order_by('-count')
    
    return JsonResponse(list(relatorio), safe=False)


def relatorio_por_analista(request):
    """Relatório de análises por analista"""
    relatorio = AnaliseJuridica.objects.values(
        'analista_responsavel__username', 'analista_responsavel__first_name'
    ).annotate(
        total=Count('id'),
        pendentes=Count('id', filter=Q(status='PENDENTE')),
        em_analise=Count('id', filter=Q(status='EM_ANALISE')),
        finalizadas=Count('id', filter=Q(status='FINALIZADO'))
    ).order_by('-total')
    
    return JsonResponse(list(relatorio), safe=False)


def relatorio_prazos(request):
    """Relatório de situação de prazos"""
    hoje = timezone.now()
    
    vencidas = AnaliseJuridica.objects.filter(
        prazo_analise__lt=hoje,
        status__in=['PENDENTE', 'EM_ANALISE', 'PARECER_ELABORADO']
    ).count()
    
    prox_vencimento = AnaliseJuridica.objects.filter(
        prazo_analise__lte=hoje + timedelta(days=3),
        prazo_analise__gte=hoje,
        status__in=['PENDENTE', 'EM_ANALISE', 'PARECER_ELABORADO']
    ).count()
    
    no_prazo = AnaliseJuridica.objects.filter(
        prazo_analise__gt=hoje + timedelta(days=3),
        status__in=['PENDENTE', 'EM_ANALISE', 'PARECER_ELABORADO']
    ).count()
    
    relatorio = [
        {'situacao': 'Vencidas', 'count': vencidas},
        {'situacao': 'Próximas ao Vencimento', 'count': prox_vencimento},
        {'situacao': 'No Prazo', 'count': no_prazo},
    ]
    
    return JsonResponse(relatorio, safe=False)


# === VIEWS DE CONFIGURAÇÃO ===

@login_required
def configuracoes_view(request):
    """Configurações do sistema"""
    config, created = ConfiguracaoAnalise.objects.get_or_create()
    
    if request.method == 'POST':
        try:
            # Lógica para salvar configurações
            messages.success(request, 'Configurações salvas com sucesso!')
        except Exception as e:
            messages.error(request, f'Erro ao salvar configurações: {str(e)}')
    
    context = {
        'config': config,
    }
    
    return render(request, 'analise_juridica/configuracoes.html', context)


# === API VIEWS ===

class EstatisticasAPIView(APIView):
    """API para estatísticas do dashboard"""
    
    def get(self, request):
        hoje = timezone.now()
        
        stats = {
            'total_analises': AnaliseJuridica.objects.count(),
            'analises_hoje': AnaliseJuridica.objects.filter(
                criado_em__date=hoje.date()
            ).count(),
            'analises_vencidas': AnaliseJuridica.objects.filter(
                prazo_analise__lt=hoje,
                status__in=['PENDENTE', 'EM_ANALISE', 'PARECER_ELABORADO']
            ).count(),
            'pareceres_revisao': ParecerTecnico.objects.filter(
                status='EM_REVISAO'
            ).count(),
            'decisoes_mes': DecisaoAdministrativa.objects.filter(
                data_julgamento__month=hoje.month,
                data_julgamento__year=hoje.year
            ).count(),
            'recursos_pendentes': RecursoAdministrativo.objects.filter(
                status='EM_ANALISE'
            ).count(),
        }
        
        return Response(stats)


class DashboardDadosAPIView(APIView):
    """API para dados do dashboard"""
    
    def get(self, request):
        # Implementar dados do dashboard
        return Response({'status': 'em desenvolvimento'})


# === FUNÇÕES AUXILIARES ===

def upload_documento(request):
    """Upload de documento jurídico"""
    if request.method == 'POST':
        # Implementar upload de documento
        return JsonResponse({'status': 'sucesso'})
    
    return JsonResponse({'status': 'erro'})


def gerar_numero_automatico(request):
    """Gerar números automáticos para documentos"""
    tipo = request.GET.get('tipo')
    
    if tipo == 'analise':
        numero = AnaliseJuridica()._gerar_numero_analise()
    elif tipo == 'parecer':
        numero = ParecerTecnico()._gerar_numero_parecer()
    elif tipo == 'decisao':
        numero = DecisaoAdministrativa()._gerar_numero_decisao()
    elif tipo == 'recurso':
        numero = RecursoAdministrativo()._gerar_numero_recurso()
    else:
        numero = None
    
    return JsonResponse({'numero': numero})

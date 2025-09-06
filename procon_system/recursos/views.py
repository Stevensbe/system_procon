from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    Recurso, TipoRecurso, MovimentacaoRecurso, ModeloDecisao,
    PrazoRecurso, ComissaoJulgamento, SessaoJulgamento
)


def recurso_list(request):
    """Lista de recursos com filtros"""
    recursos = Recurso.objects.all().order_by('-data_protocolo')
    
    # Filtros
    search = request.GET.get('search')
    status = request.GET.get('status')
    tipo_recurso = request.GET.get('tipo_recurso')
    instancia = request.GET.get('instancia')
    prazo_vencido = request.GET.get('prazo_vencido')
    
    if search:
        recursos = recursos.filter(
            Q(numero_protocolo__icontains=search) |
            Q(requerente_nome__icontains=search) |
            Q(numero_processo__icontains=search)
        )
    
    if status:
        recursos = recursos.filter(status=status)
    
    if tipo_recurso:
        recursos = recursos.filter(tipo_recurso_id=tipo_recurso)
    
    if instancia:
        recursos = recursos.filter(instancia=instancia)
    
    if prazo_vencido == 'sim':
        hoje = timezone.now().date()
        recursos = recursos.filter(data_limite_analise__lt=hoje)
    
    # Paginação
    paginator = Paginator(recursos, 20)
    page = request.GET.get('page')
    recursos = paginator.get_page(page)
    
    # Dados para filtros
    tipos_recurso = TipoRecurso.objects.filter(ativo=True)
    
    # Estatísticas
    stats = {
        'total_recursos': Recurso.objects.count(),
        'em_analise': Recurso.objects.filter(status='em_analise').count(),
        'vencidos': Recurso.objects.filter(data_limite_analise__lt=timezone.now().date()).count(),
        'mes_atual': Recurso.objects.filter(
            data_protocolo__month=timezone.now().month,
            data_protocolo__year=timezone.now().year
        ).count(),
    }
    
    context = {
        'recursos': recursos,
        'tipos_recurso': tipos_recurso,
        'stats': stats,
        'search': search,
        'status': status,
        'tipo_recurso': tipo_recurso,
        'instancia': instancia,
        'prazo_vencido': prazo_vencido,
        'status_choices': Recurso.STATUS_CHOICES,
        'instancia_choices': Recurso.INSTANCIA_CHOICES,
        'today': timezone.now().date(),
    }
    
    return render(request, 'recursos/recurso_list.html', context)


def recurso_detail(request, pk):
    """Detalhes do recurso"""
    recurso = get_object_or_404(Recurso, pk=pk)
    
    # Movimentações
    movimentacoes = recurso.movimentacoes.order_by('-data_movimentacao')
    
    # Recursos hierárquicos
    recursos_hierarquicos = recurso.recursos_origem.all()
    
    context = {
        'recurso': recurso,
        'movimentacoes': movimentacoes,
        'recursos_hierarquicos': recursos_hierarquicos,
    }
    
    return render(request, 'recursos/recurso_detail.html', context)


def protocolar_recurso(request):
    """Protocolar novo recurso"""
    if request.method == 'POST':
        try:
            # Calcular data limite
            tipo_recurso = TipoRecurso.objects.get(id=request.POST['tipo_recurso'])
            data_protocolo = timezone.now()
            data_limite = data_protocolo.date() + timedelta(days=tipo_recurso.prazo_dias)
            
            recurso = Recurso.objects.create(
                numero_protocolo=request.POST['numero_protocolo'],
                tipo_recurso=tipo_recurso,
                instancia=request.POST.get('instancia', 'primeira'),
                numero_processo=request.POST['numero_processo'],
                numero_auto=request.POST.get('numero_auto', ''),
                
                # Requerente
                requerente_nome=request.POST['requerente_nome'],
                requerente_tipo=request.POST['requerente_tipo'],
                requerente_documento=request.POST['requerente_documento'],
                requerente_endereco=request.POST['requerente_endereco'],
                requerente_telefone=request.POST.get('requerente_telefone', ''),
                requerente_email=request.POST.get('requerente_email', ''),
                
                # Datas
                data_protocolo=data_protocolo,
                data_limite_analise=data_limite,
                
                # Petição
                assunto=request.POST['assunto'],
                fundamentacao=request.POST['fundamentacao'],
                pedido=request.POST['pedido'],
                valor_causa=float(request.POST['valor_causa']) if request.POST.get('valor_causa') else None,
                
                criado_por=request.user.username if request.user.is_authenticated else 'Sistema'
            )
            
            # Adicionar movimentação inicial
            MovimentacaoRecurso.objects.create(
                recurso=recurso,
                tipo_movimentacao='protocolo',
                descricao=f'Recurso protocolado - {recurso.assunto}',
                responsavel=request.user.username if request.user.is_authenticated else 'Sistema'
            )
            
            messages.success(request, f'Recurso {recurso.numero_protocolo} protocolado com sucesso!')
            return redirect('recursos:recurso_detail', pk=recurso.pk)
            
        except Exception as e:
            messages.error(request, f'Erro ao protocolar recurso: {str(e)}')
    
    # Dados para formulário
    tipos_recurso = TipoRecurso.objects.filter(ativo=True)
    
    context = {
        'tipos_recurso': tipos_recurso,
        'requerente_tipos': [
            ('pessoa_fisica', 'Pessoa Física'),
            ('pessoa_juridica', 'Pessoa Jurídica'),
            ('representante', 'Representante Legal'),
        ],
        'instancia_choices': Recurso.INSTANCIA_CHOICES,
    }
    
    return render(request, 'recursos/protocolar.html', context)


def controle_prazos(request):
    """Controle de prazos dos recursos"""
    hoje = timezone.now().date()
    
    # Recursos por situação de prazo
    vencidos = Recurso.objects.filter(
        data_limite_analise__lt=hoje,
        status__in=['protocolado', 'em_analise']
    )
    
    urgentes = Recurso.objects.filter(
        data_limite_analise__lte=hoje + timedelta(days=1),
        data_limite_analise__gte=hoje,
        status__in=['protocolado', 'em_analise']
    )
    
    atencao = Recurso.objects.filter(
        data_limite_analise__lte=hoje + timedelta(days=5),
        data_limite_analise__gt=hoje + timedelta(days=1),
        status__in=['protocolado', 'em_analise']
    )
    
    # Estatísticas
    stats = {
        'vencidos': vencidos.count(),
        'urgentes': urgentes.count(),
        'atencao': atencao.count(),
        'total_pendentes': Recurso.objects.filter(status__in=['protocolado', 'em_analise']).count(),
    }
    
    context = {
        'vencidos': vencidos[:10],
        'urgentes': urgentes[:10],
        'atencao': atencao[:10],
        'stats': stats,
    }
    
    return render(request, 'recursos/prazos.html', context)


def sessao_julgamento_list(request):
    """Lista de sessões de julgamento"""
    sessoes = SessaoJulgamento.objects.all().order_by('-data_sessao')
    
    # Filtros
    comissao_id = request.GET.get('comissao')
    realizada = request.GET.get('realizada')
    
    if comissao_id:
        sessoes = sessoes.filter(comissao_id=comissao_id)
    
    if realizada == 'sim':
        sessoes = sessoes.filter(realizada=True)
    elif realizada == 'nao':
        sessoes = sessoes.filter(realizada=False)
    
    # Paginação
    paginator = Paginator(sessoes, 15)
    page = request.GET.get('page')
    sessoes = paginator.get_page(page)
    
    # Dados para filtros
    comissoes = ComissaoJulgamento.objects.filter(ativa=True)
    
    # Próximas sessões
    proximas_sessoes = SessaoJulgamento.objects.filter(
        data_sessao__gte=timezone.now().date(),
        realizada=False
    ).order_by('data_sessao')[:5]
    
    context = {
        'sessoes': sessoes,
        'comissoes': comissoes,
        'proximas_sessoes': proximas_sessoes,
        'comissao_id': comissao_id,
        'realizada': realizada,
    }
    
    return render(request, 'recursos/julgamentos.html', context)


def modelo_decisao_list(request):
    """Lista de modelos de decisão"""
    modelos = ModeloDecisao.objects.filter(ativo=True).order_by('tipo_recurso', 'nome')
    
    # Filtros
    tipo_recurso_id = request.GET.get('tipo_recurso')
    tipo_decisao = request.GET.get('tipo_decisao')
    
    if tipo_recurso_id:
        modelos = modelos.filter(tipo_recurso_id=tipo_recurso_id)
    
    if tipo_decisao:
        modelos = modelos.filter(tipo_decisao=tipo_decisao)
    
    # Dados para filtros
    tipos_recurso = TipoRecurso.objects.filter(ativo=True)
    tipos_decisao = [
        ('deferido', 'Deferido'),
        ('indeferido', 'Indeferido'),
        ('parcialmente_deferido', 'Parcialmente Deferido'),
    ]
    
    context = {
        'modelos': modelos,
        'tipos_recurso': tipos_recurso,
        'tipos_decisao': tipos_decisao,
        'tipo_recurso_id': tipo_recurso_id,
        'tipo_decisao': tipo_decisao,
    }
    
    return render(request, 'recursos/decisoes.html', context)


def dashboard_recursos(request):
    """Dashboard do módulo recursos"""
    hoje = timezone.now().date()
    mes_atual = hoje.replace(day=1)
    
    # Estatísticas gerais
    stats = {
        'total_recursos': Recurso.objects.count(),
        'recursos_mes': Recurso.objects.filter(data_protocolo__gte=mes_atual).count(),
        'em_analise': Recurso.objects.filter(status='em_analise').count(),
        'vencidos': Recurso.objects.filter(
            data_limite_analise__lt=hoje,
            status__in=['protocolado', 'em_analise']
        ).count(),
    }
    
    # Recursos por status
    recursos_por_status = Recurso.objects.values('status').annotate(count=Count('id'))
    
    # Recursos por instância
    recursos_por_instancia = Recurso.objects.values('instancia').annotate(count=Count('id'))
    
    # Recursos recentes
    recursos_recentes = Recurso.objects.order_by('-data_protocolo')[:10]
    
    # Prazos críticos
    prazos_criticos = Recurso.objects.filter(
        data_limite_analise__lte=hoje + timedelta(days=3),
        status__in=['protocolado', 'em_analise']
    ).order_by('data_limite_analise')[:10]
    
    context = {
        'stats': stats,
        'recursos_por_status': recursos_por_status,
        'recursos_por_instancia': recursos_por_instancia,
        'recursos_recentes': recursos_recentes,
        'prazos_criticos': prazos_criticos,
    }
    
    return render(request, 'recursos/dashboard.html', context)


# === APIs ===

def api_recurso_info(request, numero_protocolo):
    """API para informações do recurso"""
    try:
        recurso = Recurso.objects.get(numero_protocolo=numero_protocolo)
        data = {
            'numero_protocolo': recurso.numero_protocolo,
            'requerente_nome': recurso.requerente_nome,
            'status': recurso.get_status_display(),
            'data_protocolo': recurso.data_protocolo.strftime('%d/%m/%Y'),
            'data_limite': recurso.data_limite_analise.strftime('%d/%m/%Y'),
            'prazo_vencido': recurso.prazo_vencido,
            'dias_para_vencimento': recurso.dias_para_vencimento,
        }
        return JsonResponse(data)
    except Recurso.DoesNotExist:
        return JsonResponse({'error': 'Recurso não encontrado'}, status=404)


def api_estatisticas_recursos(request):
    """API com estatísticas dos recursos"""
    hoje = timezone.now().date()
    
    stats = {
        'total': Recurso.objects.count(),
        'por_status': list(Recurso.objects.values('status').annotate(count=Count('id'))),
        'vencidos': Recurso.objects.filter(
            data_limite_analise__lt=hoje,
            status__in=['protocolado', 'em_analise']
        ).count(),
        'urgentes': Recurso.objects.filter(
            data_limite_analise__lte=hoje + timedelta(days=1),
            status__in=['protocolado', 'em_analise']
        ).count(),
    }
    
    return JsonResponse(stats)
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
import json
import re
from decimal import Decimal, InvalidOperation

from django.db import transaction, models
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Atendimento, ConfiguracaoAtendimento
from portal_cidadao.models import ReclamacaoDenuncia, HistoricoReclamacao, AnexoReclamacao
from .services import (
    AtendimentoService,
    ValidacaoService,
    NotificacaoService,
    ReceitaFederalService,
    WorkflowService,
)

from .serializers import (
    ReclamacaoDenunciaListSerializer,
    ReclamacaoDenunciaDetailSerializer,
)


def _registrar_reclamacao(data, files, usuario, request):
    required_fields = [
        'consumidor_nome',
        'consumidor_cpf',
        'consumidor_email',
        'consumidor_endereco',
        'consumidor_cep',
        'consumidor_cidade',
        'consumidor_uf',
        'empresa_razao_social',
        'empresa_cnpj',
        'empresa_endereco',
        'descricao_fatos',
        'data_ocorrencia',
    ]

    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        raise ValidationError({'erro': f"Campos obrigatórios ausentes: {', '.join(missing)}"})

    consumidor_cpf = re.sub(r'\D', '', data.get('consumidor_cpf', ''))
    empresa_cnpj = re.sub(r'\D', '', data.get('empresa_cnpj', ''))

    try:
        data_ocorrencia = datetime.strptime(data.get('data_ocorrencia'), '%Y-%m-%d').date()
    except (TypeError, ValueError):
        raise ValidationError({'erro': 'Data da ocorrência inválida'})

    valor_envolvido = None
    raw_valor = data.get('valor_envolvido')
    if raw_valor not in (None, '', 'null'):
        raw_valor = str(raw_valor).replace('.', '').replace(',', '.')
        try:
            valor_envolvido = Decimal(raw_valor)
        except (InvalidOperation, ValueError):
            raise ValidationError({'erro': 'Valor envolvido inválido'})

    config = ConfiguracaoAtendimento.get_config()

    with transaction.atomic():
        reclamacao = ReclamacaoDenuncia.objects.create(
            tipo_demanda=data.get('tipo_demanda', 'RECLAMACAO'),
            consumidor_nome=data.get('consumidor_nome', '').strip(),
            consumidor_cpf=consumidor_cpf,
            consumidor_email=data.get('consumidor_email', ''),
            consumidor_telefone=data.get('consumidor_telefone', ''),
            consumidor_endereco=data.get('consumidor_endereco', ''),
            consumidor_cep=data.get('consumidor_cep', ''),
            consumidor_cidade=data.get('consumidor_cidade', ''),
            consumidor_uf=data.get('consumidor_uf', ''),
            empresa_razao_social=data.get('empresa_razao_social', '').strip(),
            empresa_cnpj=empresa_cnpj,
            empresa_endereco=data.get('empresa_endereco', ''),
            empresa_telefone=data.get('empresa_telefone', ''),
            empresa_email=data.get('empresa_email', ''),
            descricao_fatos=data.get('descricao_fatos', ''),
            data_ocorrencia=data_ocorrencia,
            valor_envolvido=valor_envolvido,
            atendente_responsavel=usuario,
            ip_origem=request.META.get('REMOTE_ADDR'),
            user_agent=(request.META.get('HTTP_USER_AGENT') or '')[:500],
        )

        reclamacao.prazo_resposta = timezone.now() + timedelta(days=config.prazo_resposta_dias)
        reclamacao.save(update_fields=['prazo_resposta'])

        HistoricoReclamacao.objects.create(
            reclamacao=reclamacao,
            acao='REGISTRADA',
            descricao='Reclamação registrada pelo atendente via sistema interno',
            usuario=usuario,
        )

        for file_obj in files:
            AnexoReclamacao.objects.create(
                reclamacao=reclamacao,
                arquivo=file_obj,
                descricao=file_obj.name,
                tipo_documento='OUTROS',
            )

        workflow_resultado = WorkflowService.processar_nova_reclamacao(reclamacao)
        if not workflow_resultado.get('sucesso', True):
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao='WORKFLOW_ERRO',
                descricao=f"Falha no workflow automático: {workflow_resultado.get('erro')}",
                usuario=usuario,
            )

    return reclamacao
@login_required
@permission_required('atendimento.view_atendimento')
def dashboard_atendimento(request):
    """Dashboard principal do módulo de atendimento"""
    
    # Estatísticas gerais
    hoje = timezone.now().date()
    semana_passada = hoje - timedelta(days=7)
    mes_passado = hoje - timedelta(days=30)
    
    # Atendimentos do dia
    atendimentos_hoje = Atendimento.objects.filter(
        data_atendimento__date=hoje
    ).count()
    
    # Reclamações pendentes
    reclamas_pendentes = ReclamacaoDenuncia.objects.filter(
        status__in=['REGISTRADA', 'EM_ANALISE', 'CLASSIFICADA']
    ).count()
    
    # Reclamações da semana
    reclamas_semana = ReclamacaoDenuncia.objects.filter(
        criado_em__date__gte=semana_passada
    ).count()
    
    # Satisfação média
    satisfacao_media = Atendimento.objects.filter(
        satisfacao_consumidor__isnull=False
    ).aggregate(media=models.Avg('satisfacao_consumidor'))['media'] or 0
    
    # Gráficos
    atendimentos_por_tipo = Atendimento.objects.filter(
        data_atendimento__date__gte=semana_passada
    ).values('tipo_atendimento').annotate(
        total=Count('id')
    ).order_by('-total')
    
    status_reclamacoes = ReclamacaoDenuncia.objects.values('status').annotate(
        total=Count('id')
    ).order_by('-total')
    
    context = {
        'atendimentos_hoje': atendimentos_hoje,
        'reclamas_pendentes': reclamas_pendentes,
        'reclamas_semana': reclamas_semana,
        'satisfacao_media': round(satisfacao_media, 1),
        'atendimentos_por_tipo': list(atendimentos_por_tipo),
        'status_reclamacoes': list(status_reclamacoes),
    }
    
    return render(request, 'atendimento/dashboard.html', context)


@login_required
@permission_required('atendimento.add_atendimento')
def novo_atendimento(request):
    """Formulário para novo atendimento"""
    
    if request.method == 'POST':
        try:
            # Criar atendimento
            atendimento = Atendimento.objects.create(
                atendente=request.user,
                consumidor_nome=request.POST.get('consumidor_nome'),
                consumidor_cpf=request.POST.get('consumidor_cpf'),
                consumidor_telefone=request.POST.get('consumidor_telefone', ''),
                consumidor_email=request.POST.get('consumidor_email', ''),
                tipo_atendimento=request.POST.get('tipo_atendimento'),
                observacoes=request.POST.get('observacoes', ''),
            )
            
            messages.success(request, f'Atendimento {atendimento.numero_atendimento} criado com sucesso!')
            return redirect('atendimento:detalhes_atendimento', pk=atendimento.id)
            
        except Exception as e:
            messages.error(request, f'Erro ao criar atendimento: {str(e)}')
    
    return render(request, 'atendimento/novo_atendimento.html')


@login_required
@permission_required('atendimento.view_atendimento')
def detalhes_atendimento(request, pk):
    """Detalhes de um atendimento específico"""
    
    atendimento = get_object_or_404(Atendimento, pk=pk)
    
    # Buscar reclamações relacionadas
    reclamas_relacionadas = ReclamacaoDenuncia.objects.filter(
        consumidor_cpf=atendimento.consumidor_cpf
    ).order_by('-criado_em')
    
    context = {
        'atendimento': atendimento,
        'reclamas_relacionadas': reclamas_relacionadas,
    }
    
    return render(request, 'atendimento/detalhes_atendimento.html', context)


@login_required
@permission_required('atendimento.add_reclamacaodenuncia')
def nova_reclamacao(request):
    """Formulário para nova reclamação/denúncia"""
    
    if request.method == 'POST':
        try:
            # Criar reclamação
            reclamacao = ReclamacaoDenuncia.objects.create(
                tipo_demanda=request.POST.get('tipo_demanda'),
                consumidor_nome=request.POST.get('consumidor_nome'),
                consumidor_cpf=request.POST.get('consumidor_cpf'),
                consumidor_email=request.POST.get('consumidor_email'),
                consumidor_telefone=request.POST.get('consumidor_telefone'),
                consumidor_endereco=request.POST.get('consumidor_endereco'),
                consumidor_cep=request.POST.get('consumidor_cep'),
                consumidor_cidade=request.POST.get('consumidor_cidade'),
                consumidor_uf=request.POST.get('consumidor_uf'),
                empresa_razao_social=request.POST.get('empresa_razao_social'),
                empresa_cnpj=request.POST.get('empresa_cnpj'),
                empresa_endereco=request.POST.get('empresa_endereco'),
                empresa_telefone=request.POST.get('empresa_telefone', ''),
                empresa_email=request.POST.get('empresa_email', ''),
                descricao_fatos=request.POST.get('descricao_fatos'),
                data_ocorrencia=datetime.strptime(request.POST.get('data_ocorrencia'), '%Y-%m-%d').date(),
                valor_envolvido=float(request.POST.get('valor_envolvido', 0)) if request.POST.get('valor_envolvido') else None,
                atendente_responsavel=request.user,
                ip_origem=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
            
            # Criar histórico
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao='REGISTRADA',
                descricao='Reclamação registrada pelo atendente',
                usuario=request.user,
            )
            
            # Processar anexos se houver
            anexos = request.FILES.getlist('anexos')
            for anexo in anexos:
                AnexoReclamacao.objects.create(
                    reclamacao=reclamacao,
                    arquivo=anexo,
                    descricao=anexo.name,
                    tipo_documento='OUTROS',
                )
            
            messages.success(request, f'Reclamação {reclamacao.numero_protocolo} registrada com sucesso!')
            return redirect('atendimento:detalhes_reclamacao', pk=reclamacao.id)
            
        except Exception as e:
            messages.error(request, f'Erro ao registrar reclamação: {str(e)}')
    
    return render(request, 'atendimento/nova_reclamacao.html')


@login_required
@permission_required('atendimento.view_reclamacaodenuncia')
def detalhes_reclamacao(request, pk):
    """Detalhes de uma reclamação/denúncia"""
    
    reclamacao = get_object_or_404(ReclamacaoDenuncia, pk=pk)
    historico = reclamacao.historico.all()
    anexos = reclamacao.anexos.all()
    
    context = {
        'reclamacao': reclamacao,
        'historico': historico,
        'anexos': anexos,
    }
    
    return render(request, 'atendimento/detalhes_reclamacao.html', context)


@login_required
@permission_required('atendimento.change_reclamacaodenuncia')
def classificar_reclamacao(request, pk):
    """Classificar uma reclamação/denúncia"""
    
    reclamacao = get_object_or_404(ReclamacaoDenuncia, pk=pk)
    
    if request.method == 'POST':
        try:
            # Atualizar classificação
            reclamacao.tipo_classificacao = request.POST.get('tipo_classificacao')
            reclamacao.assunto_classificado = request.POST.get('assunto_classificado')
            reclamacao.competencia_procon = request.POST.get('competencia_procon') == 'on'
            reclamacao.observacoes_analise = request.POST.get('observacoes_analise', '')
            reclamacao.status = 'CLASSIFICADA'
            reclamacao.analista_responsavel = request.user
            reclamacao.save()
            
            # Criar histórico
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao='CLASSIFICADA',
                descricao=f'Reclamação classificada como {reclamacao.get_tipo_classificacao_display()}',
                usuario=request.user,
            )
            
            messages.success(request, 'Reclamação classificada com sucesso!')
            return redirect('atendimento:detalhes_reclamacao', pk=reclamacao.id)
            
        except Exception as e:
            messages.error(request, f'Erro ao classificar reclamação: {str(e)}')
    
    return render(request, 'atendimento/classificar_reclamacao.html', {'reclamacao': reclamacao})


@login_required
@permission_required('atendimento.change_reclamacaodenuncia')
def notificar_empresa(request, pk):
    """Notificar empresa sobre a reclamação"""
    
    reclamacao = get_object_or_404(ReclamacaoDenuncia, pk=pk)
    
    if request.method == 'POST':
        try:
            # Atualizar status
            reclamacao.status = 'NOTIFICADA'
            reclamacao.notificacao_enviada = True
            reclamacao.data_notificacao = timezone.now()
            reclamacao.prazo_resposta = timezone.now() + timedelta(days=10)
            reclamacao.save()
            
            # Criar histórico
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao='NOTIFICADA',
                descricao='Empresa notificada sobre a reclamação',
                usuario=request.user,
            )
            
            # Enviar notificação (implementar serviço)
            # NotificacaoService.enviar_notificacao_empresa(reclamacao)
            
            messages.success(request, 'Empresa notificada com sucesso!')
            return redirect('atendimento:detalhes_reclamacao', pk=reclamacao.id)
            
        except Exception as e:
            messages.error(request, f'Erro ao notificar empresa: {str(e)}')
    
    return render(request, 'atendimento/notificar_empresa.html', {'reclamacao': reclamacao})


@login_required
@permission_required('atendimento.change_reclamacaodenuncia')
def marcar_conciliacao(request, pk):
    """Marcar audiência de conciliação"""
    
    reclamacao = get_object_or_404(ReclamacaoDenuncia, pk=pk)
    
    if request.method == 'POST':
        try:
            # Atualizar status
            reclamacao.status = 'EM_CONCILIACAO'
            reclamacao.conciliacao_marcada = True
            reclamacao.data_conciliacao = datetime.strptime(
                request.POST.get('data_conciliacao'), '%Y-%m-%dT%H:%M'
            )
            reclamacao.save()
            
            # Criar histórico
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao='CONCILIACAO_MARCADA',
                descricao=f'Audiência de conciliação marcada para {reclamacao.data_conciliacao}',
                usuario=request.user,
            )
            
            messages.success(request, 'Audiência de conciliação marcada com sucesso!')
            return redirect('atendimento:detalhes_reclamacao', pk=reclamacao.id)
            
        except Exception as e:
            messages.error(request, f'Erro ao marcar conciliação: {str(e)}')
    
    return render(request, 'atendimento/marcar_conciliacao.html', {'reclamacao': reclamacao})


@login_required
@permission_required('atendimento.change_reclamacaodenuncia')
def registrar_resultado_conciliacao(request, pk):
    """Registrar resultado da conciliação"""
    
    reclamacao = get_object_or_404(ReclamacaoDenuncia, pk=pk)
    
    if request.method == 'POST':
        try:
            # Atualizar resultado
            reclamacao.conciliacao_realizada = True
            reclamacao.resultado_conciliacao = request.POST.get('resultado_conciliacao')
            
            if request.POST.get('resultado_conciliacao') == 'ACORDO':
                reclamacao.status = 'CONCILIADA'
                reclamacao.valor_acordo = float(request.POST.get('valor_acordo', 0)) if request.POST.get('valor_acordo') else None
            else:
                reclamacao.status = 'EM_INSTRUCAO'
            
            reclamacao.save()
            
            # Criar histórico
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao='CONCILIACAO_REALIZADA',
                descricao=f'Resultado da conciliação: {reclamacao.get_resultado_conciliacao_display()}',
                usuario=request.user,
            )
            
            messages.success(request, 'Resultado da conciliação registrado com sucesso!')
            return redirect('atendimento:detalhes_reclamacao', pk=reclamacao.id)
            
        except Exception as e:
            messages.error(request, f'Erro ao registrar resultado: {str(e)}')
    
    return render(request, 'atendimento/resultado_conciliacao.html', {'reclamacao': reclamacao})


@login_required
@permission_required('atendimento.change_reclamacaodenuncia')
def elaborar_decisao(request, pk):
    """Elaborar decisão administrativa"""
    
    reclamacao = get_object_or_404(ReclamacaoDenuncia, pk=pk)
    
    if request.method == 'POST':
        try:
            # Atualizar decisão
            reclamacao.decisao_elaborada = True
            reclamacao.data_decisao = timezone.now()
            reclamacao.tipo_decisao = request.POST.get('tipo_decisao')
            reclamacao.fundamentacao_decisao = request.POST.get('fundamentacao_decisao')
            reclamacao.status = 'DECIDIDA'
            reclamacao.save()
            
            # Criar histórico
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao='DECISAO_ELABORADA',
                descricao=f'Decisão elaborada: {reclamacao.get_tipo_decisao_display()}',
                usuario=request.user,
            )
            
            messages.success(request, 'Decisão elaborada com sucesso!')
            return redirect('atendimento:detalhes_reclamacao', pk=reclamacao.id)
            
        except Exception as e:
            messages.error(request, f'Erro ao elaborar decisão: {str(e)}')
    
    return render(request, 'atendimento/elaborar_decisao.html', {'reclamacao': reclamacao})


@login_required
@permission_required('atendimento.change_reclamacaodenuncia')
def aplicar_penalidade(request, pk):
    """Aplicar penalidade"""
    
    reclamacao = get_object_or_404(ReclamacaoDenuncia, pk=pk)
    
    if request.method == 'POST':
        try:
            # Atualizar penalidade
            reclamacao.penalidade_aplicada = True
            reclamacao.tipo_penalidade = request.POST.get('tipo_penalidade')
            reclamacao.valor_multa = float(request.POST.get('valor_multa', 0)) if request.POST.get('valor_multa') else None
            reclamacao.status = 'APLICADA_PENALIDADE'
            reclamacao.save()
            
            # Criar histórico
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao='PENALIDADE_APLICADA',
                descricao=f'Penalidade aplicada: {reclamacao.get_tipo_penalidade_display()}',
                usuario=request.user,
            )
            
            messages.success(request, 'Penalidade aplicada com sucesso!')
            return redirect('atendimento:detalhes_reclamacao', pk=reclamacao.id)
            
        except Exception as e:
            messages.error(request, f'Erro ao aplicar penalidade: {str(e)}')
    
    return render(request, 'atendimento/aplicar_penalidade.html', {'reclamacao': reclamacao})


# === APIs ===


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_dashboard_atendimento(request):
    """Retorna estatísticas e dados recentes do módulo de atendimento."""

    hoje = timezone.now().date()
    semana_passada = hoje - timedelta(days=7)

    atendimentos_hoje = Atendimento.objects.filter(
        data_atendimento__date=hoje
    ).count()

    reclamas_pendentes = ReclamacaoDenuncia.objects.filter(
        status__in=['REGISTRADA', 'EM_ANALISE', 'CLASSIFICADA']
    ).count()

    reclamas_semana = ReclamacaoDenuncia.objects.filter(
        criado_em__date__gte=semana_passada
    ).count()

    satisfacao_media = Atendimento.objects.filter(
        satisfacao_consumidor__isnull=False
    ).aggregate(media=models.Avg('satisfacao_consumidor'))['media'] or 0

    atendimentos_por_tipo = list(
        Atendimento.objects.filter(
            data_atendimento__date__gte=semana_passada
        ).values('tipo_atendimento').annotate(total=Count('id')).order_by('-total')
    )

    status_reclamacoes = list(
        ReclamacaoDenuncia.objects.values('status').annotate(total=Count('id')).order_by('-total')
    )

    reclamacoes_recentes = [
        {
            'id': item.id,
            'numero_protocolo': item.numero_protocolo,
            'consumidor_nome': item.consumidor_nome,
            'empresa_razao_social': item.empresa_razao_social,
            'status': item.status,
            'status_display': item.get_status_display(),
            'criado_em': item.criado_em,
        }
        for item in ReclamacaoDenuncia.objects.order_by('-criado_em')[:10]
    ]

    return Response({
        'atendimentos_hoje': atendimentos_hoje,
        'reclamas_pendentes': reclamas_pendentes,
        'reclamas_semana': reclamas_semana,
        'satisfacao_media': round(satisfacao_media, 2),
        'atendimentos_por_tipo': atendimentos_por_tipo,
        'status_reclamacoes': status_reclamacoes,
        'reclamacoes_recentes': reclamacoes_recentes,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def api_reclamacoes(request):
    """Lista e cria reclamações/denúncias via API."""

    if request.method == 'GET':
        queryset = ReclamacaoDenuncia.objects.all()

        status_param = request.GET.get('status')
        tipo_param = request.GET.get('tipo')
        search_param = request.GET.get('search')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if tipo_param:
            queryset = queryset.filter(tipo_demanda=tipo_param)
        if search_param:
            queryset = queryset.filter(
                Q(numero_protocolo__icontains=search_param)
                | Q(consumidor_nome__icontains=search_param)
                | Q(consumidor_cpf__icontains=search_param)
                | Q(empresa_razao_social__icontains=search_param)
                | Q(empresa_cnpj__icontains=search_param)
            )

        queryset = queryset.order_by('-criado_em')

        try:
            page_number = int(request.GET.get('page', 1))
        except (TypeError, ValueError):
            page_number = 1
        try:
            page_size = int(request.GET.get('page_size', 20))
        except (TypeError, ValueError):
            page_size = 20

        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page_number)

        serializer = ReclamacaoDenunciaListSerializer(
            page_obj.object_list,
            many=True,
            context={'request': request},
        )

        return Response({
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'page': page_obj.number,
            'page_size': page_size,
            'results': serializer.data,
        })

    try:
        reclamacao = _registrar_reclamacao(request.data, request.FILES.values(), request.user, request)
    except ValidationError as exc:
        return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

    serializer = ReclamacaoDenunciaDetailSerializer(
        reclamacao,
        context={'request': request},
    )
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_reclamacao_detalhe(request, pk):
    """Retorna detalhes completos de uma reclamação/denúncia."""

    reclamacao = get_object_or_404(ReclamacaoDenuncia, pk=pk)
    serializer = ReclamacaoDenunciaDetailSerializer(
        reclamacao,
        context={'request': request},
    )
    return Response(serializer.data)


@login_required
@require_http_methods(["GET"])
def api_consultar_cnpj(request):
    """API para consultar CNPJ na Receita Federal"""
    
    cnpj = request.GET.get('cnpj', '').replace('.', '').replace('/', '').replace('-', '')
    
    if len(cnpj) != 14:
        return JsonResponse({'erro': 'CNPJ inválido'}, status=400)
    
    try:
        resultado = ReceitaFederalService.consultar_cnpj(cnpj)
        if not resultado.get('sucesso'):
            mensagem = resultado.get('erro', 'Erro na consulta a Receita Federal')
            return JsonResponse({'erro': mensagem}, status=400)
        return JsonResponse(resultado)
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def api_registro_presencial(request):
    payload = request.data.copy()
    if 'tipo_demanda' not in payload:
        payload['tipo_demanda'] = 'RECLAMACAO'
    if 'tipo_atendimento' not in payload:
        payload['tipo_atendimento'] = 'RECLAMACAO'
    if 'canal_atendimento' not in payload:
        payload['canal_atendimento'] = 'BALCAO'

    try:
        reclamacao = _registrar_reclamacao(payload, request.FILES.values(), request.user, request)
    except ValidationError as exc:
        return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

    dados_atendimento = {
        'consumidor_nome': payload.get('consumidor_nome', '').strip(),
        'consumidor_cpf': payload.get('consumidor_cpf', ''),
        'consumidor_telefone': payload.get('consumidor_telefone', ''),
        'consumidor_email': payload.get('consumidor_email', ''),
        'tipo_atendimento': payload.get('tipo_atendimento', 'RECLAMACAO'),
        'canal_atendimento': payload.get('canal_atendimento', 'BALCAO'),
        'observacoes': payload.get('observacoes', ''),
    }

    resultado = AtendimentoService.registrar_presencial(dados_atendimento, request.user, reclamacao)
    if not resultado.get('sucesso'):
        return Response({'erro': resultado.get('erro', 'Falha ao registrar atendimento')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    atendimento = resultado['atendimento']
    serializer = ReclamacaoDenunciaDetailSerializer(
        reclamacao,
        context={'request': request},
    )
    return Response({
        'atendimento_id': atendimento.id,
        'numero_atendimento': atendimento.numero_atendimento,
        'tipo_atendimento': atendimento.tipo_atendimento,
        'canal_atendimento': atendimento.canal_atendimento,
        'reclamacao': serializer.data,
    }, status=status.HTTP_201_CREATED)

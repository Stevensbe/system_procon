from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import never_cache
from django.core.paginator import Paginator
from django.db.models.functions import TruncDate
from django.db.models import Q, Count, Avg, Min, Max
from django.utils import timezone
from datetime import datetime, timedelta
import json
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.contrib.contenttypes.models import ContentType
from django.db import transaction, models
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes, parser_classes, authentication_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Atendimento, ConfiguracaoAtendimento, BalcaoAtendimento, RegraDistribuicaoAtendimento
from portal_cidadao.models import ReclamacaoDenuncia, HistoricoReclamacao, AnexoReclamacao
from portal_empresa.models import RespostaEmpresaPortal, SolicitacaoCadastroEmpresa, EmpresaAutorizada
from notificacoes.models import TipoNotificacao, Notificacao
from notificacoes.services import NotificacaoService
from .services import (
    AtendimentoService,
    ValidacaoService,
    ReceitaFederalService,
    WorkflowService,
    ClassificacaoService,
    DistribuicaoAutomaticaService,
    encaminhar_para_fiscalizacao,
)

_notificacao_service = NotificacaoService()


def _garantir_tipo_notificacao(codigo: str, nome: str, descricao: str) -> TipoNotificacao:
    tipo, created = TipoNotificacao.objects.get_or_create(
        codigo=codigo,
        defaults={
            'nome': nome,
            'descricao': descricao,
            'ativo': True,
        },
    )
    if not tipo.ativo:
        tipo.ativo = True
        tipo.save(update_fields=['ativo'])
    return tipo


def _notificacao_existente(tipo_codigo: str, reclamacao: ReclamacaoDenuncia, destinatario) -> bool:
    tipo = TipoNotificacao.objects.filter(codigo=tipo_codigo).first()
    if not tipo:
        return False
    ct = ContentType.objects.get_for_model(ReclamacaoDenuncia)
    return Notificacao.objects.filter(
        tipo=tipo,
        destinatario=destinatario,
        content_type=ct,
        object_id=reclamacao.id,
        status__in=['pendente', 'enviada'],
    ).exists()


def _responsavel_reclamacao(reclamacao: ReclamacaoDenuncia):
    return (
        reclamacao.atendente_responsavel
        or getattr(getattr(reclamacao, 'atendimento', None), 'atendente', None)
        or reclamacao.analista_responsavel
    )


def _processar_alertas_prazos(config: ConfiguracaoAtendimento):
    agora = timezone.now()
    alertas = []

    # Garantir tipos de notificação
    _garantir_tipo_notificacao(
        'ATENDIMENTO_PRAZO_RESPOSTA_PROXIMO',
        'Prazo de resposta próximo',
        'Alerta de prazo de resposta próximo do vencimento.',
    )
    _garantir_tipo_notificacao(
        'ATENDIMENTO_PRAZO_RESPOSTA_VENCIDO',
        'Prazo de resposta vencido',
        'Alerta de prazo de resposta vencido.',
    )
    _garantir_tipo_notificacao(
        'ATENDIMENTO_CONCILIACAO_PROXIMA',
        'Conciliação próxima',
        'Alerta de conciliação agendada próxima.',
    )
    _garantir_tipo_notificacao(
        'ATENDIMENTO_CONCILIACAO_VENCIDA',
        'Conciliação vencida',
        'Alerta de conciliação agendada vencida.',
    )
    _garantir_tipo_notificacao(
        'ATENDIMENTO_DECISAO_PROXIMA',
        'Decisão próxima do prazo',
        'Alerta para elaboração de decisão próxima do prazo.',
    )
    _garantir_tipo_notificacao(
        'ATENDIMENTO_DECISAO_VENCIDA',
        'Decisão com prazo vencido',
        'Alerta para elaboração de decisão com prazo vencido.',
    )

    # Prazo de resposta
    reclamacoes_resposta = ReclamacaoDenuncia.objects.filter(
        prazo_resposta__isnull=False,
        resposta_recebida=False,
        status__in=['NOTIFICADA', 'AGUARDANDO_RESPOSTA'],
    ).select_related(
        'atendente_responsavel',
        'analista_responsavel',
        'atendimento__atendente',
    )

    for reclamacao in reclamacoes_resposta:
        destinatario = _responsavel_reclamacao(reclamacao)
        if not destinatario:
            continue

        delta = reclamacao.prazo_resposta - agora
        if delta.total_seconds() < 0:
            codigo_alerta = 'ATENDIMENTO_PRAZO_RESPOSTA_VENCIDO'
            situacao = 'vencido'
            prioridade = 'urgente'
        elif delta <= timedelta(days=1):
            codigo_alerta = 'ATENDIMENTO_PRAZO_RESPOSTA_PROXIMO'
            situacao = 'proximo'
            prioridade = 'alta'
        else:
            continue

        if not _notificacao_existente(codigo_alerta, reclamacao, destinatario):
            mensagem = (
                f"O prazo de resposta da reclamação {reclamacao.numero_protocolo} "
                f"{'venceu' if situacao == 'vencido' else 'vence em menos de 24 horas'}."
            )
            _notificacao_service.criar_notificacao(
                tipo_codigo=codigo_alerta,
                destinatario_id=destinatario.id,
                titulo="Alerta de prazo de resposta",
                mensagem=mensagem,
                prioridade=prioridade,
                dados_extras={
                    'numero_protocolo': reclamacao.numero_protocolo,
                    'prazo_limite': reclamacao.prazo_resposta.isoformat(),
                    'status': reclamacao.status,
                },
                objeto_relacionado=reclamacao,
            )

        alertas.append({
            'numero_protocolo': reclamacao.numero_protocolo,
            'tipo_alerta': 'resposta',
            'situacao': situacao,
            'prazo': reclamacao.prazo_resposta.isoformat(),
        })

    # Conciliação agendada
    conciliacoes = ReclamacaoDenuncia.objects.filter(
        data_conciliacao__isnull=False,
        conciliacao_realizada=False,
    ).select_related(
        'atendente_responsavel',
        'analista_responsavel',
    )

    for reclamacao in conciliacoes:
        destinatario = reclamacao.analista_responsavel or reclamacao.atendente_responsavel
        if not destinatario:
            continue

        delta = reclamacao.data_conciliacao - agora
        if delta.total_seconds() < 0:
            codigo_alerta = 'ATENDIMENTO_CONCILIACAO_VENCIDA'
            situacao = 'vencido'
            prioridade = 'alta'
        elif delta <= timedelta(days=1):
            codigo_alerta = 'ATENDIMENTO_CONCILIACAO_PROXIMA'
            situacao = 'proximo'
            prioridade = 'normal'
        else:
            continue

        if not _notificacao_existente(codigo_alerta, reclamacao, destinatario):
            mensagem = (
                f"A conciliação da reclamação {reclamacao.numero_protocolo} "
                f"{'está atrasada' if situacao == 'vencido' else 'ocorrerá em menos de 24 horas'}."
            )
            _notificacao_service.criar_notificacao(
                tipo_codigo=codigo_alerta,
                destinatario_id=destinatario.id,
                titulo="Alerta de conciliação",
                mensagem=mensagem,
                prioridade=prioridade,
                dados_extras={
                    'numero_protocolo': reclamacao.numero_protocolo,
                    'data_conciliacao': reclamacao.data_conciliacao.isoformat(),
                    'status': reclamacao.status,
                },
                objeto_relacionado=reclamacao,
            )

        alertas.append({
            'numero_protocolo': reclamacao.numero_protocolo,
            'tipo_alerta': 'conciliacao',
            'situacao': situacao,
            'prazo': reclamacao.data_conciliacao.isoformat(),
        })

    # Decisão
    reclamacoes_instrucao = ReclamacaoDenuncia.objects.filter(
        data_inicio_instrucao__isnull=False,
        decisao_elaborada=False,
        status__in=['EM_INSTRUCAO'],
    ).select_related(
        'analista_responsavel',
    )

    for reclamacao in reclamacoes_instrucao:
        destinatario = reclamacao.analista_responsavel
        if not destinatario:
            continue

        prazo_decisao = reclamacao.data_inicio_instrucao + timedelta(days=config.prazo_decisao_dias)
        delta = prazo_decisao - agora
        if delta.total_seconds() < 0:
            codigo_alerta = 'ATENDIMENTO_DECISAO_VENCIDA'
            situacao = 'vencido'
            prioridade = 'alta'
        elif delta <= timedelta(days=1):
            codigo_alerta = 'ATENDIMENTO_DECISAO_PROXIMA'
            situacao = 'proximo'
            prioridade = 'normal'
        else:
            continue

        if not _notificacao_existente(codigo_alerta, reclamacao, destinatario):
            mensagem = (
                f"A decisão da reclamação {reclamacao.numero_protocolo} "
                f"{'está com prazo vencido' if situacao == 'vencido' else 'vence em menos de 24 horas'}."
            )
            _notificacao_service.criar_notificacao(
                tipo_codigo=codigo_alerta,
                destinatario_id=destinatario.id,
                titulo="Alerta de decisão",
                mensagem=mensagem,
                prioridade=prioridade,
                dados_extras={
                    'numero_protocolo': reclamacao.numero_protocolo,
                    'prazo_limite': prazo_decisao.isoformat(),
                    'status': reclamacao.status,
                },
                objeto_relacionado=reclamacao,
            )

        alertas.append({
            'numero_protocolo': reclamacao.numero_protocolo,
            'tipo_alerta': 'decisao',
            'situacao': situacao,
            'prazo': prazo_decisao.isoformat(),
        })

    return alertas
from business_intelligence.services import atendimento_analytics_service

from .serializers import (
    ReclamacaoDenunciaListSerializer,
    ReclamacaoDenunciaDetailSerializer,
    ConfiguracaoAtendimentoSerializer,
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
    consentimento_valor = str(data.get('consentimento_lgpd', 'true')).strip().lower()
    if consentimento_valor in {'0', 'false', 'nao', 'não', 'n', 'off'}:
        raise ValidationError({'erro': 'É necessário aceitar o uso de dados pessoais (LGPD).'})


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
    descricao_fatos = data.get('descricao_fatos', '')
    observacoes_extra = data.get('observacoes', '')
    texto_classificacao = f"{descricao_fatos} {observacoes_extra}".strip()
    gravidade, correspondencias = ClassificacaoService.classificar_gravidade(texto_classificacao)
    tipo_classificacao = ClassificacaoService.determinar_tipo_classificacao(texto_classificacao, valor_envolvido)
    assunto_classificado = ClassificacaoService.classificar_assunto(texto_classificacao)

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
            assunto_classificado=assunto_classificado,
            tipo_classificacao=tipo_classificacao,
            atendente_responsavel=usuario,
            ip_origem=request.META.get('REMOTE_ADDR'),
            user_agent=(request.META.get('HTTP_USER_AGENT') or '')[:500],
        )

        reclamacao.distribuidor_responsavel = DistribuicaoAutomaticaService.obter_responsavel(
            gravidade=gravidade,
            assunto=assunto_classificado,
            tipo_classificacao=tipo_classificacao,
        )
        reclamacao.prazo_resposta = timezone.now() + timedelta(days=config.prazo_resposta_dias)
        reclamacao.save(update_fields=['prazo_resposta', 'distribuidor_responsavel'])

        HistoricoReclamacao.objects.create(
            reclamacao=reclamacao,
            acao='REGISTRADA',
            descricao='Reclamação registrada pelo atendente via sistema interno',
            usuario=usuario,
        )

        limite_mb = config.tamanho_maximo_documentos_mb or 10
        limite_bytes = limite_mb * 1024 * 1024

        for file_obj in files:
            if not file_obj:
                continue
            if getattr(file_obj, 'size', 0) > limite_bytes:
                raise ValidationError({'anexos': f"O anexo {file_obj.name} excede o limite de {limite_mb}MB."})

            AnexoReclamacao.objects.create(
                reclamacao=reclamacao,
                arquivo=file_obj,
                descricao=Path(file_obj.name).name[:200],
                tipo_documento='OUTROS',
                armazenamento_origem='atendimento_presencial',
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
            config = ConfiguracaoAtendimento.get_config()
            limite_mb = config.tamanho_maximo_documentos_mb or 10
            limite_bytes = limite_mb * 1024 * 1024

            anexos = request.FILES.getlist('anexos')
            for anexo in anexos:
                if getattr(anexo, 'size', 0) > limite_bytes:
                    raise ValidationError(f"O anexo {anexo.name} excede o limite de {limite_mb}MB.")

                AnexoReclamacao.objects.create(
                    reclamacao=reclamacao,
                    arquivo=anexo,
                    descricao=Path(anexo.name).name[:200],
                    tipo_documento='OUTROS',
                    armazenamento_origem='atendimento_presencial',
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

    config = ConfiguracaoAtendimento.get_config()
    alertas_prazo = _processar_alertas_prazos(config)

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
        'alertas_prazo': alertas_prazo,
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


@api_view(['GET'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def api_consultar_cnpj(request):
    """API para consultar CNPJ na Receita Federal."""
    cnpj = request.GET.get('cnpj', '').replace('.', '').replace('/', '').replace('-', '')

    if len(cnpj) != 14:
        return Response({'erro': 'CNPJ inválido'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        resultado = ReceitaFederalService.consultar_cnpj(cnpj)
        if not resultado.get('sucesso'):
            mensagem = resultado.get('erro', 'Erro na consulta a Receita Federal')
            return Response({'erro': mensagem}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado)
    except Exception as e:
        return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_cadastro_rapido_empresa(request):
    """Registra uma solicitacao simplificada de cadastro de empresa para analise posterior."""
    dados = request.data or {}
    cnpj_raw = (dados.get('cnpj') or '').strip()
    cnpj_numeros = re.sub(r'\D', '', cnpj_raw)

    if not cnpj_numeros:
        return Response({'erro': 'Informe o CNPJ da empresa.'}, status=status.HTTP_400_BAD_REQUEST)

    if not ValidacaoService.validar_cnpj(cnpj_numeros):
        return Response({'erro': 'CNPJ invalido.'}, status=status.HTTP_400_BAD_REQUEST)

    cnpj_formatado = f"{cnpj_numeros[:2]}.{cnpj_numeros[2:5]}.{cnpj_numeros[5:8]}/{cnpj_numeros[8:12]}-{cnpj_numeros[12:]}"

    if EmpresaAutorizada.objects.filter(cnpj=cnpj_formatado).exists():
        return Response(
            {'mensagem': 'A empresa ja esta cadastrada na base do Portal da Empresa.'},
            status=status.HTTP_200_OK,
        )

    solicitacao_existente = SolicitacaoCadastroEmpresa.objects.filter(
        cnpj=cnpj_formatado,
        status__in=['PENDENTE', 'APROVADA'],
    ).first()
    if solicitacao_existente:
        return Response(
            {'mensagem': 'Ja existe uma solicitacao de cadastro em analise para este CNPJ.'},
            status=status.HTTP_200_OK,
        )

    razao_social = (dados.get('razao_social') or '').strip()
    if not razao_social:
        return Response({'erro': 'Informe a razao social da empresa.'}, status=status.HTTP_400_BAD_REQUEST)

    email_contato = (dados.get('email') or '').strip()
    if not email_contato:
        return Response({'erro': 'Informe um e-mail de contato da empresa.'}, status=status.HTTP_400_BAD_REQUEST)

    endereco = (dados.get('endereco') or '').strip()
    if not endereco:
        return Response({'erro': 'Informe o endereco completo da empresa.'}, status=status.HTTP_400_BAD_REQUEST)

    cidade = (dados.get('cidade') or '').strip()
    if not cidade:
        return Response({'erro': 'Informe a cidade do endereco da empresa.'}, status=status.HTTP_400_BAD_REQUEST)

    estado = (dados.get('estado') or '').strip().upper()
    if not estado or len(estado) != 2:
        return Response({'erro': 'Informe a UF do endereco da empresa (2 letras).'}, status=status.HTTP_400_BAD_REQUEST)

    solicitacao = SolicitacaoCadastroEmpresa.objects.create(
        razao_social=razao_social,
        nome_fantasia=(dados.get('nome_fantasia') or '').strip() or razao_social,
        cnpj=cnpj_formatado,
        email_contato=email_contato,
        telefone_contato=(dados.get('telefone') or '').strip(),
        responsavel_legal=(dados.get('responsavel') or '').strip() or 'Responsavel nao informado',
        cargo_responsavel=(dados.get('cargo') or '').strip(),
        endereco_completo=endereco,
        cidade=cidade,
        estado=estado,
        cep=(dados.get('cep') or '').strip(),
        observacoes=(dados.get('observacoes') or 'Cadastro rapido realizado via atendimento presencial.').strip(),
        status='PENDENTE',
    )

    return Response(
        {
            'mensagem': 'Solicitacao de cadastro registrada e encaminhada para analise.',
            'solicitacao_id': solicitacao.id,
        },
        status=status.HTTP_201_CREATED,
    )


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

    texto_classificacao = f"{payload.get('descricao_fatos', '')} {payload.get('observacoes', '')}".strip()
    gravidade, correspondencias = ClassificacaoService.classificar_gravidade(texto_classificacao)
    tipo_classificacao = ClassificacaoService.determinar_tipo_classificacao(
        texto_classificacao,
        reclamacao.valor_envolvido,
    )

    dados_atendimento = {
        'consumidor_nome': payload.get('consumidor_nome', '').strip(),
        'consumidor_cpf': payload.get('consumidor_cpf', ''),
        'consumidor_telefone': payload.get('consumidor_telefone', ''),
        'consumidor_email': payload.get('consumidor_email', ''),
        'tipo_atendimento': payload.get('tipo_atendimento', 'RECLAMACAO'),
        'canal_atendimento': payload.get('canal_atendimento', 'BALCAO'),
        'observacoes': payload.get('observacoes', ''),
        'descricao_fatos': payload.get('descricao_fatos', ''),
        'valor_envolvido': valor_envolvido,
        'consentimento_lgpd': True,
        'consentimento_origem': payload.get('consentimento_origem', 'GUICHE'),
        'consentimento_registrado_em': timezone.now(),
        'gravidade': gravidade,
        'classificacao_automatica': {
            'gravidade': gravidade,
            'correspondencias': correspondencias,
            'tipo_classificacao': tipo_classificacao,
            'assunto_classificado': assunto_classificado,
        },
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


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def api_configuracao_atendimento(request):
    """Consulta ou atualiza parâmetros de prazo do atendimento."""
    config = ConfiguracaoAtendimento.get_config()

    if request.method == 'GET':
        serializer = ConfiguracaoAtendimentoSerializer(config)
        return Response(serializer.data)

    if not request.user.is_staff:
        return Response(
            {'detail': 'Você não possui permissão para alterar as configurações.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = ConfiguracaoAtendimentoSerializer(
        config,
        data=request.data,
        partial=True,
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_regras_distribuicao(request):
    """Lista ou cria regras de distribuição automática."""
    if request.method == 'GET':
        queryset = RegraDistribuicaoAtendimento.objects.order_by('prioridade', 'id')
        serializer = RegraDistribuicaoSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    if not request.user.is_staff:
        return Response(
            {'detail': 'Você não possui permissão para alterar as regras.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = RegraDistribuicaoSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_regra_distribuicao_detalhe(request, pk):
    """Recupera, atualiza ou remove uma regra de distribuição."""
    regra = get_object_or_404(RegraDistribuicaoAtendimento, pk=pk)

    if request.method == 'GET':
        serializer = RegraDistribuicaoSerializer(regra, context={'request': request})
        return Response(serializer.data)

    if not request.user.is_staff:
        return Response(
            {'detail': 'Você não possui permissão para alterar as regras.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'PUT':
        serializer = RegraDistribuicaoSerializer(regra, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    regra.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_relatorios_detalhados(request):
    """Retorna métricas detalhadas do módulo de atendimento."""
    queryset = Atendimento.objects.select_related('atendente', 'reclamacao').all()

    data_inicio = request.query_params.get('data_inicio')
    data_fim = request.query_params.get('data_fim')
    atendente_id = request.query_params.get('atendente')
    empresa_cnpj = request.query_params.get('empresa_cnpj')
    gravidade = request.query_params.get('gravidade')

    if data_inicio:
        queryset = queryset.filter(data_atendimento__date__gte=data_inicio)
    if data_fim:
        queryset = queryset.filter(data_atendimento__date__lte=data_fim)
    if atendente_id:
        queryset = queryset.filter(atendente_id=atendente_id)
    if empresa_cnpj:
        queryset = queryset.filter(reclamacao__empresa_cnpj__icontains=empresa_cnpj)
    if gravidade:
        queryset = queryset.filter(gravidade=gravidade.upper())

    consulta_em = timezone.now()
    periodo_calculado = queryset.aggregate(inicio=Min('data_atendimento'), fim=Max('data_atendimento'))

    total = queryset.count()
    por_gravidade = queryset.values('gravidade').annotate(total=Count('id')).order_by('gravidade')
    por_atendente = queryset.values('atendente__username').annotate(total=Count('id')).order_by('-total')
    serie_diaria = queryset.annotate(dia=TruncDate('data_atendimento')).values('dia').annotate(total=Count('id')).order_by('dia')
    tempo_medio = queryset.exclude(duracao_minutos__isnull=True).aggregate(media=Avg('duracao_minutos'))['media']

    empresas = queryset.filter(
        reclamacao__empresa_razao_social__isnull=False
    ).values('reclamacao__empresa_razao_social').annotate(total=Count('id')).order_by('-total')[:10]

    consentimentos_confirmados = queryset.filter(consentimento_lgpd=True).count()
    consentimentos_pendentes = queryset.filter(consentimento_lgpd=False).count()
    remocoes_pendentes = queryset.filter(dados_remocao_solicitada_em__isnull=False, dados_removidos_em__isnull=True).count()
    remocoes_concluidas = queryset.filter(dados_removidos_em__isnull=False).count()

    reclamacao_ids = list(
        queryset.exclude(reclamacao__isnull=True).values_list('reclamacao_id', flat=True).distinct()
    )
    anexos_qs = AnexoReclamacao.objects.filter(reclamacao_id__in=reclamacao_ids)
    anexos_ativos = anexos_qs.filter(removido_em__isnull=True).count()
    anexos_removidos = anexos_qs.filter(removido_em__isnull=False).count()
    respostas_portal_qs = RespostaEmpresaPortal.objects.filter(
        reclamacao_relacionada_id__in=reclamacao_ids
    )
    portal_metricas = {
        "respostas_total": respostas_portal_qs.count(),
        "respostas_enviadas": respostas_portal_qs.filter(status="ENVIADA").count(),
        "respostas_em_analise": respostas_portal_qs.filter(status__in=["RECEBIDA_AUDITORIA", "ANALISANDO"]).count(),
        "respostas_aceitas": respostas_portal_qs.filter(status="ACEITA").count(),
        "respostas_rejeitadas": respostas_portal_qs.filter(status="REJEITADA").count(),
        "respostas_complemento": respostas_portal_qs.filter(status="SOLICITA_COMPLEMENTO").count(),
    }
    ultima_resposta = respostas_portal_qs.order_by("-data_envio", "-data_criacao").first()
    if ultima_resposta:
        referencia = ultima_resposta.data_envio or ultima_resposta.data_criacao
        portal_metricas["ultima_resposta_em"] = referencia.isoformat() if referencia else None
    else:
        portal_metricas["ultima_resposta_em"] = None

    serie_formatada = [
        {
            'data': item['dia'].isoformat() if hasattr(item['dia'], 'isoformat') else item['dia'],
            'total': item['total'],
        }
        for item in serie_diaria
    ]

    overview_payload = {
        'periodo': {
            'inicio': (data_inicio or (periodo_calculado['inicio'].date().isoformat() if periodo_calculado['inicio'] else None)),
            'fim': (data_fim or (periodo_calculado['fim'].date().isoformat() if periodo_calculado['fim'] else None)),
            'consultado_em': consulta_em.isoformat(),
        },
        'metricas': {
            'total_atendimentos': total,
            'tempo_medio_minutos': float(tempo_medio or 0),
            'lgpd': {
                'consentimentos_confirmados': consentimentos_confirmados,
                'consentimentos_pendentes': consentimentos_pendentes,
                'remocoes_pendentes': remocoes_pendentes,
                'remocoes_concluidas': remocoes_concluidas,
            },
            'anexos': {
                'ativos': anexos_ativos,
                'removidos': anexos_removidos,
            },
            'portal_empresa': portal_metricas,
        },
        'fila': {
            'serie_diaria': serie_formatada,
        },
        'por_atendente': [
            {'atendente': item['atendente__username'] or 'N/D', 'total': item['total']}
            for item in por_atendente
        ],
        'por_gravidade': {item['gravidade'] or 'N/D': item['total'] for item in por_gravidade},
        'empresas': [
            {'empresa': item['reclamacao__empresa_razao_social'], 'total': item['total']}
            for item in empresas
        ],
    }

    atendimento_analytics_service.persist_overview(overview_payload, usuario=request.user)

    resposta = {
        'total_atendimentos': total,
        'por_gravidade': overview_payload['por_gravidade'],
        'por_atendente': overview_payload['por_atendente'],
        'serie_diaria': serie_formatada,
        'tempo_medio_minutos': tempo_medio or 0,
        'empresas': overview_payload['empresas'],
        'lgpd': overview_payload['metricas']['lgpd'],
        'anexos': overview_payload['metricas']['anexos'],
        'portal_empresa': portal_metricas,
        'ultima_atualizacao': consulta_em.isoformat(),
    }

    return Response(resposta)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_solicitar_remocao_dados(request, atendimento_id):
    """Permite registrar uma solicita��o de remo��o LGPD."""
    observacoes = request.data.get('observacoes', '')
    resultado = AtendimentoService.solicitar_remocao(atendimento_id, observacoes=observacoes)
    if not resultado.get('sucesso'):
        return Response({'erro': resultado.get('erro', 'Falha ao solicitar remo��o')}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'mensagem': 'Solicita��o de remo��o registrada.'}, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_confirmar_remocao_dados(request, atendimento_id):
    """Executa a anonimiza��o de dados pessoais de um atendimento."""
    resultado = AtendimentoService.confirmar_remocao(atendimento_id)
    if not resultado.get('sucesso'):
        return Response({'erro': resultado.get('erro', 'Falha ao remover dados')}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'mensagem': 'Dados pessoais removidos com sucesso.'}, status=status.HTTP_200_OK)


@never_cache
def totem_autoatendimento(request):
    """Tela simplificada para uso em totens de retirada de senha."""
    config = ConfiguracaoAtendimento.get_config()
    balcoes = BalcaoAtendimento.objects.filter(ativo=True).order_by('ordem_prioridade', 'nome')
    contexto = {
        'balcoes': balcoes,
        'config': config,
        'refresh_interval': max(config.atualizacao_painel_segundos, 5) if hasattr(config, 'atualizacao_painel_segundos') else 10,
    }
    return render(request, 'atendimento/totem.html', contexto)


@never_cache
def painel_atendimento_tv(request):
    """Painel para exibi��o em TVs dos guich�s."""
    config = ConfiguracaoAtendimento.get_config()
    balcoes = BalcaoAtendimento.objects.filter(ativo=True).order_by('ordem_prioridade', 'nome')
    contexto = {
        'balcoes': balcoes,
        'config': config,
        'refresh_interval': max(config.atualizacao_painel_segundos, 5) if hasattr(config, 'atualizacao_painel_segundos') else 10,
        'mensagem_aguarde_padrao': "Aguarde a chamada da proxima senha.",
    }
    return render(request, 'atendimento/painel_tv.html', contexto)

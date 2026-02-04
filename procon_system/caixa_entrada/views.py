from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Q, Avg, F, DurationField, ExpressionWrapper, Prefetch
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models.functions import Now
from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
import json
import re
import unicodedata
from .models import (
    CaixaEntrada, AnexoCaixaEntrada, HistoricoCaixaEntrada, ConfiguracaoCaixaEntrada,
    PermissaoSetorCaixaEntrada, AcessoEspecialCaixaEntrada
)
from .serializers import (
    CaixaEntradaSerializer, CaixaEntradaDetailSerializer, AnexoCaixaEntradaSerializer,
    HistoricoCaixaEntradaSerializer, ConfiguracaoCaixaEntradaSerializer,
    CaixaEntradaDashboardSerializer
)
from .mixins import AdminPermissionMixin
from .services import sincronizar_protocolo_caixa
from .constants import DESPACHO_PREDEFINIDOS

# Importar modelo Setor para verificar chefia
try:
    from protocolo_tramitacao.models import Setor
except ImportError:
    Setor = None

User = get_user_model()


SETOR_EQUIVALENCIAS = {
    'FISCALIZACAO': {'Fiscalização'},
    'FISCALIZACAO_DENUNCIAS': {'Fiscalização', 'Fiscalização - Denúncias'},
    'FISCALIZACAO_PROPRIO': {'Fiscalização', 'Fiscalização - Setor Próprio'},
    'ATENDIMENTO': {'Atendimento', 'Atendimento/Protocolo', 'Protocolo'},
    'PROTOCOLO': {'Atendimento', 'Atendimento/Protocolo', 'Protocolo'},
    'JURIDICO': {'Jurídico'},
    'JURIDICO_1': {'Jurídico', 'Jurídico 1'},
    'JURIDICO_2': {'Jurídico', 'Jurídico 2'},
    'DAF': {'Diretoria Administrativa Financeira', 'Diretoria/Administração', 'Diretoria'},
    'DIRETORIA': {'Diretoria/Administração', 'Diretoria'},
    'FINANCEIRO': {'Financeiro'},
    'COBRANCA': {'Cobrança'},
    'ADMINISTRATIVO': {'Administrativo'},
    'GERAL': {'Geral', 'Acesso Geral'},
}


def _remover_acentos(texto: str) -> str:
    if not texto:
        return ''
    return unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode('ascii')


def _normalizar_codigo_setor(valor: str) -> str:
    if not valor:
        return ''
    ascii_valor = _remover_acentos(str(valor))
    codigo = re.sub(r'[^A-Z0-9]+', '_', ascii_valor.upper()).strip('_')
    # Padronizar códigos específicos
    codigo = codigo.replace('DENUMCIAS', 'DENUNCIAS').replace('JURICO', 'JURIDICO')
    return codigo


def _gerar_variantes_setor(valor) -> set:
    variantes = set()
    if not valor:
        return variantes

    texto = str(valor).strip()
    if not texto:
        return variantes

    variantes.add(texto)

    ascii_texto = _remover_acentos(texto)
    if ascii_texto:
        variantes.add(ascii_texto)

    codigo = _normalizar_codigo_setor(texto)
    if codigo and codigo in SETOR_EQUIVALENCIAS:
        for equivalente in SETOR_EQUIVALENCIAS[codigo]:
            if equivalente:
                variantes.add(equivalente)
                ascii_equivalente = _remover_acentos(equivalente)
                if ascii_equivalente:
                    variantes.add(ascii_equivalente)

    return {valor for valor in variantes if valor}


def _aplicar_filtro_setor(queryset, valores):
    if not valores:
        return queryset

    if isinstance(valores, str):
        valores = [valores]

    variantes = set()
    for valor in valores:
        variantes.update(_gerar_variantes_setor(valor))

    variantes_normalizadas = {
        _normalizar_codigo_setor(variante)
        for variante in variantes
        if _normalizar_codigo_setor(variante)
    }

    if not variantes_normalizadas:
        return queryset.none()

    ids_correspondentes = []
    for pk, setor_destino, setor_lotacao in queryset.values_list('id', 'setor_destino', 'setor_lotacao'):
        normalizados = {
            _normalizar_codigo_setor(setor_destino),
            _normalizar_codigo_setor(setor_lotacao),
        }
        if normalizados.intersection(variantes_normalizadas):
            ids_correspondentes.append(pk)

    if not ids_correspondentes:
        return queryset.none()

    return queryset.filter(id__in=ids_correspondentes)


def _obter_setor_lotacao_usuario(usuario):
    """Obtém o setor de lotação do usuário baseado nos grupos do Django"""
    grupos = list(usuario.groups.values_list('name', flat=True))
    setores_lotacao = []
    
    for nome_grupo in grupos:
        if not nome_grupo:
            continue
        # Normalizar o nome do grupo e adicionar variantes
        setores_lotacao.extend(list(_gerar_variantes_setor(nome_grupo)))
    
    return set(setores_lotacao)


def _obter_setor_preferencial_usuario(usuario):
    """Retorna o setor principal do usuario para uso como destino."""
    grupos = list(usuario.groups.values_list('name', flat=True))
    if not grupos:
        return None
    return grupos[0]


def _usuario_pode_bloquear_documento(usuario, documento) -> bool:
    """Define se o usuario pode trancar/destrancar um documento."""
    if usuario.is_superuser or usuario.is_staff:
        return True
    setores_chefia = _obter_setores_chefia_com_subsetores(usuario)
    if not setores_chefia:
        return False
    variantes_doc = set()
    if documento.setor_destino:
        variantes_doc.update(_gerar_variantes_setor(documento.setor_destino))
    if documento.setor_lotacao:
        variantes_doc.update(_gerar_variantes_setor(documento.setor_lotacao))
    return bool(variantes_doc & setores_chefia)


def _usuario_pode_ver_documento_bloqueado(usuario, documento) -> bool:
    if not documento.bloqueado:
        return True
    if documento.bloqueado_por_id == usuario.id:
        return True
    return _usuario_pode_bloquear_documento(usuario, documento)


def _aplicar_filtro_bloqueio(queryset, usuario):
    """Remove documentos bloqueados para quem nao tem permissao."""
    if usuario.is_superuser or usuario.is_staff:
        return queryset

    filtros = Q(bloqueado=False) | Q(bloqueado_por=usuario)
    setores_chefia = _obter_setores_chefia_com_subsetores(usuario)
    if setores_chefia:
        q_chefia = Q()
        for variante in setores_chefia:
            q_chefia |= Q(setor_destino__iexact=variante) | Q(setor_lotacao__iexact=variante)
        filtros |= (Q(bloqueado=True) & q_chefia)

    return queryset.filter(filtros)


def _obter_setores_onde_e_chefe(usuario):
    """Retorna os setores onde o usuário é chefe/responsável"""
    if not Setor:
        return []
    
    setores_chefe = Setor.objects.filter(
        responsavel=usuario,
        ativo=True
    ).values_list('nome', flat=True)
    
    # Incluir variantes dos nomes dos setores
    setores_com_variantes = set()
    for setor_nome in setores_chefe:
        setores_com_variantes.update(_gerar_variantes_setor(setor_nome))
        # Também incluir a sigla se houver
        try:
            setor_obj = Setor.objects.get(nome=setor_nome)
            if setor_obj.sigla:
                setores_com_variantes.add(setor_obj.sigla)
        except Setor.DoesNotExist:
            pass
    
    return setores_com_variantes


def _obter_subsetores(setor_principal):
    """Retorna os subsetores de um setor principal baseado em padrões de nomes"""
    subsetores = set()
    
    # Mapeamento de setores principais e seus subsetores conhecidos
    SUBSETORES_MAP = {
        'FISCALIZACAO': ['Fiscalização - Denúncias', 'Fiscalização - Setor Próprio'],
        'FISCALIZACAO_DENUNCIAS': ['Fiscalização - Denúncias'],
        'JURIDICO': ['Jurídico 1', 'Jurídico 2', 'Jurídico 1 - Petições'],
        'JURIDICO_1': ['Jurídico 1', 'Jurídico 1 - Petições'],
        'JURIDICO_2': ['Jurídico 2'],
        'ATENDIMENTO': ['Atendimento/Protocolo', 'Protocolo'],
        'DIRETORIA': ['Diretoria/Administração'],
    }
    
    # Normalizar o setor principal
    setor_normalizado = _normalizar_codigo_setor(setor_principal)
    
    # Obter subsetores conhecidos
    if setor_normalizado in SUBSETORES_MAP:
        for subsetor in SUBSETORES_MAP[setor_normalizado]:
            subsetores.update(_gerar_variantes_setor(subsetor))
    
    # Buscar subsetores dinamicamente baseado em padrão de nome
    # Ex: "Jurídico 1" e "Jurídico 2" são subsetores de "Jurídico"
    setor_upper = str(setor_principal).upper().strip()
    
    # Padrões comuns de subsetores
    if 'FISCALIZACAO' in setor_upper:
        subsetores.update(_gerar_variantes_setor('Fiscalização - Denúncias'))
        subsetores.update(_gerar_variantes_setor('Fiscalização - Setor Próprio'))
    
    if 'JURIDICO' in setor_upper and 'JURIDICO 1' not in setor_upper and 'JURIDICO 2' not in setor_upper:
        subsetores.update(_gerar_variantes_setor('Jurídico 1'))
        subsetores.update(_gerar_variantes_setor('Jurídico 2'))
        subsetores.update(_gerar_variantes_setor('Jurídico 1 - Petições'))
    
    if 'ATENDIMENTO' in setor_upper:
        subsetores.update(_gerar_variantes_setor('Atendimento/Protocolo'))
        subsetores.update(_gerar_variantes_setor('Protocolo'))
    
    # Incluir o próprio setor principal
    subsetores.update(_gerar_variantes_setor(setor_principal))
    
    return subsetores


def _obter_setores_chefia_com_subsetores(usuario):
    """
    Retorna todos os setores que o usuário vê por ser chefe, incluindo subsetores.
    
    Regras:
    - Se é chefe de um subsetor específico (ex: "Jurídico 1", "Jurídico 2"), 
      vê APENAS aquele subsetor específico
    - Se é chefe de um setor principal (ex: "Jurídico"), 
      vê o setor principal e TODOS os seus subsetores
    
    Exemplo:
    - Raquel é chefe de "Jurídico 1" → vê apenas processos de "Jurídico 1"
    - Larissa é chefe de "Jurídico 2" → vê apenas processos de "Jurídico 2"
    - Se alguém é chefe de "Jurídico" (principal) → vê "Jurídico 1" e "Jurídico 2"
    """
    setores_chefia = _obter_setores_onde_e_chefe(usuario)
    todos_setores = set()
    
    # Para cada setor onde é chefe
    for setor_chefe in setores_chefia:
        # Normalizar o nome do setor
        setor_upper = str(setor_chefe).upper().strip()
        setor_normalizado = _normalizar_codigo_setor(setor_chefe)
        
        # Verificar se é um subsetor específico
        is_subsetor_especifico = (
            'JURIDICO 1' in setor_upper or 
            'JURIDICO 2' in setor_upper or
            'JURIDICO_1' in setor_normalizado or
            'JURIDICO_2' in setor_normalizado or
            'FISCALIZACAO - DENUNCIAS' in setor_upper or
            'FISCALIZACAO_DENUNCIAS' in setor_normalizado or
            'FISCALIZACAO - SETOR PROPRIO' in setor_upper or
            'FISCALIZACAO_PROPRIO' in setor_normalizado
        )
        
        if is_subsetor_especifico:
            # É chefe de um subsetor específico - incluir apenas aquele subsetor
            todos_setores.update(_gerar_variantes_setor(setor_chefe))
        else:
            # É chefe de um setor principal - incluir o setor principal e todos os subsetores
            todos_setores.update(_gerar_variantes_setor(setor_chefe))
            subsetores = _obter_subsetores(setor_chefe)
            todos_setores.update(subsetores)
    
    return todos_setores


def _obter_filtros_caixa_setor(usuario, excluir_notificados_dte=True):
    """
    Retorna os filtros Q para a Caixa Setor conforme regras do SIGED:
    a) Setor de lotação do usuário
    b) Setores aos quais tem acesso
    c) Setores onde é chefe (incluindo subsetores)
    """
    filtros_setor = Q()
    
    # Verificar se tem acesso geral
    permissoes = PermissaoSetorCaixaEntrada.objects.filter(
        usuarios=usuario,
        ativo=True,
        pode_visualizar=True
    )
    
    tem_acesso_geral = permissoes.filter(setor='GERAL').exists()
    
    if tem_acesso_geral:
        # Acesso geral - retornar filtro vazio (todos os documentos)
        return Q(), True
    
    # a) Setor de lotação do usuário
    setores_lotacao = _obter_setor_lotacao_usuario(usuario)
    if setores_lotacao:
        q_lotacao = Q()
        for variante in setores_lotacao:
            q_lotacao |= Q(setor_destino__iexact=variante) | Q(setor_lotacao__iexact=variante)
        filtros_setor |= q_lotacao
    
    # b) Setores aos quais tem acesso via permissões
    for permissao in permissoes:
        # Setor principal da permissão
        setores_permissao = set()
        setores_permissao.update(_gerar_variantes_setor(permissao.setor))
        setores_permissao.update(_gerar_variantes_setor(permissao.get_setor_display()))
        
        # Setores adicionais permitidos
        for setor_permitido in permissao.setores_permitidos or []:
            setores_permissao.update(_gerar_variantes_setor(setor_permitido))
        
        # Adicionar aos filtros
        for variante in setores_permissao:
            filtros_setor |= Q(setor_destino__iexact=variante) | Q(setor_lotacao__iexact=variante)
    
    # c) Setores onde é chefe (incluindo subsetores)
    setores_chefia_com_subsetores = _obter_setores_chefia_com_subsetores(usuario)
    if setores_chefia_com_subsetores:
        q_chefia = Q()
        for variante in setores_chefia_com_subsetores:
            q_chefia |= Q(setor_destino__iexact=variante) | Q(setor_lotacao__iexact=variante)
        filtros_setor |= q_chefia
    
    return filtros_setor, False


def filtrar_documentos_por_usuario(queryset, request, apenas_pessoal=False):
    """Aplica regras de visibilidade de documentos considerando usuário, setor e caixa pessoal."""
    usuario = request.user

    if not usuario.is_authenticated:
        return queryset.none()

    if usuario.is_superuser or usuario.is_staff:
        return queryset.filter(destinatario_direto=usuario) if apenas_pessoal else queryset

    filtros_usuario = Q(destinatario_direto=usuario) | Q(responsavel_atual=usuario)

    # 1. Setor de lotação do usuário (baseado nos grupos)
    setores_lotacao = _obter_setor_lotacao_usuario(usuario)
    if setores_lotacao:
        setor_q_lotacao = Q()
        for variante in setores_lotacao:
            setor_q_lotacao |= Q(setor_destino__iexact=variante) | Q(setor_lotacao__iexact=variante)
        filtros_usuario |= setor_q_lotacao

    # 2. Setores aos quais o usuário tem acesso explícito (via permissões)
    permissoes = PermissaoSetorCaixaEntrada.objects.filter(
        usuarios=usuario,
        ativo=True,
        pode_visualizar=True
    )
    if permissoes.filter(setor='GERAL').exists():
        return queryset.filter(destinatario_direto=usuario) if apenas_pessoal else queryset

    setores_permitidos = set()
    for permissao in permissoes:
        for variante in _gerar_variantes_setor(permissao.setor):
            setores_permitidos.add(variante)
        for variante in _gerar_variantes_setor(permissao.get_setor_display()):
            setores_permitidos.add(variante)
        for adicional in permissao.setores_permitidos or []:
            for variante in _gerar_variantes_setor(adicional):
                setores_permitidos.add(variante)
        for tipo in permissao.tipos_documento_permitidos or []:
            filtros_usuario |= Q(tipo_documento=tipo)

    if setores_permitidos:
        setor_q_permitidos = Q()
        for variante in setores_permitidos:
            setor_q_permitidos |= Q(setor_destino__iexact=variante) | Q(setor_lotacao__iexact=variante)
        filtros_usuario |= setor_q_permitidos

    # 3. Setores onde o usuário é chefe (incluindo subsetores)
    setores_chefia_com_subsetores = _obter_setores_chefia_com_subsetores(usuario)
    if setores_chefia_com_subsetores:
        setor_q_chefia = Q()
        for variante in setores_chefia_com_subsetores:
            setor_q_chefia |= Q(setor_destino__iexact=variante) | Q(setor_lotacao__iexact=variante)
        filtros_usuario |= setor_q_chefia

    acessos_especiais = AcessoEspecialCaixaEntrada.objects.filter(
        usuario=usuario,
        ativo=True
    ).values_list('documento_id', flat=True)
    if acessos_especiais:
        filtros_usuario |= Q(id__in=acessos_especiais)

    queryset = queryset.filter(filtros_usuario).distinct()
    queryset = _aplicar_filtro_bloqueio(queryset, usuario)
    if apenas_pessoal:
        queryset = queryset.filter(destinatario_direto=usuario)
    return queryset


@login_required
def painel_gerencial_view(request):
    """Painel gerencial com metricas de SLA por setor"""
    metricas = _coletar_metricas_sla()
    resumo = metricas['resumo']

    setores_formatados = []
    for item in metricas['setores']:
        setores_formatados.append({
            'setor': item['setor'],
            'total': item['total'],
            'pendentes': item['pendentes'],
            'atrasados': item['atrasados'],
            'em_sla': item['em_sla'],
            'percentual_sla': item['percentual_sla'],
            'idade_media': _format_duration(item['idade_media']),
            'prazo_medio': _format_duration(item['prazo_medio']),
        })

    top_atrasados = []
    agora = timezone.now()
    for doc in metricas['top_atrasados']:
        atraso = None
        if doc.prazo_resposta:
            atraso = agora - doc.prazo_resposta
        top_atrasados.append({
            'documento': doc,
            'tempo_atraso': _format_duration(atraso),
        })

    contexto = {
        'resumo': {
            'total': resumo['total'],
            'pendentes': resumo['pendentes'],
            'atrasados': resumo['atrasados'],
            'em_sla': resumo['em_sla'],
            'percentual_sla': resumo['percentual_sla'],
            'idade_media': _format_duration(resumo['idade_media']),
            'prazo_medio': _format_duration(resumo['prazo_medio']),
        },
        'setores': setores_formatados,
        'top_atrasados': top_atrasados,
    }
    
    # Filtros
    # Filtros
    status_filter = request.GET.get('status', '')
    tipo_filter = request.GET.get('tipo', '')


@login_required
def caixa_entrada_view(request):
    """
    View unificada da caixa de entrada.
    Exibe abas para 'Pessoal' e 'Setor' para usuários comuns,
    e uma visão geral para administradores.
    """
    # Filtros comuns
    status_filter = request.GET.get('status', '')
    tipo_filter = request.GET.get('tipo', '')
    prioridade_filter = request.GET.get('prioridade', '')
    busca = request.GET.get('busca', '')
    
    # Determinar se é admin/gestor
    is_admin = request.user.is_superuser or request.user.groups.filter(name='Administradores').exists()
    
    # Contexto base
    context = {
        'is_admin': is_admin,
        'filtros': {
            'status': status_filter,
            'tipo': tipo_filter,
            'prioridade': prioridade_filter,
            'busca': busca,
        },
        'tipos_documento': CaixaEntrada.TIPO_DOCUMENTO_CHOICES,
        'status_choices': CaixaEntrada.STATUS_CHOICES,
        'prioridade_choices': CaixaEntrada.PRIORIDADE_CHOICES,
    }

    # Queryset base para estatísticas e listagem
    if is_admin:
        documentos = CaixaEntrada.objects.all()
        # Aplicar filtros globais
        if status_filter:
            documentos = documentos.filter(status=status_filter)
        if tipo_filter:
            documentos = documentos.filter(tipo_documento=tipo_filter)
        if prioridade_filter:
            documentos = documentos.filter(prioridade=prioridade_filter)
        if busca:
            documentos = documentos.filter(
                Q(assunto__icontains=busca) |
                Q(remetente_nome__icontains=busca) |
                Q(numero_protocolo__icontains=busca) |
                Q(empresa_nome__icontains=busca)
            )
        
        # Paginação para admin
        paginator = Paginator(documentos.order_by('-data_entrada'), 20)
        page_obj = paginator.get_page(request.GET.get('page'))
        context['documentos_all'] = page_obj
        context['page_obj'] = page_obj # Para compatibilidade com templates genéricos se houver
        
    else:
        # Para usuários comuns, preparamos os querysets para as abas
        
        # 1. Caixa Pessoal
        docs_pessoal = CaixaEntrada.objects.filter(
            destinatario_direto=request.user
        ).exclude(notificado_dte=True)
        
        # 2. Caixa Setor
        # Conforme SIGED: mostra processos destinados ao:
        # a) Setor de lotação do usuário (todos do setor veem)
        # b) Setores aos quais o usuário tem acesso explícito
        # c) Setores onde o usuário é chefe (incluindo subsetores)
        
        filtros_setor, tem_acesso_geral = _obter_filtros_caixa_setor(request.user)
        
        if tem_acesso_geral:
            docs_setor = CaixaEntrada.objects.all()
        else:
            if filtros_setor:
                docs_setor = CaixaEntrada.objects.filter(filtros_setor).exclude(notificado_dte=True).distinct()
            else:
                docs_setor = CaixaEntrada.objects.none()

        # Aplicar filtros em ambos
        if status_filter:
            docs_pessoal = docs_pessoal.filter(status=status_filter)
            docs_setor = docs_setor.filter(status=status_filter)
        if tipo_filter:
            docs_pessoal = docs_pessoal.filter(tipo_documento=tipo_filter)
            docs_setor = docs_setor.filter(tipo_documento=tipo_filter)
        if prioridade_filter:
            docs_pessoal = docs_pessoal.filter(prioridade=prioridade_filter)
            docs_setor = docs_setor.filter(prioridade=prioridade_filter)
        if busca:
            q_busca = (
                Q(assunto__icontains=busca) |
                Q(remetente_nome__icontains=busca) |
                Q(numero_protocolo__icontains=busca) |
                Q(empresa_nome__icontains=busca)
            )
            docs_pessoal = docs_pessoal.filter(q_busca)
            docs_setor = docs_setor.filter(q_busca)

        docs_pessoal = _aplicar_filtro_bloqueio(docs_pessoal, request.user)
        docs_setor = _aplicar_filtro_bloqueio(docs_setor, request.user)

        # Paginação (simplificada - idealmente seria via AJAX ou parâmetros distintos, 
        # mas aqui vamos limitar ou usar a página para a aba ativa)
        # Por enquanto, vamos passar os primeiros 50 de cada para renderizar
        context['documentos_pessoal'] = docs_pessoal.order_by('-data_entrada')[:50]
        context['documentos_setor'] = docs_setor.order_by('-data_entrada')[:50]
        
        # Contagens para badges
        context['count_pessoal_nao_lido'] = docs_pessoal.filter(status='NAO_LIDO').count()
        context['count_setor_nao_lido'] = docs_setor.filter(status='NAO_LIDO').count()
        
        # Combinar para estatísticas gerais do usuário
        documentos = docs_pessoal | docs_setor

    # Estatísticas Gerais (para os cards do topo)
    context['total_documentos'] = documentos.count()
    context['nao_lidos'] = documentos.filter(status='NAO_LIDO').count()
    context['atrasados'] = documentos.filter(prazo_resposta__lt=timezone.now()).count()
    context['urgentes'] = documentos.filter(prioridade='URGENTE').count()

    return render(request, 'caixa_entrada/unified_inbox.html', context)


@login_required
def caixa_pessoal_view(request):
    """Redireciona para a caixa unificada na aba pessoal"""
    return redirect(f"{reverse('caixa_entrada:caixa_entrada')}?tab=personal")


@login_required
def caixa_setor_view(request):
    """Redireciona para a caixa unificada na aba setor"""
    return redirect(f"{reverse('caixa_entrada:caixa_entrada')}?tab=sector")


@login_required
def caixa_notificados_view(request):
    """Caixa de Notificados - Documentos notificados no DTE"""
    
    # Filtros
    status_filter = request.GET.get('status', '')
    tipo_filter = request.GET.get('tipo', '')
    prioridade_filter = request.GET.get('prioridade', '')
    busca = request.GET.get('busca', '')
    
    # Query base - documentos notificados no DTE
    documentos_base = CaixaEntrada.objects.filter(notificado_dte=True)
    
    # Aplicar lógica da Caixa Setor (mas para documentos notificados no DTE)
    filtros_setor, tem_acesso_geral = _obter_filtros_caixa_setor(request.user, excluir_notificados_dte=False)
    
    if tem_acesso_geral:
        documentos = documentos_base
    else:
        if filtros_setor:
            documentos = documentos_base.filter(filtros_setor).distinct()
        else:
            documentos = CaixaEntrada.objects.none()
    
    # Aplicar filtros
    if status_filter:
        documentos = documentos.filter(status=status_filter)
    if tipo_filter:
        documentos = documentos.filter(tipo_documento=tipo_filter)
    if prioridade_filter:
        documentos = documentos.filter(prioridade=prioridade_filter)
    if busca:
        documentos = documentos.filter(
            Q(assunto__icontains=busca) |
            Q(remetente_nome__icontains=busca) |
            Q(numero_protocolo__icontains=busca) |
            Q(empresa_nome__icontains=busca)
        )

    documentos = _aplicar_filtro_bloqueio(documentos, request.user)
    
    # Ordenação
    ordenacao = request.GET.get('ordenacao', '-data_notificacao_dte')
    documentos = documentos.order_by(ordenacao)
    
    # Paginação
    paginator = Paginator(documentos, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Estatísticas
    total_documentos = documentos.count()
    nao_lidos = documentos.filter(status='NAO_LIDO').count()
    atrasados = documentos.filter(prazo_resposta__lt=timezone.now()).count()
    urgentes = documentos.filter(prioridade='URGENTE').count()
    
    context = {
        'page_obj': page_obj,
        'total_documentos': total_documentos,
        'nao_lidos': nao_lidos,
        'atrasados': atrasados,
        'urgentes': urgentes,
        'filtros': {
            'status': status_filter,
            'tipo': tipo_filter,
            'prioridade': prioridade_filter,
            'busca': busca,
        },
        'ordenacao': ordenacao,
        'tipos_documento': CaixaEntrada.TIPO_DOCUMENTO_CHOICES,
        'status_choices': CaixaEntrada.STATUS_CHOICES,
        'prioridade_choices': CaixaEntrada.PRIORIDADE_CHOICES,
        'tipo_caixa': 'notificados'
    }
    
    return render(request, 'caixa_entrada/caixa_notificados.html', context)


@login_required
def documento_detail(request, documento_id):
    """Detalhes de um documento na caixa de entrada"""
    documento = get_object_or_404(CaixaEntrada, id=documento_id)

    if not _usuario_pode_ver_documento_bloqueado(request.user, documento):
        messages.error(request, "Documento bloqueado por outro usuario.")
        return redirect('caixa_entrada:caixa_entrada')
    
    # Marcar como lido se não foi lido
    if documento.status == 'NAO_LIDO':
        documento.marcar_como_lido(request.user)
    
    # Histórico do documento
    historico = documento.historico.all().order_by('-data_acao')
    
    # Anexos
    anexos = documento.anexos.all().order_by('-upload_em')
    
    # Versões anteriores
    versoes_anteriores = documento.versoes_posteriores.all().order_by('-versao')
    
    context = {
        'documento': documento,
        'historico': historico,
        'anexos': anexos,
        'versoes_anteriores': versoes_anteriores,
    }
    
    return render(request, 'caixa_entrada/documento_detail.html', context)


@login_required
def marcar_como_lido(request, documento_id):
    """Marca documento como lido"""
    documento = get_object_or_404(CaixaEntrada, id=documento_id)

    if not _usuario_pode_ver_documento_bloqueado(request.user, documento):
        messages.error(request, "Documento bloqueado por outro usuario.")
        return redirect('caixa_entrada:caixa_entrada')
    documento.marcar_como_lido(request.user)

    sincronizar_protocolo_caixa(
        documento,
        usuario=request.user,
        acao='RECEBIDO',
        setor_origem=documento.setor_destino,
        setor_destino=documento.setor_destino,
        motivo='Documento marcado como lido',
        observacoes='Documento marcado como lido',
        recebido_por=request.user,
    )

    # Registrar no histórico
    HistoricoCaixaEntrada.objects.create(
        documento=documento,
        acao='LIDO',
        usuario=request.user,
        detalhes='Documento marcado como lido'
    )
    
    messages.success(request, 'Documento marcado como lido')
    return redirect('caixa_entrada:documento_detail', documento_id=documento_id)


@login_required
def encaminhar_documento(request, documento_id):
    """Encaminha documento para outro setor"""
    documento = get_object_or_404(CaixaEntrada, id=documento_id)

    if not _usuario_pode_ver_documento_bloqueado(request.user, documento):
        messages.error(request, "Documento bloqueado por outro usuario.")
        return redirect('caixa_entrada:caixa_entrada')
    
    if request.method == 'POST':
        setor_destino = request.POST.get('setor_destino')
        responsavel_id = request.POST.get('responsavel')
        motivo_predefinido = request.POST.get('motivo_predefinido', '')
        assinatura = request.POST.get('assinatura', '')
        observacoes_livres = request.POST.get('observacoes', '')

        if setor_destino:
            responsavel = None
            if responsavel_id:
                from django.contrib.auth.models import User
                responsavel = User.objects.get(id=responsavel_id)

            partes_mensagem = []
            if motivo_predefinido:
                partes_mensagem.append('[{}]'.format(motivo_predefinido))
            if observacoes_livres:
                partes_mensagem.append(observacoes_livres)
            observacoes = ' '.join(partes_mensagem).strip()

            setor_origem_atual = documento.setor_destino
            nova_versao = documento.encaminhar_para_setor(
                setor_destino=setor_destino,
                responsavel=responsavel,
                observacoes=observacoes
            )

            sincronizar_protocolo_caixa(
                nova_versao,
                usuario=request.user,
                acao='ENCAMINHADO',
                setor_origem=setor_origem_atual,
                setor_destino=setor_destino,
                motivo='Encaminhado para {}'.format(setor_destino),
                observacoes=observacoes or '',
            )

            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='ENCAMINHADO',
                usuario=request.user,
                detalhes='Encaminhado para {}'.format(setor_destino),
                dados_novos={
                    'setor_destino': setor_destino,
                    'responsavel': responsavel_id,
                    'motivo_predefinido': motivo_predefinido,
                    'assinatura': assinatura,
                }
            )

            messages.success(request, 'Documento encaminhado para {}'.format(setor_destino))
            return redirect('caixa_entrada:documento_detail', documento_id=nova_versao.id)

    # Buscar setores disponíveis
    setores = CaixaEntrada.objects.values_list('setor_destino', flat=True).distinct()
    usuarios = User.objects.filter(is_active=True).order_by('first_name', 'last_name')
    
    context = {
        'documento': documento,
        'setores': setores,
        'usuarios': usuarios,
    }
    
    return render(request, 'caixa_entrada/encaminhar_documento.html', context)


@login_required
def arquivar_documento(request, documento_id):
    """Arquiva um documento"""
    documento = get_object_or_404(CaixaEntrada, id=documento_id)

    if not _usuario_pode_ver_documento_bloqueado(request.user, documento):
        messages.error(request, "Documento bloqueado por outro usuario.")
        return redirect('caixa_entrada:caixa_entrada')
    
    if request.method == 'POST':
        motivo = request.POST.get('motivo', '')
        documento.status = 'ARQUIVADO'
        documento.save()

        sincronizar_protocolo_caixa(
            documento,
            usuario=request.user,
            acao='ARQUIVADO',
            setor_origem=documento.setor_destino,
            setor_destino=documento.setor_destino,
            motivo=f'Documento arquivado: {motivo}' if motivo else 'Documento arquivado',
            observacoes=motivo or '',
        )

        # Registrar no histórico
        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='ARQUIVADO',
            usuario=request.user,
            detalhes=f'Documento arquivado: {motivo}'
        )
        
        messages.success(request, 'Documento arquivado com sucesso')
        return redirect('caixa_entrada:caixa_entrada')
    
    return render(request, 'caixa_entrada/arquivar_documento.html', {'documento': documento})


# === VIEWSETS ===

class CaixaEntradaViewSet(viewsets.ModelViewSet):
    """ViewSet para caixa de entrada"""
    queryset = CaixaEntrada.objects.all()
    serializer_class = CaixaEntradaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo_documento', 'prioridade', 'responsavel_atual', 'notificado_dte', 'bloqueado']
    search_fields = ['assunto', 'remetente_nome', 'numero_protocolo', 'empresa_nome']
    ordering_fields = ['data_entrada', 'prazo_resposta', 'prioridade']
    ordering = ['-data_entrada']
    pagination_class = PageNumberPagination
    


    def get_queryset(self):
        """Filtra documentos por usuário, permissões e sinalizadores da caixa pessoal"""
        queryset = super().get_queryset().select_related(
            'protocolo',
            'protocolo__processo_fiscalizacao',
            'protocolo__auto_infracao',
        )
        try:
            from protocolo_tramitacao.models import TramitacaoDocumento
        except ImportError:
            TramitacaoDocumento = None
        if TramitacaoDocumento:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'protocolo__tramitacoes',
                    queryset=TramitacaoDocumento.objects.select_related(
                        'setor_origem',
                        'setor_destino',
                        'usuario',
                        'recebido_por',
                    ).order_by('-data_tramitacao'),
                    to_attr='tramitacoes_ordenadas',
                )
            )
        apenas_pessoal = (self.request.query_params.get('apenas_pessoal') or '').lower() in {'1', 'true', 't', 'yes'}
        queryset = filtrar_documentos_por_usuario(queryset, self.request, apenas_pessoal=apenas_pessoal)

        setores_param = list(self.request.query_params.getlist('setor_destino') or [])
        setores_extra = self.request.query_params.getlist('setor')
        if setores_extra:
            for setor_valor in setores_extra:
                if setor_valor not in setores_param:
                    setores_param.append(setor_valor)
        if setores_param:
            queryset = _aplicar_filtro_setor(queryset, setores_param)

        destinatario_param = (self.request.query_params.get('destinatario_direto') or '').strip()
        if destinatario_param:
            valor_normalizado = destinatario_param.lower()
            if valor_normalizado in {'me', 'self', 'eu'}:
                queryset = queryset.filter(destinatario_direto=self.request.user)
            else:
                try:
                    queryset = queryset.filter(destinatario_direto_id=int(destinatario_param))
                except ValueError:
                    return queryset.none()

        status_param = (self.request.query_params.get('status') or '').strip()
        if not status_param:
            queryset = queryset.exclude(status__in=['ENCAMINHADO', 'ARQUIVADO'])

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['pode_bloquear_func'] = _usuario_pode_bloquear_documento
        return context

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CaixaEntradaDetailSerializer
        return CaixaEntradaSerializer


    @action(detail=True, methods=['post'])
    def arquivar(self, request, pk=None):
        """Arquiva um documento diretamente pela API"""
        documento = self.get_object()
        motivo = request.data.get('motivo', '')
        observacoes = request.data.get('observacoes', '')

        documento.status = 'ARQUIVADO'
        documento.save(update_fields=['status', 'data_atualizacao'])

        sincronizar_protocolo_caixa(
            documento,
            usuario=request.user,
            acao='ARQUIVADO',
            setor_origem=documento.setor_destino,
            setor_destino=documento.setor_destino,
            motivo=motivo or 'Documento arquivado via API',
            observacoes=observacoes or motivo,
        )

        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='ARQUIVADO',
            usuario=request.user,
            detalhes=motivo or 'Documento arquivado via API',
            dados_novos={'status': 'ARQUIVADO'}
        )

        return Response({'status': 'success'})
    @action(detail=True, methods=['post'])
    def marcar_lido(self, request, pk=None):
        """Marca documento como lido"""
        documento = self.get_object()
        documento.marcar_como_lido(request.user)

        sincronizar_protocolo_caixa(
            documento,
            usuario=request.user,
            acao='RECEBIDO',
            setor_origem=documento.setor_destino,
            setor_destino=documento.setor_destino,
            motivo='Documento marcado como lido',
            observacoes='Documento marcado como lido via API',
            recebido_por=request.user,
        )

        # Registrar no histórico
        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='LIDO',
            usuario=request.user,
            detalhes='Documento marcado como lido via API'
        )
        
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def bloquear(self, request, pk=None):
        """Bloqueia documento para acesso do setor."""
        documento = self.get_object()
        if not _usuario_pode_bloquear_documento(request.user, documento):
            return Response({'error': 'Sem permissao para bloquear documento.'}, status=403)

        if documento.bloqueado and documento.bloqueado_por == request.user:
            return Response({'status': 'already_locked'})

        motivo = (request.data.get('motivo') or '').strip()
        documento.bloqueado = True
        documento.bloqueado_por = request.user
        documento.bloqueado_em = timezone.now()
        documento.motivo_bloqueio = motivo
        documento.save(update_fields=['bloqueado', 'bloqueado_por', 'bloqueado_em', 'motivo_bloqueio'])

        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='STATUS_ALTERADO',
            usuario=request.user,
            detalhes='Documento bloqueado' if not motivo else f'Documento bloqueado: {motivo}',
            dados_novos={'bloqueado': True, 'motivo_bloqueio': motivo},
        )

        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def desbloquear(self, request, pk=None):
        """Desbloqueia documento."""
        documento = self.get_object()
        if not _usuario_pode_bloquear_documento(request.user, documento):
            return Response({'error': 'Sem permissao para desbloquear documento.'}, status=403)

        if not documento.bloqueado:
            return Response({'status': 'already_unlocked'})

        documento.bloqueado = False
        documento.bloqueado_por = None
        documento.bloqueado_em = None
        documento.motivo_bloqueio = ''
        documento.save(update_fields=['bloqueado', 'bloqueado_por', 'bloqueado_em', 'motivo_bloqueio'])

        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='STATUS_ALTERADO',
            usuario=request.user,
            detalhes='Documento desbloqueado',
            dados_novos={'bloqueado': False},
        )

        return Response({'status': 'success'})
    

    @action(detail=False, methods=['get'])
    def destinatarios(self, request):
        """Lista usuarios ativos elegiveis para encaminhamento."""
        UserModel = get_user_model()
        termo = (request.query_params.get('search') or '').strip()
        setor = (request.query_params.get('setor') or '').strip()

        queryset = UserModel.objects.filter(is_active=True)
        if termo:
            queryset = queryset.filter(
                Q(first_name__icontains=termo)
                | Q(last_name__icontains=termo)
                | Q(username__icontains=termo)
                | Q(email__icontains=termo)
            )
        if setor:
            setor_upper = setor.upper()
            queryset = queryset.filter(
                Q(groups__name__icontains=setor_upper)
                | Q(user_permissions__codename__icontains=setor_upper)
            )

        queryset = queryset.distinct().order_by('first_name', 'last_name', 'username')[:100]

        resultados = []
        for usuario in queryset:
            nome = (usuario.get_full_name() or '').strip()
            if not nome:
                nome = usuario.username
            grupos = list(usuario.groups.values_list('name', flat=True))
            resultados.append(
                {
                    'id': usuario.id,
                    'nome': nome,
                    'username': usuario.username,
                    'email': usuario.email,
                    'grupos': grupos,
                }
            )

        return Response({'results': resultados})

    @action(detail=True, methods=['post'])
    def encaminhar(self, request, pk=None):
        """Encaminha documento para outro setor"""
        documento = self.get_object()
        destino_tipo = (request.data.get('destino_tipo') or 'setor').strip().lower()
        setor_destino = request.data.get('setor_destino')
        destinatario_id = request.data.get('destinatario_direto') or request.data.get('responsavel')
        motivo_predefinido = request.data.get('motivo_predefinido', '')
        assinatura = request.data.get('assinatura', '')
        observacoes_livres = request.data.get('observacoes', '')

        if destino_tipo not in {'setor', 'usuario'}:
            return Response({'error': 'Destino invalido. Use "setor" ou "usuario".'}, status=400)

        responsavel = None
        if destino_tipo == 'usuario':
            if not destinatario_id:
                return Response({'error': 'Destinatario direto obrigatorio para destino pessoal.'}, status=400)
            try:
                responsavel = User.objects.get(id=destinatario_id)
            except (User.DoesNotExist, ValueError):
                return Response({'error': 'Destinatario informado nao foi encontrado'}, status=400)
            if not setor_destino:
                setor_destino = _obter_setor_preferencial_usuario(responsavel) or documento.setor_destino
        else:
            if not setor_destino:
                return Response({'error': 'Setor destino e obrigatorio'}, status=400)

        partes_mensagem = []
        if motivo_predefinido:
            partes_mensagem.append('[{}]'.format(motivo_predefinido))
        if observacoes_livres:
            partes_mensagem.append(observacoes_livres)
        observacoes = ' '.join(partes_mensagem).strip()

        setor_origem_atual = documento.setor_destino
        nova_versao = documento.encaminhar_para_setor(
            setor_destino=setor_destino,
            responsavel=responsavel,
            observacoes=observacoes
        )

        sincronizar_protocolo_caixa(
            nova_versao,
            usuario=request.user,
            acao='ENCAMINHADO',
            setor_origem=setor_origem_atual,
            setor_destino=setor_destino,
            motivo='Encaminhado para {}'.format(setor_destino),
            observacoes=observacoes or '',
        )

        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='ENCAMINHADO',
            usuario=request.user,
            detalhes='Encaminhado para {}'.format(setor_destino),
            dados_novos={
                'setor_destino': setor_destino,
                'destino_tipo': destino_tipo,
                'destinatario_direto': destinatario_id,
                'motivo_predefinido': motivo_predefinido,
                'assinatura': assinatura,
            }
        )

        serializer = CaixaEntradaSerializer(nova_versao)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dados do dashboard da caixa de entrada"""
        queryset = self.get_queryset()
        
        # Estatísticas
        total = queryset.count()
        nao_lidos = queryset.filter(status='NAO_LIDO').count()
        atrasados = queryset.filter(prazo_resposta__lt=timezone.now()).count()
        urgentes = queryset.filter(prioridade='URGENTE').count()
        
        # Distribuição por status
        distribuicao_status = queryset.values('status').annotate(
            total=Count('id')
        ).order_by('-total')
        
        # Distribuição por tipo
        distribuicao_tipo = queryset.values('tipo_documento').annotate(
            total=Count('id')
        ).order_by('-total')
        
        # Documentos recentes
        recentes = queryset.order_by('-data_entrada')[:10]
        
        recentes_serializados = CaixaEntradaSerializer(recentes, many=True).data

        dados = {
            'total': total,
            'nao_lidos': nao_lidos,
            'atrasados': atrasados,
            'urgentes': urgentes,
            'distribuicao_status': list(distribuicao_status),
            'distribuicao_tipo': list(distribuicao_tipo),
            'recentes': recentes_serializados
        }

        serializer = CaixaEntradaDashboardSerializer(data=dados)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def atrasados(self, request):
        """Lista documentos atrasados"""
        queryset = self.get_queryset().filter(
            prazo_resposta__lt=timezone.now(),
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).order_by('prazo_resposta')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def urgentes(self, request):
        """Lista documentos urgentes"""
        queryset = self.get_queryset().filter(
            prioridade='URGENTE',
            status__in=['NAO_LIDO', 'LIDO', 'EM_ANALISE']
        ).order_by('-data_entrada')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AnexoCaixaEntradaViewSet(viewsets.ModelViewSet):
    """ViewSet para anexos da caixa de entrada"""
    queryset = AnexoCaixaEntrada.objects.all()
    serializer_class = AnexoCaixaEntradaSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(upload_por=self.request.user)


class HistoricoCaixaEntradaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para histórico da caixa de entrada"""
    queryset = HistoricoCaixaEntrada.objects.all()
    serializer_class = HistoricoCaixaEntradaSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-data_acao']


class ConfiguracaoCaixaEntradaViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações da caixa de entrada"""
    queryset = ConfiguracaoCaixaEntrada.objects.all()
    serializer_class = ConfiguracaoCaixaEntradaSerializer
    permission_classes = [IsAuthenticated]


# === API VIEWS ===

class CriarDocumentoAPIView(APIView):
    """API para criar documento na caixa de entrada"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Cria novo documento na caixa de entrada"""
        serializer = CaixaEntradaSerializer(data=request.data)
        if serializer.is_valid():
            documento = serializer.save()
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='CRIADO',
                usuario=request.user if request.user.is_authenticated else None,
                detalhes='Documento criado via API'
            )
            
            return Response({
                'message': 'Documento criado com sucesso',
                'numero_protocolo': documento.numero_protocolo,
                'id': documento.id
            }, status=201)
        
        return Response(serializer.errors, status=400)


class ConsultarDocumentoAPIView(APIView):
    """API para consultar documento por número de protocolo"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Consulta documento por número de protocolo"""
        numero_protocolo = request.GET.get('numero_protocolo')
        cpf_cnpj = request.GET.get('cpf_cnpj')
        
        if not numero_protocolo and not cpf_cnpj:
            return Response({'error': 'Número de protocolo ou CPF/CNPJ é obrigatório'}, status=400)
        
        try:
            if numero_protocolo:
                documento = CaixaEntrada.objects.get(numero_protocolo=numero_protocolo)
            else:
                documento = CaixaEntrada.objects.filter(
                    remetente_documento__contains=cpf_cnpj
                ).order_by('-data_entrada').first()
            
            if not documento:
                return Response({'error': 'Documento não encontrado'}, status=404)
            
            serializer = CaixaEntradaDetailSerializer(documento)
            return Response(serializer.data)
            
        except CaixaEntrada.DoesNotExist:
            return Response({'error': 'Documento não encontrado'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# Views administrativas para gerenciar permissões
@login_required
def gerenciar_permissoes_view(request):
    """View para gerenciar permissões de setor"""
    mixin = AdminPermissionMixin()
    
    if not mixin.test_func():
        messages.error(request, "Você não tem permissão para gerenciar permissões.")
        return redirect('caixa_entrada:caixa_entrada')
    
    if request.method == 'POST':
        # Lógica para salvar permissões
        setor = request.POST.get('setor')
        usuarios_ids = request.POST.getlist('usuarios')
        
        permissao, created = PermissaoSetorCaixaEntrada.objects.get_or_create(setor=setor)
        permissao.usuarios.set(usuarios_ids)
        
        messages.success(request, f'Permissões do setor {setor} atualizadas.')
        return redirect('caixa_entrada:gerenciar_permissoes')
    
    permissoes = PermissaoSetorCaixaEntrada.objects.all().order_by('setor')
    usuarios = User.objects.filter(is_active=True).order_by('username')
    
    context = {
        'permissoes': permissoes,
        'usuarios': usuarios,
    }
    
    return render(request, 'caixa_entrada/gerenciar_permissoes.html', context)


@login_required
def gerenciar_acesso_especial_view(request):
    """View para gerenciar acessos especiais"""
    mixin = AdminPermissionMixin()
    
    if not mixin.test_func():
        messages.error(request, "Você não tem permissão para gerenciar acessos especiais.")
        return redirect('caixa_entrada:caixa_entrada')
    
    if request.method == 'POST':
        # Lógica para conceder acesso especial
        usuario_id = request.POST.get('usuario')
        documento_id = request.POST.get('documento')
        motivo = request.POST.get('motivo')
        observacoes = request.POST.get('observacoes', '')
        data_fim = request.POST.get('data_fim')
        
        try:
            usuario = User.objects.get(id=usuario_id)
            documento = CaixaEntrada.objects.get(id=documento_id)
            
            acesso = AcessoEspecialCaixaEntrada.objects.create(
                usuario=usuario,
                documento=documento,
                motivo=motivo,
                observacoes=observacoes,
                data_fim=data_fim if data_fim else None,
                concedido_por=request.user
            )
            
            messages.success(request, f'Acesso especial concedido para {usuario.username}.')
            
        except (User.DoesNotExist, CaixaEntrada.DoesNotExist):
            messages.error(request, 'Usuário ou documento não encontrado.')
        
        return redirect('caixa_entrada:gerenciar_acesso_especial')
    
    acessos = AcessoEspecialCaixaEntrada.objects.filter(ativo=True).order_by('-criado_em')
    usuarios = User.objects.filter(is_active=True).order_by('username')
    documentos = CaixaEntrada.objects.all().order_by('-data_entrada')
    
    context = {
        'acessos': acessos,
        'usuarios': usuarios,
        'documentos': documentos,
    }
    
    return render(request, 'caixa_entrada/gerenciar_acesso_especial.html', context)




class PainelGerencialAPIView(APIView):
    """API com metricas de SLA por setor"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        metricas = _coletar_metricas_sla()
        agora = timezone.now()

        def _duracao_segundos(valor):
            return valor.total_seconds() if valor else None

        setores = []
        for item in metricas['setores']:
            setores.append({
                'setor': item['setor'],
                'total': item['total'],
                'pendentes': item['pendentes'],
                'atrasados': item['atrasados'],
                'em_sla': item['em_sla'],
                'percentual_sla': item['percentual_sla'],
                'idade_media_segundos': _duracao_segundos(item['idade_media']),
                'prazo_medio_segundos': _duracao_segundos(item['prazo_medio']),
            })

        top_atrasados = []
        for doc in metricas['top_atrasados']:
            atraso = None
            if doc.prazo_resposta:
                atraso = agora - doc.prazo_resposta
            top_atrasados.append({
                'id': str(doc.id),
                'numero_protocolo': doc.numero_protocolo,
                'assunto': doc.assunto,
                'setor_destino': doc.setor_destino,
                'prioridade': doc.prioridade,
                'status': doc.status,
                'prazo_resposta': doc.prazo_resposta,
                'atraso_segundos': _duracao_segundos(atraso),
            })

        resposta = {
            'resumo': {
                'total': metricas['resumo']['total'],
                'pendentes': metricas['resumo']['pendentes'],
                'atrasados': metricas['resumo']['atrasados'],
                'em_sla': metricas['resumo']['em_sla'],
                'percentual_sla': metricas['resumo']['percentual_sla'],
                'idade_media_segundos': _duracao_segundos(metricas['resumo']['idade_media']),
                'prazo_medio_segundos': _duracao_segundos(metricas['resumo']['prazo_medio']),
            },
            'setores': setores,
            'top_atrasados': top_atrasados,
        }

        return Response(resposta)


class EstatisticasAPIView(APIView):
    """API para obter estatísticas da caixa de entrada"""
    permission_classes = [IsAuthenticated]
    



    def get(self, request):
        try:
            setor = request.GET.get('setor', '')
            tipo_documento = request.GET.get('tipo_documento', '')
            status_param = request.GET.get('status', '')
            prioridade = request.GET.get('prioridade', '')
            busca = request.GET.get('busca', '')
            destinatario = request.GET.get('destinatario_direto', '')
            notificado_dte = request.GET.get('notificado_dte', '')
            apenas_pessoal = (request.GET.get('apenas_pessoal') or '').lower() in {'1', 'true', 't', 'yes'}

            documentos = CaixaEntrada.objects.all()
            documentos = filtrar_documentos_por_usuario(documentos, request, apenas_pessoal)

            setores_param = []
            if setor:
                setores_param.append(setor)
            setores_param.extend(request.GET.getlist('setor_destino'))
            if setores_param:
                documentos = _aplicar_filtro_setor(documentos, setores_param)
            if tipo_documento:
                documentos = documentos.filter(tipo_documento=tipo_documento)
            if status_param:
                documentos = documentos.filter(status=status_param)
            else:
                documentos = documentos.exclude(status='ENCAMINHADO')
            if prioridade:
                documentos = documentos.filter(prioridade=prioridade)
            if destinatario:
                if destinatario in {'me', 'self', 'eu'}:
                    documentos = documentos.filter(destinatario_direto=request.user)
                else:
                    try:
                        documentos = documentos.filter(destinatario_direto_id=int(destinatario))
                    except ValueError:
                        pass
            if notificado_dte:
                valor = notificado_dte.lower()
                if valor in {'1', 'true', 't', 'yes'}:
                    documentos = documentos.filter(notificado_dte=True)
                elif valor in {'0', 'false', 'f', 'no'}:
                    documentos = documentos.filter(notificado_dte=False)
            if busca:
                documentos = documentos.filter(
                    Q(assunto__icontains=busca) |
                    Q(remetente_nome__icontains=busca) |
                    Q(numero_protocolo__icontains=busca) |
                    Q(empresa_nome__icontains=busca)
                )

            total = documentos.count()
            nao_lidos = documentos.filter(status='NAO_LIDO').count()
            em_analise = documentos.filter(status='EM_ANALISE').count()
            encaminhados = documentos.filter(status='ENCAMINHADO').count()
            arquivados = documentos.filter(status='ARQUIVADO').count()
            atrasados = documentos.filter(
                prazo_resposta__lt=timezone.now(),
                status__in=['NAO_LIDO', 'EM_ANALISE']
            ).count()
            urgentes = documentos.filter(prioridade='URGENTE').count()

            estatisticas_setor = documentos.values('setor_destino').annotate(
                total=Count('id'),
                nao_lidos=Count('id', filter=Q(status='NAO_LIDO')),
                em_analise=Count('id', filter=Q(status='EM_ANALISE')),
                encaminhados=Count('id', filter=Q(status='ENCAMINHADO'))
            ).order_by('-total')

            estatisticas_tipo = documentos.values('tipo_documento').annotate(
                total=Count('id')
            ).order_by('-total')

            estatisticas = {
                'total': total,
                'nao_lidos': nao_lidos,
                'em_analise': em_analise,
                'encaminhados': encaminhados,
                'arquivados': arquivados,
                'atrasados': atrasados,
                'urgentes': urgentes,
                'por_setor': list(estatisticas_setor),
                'por_tipo': list(estatisticas_tipo),
                'filtros_aplicados': {
                    'setor': setor,
                    'tipo_documento': tipo_documento,
                    'status': status_param,
                    'prioridade': prioridade,
                    'busca': busca,
                    'destinatario_direto': destinatario,
                    'notificado_dte': notificado_dte,
                    'apenas_pessoal': apenas_pessoal,
                }
            }

            return Response(estatisticas)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

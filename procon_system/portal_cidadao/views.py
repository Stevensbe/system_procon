from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse, FileResponse
from django.db.models import Count, Q
from django.utils import timezone
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.contrib import messages
import json
import os
import re
import unicodedata
import logging
from urllib.parse import urlencode
from datetime import datetime, date
from django.contrib.contenttypes.models import ContentType

# Importar modelos de peticionamento
from peticionamento.models import PeticaoEletronica, TipoPeticao, AnexoPeticao
from protocolo_tramitacao.models import ProtocoloDocumento, TipoDocumento
from fiscalizacao.models import Processo, DocumentoProcesso

from .models import (
    CategoriaConteudo, ConteudoPortal, FormularioPublico, BannerPortal,
    ConsultaPublica, AvaliacaoServico, ConfiguracaoPortal, EstatisticaPortal,
    DenunciaCidadao, HistoricoAtividade
)

logger = logging.getLogger(__name__)


# === VIEWS PRINCIPAIS ===

def home_view(request):
    """Pagina inicial do portal"""
    # Banners ativos
    banners = BannerPortal.objects.filter(ativo=True).order_by('ordem')[:5]
    
    # Conteudo em destaque
    conteudos_destaque = ConteudoPortal.objects.filter(
        destaque=True, ativo=True
    ).order_by('-data_publicacao')[:6]
    
    # Noticias recentes
    noticias = ConteudoPortal.objects.filter(
        tipo='NOTICIA', ativo=True
    ).order_by('-data_publicacao')[:4]
    
    # Formularios em destaque
    formularios = FormularioPublico.objects.filter(
        destaque=True, ativo=True
    ).order_by('ordem')[:4]
    
    # Configuracoes do portal
    try:
        config = ConfiguracaoPortal.objects.get()
    except ConfiguracaoPortal.DoesNotExist:
        config = None
    
    context = {
        'banners': banners,
        'conteudos_destaque': conteudos_destaque,
        'noticias': noticias,
        'formularios': formularios,
        'config': config,
    }
    
    return render(request, 'portal_cidadao/home.html', context)


def sobre_view(request):
    """Pagina sobre o PROCON"""
    try:
        config = ConfiguracaoPortal.objects.get()
    except ConfiguracaoPortal.DoesNotExist:
        config = None
    
    context = {
        'config': config,
    }
    
    return render(request, 'portal_cidadao/sobre.html', context)


def contato_view(request):
    """Pagina de contato"""
    try:
        config = ConfiguracaoPortal.objects.get()
    except ConfiguracaoPortal.DoesNotExist:
        config = None
    
    context = {
        'config': config,
    }
    
    return render(request, 'portal_cidadao/contato.html', context)


# === CONTEUDO INFORMATIVO ===

def lista_conteudo(request):
    """Lista todo o conteudo do portal"""
    conteudos = ConteudoPortal.objects.filter(ativo=True).order_by('-data_publicacao')
    categorias = CategoriaConteudo.objects.filter(ativo=True).order_by('ordem')
    
    # Filtros
    categoria_id = request.GET.get('categoria')
    tipo = request.GET.get('tipo')
    
    if categoria_id:
        conteudos = conteudos.filter(categoria_id=categoria_id)
    
    if tipo:
        conteudos = conteudos.filter(tipo=tipo)
    
    # Paginacao
    paginator = Paginator(conteudos, 12)
    page = request.GET.get('page')
    conteudos_paginados = paginator.get_page(page)
    
    context = {
        'conteudos': conteudos_paginados,
        'categorias': categorias,
        'categoria_atual': categoria_id,
        'tipo_atual': tipo,
    }
    
    return render(request, 'portal_cidadao/lista_conteudo.html', context)


def conteudo_por_categoria(request, categoria_id):
    """Conteudo filtrado por categoria"""
    categoria = get_object_or_404(CategoriaConteudo, id=categoria_id, ativo=True)
    conteudos = ConteudoPortal.objects.filter(
        categoria=categoria, ativo=True
    ).order_by('-data_publicacao')
    
    # Paginacao
    paginator = Paginator(conteudos, 12)
    page = request.GET.get('page')
    conteudos_paginados = paginator.get_page(page)
    
    context = {
        'categoria': categoria,
        'conteudos': conteudos_paginados,
    }
    
    return render(request, 'portal_cidadao/categoria_conteudo.html', context)


def detalhe_conteudo(request, slug):
    """Detalhes de um conteudo especifico"""
    conteudo = get_object_or_404(ConteudoPortal, slug=slug, ativo=True)
    
    # Incrementar visualizacoes
    conteudo.incrementar_visualizacao()
    
    # Conteudos relacionados
    relacionados = ConteudoPortal.objects.filter(
        categoria=conteudo.categoria, ativo=True
    ).exclude(id=conteudo.id).order_by('-data_publicacao')[:4]
    
    context = {
        'conteudo': conteudo,
        'relacionados': relacionados,
    }
    
    return render(request, 'portal_cidadao/detalhe_conteudo.html', context)


# === PERGUNTAS FREQUENTES ===

def faq_view(request):
    """Pagina de perguntas frequentes"""
    faqs = ConteudoPortal.objects.filter(
        tipo='FAQ', ativo=True
    ).order_by('ordem', '-data_publicacao')
    
    categorias = CategoriaConteudo.objects.filter(ativo=True).order_by('ordem')
    
    context = {
        'faqs': faqs,
        'categorias': categorias,
    }
    
    return render(request, 'portal_cidadao/faq.html', context)


def faq_categoria(request, categoria_id):
    """FAQs por categoria"""
    categoria = get_object_or_404(CategoriaConteudo, id=categoria_id, ativo=True)
    faqs = ConteudoPortal.objects.filter(
        categoria=categoria, tipo='FAQ', ativo=True
    ).order_by('ordem', '-data_publicacao')
    
    context = {
        'categoria': categoria,
        'faqs': faqs,
    }
    
    return render(request, 'portal_cidadao/faq_categoria.html', context)


# === FORMULARIOS ===

def lista_formularios(request):
    """Lista de formularios para download"""
    formularios = FormularioPublico.objects.filter(ativo=True).order_by('-destaque', 'ordem')
    
    # Filtro por categoria
    categoria = request.GET.get('categoria')
    if categoria:
        formularios = formularios.filter(categoria=categoria)
    
    context = {
        'formularios': formularios,
        'categorias': FormularioPublico.CATEGORIA_CHOICES,
        'categoria_atual': categoria,
    }
    
    return render(request, 'portal_cidadao/formularios.html', context)


def download_formulario(request, formulario_id):
    """Download de formulrio"""
    formulario = get_object_or_404(FormularioPublico, id=formulario_id, ativo=True)
    
    # Incrementar contador de downloads
    formulario.incrementar_download()
    
    # Redirecionar para o arquivo
    return redirect(formulario.arquivo.url)


# === CONSULTA PBLICA ===

def consulta_publica(request):
    """Pagina de consulta publica"""
    try:
        config = ConfiguracaoPortal.objects.get()
        if not config.permitir_consulta_publica:
            messages.error(request, 'Consulta publica no disponvel no momento.')
            return redirect('portal_cidadao:home')
    except ConfiguracaoPortal.DoesNotExist:
        pass
    
    context = {
        'tipos_consulta': ConsultaPublica.TIPO_CONSULTA_CHOICES,
    }
    
    return render(request, 'portal_cidadao/consulta_publica.html', context)


def resultado_consulta(request):
    """Resultado da consulta publica"""
    if request.method != 'POST':
        return redirect('portal_cidadao:consulta_publica')
    
    numero_protocolo = request.POST.get('numero_protocolo')
    documento = request.POST.get('documento')
    tipo_consulta = request.POST.get('tipo_consulta')
    
    if not numero_protocolo or not documento:
        messages.error(request, 'Nmero do protocolo e documento so obrigatorios.')
        return redirect('portal_cidadao:consulta_publica')
    
    # Aqui voc implementaria a lgica de busca nos outros mdulos
    # Por enquanto, vamos simular
    resultado = {
        'encontrado': False,
        'dados': {}
    }
    
    # Registrar a consulta
    ConsultaPublica.objects.create(
        tipo_consulta=tipo_consulta,
        numero_protocolo=numero_protocolo,
        documento_consulta=documento,
        dados_encontrados=resultado,
        ip_origem=request.META.get('REMOTE_ADDR', ''),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    context = {
        'resultado': resultado,
        'numero_protocolo': numero_protocolo,
    }
    
    return render(request, 'portal_cidadao/resultado_consulta.html', context)


# === PETICIONAMENTO E DENUNCIAS ===

def nova_peticao_cidadao(request):
    """Nova peticao pelo portal do cidadao"""
    if request.method == 'POST':
        try:
            usuario_criacao = request.user if request.user.is_authenticated else _get_usuario_sistema()
            if not usuario_criacao:
                raise ValueError('Nenhum usuário do sistema disponível para registrar a petição.')

            # Recuperar ou criar tipo de peticao baseado no tipo selecionado
            tipo_peticao_nome = request.POST.get('tipo_peticao')
            tipo_peticao, created = TipoPeticao.objects.get_or_create(
                categoria=tipo_peticao_nome.upper(),
                defaults={
                    'nome': tipo_peticao_nome.title(),
                    'descricao': f'Peticao do tipo {tipo_peticao_nome} via portal do cidadao'
                }
            )
            
            numero_processo = (
                request.POST.get('numero_processo')
                or request.POST.get('numero_protocolo')
                or request.POST.get('protocolo_numero')
                or ''
            ).strip()

            # Criar peticao eletronica
            peticao = PeticaoEletronica.objects.create(
                tipo_peticao=tipo_peticao,
                origem='PORTAL_CIDADAO',
                assunto=request.POST.get('assunto', ''),
                descricao=request.POST.get('descricao', ''),
                
                # Dados do peticionrio
                peticionario_nome=request.POST.get('nome_completo', ''),
                peticionario_documento=request.POST.get('cpf_cnpj', ''),
                peticionario_email=request.POST.get('email', ''),
                peticionario_telefone=request.POST.get('telefone', ''),
                peticionario_endereco=request.POST.get('endereco', ''),
                peticionario_cep=request.POST.get('cep', ''),
                
                # Dados da empresa (se aplicvel)
                empresa_nome=request.POST.get('empresa_envolvida', ''),
                empresa_cnpj=request.POST.get('cnpj_empresa', ''),

                # Dados adicionais
                valor_causa=float(request.POST.get('valor_envolvido', 0)) if request.POST.get('valor_envolvido') else None,
                data_fato=datetime.strptime(request.POST.get('data_ocorrencia'), '%Y-%m-%d').date() if request.POST.get('data_ocorrencia') else None,
                protocolo_numero=numero_processo,

                # Controle
                ip_origem=request.META.get('REMOTE_ADDR'),
                usuario_criacao=usuario_criacao
            )

            if numero_processo:
                peticao.dados_especificos = peticao.dados_especificos or {}
                peticao.dados_especificos['numero_processo'] = numero_processo
                peticao.save(update_fields=['dados_especificos'])
            
            messages.success(request, f'Peticao enviada com sucesso! Nmero: {peticao.numero_peticao}')
            return redirect('portal_cidadao:peticao_sucesso', numero_peticao=peticao.numero_peticao)
            
        except Exception as e:
            messages.error(request, f'Erro ao enviar peticao: {str(e)}')
    
    tipos_peticao = TipoPeticao.objects.filter(ativo=True).order_by('ordem_exibicao')
    
    context = {
        'tipos_peticao': tipos_peticao,
    }
    
    return render(request, 'portal_cidadao/nova_peticao.html', context)


def peticao_sucesso(request, numero_peticao=None):
    """Pagina de sucesso aps envio de peticao"""
    context = {
        'numero_peticao': numero_peticao,
    }
    
    return render(request, 'portal_cidadao/peticao_sucesso.html', context)


def nova_denuncia(request):
    """Nova denuncia"""
    return render(request, 'portal_cidadao/nova_denuncia.html')


def nova_reclamacao(request):
    """Nova reclamao"""
    return render(request, 'portal_cidadao/nova_reclamacao.html')


# === APIs PARA O PORTAL ===

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from agenda.models import Fiscal
from notificacoes.models import Notificacao, TipoNotificacao
from caixa_entrada.models import CaixaEntrada
import uuid
from datetime import datetime


PETICOES_PORTAL_CONFIG = [
    {
        "slug": "DEFESA_PREVIA",
        "nome": "Defesa Prvia / Impugnao",
        "descricao": "Peticao apresentada pela empresa aps receber um Auto de Infrao, buscando anular ou justificar a autuao.",
        "categoria": "DEFESA",
        "setor_destino": "JURIDICO_1",
        "tipo_caixa": "PETICAO",
        "prioridade": "NORMAL",
        "prazo_resposta_dias": 10
    },
    {
        "slug": "RECURSO_SEGUNDA_INSTANCIA",
        "nome": "Recurso Administrativo - 2 instncia",
        "descricao": "Recurso contra deciso do Jurdico 1, encaminhado ao Jurdico 2.",
        "categoria": "RECURSO",
        "setor_destino": "JURIDICO_2_RECURSOS",
        "tipo_caixa": "RECURSO",
        "prioridade": "ALTA",
        "prazo_resposta_dias": 10
    },
    {
        "slug": "PEDIDO_DILACAO_PRAZO",
        "nome": "Pedido de Dilao de Prazo",
        "descricao": "Solicitacao para ampliar prazo de defesa ou recurso.",
        "categoria": "SOLICITACAO",
        "setor_destino": "JURIDICO_1",
        "tipo_caixa": "SOLICITACAO",
        "prioridade": "NORMAL",
        "prazo_resposta_dias": 5
    },
    {
        "slug": "PEDIDO_VISTA_AUTOS",
        "nome": "Pedido de Cpia / Vista dos Autos",
        "descricao": "Solicitacao de acesso aos autos do processo administrativo.",
        "categoria": "SOLICITACAO",
        "setor_destino": "JURIDICO_1",
        "tipo_caixa": "SOLICITACAO",
        "prioridade": "NORMAL",
        "prazo_resposta_dias": 5
    },
    {
        "slug": "JUNTADA_DOCUMENTOS",
        "nome": "Peticao de Juntada de Documentos",
        "descricao": "Apresentao de novos documentos relacionados  defesa ou recurso.",
        "categoria": "DEFESA",
        "setor_destino": "JURIDICO_1",
        "tipo_caixa": "PETICAO",
        "prioridade": "NORMAL",
        "prazo_resposta_dias": 5
    },
    {
        "slug": "MANIFESTACAO_COMPLEMENTAR",
        "nome": "Manifestao Complementar",
        "descricao": "Complementao de argumentos j apresentados em defesa ou recurso.",
        "categoria": "DEFESA",
        "setor_destino": "JURIDICO_1",
        "tipo_caixa": "PETICAO",
        "prioridade": "NORMAL",
        "prazo_resposta_dias": 5
    },
    {
        "slug": "ALEGACOES_FINAIS",
        "nome": "Alegaes Finais",
        "descricao": "Alegaes finais apresentadas antes da deciso administrativa.",
        "categoria": "DEFESA",
        "setor_destino": "JURIDICO_1",
        "tipo_caixa": "PETICAO",
        "prioridade": "NORMAL",
        "prazo_resposta_dias": 5
    },
    {
        "slug": "PARCELAMENTO_MULTA",
        "nome": "Pedido de Parcelamento ou Negociao de Multa",
        "descricao": "Solicitacao de parcelamento ou negociacao de multa aplicada.",
        "categoria": "SOLICITACAO",
        "setor_destino": "DAF",
        "tipo_caixa": "MULTA",
        "prioridade": "NORMAL",
        "prazo_resposta_dias": 5
    },
    {
        "slug": "REVISAO_MULTA",
        "nome": "Pedido de Reviso de Multa / Reconsiderao",
        "descricao": "Solicitacao de reavaliacao do valor da multa aplicada.",
        "categoria": "RECURSO",
        "setor_destino": "JURIDICO_2_RECURSOS",
        "tipo_caixa": "RECURSO",
        "prioridade": "ALTA",
        "prazo_resposta_dias": 10
    },
    {
        "slug": "EMBARGOS_DECLARACAO",
        "nome": "Embargos de Declarao Administrativos",
        "descricao": "Peticao para sanar omisso, contradio ou obscuridade na deciso.",
        "categoria": "RECURSO",
        "setor_destino": "JURIDICO_2_RECURSOS",
        "tipo_caixa": "RECURSO",
        "prioridade": "NORMAL",
        "prazo_resposta_dias": 5
    },
]


def _normalizar_numero_processo(numero_processo):
    numero = (numero_processo or '').strip()
    if not numero:
        return ''
    return re.sub(r'[^0-9A-Za-z]', '', numero).upper()


def _buscar_processo_por_numero(numero_processo):
    numero = (numero_processo or '').strip()
    if not numero:
        return None

    processo = Processo.objects.filter(numero_processo__iexact=numero).first()
    if processo:
        return processo

    numero_normalizado = _normalizar_numero_processo(numero)
    if not numero_normalizado:
        return None

    candidatos = Processo.objects.filter(numero_processo__icontains=numero_normalizado[-6:])
    for candidato in candidatos:
        if _normalizar_numero_processo(candidato.numero_processo) == numero_normalizado:
            return candidato

    return None


def _peticao_existe(numero_processo, slugs):
    if not numero_processo:
        return False
    return PeticaoEletronica.objects.filter(
        Q(dados_especificos__numero_processo=numero_processo) | Q(protocolo_numero__iexact=numero_processo),
        dados_especificos__portal_slug__in=slugs
    ).exists()


def _filtrar_tipos_por_processo(numero_processo):
    processo = _buscar_processo_por_numero(numero_processo)
    if not processo:
        return None, [], {'detail': 'Processo nao encontrado.'}

    tipos = preparar_tipospeticao_portal()
    hoje = timezone.localdate()

    defesa_ja = _peticao_existe(numero_processo, ['DEFESA_PREVIA'])
    recurso_ja = _peticao_existe(numero_processo, ['RECURSO_PRIMEIRA_INSTANCIA', 'RECURSO_SEGUNDA_INSTANCIA'])

    # Se o prazo de recurso venceu e nao ha recurso, finaliza como procedente.
    try:
        if (
            (processo.status or '').lower() == 'aguardando_recurso'
            and not recurso_ja
            and processo.prazo_recurso
            and processo.prazo_recurso < hoje
        ):
            status_anterior = processo.status
            processo.status = 'finalizado_procedente'
            processo.data_julgamento = processo.data_julgamento or processo.prazo_recurso
            processo.save()
            try:
                from fiscalizacao.models import HistoricoProcesso

                HistoricoProcesso.objects.create(
                    processo=processo,
                    status_anterior=status_anterior,
                    status_novo=processo.status,
                    observacao='Prazo de recurso encerrado sem apresentacao de recurso.',
                    usuario='sistema_portal',
                )
            except Exception:
                pass
    except Exception:
        logger.exception('Falha ao finalizar processo por prazo de recurso: %s', getattr(processo, 'id', None))

    # Se o prazo de defesa venceu e não há defesa, marca revelia e encaminha para análise.
    try:
        if (
            (processo.status or '').lower() == 'aguardando_defesa'
            and not defesa_ja
            and processo.prazo_defesa
            and processo.prazo_defesa < hoje
        ):
            status_anterior = processo.status
            processo.status = 'em_analise'
            processo.save()
            try:
                from fiscalizacao.models import HistoricoProcesso

                HistoricoProcesso.objects.create(
                    processo=processo,
                    status_anterior=status_anterior,
                    status_novo=processo.status,
                    observacao='Revelia: prazo de defesa encerrado sem apresentação.',
                    usuario='sistema_portal',
                )
            except Exception:
                pass
    except Exception:
        logger.exception('Falha ao registrar revelia por prazo de defesa: %s', getattr(processo, 'id', None))

    prazo_defesa_ok = not processo.prazo_defesa or processo.prazo_defesa >= hoje
    prazo_recurso_ok = not processo.prazo_recurso or processo.prazo_recurso >= hoje

    permitidos = {'JUNTADA_DOCUMENTOS', 'PEDIDO_VISTA_AUTOS'}

    status_atual = (processo.status or '').lower()

    if status_atual == 'aguardando_defesa' and prazo_defesa_ok and not defesa_ja:
        permitidos.update({'DEFESA_PREVIA', 'PEDIDO_DILACAO_PRAZO'})

    decisao_instancia = ''
    try:
        if isinstance(getattr(processo, 'dados_especificos', None), dict):
            decisao_instancia = (processo.dados_especificos.get('decisao_instancia') or '').lower()
    except Exception:
        decisao_instancia = ''

    if (
        status_atual == 'aguardando_recurso'
        and prazo_recurso_ok
        and not recurso_ja
        and decisao_instancia in {'juridico_1', 'juridico1'}
    ):
        permitidos.update({'RECURSO_SEGUNDA_INSTANCIA', 'PEDIDO_DILACAO_PRAZO'})

    tipos_filtrados = [tipo for tipo in tipos if tipo.get('slug') in permitidos]

    meta = {
        'numero_processo': processo.numero_processo,
        'status': processo.status,
        'status_display': processo.get_status_display(),
        'prazo_defesa': processo.prazo_defesa.isoformat() if processo.prazo_defesa else None,
        'prazo_recurso': processo.prazo_recurso.isoformat() if processo.prazo_recurso else None,
        'defesa_ja_apresentada': defesa_ja,
        'recurso_ja_apresentado': recurso_ja,
        'permitidos': sorted(list(permitidos)),
    }

    return processo, tipos_filtrados, meta


def get_peticao_config_by_slug(slug):
    codigo = (slug or '').upper()
    for item in PETICOES_PORTAL_CONFIG:
        if item['slug'] == codigo:
            return item
    return None


def _get_usuario_sistema():
    """Retorna um usuário do sistema para criar registros quando o portal é anônimo."""
    User = get_user_model()
    usuario = User.objects.filter(is_staff=True, is_active=True).order_by('id').first()
    if usuario:
        return usuario
    usuario = User.objects.filter(is_superuser=True, is_active=True).order_by('id').first()
    if usuario:
        return usuario
    usuario, created = User.objects.get_or_create(
        username='sistema_portal',
        defaults={
            'first_name': 'Sistema',
            'last_name': 'Portal',
            'email': 'sistema@procon.am.gov.br',
            'is_staff': True,
            'is_active': True,
        }
    )
    if created:
        usuario.set_unusable_password()
        usuario.save(update_fields=['password'])
    return usuario


def mapear_setor_destino(codigo_setor):
    """
    Mapeia código de setor para nome completo usado na caixa de entrada.
    Garante que cada tipo de petição vá para o setor correto.
    Usa os mesmos nomes definidos em caixa_entrada/services.py SETOR_LABELS
    """
    mapeamento = {
        'JURIDICO_1': 'Juridico 1 - Peticoes',
        'JURIDICO_2_RECURSOS': 'Juridico 2 - Recursos',
        'JURIDICO_2': 'Juridico 2 - Recursos',
        'DAF': 'Diretoria Administrativa Financeira',
        'FINANCEIRO': 'Financeiro',
        'FISCALIZACAO': 'Fiscalizacao',
        'FISCALIZACAO_DENUNCIAS': 'Fiscalizacao - Denuncias',
        'FISCALIZACAO_PROPRIO': 'Fiscalizacao - Setor Proprio',
        'ATENDIMENTO': 'Atendimento/Protocolo',
        'COBRANCA': 'Cobranca',
        'DIRETORIA': 'Diretoria',
        'GERAL': 'Acesso Geral',
    }
    
    codigo_upper = (codigo_setor or '').upper().strip()
    return mapeamento.get(codigo_upper, codigo_setor or 'Juridico 1 - Peticoes')


def ensure_tipo_peticao(config):
    from peticionamento.models import TipoPeticao

    defaults = {
        'descricao': config['descricao'],
        'categoria': config.get('categoria', 'OUTROS'),
        'prazo_resposta_dias': config.get('prazo_resposta_dias', 10),
        'requer_documentos': True,
        'permite_anonimo': False,
        'notificar_email': True,
        'campos_obrigatorios': [],
        'campos_opcionais': [],
        'documentos_obrigatorios': [],
        'documentos_opcionais': [],
        'tamanho_maximo_mb': 20,
        'tipos_arquivo_permitidos': 'pdf,doc,docx,jpg,jpeg,png'
    }

    tipo, created = TipoPeticao.objects.get_or_create(
        nome=config['nome'],
        defaults=defaults
    )

    atualizou = False

    for campo, valor in defaults.items():
        if getattr(tipo, campo) != valor:
            setattr(tipo, campo, valor)
            atualizou = True

    # TipoPeticao não tem dados_especificos, então vamos usar um campo JSONField se existir
    # ou armazenar em outro lugar. Por enquanto, vamos apenas garantir que o tipo existe
    # e usar o nome para mapear o slug
    # Se o modelo tiver um campo JSONField para dados extras, usar aqui
    # Por enquanto, vamos apenas garantir que o tipo está correto
    pass  # Não há campo dados_especificos em TipoPeticao

    if atualizou:
        tipo.save()

    return tipo


def preparar_tipospeticao_portal():
    tipos = []
    for config in PETICOES_PORTAL_CONFIG:
        tipo = ensure_tipo_peticao(config)
        tipos.append({
            'id': tipo.id,
            'nome': tipo.nome,
            'descricao': tipo.descricao,
            'categoria': config.get('categoria', 'OUTROS'),
            'slug': config['slug'],
            'setor_destino': config['setor_destino'],
            'tipo_caixa': config['tipo_caixa'],
            'prioridade': config.get('prioridade', 'NORMAL'),
            'prazo_resposta_dias': config.get('prazo_resposta_dias', 10)
        })
    return tipos

class DenunciaCidadaoAPIView(APIView):
    """API para receber denuncias do cidadao - vai direto para FISCALIZACAO"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Extrair dados da denuncia (suportar tanto DRF quanto multipart)
            if hasattr(request, 'data') and request.data:
                dados = request.data
            else:
                dados = request.POST
            
            # Gerar numero nico da denuncia
            numero_denuncia = self._gerar_numero_denuncia()
            
            # Verificar se  denuncia anonima (converter string para bool)
            denuncia_anonima_raw = dados.get('denuncia_anonima', False)
            if isinstance(denuncia_anonima_raw, str):
                denuncia_anonima = denuncia_anonima_raw.lower() in ['true', '1', 'yes']
            else:
                denuncia_anonima = bool(denuncia_anonima_raw)
            
            # Dados do denunciante (podem ser vazios se anonimo)
            nome_denunciante = dados.get('nome_denunciante', '') if not denuncia_anonima else ''
            cpf_cnpj = dados.get('cpf_cnpj', '') if not denuncia_anonima else ''
            email = dados.get('email', '') if not denuncia_anonima else ''
            telefone = dados.get('telefone', '') if not denuncia_anonima else ''
            
            # Criar denuncia do cidadao
            denuncia = DenunciaCidadao.objects.create(
                empresa_denunciada=dados.get('empresa_denunciada', ''),
                cnpj_empresa=dados.get('cnpj_empresa', ''),
                endereco_empresa=dados.get('endereco_empresa', ''),
                telefone_empresa=dados.get('telefone_empresa', ''),
                email_empresa=dados.get('email_empresa', ''),
                
                # Dados da infrao
                descricao_fatos=dados.get('descricao_fatos', ''),
                data_ocorrencia=datetime.strptime(dados.get('data_ocorrencia'), '%Y-%m-%d').date() if dados.get('data_ocorrencia') else None,
                tipo_infracao=(dados.get('tipo_infracao') or 'outros'),
                
                # Dados do denunciante
                nome_denunciante=nome_denunciante,
                cpf_cnpj=cpf_cnpj,
                email=email,
                telefone=telefone,
                
                # Controle de anonimato
                denuncia_anonima=denuncia_anonima,
                motivo_anonimato=dados.get('motivo_anonimato', ''),
                
                # Status inicial
                status='denuncia_recebida',
                origem_denuncia='PORTAL_CIDADAO',
                
                # Metadados
                ip_origem=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
            
            # Processar anexos se houver
            anexos = request.FILES.getlist('documentos')
            for anexo in anexos:
                from fiscalizacao.models import AnexoAuto
                AnexoAuto.objects.create(
                    content_type=ContentType.objects.get_for_model(denuncia),
                    object_id=denuncia.id,
                    arquivo=anexo,
                    nome_arquivo=anexo.name,
                    descricao=f'Anexo da denuncia - {anexo.name}'
                )
            
            # Registrar na Caixa de Entrada
            documento_caixa = self._registrar_caixa_entrada(denuncia)

            # NOTIFICAR FISCAIS
            self._notificar_fiscais(denuncia, documento_caixa=documento_caixa)

            # Registrar atividade no histórico
            self._registrar_atividade_historico(
                request=request,
                tipo='denuncia',
                titulo=f'Denúncia registrada - {denuncia.numero_denuncia}',
                descricao=f'Denúncia contra {denuncia.empresa_denunciada}',
                numero_protocolo=denuncia.numero_denuncia,
                denuncia_id=denuncia.id,
                email=email,
                cpf_cnpj=cpf_cnpj
            )

            # Recuperar dados da triagem/PPA criados automaticamente
            triagem_relacionada = (
                denuncia.triagens.order_by('-id').select_related('ppa').first()
            )
            triagem_payload = None
            ppa_payload = None

            if triagem_relacionada:
                triagem_payload = {
                    'numero_protocolo': triagem_relacionada.numero_protocolo,
                    'status': triagem_relacionada.status,
                    'prioridade': triagem_relacionada.prioridade_sugerida,
                }
                if triagem_relacionada.ppa:
                    ppa_payload = {
                        'numero': triagem_relacionada.ppa.numero,
                        'status': triagem_relacionada.ppa.status,
                        'sigla': triagem_relacionada.ppa.sigla,
                    }

            return Response({
                'success': True,
                'numero_denuncia': denuncia.numero_denuncia,
                'triagem': triagem_payload,
                'ppa': ppa_payload,
                'message': 'Denuncia recebida com sucesso! Ser analisada por nossos fiscais.'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _gerar_numero_denuncia(self):
        """Gera numero nico da denuncia"""
        from datetime import datetime
        agora = datetime.now()
        ano = agora.year
        
        # Busca ultima denuncia do ano
        uultima = DenunciaCidadao.objects.filter(
            numero_denuncia__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if uultima:
            try:
                seq = int(uultima.numero_denuncia.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"DEN-{seq:06d}/{ano}"
    
    def _registrar_caixa_entrada(self, peticao, config=None):
        """Cria registro na caixa de entrada para petições ou denúncias."""
        config = config or {
            'tipo_caixa': 'DENUNCIA',
            'nome': 'Denúncia Portal do Cidadão',
            'prioridade': 'NORMAL',
            'setor_destino': 'Fiscalização - Denúncias',
        }

        numero_documento = getattr(
            peticao,
            'numero_peticao',
            getattr(peticao, 'numero_denuncia', ''),
        )
        descricao = getattr(peticao, 'descricao', None) or getattr(peticao, 'descricao_fatos', '')
        remetente_nome = getattr(peticao, 'peticionario_nome', None) or getattr(peticao, 'nome_denunciante', '')
        remetente_documento = getattr(
            peticao,
            'peticionario_documento',
            getattr(peticao, 'cpf_cnpj', ''),
        )
        remetente_email = getattr(peticao, 'peticionario_email', None) or getattr(peticao, 'email', '')
        remetente_telefone = getattr(peticao, 'peticionario_telefone', None) or getattr(peticao, 'telefone', '')
        empresa_nome = getattr(peticao, 'empresa_nome', None) or getattr(peticao, 'empresa_denunciada', '')
        empresa_cnpj = getattr(peticao, 'empresa_cnpj', None) or getattr(peticao, 'cnpj_empresa', '')

        try:
            # Mapear código do setor para nome completo do setor
            codigo_setor = config.get('setor_destino', 'FISCALIZACAO_DENUNCIAS')
            setor_destino_nome = mapear_setor_destino(codigo_setor)

            protocolo = None
            responsavel_atual = None
            numero_processo = (getattr(peticao, 'protocolo_numero', '') or '').strip()
            if numero_processo:
                try:
                    from protocolo_tramitacao.models import ProtocoloDocumento
                    protocolo = (
                        ProtocoloDocumento.objects
                        .select_related('setor_atual', 'responsavel_atual')
                        .filter(numero_protocolo__iexact=numero_processo)
                        .first()
                    )
                    if protocolo and protocolo.setor_atual:
                        setor_destino_nome = protocolo.setor_atual.nome or setor_destino_nome
                        responsavel_atual = protocolo.responsavel_atual
                except Exception:
                    protocolo = None

            if numero_processo and not protocolo:
                setor_destino_nome = mapear_setor_destino('ATENDIMENTO')
                descricao = f"[TRIAGEM] Processo nao localizado: {numero_processo}\n{descricao}"
            
            return CaixaEntrada.objects.create(
                tipo_documento=config.get('tipo_caixa', 'PETICAO'),
                assunto=f"{config['nome']} - {numero_documento}"[:200],
                descricao=(descricao or '')[:1000],
                prioridade=config.get('prioridade', 'NORMAL'),
                remetente_nome=remetente_nome or 'Anônimo',
                remetente_documento=remetente_documento or '',
                remetente_email=remetente_email or '',
                remetente_telefone=remetente_telefone or '',
                empresa_nome=empresa_nome or '',
                empresa_cnpj=empresa_cnpj or '',
                setor_destino=setor_destino_nome,
                setor_lotacao=setor_destino_nome,
                responsavel_atual=responsavel_atual,
                destinatario_direto=responsavel_atual,
                protocolo=protocolo,
                content_type=ContentType.objects.get_for_model(peticao),
                object_id=peticao.id,
                origem='PORTAL_CIDADAO',
                ip_origem=getattr(peticao, 'ip_origem', ''),
                user_agent=getattr(peticao, 'user_agent', ''),
            )
        except Exception as exc:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao registrar documento na caixa de entrada: {exc}")
            print(f"Erro ao registrar documento na caixa de entrada: {exc}")
            return None

    def _notificar_destino(self, peticao, config, documento_caixa=None):
        """Notifica o setor responsavel sobre a nova peticao"""
        try:
            setor_base = ''
            if documento_caixa and documento_caixa.setor_destino:
                setor_base = documento_caixa.setor_destino
            else:
                setor_base = config.get('setor_destino') or ''
            setor_destino = setor_base.upper()
            if 'JURIDICO' in setor_destino:
                grupo = 'juridico'
            elif any(sigla in setor_destino for sigla in ['FIN', 'DAF']):
                grupo = 'financeiro'
            elif 'FISC' in setor_destino:
                grupo = 'fiscalizacao'
            else:
                grupo = 'juridico'

            usuarios = User.objects.filter(
                groups__name__icontains=grupo,
                is_active=True,
            ).distinct()

            if not usuarios.exists():
                usuarios = User.objects.filter(
                    user_permissions__codename__icontains=grupo,
                    is_active=True,
                ).distinct()

            if not usuarios.exists():
                usuarios = User.objects.filter(is_staff=True, is_active=True)

            tipo_notif, _ = TipoNotificacao.objects.get_or_create(
                codigo=f'PETICAO_{grupo.upper()}',
                defaults={
                    'nome': f"Peticao - {config['nome']}",
                    'descricao': 'Nova peticao recebida via Portal do Cidadao',
                    'enviar_email': True,
                    'enviar_sms': False,
                    'prioridade': 'alta' if config.get('prioridade') == 'URGENTE' else 'normal',
                },
            )

            protocolo_info = ''
            if documento_caixa:
                protocolo_info = f'Protocolo na caixa: {documento_caixa.numero_protocolo}'

            mensagem_partes = [
                'Nova peticao recebida via Portal do Cidadao:',
                '',
                f'Numero: {peticao.numero_peticao}',
                f"Tipo: {config['nome']}",
                f'Advogado: {peticao.peticionario_nome}',
                f"Empresa: {peticao.empresa_nome or 'Nao informada'}",
                f"Assunto: {peticao.assunto or 'Nao informado'}",
                '',
                f"Resumo: {(peticao.descricao or '')[:200]}...",
            ]

            if protocolo_info:
                mensagem_partes.append(protocolo_info)

            mensagem_partes.extend([
                '',
                'Acesse a caixa de entrada responsavel para analisar e tomar as providencias necessarias.',
            ])

            mensagem = '\n'.join(mensagem_partes)
            content_type = ContentType.objects.get_for_model(peticao)

            for usuario in usuarios:
                Notificacao.objects.create(
                    content_type=content_type,
                    object_id=peticao.id,
                    tipo=tipo_notif,
                    destinatario_nome=usuario.get_full_name() or usuario.username,
                    destinatario_email=usuario.email,
                    assunto=f"Nova peticao - {peticao.numero_peticao}",
                    conteudo=mensagem,
                    canal='email',
                    prioridade='alta' if config.get('prioridade') == 'URGENTE' else 'normal',
                )
        except Exception as exc:
            print(f"Erro ao notificar destino da peticao: {exc}")

    def _registrar_atividade_historico(self, request, tipo, titulo, descricao='', 
                                       numero_protocolo='', denuncia_id=None, 
                                       peticao_id=None, email='', cpf_cnpj=''):
        """Registra atividade no histórico do usuário"""
        try:
            usuario = None
            identificador = ''
            
            # Se o usuário está autenticado, usar o usuário
            if request.user.is_authenticated:
                usuario = request.user
            else:
                # Caso contrário, usar email ou CPF como identificador
                identificador = email or cpf_cnpj or ''
            
            HistoricoAtividade.objects.create(
                usuario=usuario,
                identificador=identificador,
                tipo=tipo,
                titulo=titulo,
                descricao=descricao,
                numero_protocolo=numero_protocolo,
                denuncia_id=denuncia_id,
                peticao_id=peticao_id,
                ip_origem=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
        except Exception as e:
            # Não falhar se houver erro ao registrar histórico
            print(f"Erro ao registrar atividade no histórico: {e}")

    def _notificar_fiscais(self, denuncia, documento_caixa=None):
        """
        Reaproveita o mecanismo de notificação para alertar a fiscalização sobre novas denúncias.
        """
        config = {
            'nome': 'Denúncia Portal do Cidadão',
            'setor_destino': 'FISCALIZACAO_DENUNCIAS',  # Código do setor
            'tipo_caixa': 'DENUNCIA',
            'prioridade': 'ALTA',
        }
        self._notificar_destino(denuncia, config, documento_caixa=documento_caixa)



class DenunciaCidadaoConsultaAPIView(APIView):
    """Consulta publica da resposta da denuncia."""

    permission_classes = [AllowAny]

    def post(self, request):
        data = getattr(request, 'data', None) or request.POST
        numero = (data.get('numero_denuncia') or data.get('numero') or '').strip()
        documento = (data.get('documento') or data.get('cpf_cnpj') or '').strip()
        email = (data.get('email') or '').strip()

        if not numero:
            return Response(
                {'encontrado': False, 'detail': 'Informe o numero da denuncia.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        denuncia = DenunciaCidadao.objects.filter(numero_denuncia__iexact=numero).first()
        if not denuncia:
            return Response(
                {'encontrado': False, 'detail': 'Denuncia nao encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not denuncia.denuncia_anonima:
            if not documento and not email:
                return Response(
                    {'encontrado': False, 'detail': 'Informe CPF/CNPJ ou e-mail para consultar.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if documento:
                doc_normalizado = self._normalize_documento(documento)
                doc_registrado = self._normalize_documento(denuncia.cpf_cnpj)
                if doc_registrado and doc_normalizado and doc_registrado != doc_normalizado:
                    return Response(
                        {'encontrado': False, 'detail': 'Documento nao confere com a denuncia.'},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            if email:
                email_registrado = (denuncia.email or '').strip().lower()
                if email_registrado and email_registrado != email.strip().lower():
                    return Response(
                        {'encontrado': False, 'detail': 'E-mail nao confere com a denuncia.'},
                        status=status.HTTP_404_NOT_FOUND,
                    )

        payload = self._build_payload(denuncia)
        return Response(payload, status=status.HTTP_200_OK)

    def _build_payload(self, denuncia):
        return {
            'encontrado': True,
            'numero_denuncia': denuncia.numero_denuncia,
            'status': denuncia.status,
            'status_display': denuncia.get_status_display(),
            'empresa_denunciada': denuncia.empresa_denunciada,
            'tipo_infracao': denuncia.tipo_infracao,
            'descricao_fatos': denuncia.descricao_fatos,
            'data_ocorrencia': denuncia.data_ocorrencia.isoformat() if denuncia.data_ocorrencia else None,
            'denuncia_anonima': denuncia.denuncia_anonima,
            'competencia_procon': denuncia.competencia_procon,
            'orientacao_destino': denuncia.orientacao_destino,
            'resposta_fiscal': denuncia.resposta_fiscal,
            'respondido_em': self._format_datetime(denuncia.respondido_em),
            'respondido_por': self._format_usuario(denuncia.respondido_por),
            'criado_em': self._format_datetime(denuncia.criado_em),
            'atualizado_em': self._format_datetime(denuncia.atualizado_em),
        }

    def _normalize_documento(self, value):
        texto = ''.join(ch for ch in str(value or '') if ch.isalnum())
        somente_digitos = ''.join(ch for ch in texto if ch.isdigit())
        return somente_digitos if somente_digitos else texto.upper()

    def _format_datetime(self, value):
        if not value:
            return None
        if hasattr(value, 'year') and not hasattr(value, 'hour'):
            value = datetime.combine(value, datetime.min.time())
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.get_current_timezone())
        return timezone.localtime(value).isoformat()

    def _format_usuario(self, usuario):
        if not usuario:
            return None
        nome = (usuario.get_full_name() or '').strip()
        return nome or usuario.username


class DenunciaCidadaoRespostaAPIView(APIView):
    """Registra a resposta do fiscal para a denuncia."""

    permission_classes = [IsAuthenticated]

    def get(self, request, denuncia_id):
        denuncia = get_object_or_404(DenunciaCidadao, id=denuncia_id)
        payload = DenunciaCidadaoConsultaAPIView()._build_payload(denuncia)
        return Response(payload, status=status.HTTP_200_OK)

    def patch(self, request, denuncia_id):
        denuncia = get_object_or_404(DenunciaCidadao, id=denuncia_id)
        data = getattr(request, 'data', None) or request.POST

        competencia_raw = data.get('competencia_procon', None)
        competencia = self._parse_bool(competencia_raw)
        if competencia_raw is not None and competencia is None:
            return Response(
                {'detail': 'Informe um valor valido para competencia_procon.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        atualizar = False
        if competencia_raw is not None:
            denuncia.competencia_procon = competencia
            atualizar = True

        if 'orientacao_destino' in data:
            denuncia.orientacao_destino = (data.get('orientacao_destino') or '').strip()
            atualizar = True

        if 'resposta_fiscal' in data:
            denuncia.resposta_fiscal = (data.get('resposta_fiscal') or '').strip()
            atualizar = True

        if not atualizar:
            return Response(
                {'detail': 'Nenhum dado enviado para atualizar a resposta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        denuncia.respondido_em = timezone.now()
        denuncia.respondido_por = request.user
        if denuncia.status != 'respondida':
            denuncia.status = 'respondida'

        denuncia.save()
        payload = DenunciaCidadaoConsultaAPIView()._build_payload(denuncia)
        return Response(payload, status=status.HTTP_200_OK)

    def _parse_bool(self, value):
        if value is None or value == '':
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, int):
            return bool(value)
        texto = str(value).strip().lower()
        if texto in {'true', '1', 'sim', 'yes'}:
            return True
        if texto in {'false', '0', 'nao', 'no'}:
            return False
        return None


class TiposPeticaoPortalAPIView(APIView):
    """Retorna os tipos de peticao disponveis para o portal do cidadao"""

    permission_classes = [AllowAny]

    def get(self, request):
        numero_processo = request.query_params.get('numero_processo', '').strip()
        if numero_processo:
            _, tipos, meta = _filtrar_tipos_por_processo(numero_processo)
            if not tipos and meta.get('detail'):
                return Response({'detail': meta['detail']}, status=status.HTTP_404_NOT_FOUND)
            return Response({'tipos': tipos, 'processo': meta})

        tipos = preparar_tipospeticao_portal()
        return Response({'tipos': tipos})


class PeticaoJuridicaAPIView(APIView):
    """API para peties jurdicas (advogados) - vai para JURDICO"""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        try:
            from peticionamento.models import PeticaoEletronica, TipoPeticao

            # Para multipart/form-data, usar request.data (DRF) ou request.POST (Django)
            # DRF processa multipart automaticamente em request.data
            if hasattr(request, 'data') and request.data:
                dados = request.data
            else:
                dados = request.POST
            
            # Converter QueryDict para dict se necessário
            if hasattr(dados, 'dict'):
                dados = dados.dict()
            
            # Debug: log dos dados recebidos (apenas em desenvolvimento)
            import logging
            logger = logging.getLogger(__name__)
            if settings.DEBUG:
                logger.debug(f"=== DADOS RECEBIDOS NA API DE PETIÇÃO ===")
                logger.debug(f"Dados completos: {dict(dados)}")
                logger.debug(f"tipo_peticao_codigo: {dados.get('tipo_peticao_codigo')}")
                logger.debug(f"tipo_peticao_id: {dados.get('tipo_peticao_id')}")
                logger.debug(f"assunto: {dados.get('assunto')}")
                logger.debug(f"descricao: {dados.get('descricao', '')[:50]}...")
                logger.debug(f"nome_completo: {dados.get('nome_completo')}")
                logger.debug(f"email: {dados.get('email')}")
                logger.debug(f"telefone: {dados.get('telefone')}")
                logger.debug(f"cpf_cnpj: {dados.get('cpf_cnpj')}")
                logger.debug(f"Arquivos recebidos: {len(request.FILES.getlist('documentos'))} arquivo(s)")
                logger.debug(f"Content-Type: {request.content_type}")
                logger.debug(f"==========================================")

            codigo = (dados.get('tipo_peticao_codigo') or dados.get('tipo_peticao_slug') or '').upper()
            tipo_peticao = None
            config = None

            if codigo:
                config = get_peticao_config_by_slug(codigo)
                if not config:
                    return Response({
                        'success': False,
                        'error': f'Tipo de petição não reconhecido: {codigo}. Verifique se o código está correto.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                tipo_peticao = ensure_tipo_peticao(config)
            else:
                tipo_id = dados.get('tipo_peticao_id')
                if not tipo_id:
                    return Response({
                        'success': False,
                        'error': 'Tipo de petição é obrigatório. Informe tipo_peticao_codigo ou tipo_peticao_id.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Se tipo_id parece ser um slug (string não numérica), tentar usar como código
                if isinstance(tipo_id, str) and not tipo_id.isdigit():
                    codigo = tipo_id.upper()
                    config = get_peticao_config_by_slug(codigo)
                    if config:
                        tipo_peticao = ensure_tipo_peticao(config)
                    else:
                        return Response({
                            'success': False,
                            'error': f'Tipo de petição não reconhecido: {tipo_id}. Verifique se o código está correto.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Tentar buscar por ID numérico
                    try:
                        tipo_peticao = TipoPeticao.objects.get(id=tipo_id)
                        # TipoPeticao não tem dados_especificos, então vamos usar o nome para gerar o slug
                        # e tentar encontrar a configuração correspondente
                        slug_candidato = tipo_peticao.nome.upper().replace(' ', '_').replace('-', '_')
                        
                        # Tentar encontrar config pelo slug gerado do nome
                        config = get_peticao_config_by_slug(slug_candidato)
                        
                        # Se não encontrou, tentar buscar por nome similar
                        if not config:
                            # Buscar em todas as configs por nome similar
                            for cfg in PETICOES_PORTAL_CONFIG:
                                if cfg['nome'].upper() == tipo_peticao.nome.upper() or \
                                   tipo_peticao.nome.upper() in cfg['nome'].upper() or \
                                   cfg['nome'].upper() in tipo_peticao.nome.upper():
                                    config = cfg
                                    break
                        
                        if not config:
                            return Response({
                                'success': False,
                                'error': f'Tipo de petição (ID: {tipo_id} - {tipo_peticao.nome}) não está habilitado para o portal. Use tipo_peticao_codigo em vez de tipo_peticao_id.'
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        # Garantir que o tipo existe e está atualizado
                        tipo_peticao = ensure_tipo_peticao(config)
                        codigo = config['slug']
                    except TipoPeticao.DoesNotExist:
                        return Response({
                            'success': False,
                            'error': f'Tipo de petição com ID {tipo_id} não encontrado.'
                        }, status=status.HTTP_400_BAD_REQUEST)

            numero_processo = (
                dados.get('numero_processo')
                or dados.get('numero_protocolo')
                or dados.get('protocolo_numero')
                or ''
            ).strip()

            # Validar processo e tipo permitido para o momento do fluxo
            if not numero_processo:
                return Response({
                    'success': False,
                    'error': 'Numero do processo e obrigatorio para peticao juridica.'
                }, status=status.HTTP_400_BAD_REQUEST)

            _, tipos_permitidos, meta = _filtrar_tipos_por_processo(numero_processo)
            if not tipos_permitidos and meta.get('detail'):
                return Response({
                    'success': False,
                    'error': meta.get('detail')
                }, status=status.HTTP_404_NOT_FOUND)

            permitidos_slugs = {tipo.get('slug') for tipo in tipos_permitidos}
            if codigo and codigo not in permitidos_slugs:
                return Response({
                    'success': False,
                    'error': 'Tipo de peticao nao permitido para o status atual do processo.',
                    'permitidos': sorted(list(permitidos_slugs))
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validar campos obrigatórios
            campos_obrigatorios = {
                'numero_processo': numero_processo,
                'assunto': dados.get('assunto', '').strip(),
                'descricao': dados.get('descricao', '').strip(),
                'nome_completo': dados.get('nome_completo', '').strip(),
                'cpf_cnpj': dados.get('cpf_cnpj', '').strip(),
                'email': dados.get('email', '').strip(),
                'telefone': dados.get('telefone', '').strip(),
            }
            
            campos_faltando = [campo for campo, valor in campos_obrigatorios.items() if not valor]
            if campos_faltando:
                return Response({
                    'success': False,
                    'error': f'Campos obrigatórios não preenchidos: {", ".join(campos_faltando)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar tamanho mínimo da descrição
            if len(campos_obrigatorios['descricao']) < 50:
                return Response({
                    'success': False,
                    'error': 'A descrição deve ter pelo menos 50 caracteres.'
                }, status=status.HTTP_400_BAD_REQUEST)

            usuario_criacao = request.user if request.user.is_authenticated else _get_usuario_sistema()
            if not usuario_criacao:
                raise ValueError('Nenhum usuário do sistema disponível para registrar a petição.')

            peticao = PeticaoEletronica.objects.create(
                tipo_peticao=tipo_peticao,
                origem='PORTAL_CIDADAO',
                assunto=campos_obrigatorios['assunto'],
                descricao=campos_obrigatorios['descricao'],
                peticionario_nome=campos_obrigatorios['nome_completo'],
                peticionario_documento=campos_obrigatorios['cpf_cnpj'],
                peticionario_email=campos_obrigatorios['email'],
                peticionario_telefone=campos_obrigatorios['telefone'],
                peticionario_endereco=dados.get('endereco', '').strip(),
                empresa_nome=dados.get('empresa_envolvida', '').strip(),
                empresa_cnpj=dados.get('cnpj_empresa', '').strip(),
                protocolo_numero=numero_processo,
                status='ENVIADA',
                prioridade=config.get('prioridade', 'NORMAL'),
                ip_origem=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                usuario_criacao=usuario_criacao
            )

            peticao.dados_especificos = peticao.dados_especificos or {}
            peticao.dados_especificos['portal_slug'] = codigo
            if numero_processo:
                peticao.dados_especificos['numero_processo'] = numero_processo
            if config and config.get('setor_destino'):
                peticao.dados_especificos['setor_destino'] = config.get('setor_destino')
            peticao.save(update_fields=['prioridade', 'dados_especificos'])

            # Atualizar processo quando defesa for apresentada
            if codigo == 'DEFESA_PREVIA' and numero_processo:
                processo = _buscar_processo_por_numero(numero_processo)
                if processo:
                    processo.atualizar_status('defesa_apresentada', 'Defesa apresentada via Portal Cidadao')
                    processo.atualizar_status('em_analise', 'Encaminhado automaticamente para analise juridica')

            # Atualizar processo quando recurso for apresentado
            if codigo in {'RECURSO_PRIMEIRA_INSTANCIA', 'RECURSO_SEGUNDA_INSTANCIA'} and numero_processo:
                processo = _buscar_processo_por_numero(numero_processo)
                if processo:
                    processo.atualizar_status('recurso_apresentado', 'Recurso apresentado via Portal Cidadao')

            anexos = request.FILES.getlist('documentos')
            for anexo in anexos:
                from peticionamento.models import AnexoPeticao
                AnexoPeticao.objects.create(
                    peticao=peticao,
                    arquivo=anexo,
                    nome_arquivo=anexo.name,
                    tipo_anexo='DOCUMENTO'
                )

            documento_caixa = self._registrar_caixa_entrada(peticao, config)
            self._notificar_destino(peticao, config, documento_caixa=documento_caixa)

            # Registrar atividade no histórico
            self._registrar_atividade_historico(
                request=request,
                tipo='peticao',
                titulo=f'Petição registrada - {peticao.numero_peticao}',
                descricao=f'Petição: {campos_obrigatorios["assunto"]}',
                numero_protocolo=peticao.numero_peticao or peticao.protocolo_numero,
                peticao_id=peticao.id,
                email=campos_obrigatorios['email'],
                cpf_cnpj=campos_obrigatorios['cpf_cnpj']
            )

            return Response({
                'success': True,
                'numero_peticao': peticao.numero_peticao,
                'protocolo_numero': peticao.protocolo_numero,
                'setor_destino': documento_caixa.setor_destino if documento_caixa else config['setor_destino'],
                'tipo_caixa': config['tipo_caixa'],
                'message': 'Peticao jurdica enviada com sucesso! Ser analisada pelo setor responsavel.'
            }, status=status.HTTP_201_CREATED)

        except TipoPeticao.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Tipo de petição informado não existe.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({
                'success': False,
                'error': f'Erro de validação: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"Erro ao processar petição: {error_trace}")
            return Response({
                'success': False,
                'error': f'Erro ao processar petição: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _registrar_atividade_historico(self, request, tipo, titulo, descricao='', 
                                       numero_protocolo='', denuncia_id=None, 
                                       peticao_id=None, email='', cpf_cnpj=''):
        """Registra atividade no histórico do usuário"""
        try:
            usuario = None
            identificador = ''
            
            # Se o usuário está autenticado, usar o usuário
            if request.user.is_authenticated:
                usuario = request.user
            else:
                # Caso contrário, usar email ou CPF como identificador
                identificador = email or cpf_cnpj or ''
            
            HistoricoAtividade.objects.create(
                usuario=usuario,
                identificador=identificador,
                tipo=tipo,
                titulo=titulo,
                descricao=descricao,
                numero_protocolo=numero_protocolo,
                denuncia_id=denuncia_id,
                peticao_id=peticao_id,
                ip_origem=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
        except Exception as e:
            # Não falhar se houver erro ao registrar histórico
            print(f"Erro ao registrar atividade no histórico: {e}")

    def _registrar_caixa_entrada(self, peticao, config):
        """Cria registro na caixa de entrada conforme o tipo da peticao"""
        try:
            descricao = peticao.descricao[:1000] if peticao.descricao else ''
            titulo = f"{config['nome']} - {peticao.numero_peticao}"
            prioridade = config.get('prioridade', 'NORMAL')
            tipo_caixa = config.get('tipo_caixa', 'PETICAO')
            
            # Mapear código do setor para nome completo do setor
            codigo_setor = config.get('setor_destino', 'JURIDICO_1')
            setor_destino_nome = mapear_setor_destino(codigo_setor)

            protocolo = None
            responsavel_atual = None
            numero_processo = (getattr(peticao, 'protocolo_numero', '') or '').strip()
            if numero_processo:
                try:
                    from protocolo_tramitacao.models import ProtocoloDocumento
                    protocolo = (
                        ProtocoloDocumento.objects
                        .select_related('setor_atual', 'responsavel_atual')
                        .filter(numero_protocolo__iexact=numero_processo)
                        .first()
                    )
                    if protocolo and protocolo.setor_atual:
                        setor_destino_nome = protocolo.setor_atual.nome or setor_destino_nome
                        responsavel_atual = protocolo.responsavel_atual
                except Exception:
                    protocolo = None

            if numero_processo and not protocolo:
                setor_destino_nome = mapear_setor_destino('ATENDIMENTO')
                descricao = f"[TRIAGEM] Processo nao localizado: {numero_processo}\n{descricao}"
            
            # Log para debug
            if settings.DEBUG:
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"Registrando petição na caixa de entrada:")
                logger.debug(f"  - Tipo: {tipo_caixa}")
                logger.debug(f"  - Código setor: {codigo_setor}")
                logger.debug(f"  - Setor destino: {setor_destino_nome}")
                logger.debug(f"  - Prioridade: {prioridade}")

            return CaixaEntrada.objects.create(
                tipo_documento=tipo_caixa,
                assunto=titulo[:200],
                descricao=descricao,
                prioridade=prioridade,
                remetente_nome=peticao.peticionario_nome,
                remetente_documento=peticao.peticionario_documento,
                remetente_email=peticao.peticionario_email,
                remetente_telefone=peticao.peticionario_telefone,
                empresa_nome=peticao.empresa_nome or '',
                empresa_cnpj=peticao.empresa_cnpj or '',
                setor_destino=setor_destino_nome,
                setor_lotacao=setor_destino_nome,
                responsavel_atual=responsavel_atual,
                destinatario_direto=responsavel_atual,
                protocolo=protocolo,
                content_type=ContentType.objects.get_for_model(peticao),
                object_id=peticao.id,
                origem='PORTAL_CIDADAO',
                ip_origem=peticao.ip_origem,
                user_agent=peticao.user_agent
            )
        except Exception as exc:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao registrar petição na caixa de entrada: {exc}")
            print(f"Erro ao registrar peticao na caixa de entrada: {exc}")
            return None

    def _notificar_destino(self, peticao, config, documento_caixa=None):
        """Notifica o setor responsavel sobre a nova peticao"""
        try:
            setor_base = ''
            if documento_caixa and documento_caixa.setor_destino:
                setor_base = documento_caixa.setor_destino
            else:
                setor_base = config.get('setor_destino') or ''
            setor = setor_base.upper()
            grupo_keyword = 'juridico'
            if 'JURIDICO' in setor:
                grupo_keyword = 'juridico'
            elif any(chave in setor for chave in ['FIN', 'DAF']):
                grupo_keyword = 'financeiro'
            elif 'FISC' in setor:
                grupo_keyword = 'fiscalizacao'

            usuarios_destino = User.objects.filter(
                groups__name__icontains=grupo_keyword,
                is_active=True
            ).distinct()

            if not usuarios_destino.exists():
                usuarios_destino = User.objects.filter(
                    user_permissions__codename__icontains=grupo_keyword,
                    is_active=True
                ).distinct()

            if not usuarios_destino.exists():
                usuarios_destino = User.objects.filter(is_staff=True, is_active=True)

            codigo_notificacao = f"PETICAO_{grupo_keyword.upper()}"
            tipo_notif, _ = TipoNotificacao.objects.get_or_create(
                codigo=codigo_notificacao,
                defaults={
                    'nome': f"Peticao - {config['nome']}",
                    'descricao': 'Nova peticao recebida via Portal do Cidadao',
                    'enviar_email': True,
                    'enviar_sms': False,
                    'prioridade': 'alta' if config.get('prioridade') == 'URGENTE' else 'normal'
                }
            )

            protocolo_info = ''
            if documento_caixa:
                protocolo_info = f'Protocolo na caixa: {documento_caixa.numero_protocolo}'

            mensagem_partes = [
                'Nova peticao recebida via Portal do Cidadao:',
                '',
                f'Numero: {peticao.numero_peticao}',
                f"Tipo: {config['nome']}",
                f'Advogado: {peticao.peticionario_nome}',
                f"Empresa: {peticao.empresa_nome or 'Nao informada'}",
                f"Assunto: {peticao.assunto or 'Nao informado'}",
                '',
                f"Resumo: {(peticao.descricao or '')[:200]}...",
            ]

            if protocolo_info:
                mensagem_partes.append(protocolo_info)

            mensagem_partes.extend([
                '',
                'Acesse a caixa de entrada responsavel para analisar e tomar as providencias necessarias.',
            ])

            mensagem = '\n'.join(mensagem_partes)
            content_type = ContentType.objects.get_for_model(peticao)

            for usuario in usuarios_destino:
                Notificacao.objects.create(
                    content_type=content_type,
                    object_id=peticao.id,
                    tipo=tipo_notif,
                    destinatario_nome=usuario.get_full_name() or usuario.username,
                    destinatario_email=usuario.email,
                    assunto=f"Nova peticao - {peticao.numero_peticao}",
                    conteudo=mensagem,
                    canal='email',
                    prioridade='alta' if config.get('prioridade') == 'URGENTE' else 'normal'
                )
        except Exception as e:
            print(f"Erro ao notificar destino da peticao: {str(e)}")

def orientacoes_view(request):
    """Pagina de orientacoes"""
    orientacoes = ConteudoPortal.objects.filter(
        tipo='ORIENTACAO', ativo=True
    ).order_by('-data_publicacao')
    
    context = {
        'orientacoes': orientacoes,
    }
    
    return render(request, 'portal_cidadao/orientacoes.html', context)


def detalhe_orientacao(request, slug):
    """Detalhe de uma orientacao"""
    return detalhe_conteudo(request, slug)


def legislacao_view(request):
    """Pagina de legislacao"""
    legislacao = ConteudoPortal.objects.filter(
        tipo='LEGISLACAO', ativo=True
    ).order_by('-data_publicacao')
    
    context = {
        'legislacao': legislacao,
    }
    
    return render(request, 'portal_cidadao/legislacao.html', context)


def detalhe_legislacao(request, slug):
    """Detalhe de legislacao"""
    return detalhe_conteudo(request, slug)


# === NOTICIAS ===

def lista_noticias(request):
    """Lista de noticias"""
    noticias = ConteudoPortal.objects.filter(
        tipo='NOTICIA', ativo=True
    ).order_by('-data_publicacao')
    
    # Paginacao
    paginator = Paginator(noticias, 10)
    page = request.GET.get('page')
    noticias_paginadas = paginator.get_page(page)
    
    context = {
        'noticias': noticias_paginadas,
    }
    
    return render(request, 'portal_cidadao/noticias.html', context)


def detalhe_noticia(request, slug):
    """Detalhe de uma notcia"""
    return detalhe_conteudo(request, slug)


# === AVALIAO ===

def avaliacao_servico(request):
    """Pagina de avaliao de servicos"""
    try:
        config = ConfiguracaoPortal.objects.get()
        if not config.permitir_avaliacao:
            messages.error(request, 'Avaliao de servicos no disponvel no momento.')
            return redirect('portal_cidadao:home')
    except ConfiguracaoPortal.DoesNotExist:
        pass
    
    if request.method == 'POST':
        # Processar avaliao
        tipo_servico = request.POST.get('tipo_servico')
        nota = request.POST.get('nota')
        comentario = request.POST.get('comentario', '')
        sugestao = request.POST.get('sugestao', '')
        nome = request.POST.get('nome', '')
        email = request.POST.get('email', '')
        numero_protocolo = request.POST.get('numero_protocolo', '')
        
        if tipo_servico and nota:
            AvaliacaoServico.objects.create(
                tipo_servico=tipo_servico,
                nota=int(nota),
                comentario=comentario,
                sugestao=sugestao,
                nome=nome,
                email=email,
                numero_protocolo=numero_protocolo,
                ip_origem=request.META.get('REMOTE_ADDR', '')
            )
            
            return redirect('portal_cidadao:avaliacao_sucesso')
        else:
            messages.error(request, 'Tipo de servio e nota so obrigatorios.')
    
    context = {
        'tipos_servico': AvaliacaoServico.TIPO_SERVICO_CHOICES,
    }
    
    return render(request, 'portal_cidadao/avaliacao.html', context)


def avaliacao_sucesso(request):
    """Pagina de sucesso da avaliao"""
    return render(request, 'portal_cidadao/avaliacao_sucesso.html')


# === BUSCA ===

def buscar_conteudo(request):
    """Busca no portal"""
    query = request.GET.get('q', '')
    resultados = []
    
    if query:
        resultados = ConteudoPortal.objects.filter(
            Q(titulo__icontains=query) |
            Q(resumo__icontains=query) |
            Q(conteudo__icontains=query) |
            Q(palavras_chave__icontains=query),
            ativo=True
        ).order_by('-data_publicacao')
    
    # Paginacao
    paginator = Paginator(resultados, 10)
    page = request.GET.get('page')
    resultados_paginados = paginator.get_page(page)
    
    context = {
        'query': query,
        'resultados': resultados_paginados,
    }
    
    return render(request, 'portal_cidadao/busca.html', context)


# === PGINAS ESPECIAIS ===

def mapa_site(request):
    """Mapa do site"""
    categorias = CategoriaConteudo.objects.filter(ativo=True).order_by('ordem')
    
    context = {
        'categorias': categorias,
    }
    
    return render(request, 'portal_cidadao/mapa_site.html', context)


def acessibilidade_view(request):
    """Pagina de acessibilidade"""
    return render(request, 'portal_cidadao/acessibilidade.html')


# === FEEDS E SEO ===

def feed_noticias(request):
    """Feed RSS das noticias"""
    # Implementar feed RSS
    return HttpResponse("Feed RSS em desenvolvimento", content_type="application/rss+xml")


def feed_conteudo(request):
    """Feed RSS do conteudo"""
    # Implementar feed RSS
    return HttpResponse("Feed RSS em desenvolvimento", content_type="application/rss+xml")


def sitemap_xml(request):
    """Sitemap XML"""
    # Implementar sitemap
    return HttpResponse("Sitemap em desenvolvimento", content_type="application/xml")


def robots_txt(request):
    """Arquivo robots.txt"""
    content = """User-agent: *
Allow: /

Sitemap: {}/sitemap.xml
""".format(request.build_absolute_uri('/'))
    
    return HttpResponse(content, content_type="text/plain")


# === API VIEWS ===

class ConsultaPublicaAPIView(APIView):
    """API para consulta publica de protocolos e peties"""

    permission_classes = [AllowAny]

    def post(self, request):
        data = getattr(request, 'data', None) or request.POST
        tipo = str(data.get('tipo_consulta', 'PROTOCOLO') or 'PROTOCOLO').upper()
        numero = (data.get('numero_protocolo') or data.get('numero') or '').strip()
        documento = (data.get('documento') or data.get('documento_consulta') or '').strip()

        if not numero:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Informe o numero do protocolo ou peticao que deseja consultar.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not documento:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Informe o CPF ou CNPJ utilizado no protocolo.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        documento_normalizado = self._normalize_documento(documento)
        if not documento_normalizado:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'CPF/CNPJ informado  invlido.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if tipo == 'PROTOCOLO':
            return self._consultar_protocolo(numero, documento_normalizado, request)

        if tipo == 'PETICAO':
            return self._consultar_peticao(numero, documento_normalizado, request)

        if tipo == 'PROCESSO':
            return self._consultar_processo(numero, documento_normalizado, request)

        if tipo == 'MULTA':
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Consulta publica de multa ainda no est disponvel.'
                },
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        if tipo == 'RECURSO':
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Consulta publica de recurso ainda no est disponvel.'
                },
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        return Response(
            {
                'encontrado': False,
                'detail': 'Tipo de consulta invlido.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def _consultar_protocolo(self, numero, documento_normalizado=None, request=None):
        numero_limpo = numero.strip()
        numero_normalizado = self._normalize_numero(numero)

        base_queryset = ProtocoloDocumento.objects.select_related(
            'setor_atual',
            'setor_origem',
            'responsavel_atual',
            'tipo_documento'
        ).prefetch_related(
            'tramitacoes__setor_destino',
            'tramitacoes__setor_origem'
        )

        protocolo = base_queryset.filter(
            numero_protocolo__iexact=numero_limpo
        ).first()

        if not protocolo and numero_normalizado:
            candidatos = base_queryset.filter(
                numero_protocolo__icontains=numero_normalizado[-6:]
            )[:20]
            for candidato in candidatos:
                if self._normalize_numero(candidato.numero_protocolo) == numero_normalizado:
                    protocolo = candidato
                    break

        if not protocolo:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Protocolo no encontrado.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        documento_registrado = self._normalize_documento(protocolo.remetente_documento)
        if documento_normalizado and documento_registrado and documento_registrado != documento_normalizado:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'CPF/CNPJ informado no est vinculado a este protocolo.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        tramitacoes = [
            {
                'acao': tramitacao.get_acao_display(),
                'setor_origem': tramitacao.setor_origem.nome,
                'setor_destino': tramitacao.setor_destino.nome,
                'observacoes': tramitacao.observacoes or tramitacao.motivo,
                'data': self._format_datetime(tramitacao.data_tramitacao)
            }
            for tramitacao in protocolo.tramitacoes.all().order_by('data_tramitacao')[:20]
        ]

        prazo_restante = None
        try:
            prazo_restante = protocolo.dias_para_vencimento
        except Exception:
            prazo_restante = None

        resultado = {
            'encontrado': True,
            'tipo': 'PROTOCOLO',
            'numero_protocolo': protocolo.numero_protocolo,
            'assunto': protocolo.assunto,
            'descricao': protocolo.descricao,
            'status': protocolo.status,
            'status_display': protocolo.get_status_display(),
            'prioridade': protocolo.prioridade,
            'prioridade_display': protocolo.get_prioridade_display(),
            'origem': protocolo.origem,
            'origem_display': protocolo.get_origem_display(),
            'interessado_nome': protocolo.remetente_nome,
            'interessado_documento': protocolo.remetente_documento,
            'setor_atual': protocolo.setor_atual.nome if protocolo.setor_atual else None,
            'setor_origem': protocolo.setor_origem.nome if protocolo.setor_origem else None,
            'responsavel_atual': self._format_usuario(protocolo.responsavel_atual),
            'prazo_resposta': prazo_restante,
            'data_protocolo': self._format_datetime(protocolo.data_protocolo),
            'uultima_atualizacao': self._format_datetime(protocolo.atualizado_em),
            'tramitacoes': tramitacoes,
        }

        if request is not None:
            self._registrar_consulta('PROTOCOLO', protocolo.numero_protocolo, documento_normalizado or '', resultado, request)
        return Response(resultado, status=status.HTTP_200_OK)

    def _consultar_peticao(self, numero, documento_normalizado, request):
        numero_limpo = numero.strip()
        numero_normalizado = self._normalize_numero(numero)

        base_queryset = PeticaoEletronica.objects.select_related('tipo_peticao')

        peticao = base_queryset.filter(
            numero_peticao__iexact=numero_limpo
        ).first()

        if not peticao and numero_normalizado:
            candidatos = base_queryset.filter(
                numero_peticao__icontains=numero_normalizado[-6:]
            )[:20]
            for candidato in candidatos:
                if self._normalize_numero(candidato.numero_peticao) == numero_normalizado:
                    peticao = candidato
                    break

        if not peticao:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Peticao no encontrada.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        documento_registrado = self._normalize_documento(peticao.peticionario_documento)
        if documento_registrado and documento_registrado != documento_normalizado:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'CPF/CNPJ informado no est vinculado a esta peticao.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        resultado = {
            'encontrado': True,
            'tipo': 'PETICAO',
            'numero_peticao': peticao.numero_peticao,
            'status': peticao.status,
            'status_display': peticao.get_status_display(),
            'prioridade': peticao.prioridade,
            'prioridade_display': peticao.get_prioridade_display(),
            'assunto': peticao.assunto,
            'descricao': peticao.descricao,
            'peticionario_nome': peticao.peticionario_nome,
            'peticionario_email': peticao.peticionario_email,
            'empresa_nome': peticao.empresa_nome,
            'empresa_cnpj': peticao.empresa_cnpj,
            'valor_causa': float(peticao.valor_causa) if peticao.valor_causa is not None else None,
            'data_envio': self._format_datetime(peticao.data_envio or peticao.criado_em),
            'prazo_resposta': self._calcular_prazo_resposta(peticao.prazo_resposta),
            'tramitacoes': [],
        }

        self._registrar_consulta('PETICAO', peticao.numero_peticao, documento_normalizado, resultado, request)
        return Response(resultado, status=status.HTTP_200_OK)

    def _consultar_processo(self, numero, documento_normalizado, request):
        numero_limpo = numero.strip()
        numero_normalizado = self._normalize_numero(numero)

        try:
            from fiscalizacao.models import Processo
        except Exception:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Modulo de processos indisponivel no momento.'
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        processo = Processo.objects.filter(
            numero_processo__iexact=numero_limpo
        ).first()

        if not processo and numero_normalizado:
            candidatos = Processo.objects.filter(
                numero_processo__icontains=numero_normalizado[-6:]
            )[:20]
            for candidato in candidatos:
                if self._normalize_numero(candidato.numero_processo) == numero_normalizado:
                    processo = candidato
                    break

        if not processo:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Processo nao encontrado.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        documento_registrado = self._normalize_documento(processo.cnpj)
        if documento_normalizado and documento_registrado and documento_registrado != documento_normalizado:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'CPF/CNPJ informado nao esta vinculado a este processo.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        protocolo = None
        try:
            protocolo = ProtocoloDocumento.objects.select_related(
                'setor_atual',
                'setor_origem',
                'responsavel_atual',
                'tipo_documento'
            ).prefetch_related(
                'tramitacoes__setor_destino',
                'tramitacoes__setor_origem'
            ).filter(processo_fiscalizacao=processo).first()
        except Exception:
            protocolo = None

        tramitacoes = []
        if protocolo:
            tramitacoes = [
                {
                    'acao': tramitacao.get_acao_display(),
                    'setor_origem': tramitacao.setor_origem.nome,
                    'setor_destino': tramitacao.setor_destino.nome,
                    'observacoes': tramitacao.observacoes or tramitacao.motivo,
                    'data': self._format_datetime(tramitacao.data_tramitacao)
                }
                for tramitacao in protocolo.tramitacoes.all().order_by('data_tramitacao')[:20]
            ]

        resultado = {
            'encontrado': True,
            'tipo': 'PROCESSO',
            'numero_processo': processo.numero_processo,
            'status': processo.status,
            'status_display': processo.get_status_display(),
            'prioridade': processo.prioridade,
            'prioridade_display': processo.get_prioridade_display(),
            'autuado': processo.autuado,
            'cnpj': processo.cnpj,
            'interessado_nome': processo.autuado,
            'interessado_documento': processo.cnpj,
            'assunto': processo.observacoes or f"Processo administrativo {processo.numero_processo}",
            'descricao': processo.observacoes or '',
            'data_protocolo': self._format_datetime(processo.criado_em),
            'data_notificacao': self._format_datetime(processo.data_notificacao),
            'data_defesa': self._format_datetime(processo.data_defesa),
            'data_recurso': self._format_datetime(processo.data_recurso),
            'data_julgamento': self._format_datetime(processo.data_julgamento),
            'data_finalizacao': self._format_datetime(processo.data_finalizacao),
            'valor_multa': float(processo.valor_multa) if processo.valor_multa is not None else None,
            'valor_final': float(processo.valor_final) if processo.valor_final is not None else None,
            'tramitacoes': tramitacoes,
        }

        documentos_disponiveis = []
        if documento_normalizado:
            documentos_disponiveis = self._listar_documentos_processo(
                processo,
                documento_normalizado,
                request
            )
        resultado['documentos_disponiveis'] = documentos_disponiveis
        resultado['documentos_requer_documento'] = not bool(documento_normalizado)

        self._registrar_consulta('PROCESSO', processo.numero_processo, documento_normalizado, resultado, request)
        return Response(resultado, status=status.HTTP_200_OK)

    def _registrar_consulta(self, tipo, numero, documento, dados, request):
        try:
            ConsultaPublica.objects.create(
                tipo_consulta=tipo,
                numero_protocolo=numero,
                documento_consulta=documento,
                dados_encontrados=dados,
                ip_origem=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass

    def _get_client_ip(self, request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')

    def _normalize_numero(self, value):
        return ''.join(ch for ch in str(value or '') if ch.isalnum()).upper()

    def _normalize_documento(self, value):
        texto = ''.join(ch for ch in str(value or '') if ch.isalnum())
        somente_digitos = ''.join(ch for ch in texto if ch.isdigit())
        return somente_digitos if somente_digitos else texto.upper()

    def _normalize_texto(self, value):
        texto = str(value or '')
        texto = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode('ascii')
        return texto.lower().strip()

    def _documento_publico(self, documento):
        tipo = (getattr(documento, 'tipo', '') or '').lower()
        if tipo in {'decisao', 'auto_infracao'}:
            return True

        titulo = self._normalize_texto(getattr(documento, 'titulo', ''))
        if not titulo:
            return False

        if 'auto de infracao' in titulo:
            return True
        if 'auto de constatacao' in titulo:
            return True
        if 'notificacao' in titulo:
            return True
        return False

    def _listar_documentos_processo(self, processo, documento_normalizado, request):
        documentos = []

        try:
            docs_qs = DocumentoProcesso.objects.filter(processo=processo).order_by('-data_upload')
            for doc in docs_qs:
                if not self._documento_publico(doc):
                    continue
                query = urlencode(
                    {
                        'documento_id': doc.id,
                        'documento': documento_normalizado,
                    }
                )
                documentos.append(
                    {
                        'id': doc.id,
                        'origem': 'processo',
                        'tipo': doc.tipo,
                        'tipo_display': doc.get_tipo_display(),
                        'titulo': doc.titulo,
                        'data': self._format_datetime(doc.data_upload),
                        'download_url': request.build_absolute_uri(
                            f"/api/portal/api/documentos/processo/{processo.id}/download/?{query}"
                        ),
                    }
                )
        except Exception:
            pass

        try:
            peticoes = PeticaoEletronica.objects.filter(
                Q(dados_especificos__numero_processo=processo.numero_processo)
                | Q(protocolo_numero__iexact=processo.numero_processo)
            )
            anexos = (
                AnexoPeticao.objects.filter(peticao__in=peticoes, tipo='DECISAO')
                .select_related('peticao')
                .order_by('-data_upload')
            )
            for anexo in anexos:
                query = urlencode(
                    {
                        'documento': documento_normalizado,
                        'numero_processo': processo.numero_processo,
                    }
                )
                documentos.append(
                    {
                        'id': anexo.id,
                        'origem': 'peticao',
                        'tipo': 'decisao',
                        'tipo_display': 'Decisao',
                        'titulo': anexo.titulo,
                        'data': self._format_datetime(anexo.data_upload),
                        'download_url': request.build_absolute_uri(
                            f"/api/portal/api/documentos/peticao/{anexo.id}/download/?{query}"
                        ),
                    }
                )
        except Exception:
            pass

        return documentos

    def _format_datetime(self, value):
        if not value:
            return None
        if isinstance(value, date) and not isinstance(value, datetime):
            return value.isoformat()
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.get_current_timezone())
        return timezone.localtime(value).isoformat()

    def _calcular_prazo_resposta(self, prazo):
        if not prazo:
            return None
        if timezone.is_naive(prazo):
            prazo = timezone.make_aware(prazo, timezone.get_current_timezone())
        delta = prazo - timezone.now()
        return max(delta.days, 0)

    def _format_usuario(self, usuario):
        if not usuario:
            return None
        nome = (usuario.get_full_name() or '').strip()
        return nome or usuario.username



class AcompanhamentoProcessoAPIView(APIView):
    """Consulta rapida de processo/protocolo sem CPF/CNPJ"""

    permission_classes = [AllowAny]

    def get(self, request):
        numero = (request.query_params.get('numero_protocolo') or '').strip()
        if not numero:
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Informe o numero do protocolo a ser consultado.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        consulta_view = ConsultaPublicaAPIView()
        tipo = (
            request.query_params.get('tipo')
            or request.query_params.get('tipo_consulta')
            or ''
        ).strip().upper()
        documento = (
            request.query_params.get('documento')
            or request.query_params.get('documento_consulta')
            or ''
        ).strip()
        documento_normalizado = consulta_view._normalize_documento(documento) if documento else None

        if tipo == 'PROCESSO':
            return consulta_view._consultar_processo(numero, documento_normalizado, request=request)

        resposta = consulta_view._consultar_protocolo(numero, documento_normalizado=None, request=request)
        if getattr(resposta, 'status_code', None) == status.HTTP_404_NOT_FOUND:
            return consulta_view._consultar_processo(numero, documento_normalizado, request=request)
        return resposta


class DocumentoProcessoDownloadAPIView(APIView):
    """Download publico de documentos permitidos do processo (AC/AI/Notificacao/Decisao)"""

    permission_classes = [AllowAny]

    def _validar_documento(self, processo, documento):
        consulta_view = ConsultaPublicaAPIView()
        documento_normalizado = consulta_view._normalize_documento(documento) if documento else None
        documento_registrado = consulta_view._normalize_documento(processo.cnpj)

        if not documento_normalizado:
            return False, None
        if documento_registrado and documento_registrado != documento_normalizado:
            return False, documento_normalizado
        return True, documento_normalizado

    def get(self, request, processo_id):
        documento_id = request.query_params.get('documento_id')
        documento = (request.query_params.get('documento') or '').strip()
        numero_processo = (request.query_params.get('numero_processo') or '').strip()

        if not documento_id:
            return Response(
                {'detail': 'Informe o documento_id para download.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        processo = Processo.objects.filter(id=processo_id).first()
        if not processo and numero_processo:
            processo = _buscar_processo_por_numero(numero_processo)

        if not processo:
            return Response(
                {'detail': 'Processo nao encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        autorizado, documento_normalizado = self._validar_documento(processo, documento)
        if not autorizado:
            return Response(
                {'detail': 'CPF/CNPJ informado nao esta vinculado a este processo.'},
                status=status.HTTP_404_NOT_FOUND
            )

        doc = DocumentoProcesso.objects.filter(id=documento_id, processo=processo).first()
        if not doc:
            return Response(
                {'detail': 'Documento nao encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        consulta_view = ConsultaPublicaAPIView()
        if not consulta_view._documento_publico(doc):
            return Response(
                {'detail': 'Documento nao disponivel para consulta publica.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not doc.arquivo:
            return Response(
                {'detail': 'Arquivo nao localizado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            arquivo = doc.arquivo.open('rb')
        except Exception:
            return Response(
                {'detail': 'Arquivo nao localizado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        filename = os.path.basename(doc.arquivo.name)
        return FileResponse(arquivo, as_attachment=True, filename=filename)


class DocumentoPeticaoDownloadAPIView(APIView):
    """Download publico de decisao juridica vinculada a peticao"""

    permission_classes = [AllowAny]

    def _validar_documento(self, processo, documento):
        consulta_view = ConsultaPublicaAPIView()
        documento_normalizado = consulta_view._normalize_documento(documento) if documento else None
        documento_registrado = consulta_view._normalize_documento(processo.cnpj)

        if not documento_normalizado:
            return False, None
        if documento_registrado and documento_registrado != documento_normalizado:
            return False, documento_normalizado
        return True, documento_normalizado

    def get(self, request, anexo_id):
        documento = (request.query_params.get('documento') or '').strip()
        numero_processo = (request.query_params.get('numero_processo') or '').strip()

        anexo = (
            AnexoPeticao.objects.select_related('peticao')
            .filter(id=anexo_id, tipo='DECISAO')
            .first()
        )
        if not anexo:
            return Response(
                {'detail': 'Documento nao encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        processo = _buscar_processo_por_numero(numero_processo or anexo.peticao.protocolo_numero)
        if not processo:
            return Response(
                {'detail': 'Processo nao encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        autorizado, documento_normalizado = self._validar_documento(processo, documento)
        if not autorizado:
            return Response(
                {'detail': 'CPF/CNPJ informado nao esta vinculado a este processo.'},
                status=status.HTTP_404_NOT_FOUND
            )

        numero_processo_vinculo = (
            anexo.peticao.dados_especificos.get('numero_processo')
            if anexo.peticao and isinstance(anexo.peticao.dados_especificos, dict)
            else ''
        )
        if (
            (anexo.peticao.protocolo_numero or '').strip() != processo.numero_processo
            and (numero_processo_vinculo or '').strip() != processo.numero_processo
        ):
            return Response(
                {'detail': 'Documento nao vinculado ao processo informado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not anexo.arquivo:
            return Response(
                {'detail': 'Arquivo nao localizado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            arquivo = anexo.arquivo.open('rb')
        except Exception:
            return Response(
                {'detail': 'Arquivo nao localizado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        filename = os.path.basename(anexo.arquivo.name)
        return FileResponse(arquivo, as_attachment=True, filename=filename)


class AvaliacaoServicoAPIView(APIView):
    """API para avaliao de servicos"""
    
    def post(self, request):
        # Implementar API de avaliao
        return Response({'status': 'em desenvolvimento'})


class BannerCliqueAPIView(APIView):
    """API para registrar clique em banner"""
    
    def post(self, request, banner_id):
        try:
            banner = BannerPortal.objects.get(id=banner_id)
            banner.incrementar_clique()
            return Response({'status': 'sucesso'})
        except BannerPortal.DoesNotExist:
            return Response({'status': 'erro'}, status=404)


class ConteudoVisualizacaoAPIView(APIView):
    """API para registrar visualizacao de conteudo"""
    
    def post(self, request, conteudo_id):
        try:
            conteudo = ConteudoPortal.objects.get(id=conteudo_id)
            conteudo.incrementar_visualizacao()
            return Response({'status': 'sucesso'})
        except ConteudoPortal.DoesNotExist:
            return Response({'status': 'erro'}, status=404)


class BuscaAPIView(APIView):
    """API para busca"""
    
    def get(self, request):
        # Implementar API de busca
        return Response({'status': 'em desenvolvimento'})


class HistoricoAtividadesAPIView(APIView):
    """API para listar histórico de atividades do usuário"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retorna o histórico de atividades do usuário autenticado"""
        try:
            # Buscar atividades do usuário autenticado
            # Também buscar atividades que foram criadas antes do login usando email/CPF
            user_email = request.user.email if request.user.email else ''
            user_profile = getattr(request.user, 'profile', None)
            user_cpf = ''
            if user_profile and hasattr(user_profile, 'cpf'):
                user_cpf = user_profile.cpf or ''
            
            # Query para buscar atividades do usuário ou com identificador correspondente
            from django.db.models import Q
            query = Q(usuario=request.user)
            
            # Se tiver email ou CPF, buscar também atividades com esses identificadores
            if user_email:
                query |= Q(identificador=user_email)
            if user_cpf:
                query |= Q(identificador=user_cpf)
            
            queryset = HistoricoAtividade.objects.filter(
                query
            ).order_by('-criado_em')
            
            # Atualizar atividades que ainda não estão associadas ao usuário (em todo o queryset)
            atividades_sem_usuario = queryset.filter(usuario__isnull=True)
            if atividades_sem_usuario.exists():
                atividades_sem_usuario.update(usuario=request.user)
            
            atividades = list(queryset[:50])  # Limitar a 50 atividades mais recentes
            
            # Formatar dados para o frontend
            atividades_data = []
            for atividade in atividades:
                atividades_data.append({
                    'id': atividade.id,
                    'tipo': atividade.tipo,
                    'titulo': atividade.titulo,
                    'descricao': atividade.descricao,
                    'numero_protocolo': atividade.numero_protocolo,
                    'data': atividade.criado_em.strftime('%d/%m/%Y %H:%M'),
                    'data_iso': atividade.criado_em.isoformat(),
                })
            
            return Response({
                'success': True,
                'atividades': atividades_data,
                'total': len(atividades_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e),
                'atividades': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# === FUNCIONALIDADES DE PETICIONAMENTO ===

def consultar_peticao(request):
    """Consultar peticao pelo numero ou CPF"""
    peticao = None
    erro = None
    
    if request.method == 'POST':
        numero_peticao = request.POST.get('numero_peticao', '').strip()
        cpf_cnpj = request.POST.get('cpf_cnpj', '').strip()
        
        try:
            if numero_peticao:
                peticao = PeticaoEletronica.objects.get(
                    numero_peticao=numero_peticao,
                    origem='PORTAL_CIDADAO'
                )
            elif cpf_cnpj:
                # Remove formatao do CPF/CNPJ
                cpf_cnpj_limpo = cpf_cnpj.replace('.', '').replace('/', '').replace('-', '')
                peticao = PeticaoEletronica.objects.filter(
                    peticionario_documento__contains=cpf_cnpj_limpo,
                    origem='PORTAL_CIDADAO'
                ).order_by('-criado_em').first()
                
                if not peticao:
                    erro = "Nenhuma peticao encontrada para este CPF/CNPJ"
            else:
                erro = "Informe o numero da peticao ou CPF/CNPJ"
                
        except PeticaoEletronica.DoesNotExist:
            erro = "Peticao no encontrada"
        except Exception as e:
            erro = "Erro na consulta. Tente novamente"
    
    context = {
        'peticao': peticao,
        'erro': erro,
    }
    
    return render(request, 'portal_cidadao/consultar_peticao.html', context)


def react_portal_view(request):
    """Serve o portal React do cidadao"""
    return render(request, 'portal_cidadao/react_portal.html')

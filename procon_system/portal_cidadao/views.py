from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Q
from django.utils import timezone
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib import messages
import json
from datetime import datetime
from django.contrib.contenttypes.models import ContentType

# Importar modelos de peticionamento
from peticionamento.models import PeticaoEletronica, TipoPeticao, AnexoPeticao
from protocolo_tramitacao.models import ProtocoloDocumento, TipoDocumento

from .models import (
    CategoriaConteudo, ConteudoPortal, FormularioPublico, BannerPortal,
    ConsultaPublica, AvaliacaoServico, ConfiguracaoPortal, EstatisticaPortal,
    DenunciaCidadao
)


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
            # Recuperar ou criar tipo de peticao baseado no tipo selecionado
            tipo_peticao_nome = request.POST.get('tipo_peticao')
            tipo_peticao, created = TipoPeticao.objects.get_or_create(
                categoria=tipo_peticao_nome.upper(),
                defaults={
                    'nome': tipo_peticao_nome.title(),
                    'descricao': f'Peticao do tipo {tipo_peticao_nome} via portal do cidadao'
                }
            )
            
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
                
                # Controle
                ip_origem=request.META.get('REMOTE_ADDR')
            )
            
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
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
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
        "slug": "RECURSO_PRIMEIRA_INSTANCIA",
        "nome": "Recurso Administrativo - 1 instncia",
        "descricao": "Recurso contra deciso em primeira instncia, encaminhado ao Jurdico 1.",
        "categoria": "RECURSO",
        "setor_destino": "JURIDICO_1",
        "tipo_caixa": "RECURSO",
        "prioridade": "ALTA",
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


def get_peticao_config_by_slug(slug):
    codigo = (slug or '').upper()
    for item in PETICOES_PORTAL_CONFIG:
        if item['slug'] == codigo:
            return item
    return None


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

    dados = tipo.dados_especificos or {}
    nova_config = {
        'portal_slug': config['slug'],
        'setor_destino': config['setor_destino'],
        'tipo_caixa': config['tipo_caixa'],
        'prioridade': config.get('prioridade', 'NORMAL')
    }
    if dados != {**dados, **nova_config}:
        dados.update(nova_config)
        tipo.dados_especificos = dados
        atualizou = True

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
                tipo_infracao='outros',  # Ser definido pelo fiscal
                
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
            
            return Response({
                'success': True,
                'numero_denuncia': denuncia.numero_denuncia,
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
    
    def _registrar_caixa_entrada(self, peticao, config):
        """Cria registro na caixa de entrada conforme o tipo da peticao"""
        try:
            return CaixaEntrada.objects.create(
                tipo_documento=config.get('tipo_caixa', 'PETICAO'),
                assunto=f"{config['nome']} - {peticao.numero_peticao}"[:200],
                descricao=(peticao.descricao or '')[:1000],
                prioridade=config.get('prioridade', 'NORMAL'),
                remetente_nome=peticao.peticionario_nome,
                remetente_documento=peticao.peticionario_documento,
                remetente_email=peticao.peticionario_email,
                remetente_telefone=peticao.peticionario_telefone,
                empresa_nome=peticao.empresa_nome or '',
                empresa_cnpj=peticao.empresa_cnpj or '',
                setor_destino=config.get('setor_destino', 'JURIDICO_1'),
                setor_lotacao=config.get('setor_destino', 'JURIDICO_1'),
                content_type=ContentType.objects.get_for_model(peticao),
                object_id=peticao.id,
                origem='PORTAL_CIDADAO',
                ip_origem=peticao.ip_origem,
                user_agent=peticao.user_agent,
            )
        except Exception as exc:
            print(f"Erro ao registrar peticao na caixa de entrada: {exc}")
            return None

    def _notificar_destino(self, peticao, config, documento_caixa=None):
        """Notifica o setor responsavel sobre a nova peticao"""
        try:
            setor_destino = (config.get('setor_destino') or '').upper()
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

class TiposPeticaoPortalAPIView(APIView):
    """Retorna os tipos de peticao disponveis para o portal do cidadao"""

    permission_classes = [AllowAny]

    def get(self, request):
        tipos = preparar_tipospeticao_portal()
        return Response({'tipos': tipos})


class PeticaoJuridicaAPIView(APIView):
    """API para peties jurdicas (advogados) - vai para JURDICO"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            from peticionamento.models import PeticaoEletronica, TipoPeticao

            if hasattr(request, 'data') and request.data:
                dados = request.data
            else:
                dados = request.POST

            codigo = (dados.get('tipo_peticao_codigo') or dados.get('tipo_peticao_slug') or '').upper()
            tipo_peticao = None
            config = None

            if codigo:
                config = get_peticao_config_by_slug(codigo)
                if not config:
                    return Response({
                        'success': False,
                        'error': 'Tipo de peticao no reconhecido.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                tipo_peticao = ensure_tipo_peticao(config)
            else:
                tipo_id = dados.get('tipo_peticao_id')
                if not tipo_id:
                    return Response({
                        'success': False,
                        'error': 'Tipo de peticao  obrigatorio.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                tipo_peticao = TipoPeticao.objects.get(id=tipo_id)
                info = tipo_peticao.dados_especificos or {}
                slug = (info.get('portal_slug') or tipo_peticao.nome.upper().replace(' ', '_'))
                config = get_peticao_config_by_slug(slug)
                if not config:
                    return Response({
                        'success': False,
                        'error': 'Tipo de peticao no est habilitado para o portal.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                ensure_tipo_peticao(config)
                codigo = config['slug']

            peticao = PeticaoEletronica.objects.create(
                tipo_peticao=tipo_peticao,
                origem='PORTAL_CIDADAO',
                assunto=dados.get('assunto', ''),
                descricao=dados.get('descricao', ''),
                peticionario_nome=dados.get('nome_completo', ''),
                peticionario_documento=dados.get('cpf_cnpj', ''),
                peticionario_email=dados.get('email', ''),
                peticionario_telefone=dados.get('telefone', ''),
                peticionario_endereco=dados.get('endereco', ''),
                empresa_nome=dados.get('empresa_envolvida', ''),
                empresa_cnpj=dados.get('cnpj_empresa', ''),
                status='ENVIADA',
                prioridade=config.get('prioridade', 'NORMAL'),
                ip_origem=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            peticao.dados_especificos = peticao.dados_especificos or {}
            peticao.dados_especificos['portal_slug'] = codigo
            peticao.save(update_fields=['prioridade', 'dados_especificos'])

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

            return Response({
                'success': True,
                'numero_peticao': peticao.numero_peticao,
                'protocolo_numero': peticao.protocolo_numero,
                'setor_destino': config['setor_destino'],
                'tipo_caixa': config['tipo_caixa'],
                'message': 'Peticao jurdica enviada com sucesso! Ser analisada pelo setor responsavel.'
            }, status=status.HTTP_201_CREATED)

        except TipoPeticao.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Tipo de peticao informado no existe.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _registrar_caixa_entrada(self, peticao, config):
        """Cria registro na caixa de entrada conforme o tipo da peticao"""
        try:
            descricao = peticao.descricao[:1000] if peticao.descricao else ''
            titulo = f"{config['nome']} - {peticao.numero_peticao}"
            prioridade = config.get('prioridade', 'NORMAL')
            tipo_caixa = config.get('tipo_caixa', 'PETICAO')

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
                setor_destino=config['setor_destino'],
                setor_lotacao=config['setor_destino'],
                content_type=ContentType.objects.get_for_model(peticao),
                object_id=peticao.id,
                origem='PORTAL_CIDADAO',
                ip_origem=peticao.ip_origem,
                user_agent=peticao.user_agent
            )
        except Exception as exc:
            print(f"Erro ao registrar peticao na caixa de entrada: {exc}")
            return None

    def _notificar_destino(self, peticao, config, documento_caixa=None):
        """Notifica o setor responsavel sobre a nova peticao"""
        try:
            setor = (config.get('setor_destino') or '').upper()
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
            return Response(
                {
                    'encontrado': False,
                    'detail': 'Consulta publica de processo ainda no est disponvel.'
                },
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

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

    def _format_datetime(self, value):
        if not value:
            return None
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
        return consulta_view._consultar_protocolo(numero, documento_normalizado=None, request=request)



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

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
    """Página inicial do portal"""
    # Banners ativos
    banners = BannerPortal.objects.filter(ativo=True).order_by('ordem')[:5]
    
    # Conteúdo em destaque
    conteudos_destaque = ConteudoPortal.objects.filter(
        destaque=True, ativo=True
    ).order_by('-data_publicacao')[:6]
    
    # Notícias recentes
    noticias = ConteudoPortal.objects.filter(
        tipo='NOTICIA', ativo=True
    ).order_by('-data_publicacao')[:4]
    
    # Formulários em destaque
    formularios = FormularioPublico.objects.filter(
        destaque=True, ativo=True
    ).order_by('ordem')[:4]
    
    # Configurações do portal
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
    """Página sobre o PROCON"""
    try:
        config = ConfiguracaoPortal.objects.get()
    except ConfiguracaoPortal.DoesNotExist:
        config = None
    
    context = {
        'config': config,
    }
    
    return render(request, 'portal_cidadao/sobre.html', context)


def contato_view(request):
    """Página de contato"""
    try:
        config = ConfiguracaoPortal.objects.get()
    except ConfiguracaoPortal.DoesNotExist:
        config = None
    
    context = {
        'config': config,
    }
    
    return render(request, 'portal_cidadao/contato.html', context)


# === CONTEÚDO INFORMATIVO ===

def lista_conteudo(request):
    """Lista todo o conteúdo do portal"""
    conteudos = ConteudoPortal.objects.filter(ativo=True).order_by('-data_publicacao')
    categorias = CategoriaConteudo.objects.filter(ativo=True).order_by('ordem')
    
    # Filtros
    categoria_id = request.GET.get('categoria')
    tipo = request.GET.get('tipo')
    
    if categoria_id:
        conteudos = conteudos.filter(categoria_id=categoria_id)
    
    if tipo:
        conteudos = conteudos.filter(tipo=tipo)
    
    # Paginação
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
    """Conteúdo filtrado por categoria"""
    categoria = get_object_or_404(CategoriaConteudo, id=categoria_id, ativo=True)
    conteudos = ConteudoPortal.objects.filter(
        categoria=categoria, ativo=True
    ).order_by('-data_publicacao')
    
    # Paginação
    paginator = Paginator(conteudos, 12)
    page = request.GET.get('page')
    conteudos_paginados = paginator.get_page(page)
    
    context = {
        'categoria': categoria,
        'conteudos': conteudos_paginados,
    }
    
    return render(request, 'portal_cidadao/categoria_conteudo.html', context)


def detalhe_conteudo(request, slug):
    """Detalhes de um conteúdo específico"""
    conteudo = get_object_or_404(ConteudoPortal, slug=slug, ativo=True)
    
    # Incrementar visualizações
    conteudo.incrementar_visualizacao()
    
    # Conteúdos relacionados
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
    """Página de perguntas frequentes"""
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


# === FORMULÁRIOS ===

def lista_formularios(request):
    """Lista de formulários para download"""
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
    """Download de formulário"""
    formulario = get_object_or_404(FormularioPublico, id=formulario_id, ativo=True)
    
    # Incrementar contador de downloads
    formulario.incrementar_download()
    
    # Redirecionar para o arquivo
    return redirect(formulario.arquivo.url)


# === CONSULTA PÚBLICA ===

def consulta_publica(request):
    """Página de consulta pública"""
    try:
        config = ConfiguracaoPortal.objects.get()
        if not config.permitir_consulta_publica:
            messages.error(request, 'Consulta pública não disponível no momento.')
            return redirect('portal_cidadao:home')
    except ConfiguracaoPortal.DoesNotExist:
        pass
    
    context = {
        'tipos_consulta': ConsultaPublica.TIPO_CONSULTA_CHOICES,
    }
    
    return render(request, 'portal_cidadao/consulta_publica.html', context)


def resultado_consulta(request):
    """Resultado da consulta pública"""
    if request.method != 'POST':
        return redirect('portal_cidadao:consulta_publica')
    
    numero_protocolo = request.POST.get('numero_protocolo')
    documento = request.POST.get('documento')
    tipo_consulta = request.POST.get('tipo_consulta')
    
    if not numero_protocolo or not documento:
        messages.error(request, 'Número do protocolo e documento são obrigatórios.')
        return redirect('portal_cidadao:consulta_publica')
    
    # Aqui você implementaria a lógica de busca nos outros módulos
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


# === PETICIONAMENTO E DENÚNCIAS ===

def nova_peticao_cidadao(request):
    """Nova petição pelo portal do cidadão"""
    if request.method == 'POST':
        try:
            # Recuperar ou criar tipo de petição baseado no tipo selecionado
            tipo_peticao_nome = request.POST.get('tipo_peticao')
            tipo_peticao, created = TipoPeticao.objects.get_or_create(
                categoria=tipo_peticao_nome.upper(),
                defaults={
                    'nome': tipo_peticao_nome.title(),
                    'descricao': f'Petição do tipo {tipo_peticao_nome} via portal do cidadão'
                }
            )
            
            # Criar petição eletrônica
            peticao = PeticaoEletronica.objects.create(
                tipo_peticao=tipo_peticao,
                origem='PORTAL_CIDADAO',
                assunto=request.POST.get('assunto', ''),
                descricao=request.POST.get('descricao', ''),
                
                # Dados do peticionário
                peticionario_nome=request.POST.get('nome_completo', ''),
                peticionario_documento=request.POST.get('cpf_cnpj', ''),
                peticionario_email=request.POST.get('email', ''),
                peticionario_telefone=request.POST.get('telefone', ''),
                peticionario_endereco=request.POST.get('endereco', ''),
                peticionario_cep=request.POST.get('cep', ''),
                
                # Dados da empresa (se aplicável)
                empresa_nome=request.POST.get('empresa_envolvida', ''),
                empresa_cnpj=request.POST.get('cnpj_empresa', ''),
                
                # Dados adicionais
                valor_causa=float(request.POST.get('valor_envolvido', 0)) if request.POST.get('valor_envolvido') else None,
                data_fato=datetime.strptime(request.POST.get('data_ocorrencia'), '%Y-%m-%d').date() if request.POST.get('data_ocorrencia') else None,
                
                # Controle
                ip_origem=request.META.get('REMOTE_ADDR')
            )
            
            messages.success(request, f'Petição enviada com sucesso! Número: {peticao.numero_peticao}')
            return redirect('portal_cidadao:peticao_sucesso', numero_peticao=peticao.numero_peticao)
            
        except Exception as e:
            messages.error(request, f'Erro ao enviar petição: {str(e)}')
    
    tipos_peticao = TipoPeticao.objects.filter(ativo=True).order_by('ordem_exibicao')
    
    context = {
        'tipos_peticao': tipos_peticao,
    }
    
    return render(request, 'portal_cidadao/nova_peticao.html', context)


def peticao_sucesso(request, numero_peticao=None):
    """Página de sucesso após envio de petição"""
    context = {
        'numero_peticao': numero_peticao,
    }
    
    return render(request, 'portal_cidadao/peticao_sucesso.html', context)


def nova_denuncia(request):
    """Nova denúncia"""
    return render(request, 'portal_cidadao/nova_denuncia.html')


def nova_reclamacao(request):
    """Nova reclamação"""
    return render(request, 'portal_cidadao/nova_reclamacao.html')


# === APIs PARA O PORTAL ===

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from fiscalizacao.models import AutoInfracao
from agenda.models import Fiscal
from notificacoes.models import Notificacao, TipoNotificacao
import uuid
from datetime import datetime


class DenunciaCidadaoAPIView(APIView):
    """API para receber denúncias do cidadão - vai direto para FISCALIZAÇÃO"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Extrair dados da denúncia (suportar tanto DRF quanto multipart)
            if hasattr(request, 'data') and request.data:
                dados = request.data
            else:
                dados = request.POST
            
            # Gerar número único da denúncia
            numero_denuncia = self._gerar_numero_denuncia()
            
            # Verificar se é denúncia anônima (converter string para bool)
            denuncia_anonima_raw = dados.get('denuncia_anonima', False)
            if isinstance(denuncia_anonima_raw, str):
                denuncia_anonima = denuncia_anonima_raw.lower() in ['true', '1', 'yes']
            else:
                denuncia_anonima = bool(denuncia_anonima_raw)
            
            # Dados do denunciante (podem ser vazios se anônimo)
            nome_denunciante = dados.get('nome_denunciante', '') if not denuncia_anonima else ''
            cpf_cnpj = dados.get('cpf_cnpj', '') if not denuncia_anonima else ''
            email = dados.get('email', '') if not denuncia_anonima else ''
            telefone = dados.get('telefone', '') if not denuncia_anonima else ''
            
            # Criar denúncia do cidadão
            denuncia = DenunciaCidadao.objects.create(
                empresa_denunciada=dados.get('empresa_denunciada', ''),
                cnpj_empresa=dados.get('cnpj_empresa', ''),
                endereco_empresa=dados.get('endereco_empresa', ''),
                telefone_empresa=dados.get('telefone_empresa', ''),
                email_empresa=dados.get('email_empresa', ''),
                
                # Dados da infração
                descricao_fatos=dados.get('descricao_fatos', ''),
                data_ocorrencia=datetime.strptime(dados.get('data_ocorrencia'), '%Y-%m-%d').date() if dados.get('data_ocorrencia') else None,
                tipo_infracao='outros',  # Será definido pelo fiscal
                
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
                    descricao=f'Anexo da denúncia - {anexo.name}'
                )
            
            # NOTIFICAR FISCAIS
            self._notificar_fiscais(denuncia)
            
            return Response({
                'success': True,
                'numero_denuncia': denuncia.numero_denuncia,
                'message': 'Denúncia recebida com sucesso! Será analisada por nossos fiscais.'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _gerar_numero_denuncia(self):
        """Gera número único da denúncia"""
        from datetime import datetime
        agora = datetime.now()
        ano = agora.year
        
        # Busca última denúncia do ano
        ultima = DenunciaCidadao.objects.filter(
            numero_denuncia__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultima:
            try:
                seq = int(ultima.numero_denuncia.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"DEN-{seq:06d}/{ano}"
    
    def _notificar_fiscais(self, denuncia):
        """Notifica fiscais sobre nova denúncia"""
        try:
            # Buscar fiscais ativos
            fiscais = Fiscal.objects.filter(ativo=True)
            
            # Se não houver fiscais, notificar usuários do grupo fiscalização
            if not fiscais.exists():
                fiscais = User.objects.filter(
                    groups__name__icontains='fiscalizacao',
                    is_active=True
                )
            
            # Se ainda não houver, notificar staff
            if not fiscais.exists():
                fiscais = User.objects.filter(is_staff=True, is_active=True)
            
            # Criar tipo de notificação se não existir
            tipo_notif, created = TipoNotificacao.objects.get_or_create(
                codigo='DENUNCIA_CIDADAO',
                defaults={
                    'nome': 'Denúncia do Cidadão',
                    'descricao': 'Nova denúncia recebida via Portal do Cidadão',
                    'enviar_email': True,
                    'enviar_sms': False,
                    'prioridade': 'alta'
                }
            )
            
            # Criar notificações para cada fiscal
            for fiscal in fiscais:
                Notificacao.objects.create(
                    content_type=ContentType.objects.get_for_model(auto_infracao),
                    object_id=auto_infracao.id,
                    tipo=tipo_notif,
                    destinatario_nome=fiscal.get_full_name() or fiscal.username,
                    destinatario_email=fiscal.email,
                    assunto=f"Nova denúncia - {auto_infracao.numero_auto}",
                    conteudo=f"""
Nova denúncia recebida via Portal do Cidadão:

Empresa: {auto_infracao.razao_social}
CNPJ: {auto_infracao.cnpj}
Denunciante: {auto_infracao.denunciante_nome}
Data da ocorrência: {auto_infracao.data_infracao}

Descrição: {auto_infracao.descricao_infracao[:200]}...

Acesse o sistema para analisar e tomar as providências necessárias.
                    """.strip(),
                    canal='email',
                    prioridade='alta'
                )
            
            print(f"{fiscais.count()} fiscais notificados sobre denúncia {auto_infracao.numero_auto}")
            
        except Exception as e:
            print(f"Erro ao notificar fiscais: {str(e)}")


class PeticaoJuridicaAPIView(APIView):
    """API para petições jurídicas (advogados) - vai para JURÍDICO"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Importar aqui para evitar import circular
            from peticionamento.models import PeticaoEletronica, TipoPeticao
            
            # Extrair dados da petição (suportar tanto DRF quanto multipart)
            if hasattr(request, 'data') and request.data:
                dados = request.data
            else:
                dados = request.POST
            
            # Buscar tipo de petição
            tipo_peticao = TipoPeticao.objects.get(id=dados.get('tipo_peticao_id'))
            
            # Criar petição eletrônica
            peticao = PeticaoEletronica.objects.create(
                tipo_peticao=tipo_peticao,
                origem='PORTAL_CIDADAO',
                assunto=dados.get('assunto', ''),
                descricao=dados.get('descricao', ''),
                
                # Dados do peticionário (advogado)
                peticionario_nome=dados.get('nome_completo', ''),
                peticionario_documento=dados.get('cpf_cnpj', ''),
                peticionario_email=dados.get('email', ''),
                peticionario_telefone=dados.get('telefone', ''),
                peticionario_endereco=dados.get('endereco', ''),
                
                # Dados da empresa
                empresa_nome=dados.get('empresa_envolvida', ''),
                empresa_cnpj=dados.get('cnpj_empresa', ''),
                
                # Status inicial
                status='ENVIADA',
                
                # Metadados
                ip_origem=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
            
            # Processar anexos
            anexos = request.FILES.getlist('documentos')
            for anexo in anexos:
                from peticionamento.models import AnexoPeticao
                AnexoPeticao.objects.create(
                    peticao=peticao,
                    arquivo=anexo,
                    nome_arquivo=anexo.name,
                    tipo_anexo='DOCUMENTO'
                )
            
            # NOTIFICAR SETOR JURÍDICO
            self._notificar_juridico(peticao)
            
            return Response({
                'success': True,
                'numero_peticao': peticao.numero_peticao,
                'protocolo_numero': peticao.protocolo_numero,
                'message': 'Petição jurídica enviada com sucesso! Será analisada pelo setor jurídico.'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _notificar_juridico(self, peticao):
        """Notifica setor jurídico sobre nova petição"""
        try:
            # Buscar usuários do setor jurídico
            usuarios_juridico = User.objects.filter(
                groups__name__icontains='juridico',
                is_active=True
            )
            
            # Se não houver grupo jurídico, buscar por permissões específicas
            if not usuarios_juridico.exists():
                usuarios_juridico = User.objects.filter(
                    user_permissions__codename__icontains='juridico',
                    is_active=True
                )
            
            # Se ainda não houver, notificar coordenadores/gerentes
            if not usuarios_juridico.exists():
                usuarios_juridico = User.objects.filter(
                    is_staff=True,
                    is_active=True
                )
            
            # Criar tipo de notificação se não existir
            tipo_notif, created = TipoNotificacao.objects.get_or_create(
                codigo='PETICAO_JURIDICA',
                defaults={
                    'nome': 'Petição Jurídica',
                    'descricao': 'Nova petição jurídica recebida via Portal do Cidadão',
                    'enviar_email': True,
                    'enviar_sms': False,
                    'prioridade': 'alta'
                }
            )
            
            # Criar notificações para cada usuário do jurídico
            for usuario in usuarios_juridico:
                Notificacao.objects.create(
                    content_type=ContentType.objects.get_for_model(peticao),
                    object_id=peticao.id,
                    tipo=tipo_notif,
                    destinatario_nome=usuario.get_full_name() or usuario.username,
                    destinatario_email=usuario.email,
                    assunto=f"Nova petição jurídica - {peticao.numero_peticao}",
                    conteudo=f"""
Nova petição jurídica recebida via Portal do Cidadão:

Número: {peticao.numero_peticao}
Tipo: {peticao.tipo_peticao.nome}
Advogado: {peticao.peticionario_nome}
Empresa: {peticao.empresa_nome}
Assunto: {peticao.assunto}

Descrição: {peticao.descricao[:200]}...

Acesse o sistema para analisar e dar o devido andamento.
                    """.strip(),
                    canal='email',
                    prioridade='alta'
                )
            
            print(f"{usuarios_juridico.count()} usuários do jurídico notificados sobre petição {peticao.numero_peticao}")
            
        except Exception as e:
            print(f"Erro ao notificar setor jurídico: {str(e)}")


# === ORIENTAÇÕES E LEGISLAÇÃO ===

def orientacoes_view(request):
    """Página de orientações"""
    orientacoes = ConteudoPortal.objects.filter(
        tipo='ORIENTACAO', ativo=True
    ).order_by('-data_publicacao')
    
    context = {
        'orientacoes': orientacoes,
    }
    
    return render(request, 'portal_cidadao/orientacoes.html', context)


def detalhe_orientacao(request, slug):
    """Detalhe de uma orientação"""
    return detalhe_conteudo(request, slug)


def legislacao_view(request):
    """Página de legislação"""
    legislacao = ConteudoPortal.objects.filter(
        tipo='LEGISLACAO', ativo=True
    ).order_by('-data_publicacao')
    
    context = {
        'legislacao': legislacao,
    }
    
    return render(request, 'portal_cidadao/legislacao.html', context)


def detalhe_legislacao(request, slug):
    """Detalhe de legislação"""
    return detalhe_conteudo(request, slug)


# === NOTÍCIAS ===

def lista_noticias(request):
    """Lista de notícias"""
    noticias = ConteudoPortal.objects.filter(
        tipo='NOTICIA', ativo=True
    ).order_by('-data_publicacao')
    
    # Paginação
    paginator = Paginator(noticias, 10)
    page = request.GET.get('page')
    noticias_paginadas = paginator.get_page(page)
    
    context = {
        'noticias': noticias_paginadas,
    }
    
    return render(request, 'portal_cidadao/noticias.html', context)


def detalhe_noticia(request, slug):
    """Detalhe de uma notícia"""
    return detalhe_conteudo(request, slug)


# === AVALIAÇÃO ===

def avaliacao_servico(request):
    """Página de avaliação de serviços"""
    try:
        config = ConfiguracaoPortal.objects.get()
        if not config.permitir_avaliacao:
            messages.error(request, 'Avaliação de serviços não disponível no momento.')
            return redirect('portal_cidadao:home')
    except ConfiguracaoPortal.DoesNotExist:
        pass
    
    if request.method == 'POST':
        # Processar avaliação
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
            messages.error(request, 'Tipo de serviço e nota são obrigatórios.')
    
    context = {
        'tipos_servico': AvaliacaoServico.TIPO_SERVICO_CHOICES,
    }
    
    return render(request, 'portal_cidadao/avaliacao.html', context)


def avaliacao_sucesso(request):
    """Página de sucesso da avaliação"""
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
    
    # Paginação
    paginator = Paginator(resultados, 10)
    page = request.GET.get('page')
    resultados_paginados = paginator.get_page(page)
    
    context = {
        'query': query,
        'resultados': resultados_paginados,
    }
    
    return render(request, 'portal_cidadao/busca.html', context)


# === PÁGINAS ESPECIAIS ===

def mapa_site(request):
    """Mapa do site"""
    categorias = CategoriaConteudo.objects.filter(ativo=True).order_by('ordem')
    
    context = {
        'categorias': categorias,
    }
    
    return render(request, 'portal_cidadao/mapa_site.html', context)


def acessibilidade_view(request):
    """Página de acessibilidade"""
    return render(request, 'portal_cidadao/acessibilidade.html')


# === FEEDS E SEO ===

def feed_noticias(request):
    """Feed RSS das notícias"""
    # Implementar feed RSS
    return HttpResponse("Feed RSS em desenvolvimento", content_type="application/rss+xml")


def feed_conteudo(request):
    """Feed RSS do conteúdo"""
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
    """API para consulta pública"""
    
    def post(self, request):
        # Implementar API de consulta
        return Response({'status': 'em desenvolvimento'})


class AvaliacaoServicoAPIView(APIView):
    """API para avaliação de serviços"""
    
    def post(self, request):
        # Implementar API de avaliação
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
    """API para registrar visualização de conteúdo"""
    
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
    """Consultar petição pelo número ou CPF"""
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
                # Remove formatação do CPF/CNPJ
                cpf_cnpj_limpo = cpf_cnpj.replace('.', '').replace('/', '').replace('-', '')
                peticao = PeticaoEletronica.objects.filter(
                    peticionario_documento__contains=cpf_cnpj_limpo,
                    origem='PORTAL_CIDADAO'
                ).order_by('-criado_em').first()
                
                if not peticao:
                    erro = "Nenhuma petição encontrada para este CPF/CNPJ"
            else:
                erro = "Informe o número da petição ou CPF/CNPJ"
                
        except PeticaoEletronica.DoesNotExist:
            erro = "Petição não encontrada"
        except Exception as e:
            erro = "Erro na consulta. Tente novamente"
    
    context = {
        'peticao': peticao,
        'erro': erro,
    }
    
    return render(request, 'portal_cidadao/consultar_peticao.html', context)


def react_portal_view(request):
    """Serve o portal React do cidadão"""
    return render(request, 'portal_cidadao/react_portal.html')

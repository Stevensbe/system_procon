from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Q
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.core.files.base import ContentFile
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
import hashlib
import os
import re
import unicodedata
import logging

from .models import (
    TipoPeticao, PeticaoEletronica, AnexoPeticao,
    InteracaoPeticao, RespostaPeticao, ConfiguracaoPeticionamento
)
from .services import IntegracaoExternaService
from .serializers import (
    TipoPeticaoSerializer, PeticaoEletronicaListSerializer, PeticaoEletronicaDetailSerializer,
    PeticaoEletronicaCreateSerializer, AnexoPeticaoSerializer, AnexoPeticaoCreateSerializer,
    InteracaoPeticaoSerializer, InteracaoPeticaoCreateSerializer, RespostaPeticaoSerializer,
    RespostaPeticaoCreateSerializer, PeticaoPortalSerializer, ConsultaPeticaoSerializer,
    ValidarDocumentoSerializer, UploadAnexoSerializer, DashboardPeticionamentoSerializer,
    UserSerializer,
    ConfiguracaoPeticionamentoSerializer
)
from caixa_entrada.models import PermissaoSetorCaixaEntrada
from caixa_entrada.services import SETOR_LABELS, _mapear_setor_permissao_nome
from fiscalizacao.models import Processo, DocumentoProcesso, HistoricoProcesso, NotificacaoEletronica


logger = logging.getLogger(__name__)


def _remover_acentos(texto: str) -> str:
    if not texto:
        return ''
    return unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode('ascii')


def _gerar_variantes_setor(valor: str) -> set:
    variantes = set()
    texto = str(valor or '').strip()
    if not texto:
        return variantes

    variantes.add(texto)
    variantes.add(_remover_acentos(texto))

    texto_upper = texto.upper()
    if texto_upper in SETOR_LABELS:
        label = SETOR_LABELS[texto_upper]
        variantes.add(label)
        variantes.add(_remover_acentos(label))

    if '_' in texto:
        variantes.add(texto.replace('_', ' '))
        variantes.add(texto.replace('_', ' ').title())

    return {item for item in variantes if item}


def _normalizar_numero_processo(numero_processo: str) -> str:
    numero = (numero_processo or '').strip()
    if not numero:
        return ''
    return re.sub(r'[^0-9A-Za-z]', '', numero).upper()


def _buscar_processo_por_numero(numero_processo: str):
    numero = (numero_processo or '').strip()
    if not numero:
        return None

    processo = Processo.objects.filter(numero_processo__iexact=numero).first()
    if processo:
        return processo

    numero_normalizado = _normalizar_numero_processo(numero)
    if not numero_normalizado:
        return None

    candidatos = Processo.objects.filter(numero_processo__icontains=numero_normalizado[-6:])[:20]
    for candidato in candidatos:
        if _normalizar_numero_processo(candidato.numero_processo) == numero_normalizado:
            return candidato
    return None


def _obter_numero_processo_peticao(peticao: PeticaoEletronica) -> str:
    if not peticao:
        return ''
    if isinstance(peticao.dados_especificos, dict):
        numero = (peticao.dados_especificos.get('numero_processo') or '').strip()
        if numero:
            return numero
    return (peticao.protocolo_numero or '').strip()


def _parse_decimal(valor):
    if valor in (None, ''):
        return None
    try:
        texto = str(valor).strip().replace(',', '.')
        return Decimal(texto)
    except (InvalidOperation, ValueError, TypeError):
        return None


def _obter_processo_da_peticao(peticao: PeticaoEletronica):
    numero_processo = _obter_numero_processo_peticao(peticao)
    processo = _buscar_processo_por_numero(numero_processo)
    return processo, numero_processo


def _registrar_historico_processo(processo: Processo, status_anterior: str, status_novo: str, observacao: str, usuario: User | None):
    try:
        nome_usuario = ''
        if usuario and getattr(usuario, 'is_authenticated', False):
            nome_usuario = usuario.get_full_name() or usuario.username
        HistoricoProcesso.objects.create(
            processo=processo,
            status_anterior=status_anterior,
            status_novo=status_novo,
            observacao=observacao or '',
            usuario=nome_usuario,
        )
    except Exception:
        logger.exception("Falha ao registrar historico do processo %s", getattr(processo, 'id', None))


def _criar_notificacao_decisao_final(processo: Processo, peticao: PeticaoEletronica, resultado_norm: str, observacao: str | None):
    """Cria notificação pendente quando a decisão encerra o processo."""
    if resultado_norm not in {'improcedente', 'anulatoria_ai'}:
        return None

    destinatario_nome = (
        (peticao.empresa_nome or '').strip()
        or (peticao.peticionario_nome or '').strip()
        or (processo.autuado or '').strip()
        or 'Interessado'
    )
    destinatario_email = (
        (peticao.empresa_email or '').strip()
        or (peticao.peticionario_email or '').strip()
        or None
    )
    destinatario_doc = (
        (peticao.empresa_cnpj or '').strip()
        or (peticao.peticionario_documento or '').strip()
        or (processo.cnpj or '').strip()
    )

    assunto_base = f"Processo {processo.numero_processo}"
    if resultado_norm == 'improcedente':
        assunto = f"{assunto_base} - Decisão improcedente"
        corpo = (
            f"Informamos que o processo {processo.numero_processo} foi julgado improcedente."
            " O processo foi encerrado (arquivamento por improcedência)."
        )
    else:
        assunto = f"{assunto_base} - Decisão anulatória"
        corpo = (
            f"Informamos que o processo {processo.numero_processo} foi encerrado "
            "em razão de decisão anulatória do Auto de Infração."
        )

    observacao_txt = (observacao or '').strip()
    if observacao_txt:
        corpo = f"{corpo}\n\nObservação: {observacao_txt}"

    pendente = NotificacaoEletronica.objects.filter(
        tipo_notificacao='arquivamento',
        processo=processo,
        auto_infracao=processo.auto_infracao,
        status__in=['pendente', 'erro'],
    ).order_by('-id').first()

    if pendente:
        pendente.destinatario_nome = destinatario_nome or pendente.destinatario_nome
        pendente.destinatario_email = destinatario_email or pendente.destinatario_email
        pendente.destinatario_cpf_cnpj = destinatario_doc or pendente.destinatario_cpf_cnpj
        pendente.assunto = assunto
        pendente.mensagem = corpo
        pendente.status = 'pendente'
        pendente.save(
            update_fields=[
                'destinatario_nome',
                'destinatario_email',
                'destinatario_cpf_cnpj',
                'assunto',
                'mensagem',
                'status',
            ]
        )
        return pendente

    return NotificacaoEletronica.objects.create(
        processo=processo,
        auto_infracao=processo.auto_infracao,
        tipo_notificacao='arquivamento',
        destinatario_nome=destinatario_nome,
        destinatario_email=destinatario_email,
        destinatario_cpf_cnpj=destinatario_doc,
        representante_legal='',
        assunto=assunto,
        mensagem=corpo,
        status='pendente',
    )


def _espelhar_documento_juridico_no_processo(anexo: AnexoPeticao, usuario: User | None):
    """Espelha parecer/decisão anexada no Jurídico como DocumentoProcesso."""
    tipo_anexo = (getattr(anexo, 'tipo', '') or '').upper()
    if not anexo or tipo_anexo not in {'DECISAO', 'PARECER'}:
        return None

    numero_processo = _obter_numero_processo_peticao(anexo.peticao)
    processo = _buscar_processo_por_numero(numero_processo)
    if not processo or not anexo.arquivo:
        return None

    tipo_documento = 'decisao' if tipo_anexo == 'DECISAO' else 'parecer'
    prefixo_titulo = 'Decisao' if tipo_documento == 'decisao' else 'Parecer'
    titulo = (anexo.titulo or '').strip() or f"{prefixo_titulo} {processo.numero_processo}"

    arquivo_copia = None
    try:
        anexo.arquivo.open('rb')
        conteudo = anexo.arquivo.read()
        extensao = os.path.splitext(anexo.arquivo.name)[1] or f".{(anexo.extensao or 'docx').lower()}"
        nome_base = processo.numero_processo.replace('/', '_')
        arquivo_copia = ContentFile(conteudo, name=f"{prefixo_titulo}_{nome_base}{extensao}")
    except Exception:
        logger.exception("Falha ao copiar documento juridico %s para o processo %s", anexo.id, processo.id)
        return None
    finally:
        try:
            anexo.arquivo.close()
        except Exception:
            pass

    nome_usuario = ''
    if usuario and getattr(usuario, 'is_authenticated', False):
        nome_usuario = usuario.get_full_name() or usuario.username

    documento, _ = DocumentoProcesso.objects.update_or_create(
        processo=processo,
        tipo=tipo_documento,
        titulo=titulo,
        defaults={
            'descricao': anexo.descricao or f'{prefixo_titulo} juridico anexado na peticao',
            'arquivo': arquivo_copia,
            'usuario_upload': nome_usuario,
        },
    )
    return documento


def _registrar_decisao_no_processo(
    peticao: PeticaoEletronica,
    resultado: str,
    prazo_recurso_dias: int | None,
    observacao: str,
    valor_multa,
    usuario: User | None,
):
    processo, numero_processo = _obter_processo_da_peticao(peticao)
    if not processo:
        return None, numero_processo, 'Processo nao encontrado para a peticao.'

    resultado_norm = (resultado or '').strip().lower()
    dados_especificos = peticao.dados_especificos or {}
    setor_destino = (dados_especificos.get('setor_destino') or '').upper()
    instancia_juridico2 = 'JURIDICO_2' in setor_destino

    if instancia_juridico2:
        # Juridico 2 e instancia recursal: decisao finaliza o processo
        mapeamento_status = {
            'procedente': 'finalizado_procedente',
            'parcial': 'finalizado_procedente',
            'improcedente': 'finalizado_improcedente',
            'anulatoria_ai': 'arquivado',
            'sanar_vicio': 'em_analise',
        }
    else:
        mapeamento_status = {
            'procedente': 'aguardando_recurso',
            'parcial': 'aguardando_recurso',
            'improcedente': 'finalizado_improcedente',
            'anulatoria_ai': 'arquivado',
            'sanar_vicio': 'em_analise',
        }
    status_destino = mapeamento_status.get(resultado_norm)
    if not status_destino:
        return None, numero_processo, 'Resultado de decisao invalido.'

    status_anterior = processo.status
    hoje = timezone.localdate()

    prazo_dias = prazo_recurso_dias if isinstance(prazo_recurso_dias, int) and prazo_recurso_dias > 0 else 15

    if status_destino == 'aguardando_recurso':
        processo.prazo_recurso = hoje + timedelta(days=prazo_dias)
        processo.data_julgamento = hoje
    elif status_destino in {'finalizado_improcedente', 'finalizado_procedente', 'arquivado'}:
        processo.prazo_recurso = None
        processo.data_julgamento = hoje

    valor_multa_decimal = _parse_decimal(valor_multa)
    if valor_multa_decimal is not None:
        processo.valor_multa = valor_multa_decimal
        processo.valor_final = valor_multa_decimal

    if observacao:
        processo.observacoes = (processo.observacoes or '').strip()
        if processo.observacoes:
            processo.observacoes = f"{processo.observacoes}\n\n{observacao.strip()}"
        else:
            processo.observacoes = observacao.strip()

    processo.status = status_destino
    processo.save()

    if status_destino != status_anterior or observacao:
        obs_hist = observacao or f"Decisao registrada ({resultado_norm})."
        _registrar_historico_processo(processo, status_anterior, status_destino, obs_hist, usuario)

    dados = dict(dados_especificos)
    dados.update(
        {
            'decisao_resultado': resultado_norm,
            'decisao_prazo_recurso_dias': prazo_dias if status_destino == 'aguardando_recurso' else None,
            'decisao_data_registro': hoje.isoformat(),
            'decisao_observacao': (observacao or '').strip(),
            'decisao_valor_multa': str(valor_multa_decimal) if valor_multa_decimal is not None else None,
            'decisao_status_processo': status_destino,
            'decisao_instancia': 'juridico_2' if instancia_juridico2 else 'juridico_1',
        }
    )
    peticao.dados_especificos = dados
    peticao.save()

    try:
        _criar_notificacao_decisao_final(processo, peticao, resultado_norm, observacao)
    except Exception:
        logger.exception("Falha ao criar notificacao de decisao final para o processo %s", processo.numero_processo)

    return processo, numero_processo, None


# === VIEWSETS ===

class TipoPeticaoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de petição"""
    queryset = TipoPeticao.objects.all()
    serializer_class = TipoPeticaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'ordem_exibicao']
    ordering = ['ordem_exibicao', 'nome']
    pagination_class = PageNumberPagination

    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Lista apenas tipos ativos"""
        tipos = TipoPeticao.objects.filter(ativo=True).order_by('ordem_exibicao')
        serializer = self.get_serializer(tipos, many=True)
        return Response(serializer.data)


class PeticaoEletronicaViewSet(viewsets.ModelViewSet):
    """ViewSet para petições eletrônicas"""
    queryset = PeticaoEletronica.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'prioridade', 'tipo_peticao', 'origem', 'responsavel_atual']
    search_fields = ['numero_peticao', 'protocolo_numero', 'assunto', 'peticionario_nome', 'empresa_nome']
    ordering_fields = ['criado_em', 'data_envio', 'prazo_resposta', 'assunto']
    ordering = ['-criado_em']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        queryset = PeticaoEletronica.objects.select_related(
            'tipo_peticao', 'usuario_criacao', 'responsavel_atual'
        ).prefetch_related('anexos', 'interacoes')

        setor_destino = self.request.query_params.get('setor_destino') or self.request.query_params.get('setor')
        if setor_destino:
            queryset = queryset.filter(dados_especificos__setor_destino=setor_destino)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return PeticaoEletronicaListSerializer
        elif self.action == 'create':
            return PeticaoEletronicaCreateSerializer
        return PeticaoEletronicaDetailSerializer

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dados do dashboard"""
        # Estatísticas gerais
        total_peticoes = PeticaoEletronica.objects.count()
        peticoes_hoje = PeticaoEletronica.objects.filter(
            criado_em__date=timezone.now().date()
        ).count()
        
        # Petições por status
        peticoes_por_status = list(PeticaoEletronica.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status'))
        
        # Petições com prazo vencido
        peticoes_vencidas = PeticaoEletronica.objects.filter(
            prazo_resposta__lt=timezone.now(),
            status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
        ).count()
        
        # Petições próximas ao vencimento (3 dias)
        limite_vencimento = timezone.now() + timedelta(days=3)
        peticoes_prox_vencimento = PeticaoEletronica.objects.filter(
            prazo_resposta__lte=limite_vencimento,
            prazo_resposta__gte=timezone.now(),
            status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
        ).count()
        
        # Petições por tipo
        peticoes_por_tipo = list(PeticaoEletronica.objects.values(
            'tipo_peticao__nome', 'tipo_peticao__categoria'
        ).annotate(count=Count('id')).order_by('-count')[:10])
        
        # Últimas petições
        ultimas_peticoes = PeticaoEletronica.objects.select_related(
            'tipo_peticao', 'responsavel_atual'
        ).order_by('-criado_em')[:10]
        
        # Petições pendentes de resposta
        peticoes_pendentes = PeticaoEletronica.objects.filter(
            status__in=['RECEBIDA', 'EM_ANALISE']
        ).select_related('tipo_peticao').order_by('prazo_resposta')[:10]
        
        data = {
            'total_peticoes': total_peticoes,
            'peticoes_hoje': peticoes_hoje,
            'peticoes_por_status': peticoes_por_status,
            'peticoes_vencidas': peticoes_vencidas,
            'peticoes_prox_vencimento': peticoes_prox_vencimento,
            'peticoes_por_tipo': peticoes_por_tipo,
            'ultimas_peticoes': PeticaoEletronicaListSerializer(ultimas_peticoes, many=True).data,
            'peticoes_pendentes': PeticaoEletronicaListSerializer(peticoes_pendentes, many=True).data,
        }
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Lista petições com prazo vencido"""
        peticoes = PeticaoEletronica.objects.filter(
            prazo_resposta__lt=timezone.now(),
            status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
        ).select_related('tipo_peticao', 'responsavel_atual')
        
        page = self.paginate_queryset(peticoes)
        if page is not None:
            serializer = PeticaoEletronicaListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PeticaoEletronicaListSerializer(peticoes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """Lista petições pendentes de resposta"""
        peticoes = PeticaoEletronica.objects.filter(
            status__in=['RECEBIDA', 'EM_ANALISE']
        ).select_related('tipo_peticao', 'responsavel_atual').order_by('prazo_resposta')
        
        page = self.paginate_queryset(peticoes)
        if page is not None:
            serializer = PeticaoEletronicaListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PeticaoEletronicaListSerializer(peticoes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def usuarios(self, request):
        """Lista usuários ativos para atribuição"""
        somente_staff = request.query_params.get('staff', 'true').lower() != 'false'
        setor_destino = (
            request.query_params.get('setor_destino')
            or request.query_params.get('setor')
            or ''
        ).strip()
        usuarios = User.objects.filter(is_active=True)
        if somente_staff:
            usuarios = usuarios.filter(is_staff=True)
        if setor_destino:
            variantes = _gerar_variantes_setor(setor_destino)
            q_grupos = Q()
            for variante in variantes:
                q_grupos |= Q(groups__name__icontains=variante)

            usuarios_filtrados = usuarios.filter(q_grupos).distinct()

            if not usuarios_filtrados.exists():
                codigo_permissao = _mapear_setor_permissao_nome(setor_destino)
                if codigo_permissao:
                    permissao = (
                        PermissaoSetorCaixaEntrada.objects
                        .filter(setor=codigo_permissao, ativo=True)
                        .prefetch_related('usuarios')
                        .first()
                    )
                    if permissao:
                        usuarios_filtrados = usuarios.filter(
                            id__in=permissao.usuarios.values_list('id', flat=True)
                        )

            usuarios = usuarios_filtrados

        usuarios = usuarios.order_by('first_name', 'last_name', 'username')
        serializer = UserSerializer(usuarios, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """Envia a petição"""
        peticao = self.get_object()
        if peticao.status == 'RASCUNHO':
            peticao.enviar()
            return Response({'message': 'Petição enviada com sucesso'})
        return Response({'error': 'Petição não pode ser enviada'}, status=400)

    @action(detail=True, methods=['post'])
    def receber(self, request, pk=None):
        """Marca petição como recebida"""
        peticao = self.get_object()
        if peticao.status == 'ENVIADA':
            peticao.receber(request.user)
            return Response({'message': 'Petição recebida com sucesso'})
        return Response({'error': 'Petição não pode ser recebida'}, status=400)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela a petição"""
        peticao = self.get_object()
        if peticao.pode_cancelar():
            peticao.status = 'CANCELADA'
            peticao.save()
            return Response({'message': 'Petição cancelada com sucesso'})
        return Response({'error': 'Petição não pode ser cancelada'}, status=400)

    @action(detail=True, methods=['post'])
    def atribuir(self, request, pk=None):
        """Atribui responsável a uma petição"""
        peticao = self.get_object()
        responsavel_id = request.data.get('responsavel_id') or request.data.get('responsavel_atual')
        responsavel = request.user

        if responsavel_id:
            try:
                responsavel = User.objects.get(id=responsavel_id)
            except User.DoesNotExist:
                return Response({'error': 'Responsável não encontrado'}, status=404)

        status_anterior = peticao.status
        peticao.responsavel_atual = responsavel
        if peticao.status in ['ENVIADA', 'RECEBIDA']:
            peticao.status = 'EM_ANALISE'
        peticao.save()

        InteracaoPeticao.objects.create(
            peticao=peticao,
            tipo_interacao='ALTERACAO_RESPONSAVEL',
            titulo='Responsável atribuído',
            descricao=f'Responsável atribuído para {responsavel.get_full_name() or responsavel.username}',
            status_anterior=status_anterior,
            status_novo=peticao.status,
            usuario=request.user,
            nome_usuario=request.user.get_full_name() or request.user.username,
            ip_origem=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response({
            'message': 'Responsável atribuído com sucesso',
            'responsavel': {
                'id': responsavel.id,
                'nome': responsavel.get_full_name() or responsavel.username,
                'email': responsavel.email
            }
        })

    @action(detail=True, methods=['post'], url_path='notificar-disponibilidade')
    def notificar_disponibilidade(self, request, pk=None):
        """Notifica por email que a decisão está disponível no portal"""
        peticao = self.get_object()
        status_anterior = peticao.status

        possui_decisao = peticao.anexos.filter(tipo='DECISAO').exists()
        if not possui_decisao:
            return Response(
                {'detail': 'Nenhuma decisão anexada para notificar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email_destino = peticao.empresa_email or peticao.peticionario_email
        if not email_destino:
            return Response(
                {'detail': 'Email de destino não informado na petição.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_processo = (
            peticao.dados_especificos.get('numero_processo')
            if isinstance(peticao.dados_especificos, dict)
            else ''
        )
        numero_referencia = (
            numero_processo
            or peticao.protocolo_numero
            or peticao.numero_peticao
        )

        assunto = f"Decisao disponivel - Processo {numero_referencia}"
        mensagem = (
            "A decisao do processo esta disponivel para download no Portal do Cidadao. "
            "Para acessar, utilize o numero do processo e o CPF/CNPJ do autuado."
        )

        integracao = IntegracaoExternaService()
        resultado = integracao.enviar_notificacao_email(email_destino, assunto, mensagem)

        if not resultado.get('sucesso'):
            return Response(
                {'detail': resultado.get('erro', 'Falha ao enviar notificacao.')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if peticao.status != 'RESPONDIDA':
            peticao.status = 'RESPONDIDA'
            peticao.save()

        InteracaoPeticao.objects.create(
            peticao=peticao,
            tipo_interacao='ALTERACAO_STATUS',
            titulo='Notificacao de decisao enviada',
            descricao=f'Notificacao enviada para {email_destino}',
            status_anterior=status_anterior,
            status_novo=peticao.status,
            usuario=request.user,
            nome_usuario=request.user.get_full_name() or request.user.username,
            ip_origem=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response(
            {
                'success': True,
                'email': email_destino,
                'mensagem': 'Notificacao enviada com sucesso.',
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='registrar-decisao')
    def registrar_decisao(self, request, pk=None):
        """Registra o resultado da decisao e atualiza o Processo vinculado."""
        peticao = self.get_object()

        possui_decisao = peticao.anexos.filter(tipo='DECISAO').exists()
        if not possui_decisao:
            return Response(
                {'detail': 'Anexe a decisao antes de registrar o resultado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resultado = (request.data.get('resultado') or '').strip().lower()
        if not resultado:
            return Response(
                {'detail': 'Informe o resultado da decisao.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        prazo_recurso_dias = request.data.get('prazo_recurso_dias')
        try:
            prazo_recurso_dias = int(prazo_recurso_dias) if prazo_recurso_dias not in (None, '') else None
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Prazo de recurso invalido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observacao = (request.data.get('observacao') or '').strip()
        valor_multa = request.data.get('valor_multa')

        processo, numero_processo, erro = _registrar_decisao_no_processo(
            peticao=peticao,
            resultado=resultado,
            prazo_recurso_dias=prazo_recurso_dias,
            observacao=observacao,
            valor_multa=valor_multa,
            usuario=request.user,
        )
        if erro or not processo:
            return Response(
                {'detail': erro or 'Falha ao atualizar o processo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        InteracaoPeticao.objects.create(
            peticao=peticao,
            tipo_interacao='ALTERACAO_STATUS',
            titulo='Decisao registrada',
            descricao=f'Resultado: {resultado}. Processo {numero_processo}.',
            status_anterior=peticao.status,
            status_novo=peticao.status,
            usuario=request.user,
            nome_usuario=request.user.get_full_name() or request.user.username,
            ip_origem=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response(
            {
                'success': True,
                'numero_processo': processo.numero_processo,
                'status_processo': processo.status,
                'status_processo_display': processo.get_status_display(),
                'prazo_recurso': processo.prazo_recurso.isoformat() if processo.prazo_recurso else None,
                'valor_multa': str(processo.valor_multa) if processo.valor_multa is not None else None,
            },
            status=status.HTTP_200_OK
        )


class AnexoPeticaoViewSet(viewsets.ModelViewSet):
    """ViewSet para anexos de petição"""
    queryset = AnexoPeticao.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['peticao', 'tipo']
    search_fields = ['nome_arquivo', 'descricao']
    ordering_fields = ['uploaded_em', 'nome_arquivo']
    ordering = ['-uploaded_em']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return AnexoPeticao.objects.select_related('peticao', 'uploaded_por')

    def get_serializer_class(self):
        if self.action == 'create':
            return AnexoPeticaoCreateSerializer
        return AnexoPeticaoSerializer

    def perform_create(self, serializer):
        anexo = serializer.save()
        try:
            _espelhar_documento_juridico_no_processo(anexo, self.request.user)
        except Exception:
            logger.exception("Erro ao espelhar documento juridico %s no processo", getattr(anexo, 'id', None))


class InteracaoPeticaoViewSet(viewsets.ModelViewSet):
    """ViewSet para interações de petição"""
    queryset = InteracaoPeticao.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['peticao', 'tipo_interacao', 'usuario']
    search_fields = ['titulo', 'descricao']
    ordering_fields = ['data_interacao', 'titulo']
    ordering = ['-data_interacao']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return InteracaoPeticao.objects.select_related('peticao', 'usuario')

    def get_serializer_class(self):
        if self.action == 'create':
            return InteracaoPeticaoCreateSerializer
        return InteracaoPeticaoSerializer


class RespostaPeticaoViewSet(viewsets.ModelViewSet):
    """ViewSet para respostas de petição"""
    queryset = RespostaPeticao.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['peticao', 'tipo_resposta', 'responsavel']
    search_fields = ['titulo', 'conteudo']
    ordering_fields = ['data_elaboracao', 'data_envio']
    ordering = ['-data_elaboracao']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return RespostaPeticao.objects.select_related('peticao', 'responsavel')

    def get_serializer_class(self):
        if self.action == 'create':
            return RespostaPeticaoCreateSerializer
        return RespostaPeticaoSerializer

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """Envia a resposta"""
        resposta = self.get_object()
        resposta.enviar()
        return Response({'message': 'Resposta enviada com sucesso'})


class ConfiguracaoPeticionamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações"""
    queryset = ConfiguracaoPeticionamento.objects.all()
    serializer_class = ConfiguracaoPeticionamentoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination


# === API VIEWS ===

class PortalPeticaoAPIView(APIView):
    """API para petições do portal do cidadão"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Cria nova petição do portal"""
        serializer = PeticaoPortalSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            peticao = serializer.save()
            return Response({
                'message': 'Petição criada com sucesso',
                'numero_peticao': peticao.numero_peticao,
                'uuid': peticao.uuid
            }, status=201)
        return Response(serializer.errors, status=400)


class ConsultaPeticaoAPIView(APIView):
    """API para consulta de petições"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Consulta petição por dados do peticionário"""
        serializer = ConsultaPeticaoSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Busca petição
            peticao = None
            if data.get('numero_peticao'):
                peticao = PeticaoEletronica.objects.filter(
                    numero_peticao=data['numero_peticao']
                ).first()
            elif data.get('protocolo_numero'):
                peticao = PeticaoEletronica.objects.filter(
                    protocolo_numero=data['protocolo_numero']
                ).first()
            elif data.get('peticionario_documento'):
                peticao = PeticaoEletronica.objects.filter(
                    peticionario_documento=data['peticionario_documento']
                ).first()
            elif data.get('peticionario_email'):
                peticao = PeticaoEletronica.objects.filter(
                    peticionario_email=data['peticionario_email']
                ).first()
            
            if peticao:
                serializer = PeticaoEletronicaDetailSerializer(peticao)
                return Response(serializer.data)
            else:
                return Response({'error': 'Petição não encontrada'}, status=404)
        
        return Response(serializer.errors, status=400)


class ValidarDocumentoAPIView(APIView):
    """API para validação de documentos"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Valida formato de documento"""
        serializer = ValidarDocumentoSerializer(data=request.data)
        if serializer.is_valid():
            documento = serializer.validated_data['documento']
            tipo = serializer.validated_data['tipo']
            
            # Aqui você pode adicionar validação mais robusta (algoritmo de validação)
            return Response({
                'documento': documento,
                'tipo': tipo,
                'valido': True,
                'formatado': self._formatar_documento(documento, tipo)
            })
        
        return Response(serializer.errors, status=400)
    
    def _formatar_documento(self, documento, tipo):
        """Formata documento para exibição"""
        if tipo == 'CPF':
            return f"{documento[:3]}.{documento[3:6]}.{documento[6:9]}-{documento[9:]}"
        elif tipo == 'CNPJ':
            return f"{documento[:2]}.{documento[2:5]}.{documento[5:8]}/{documento[8:12]}-{documento[12:]}"
        return documento


class UploadAnexoAPIView(APIView):
    """API para upload de anexos"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Faz upload de anexo"""
        serializer = UploadAnexoSerializer(data=request.data)
        if serializer.is_valid():
            arquivo = serializer.validated_data['arquivo']
            tipo_anexo = serializer.validated_data['tipo']
            descricao = serializer.validated_data.get('descricao', '')
            
            # Gera hash do arquivo
            hash_arquivo = self._gerar_hash_arquivo(arquivo)
            
            # Salva anexo
            anexo = AnexoPeticao.objects.create(
                peticao_id=request.data.get('peticao_id'),
                arquivo=arquivo,
                nome_arquivo=arquivo.name,
                tipo_anexo=tipo_anexo,
                descricao=descricao,
                tipo_mime=arquivo.content_type,
                tamanho_bytes=arquivo.size,
                hash_arquivo=hash_arquivo
            )
            
            return Response({
                'message': 'Anexo enviado com sucesso',
                'anexo_id': anexo.id,
                'nome_arquivo': anexo.nome_arquivo,
                'tamanho_formatado': anexo.tamanho_formatado
            }, status=201)
        
        return Response(serializer.errors, status=400)
    
    def _gerar_hash_arquivo(self, arquivo):
        """Gera hash SHA-256 do arquivo"""
        hash_sha256 = hashlib.sha256()
        for chunk in arquivo.chunks():
            hash_sha256.update(chunk)
        return hash_sha256.hexdigest()


# === VIEWS DE TEMPLATE ===

@login_required
def dashboard_view(request):
    """Dashboard principal do módulo de peticionamento"""
    
    # Estatísticas gerais
    total_peticoes = PeticaoEletronica.objects.count()
    peticoes_hoje = PeticaoEletronica.objects.filter(
        criado_em__date=timezone.now().date()
    ).count()
    
    # Petições por status
    peticoes_por_status = PeticaoEletronica.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Petições com prazo vencido
    peticoes_vencidas = PeticaoEletronica.objects.filter(
        prazo_resposta__lt=timezone.now(),
        status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
    ).count()
    
    # Petições próximas ao vencimento (3 dias)
    limite_vencimento = timezone.now() + timedelta(days=3)
    peticoes_prox_vencimento = PeticaoEletronica.objects.filter(
        prazo_resposta__lte=limite_vencimento,
        prazo_resposta__gte=timezone.now(),
        status__in=['ENVIADA', 'RECEBIDA', 'EM_ANALISE']
    ).count()
    
    # Petições por tipo
    peticoes_por_tipo = PeticaoEletronica.objects.values(
        'tipo_peticao__nome', 'tipo_peticao__categoria'
    ).annotate(count=Count('id')).order_by('-count')[:10]
    
    # Últimas petições
    ultimas_peticoes = PeticaoEletronica.objects.select_related(
        'tipo_peticao', 'responsavel_atual'
    ).order_by('-criado_em')[:10]
    
    # Petições pendentes de resposta
    peticoes_pendentes = PeticaoEletronica.objects.filter(
        status__in=['RECEBIDA', 'EM_ANALISE']
    ).select_related('tipo_peticao').order_by('prazo_resposta')[:10]
    
    context = {
        'total_peticoes': total_peticoes,
        'peticoes_hoje': peticoes_hoje,
        'peticoes_por_status': peticoes_por_status,
        'peticoes_vencidas': peticoes_vencidas,
        'peticoes_prox_vencimento': peticoes_prox_vencimento,
        'peticoes_por_tipo': peticoes_por_tipo,
        'ultimas_peticoes': ultimas_peticoes,
        'peticoes_pendentes': peticoes_pendentes,
    }
    
    return render(request, 'peticionamento/dashboard.html', context)


def portal_cidadao(request):
    """Portal do cidadão para peticionamento"""
    tipos_peticao = TipoPeticao.objects.filter(ativo=True).order_by('ordem_exibicao')
    
    context = {
        'tipos_peticao': tipos_peticao,
    }
    
    return render(request, 'peticionamento/portal/home.html', context)


def nova_peticao(request):
    """Formulário para nova petição"""
    if request.method == 'POST':
        # Lógica para salvar nova petição
        pass
    
    tipos_peticao = TipoPeticao.objects.filter(ativo=True).order_by('ordem_exibicao')
    
    context = {
        'tipos_peticao': tipos_peticao,
    }
    
    return render(request, 'peticionamento/nova_peticao.html', context)


@login_required
def lista_peticoes(request):
    """Lista de petições"""
    peticoes = PeticaoEletronica.objects.select_related(
        'tipo_peticao', 'responsavel_atual'
    ).order_by('-criado_em')
    
    # Filtros
    status_filter = request.GET.get('status')
    if status_filter:
        peticoes = peticoes.filter(status=status_filter)
    
    tipo_filter = request.GET.get('tipo')
    if tipo_filter:
        peticoes = peticoes.filter(tipo_peticao_id=tipo_filter)
    
    # Paginação
    paginator = Paginator(peticoes, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'tipos_peticao': TipoPeticao.objects.filter(ativo=True),
    }
    
    return render(request, 'peticionamento/lista_peticoes.html', context)


@login_required
def detalhe_peticao(request, pk):
    """Detalhes de uma petição"""
    peticao = get_object_or_404(PeticaoEletronica, pk=pk)
    
    context = {
        'peticao': peticao,
    }
    
    return render(request, 'peticionamento/detalhe_peticao.html', context)

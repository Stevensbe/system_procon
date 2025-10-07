from __future__ import annotations

from datetime import timedelta
from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from protocolo_tramitacao.models import (
    ProtocoloDocumento,
    TipoDocumento,
    Setor,
    TramitacaoDocumento,
)
from .models import PermissaoSetorCaixaEntrada

# Importar sistema de logging estruturado
import logging_config
from logging_config import logger_manager, LoggedOperation, log_execution_time



SETOR_LABELS = {
    'FISCALIZACAO_DENUNCIAS': 'Fiscalizacao - Denuncias',
    'FISCALIZACAO_PROPRIO': 'Fiscalizacao - Setor Proprio',
    'JURIDICO_1': 'Juridico 1 - Peticoes',
    'JURIDICO_2_RECURSOS': 'Juridico 2 - Recursos',
    'DAF': 'Diretoria Administrativa Financeira',
    'ATENDIMENTO': 'Atendimento/Protocolo',
    'FISCALIZACAO': 'Fiscalizacao',
    'COBRANCA': 'Cobranca',
    'GERAL': 'Acesso Geral',
}

ORIGEM_MAP = {
    'PORTAL_CIDADAO': 'EXTERNO',
    'PORTAL': 'EXTERNO',
    'PETICIONAMENTO': 'PETICIONAMENTO',
    'FISCALIZACAO': 'FISCALIZACAO',
    'MULTAS': 'INTERNO',
    'INTERNO': 'INTERNO',
    'DTE': 'DIGITAL',
}

PRIORIDADE_MAP = {
    'BAIXA': 'BAIXA',
    'NORMAL': 'NORMAL',
    'ALTA': 'ALTA',
    'URGENTE': 'URGENTE',
}


STATUS_FROM_ACAO = {
    'PROTOCOLADO': 'PROTOCOLADO',
    'ENCAMINHADO': 'EM_TRAMITACAO',
    'RECEBIDO': 'EM_ANALISE',
    'EM_ANALISE': 'EM_ANALISE',
    'SOLICITACAO_INFO': 'EM_TRAMITACAO',
    'PARECER_EMITIDO': 'AGUARDANDO_DECISAO',
    'DECISAO_TOMADA': 'DECIDIDO',
    'DEVOLVIDO': 'EM_TRAMITACAO',
    'ARQUIVADO': 'ARQUIVADO',
    'CANCELADO': 'CANCELADO',
}


ROTEAMENTO_TIPO = {
    'DENUNCIA': 'Fiscalizacao',
    'RECLAMACAO': 'Atendimento',
    'PETICAO': 'Juridico 1',
    'RECURSO': 'Juridico 2',
    'AUTO_INFRACAO': 'Fiscalizacao',
    'MULTA': 'Cobranca',
    'PROTOCOLO': 'Atendimento',
    'DOCUMENTO_INTERNO': 'Administrativo',
    'SOLICITACAO': 'Atendimento',
    'OUTROS': 'Administrativo',
}

ROTAS_PRIORIDADE = {
    'URGENTE': 'Diretoria',
    # ALTA não força diretoria - respeita setor manual se definido
}

SETOR_PERMISSAO_MAP = {
    'ATENDIMENTO': 'ATENDIMENTO',
    'ATENDIMENTO/PROTOCOLO': 'ATENDIMENTO',
    'PROTOCOLO': 'ATENDIMENTO',
    'FISCALIZACAO': 'FISCALIZACAO',
    'FISCALIZACAO - DENUNCIAS': 'FISCALIZACAO',
    'JURIDICO': 'JURIDICO',
    'JURIDICO 1': 'JURIDICO',
    'JURIDICO 2': 'JURIDICO',
    'DIRETORIA': 'DIRETORIA',
    'FINANCEIRO': 'FINANCEIRO',
    'COBRANCA': 'COBRANCA',
    'ADMINISTRATIVO': 'ADMINISTRATIVO',
    'GERAL': 'GERAL',
}


def _mapear_setor_permissao_nome(nome: Optional[str]) -> Optional[str]:
    if not nome:
        return None
    chave = nome.upper().strip()
    if chave in SETOR_PERMISSAO_MAP:
        return SETOR_PERMISSAO_MAP[chave]
    chave_normalizada = chave.replace(' - ', ' ')
    return SETOR_PERMISSAO_MAP.get(chave_normalizada)


def _escolher_responsavel_para_setor(nome_setor: Optional[str]):
    codigo = _mapear_setor_permissao_nome(nome_setor)
    if not codigo:
        return None
    try:
        permissao = (
            PermissaoSetorCaixaEntrada.objects
            .filter(setor=codigo, ativo=True)
            .prefetch_related('usuarios')
            .first()
        )
    except Exception:
        return None
    if not permissao:
        return None
    return permissao.usuarios.filter(is_active=True).order_by('id').first()


@log_execution_time('roteamento_automatico')
def aplicar_roteamento_automatico(documento) -> bool:
    """Define setor destino e responsavel com base nas regras de roteamento."""
    logger = logger_manager.get_logger('caixa_entrada')
    
    with LoggedOperation('roteamento_automatico', {
        'documento_id': getattr(documento, 'id', None),
        'tipo_documento': getattr(documento, 'tipo_documento', None),
        'prioridade_inicial': getattr(documento, 'prioridade', None),
        'setor_inicial': getattr(documento, 'setor_destino', None),
    }):
        changed = False
        tipo = (getattr(documento, 'tipo_documento', '') or 'OUTROS').upper()
        prioridade = (getattr(documento, 'prioridade', '') or 'NORMAL').upper()
        setor_atual = (getattr(documento, 'setor_destino', '') or '').strip()

        setor_prioridade = ROTAS_PRIORIDADE.get(prioridade)
        routing_decisions = []
        
        if setor_prioridade:
            setor_atual_lower = setor_atual.lower()
            setor_prioridade_lower = setor_prioridade.lower()
            # URGENTE sempre força Diretoria, ALTA só se não há setor definido
            prioridade_override = prioridade == 'URGENTE' or (prioridade == 'ALTA' and not setor_atual)
            if prioridade_override:
                if setor_atual_lower != setor_prioridade_lower:
                    documento.setor_destino = setor_prioridade
                    setor_atual = setor_prioridade
                    changed = True
                    routing_decisions.append(f'Prioridade {prioridade} -> {setor_prioridade}')

        if not setor_atual:
            setor_tipo = ROTEAMENTO_TIPO.get(tipo)
            if setor_tipo:
                documento.setor_destino = setor_tipo
                setor_atual = setor_tipo
                changed = True
                routing_decisions.append(f'Tipo {tipo} -> {setor_tipo}')

        if not getattr(documento, 'prioridade', None):
            documento.prioridade = 'NORMAL'
            changed = True
            routing_decisions.append('Prioridade definida como NORMAL')

        responsavel = _escolher_responsavel_para_setor(setor_atual)
        if responsavel:
            if getattr(documento, 'responsavel_atual_id', None) != responsavel.id:
                documento.responsavel_atual = responsavel
                changed = True
                routing_decisions.append(f'Responsável definido: {responsavel.username}')
            if getattr(documento, 'destinatario_direto_id', None) != responsavel.id:
                documento.destinatario_direto = responsavel
                changed = True
        
        # Log das decisões de roteamento
        logger.log_operation('roteamento_aplicado', {
            'routing_decisions': routing_decisions,
            'setor_final': documento.setor_destino,
            'responsavel_final': responsavel.username if responsavel else None,
            'changes_made': changed,
        })

        return changed


def _slug_sigla(valor: str) -> str:
    base = ''.join(ch for ch in valor.upper() if ch.isalnum())
    if not base:
        base = 'SETOR'
    return base[:10]


def _titulo_setor(valor: str) -> str:
    valor = (valor or 'Geral').strip()
    if not valor:
        valor = 'Geral'
    chave = valor.upper().replace(' ', '_')
    if chave in SETOR_LABELS:
        return SETOR_LABELS[chave]
    return valor.replace('_', ' ').title()


def _obter_setor(codigo: Optional[str]) -> Setor:
    codigo = (codigo or 'GERAL').strip()
    chave = codigo.upper().replace(' ', '_')
    nome = _titulo_setor(chave)
    sigla = _slug_sigla(chave)
    setor, _ = Setor.objects.get_or_create(
        sigla=sigla,
        defaults={
            'nome': nome,
            'pode_protocolar': True,
            'pode_tramitar': True,
            'ativo': True,
        },
    )
    if setor.nome != nome:
        setor.nome = nome
        setor.save(update_fields=['nome'])
    return setor


def _obter_tipo(tipo_codigo: Optional[str]) -> TipoDocumento:
    nome = (tipo_codigo or 'Documento Geral').strip() or 'Documento Geral'
    tipo, _ = TipoDocumento.objects.get_or_create(
        nome=nome,
        defaults={
            'descricao': f'Documento integrado a partir da Caixa de Entrada ({nome})',
            'prazo_resposta_dias': 30,
            'ativo': True,
        },
    )
    return tipo


def _mapear_origem(origem: Optional[str]) -> str:
    if not origem:
        return 'INTERNO'
    chave = origem.upper()
    return ORIGEM_MAP.get(chave, 'INTERNO')


def _mapear_prioridade(prioridade: Optional[str]) -> str:
    if not prioridade:
        return 'NORMAL'
    chave = prioridade.upper()
    return PRIORIDADE_MAP.get(chave, 'NORMAL')


def _obter_usuario_padrao(usuario_hint=None):
    UserModel = get_user_model()
    if usuario_hint:
        return usuario_hint
    
    # Tentar encontrar usuários existentes primeiro
    candidatos = [
        UserModel.objects.filter(is_superuser=True).first(),
        UserModel.objects.filter(is_staff=True).first(),
        UserModel.objects.filter(is_active=True).first(),
        UserModel.objects.first(),
    ]
    for candidato in candidatos:
        if candidato:
            return candidato
    
    # Se não existir nenhum usuário, criar um padrão para sincronização
    usuario_padrao = UserModel.objects.create_user(
        username='usuario_sincronizacao',
        email='sincronizacao@procon.local',
        password='senha_temporaria_123',
        first_name='Usuário',
        last_name='Sincronização',
        is_staff=True,
        is_active=True
    )
    return usuario_padrao


@transaction.atomic
def sincronizar_protocolo_caixa(
    documento,
    *,
    usuario=None,
    acao: Optional[str] = 'PROTOCOLADO',
    setor_origem: Optional[str] = None,
    setor_destino: Optional[str] = None,
    motivo: Optional[str] = None,
    observacoes: Optional[str] = None,
    recebido_por=None,
    data_recebimento=None,
    atualizar_status: bool = True,
):
    """Garante que o documento esteja associado a um protocolo e registra a tramitacao."""
    if documento is None:
        return None

    setor_destino_valor = setor_destino or getattr(documento, 'setor_destino', None)
    setor_origem_valor = setor_origem or getattr(documento, 'setor_destino', None) or setor_destino_valor

    setor_destino_obj = _obter_setor(setor_destino_valor)
    setor_origem_obj = _obter_setor(setor_origem_valor)

    usuario_exec = usuario or getattr(documento, 'responsavel_atual', None) or getattr(documento, 'destinatario_direto', None)
    try:
        usuario_exec = _obter_usuario_padrao(usuario_exec)
    except ValueError:
        usuario_exec = None

    protocolo = getattr(documento, 'protocolo', None)
    status_desejado = STATUS_FROM_ACAO.get(acao) if acao else None

    if protocolo is None:
        tipo = _obter_tipo(getattr(documento, 'tipo_documento', None))
        origem = _mapear_origem(getattr(documento, 'origem', None))
        prioridade = _mapear_prioridade(getattr(documento, 'prioridade', None))
        prazo = getattr(documento, 'prazo_resposta', None) or (
            timezone.now() + timedelta(days=tipo.prazo_resposta_dias or 30)
        )

        numero_protocolo = getattr(documento, 'numero_protocolo', None)
        existente = None
        if numero_protocolo:
            existente = ProtocoloDocumento.objects.filter(numero_protocolo=numero_protocolo).first()

        if existente:
            protocolo = existente
        else:
            protocolado_por = usuario_exec or get_user_model().objects.filter(is_superuser=True).first() or get_user_model().objects.first()
            if protocolado_por is None:
                raise ValueError('Nao ha usuarios cadastrados para registrar o protocolo')

            status_inicial = status_desejado or 'PROTOCOLADO'
            protocolo = ProtocoloDocumento.objects.create(
                numero_protocolo=numero_protocolo or None,
                tipo_documento=tipo,
                origem=origem,
                assunto=getattr(documento, 'assunto', '') or 'Documento da Caixa de Entrada',
                descricao=getattr(documento, 'descricao', '') or '',
                status=status_inicial,
                prioridade=prioridade,
                remetente_nome=getattr(documento, 'remetente_nome', '') or 'Nao informado',
                remetente_documento=getattr(documento, 'remetente_documento', '') or '',
                remetente_email=getattr(documento, 'remetente_email', '') or '',
                remetente_telefone=getattr(documento, 'remetente_telefone', '') or '',
                setor_atual=setor_destino_obj,
                setor_origem=setor_origem_obj,
                prazo_resposta=prazo,
                data_protocolo=getattr(documento, 'data_entrada', None) or timezone.now(),
                protocolado_por=protocolado_por,
                responsavel_atual=getattr(documento, 'responsavel_atual', None),
                observacoes=(getattr(documento, 'descricao', '') or '')[:500],
            )

        documento.protocolo = protocolo
        documento.save(update_fields=['protocolo'])

        if not TramitacaoDocumento.objects.filter(protocolo=protocolo, acao='PROTOCOLADO').exists():
            TramitacaoDocumento.objects.create(
                protocolo=protocolo,
                acao='PROTOCOLADO',
                setor_origem=setor_origem_obj,
                setor_destino=setor_destino_obj,
                motivo='Documento protocolado via Caixa de Entrada',
                observacoes=observacoes or getattr(documento, 'descricao', '') or '',
                usuario=usuario_exec or protocolo.protocolado_por,
            )

    campos_para_salvar = set()
    if protocolo.setor_atual != setor_destino_obj:
        protocolo.setor_atual = setor_destino_obj
        campos_para_salvar.add('setor_atual')
    responsavel_atual = getattr(documento, 'responsavel_atual', None)
    if responsavel_atual and protocolo.responsavel_atual != responsavel_atual:
        protocolo.responsavel_atual = responsavel_atual
        campos_para_salvar.add('responsavel_atual')

    if acao:
        criar = True
        if acao == 'PROTOCOLADO' and TramitacaoDocumento.objects.filter(protocolo=protocolo, acao='PROTOCOLADO').exists():
            criar = False
        if criar:
            tramitacao_kwargs = {
                'protocolo': protocolo,
                'acao': acao,
                'setor_origem': setor_origem_obj,
                'setor_destino': setor_destino_obj,
                'motivo': motivo or f"{acao.title()} via Caixa de Entrada",
                'observacoes': observacoes or getattr(documento, 'descricao', '') or '',
                'usuario': usuario_exec or protocolo.protocolado_por,
            }
            if acao == 'RECEBIDO':
                tramitacao_kwargs['data_recebimento'] = data_recebimento or timezone.now()
                tramitacao_kwargs['recebido_por'] = recebido_por or usuario_exec or protocolo.protocolado_por
            TramitacaoDocumento.objects.create(**tramitacao_kwargs)

    if status_desejado and atualizar_status and protocolo.status != status_desejado:
        protocolo.status = status_desejado
        campos_para_salvar.add('status')
        if status_desejado in {'ARQUIVADO', 'CANCELADO', 'DECIDIDO'}:
            protocolo.data_conclusao = timezone.now()
            campos_para_salvar.add('data_conclusao')
    elif protocolo.status == 'PROTOCOLADO' and atualizar_status and acao and acao != 'PROTOCOLADO':
        protocolo.status = 'EM_TRAMITACAO'
        campos_para_salvar.add('status')

    if campos_para_salvar:
        protocolo.save(update_fields=list(campos_para_salvar))

    return protocolo











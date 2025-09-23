import pytest
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone

from caixa_entrada.models import CaixaEntrada, PermissaoSetorCaixaEntrada
from protocolo_tramitacao.models import TramitacaoDocumento
from caixa_entrada.services import sincronizar_protocolo_caixa


@pytest.mark.django_db
def test_fluxo_tramitacao_caixa_cria_e_atualiza_protocolo():
    user = get_user_model().objects.create_user(
        username='analista',
        email='analista@example.com',
        password='senha-segura'
    )

    documento = CaixaEntrada.objects.create(
        tipo_documento='PETICAO',
        assunto='Documento de Teste',
        descricao='Descri\u00e7\u00e3o do documento gerado em teste.',
        prioridade='NORMAL',
        remetente_nome='Fulano de Tal',
        remetente_documento='00000000000',
        setor_destino='Juridico 1',
        responsavel_atual=user,
    )

    documento.refresh_from_db()
    protocolo = documento.protocolo
    assert protocolo is not None
    assert protocolo.status == 'PROTOCOLADO'
    tramitacoes = TramitacaoDocumento.objects.filter(protocolo=protocolo, acao='PROTOCOLADO')
    assert tramitacoes.count() == 1

    setor_destino = 'Financeiro'
    nova_versao = documento.encaminhar_para_setor(
        setor_destino=setor_destino,
        responsavel=user,
        observacoes='Encaminhamento de teste'
    )

    sincronizar_protocolo_caixa(
        nova_versao,
        usuario=user,
        acao='ENCAMINHADO',
        setor_origem=documento.setor_destino,
        setor_destino=setor_destino,
        observacoes='Encaminhamento de teste',
    )

    protocolo.refresh_from_db()
    assert protocolo.status == 'EM_TRAMITACAO'
    assert setor_destino.upper().replace(' ', '_') in protocolo.setor_atual.nome.upper()
    assert TramitacaoDocumento.objects.filter(protocolo=protocolo, acao='ENCAMINHADO').count() == 1

    sincronizar_protocolo_caixa(
        nova_versao,
        usuario=user,
        acao='RECEBIDO',
        setor_origem=setor_destino,
        setor_destino=setor_destino,
        observacoes='Recebido para an\u00e1lise',
        recebido_por=user,
    )

    protocolo.refresh_from_db()
    recebidos = TramitacaoDocumento.objects.filter(protocolo=protocolo, acao='RECEBIDO')
    assert recebidos.count() == 1
    recebimento = recebidos.first()
    assert recebimento.data_recebimento is not None
    assert recebimento.recebido_por == user
    assert protocolo.status == 'EM_ANALISE'

    sincronizar_protocolo_caixa(
        nova_versao,
        usuario=user,
        acao='ARQUIVADO',
        setor_origem=setor_destino,
        setor_destino=setor_destino,
        motivo='Fluxo conclu\u00eddo',
        observacoes='Encerrado no teste',
    )

    protocolo.refresh_from_db()
    assert protocolo.status == 'ARQUIVADO'
    assert protocolo.data_conclusao is not None
    assert TramitacaoDocumento.objects.filter(protocolo=protocolo, acao='ARQUIVADO').count() == 1



@pytest.mark.django_db
def test_roteamento_automatico_por_tipo():
    prazo = timezone.now() + timedelta(days=5)

    documento = CaixaEntrada.objects.create(
        tipo_documento='DENUNCIA',
        assunto='Denuncia automatica',
        descricao='Documento criado para testar roteamento automatico por tipo.',
        prioridade='NORMAL',
        remetente_nome='Cidadao Teste',
        setor_destino='',
        prazo_resposta=prazo,
    )

    documento.refresh_from_db()
    assert documento.setor_destino == 'Fiscalizacao'


@pytest.mark.django_db
def test_roteamento_prioridade_urgente_define_responsavel():
    User = get_user_model()
    gestor = User.objects.create_user(
        username='diretoria_user',
        email='diretoria@example.com',
        password='senha-diretoria'
    )

    permissao = PermissaoSetorCaixaEntrada.objects.create(
        setor='DIRETORIA',
        pode_visualizar=True,
        pode_encaminhar=True,
    )
    permissao.usuarios.add(gestor)

    prazo = timezone.now() + timedelta(days=2)
    documento = CaixaEntrada.objects.create(
        tipo_documento='PETICAO',
        assunto='Urgente para diretoria',
        descricao='Documento criado para testar roteamento por prioridade.',
        prioridade='URGENTE',
        remetente_nome='Fulano Prioridade',
        setor_destino='Atendimento',
        prazo_resposta=prazo,
    )

    documento.refresh_from_db()
    assert documento.setor_destino == 'Diretoria'
    assert documento.responsavel_atual == gestor
    assert documento.destinatario_direto == gestor


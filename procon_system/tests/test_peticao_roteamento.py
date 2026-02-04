import pytest
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from portal_cidadao.views import PeticaoJuridicaAPIView
from peticionamento.models import PeticaoEletronica, TipoPeticao
from protocolo_tramitacao.models import ProtocoloDocumento, Setor, TipoDocumento


@pytest.mark.django_db
def test_peticao_rota_para_setor_do_processo():
    User = get_user_model()
    usuario = User.objects.create_user(
        username='autor_peticao',
        email='autor@example.com',
        password='senha-teste'
    )
    responsavel = User.objects.create_user(
        username='responsavel_setor',
        email='responsavel@example.com',
        password='senha-teste'
    )

    tipo_peticao = TipoPeticao.objects.create(
        nome='Defesa Previa',
        categoria='DEFESA'
    )

    setor = Setor.objects.create(
        nome='Juridico 1 - Peticoes',
        sigla='JUR1',
        responsavel=responsavel
    )

    tipo_doc = TipoDocumento.objects.create(
        nome='Auto de Infracao',
        prazo_resposta_dias=10
    )

    protocolo = ProtocoloDocumento.objects.create(
        numero_protocolo='PROC-123',
        tipo_documento=tipo_doc,
        origem='FISCALIZACAO',
        assunto='Auto de Infracao',
        descricao='Descricao do protocolo',
        status='PROTOCOLADO',
        prioridade='NORMAL',
        remetente_nome='Empresa Teste',
        remetente_documento='00000000000',
        setor_atual=setor,
        setor_origem=setor,
        prazo_resposta=timezone.now() + timedelta(days=5),
        protocolado_por=usuario,
        responsavel_atual=responsavel,
    )

    peticao = PeticaoEletronica.objects.create(
        tipo_peticao=tipo_peticao,
        assunto='Defesa',
        descricao='Descricao detalhada para peticao de teste.',
        peticionario_nome='Advogado',
        peticionario_documento='11111111111',
        peticionario_email='advogado@example.com',
        peticionario_telefone='999999999',
        usuario_criacao=usuario,
        protocolo_numero=protocolo.numero_protocolo,
        status='ENVIADA',
    )

    view = PeticaoJuridicaAPIView()
    documento = view._registrar_caixa_entrada(
        peticao,
        {
            'nome': 'Defesa Previa',
            'tipo_caixa': 'PETICAO',
            'prioridade': 'NORMAL',
            'setor_destino': 'JURIDICO_1',
        },
    )

    assert documento.setor_destino == setor.nome
    assert documento.destinatario_direto == responsavel
    assert documento.protocolo == protocolo


@pytest.mark.django_db
def test_peticao_sem_processo_cai_em_triagem():
    User = get_user_model()
    usuario = User.objects.create_user(
        username='autor_peticao_2',
        email='autor2@example.com',
        password='senha-teste'
    )

    tipo_peticao = TipoPeticao.objects.create(
        nome='Pedido de Vista',
        categoria='SOLICITACAO'
    )

    peticao = PeticaoEletronica.objects.create(
        tipo_peticao=tipo_peticao,
        assunto='Pedido',
        descricao='Descricao detalhada para peticao sem processo.',
        peticionario_nome='Solicitante',
        peticionario_documento='22222222222',
        peticionario_email='solicitante@example.com',
        peticionario_telefone='999999999',
        usuario_criacao=usuario,
        protocolo_numero='PROC-NAO-EXISTE',
        status='ENVIADA',
    )

    view = PeticaoJuridicaAPIView()
    documento = view._registrar_caixa_entrada(
        peticao,
        {
            'nome': 'Pedido de Vista',
            'tipo_caixa': 'SOLICITACAO',
            'prioridade': 'NORMAL',
            'setor_destino': 'JURIDICO_1',
        },
    )

    assert documento.setor_destino == 'Atendimento/Protocolo'
    assert documento.descricao.startswith('[TRIAGEM]')

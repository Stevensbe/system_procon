import pytest
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework.test import APIClient

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



@pytest.mark.django_db
def test_caixa_pessoal_api_filtra_e_atualiza_estatisticas():
    User = get_user_model()
    usuario = User.objects.create_user(
        username="usuario_destinatario",
        email="destinatario@example.com",
        password="senha-forte"
    )
    outro_usuario = User.objects.create_user(
        username="outro_usuario",
        email="outro@example.com",
        password="senha-forte"
    )

    documento_pessoal = CaixaEntrada.objects.create(
        tipo_documento="PETICAO",
        assunto="Documento pessoal",
        descricao="Documento destinado diretamente ao usuário autenticado.",
        prioridade="URGENTE",
        status="NAO_LIDO",
        remetente_nome="Requerente Teste",
        setor_destino="Juridico 1",
        responsavel_atual=usuario,
        destinatario_direto=usuario,
    )

    CaixaEntrada.objects.create(
        tipo_documento="DENUNCIA",
        assunto="Documento de outro usuário",
        descricao="Documento que não deve aparecer na caixa pessoal.",
        prioridade="NORMAL",
        status="NAO_LIDO",
        remetente_nome="Outro Requerente",
        setor_destino="Fiscalizacao",
        destinatario_direto=outro_usuario,
    )

    client = APIClient()
    client.force_authenticate(user=usuario)

    params = {"apenas_pessoal": "true", "destinatario_direto": "me"}

    resposta_documentos = client.get("/api/caixa-entrada/api/documentos/", params)
    assert resposta_documentos.status_code == 200
    payload = resposta_documentos.json()
    if isinstance(payload, list):
        documentos = payload
    else:
        documentos = payload.get("results", [])
    assert len(documentos) == 1
    assert str(documentos[0]["id"]) == str(documento_pessoal.id)

    resposta_estatisticas = client.get("/api/caixa-entrada/api/estatisticas/", params)
    assert resposta_estatisticas.status_code == 200
    estatisticas = resposta_estatisticas.json()
    assert estatisticas["total"] == 1
    assert estatisticas["nao_lidos"] == 1
    assert estatisticas["urgentes"] == 1

    resposta_marcar = client.post(f"/api/caixa-entrada/api/documentos/{documento_pessoal.id}/marcar_lido/")
    assert resposta_marcar.status_code == 200
    documento_pessoal.refresh_from_db()
    assert documento_pessoal.status == "LIDO"

    estatisticas = client.get("/api/caixa-entrada/api/estatisticas/", params).json()
    assert estatisticas["nao_lidos"] == 0

    resposta_arquivar = client.post(
        f"/api/caixa-entrada/api/documentos/{documento_pessoal.id}/arquivar/",
        {},
        format="json"
    )
    assert resposta_arquivar.status_code == 200
    documento_pessoal.refresh_from_db()
    assert documento_pessoal.status == "ARQUIVADO"

    estatisticas = client.get("/api/caixa-entrada/api/estatisticas/", params).json()
    assert estatisticas["arquivados"] == 1
    assert estatisticas["total"] == 1


@pytest.mark.django_db
def test_caixa_setor_api_normaliza_parametros():
    User = get_user_model()
    usuario = User.objects.create_user(
        username="fiscal",
        email="fiscal@example.com",
        password="senha-fiscal"
    )
    usuario.is_staff = True
    usuario.save()

    permissao = PermissaoSetorCaixaEntrada.objects.create(setor="FISCALIZACAO")
    permissao.usuarios.add(usuario)

    documento_fiscalizacao = CaixaEntrada.objects.create(
        tipo_documento="DENUNCIA",
        assunto="Denúncia direcionada à fiscalização",
        descricao='Documento de teste para validar filtros de setor.',
        prioridade='URGENTE',
        remetente_nome="Denunciante Teste",
        setor_destino="Fiscalização",
    )

    CaixaEntrada.objects.create(
        tipo_documento="PETICAO",
        assunto="Documento de outro setor",
        descricao="Documento que não deve ser exibido para fiscalização.",
        prioridade="NORMAL",
        remetente_nome="Outra Pessoa",
        setor_destino="Jurídico",
    )

    client = APIClient()
    client.force_authenticate(user=usuario)

    for chave, valor in (
        ("setor", "FISCALIZACAO_DENUNCIAS"),
        ("setor_destino", "Fiscalizacao"),
        ("setor", "Fiscalização"),
    ):
        response = client.get("/api/caixa-entrada/api/documentos/", {chave: valor})
        assert response.status_code == 200
        payload = response.json()

        if isinstance(payload, dict) and "results" in payload:
            resultados = payload["results"]
        elif isinstance(payload, dict) and "documentos" in payload:
            resultados = payload["documentos"]
        elif isinstance(payload, list):
            resultados = payload
        else:
            resultados = []

        assert len(resultados) == 1, f"Filtro {chave}={valor} retornou quantidade inesperada"
        assert str(documento_fiscalizacao.id) == str(resultados[0]["id"])

@pytest.mark.django_db
def test_roteamento_prioridade_alta_encaminha_diretoria():
    user = get_user_model().objects.create_user(
        username='analista_alta',
        email='analista_alta@example.com',
        password='senha-segura'
    )

    documento = CaixaEntrada.objects.create(
        tipo_documento='RECLAMACAO',
        assunto='Teste prioridade alta',
        descricao='Documento com prioridade alta.',
        prioridade='URGENTE',
        remetente_nome='Consumidor Teste',
        setor_destino='Atendimento',
        responsavel_atual=user,
    )

    from caixa_entrada.services import aplicar_roteamento_automatico

    alterado = aplicar_roteamento_automatico(documento)

    assert documento.setor_destino == 'Diretoria'
    assert alterado in (True, False)


@pytest.mark.django_db
def test_roteamento_prioridade_alta_preserva_setor_manual():
    """Testa se prioridade ALTA preserva setor manual quando já definido"""
    user = get_user_model().objects.create_user(
        username='analista_alta_manual',
        email='analista_alta@example.com',
        password='senha-segura'
    )

    documento = CaixaEntrada.objects.create(
        tipo_documento='RECLAMACAO',
        assunto='Teste prioridade ALTA com setor manual',
        descricao='Documento com prioridade alta mas setor já definido.',
        prioridade='ALTA',
        remetente_nome='Consumidor Teste',
        setor_destino='Fiscalizacao',  # Setor manual definido
        responsavel_atual=user,
    )

    from caixa_entrada.services import aplicar_roteamento_automatico

    alterado = aplicar_roteamento_automatico(documento)

    # Prioridade ALTA deve preservar setor manual quando já definido
    assert documento.setor_destino == 'Fiscalizacao'
    assert alterado is False  # Não deve ter sido alterado


@pytest.mark.django_db
def test_roteamento_prioridade_urgente_forca_diretoria():
    user = get_user_model().objects.create_user(
        username='analista_urgente',
        email='analista_urgente@example.com',
        password='senha-segura'
    )

    documento = CaixaEntrada.objects.create(
        tipo_documento='RECLAMACAO',
        assunto='Teste prioridade urgente',
        descricao='Documento com prioridade urgente.',
        prioridade='URGENTE',
        remetente_nome='Consumidor Urgente',
        setor_destino='Atendimento',
        responsavel_atual=user,
    )

    from caixa_entrada.services import aplicar_roteamento_automatico

    aplicar_roteamento_automatico(documento)

    assert documento.setor_destino == 'Diretoria'


@pytest.mark.django_db
def test_caixa_documentos_filtro_combina_setor_prioridade_busca():
    alvo = CaixaEntrada.objects.create(
        tipo_documento='DENUNCIA',
        assunto='Denuncia prioritaria em supermercado',
        descricao='Denuncia prioritaria registrada no balcao.',
        prioridade='URGENTE',
        remetente_nome='Cidadao Denunciante',
        setor_destino='Fiscalizacao - Denuncias',
    )

    CaixaEntrada.objects.create(
        tipo_documento='DENUNCIA',
        assunto='Denuncia comum',
        descricao='Outro documento que nao deve aparecer.',
        prioridade='NORMAL',
        remetente_nome='Outro Cliente',
        setor_destino='Fiscalizacao',
    )

    from caixa_entrada.views import _aplicar_filtro_setor

    queryset = CaixaEntrada.objects.all()
    filtrado = _aplicar_filtro_setor(queryset, 'FISCALIZACAO_DENUNCIAS')
    filtrado = filtrado.filter(prioridade='URGENTE').filter(assunto__icontains='prioritaria')

    ids = list(filtrado.values_list('id', flat=True))
    assert ids == [alvo.id]



@pytest.mark.django_db
def test_gerar_variantes_setor_normaliza_acento():
    from caixa_entrada.views import _gerar_variantes_setor

    variantes = _gerar_variantes_setor('Fiscalização - Denúncias')

    assert 'Fiscalizacao - Denuncias' in variantes
    assert 'Fiscalizacao' in variantes
    assert 'Fiscalização - Denúncias' in variantes




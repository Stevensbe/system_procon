from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Setor, TipoDocumento
from .notifications import Notificacao
from .services.workflow_service import workflow_service


class WorkflowNotificationTests(TestCase):
    def setUp(self):
        User = get_user_model()

        self.actor = User.objects.create_user(
            username="actor",
            email="actor@example.com",
            password="pass123",
            is_staff=True,
        )
        self.origin_responsavel = User.objects.create_user(
            username="origin",
            email="origin@example.com",
            password="pass123",
        )
        self.dest_responsavel = User.objects.create_user(
            username="dest",
            email="dest@example.com",
            password="pass123",
        )

        self.tipo_documento = TipoDocumento.objects.create(
            nome="Memorando",
            descricao="Documento de teste",
            prazo_resposta_dias=5,
        )

        self.setor_origem = Setor.objects.create(
            nome="Setor Origem",
            sigla="ORIG",
            responsavel=self.origin_responsavel,
        )
        self.setor_destino = Setor.objects.create(
            nome="Setor Destino",
            sigla="DEST",
            responsavel=self.dest_responsavel,
        )

    def _protocolar(self, *, setor_destino=None, setor_origem=None):
        setor_destino = setor_destino or self.setor_origem
        setor_origem = setor_origem or self.setor_origem
        with patch(
            "protocolo_tramitacao.services.workflow_service._criar_documento_caixa",
            return_value=None,
        ):
            protocolo = workflow_service.protocolar(
                tipo_documento=self.tipo_documento,
                origem="INTERNO",
                assunto="Processo teste",
                descricao="Descricao de teste",
                remetente_nome="Fulano",
                remetente_documento="12345678900",
                remetente_email="fulano@example.com",
                remetente_telefone="929999999",
                setor_destino=setor_destino,
                usuario=self.actor,
                prioridade="NORMAL",
                sigiloso=False,
                observacoes="",
                setor_origem=setor_origem,
            )
        return protocolo

    def test_protocolar_notifica_responsavel_do_setor(self):
        protocolo = self._protocolar(setor_destino=self.setor_origem)

        notificacoes = Notificacao.objects.filter(
            objeto_id=protocolo.id,
            titulo__icontains="protocolado",
        )
        self.assertTrue(notificacoes.exists(), "Esperava notificação de protocolo.")
        destinatarios = {notif.usuario_id for notif in notificacoes}
        self.assertIn(self.origin_responsavel.id, destinatarios)

    def test_tramitar_notifica_responsavel_do_destino(self):
        protocolo = self._protocolar(setor_destino=self.setor_origem)
        Notificacao.objects.all().delete()

        with patch(
            "protocolo_tramitacao.services.workflow_service._encaminhar_documento_caixa",
            return_value=None,
        ):
            tramitacao = workflow_service.tramitar(
                protocolo=protocolo,
                setor_destino=self.setor_destino,
                motivo="Encaminhado para análise",
                usuario=self.actor,
                observacoes="",
            )

        notificacoes = Notificacao.objects.filter(
            objeto_id=protocolo.id,
            titulo__icontains="encaminhado",
        )
        self.assertTrue(notificacoes.exists(), "Deveria ter uma notificação de encaminhamento.")
        destinatarios = {notif.usuario_id for notif in notificacoes}
        self.assertIn(self.dest_responsavel.id, destinatarios)
        # Responsável atual atualizado para o destino
        protocolo.refresh_from_db()
        self.assertEqual(protocolo.responsavel_atual, self.dest_responsavel)

    def test_receber_notifica_origem_e_protocolador(self):
        protocolo = self._protocolar(setor_destino=self.setor_origem)
        with patch(
            "protocolo_tramitacao.services.workflow_service._encaminhar_documento_caixa",
            return_value=None,
        ):
            tramitacao = workflow_service.tramitar(
                protocolo=protocolo,
                setor_destino=self.setor_destino,
                motivo="Encaminhado para análise",
                usuario=self.actor,
                observacoes="",
            )
        Notificacao.objects.all().delete()

        with patch(
            "protocolo_tramitacao.services.workflow_service._marcar_documento_recebido",
            return_value=None,
        ):
            workflow_service.receber(
                tramitacao,
                usuario=self.dest_responsavel,
                observacoes="",
            )

        notificacoes = Notificacao.objects.filter(
            objeto_id=protocolo.id,
            titulo__icontains="recebido",
        )
        self.assertTrue(notificacoes.exists(), "Deveria ter uma notificação de recebimento.")
        destinatarios = {notif.usuario_id for notif in notificacoes}
        self.assertIn(self.origin_responsavel.id, destinatarios)
        self.assertIn(self.actor.id, destinatarios)

    def test_finalizar_notifica_protocolador(self):
        protocolo = self._protocolar(setor_destino=self.setor_origem)
        with patch(
            "protocolo_tramitacao.services.workflow_service._encaminhar_documento_caixa",
            return_value=None,
        ):
            tramitacao = workflow_service.tramitar(
                protocolo=protocolo,
                setor_destino=self.setor_destino,
                motivo="Encaminhado para análise",
                usuario=self.actor,
                observacoes="",
            )
        with patch(
            "protocolo_tramitacao.services.workflow_service._marcar_documento_recebido",
            return_value=None,
        ):
            workflow_service.receber(
                tramitacao,
                usuario=self.dest_responsavel,
                observacoes="",
            )
        Notificacao.objects.all().delete()

        with patch(
            "protocolo_tramitacao.services.workflow_service._arquivar_documentos_da_caixa",
            return_value=None,
        ):
            workflow_service.finalizar(
                protocolo,
                usuario=self.dest_responsavel,
                observacoes="Conclusão registrada",
            )

        notificacoes = Notificacao.objects.filter(
            objeto_id=protocolo.id,
            titulo__icontains="finalizado",
        )
        self.assertTrue(notificacoes.exists(), "Deveria ter uma notificação de finalização.")
        destinatarios = {notif.usuario_id for notif in notificacoes}
        self.assertIn(self.actor.id, destinatarios)

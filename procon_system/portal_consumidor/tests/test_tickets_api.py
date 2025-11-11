from django.contrib.auth import get_user_model
from django.utils import timezone
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from portal_consumidor.models import TicketSuporteConsumidor, NotificacaoConsumidor

User = get_user_model()


@override_settings(PORTAL_API_KEY="portal-test-key")
class TicketSuporteConsumidorTests(APITestCase):
    def setUp(self):
        self.client.defaults["HTTP_X_PORTAL_API_KEY"] = "portal-test-key"

    def test_criar_ticket_consumidor(self):
        url = reverse("portal_consumidor:tickets-list")
        payload = {
            "consumidor_email": "suporte@example.com",
            "consumidor_nome": "Maria Consumidora",
            "assunto": "Dúvida sobre protocolo",
            "descricao": "Não consigo visualizar a resposta enviada pela empresa.",
            "prioridade": "ALTA",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        ticket = TicketSuporteConsumidor.objects.get()
        self.assertEqual(ticket.consumidor_email, payload["consumidor_email"])
        self.assertEqual(ticket.prioridade, "ALTA")
        # ensure metadata saved
        self.assertIn("ip", ticket.metadados)
        notificacoes = NotificacaoConsumidor.objects.filter(consumidor_email=payload["consumidor_email"])
        self.assertEqual(notificacoes.count(), 1)
        self.assertIn("Recebemos seu ticket", notificacoes.first().titulo)

    def test_listar_tickets_filtra_por_email(self):
        TicketSuporteConsumidor.objects.create(
            consumidor_email="suporte@example.com",
            assunto="Ajuda",
            descricao="Teste",
        )
        url = reverse("portal_consumidor:tickets-list")
        response = self.client.get(f"{url}?email=suporte@example.com")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(response.data), 1)

    def test_bloqueia_listagem_sem_identificador(self):
        url = reverse("portal_consumidor:tickets-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class TicketSuporteAdminTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="agent",
            password="secret123",
            is_staff=True,
        )
        self.ticket = TicketSuporteConsumidor.objects.create(
            consumidor_email="suporte@example.com",
            assunto="Preciso de orientação",
            descricao="Como acompanhar minha denúncia?",
        )

    def test_listagem_requer_autenticacao(self):
        url = reverse("portal_consumidor:tickets-admin-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_atualizar_ticket_define_resposta(self):
        url = reverse("portal_consumidor:tickets-admin-detail", args=[self.ticket.id])
        self.client.force_authenticate(user=self.admin)
        payload = {
            "status": "RESPONDIDO",
            "resposta": "Acesse o portal e clique em 'Minhas interações'.",
            "prioridade": "MEDIA",
        }
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, "RESPONDIDO")
        self.assertEqual(self.ticket.resposta, payload["resposta"])
        self.assertEqual(self.ticket.respondido_por, self.admin)
        self.assertIsNotNone(self.ticket.data_resposta)
        notificacoes = NotificacaoConsumidor.objects.filter(consumidor_email="suporte@example.com")
        self.assertEqual(notificacoes.count(), 1)
        self.assertIn("Resposta ao seu ticket", notificacoes.first().titulo)

    def test_resumo_endpoint(self):
        TicketSuporteConsumidor.objects.create(
            consumidor_email="outro@example.com",
            assunto="Status da denúncia",
            descricao="Quando terei retorno?",
            prioridade=TicketSuporteConsumidor.Prioridade.ALTA,
            status=TicketSuporteConsumidor.Status.RESPONDIDO,
            resposta="Seu protocolo foi atualizado no sistema.",
            data_resposta=timezone.now(),
        )

        url = reverse("portal_consumidor:tickets-admin-resumo")
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        data = response.json()
        self.assertIn("total", data)
        self.assertIn("por_prioridade", data)
        self.assertIn("tempo_medio_resposta_horas", data)

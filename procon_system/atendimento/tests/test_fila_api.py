from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from atendimento.models import BalcaoAtendimento, SenhaAtendimento, FilaAtendimento

User = get_user_model()


class FilaAtendimentoAPITests(APITestCase):
    def setUp(self):
        self.usuario = User.objects.create_user(
            username='operador',
            password='123456',
            is_staff=True,
        )
        self.client.force_authenticate(self.usuario)
        self.balcao = BalcaoAtendimento.objects.create(
            nome='Balcão Central',
            codigo='BL001',
            ativo=True,
        )

    def test_emitir_e_chamar_senha(self):
        emitir_url = reverse('atendimento:balcao-atendimento-emitir-senha', kwargs={'pk': self.balcao.id})
        response = self.client.post(emitir_url, {'prioridade': SenhaAtendimento.Prioridade.NORMAL})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(SenhaAtendimento.objects.count(), 1)

        fila = FilaAtendimento.obter_fila_ativa(self.balcao)
        self.assertEqual(fila.quantidade_emitidas, 1)

        chamar_url = reverse('atendimento:balcao-atendimento-chamar-proxima', kwargs={'pk': self.balcao.id})
        response = self.client.post(chamar_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        fila.refresh_from_db()
        self.assertEqual(fila.quantidade_chamadas, 1)

    def test_status_endpoint(self):
        SenhaAtendimento.objects.create(balcao=self.balcao)
        status_url = reverse('atendimento:balcao-atendimento-status', kwargs={'pk': self.balcao.id})
        response = self.client.get(status_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('balcao', response.data)
        self.assertIn('fila', response.data)
        self.assertIn('senhas', response.data)

    def test_pular_e_finalizar(self):
        senha = SenhaAtendimento.objects.create(balcao=self.balcao)
        SenhaAtendimento.objects.filter(pk=senha.pk).update(status=SenhaAtendimento.Status.CHAMADA)

        pular_url = reverse('atendimento:senha-atendimento-pular', kwargs={'pk': senha.id})
        response = self.client.post(pular_url, {'motivo': 'Usuário ausente'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        senha.refresh_from_db()
        self.assertEqual(senha.status, SenhaAtendimento.Status.EM_ESPERA)

        iniciar_url = reverse('atendimento:senha-atendimento-iniciar', kwargs={'pk': senha.id})
        self.client.post(iniciar_url)

        finalizar_url = reverse('atendimento:senha-atendimento-finalizar', kwargs={'pk': senha.id})
        response = self.client.post(finalizar_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        senha.refresh_from_db()
        self.assertEqual(senha.status, SenhaAtendimento.Status.FINALIZADA)

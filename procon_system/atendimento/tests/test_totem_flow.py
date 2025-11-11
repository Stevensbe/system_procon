from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from atendimento.models import BalcaoAtendimento, FilaAtendimento, SenhaAtendimento


class AutoAtendimentoFlowTests(APITestCase):
    def setUp(self):
        self.balcao = BalcaoAtendimento.objects.create(
            nome="Guichê Teste",
            codigo="TESTE",
            descricao="Guichê para testes automatizados",
            capacidade_simultanea=1,
        )
        # Garante fila ativa para o dia
        FilaAtendimento.obter_fila_ativa(self.balcao)

    def test_fluxo_completo_totem_e_guiche(self):
        # 1. Totem lista balções
        lista_url = reverse('atendimento:autoatendimento-list')
        response = self.client.get(lista_url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(item['id'] == self.balcao.id for item in response.json()))

        # 2. Retirar senha via totem
        retirar_url = reverse('atendimento:autoatendimento-retirar', args=[self.balcao.id])
        response = self.client.post(retirar_url, {'prioridade': SenhaAtendimento.Prioridade.NORMAL})
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        senha_data = payload['senha']
        self.assertEqual(senha_data['prioridade'], SenhaAtendimento.Prioridade.NORMAL)

        senha_obj = SenhaAtendimento.objects.get(identificador=senha_data['identificador'])

        # 3. Painel resumo p/ TV deve refletir nova senha
        resumo_url = reverse('atendimento:autoatendimento-painel-resumo')
        response = self.client.get(resumo_url)
        self.assertEqual(response.status_code, 200)
        resumo_payload = response.json()
        self.assertEqual(resumo_payload['balcoes'][0]['senhas_em_espera'], 1)

        # 4. Autenticar atendente para chamar/iniciar/finalizar
        user = get_user_model().objects.create_user(username='agente', password='123456', is_staff=True)
        self.client.force_authenticate(user=user)

        chamar_url = reverse('atendimento:balcao-atendimento-chamar-proxima', args=[self.balcao.id])
        response = self.client.post(chamar_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['senha']['id'], senha_obj.id)

        iniciar_url = reverse('atendimento:senha-atendimento-iniciar', args=[senha_obj.id])
        response = self.client.post(iniciar_url)
        self.assertEqual(response.status_code, 200)

        finalizar_url = reverse('atendimento:senha-atendimento-finalizar', args=[senha_obj.id])
        response = self.client.post(finalizar_url)
        self.assertEqual(response.status_code, 200)

        fila = FilaAtendimento.obter_fila_ativa(self.balcao)
        self.assertEqual(fila.quantidade_emitidas, 1)
        self.assertEqual(fila.quantidade_chamadas, 1)
        self.assertEqual(fila.quantidade_finalizadas, 1)

        # Painel deve refletir fila vazia
        response = self.client.get(resumo_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['balcoes'][0]['senhas_em_espera'], 0)


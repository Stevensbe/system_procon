from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from audiencia_calendario.models import AgendamentoAudiencia, LocalAudiencia, Mediador

User = get_user_model()


class AudienciaCalendarioApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="mediador", password="test123", first_name="Mediador")
        self.mediador = Mediador.objects.create(
            usuario=self.user,
            numero_registro="MED-001",
            especializacoes=["GERAL"],
            disponibilidade_semana={"segunda": [9, 10]},
            valor_hora=100,
        )
        self.local = LocalAudiencia.objects.create(
            nome="Sala Virtual 1",
            endereco="Link de videoconferência",
            capacidade_maxima=20,
            tipo_local="SALA_VIRTUAL",
            possui_equipamentos_video=True,
            possui_acesso_inclusao=True,
            disponivel_24h=True,
            horario_funcionamento={}
        )

    def _create_payload(self, delta_days=1):
        return {
            "modalidade": "VIRTUAL",
            "tipo_audiencia": "CONCILIACAO",
            "data_agendamento": (timezone.now() + timedelta(days=delta_days)).isoformat(),
            "duracao_estimada": "01:00:00",
            "mediador_id": self.mediador.id,
            "local_id": self.local.id,
            "participantes_consumidor": [{"nome": "Consumidor", "email": "consumidor@example.com"}],
            "participantes_empresa": [{"nome": "Representante", "email": "rep@empresa.com"}],
            "observacoes": "Agendamento automatizado de teste",
        }

    def test_create_agendamento(self):
        url = reverse("audiencia_calendario:agendamentoaudiencia-list")
        response = self.client.post(url, self._create_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data["numero_protocolo"])
        self.assertEqual(AgendamentoAudiencia.objects.count(), 1)

    def test_list_agendamentos(self):
        url = reverse("audiencia_calendario:agendamentoaudiencia-list")
        self.client.post(url, self._create_payload(), format="json")

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.json()), 1)

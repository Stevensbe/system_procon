from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from automated_intelligence.models import AutomationRule, AutomationRun, InsightTrigger

User = get_user_model()


class AutomatedIntelligenceApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="auto_user", password="senha123")
        self.client.force_authenticate(self.user)

    def _create_regra(self):
        return AutomationRule.objects.create(
            nome="Alerta de Reclamação Alta",
            slug="alerta-reclamacao-alta",
            descricao="Dispara alerta quando volume ultrapassa limite",
            trigger_type="THRESHOLD",
            trigger_config={"indicador": "reclamacoes", "limite": 100},
            action_type="ALERTA",
            action_config={"nivel": "CRITICO"},
            criado_por=self.user,
        )

    def test_criar_regra(self):
        url = reverse("automated_intelligence:automation-rule-list")
        payload = {
            "nome": "Alerta de SLA",
            "slug": "alerta-sla",
            "descricao": "Notifica quando SLA ultrapassado",
            "trigger_type": "METRICA",
            "trigger_config": {"indicador": "sla", "limite": 72},
            "action_type": "EMAIL",
            "action_config": {"destinatarios": ["gestor@example.com"]},
            "criado_por": self.user.id,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["slug"], "alerta-sla")

    def test_finalizar_execucao(self):
        regra = self._create_regra()
        execucao = AutomationRun.objects.create(
            regra=regra,
            status="EXECUTANDO",
            entrada={"volume": 120},
            executado_por=self.user,
        )
        url = reverse("automated_intelligence:automation-run-finalizar", args=[execucao.id])
        payload = {"status": "SUCESSO", "resultado": {"alerta": True}}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        execucao.refresh_from_db()
        self.assertEqual(execucao.status, "SUCESSO")
        self.assertIn("alerta", execucao.resultado)

    def test_reconhecer_insight(self):
        regra = self._create_regra()
        insight = InsightTrigger.objects.create(
            regra=regra,
            titulo="Volume Crítico detectado",
            descricao="Setor X ultrapassou limite",
            severidade="CRITICAL",
            dados_relacionados={"setor": "Setor X"},
        )
        url = reverse("automated_intelligence:insight-trigger-reconhecer", args=[insight.id])
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        insight.refresh_from_db()
        self.assertTrue(insight.reconhecido)
        self.assertEqual(insight.reconhecido_por, self.user)


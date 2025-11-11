from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from predictive_analytics.models import PredictiveModel, TrainingJob, ForecastResult

User = get_user_model()


class PredictiveAnalyticsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="predict_user", password="senha123")
        self.client.force_authenticate(self.user)

    def _create_modelo(self):
        return PredictiveModel.objects.create(
            codigo="MODEL_TEND",
            nome="Modelo de Tendência",
            descricao="Prevê tendências de reclamações",
            tipo_algoritmo="TIME_SERIES",
            origem_dados="reclamacoes",
            parametros_treinamento={"lags": 12},
            criado_por=self.user,
        )

    def test_criar_modelo_preditivo(self):
        url = reverse("predictive_analytics:predictive-model-list")
        payload = {
            "codigo": "MODEL_RESOL",
            "nome": "Modelo de Resolução",
            "descricao": "Estimativa da taxa de resolução em 7 dias",
            "tipo_algoritmo": "REGRESSION",
            "origem_dados": "protocolo",
            "parametros_treinamento": {"features": ["tempo_atendimento", "prioridade"]},
            "metricas_referencia": {"rmse": 1.2},
            "criado_por": self.user.id,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["codigo"], "MODEL_RESOL")

    def test_finalizar_job_treinamento(self):
        modelo = self._create_modelo()
        job = TrainingJob.objects.create(
            modelo=modelo,
            conjunto_dados="dataset_treino_v1",
            parametros_execucao={"epochs": 10},
            executado_por=self.user,
        )
        url = reverse("predictive_analytics:training-job-finalizar", args=[job.id])
        payload = {"status": "SUCESSO", "metricas_resultado": {"rmse": 0.98}}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        job.refresh_from_db()
        self.assertEqual(job.status, "SUCESSO")
        self.assertIsNotNone(job.finalizado_em)
        self.assertIn("rmse", job.metricas_resultado)

    def test_criar_previsao(self):
        modelo = self._create_modelo()
        url = reverse("predictive_analytics:forecast-result-list")
        payload = {
            "modelo": modelo.id,
            "referencia": timezone.now().isoformat(),
            "horizonte": "CURTO_PRAZO",
            "parametros_entrada": {"janela": 30},
            "resultado_previsto": {"resolucao_prevista": Decimal("87.5")},
            "status": "GERADO",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(ForecastResult.objects.count(), 1)
        self.assertEqual(ForecastResult.objects.first().gerado_por, self.user)


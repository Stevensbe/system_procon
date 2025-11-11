from datetime import datetime, time as dt_time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from business_intelligence.models import (
    KPI,
    ValorKPI,
    RelatorioPersonalizado,
    AnaliseEmpirica,
)
from portal_consumidor.models import TicketSuporteConsumidor, FeedbackConsumidor

User = get_user_model()


class BusinessIntelligenceApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="bi_user", password="test123", email="bi@example.com")
        self.client.force_authenticate(self.user)

    def _create_kpi(self):
        return KPI.objects.create(
            codigo="KPI_ATEND",
            nome="Tempo Médio de Atendimento",
            descricao="Mede o tempo médio",
            categoria="OPERACIONAL",
            tipo_kpi="TATAL",
            formula_calculo="AVG(tempo_atendimento)",
            filtros_aplicaveis={"setor": ["atendimento"]},
            created_by=self.user,
        )

    def test_create_kpi(self):
        url = reverse("business_intelligence:kpi-list")
        payload = {
            "codigo": "KPI_RESOL",
            "nome": "Taxa de Resolução",
            "descricao": "Percentual de casos resolvidos no prazo",
            "categoria": "OPERACIONAL",
            "tipo_kpi": "PERCENTUAL",
            "formula_calculo": "resolvidos / total * 100",
            "filtros_aplicaveis": {"prioridade": ["ALTA"]},
            "created_by": self.user.id,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["codigo"], "KPI_RESOL")

    def test_list_valores_kpi(self):
        kpi = self._create_kpi()
        ValorKPI.objects.create(
            kpi=kpi,
            data_referencia=timezone.now(),
            periodo_tipo="DIA",
            valor_calculado=Decimal("12.5"),
            valor_meta=Decimal("10.0"),
            percentual_meta=Decimal("125.00"),
        )

        url = reverse("business_intelligence:valor-kpi-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_create_relatorio_personalizado(self):
        url = reverse("business_intelligence:relatorio-personalizado-list")
        payload = {
            "codigo": "REL_EXEC",
            "nome": "Relatório Executivo Mensal",
            "descricao": "Resumo mensal para diretoria",
            "tipo_relatorio": "EXECUTIVO",
            "formato": "PDF",
            "query_sql": "SELECT 1",
            "frequencia_geracao": "MENSAL",
            "intervalo_dias": 30,
            "hora_execucao": dt_time(hour=8, minute=0).isoformat(),
            "created_by": self.user.id,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["codigo"], "REL_EXEC")

    def test_list_analises_empiricas(self):
        AnaliseEmpirica.objects.create(
            codigo="ANL_TEND",
            nome="Tendência de Reclamações",
            descricao="Analisa tendência mensal",
            tipo_analise="TENDENCIA",
            fonte_dados="Reclamacoes",
            resultado_principal={"crescimento": 12},
            executado_por=self.user,
        )
        url = reverse("business_intelligence:analise-empirica-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_portal_consumidor_analytics(self):
        TicketSuporteConsumidor.objects.create(
            consumidor_email="suporte@example.com",
            consumidor_nome="Maria",
            assunto="Dúvida sobre protocolo",
            descricao="Não consigo visualizar a resposta.",
            prioridade=TicketSuporteConsumidor.Prioridade.ALTA,
            status=TicketSuporteConsumidor.Status.RESPONDIDO,
            resposta="Resposta enviada ao consumidor.",
            data_resposta=timezone.now(),
        )
        TicketSuporteConsumidor.objects.create(
            consumidor_email="aguardando@example.com",
            assunto="Ticket aguardando",
            descricao="Em análise.",
            prioridade=TicketSuporteConsumidor.Prioridade.MEDIA,
            status=TicketSuporteConsumidor.Status.ABERTO,
        )
        FeedbackConsumidor.objects.create(
            consumidor_email="suporte@example.com",
            tipo_feedback="USABILIDADE",
            nota_geral=8,
        )

        url = reverse("business_intelligence:portal-consumidor-analytics-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        dados = response.json()
        self.assertIn("tickets", dados)
        self.assertEqual(dados["tickets"]["total"], 2)
        self.assertIn("feedbacks", dados)
        self.assertEqual(dados["feedbacks"]["total"], 1)


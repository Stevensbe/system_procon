from datetime import date, timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from cip_automatica.models import CIPAutomatica, TipoCIP
from portal_cidadao.models import ReclamacaoDenuncia


class CIPAutomaticaApiTests(APITestCase):
    def setUp(self):
        self.tipo_cip = TipoCIP.objects.create(
            nome="Padrão",
            codigo="PAD",
            descricao="Fluxo padrão para testes automatizados",
            template_cip="<html></html>",
            prazo_resposta=5,
            prazo_acordo=10,
            valor_minimo=Decimal("100.00"),
            valor_maximo=Decimal("10000.00"),
            setor_responsavel="Atendimento",
        )
        self.reclamacao = ReclamacaoDenuncia.objects.create(
            consumidor_nome="Ana Teste",
            consumidor_cpf="11122233344",
            consumidor_email="ana@example.com",
            consumidor_telefone="92999999999",
            consumidor_endereco="Rua Alfa, 123",
            consumidor_cep="69000-000",
            consumidor_cidade="Manaus",
            consumidor_uf="AM",
            empresa_razao_social="Empresa Exemplo LTDA",
            empresa_cnpj="12.345.678/0001-90",
            empresa_endereco="Av. Beta, 456",
            empresa_telefone="9233334444",
            empresa_email="contato@empresa.com",
            descricao_fatos="Situação detalhada " * 10,
            data_ocorrencia=date.today(),
            valor_envolvido=Decimal("1500.00"),
        )

    def test_generate_cip(self):
        url = reverse("cip_automatica:cipautomatica-generate")
        payload = {
            "reclamacao_id": self.reclamacao.id,
            "tipo_cip_id": self.tipo_cip.id,
            "valor_indenizacao": "1500.00",
            "observacoes": "Teste de geração automática",
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["empresa_razao_social"], "Empresa Exemplo LTDA")
        self.assertIsNotNone(data["numero_cip"])
        self.assertEqual(CIPAutomatica.objects.count(), 1)

    def test_dispatch_and_overdue_endpoints(self):
        cip = CIPAutomatica.objects.create(
            tipo_cip=self.tipo_cip,
            assunto="CIP - Teste",
            consumidor_nome=self.reclamacao.consumidor_nome,
            consumidor_cpf=self.reclamacao.consumidor_cpf,
            consumidor_email=self.reclamacao.consumidor_email,
            consumidor_telefone=self.reclamacao.consumidor_telefone,
            consumidor_endereco=self.reclamacao.consumidor_endereco,
            consumidor_cidade=self.reclamacao.consumidor_cidade,
            consumidor_uf=self.reclamacao.consumidor_uf,
            consumidor_cep=self.reclamacao.consumidor_cep,
            empresa_razao_social=self.reclamacao.empresa_razao_social,
            empresa_cnpj=self.reclamacao.empresa_cnpj,
            empresa_endereco=self.reclamacao.empresa_endereco,
            empresa_cidade=self.reclamacao.consumidor_cidade,
            empresa_uf=self.reclamacao.consumidor_uf,
            empresa_email=self.reclamacao.empresa_email,
            empresa_telefone=self.reclamacao.empresa_telefone,
            descricao_fatos=self.reclamacao.descricao_fatos,
            valor_indenizacao=Decimal("1200.00"),
            valor_multa=Decimal("120.00"),
            prazo_resposta_empresa=timezone.now() - timedelta(days=2),
            prazo_acordo_pagamento=timezone.now() + timedelta(days=10),
        )
        cip.save()

        dispatch_url = reverse("cip_automatica:cipautomatica-dispatch", args=[cip.id])
        response = self.client.post(dispatch_url, {"metodo_envio": "email"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cip.refresh_from_db()
        self.assertEqual(cip.status, "ENVIADA")

        overdue_url = reverse("cip_automatica:cipautomatica-overdue")
        response = self.client.get(overdue_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertGreaterEqual(len(payload), 1)

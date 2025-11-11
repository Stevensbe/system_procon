from django.test import TestCase
from django.urls import reverse

from produtos.models import CategoriaProduto, Produto


class ProdutoBarcodeApiTests(TestCase):
    def setUp(self):
        self.categoria = CategoriaProduto.objects.create(
            nome='Higiene',
            codigo='HIG-001',
            descricao='Produtos de higiene pessoal',
        )
        self.produto = Produto.objects.create(
            nome='Sabonete Neutro',
            codigo_interno='SKU-0001',
            codigo_barras='7891234567890',
            categoria=self.categoria,
            unidade_medida='un',
            classificacao_risco='baixo',
            criado_por='suite-test',
        )

    def test_barcode_api_returns_internal_product(self):
        url = reverse('produtos:api_barcode', args=[self.produto.codigo_barras])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertEqual(payload['source'], 'internal')
        self.assertEqual(payload['produto']['id'], self.produto.id)
        self.assertEqual(payload['produto']['nome'], self.produto.nome)

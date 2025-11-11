from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from geospatial_analytics.models import GeoDataLayer, GeoMetric, HeatmapSnapshot

User = get_user_model()


class GeospatialAnalyticsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="geo_user", password="senha123")
        self.client.force_authenticate(self.user)

    def _create_layer(self):
        return GeoDataLayer.objects.create(
            nome="Regiões Administrativas",
            slug="regioes-admin",
            tipo_camada="REGIAO_ADMINISTRATIVA",
            descricao="Divisão administrativa da cidade",
            atributos_disponiveis=["codigo", "nome", "populacao"],
            criado_por=self.user,
        )

    def test_criar_camada(self):
        url = reverse("geospatial_analytics:geo-layer-list")
        payload = {
            "nome": "Bairros",
            "slug": "bairros",
            "tipo_camada": "BAIRRO",
            "descricao": "Mapa de bairros",
            "atributos_disponiveis": ["codigo", "nome"],
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["slug"], "bairros")

    def test_criar_e_listar_metricas(self):
        layer = self._create_layer()
        GeoMetric.objects.create(
            layer=layer,
            identificador_geografico="RA-01",
            indicador="Reclamacoes",
            valor=25.5,
            periodo_referencia=date.today(),
            metadados={"total": 25},
        )
        url = reverse("geospatial_analytics:geo-metric-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_heatmap_snapshot(self):
        layer = self._create_layer()
        url = reverse("geospatial_analytics:heatmap-snapshot-list")
        payload = {
            "layer": layer.id,
            "indicador": "Reclamacoes",
            "parametros": {"bucket": "z-score"},
            "dados_geojson": {"type": "FeatureCollection", "features": []},
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        snapshot = HeatmapSnapshot.objects.first()
        self.assertFalse(snapshot.expirado())

        renovar_url = reverse("geospatial_analytics:heatmap-snapshot-renovar", args=[snapshot.id])
        response_renovar = self.client.post(renovar_url, {"minutos": 30}, format="json")
        self.assertEqual(response_renovar.status_code, status.HTTP_200_OK)
        snapshot.refresh_from_db()
        self.assertIsNotNone(snapshot.expiracao)
        self.assertGreater(snapshot.expiracao, timezone.now())


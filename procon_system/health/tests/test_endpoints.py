from django.test import TestCase
from django.urls import reverse


class HealthEndpointsTests(TestCase):
    def test_basic_health_endpoint(self):
        response = self.client.get(reverse('health:health'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'healthy')

    def test_detailed_health_endpoint_returns_checks(self):
        response = self.client.get(reverse('health:health_detailed'))
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn('checks', body)
        self.assertIn('status', body)

    def test_readiness_endpoint(self):
        response = self.client.get(reverse('health:readiness'))
        self.assertIn(response.status_code, (200, 503))
        self.assertIn('status', response.json())

    def test_liveness_endpoint(self):
        response = self.client.get(reverse('health:liveness'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'alive')

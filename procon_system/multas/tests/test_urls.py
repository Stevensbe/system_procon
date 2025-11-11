from django.test import SimpleTestCase
from django.urls import reverse, resolve, NoReverseMatch


class MultasURLTests(SimpleTestCase):
    def test_public_urls_resolve(self):
        url_names = [
            'multas:listar_multa',
            'multas:listar_cobranca',
            'multas:listar_empresa',
        ]
        for name in url_names:
            with self.subTest(name=name):
                try:
                    path = reverse(name)
                except NoReverseMatch as exc:
                    self.fail(f'URL {name} deve estar registrada: {exc}')
                self.assertIsNotNone(resolve(path).func, 'Resolver deve mapear a view correspondente')

from django.apps import AppConfig


class PortalEmpresaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'portal_empresa'
    verbose_name = "Portal da Empresa"

    def ready(self):
        import portal_empresa.signals  # noqa

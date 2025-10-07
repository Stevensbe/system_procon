from django.apps import AppConfig


class ApisExternasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apis_externas'
    verbose_name = "APIs Externas e Integração"

    def ready(self):
        import apis_externas.signals  # noqa

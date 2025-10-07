from django.apps import AppConfig


class CipAutomaticaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cip_automatica'
    verbose_name = "CIP Automática"

    def ready(self):
        import cip_automatica.signals  # noqa

from django.apps import AppConfig


class PortalConsumidorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'portal_consumidor'
    verbose_name = "Portal do Consumidor"

    def ready(self):
        import portal_consumidor.signals  # noqa

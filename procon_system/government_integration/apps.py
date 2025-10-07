"""
Configuração do app Government Integration para o Sistema Procon
"""

from django.apps import AppConfig


class GovernmentIntegrationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'government_integration'
    verbose_name = 'Government Integration & External APIs'
    
    def ready(self):
        try:
            import government_integration.signals  # noqa
            import government_integration.tasks   # noqa
        except ImportError:
            pass

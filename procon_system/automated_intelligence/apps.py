"""
Configuração do app Automated Intelligence para o Sistema Procon
"""

from django.apps import AppConfig


class AutomatedIntelligenceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'automated_intelligence'
    verbose_name = 'Automated Intelligence & AI'
    
    def ready(self):
        try:
            import automated_intelligence.signals  # noqa
            import automated_intelligence.tasks   # noqa
        except ImportError:
            pass

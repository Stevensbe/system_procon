"""
Configuração do app Business Intelligence para o Sistema Procon
"""

from django.apps import AppConfig


class BusinessIntelligenceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'business_intelligence'
    verbose_name = 'Business Intelligence & Analytics'
    
    def ready(self):
        try:
            import business_intelligence.signals  # noqa
            import business_intelligence.tasks   # noqa
        except ImportError:
            pass

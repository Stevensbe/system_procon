"""
Configuração do app Predictive Analytics para o Sistema Procon
"""

from django.apps import AppConfig


class PredictiveAnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'predictive_analytics'
    verbose_name = 'Predictive Analytics & Machine Learning'
    
    def ready(self):
        try:
            import predictive_analytics.signals  # noqa
            import predictive_analytics.tasks   # noqa
        except ImportError:
            pass

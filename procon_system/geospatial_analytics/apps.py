"""
Configuração do app Geospatial Analytics para o Sistema Procon
"""

from django.apps import AppConfig


class GeospatialAnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'geospatial_analytics'
    verbose_name = 'Geospatial Analytics & Mapping'
    
    def ready(self):
        try:
            import geospatial_analytics.signals  # noqa
            import geospatial_analytics.tasks   # noqa
        except ImportError:
            pass

from django.apps import AppConfig


class PortalCidadaoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'portal_cidadao'
    
    def ready(self):
        """Importa os signals quando a aplicação estiver pronta"""
        try:
            from caixa_entrada import signals
        except ImportError:
            pass

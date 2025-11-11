from django.apps import AppConfig


class PpaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ppa'
    verbose_name = 'PPA - Procedimento Preliminar Administrativo'
    
    def ready(self):
        """Importa signals quando o app estiver pronto"""
        try:
            import ppa.signals  # noqa
        except ImportError:
            pass


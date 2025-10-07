"""
Configuração do app de monitoramento
"""

from django.apps import AppConfig


class MonitoringConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'monitoring'
    verbose_name = 'Monitoramento e Observabilidade'
    
    def ready(self):
        """Configurações quando o app estiver pronto"""
        # Importar signals se houver
        try:
            import monitoring.signals
        except ImportError:
            pass

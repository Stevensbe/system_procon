from django.apps import AppConfig

class FiscalizacaoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fiscalizacao'
    verbose_name = 'Fiscalização'
    
    def ready(self):
        """Importa os signals quando a aplicação estiver pronta"""
        try:
            import fiscalizacao.signals
            import fiscalizacao.workflow_signals
        except ImportError:
            pass
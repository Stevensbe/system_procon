from django.apps import AppConfig


class CaixaEntradaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'caixa_entrada'
    verbose_name = 'Caixa de Entrada'
    
    def ready(self):
        """Importa signals quando o app é carregado"""
        import caixa_entrada.signals

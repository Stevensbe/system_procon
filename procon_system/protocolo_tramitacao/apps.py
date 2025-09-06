from django.apps import AppConfig


class ProtocoloTramitacaoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'protocolo_tramitacao'
    verbose_name = 'Protocolo e Tramitação'
    
    def ready(self):
        """Carrega signals quando a aplicação estiver pronta"""
        try:
            import protocolo_tramitacao.signals
            # Configura setores padrão na primeira execução
            from .signals import configurar_setores_padrao
            configurar_setores_padrao()
        except ImportError:
            pass

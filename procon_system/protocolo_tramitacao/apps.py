from django.apps import AppConfig


class ProtocoloTramitacaoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'protocolo_tramitacao'
    verbose_name = 'Protocolo e Tramitação'
    
    def ready(self):
        """Carrega signals quando a aplicação estiver pronta"""
        try:
            import protocolo_tramitacao.signals
        except ImportError:
            return

        from django.db.models.signals import post_migrate
        from .signals import configurar_setores_padrao

        def _ensure_setores(sender, **kwargs):
            configurar_setores_padrao()

        post_migrate.connect(_ensure_setores, sender=self)

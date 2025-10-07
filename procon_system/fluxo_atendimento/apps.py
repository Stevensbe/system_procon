from django.apps import AppConfig


class FluxoAtendimentoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fluxo_atendimento'
    verbose_name = "Fluxo Completo de Atendimento"

    def ready(self):
        import fluxo_atendimento.signals  # noqa

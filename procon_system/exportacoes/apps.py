from django.apps import AppConfig


class ExportacoesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'exportacoes'
    verbose_name = "Exportações Governamentais"

    def ready(self):
        import exportacoes.signals  # noqa

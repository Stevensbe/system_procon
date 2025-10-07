from django.apps import AppConfig


class RespostaEmpresaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'resposta_empresa'
    verbose_name = "Análise de Respostas Empresariais"

    def ready(self):
        import resposta_empresa.signals  # noqa

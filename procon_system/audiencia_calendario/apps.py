from django.apps import AppConfig


class AudienciaCalendarioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audiencia_calendario'
    verbose_name = "Calendário de Audiências"

    def ready(self):
        import audiencia_calendario.signals  # noqa

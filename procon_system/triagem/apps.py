from django.apps import AppConfig


class TriagemConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "triagem"
    verbose_name = "Triagem de Demandas"

    def ready(self):
        # Importa sinais para integração automática com o portal do cidadão
        try:
            import triagem.signals  # noqa: F401
        except Exception:
            # Evita que erros de import bloqueiem o startup; logs podem ser tratados separadamente
            pass


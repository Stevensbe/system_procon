# Importa o celery app para garantir que ele seja carregado quando o Django inicia
from .celery import app as celery_app

__all__ = ('celery_app',)
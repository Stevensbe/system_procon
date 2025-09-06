"""
Configuração do Celery para o projeto System Procon
"""
import os
from celery import Celery
from django.conf import settings

# Definir o módulo de configurações padrão do Django para o programa 'celery'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')

app = Celery('procon_system')

# Usar uma string aqui significa que o worker não precisa serializar
# o objeto de configuração para processos filhos
app.config_from_object('django.conf:settings', namespace='CELERY')

# Carregar tarefas de todos os apps Django registrados
app.autodiscover_tasks()

# Configurações adicionais
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Sao_Paulo',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutos
    task_soft_time_limit=25 * 60,  # 25 minutos
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

@app.task(bind=True)
def debug_task(self):
    """Tarefa de debug"""
    print(f'Request: {self.request!r}')
    return 'Celery funcionando!'
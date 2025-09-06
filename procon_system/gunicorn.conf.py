# Configuração do Gunicorn para o Sistema Procon
import multiprocessing
import os

# Configurações básicas
bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 120
keepalive = 2

# Logs
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Processo
preload_app = True
daemon = False
pidfile = "/tmp/gunicorn.pid"
user = None
group = None
tmp_upload_dir = None

# Segurança
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Configurações específicas para produção
if os.environ.get('DEBUG', 'False').lower() == 'false':
    # Produção
    workers = 4
    worker_class = "gevent"
    worker_connections = 1000
    max_requests = 1000
    max_requests_jitter = 50
    timeout = 120
    keepalive = 2
    
    # Logs em arquivo para produção
    accesslog = "/app/logs/gunicorn_access.log"
    errorlog = "/app/logs/gunicorn_error.log"
    loglevel = "info"
else:
    # Desenvolvimento
    workers = 1
    worker_class = "sync"
    reload = True
    reload_extra_files = ["/app"]
    timeout = 30

# Callbacks
def on_starting(server):
    server.log.info("Iniciando servidor Gunicorn...")

def on_reload(server):
    server.log.info("Recarregando servidor Gunicorn...")

def worker_int(worker):
    worker.log.info("Worker recebeu SIGINT ou SIGQUIT")

def pre_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_worker_init(worker):
    worker.log.info("Worker initialized (pid: %s)", worker.pid)

def worker_abort(worker):
    worker.log.info("Worker aborted (pid: %s)", worker.pid)

def pre_exec(server):
    server.log.info("Forked child, re-executing.")

def when_ready(server):
    server.log.info("Servidor pronto para receber conexões")

def worker_exit(server, worker):
    server.log.info("Worker exited (pid: %s)", worker.pid)

def on_exit(server):
    server.log.info("Servidor Gunicorn finalizado")

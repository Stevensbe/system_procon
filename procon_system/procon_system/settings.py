"""
Configurações do Django para o projeto System Procon
Versão final que combina segurança + funcionalidade completa
"""
from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# ===================================================================
# CONFIGURAÇÕES DE SEGURANÇA
# ===================================================================

# ===================================================================
# CONFIGURAÇÕES DE SEGURANÇA
# ===================================================================

DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

# Configuração segura de SECRET_KEY - SEMPRE usar variável de ambiente
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        # Apenas em desenvolvimento, gerar uma chave temporária
        from django.core.management.utils import get_random_secret_key
        SECRET_KEY = get_random_secret_key()
        print("AVISO: SECRET_KEY não definida. Gerando chave temporária para desenvolvimento.")
        print("   Configure SECRET_KEY em variável de ambiente para produção!")
    else:
        # Em produção, SEMPRE exigir SECRET_KEY
        raise ValueError(
            "SECRET_KEY deve ser definida como variável de ambiente em produção. "
            "Configure SECRET_KEY no seu ambiente de produção."
        )
ALLOWED_HOSTS_STR = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(',') if host.strip()]

# ===================================================================
# APLICATIVOS INSTALADOS
# ===================================================================

INSTALLED_APPS = [
    'jazzmin',  # Deve vir antes de django.contrib.admin
    'admin_interface',  # Deve vir antes de django.contrib.admin
    'colorfield',  # Necessário para admin_interface
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Apps locais existentes
    'fiscalizacao.apps.FiscalizacaoConfig',
    'multas',
    'legislacao',
    'dashboard',
    'financeiro',
    'juridico',
    'protocolo',
    'protocolo_tramitacao',
    'peticionamento',
    'analise_juridica',
    'portal_cidadao.apps.PortalCidadaoConfig',
    'recursos_defesas',
    'atendimento',
    
    # Sistema de monitoramento e observabilidade
    'monitoring',
    
    # Fase 4 - Fluxo Completo do Atendimento
    'cip_automatica',
    'audiencia_calendario',
    'resposta_empresa',
    'fluxo_atendimento',
    
    # Fase 5 - Portal Externo & Integradores
    'portal_consumidor',
    'portal_empresa',
    'apis_externas',
    'exportacoes',
    
    # Fase 6 - Business Intelligence & Relatórios Avançados
    'business_intelligence',
    'predictive_analytics',
    'government_integration',
    'geospatial_analytics',
    'automated_intelligence',
    
    # Novos módulos implementados
    'empresas',
    'notificacoes',
    'relatorios',
    'agenda',
    'consulta_publica',
    'produtos',
    'recursos',
    'auditoria',
    'health',
    'cobranca',
    'caixa_entrada',
]

# ===================================================================
# MIDDLEWARES
# ===================================================================

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Adicionar middleware do ratelimit se disponível
try:
    import django_ratelimit
    MIDDLEWARE.append('django_ratelimit.middleware.RatelimitMiddleware')
except ImportError:
    pass

ROOT_URLCONF = 'procon_system.urls'

# ===================================================================
# TEMPLATES
# ===================================================================

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

WSGI_APPLICATION = 'procon_system.wsgi.application'

# ===================================================================
# BANCO DE DADOS - FLEXÍVEL
# ===================================================================

# Usar PostgreSQL se as variáveis estiverem configuradas, senão SQLite
DB_ENGINE = os.environ.get('DB_ENGINE', 'sqlite')

# Configuração PostgreSQL corrigida
if DB_ENGINE == 'postgresql':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME'),
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
    # Verificar se as variáveis obrigatórias estão definidas
    if not all([os.environ.get('DB_NAME'), os.environ.get('DB_USER'), os.environ.get('DB_PASSWORD')]):
        raise ValueError("DB_NAME, DB_USER e DB_PASSWORD devem ser definidas para PostgreSQL")
    print("Usando PostgreSQL")
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    print("Usando SQLite (desenvolvimento)")


# ===================================================================
# VALIDAÇÃO DE SENHAS
# ===================================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ===================================================================
# INTERNACIONALIZAÇÃO
# ===================================================================

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# ===================================================================

# ================================================================
# INTEGRAÇÕES EXTERNAS
# ================================================================

# Configuração da API de consulta à Receita Federal (CNPJ)
RECEITA_FEDERAL_CNPJ_URL = os.environ.get(
    'RECEITA_FEDERAL_CNPJ_URL',
    'https://receitaws.com.br/v1/cnpj/{cnpj}'
)

try:
    RECEITA_FEDERAL_TIMEOUT = float(os.environ.get('RECEITA_FEDERAL_TIMEOUT', '10'))
except ValueError:
    RECEITA_FEDERAL_TIMEOUT = 10.0

RECEITA_FEDERAL_API_KEY = os.environ.get('RECEITA_FEDERAL_API_KEY', '').strip() or None

# CORS - CONFIGURAÇÃO SEGURA
# ===================================================================

# Configuração CORS baseada no ambiente
CORS_ALLOWED_ORIGINS_STR = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_STR.split(',') if origin.strip()]

# Configurações CORS padrão (seguras)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Configurações específicas por ambiente
if DEBUG:
    # Desenvolvimento: mais permissivo, mas ainda controlado
    CORS_ALLOW_ALL_ORIGINS = True
    print("CORS: Modo desenvolvimento - permitindo todas as origens")
else:
    # Produção: apenas origens específicas
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        'https://procon.am.gov.br',
        'https://www.procon.am.gov.br',
        'https://sistema.procon.am.gov.br',
    ] + CORS_ALLOWED_ORIGINS  # Incluir origens de desenvolvimento se necessário
    print("CORS: Modo produção - apenas origens permitidas")

# ===================================================================
# ARQUIVOS ESTÁTICOS E MÍDIA
# ===================================================================

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'  # Para produção

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===================================================================
# DJANGO REST FRAMEWORK
# ===================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ] if not DEBUG else [
        'rest_framework.permissions.AllowAny',  # Desenvolvimento
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ===================================================================
# JWT
# ===================================================================

ACCESS_TOKEN_LIFETIME = int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME', '30'))
REFRESH_TOKEN_LIFETIME = int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME', '1440'))

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=ACCESS_TOKEN_LIFETIME),
    "REFRESH_TOKEN_LIFETIME": timedelta(minutes=REFRESH_TOKEN_LIFETIME),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# ===================================================================
# CACHE (OPCIONAL)
# ===================================================================

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
    print("Usando Redis para cache")
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# ===================================================================
# CELERY (OPCIONAL)
# ===================================================================

if REDIS_URL:
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    CELERY_ACCEPT_CONTENT = ['application/json']
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'

# ===================================================================
# CONFIGURAÇÕES DE UPLOAD
# ===================================================================

MAX_FILE_SIZE_MB = int(os.environ.get('MAX_FILE_SIZE_MB', '10'))
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = FILE_UPLOAD_MAX_MEMORY_SIZE

ALLOWED_EXTENSIONS = os.environ.get('ALLOWED_EXTENSIONS', 'pdf,doc,docx,jpg,jpeg,png').split(',')

# ===================================================================
# CACHE CONFIGURAÇÃO
# ===================================================================

# Configuração de cache Redis
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_DB = int(os.environ.get('REDIS_DB', 0))
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', None)

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PASSWORD': REDIS_PASSWORD,
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
        },
        'KEY_PREFIX': 'procon',
        'TIMEOUT': 300,  # 5 minutos padrão
    },
    'session': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PASSWORD': REDIS_PASSWORD,
        },
        'KEY_PREFIX': 'session',
        'TIMEOUT': 86400,  # 24 horas
    },
    'long_term': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PASSWORD': REDIS_PASSWORD,
        },
        'KEY_PREFIX': 'long_term',
        'TIMEOUT': 86400 * 7,  # 7 dias
    }
}

# Configuração de sessão com Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'session'

# Cache para queries de banco de dados
CACHE_MIDDLEWARE_SECONDS = 300
CACHE_MIDDLEWARE_KEY_PREFIX = 'procon'

# Configurações específicas por ambiente
if DEBUG:
    # Em desenvolvimento, usar cache em memória se Redis não estiver disponível
    try:
        import redis
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, password=REDIS_PASSWORD)
        redis_client.ping()
        print("Redis conectado com sucesso")
    except Exception as e:
        print(f"Redis não disponível: {e}")
        print("Usando cache em memória para desenvolvimento")
        CACHES = {
            'default': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'unique-snowflake',
            },
            'session': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'session-cache',
            },
            'long_term': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'long-term-cache',
            }
        }
        SESSION_ENGINE = 'django.contrib.sessions.backends.db'
else:
    print("Cache Redis configurado para produção")

# ===================================================================
# LOGS ESTRUTURADOS
# ===================================================================

# Configuração avançada de logs
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "message": "%(message)s", "user": "%(user)s", "ip": "%(ip)s"}',
        },
        'detailed': {
            'format': '[{asctime}] {levelname} {module}.{funcName}:{lineno} - {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'detailed',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'errors.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'maxBytes': 1024 * 1024 * 5,  # 5MB
            'backupCount': 3,
            'formatter': 'verbose',
        },
        'api_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'api.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['error_file', 'console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'] if DEBUG else [],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        # Loggers específicos do projeto
        'procon': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'procon.api': {
            'handlers': ['api_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'procon.security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'procon.audit': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        # Loggers de terceiros
        'celery': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'redis': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}

# Criar diretório de logs se não existir
(BASE_DIR / 'logs').mkdir(exist_ok=True)

# Configuração de logs para desenvolvimento
if DEBUG:
    LOGGING['loggers']['django.db.backends']['level'] = 'DEBUG'
    LOGGING['loggers']['django.db.backends']['handlers'] = ['console']
    LOGGING['handlers']['console']['level'] = 'DEBUG'
else:
    # Em produção, reduzir logs de debug
    LOGGING['loggers']['django.db.backends']['handlers'] = []
    LOGGING['handlers']['console']['level'] = 'INFO'

# ===================================================================
# CONFIGURAÇÕES ESPECÍFICAS PARA DESENVOLVIMENTO
# ===================================================================

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    ALLOWED_HOSTS.append('*')  # Permitir qualquer host em desenvolvimento
    
    # Desabilitar algumas validações em desenvolvimento
    AUTH_PASSWORD_VALIDATORS = []

APPEND_SLASH = False

print(f"Django configurado - DEBUG: {DEBUG}, DB: {DATABASES['default']['ENGINE']}")

# ===================================================================
# SPECTACULAR (SWAGGER) SETTINGS
# ===================================================================

SPECTACULAR_SETTINGS = {
    'TITLE': 'System Procon API',
    'DESCRIPTION': 'API para o Sistema de Proteção ao Consumidor',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    'SWAGGER_UI_DIST': 'SIDECAR',
    'SWAGGER_UI_FAVICON_HREF': 'SIDECAR',
    'REDOC_DIST': 'SIDECAR',
}

# ===================================================================
# RATE LIMITING SETTINGS
# ===================================================================

RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'

# Configurações específicas por endpoint
RATELIMIT_VIEW_DEFAULTS = {
    'methods': ['POST', 'PUT', 'PATCH', 'DELETE'],
    'rate': '60/m',  # 60 requests per minute
}

# Para desenvolvimento, desabilitar rate limiting
if DEBUG:
    RATELIMIT_ENABLE = False

# === PROMETHEUS CONFIGURAÇÃO ===
PROMETHEUS_EXPORT_MIGRATIONS = False
PROMETHEUS_LATENCY_BUCKETS = (.005, .01, .025, .05, .075, .1, .25, .5, .75, 1.0, 2.5, 5.0, 7.5, 10.0)

# ===================================================================
# JAZZMIN CONFIGURAÇÕES
# ===================================================================

JAZZMIN_SETTINGS = {
    # Título da página de login
    "site_title": "Sistema PROCON",
    "site_header": "Sistema PROCON",
    "site_brand": "PROCON",
    "site_logo": None,
    "site_logo_classes": "img-circle",
    "site_icon": None,
    
    # Cores do tema
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": False,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": False,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    
    # Configurações da barra lateral
    "show_sidebar": True,
    "navigation_expanded": True,
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "admin.LogEntry": "fas fa-file",
        "cobranca.BoletoMulta": "fas fa-file-invoice-dollar",
        "cobranca.PagamentoMulta": "fas fa-credit-card",
        "cobranca.CobrancaMulta": "fas fa-file-invoice",
        "cobranca.ConfiguracaoCobranca": "fas fa-cogs",
        "cobranca.TemplateCobranca": "fas fa-file-alt",
        "cobranca.LogCobranca": "fas fa-history",
        "fiscalizacao": "fas fa-search",
        "multas": "fas fa-exclamation-triangle",
        "juridico": "fas fa-balance-scale",
        "protocolo": "fas fa-folder",
        "dashboard": "fas fa-tachometer-alt",
        "legislacao": "fas fa-book",
        "portal_cidadao": "fas fa-users",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    
    # Configurações de customização
    "custom_css": None,
    "custom_js": None,
    "show_ui_builder": False,
    
    # Configurações de mudança de tema
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
    
    # Configurações de links
    "related_modal_active": False,
    "use_google_fonts_cdn": True,
    "show_full_result_count": False,
    "show_ui_builder": False,
    
    # Configurações de responsividade
    "responsive": True,
    "responsive_breakpoint": "lg",
    
    # Configurações de idioma
    "language_chooser": False,
    
    # Configurações de menu
    "order_with_respect_to": ["auth", "cobranca", "fiscalizacao", "multas", "juridico", "protocolo", "dashboard"],
    
    # Configurações de permissões
    "permissions": {
        "can_change_theme": True,
        "can_show_ui_builder": False,
    },
}

# Configurações de texto do Jazzmin
JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-success",
    "accent": "accent-teal",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": False,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": False,
    "sidebar": "sidebar-dark-success",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "cosmo",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}

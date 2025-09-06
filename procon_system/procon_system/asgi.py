"""
Configuração ASGI para o projeto System Procon

Expõe o callable ASGI como uma variável de nível de módulo chamada ``application``.

Para mais informações sobre este arquivo, veja:
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

# Definir o módulo de configurações padrão do Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')

# Obter a aplicação ASGI do Django
django_asgi_app = get_asgi_application()

# Para futuras implementações de WebSockets ou outras funcionalidades assíncronas
application = django_asgi_app
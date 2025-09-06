#!/usr/bin/env python3
"""
Script para verificar como o router está mapeando as URLs
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.urls import reverse
from rest_framework.routers import DefaultRouter
from cobranca.views import BoletoMultaViewSet, PagamentoMultaViewSet, CobrancaMultaViewSet

def testar_router():
    """Testa como o router está mapeando as URLs"""
    print("🔍 Verificando Mapeamento do Router")
    print("=" * 50)
    
    # Criar router
    router = DefaultRouter()
    router.register(r'boletos', BoletoMultaViewSet, basename='boleto')
    router.register(r'pagamentos', PagamentoMultaViewSet, basename='pagamento')
    router.register(r'cobrancas', CobrancaMultaViewSet, basename='cobranca-multa')
    
    print("📋 URLs mapeadas pelo router:")
    for url in router.urls:
        print(f"   {url.pattern}")
    
    print("\n🔍 Verificando ViewSets:")
    
    # BoletoMultaViewSet
    print("\n📋 BoletoMultaViewSet:")
    boleto_viewset = BoletoMultaViewSet()
    print(f"   - Basename: {boleto_viewset.basename}")
    print(f"   - Actions: {list(boleto_viewset.action_map.keys())}")
    print(f"   - Extra actions:")
    for action in boleto_viewset.get_extra_actions():
        print(f"     * {action.__name__}: {action.url_path}")
    
    # PagamentoMultaViewSet
    print("\n📋 PagamentoMultaViewSet:")
    pagamento_viewset = PagamentoMultaViewSet()
    print(f"   - Basename: {pagamento_viewset.basename}")
    print(f"   - Actions: {list(pagamento_viewset.action_map.keys())}")
    print(f"   - Extra actions:")
    for action in pagamento_viewset.get_extra_actions():
        print(f"     * {action.__name__}: {action.url_path}")
    
    # CobrancaMultaViewSet
    print("\n📋 CobrancaMultaViewSet:")
    cobranca_viewset = CobrancaMultaViewSet()
    print(f"   - Basename: {cobranca_viewset.basename}")
    print(f"   - Actions: {list(cobranca_viewset.action_map.keys())}")
    print(f"   - Extra actions:")
    for action in cobranca_viewset.get_extra_actions():
        print(f"     * {action.__name__}: {action.url_path}")

if __name__ == "__main__":
    testar_router()

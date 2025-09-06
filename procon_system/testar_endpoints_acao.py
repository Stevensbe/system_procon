#!/usr/bin/env python3
"""
Script para testar especificamente os endpoints de ação que estão falhando
"""

import requests
import json
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.urls import reverse
from django.test import Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()

def testar_endpoints_acao():
    """Testa os endpoints de ação especificamente"""
    print("🧪 Testando Endpoints de Ação")
    print("=" * 50)
    
    # Criar cliente de teste
    client = APIClient()
    
    # Obter usuário admin
    try:
        user = User.objects.get(username='admin')
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        print("✅ Token de autenticação obtido")
    except User.DoesNotExist:
        print("❌ Usuário admin não encontrado")
        return
    
    # Lista de endpoints para testar
    endpoints = [
        ('/api/cobranca/boletos/boletos-recentes/', 'Boletos Recentes'),
        ('/api/cobranca/boletos/boletos-vencidos/', 'Boletos Vencidos'),
        ('/api/cobranca/boletos/boletos-por-status/', 'Boletos por Status'),
        ('/api/cobranca/pagamentos/pagamentos-recentes/', 'Pagamentos Recentes'),
        ('/api/cobranca/pagamentos/pagamentos-por-mes/', 'Pagamentos por Mês'),
        ('/api/cobranca/cobrancas/cobrancas-recentes/', 'Cobranças Recentes'),
        ('/api/cobranca/cobrancas/cobrancas-por-status/', 'Cobranças por Status'),
    ]
    
    for endpoint, nome in endpoints:
        try:
            response = client.get(endpoint)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {nome} - {response.status_code}")
            
            if response.status_code == 200:
                data = response.data
                if isinstance(data, list):
                    print(f"   📊 {len(data)} registros encontrados")
                elif isinstance(data, dict):
                    print(f"   📊 Dados recebidos com sucesso")
            else:
                print(f"   ❌ Erro: {response.data}")
                
        except Exception as e:
            print(f"❌ {nome} - Erro: {e}")
    
    print("\n🔍 Verificando URLs disponíveis...")
    
    # Testar URLs usando reverse
    try:
        from cobranca.views import BoletoMultaViewSet, PagamentoMultaViewSet, CobrancaMultaViewSet
        
        # Testar URLs do ViewSet
        print("\n📋 URLs do BoletoMultaViewSet:")
        boleto_viewset = BoletoMultaViewSet()
        for action in boleto_viewset.get_extra_actions():
            print(f"   - {action.__name__}: {action.url_path}")
        
        print("\n📋 URLs do PagamentoMultaViewSet:")
        pagamento_viewset = PagamentoMultaViewSet()
        for action in pagamento_viewset.get_extra_actions():
            print(f"   - {action.__name__}: {action.url_path}")
        
        print("\n📋 URLs do CobrancaMultaViewSet:")
        cobranca_viewset = CobrancaMultaViewSet()
        for action in cobranca_viewset.get_extra_actions():
            print(f"   - {action.__name__}: {action.url_path}")
            
    except Exception as e:
        print(f"❌ Erro ao verificar URLs: {e}")

if __name__ == "__main__":
    testar_endpoints_acao()

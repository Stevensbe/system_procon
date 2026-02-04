#!/usr/bin/env python3
"""
Script para testar endpoints via HTTP direto
"""

import requests
import json

# Configurações
BASE_URL = "http://localhost:8000"

def testar_endpoints_http():
    """Testa os endpoints via HTTP"""
    print("🌐 Testando Endpoints via HTTP")
    print("=" * 50)
    
    # Fazer login primeiro
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if response.status_code == 200:
            token = response.json().get('access')
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            print("✅ Login realizado com sucesso!")
        else:
            print(f"❌ Erro no login: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Erro na requisição de login: {e}")
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
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {nome} - {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   📊 {len(data)} registros encontrados")
                elif isinstance(data, dict):
                    print(f"   📊 Dados recebidos com sucesso")
            else:
                print(f"   ❌ Erro: {response.text}")
                
        except Exception as e:
            print(f"❌ {nome} - Erro: {e}")

if __name__ == "__main__":
    testar_endpoints_http()

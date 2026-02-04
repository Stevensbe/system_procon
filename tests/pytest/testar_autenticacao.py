#!/usr/bin/env python3
"""
Script para testar autenticação e endpoints do sistema PROCON
"""

import requests
import json

# Configurações
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def test_login():
    """Testa o login e retorna o token"""
    print("🔐 Testando login...")
    
    # Dados de login (ajuste conforme necessário)
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login realizado com sucesso!")
            print(f"Token: {data.get('access', 'N/A')[:50]}...")
            return data.get('access')
        else:
            print(f"❌ Erro no login: {response.status_code}")
            print(f"Resposta: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao fazer login: {e}")
        return None

def test_endpoint_with_auth(endpoint, token):
    """Testa um endpoint com autenticação"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f"{API_BASE}{endpoint}", headers=headers)
        
        if response.status_code == 200:
            print(f"✅ {endpoint} - OK")
            data = response.json()
            if isinstance(data, list):
                print(f"   📊 Retornou {len(data)} itens")
            elif isinstance(data, dict):
                print(f"   📊 Retornou objeto com {len(data)} campos")
            return True
        else:
            print(f"❌ {endpoint} - Erro {response.status_code}")
            print(f"   Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ {endpoint} - Erro: {e}")
        return False

def main():
    print("🚀 Testando Sistema PROCON - Autenticação e Endpoints")
    print("=" * 60)
    
    # Testa login
    token = test_login()
    
    if not token:
        print("❌ Não foi possível obter token. Abortando testes.")
        return
    
    print("\n🔍 Testando endpoints com autenticação...")
    print("-" * 40)
    
    # Lista de endpoints para testar
    endpoints = [
        "/apreensao-inutilizacao/",
        "/apreensao-inutilizacao/autos_supermercado_disponiveis/",
        "/apreensao-inutilizacao/proximo_numero/",
        "/apreensao-inutilizacao/estatisticas/",
        "/supermercados/",
        "/bancos/",
        "/postos/",
    ]
    
    success_count = 0
    total_count = len(endpoints)
    
    for endpoint in endpoints:
        if test_endpoint_with_auth(endpoint, token):
            success_count += 1
        print()
    
    print("=" * 60)
    print(f"📊 Resultado: {success_count}/{total_count} endpoints funcionando")
    
    if success_count == total_count:
        print("🎉 Todos os endpoints estão funcionando!")
    else:
        print("⚠️  Alguns endpoints falharam. Verifique os logs acima.")

if __name__ == "__main__":
    main()

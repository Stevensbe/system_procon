#!/usr/bin/env python3
"""
Script para testar os endpoints do dashboard
"""

import requests
import json
import time

# Configurações
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def test_endpoint(url, method="GET", data=None, headers=None):
    """Testa um endpoint específico"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        
        print(f"✅ {method} {url}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   Resposta: {json.dumps(data, indent=2)[:200]}...")
            except:
                print(f"   Resposta: {response.text[:200]}...")
        else:
            print(f"   Erro: {response.text[:200]}")
        
        return response.status_code == 200
        
    except requests.exceptions.RequestException as e:
        print(f"❌ {method} {url}")
        print(f"   Erro: {str(e)}")
        return False

def main():
    print("🧪 TESTANDO ENDPOINTS DO DASHBOARD")
    print("=" * 50)
    
    # Aguardar servidor iniciar
    print("⏳ Aguardando servidor iniciar...")
    time.sleep(3)
    
    # Testar endpoints sem autenticação (devem retornar 401)
    print("\n📋 TESTANDO ENDPOINTS SEM AUTENTICAÇÃO:")
    print("-" * 40)
    
    endpoints = [
        f"{API_BASE}/dashboard-stats/?periodo=mes",
        f"{API_BASE}/dashboard/graficos/?periodo=mes", 
        f"{API_BASE}/dashboard/alertas/",
        f"{API_BASE}/dashboard/atividades/?limite=10"
    ]
    
    for endpoint in endpoints:
        test_endpoint(endpoint)
    
    print("\n🔐 TESTANDO COM AUTENTICAÇÃO:")
    print("-" * 40)
    
    # Primeiro, fazer login para obter token
    login_data = {
        "username": "testuser",
        "password": "testpass"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/auth/token/", json=login_data, timeout=10)
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('access')
            
            if access_token:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                print("✅ Login realizado com sucesso")
                print(f"   Token: {access_token[:50]}...")
                
                # Testar endpoints com autenticação
                for endpoint in endpoints:
                    test_endpoint(endpoint, headers=headers)
            else:
                print("❌ Token não encontrado na resposta de login")
        else:
            print(f"❌ Falha no login: {login_response.status_code}")
            print(f"   Resposta: {login_response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao fazer login: {str(e)}")
    
    print("\n🎯 RESUMO DOS TESTES:")
    print("=" * 50)
    print("✅ Endpoints criados:")
    print("   - /api/dashboard-stats/")
    print("   - /api/dashboard/graficos/")
    print("   - /api/dashboard/alertas/")
    print("   - /api/dashboard/atividades/")
    print("\n📝 Próximos passos:")
    print("   1. Verificar se o frontend está fazendo as chamadas corretas")
    print("   2. Testar com dados reais do banco")
    print("   3. Implementar cache e otimizações")

if __name__ == "__main__":
    main()


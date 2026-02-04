#!/usr/bin/env python3
"""
Script de teste para verificar se o backend está funcionando
Execute este script para testar a conectividade
"""

import requests
import json

def test_backend():
    base_url = "http://localhost:8000"
    
    print("🔍 Testando backend do Sistema Procon...")
    
    # Teste 1: Health check
    try:
        response = requests.get(f"{base_url}/health-check/")
        if response.status_code == 200:
            print("✅ Health check: OK")
        else:
            print(f"❌ Health check: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check: {e}")
    
    # Teste 2: API test
    try:
        response = requests.get(f"{base_url}/api/test/")
        if response.status_code == 200:
            print("✅ API test: OK")
        else:
            print(f"❌ API test: {response.status_code}")
    except Exception as e:
        print(f"❌ API test: {e}")
    
    # Teste 3: Login
    try:
        response = requests.post(f"{base_url}/auth/token/", json={
            "username": "testuser",
            "password": "testpass"
        })
        if response.status_code == 200:
            data = response.json()
            print("✅ Login: OK")
            print(f"   Token: {data.get('access', 'N/A')[:50]}...")
        else:
            print(f"❌ Login: {response.status_code}")
            print(f"   Erro: {response.text}")
    except Exception as e:
        print(f"❌ Login: {e}")
    
    print("\n🎯 Para testar no frontend:")
    print("1. Certifique-se de que o backend está rodando em http://localhost:8000")
    print("2. Configure VITE_API_BASE_URL=http://localhost:8000 no frontend")
    print("3. Use as credenciais: testuser / testpass")

if __name__ == "__main__":
    test_backend()

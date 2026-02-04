#!/usr/bin/env python3
"""
Script para testar o login
"""

import requests
import json

def testar_login():
    """Testa o login"""
    print("🔐 Testando Login")
    print("=" * 30)
    
    url = "http://localhost:8000/auth/login/"
    data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            token = response.json().get('access')
            print(f"✅ Login realizado com sucesso!")
            print(f"Token: {token[:50]}...")
        else:
            print(f"❌ Erro no login")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    testar_login()

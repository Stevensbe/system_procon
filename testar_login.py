#!/usr/bin/env python
"""
Testar login via API
"""
import requests
import json

def testar_login():
    """Testar login via API"""
    
    print("=" * 60)
    print("🔐 TESTANDO LOGIN VIA API")
    print("=" * 60)
    
    # URL da API
    url = "http://localhost:8000/api/auth/token/"
    
    # Dados de teste
    dados_teste = [
        {"username": "teste_ti", "password": "123456"},
        {"username": "admin", "password": "admin123"},
        {"username": "12345678901", "password": "123456"},
    ]
    
    for dados in dados_teste:
        print(f"\n🧪 Testando: {dados['username']}")
        
        try:
            response = requests.post(url, json=dados, timeout=10)
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ LOGIN SUCESSO!")
                token_data = response.json()
                print(f"Token: {token_data.get('access', 'N/A')[:50]}...")
            else:
                print("❌ LOGIN FALHOU!")
                print(f"Erro: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ ERRO: Servidor não está rodando!")
            print("💡 Execute: python procon_system/manage.py runserver")
            break
        except Exception as e:
            print(f"❌ Erro: {str(e)}")

if __name__ == '__main__':
    testar_login()


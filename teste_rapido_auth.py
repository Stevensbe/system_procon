#!/usr/bin/env python3
import requests
import json

def quick_auth_test():
    print("🚀 Teste Rápido de Autenticação")
    print("=" * 40)
    
    base_url = "http://localhost:8000"
    
    # 1. Teste de conectividade
    print("1. Testando conectividade...")
    try:
        response = requests.get(f"{base_url}/health/", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Backend está rodando")
        else:
            print("   ❌ Backend com problemas")
            return False
    except Exception as e:
        print(f"   ❌ Erro de conexão: {e}")
        print("   💡 Inicie o servidor: python manage.py runserver")
        return False
    
    # 2. Teste de endpoint de auth
    print("\n2. Testando endpoint de autenticação...")
    try:
        response = requests.post(
            f"{base_url}/auth/token/",
            json={"username": "admin", "password": "admin123"},
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Autenticação funcionando!")
            print(f"   Token: {data.get('access', 'N/A')[:20]}...")
            return True
        else:
            print(f"   ❌ Erro na autenticação: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")
        return False

if __name__ == "__main__":
    success = quick_auth_test()
    if success:
        print("\n🎉 Todos os testes passaram!")
    else:
        print("\n⚠️ Alguns testes falharam. Verifique as configurações.")

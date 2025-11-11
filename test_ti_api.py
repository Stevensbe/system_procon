#!/usr/bin/env python
"""
Teste simples da API TI
"""
import requests
import json

def test_ti_api():
    """Testar a API TI"""
    try:
        # Testar endpoint de usuários
        response = requests.get('http://localhost:8000/api/ti/usuarios/', 
                              headers={'Content-Type': 'application/json'})
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API funcionando! Retornou {len(data)} usuários")
            for user in data[:3]:  # Mostrar apenas os primeiros 3
                print(f"  - {user.get('nome', 'N/A')} ({user.get('username', 'N/A')})")
        else:
            print(f"❌ Erro na API: {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
    except Exception as e:
        print(f"❌ Erro ao testar API: {str(e)}")

if __name__ == '__main__':
    test_ti_api()

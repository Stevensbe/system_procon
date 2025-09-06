#!/usr/bin/env python3
"""
Teste simples para verificar se a API de código de barras está funcionando
"""

import requests
import json

def test_api():
    print("🧪 TESTE SIMPLES DA API")
    print("=" * 40)
    
    # URL da API
    base_url = "http://localhost:8000"
    api_url = f"{base_url}/api/barcode/7891234567890/"
    
    print(f"🔗 Testando: {api_url}")
    
    try:
        # Testar se o servidor está rodando
        response = requests.get(f"{base_url}/api/", timeout=5)
        print(f"✅ Servidor Django: {response.status_code}")
        
        # Testar a API de código de barras
        response = requests.get(api_url, timeout=10)
        print(f"📱 API Barcode: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("📄 Resposta:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"❌ Erro: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar ao servidor")
        print("   Verifique se o Django está rodando: python manage.py runserver 0.0.0.0:8000")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

if __name__ == "__main__":
    test_api()

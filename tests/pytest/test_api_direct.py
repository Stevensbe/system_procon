#!/usr/bin/env python3
"""
Teste direto da API de código de barras
"""

import requests
import json
import sys

def test_api_direct():
    print("🔍 TESTE DIRETO DA API")
    print("=" * 40)
    
    # Configurações
    base_url = "http://localhost:8000"
    
    # Teste 1: Verificar se o servidor está rodando
    print("1️⃣ Testando se o servidor está rodando...")
    try:
        response = requests.get(f"{base_url}/api/", timeout=5)
        print(f"   ✅ Servidor: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return False
    
    # Teste 2: Verificar se a rota de produtos está funcionando
    print("\n2️⃣ Testando rota de produtos...")
    try:
        response = requests.get(f"{base_url}/api/produtos/", timeout=5)
        print(f"   ✅ Produtos: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    # Teste 3: Testar API de código de barras
    print("\n3️⃣ Testando API de código de barras...")
    
    # Códigos para testar
    test_codes = [
        "7891234567890",
        "3017620422003",  # Nutella
        "7891000100103",  # Coca-Cola
    ]
    
    for code in test_codes:
        print(f"\n   📱 Testando código: {code}")
        try:
            url = f"{base_url}/api/barcode/{code}/"
            print(f"   🔗 URL: {url}")
            
            response = requests.get(url, timeout=10)
            print(f"   📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Sucesso!")
                print(f"   📄 Resposta: {json.dumps(data, indent=2, ensure_ascii=False)}")
            else:
                print(f"   ❌ Erro: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Erro: {e}")
    
    # Teste 4: Verificar se há produtos no banco
    print("\n4️⃣ Verificando produtos no banco...")
    try:
        response = requests.get(f"{base_url}/api/produtos/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   📊 Total de produtos: {len(data.get('results', []))}")
        else:
            print(f"   ❌ Erro ao buscar produtos: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print("\n" + "=" * 40)
    print("🏁 TESTE CONCLUÍDO")
    
    return True

if __name__ == "__main__":
    test_api_direct()

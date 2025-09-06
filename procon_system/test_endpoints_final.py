#!/usr/bin/env python
"""
Script para testar os endpoints após as correções finais
"""
import requests
import json
import time

def test_endpoints():
    """Testa os endpoints principais"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testando endpoints após correções finais...")
    print("=" * 60)
    
    # Aguarda o servidor inicializar
    print("⏳ Aguardando servidor inicializar...")
    time.sleep(3)
    
    # Teste 1: Endpoint de multas
    print("\n1. Testando endpoint de multas:")
    try:
        response = requests.get(f"{base_url}/api/multas/", timeout=5)
        
        if response.status_code == 200:
            print("   ✅ Multas funcionando!")
            data = response.json()
            print(f"   📊 Total de multas: {data.get('count', 0)}")
        else:
            print(f"   ❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro de conexão: {e}")
    
    # Teste 2: Endpoint de busca
    print("\n2. Testando endpoint de busca:")
    try:
        response = requests.get(f"{base_url}/api/busca/", params={
            'q': 'teste',
            'limit': 5
        }, timeout=5)
        
        if response.status_code == 200:
            print("   ✅ Busca funcionando!")
            data = response.json()
            print(f"   📊 Resultados encontrados: {data.get('total_encontrados', 0)}")
        else:
            print(f"   ❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro de conexão: {e}")
    
    # Teste 3: Endpoint de processos
    print("\n3. Testando endpoint de processos:")
    try:
        response = requests.get(f"{base_url}/api/processos/", timeout=5)
        
        if response.status_code == 200:
            print("   ✅ Processos funcionando!")
            data = response.json()
            print(f"   📊 Total de processos: {data.get('count', 0)}")
        else:
            print(f"   ❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro de conexão: {e}")
    
    # Teste 4: Endpoint de estatísticas de multas
    print("\n4. Testando endpoint de estatísticas de multas:")
    try:
        response = requests.get(f"{base_url}/api/multas/estatisticas/", timeout=5)
        
        if response.status_code == 200:
            print("   ✅ Estatísticas de multas funcionando!")
            data = response.json()
            print(f"   📊 Total de multas: {data.get('total_multas', 0)}")
        else:
            print(f"   ❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro de conexão: {e}")
    
    print("\n" + "=" * 60)
    print("✅ Teste concluído!")

if __name__ == "__main__":
    test_endpoints()

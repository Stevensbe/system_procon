#!/usr/bin/env python3
"""
Script para testar as APIs do módulo de Cobrança
"""

import requests
import json

# Configurações
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/cobranca"

def test_api_endpoint(endpoint, method='GET', data=None):
    """Testa um endpoint da API"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=data)
        elif method == 'PUT':
            response = requests.put(url, json=data)
        elif method == 'DELETE':
            response = requests.delete(url)
        
        print(f"\n🔗 {method} {endpoint}")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("✅ Sucesso!")
            try:
                result = response.json()
                print(f"📄 Resposta: {json.dumps(result, indent=2, ensure_ascii=False)}")
            except:
                print(f"📄 Resposta: {response.text}")
        else:
            print("❌ Erro!")
            print(f"📄 Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")

def test_cobranca_apis():
    """Testa todas as APIs de cobrança"""
    print("🚀 Testando APIs do Módulo de Cobrança")
    print("=" * 50)
    
    # 1. Testar estatísticas gerais
    print("\n📊 1. Testando Estatísticas Gerais")
    test_api_endpoint('/geral/estatisticas/')
    
    # 2. Testar lista de processos
    print("\n📋 2. Testando Lista de Processos")
    test_api_endpoint('/geral/processos/')
    
    # 3. Testar boletos
    print("\n💰 3. Testando APIs de Boletos")
    test_api_endpoint('/boletos/')
    test_api_endpoint('/boletos/dashboard/')
    test_api_endpoint('/boletos/boletos-por-status/')
    test_api_endpoint('/boletos/boletos-vencidos/')
    test_api_endpoint('/boletos/boletos-recentes/')
    
    # 4. Testar pagamentos
    print("\n💳 4. Testando APIs de Pagamentos")
    test_api_endpoint('/pagamentos/')
    test_api_endpoint('/pagamentos/pagamentos-recentes/')
    test_api_endpoint('/pagamentos/pagamentos-por-mes/')
    
    # 5. Testar cobranças
    print("\n📤 5. Testando APIs de Cobranças")
    test_api_endpoint('/cobrancas/')
    test_api_endpoint('/cobrancas/cobrancas-recentes/')
    test_api_endpoint('/cobrancas/cobrancas-por-status/')
    
    # 6. Testar configurações
    print("\n⚙️ 6. Testando Configurações")
    test_api_endpoint('/configuracoes/')
    
    # 7. Testar templates
    print("\n📝 7. Testando Templates")
    test_api_endpoint('/templates/')

if __name__ == "__main__":
    print("🧪 Iniciando testes das APIs de Cobrança")
    print("=" * 50)
    
    test_cobranca_apis()
    
    print("\n✅ Testes concluídos!")
    print("\n📝 URLs testadas:")
    print(f"- Base: {API_BASE}")
    print(f"- Estatísticas: {API_BASE}/geral/estatisticas/")
    print(f"- Boletos: {API_BASE}/boletos/")
    print(f"- Pagamentos: {API_BASE}/pagamentos/")
    print(f"- Cobranças: {API_BASE}/cobrancas/")

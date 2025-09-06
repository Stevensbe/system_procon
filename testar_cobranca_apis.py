#!/usr/bin/env python3
"""
Script para testar as APIs do módulo de Cobrança
"""

import requests
import json
from datetime import datetime, timedelta

# Configurações
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/cobranca"

# Headers para autenticação (você precisará de um token válido)
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_AQUI'  # Substitua pelo token real
}

def test_api_endpoint(endpoint, method='GET', data=None):
    """Testa um endpoint da API"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        
        print(f"\n🔗 {method} {endpoint}")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
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
    test_api_endpoint('/estatisticas/')
    
    # 2. Testar lista de processos
    print("\n📋 2. Testando Lista de Processos")
    test_api_endpoint('/processos/')
    
    # 3. Testar boletos
    print("\n💰 3. Testando APIs de Boletos")
    test_api_endpoint('/boletos/')
    test_api_endpoint('/boletos/dashboard/')
    test_api_endpoint('/boletos/boletos-por-status/')
    test_api_endpoint('/boletos/boletos-vencidos/')
    test_api_endpoint('/boletos/boletos-recentes/')
    
    # 4. Testar criação de boleto
    print("\n➕ 4. Testando Criação de Boleto")
    boleto_data = {
        "numero": "BOL2025001",
        "tipo": 1,  # ID do tipo de boleto
        "status": "pendente",
        "valor": "1500.00",
        "vencimento": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
        "emissao": datetime.now().strftime('%Y-%m-%d'),
        "devedor": "Empresa Teste LTDA",
        "documento": "12345678000199",
        "tipo_documento": "cnpj",
        "endereco": "Rua Teste, 123",
        "cidade": "Manaus",
        "estado": "AM",
        "cep": "69000-000",
        "telefone": "(92) 99999-9999",
        "email": "teste@empresa.com",
        "banco": 1,  # ID do banco
        "agencia": "0001",
        "conta": "123456-7",
        "carteira": "17",
        "nosso_numero": "00000000001",
        "codigo_barras": "00000000000000000000000000000000000000000000",
        "linha_digitavel": "00000.00000 00000.000000 00000.000000 0 00000000000000",
        "descricao": "Multa por infração administrativa",
        "observacoes": "Boleto de teste",
        "multa_atraso": "2.00",
        "juros_mora": "1.00",
        "desconto": "0.00"
    }
    test_api_endpoint('/boletos/', method='POST', data=boleto_data)
    
    # 5. Testar pagamentos
    print("\n💳 5. Testando APIs de Pagamentos")
    test_api_endpoint('/pagamentos/')
    test_api_endpoint('/pagamentos/pagamentos-recentes/')
    test_api_endpoint('/pagamentos/pagamentos-por-mes/')
    
    # 6. Testar remessas
    print("\n📤 6. Testando APIs de Remessas")
    test_api_endpoint('/remessas/')
    test_api_endpoint('/remessas/remessas-recentes/')
    test_api_endpoint('/remessas/remessas-por-status/')
    
    # 7. Testar tipos de boleto
    print("\n🏷️ 7. Testando Tipos de Boleto")
    test_api_endpoint('/tipos-boleto/')
    
    # 8. Testar bancos
    print("\n🏦 8. Testando Bancos")
    test_api_endpoint('/bancos/')

def test_without_auth():
    """Testa as APIs sem autenticação (para verificar se estão funcionando)"""
    print("🔓 Testando APIs sem autenticação")
    print("=" * 50)
    
    # Testar endpoints básicos
    test_api_endpoint('/estatisticas/', headers={})
    test_api_endpoint('/processos/', headers={})
    test_api_endpoint('/boletos/', headers={})
    test_api_endpoint('/pagamentos/', headers={})
    test_api_endpoint('/remessas/', headers={})

if __name__ == "__main__":
    print("🧪 Iniciando testes das APIs de Cobrança")
    print("=" * 50)
    
    # Primeiro testar sem autenticação
    test_without_auth()
    
    # Depois testar com autenticação (se tiver token)
    print("\n" + "=" * 50)
    print("🔐 Testando com autenticação")
    print("⚠️  Nota: Configure um token válido no script para testar com autenticação")
    
    # Descomente a linha abaixo quando tiver um token válido
    # test_cobranca_apis()
    
    print("\n✅ Testes concluídos!")
    print("\n📝 Para testar com autenticação:")
    print("1. Obtenha um token de autenticação")
    print("2. Substitua 'SEU_TOKEN_AQUI' no script")
    print("3. Descomente a linha 'test_cobranca_apis()'")
    print("4. Execute novamente o script")

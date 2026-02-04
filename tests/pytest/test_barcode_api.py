#!/usr/bin/env python3
"""
Script de teste para a API de código de barras
Testa a funcionalidade completa de busca e criação de produtos
"""

import requests
import json
import time

# Configurações
BASE_URL = "http://localhost:8000"
API_BARCODE_URL = f"{BASE_URL}/api/barcode"
API_PRODUTO_CRIAR_URL = f"{BASE_URL}/api/produtos/criar"

def test_barcode_api():
    """Testa a API de código de barras"""
    print("🧪 TESTANDO API DE CÓDIGO DE BARRAS")
    print("=" * 50)
    
    # Códigos de teste
    codigos_teste = [
        "7891234567890",  # Código brasileiro genérico
        "3017620422003",  # Código real (Nutella)
        "7891000100103",  # Código brasileiro (Coca-Cola)
        "7891234567891",  # Código inexistente
    ]
    
    for codigo in codigos_teste:
        print(f"\n📱 Testando código: {codigo}")
        print("-" * 30)
        
        try:
            # Testar busca
            response = requests.get(f"{API_BARCODE_URL}/{codigo}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    produto = data.get('produto', {})
                    source = data.get('source', 'unknown')
                    
                    print(f"✅ Sucesso! Fonte: {source}")
                    print(f"   Nome: {produto.get('nome', 'N/A')}")
                    print(f"   Especificação: {produto.get('especificacao', 'N/A')[:100]}...")
                    print(f"   Unidade: {produto.get('unidade_medida', 'N/A')}")
                    print(f"   Preço: R$ {produto.get('preco_referencia', 'N/A')}")
                    
                    # Testar criação se for produto externo
                    if source in ['external', 'generic']:
                        test_criar_produto(produto)
                else:
                    print(f"❌ Erro: {data.get('error', 'Erro desconhecido')}")
            else:
                print(f"❌ Erro HTTP: {response.status_code}")
                print(f"   Resposta: {response.text}")
                
        except requests.exceptions.Timeout:
            print("⏰ Timeout - API demorou muito para responder")
        except requests.exceptions.ConnectionError:
            print("🔌 Erro de conexão - Verifique se o servidor está rodando")
        except Exception as e:
            print(f"❌ Erro inesperado: {str(e)}")
        
        time.sleep(1)  # Pausa entre requisições

def test_criar_produto(produto):
    """Testa a criação de produto via API"""
    print("   🔄 Testando criação de produto...")
    
    try:
        dados_produto = {
            'nome': produto.get('nome', 'Produto Teste'),
            'codigo_barras': produto.get('codigo_barras', '123456789'),
            'especificacao': produto.get('especificacao', 'Especificação de teste'),
            'unidade_medida': produto.get('unidade_medida', 'un'),
            'preco_referencia': produto.get('preco_referencia', 0),
            'classificacao_risco': produto.get('classificacao_risco', 'baixo'),
            'controlado_anvisa': produto.get('controlado_anvisa', False),
            'tem_validade': produto.get('tem_validade', False),
            'condicoes_armazenamento': produto.get('condicoes_armazenamento', '')
        }
        
        response = requests.post(
            API_PRODUTO_CRIAR_URL,
            json=dados_produto,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("   ✅ Produto criado com sucesso!")
            else:
                print(f"   ❌ Erro ao criar produto: {data.get('error')}")
        else:
            print(f"   ❌ Erro HTTP: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Erro ao criar produto: {str(e)}")

def test_api_endpoints():
    """Testa se os endpoints estão acessíveis"""
    print("\n🔍 TESTANDO ENDPOINTS")
    print("=" * 30)
    
    endpoints = [
        f"{BASE_URL}/api/",
        f"{BASE_URL}/api/produtos/",
        f"{API_BARCODE_URL}/123456789/",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(endpoint, timeout=5)
            print(f"✅ {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Erro: {str(e)}")

def main():
    """Função principal"""
    print("🚀 INICIANDO TESTES DA API DE CÓDIGO DE BARRAS")
    print("=" * 60)
    
    # Verificar se o servidor está rodando
    try:
        response = requests.get(f"{BASE_URL}/api/", timeout=5)
        print("✅ Servidor Django está rodando")
    except:
        print("❌ Servidor Django não está rodando!")
        print("   Execute: python manage.py runserver 0.0.0.0:8000")
        return
    
    # Testar endpoints
    test_api_endpoints()
    
    # Testar API de código de barras
    test_barcode_api()
    
    print("\n" + "=" * 60)
    print("🏁 TESTES CONCLUÍDOS")
    print("\n📋 RESUMO:")
    print("- API de código de barras: /api/barcode/<codigo>/")
    print("- API de criação de produto: /api/produtos/criar/")
    print("- Funcionalidades testadas:")
    print("  • Busca interna de produtos")
    print("  • Busca externa (Open Food Facts)")
    print("  • Criação de produtos genéricos")
    print("  • Criação de produtos no banco interno")

if __name__ == "__main__":
    main()

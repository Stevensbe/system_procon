#!/usr/bin/env python3
"""
Script de teste para verificar o endpoint de remessas
"""

import requests
import json

# Configurações
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/cobranca"

def test_remessa_endpoints():
    """Testa os endpoints de remessas"""
    
    print("🧪 Testando endpoints de Remessas...")
    print("=" * 50)
    
    # 1. Testar listagem de remessas
    print("\n1. Testando GET /api/cobranca/remessas/")
    try:
        response = requests.get(f"{API_URL}/remessas/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! {len(data.get('results', []))} remessas encontradas")
        else:
            print(f"❌ Erro: {response.text}")
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
    
    # 2. Testar criação de remessa
    print("\n2. Testando POST /api/cobranca/remessas/")
    try:
        # Primeiro, buscar um banco disponível
        bancos_response = requests.get(f"{API_URL}/bancos/")
        if bancos_response.status_code == 200:
            bancos = bancos_response.json()
            if bancos.get('results'):
                banco_id = bancos['results'][0]['id']
                
                remessa_data = {
                    "banco": banco_id,
                    "tipo": "remessa",
                    "observacoes": "Teste de criação via API"
                }
                
                response = requests.post(
                    f"{API_URL}/remessas/",
                    json=remessa_data,
                    headers={'Content-Type': 'application/json'}
                )
                print(f"Status: {response.status_code}")
                if response.status_code in [200, 201]:
                    data = response.json()
                    remessa_id = data.get('id')
                    print(f"✅ Remessa criada com sucesso! ID: {remessa_id}")
                    
                    # 3. Testar geração de remessa
                    print(f"\n3. Testando POST /api/cobranca/remessas/{remessa_id}/gerar/")
                    try:
                        gerar_response = requests.post(f"{API_URL}/remessas/{remessa_id}/gerar/")
                        print(f"Status: {gerar_response.status_code}")
                        if gerar_response.status_code == 200:
                            gerar_data = gerar_response.json()
                            print(f"✅ Remessa gerada com sucesso!")
                            print(f"   Arquivo: {gerar_data.get('arquivo', 'N/A')}")
                        else:
                            print(f"❌ Erro na geração: {gerar_response.text}")
                    except Exception as e:
                        print(f"❌ Erro de conexão na geração: {e}")
                else:
                    print(f"❌ Erro na criação: {response.text}")
            else:
                print("❌ Nenhum banco encontrado para teste")
        else:
            print(f"❌ Erro ao buscar bancos: {bancos_response.text}")
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
    
    # 4. Testar listagem de bancos
    print("\n4. Testando GET /api/cobranca/bancos/")
    try:
        response = requests.get(f"{API_URL}/bancos/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! {len(data.get('results', []))} bancos encontrados")
        else:
            print(f"❌ Erro: {response.text}")
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")

if __name__ == "__main__":
    test_remessa_endpoints()

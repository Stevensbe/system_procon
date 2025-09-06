#!/usr/bin/env python3
"""
Script para testar todos os endpoints da API de Protocolo
"""

import requests
import json
from datetime import datetime

# Configurações
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/protocolo"

def test_endpoint(method, endpoint, data=None, description=""):
    """Testa um endpoint específico"""
    url = f"{API_BASE}{endpoint}"
    
    print(f"\n{'='*60}")
    print(f"Testando: {method.upper()} {endpoint}")
    print(f"URL: {url}")
    if description:
        print(f"Descrição: {description}")
    print(f"{'='*60}")
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, timeout=10)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, timeout=10)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, timeout=10)
        elif method.upper() == 'PATCH':
            response = requests.patch(url, json=data, timeout=10)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, timeout=10)
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code < 400:
            print("✅ SUCESSO")
            try:
                print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
            except:
                print(f"Response: {response.text}")
        else:
            print("❌ ERRO")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao servidor")
        print("Certifique-se de que o servidor Django está rodando em http://localhost:8000")
    except requests.exceptions.Timeout:
        print("❌ ERRO: Timeout na requisição")
    except Exception as e:
        print(f"❌ ERRO: {str(e)}")
    
    return response if 'response' in locals() else None

def main():
    print("🧪 TESTE COMPLETO DOS ENDPOINTS DA API DE PROTOCOLO")
    print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    
    # Teste de conectividade básica
    print("\n🔍 Testando conectividade básica...")
    try:
        response = requests.get(f"{BASE_URL}/health-check/", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor Django está rodando")
        else:
            print("⚠️ Servidor respondeu mas com status inesperado")
    except:
        print("❌ Servidor Django não está rodando")
        print("Execute: python manage.py runserver")
        return
    
    # === TESTES DOS ENDPOINTS DE PROTOCOLO ===
    
    # 1. Listar protocolos
    test_endpoint('GET', '/protocolos/', description="Listar todos os protocolos")
    
    # 2. Listar tipos de protocolo
    test_endpoint('GET', '/tipos/', description="Listar tipos de protocolo")
    
    # 3. Listar status de protocolo
    test_endpoint('GET', '/status/', description="Listar status de protocolo")
    
    # 4. Criar um protocolo de teste
    protocolo_teste = {
        "numero": "TEST-2024-001",
        "tipo": "Reclamação",
        "assunto": "Teste de API",
        "descricao": "Protocolo criado para teste da API",
        "interessado": "Teste API",
        "cpf_cnpj": "12345678901",
        "email": "teste@api.com",
        "telefone": "(11) 99999-9999",
        "status": "Protocolado",
        "prioridade": "Normal",
        "data_protocolo": "2024-01-15",
        "prazo_resposta": "2024-02-15"
    }
    
    response = test_endpoint('POST', '/protocolos/', data=protocolo_teste, description="Criar protocolo de teste")
    
    # Se conseguiu criar, testar operações com o ID
    if response and response.status_code in [200, 201]:
        try:
            protocolo_data = response.json()
            protocolo_id = protocolo_data.get('id')
            
            if protocolo_id:
                print(f"\n📋 Protocolo criado com ID: {protocolo_id}")
                
                # 5. Buscar protocolo específico
                test_endpoint('GET', f'/protocolos/{protocolo_id}/', description=f"Buscar protocolo ID {protocolo_id}")
                
                # 6. Atualizar protocolo
                dados_atualizacao = {
                    "assunto": "Teste de API - Atualizado",
                    "descricao": "Protocolo atualizado via API"
                }
                test_endpoint('PATCH', f'/protocolos/{protocolo_id}/', data=dados_atualizacao, description=f"Atualizar protocolo ID {protocolo_id}")
                
                # 7. Listar documentos do protocolo
                test_endpoint('GET', f'/protocolos/{protocolo_id}/documentos/', description=f"Listar documentos do protocolo {protocolo_id}")
                
                # 8. Listar tramitações do protocolo
                test_endpoint('GET', f'/protocolos/{protocolo_id}/tramitacoes/', description=f"Listar tramitações do protocolo {protocolo_id}")
                
                # 9. Listar alertas do protocolo
                test_endpoint('GET', f'/protocolos/{protocolo_id}/alertas/', description=f"Listar alertas do protocolo {protocolo_id}")
                
                # 10. Excluir protocolo de teste
                test_endpoint('DELETE', f'/protocolos/{protocolo_id}/', description=f"Excluir protocolo ID {protocolo_id}")
                
        except Exception as e:
            print(f"❌ Erro ao processar resposta: {e}")
    
    # === TESTES DE ENDPOINTS ESPECÍFICOS ===
    
    # 11. Dashboard e estatísticas
    test_endpoint('GET', '/dashboard/estatisticas/', description="Obter estatísticas do dashboard")
    
    # 12. Configurações
    test_endpoint('GET', '/configuracoes/', description="Obter configurações do protocolo")
    
    # 13. Busca avançada
    dados_busca = {
        "termo": "teste",
        "tipo": "Reclamação",
        "status": "Protocolado"
    }
    test_endpoint('POST', '/busca-avancada/', data=dados_busca, description="Busca avançada de protocolos")
    
    # 14. Ações em lote
    dados_lote = {
        "ids": [1, 2, 3],
        "acao": "tramitar",
        "dados": {"departamento": "Fiscalização"}
    }
    test_endpoint('POST', '/acoes-lote/', data=dados_lote, description="Ações em lote")
    
    print(f"\n{'='*60}")
    print("🏁 TESTE CONCLUÍDO")
    print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

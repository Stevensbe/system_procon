#!/usr/bin/env python3
"""
Script para testar todas as APIs do sistema
"""

import requests
import json

def testar_api(url, nome_api):
    """Testa uma API específica"""
    try:
        print(f"🧪 Testando {nome_api}: {url}")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ {nome_api}: OK (Status: {response.status_code})")
            try:
                data = response.json()
                if isinstance(data, dict):
                    if 'count' in data:
                        print(f"   📊 Total de registros: {data['count']}")
                    elif 'total' in data:
                        print(f"   📊 Total: {data['total']}")
                    elif 'results' in data:
                        print(f"   📊 Resultados: {len(data['results'])}")
                elif isinstance(data, list):
                    print(f"   📊 Resultados: {len(data)}")
            except:
                print(f"   📄 Resposta: {response.text[:100]}...")
        else:
            print(f"❌ {nome_api}: ERRO (Status: {response.status_code})")
            print(f"   📄 Resposta: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ {nome_api}: ERRO - {str(e)}")
    
    print("-" * 60)

def main():
    """Testa todas as APIs principais"""
    base_url = "http://localhost:8000"
    
    print("🚀 TESTANDO TODAS AS APIs DO SISTEMA")
    print("=" * 60)
    
    # APIs da Caixa de Entrada
    apis_caixa_entrada = [
        ("/api/caixa-entrada/api/estatisticas/", "Estatísticas Caixa Entrada"),
        ("/api/caixa-entrada/api/documentos/", "Documentos Caixa Entrada"),
        ("/api/caixa-entrada/api/documentos/?setor_destino=FISCALIZACAO", "Documentos Fiscalização"),
        ("/api/caixa-entrada/api/documentos/?tipo_documento=DENUNCIA", "Documentos Denúncias"),
        ("/api/caixa-entrada/api/documentos/?tipo_documento=PETICAO", "Documentos Petições"),
    ]
    
    print("📬 CAIXA DE ENTRADA")
    for endpoint, nome in apis_caixa_entrada:
        testar_api(f"{base_url}{endpoint}", nome)
    
    # APIs do Portal do Cidadão
    apis_portal = [
        ("/api/portal/denuncia/", "API Denúncia Portal"),
        ("/api/portal/peticao-juridica/", "API Petição Portal"),
    ]
    
    print("🌐 PORTAL DO CIDADÃO")
    for endpoint, nome in apis_portal:
        testar_api(f"{base_url}{endpoint}", nome)
    
    # APIs de Peticionamento
    apis_peticionamento = [
        ("/api/peticionamento/", "API Peticionamento"),
        ("/api/peticionamento/tipos/", "Tipos de Petição"),
    ]
    
    print("📋 PETICIONAMENTO")
    for endpoint, nome in apis_peticionamento:
        testar_api(f"{base_url}{endpoint}", nome)
    
    # APIs de Fiscalização
    apis_fiscalizacao = [
        ("/api/", "API Fiscalização"),
        ("/api/infracoes/", "Infrações"),
    ]
    
    print("🔍 FISCALIZAÇÃO")
    for endpoint, nome in apis_fiscalizacao:
        testar_api(f"{base_url}{endpoint}", nome)
    
    # APIs de Jurídico
    apis_juridico = [
        ("/api/juridico/", "API Jurídico"),
    ]
    
    print("⚖️ JURÍDICO")
    for endpoint, nome in apis_juridico:
        testar_api(f"{base_url}{endpoint}", nome)
    
    # APIs de Protocolo
    apis_protocolo = [
        ("/api/protocolo/", "API Protocolo"),
    ]
    
    print("📝 PROTOCOLO")
    for endpoint, nome in apis_protocolo:
        testar_api(f"{base_url}{endpoint}", nome)
    
    print("✅ TESTE COMPLETO!")

if __name__ == "__main__":
    main()

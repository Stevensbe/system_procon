#!/usr/bin/env python3
"""
Script para testar se as APIs das caixas estão funcionando
"""

import requests
import json

def testar_api_caixa_denuncias():
    """Testa a API da caixa de denúncias"""
    
    print("🧪 TESTANDO API CAIXA DE DENÚNCIAS")
    print("=" * 50)
    
    # URL da API
    url = "http://localhost:8000/api/caixa-entrada/documentos/"
    
    # Parâmetros para buscar denúncias da fiscalização
    params = {
        'setor': 'FISCALIZACAO',
        'tipo_documento': 'DENUNCIA',
        'page': 1,
        'page_size': 10
    }
    
    try:
        print(f"📡 Fazendo requisição para: {url}")
        print(f"📋 Parâmetros: {params}")
        
        response = requests.get(url, params=params, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📊 Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API funcionando!")
            print(f"📊 Total de documentos: {data.get('count', 0)}")
            print(f"📊 Documentos na página: {len(data.get('results', []))}")
            
            # Mostrar alguns documentos
            documentos = data.get('results', [])
            for i, doc in enumerate(documentos[:3]):
                print(f"\n📄 Documento {i+1}:")
                print(f"   Protocolo: {doc.get('numero_protocolo')}")
                print(f"   Assunto: {doc.get('assunto')}")
                print(f"   Setor: {doc.get('setor_destino')}")
                print(f"   Status: {doc.get('status')}")
                
        else:
            print(f"❌ Erro na API: {response.status_code}")
            print(f"📄 Resposta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao servidor")
        print("💡 Verifique se o backend está rodando em http://localhost:8000")
    except requests.exceptions.Timeout:
        print("❌ ERRO: Timeout na requisição")
    except Exception as e:
        print(f"❌ ERRO: {e}")

def testar_api_estatisticas():
    """Testa a API de estatísticas"""
    
    print("\n🧪 TESTANDO API ESTATÍSTICAS")
    print("=" * 50)
    
    # URL da API
    url = "http://localhost:8000/api/caixa-entrada/estatisticas/"
    
    # Parâmetros para estatísticas da fiscalização
    params = {
        'setor': 'FISCALIZACAO',
        'tipo_documento': 'DENUNCIA'
    }
    
    try:
        print(f"📡 Fazendo requisição para: {url}")
        print(f"📋 Parâmetros: {params}")
        
        response = requests.get(url, params=params, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API de estatísticas funcionando!")
            print(f"📊 Dados: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"❌ Erro na API: {response.status_code}")
            print(f"📄 Resposta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao servidor")
    except requests.exceptions.Timeout:
        print("❌ ERRO: Timeout na requisição")
    except Exception as e:
        print(f"❌ ERRO: {e}")

def testar_api_geral():
    """Testa se o servidor está respondendo"""
    
    print("\n🧪 TESTANDO SERVIDOR GERAL")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"✅ Servidor respondendo! Status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Servidor não está rodando em http://localhost:8000")
    except Exception as e:
        print(f"❌ Erro: {e}")

def main():
    """Função principal"""
    print("🚀 INICIANDO TESTES DAS APIS")
    print("=" * 60)
    
    # Testar se o servidor está rodando
    testar_api_geral()
    
    # Testar API de estatísticas
    testar_api_estatisticas()
    
    # Testar API da caixa de denúncias
    testar_api_caixa_denuncias()
    
    print("\n📊 RESUMO DOS TESTES")
    print("=" * 30)
    print("✅ Se todas as APIs estiverem funcionando, o problema pode estar no frontend")
    print("❌ Se alguma API falhar, o problema está no backend")

if __name__ == "__main__":
    main()

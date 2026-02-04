#!/usr/bin/env python
"""
Script para testar o endpoint da API de denúncia
"""

import requests
import json

def testar_api_denuncia():
    """Testa o endpoint da API de denúncia"""
    
    print("🧪 Testando API de denúncia...")
    
    # URL do endpoint
    url = "http://localhost:8000/api/portal/api/denuncia/"
    
    # Dados de teste
    dados_denuncia = {
        "empresa_denunciada": "Empresa Teste API",
        "cnpj_empresa": "12.345.678/0001-90",
        "endereco_empresa": "Rua API, 123 - Centro",
        "telefone_empresa": "(92) 3234-5678",
        "email_empresa": "contato@empresatesteapi.com.br",
        "descricao_fatos": "Teste de cobrança indevida via API para verificar integração frontend-backend.",
        "tipo_infracao": "cobranca_indevida",
        "nome_denunciante": "Maria da Silva API",
        "cpf_cnpj": "987.654.321-00",
        "email": "maria.api@email.com",
        "telefone": "(92) 9 8888-8888",
        "denuncia_anonima": False
    }
    
    try:
        # Fazer requisição POST
        print(f"📤 Enviando POST para: {url}")
        print(f"📦 Dados: {json.dumps(dados_denuncia, indent=2)}")
        
        response = requests.post(url, json=dados_denuncia, timeout=10)
        
        print(f"📡 Status Code: {response.status_code}")
        print(f"📋 Headers: {dict(response.headers)}")
        
        if response.status_code == 200 or response.status_code == 201:
            print("✅ SUCESSO! Denúncia enviada com sucesso")
            response_data = response.json()
            print(f"📄 Resposta: {json.dumps(response_data, indent=2)}")
            return True
        else:
            print(f"❌ ERRO! Status {response.status_code}")
            print(f"📄 Resposta: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao servidor")
        print("🔧 Verifique se o Django está rodando em http://localhost:8000")
        return False
    except requests.exceptions.Timeout:
        print("❌ ERRO: Timeout na requisição")
        return False
    except Exception as e:
        print(f"❌ ERRO INESPERADO: {e}")
        return False

def testar_denuncia_anonima():
    """Testa denúncia anônima"""
    
    print("\n🔒 Testando denúncia anônima...")
    
    url = "http://localhost:8000/api/portal/api/denuncia/"
    
    dados_anonima = {
        "empresa_denunciada": "Empresa Anônima API",
        "cnpj_empresa": "98.765.432/0001-10",
        "descricao_fatos": "Teste de denúncia anônima via API para verificar proteção de dados.",
        "tipo_infracao": "pratica_abusiva",
        "denuncia_anonima": True,
        "motivo_anonimato": "Medo de retaliação"
    }
    
    try:
        response = requests.post(url, json=dados_anonima, timeout=10)
        
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200 or response.status_code == 201:
            print("✅ SUCESSO! Denúncia anônima enviada")
            response_data = response.json()
            print(f"📄 Resposta: {json.dumps(response_data, indent=2)}")
            return True
        else:
            print(f"❌ ERRO! Status {response.status_code}")
            print(f"📄 Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False

def testar_endpoint_get():
    """Testa se o endpoint responde ao GET (deve dar erro 405)"""
    
    print("\n🔍 Testando GET no endpoint (deve dar 405)...")
    
    url = "http://localhost:8000/api/portal/api/denuncia/"
    
    try:
        response = requests.get(url, timeout=5)
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 405:
            print("✅ CORRETO! GET não é permitido (405 Method Not Allowed)")
            return True
        else:
            print(f"⚠️  Inesperado: Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False

def main():
    """Função principal"""
    
    print("=" * 60)
    print("🧪 TESTE DA API DE DENÚNCIA")
    print("=" * 60)
    
    # Testar se endpoint existe
    sucesso_get = testar_endpoint_get()
    
    # Testar denúncia normal
    sucesso_normal = testar_api_denuncia()
    
    # Testar denúncia anônima
    sucesso_anonima = testar_denuncia_anonima()
    
    print("\n" + "=" * 60)
    print("📊 RESULTADO DOS TESTES:")
    print(f"   🔍 Endpoint existe: {'✅' if sucesso_get else '❌'}")
    print(f"   📝 Denúncia normal: {'✅' if sucesso_normal else '❌'}")
    print(f"   🔒 Denúncia anônima: {'✅' if sucesso_anonima else '❌'}")
    
    if sucesso_normal and sucesso_anonima:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("💡 O problema não está na API do Django.")
        print("🔧 Verifique a configuração do frontend (Axios/CORS).")
    else:
        print("❌ ALGUNS TESTES FALHARAM!")
        print("🔧 Verifique se o servidor Django está rodando.")
    print("=" * 60)

if __name__ == "__main__":
    main()
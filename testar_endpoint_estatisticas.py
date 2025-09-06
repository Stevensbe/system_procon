#!/usr/bin/env python3
"""
Teste do endpoint de estatísticas da caixa de entrada
"""

import requests
import json

def testar_endpoint():
    print("🧪 TESTANDO ENDPOINT DE ESTATÍSTICAS")
    print("="*50)
    
    try:
        # Testar endpoint de estatísticas
        url = "http://localhost:8000/api/caixa-entrada/estatisticas/"
        print(f"📡 Testando: {url}")
        
        response = requests.get(url, timeout=10)
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCESSO! Endpoint funcionando!")
            print(f"📈 Estatísticas recebidas:")
            print(f"   - Total: {data.get('total', 0)}")
            print(f"   - Não lidos: {data.get('nao_lidos', 0)}")
            print(f"   - Em análise: {data.get('em_analise', 0)}")
            print(f"   - Encaminhados: {data.get('encaminhados', 0)}")
            return True
        else:
            print(f"❌ ERRO: Status {response.status_code}")
            print(f"📄 Resposta: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar ao servidor")
        print("💡 Verifique se o backend está rodando em http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False

if __name__ == "__main__":
    testar_endpoint()

#!/usr/bin/env python3
"""
Script para testar as APIs do módulo de Cobrança com autenticação JWT
"""

import requests
import json
from datetime import datetime

# Configurações
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/cobranca"

# Credenciais de teste
CREDENCIAIS = {
    'username': 'admin',
    'password': 'admin123'  # Ajuste conforme sua senha
}

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def login(self):
        """Faz login e obtém token JWT"""
        print("🔐 Fazendo login...")
        
        try:
            # Tentar login
            response = self.session.post(
                f"{BASE_URL}/auth/login/",
                json=CREDENCIAIS,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access')
                self.headers['Authorization'] = f'Bearer {self.token}'
                print("✅ Login realizado com sucesso!")
                print(f"🔑 Token obtido: {self.token[:50]}...")
                return True
            else:
                print(f"❌ Erro no login: {response.status_code}")
                print(f"📄 Resposta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro na requisição de login: {e}")
            return False
    
    def test_api_endpoint(self, endpoint, method='GET', data=None):
        """Testa um endpoint da API com autenticação"""
        url = f"{API_BASE}{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=self.headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=self.headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=self.headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=self.headers)
            
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
    
    def test_cobranca_apis(self):
        """Testa todas as APIs de cobrança com autenticação"""
        print("🚀 Testando APIs do Módulo de Cobrança com Autenticação")
        print("=" * 60)
        
        # 1. Testar estatísticas gerais
        print("\n📊 1. Testando Estatísticas Gerais")
        self.test_api_endpoint('/geral/estatisticas/')
        
        # 2. Testar lista de processos
        print("\n📋 2. Testando Lista de Processos")
        self.test_api_endpoint('/geral/processos/')
        
        # 3. Testar boletos
        print("\n💰 3. Testando APIs de Boletos")
        self.test_api_endpoint('/boletos/')
        self.test_api_endpoint('/boletos/dashboard/')
        self.test_api_endpoint('/boletos/boletos-por-status/')
        self.test_api_endpoint('/boletos/boletos-vencidos/')
        self.test_api_endpoint('/boletos/boletos-recentes/')
        
        # 4. Testar pagamentos
        print("\n💳 4. Testando APIs de Pagamentos")
        self.test_api_endpoint('/pagamentos/')
        self.test_api_endpoint('/pagamentos/pagamentos-recentes/')
        self.test_api_endpoint('/pagamentos/pagamentos-por-mes/')
        
        # 5. Testar cobranças
        print("\n📤 5. Testando APIs de Cobranças")
        self.test_api_endpoint('/cobrancas/')
        self.test_api_endpoint('/cobrancas/cobrancas-recentes/')
        self.test_api_endpoint('/cobrancas/cobrancas-por-status/')
        
        # 6. Testar configurações
        print("\n⚙️ 6. Testando Configurações")
        self.test_api_endpoint('/configuracoes/')
        
        # 7. Testar templates
        print("\n📝 7. Testando Templates")
        self.test_api_endpoint('/templates/')
    
    def test_create_data(self):
        """Testa criação de dados"""
        print("\n🆕 8. Testando Criação de Dados")
        
        # Testar criação de boleto
        boleto_data = {
            'numero': 'BOL001/2024',
            'valor_total': 1500.00,
            'data_vencimento': '2024-12-31',
            'status': 'PENDENTE',
            'observacoes': 'Boleto de teste criado via API'
        }
        
        self.test_api_endpoint('/boletos/', method='POST', data=boleto_data)
        
        # Testar criação de pagamento
        pagamento_data = {
            'valor_pago': 1500.00,
            'data_pagamento': datetime.now().strftime('%Y-%m-%d'),
            'forma_pagamento': 'PIX',
            'observacoes': 'Pagamento de teste via API'
        }
        
        self.test_api_endpoint('/pagamentos/', method='POST', data=pagamento_data)

def main():
    print("🧪 Iniciando testes das APIs de Cobrança com Autenticação")
    print("=" * 60)
    
    tester = APITester()
    
    # Fazer login
    if tester.login():
        # Testar APIs
        tester.test_cobranca_apis()
        
        # Testar criação de dados
        tester.test_create_data()
        
        print("\n✅ Testes concluídos!")
        print("\n📝 URLs testadas:")
        print(f"- Base: {API_BASE}")
        print(f"- Estatísticas: {API_BASE}/geral/estatisticas/")
        print(f"- Boletos: {API_BASE}/boletos/")
        print(f"- Pagamentos: {API_BASE}/pagamentos/")
        print(f"- Cobranças: {API_BASE}/cobrancas/")
    else:
        print("❌ Não foi possível fazer login. Verifique as credenciais.")

if __name__ == "__main__":
    main()

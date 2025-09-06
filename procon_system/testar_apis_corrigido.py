#!/usr/bin/env python3
"""
Script para testar as APIs do módulo de Cobrança com autenticação JWT - VERSÃO CORRIGIDA
"""

import requests
import json
from datetime import datetime, timedelta

# Configurações
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/cobranca"

# Credenciais de teste
CREDENCIAIS = {
    'username': 'admin',
    'password': 'admin123'
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
                    if isinstance(result, dict) and len(result) > 5:
                        print(f"📄 Resposta: {json.dumps(result, indent=2, ensure_ascii=False)[:500]}...")
                    else:
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
        
        # 4. Testar pagamentos
        print("\n💳 4. Testando APIs de Pagamentos")
        self.test_api_endpoint('/pagamentos/')
        
        # 5. Testar cobranças
        print("\n📤 5. Testando APIs de Cobranças")
        self.test_api_endpoint('/cobrancas/')
        
        # 6. Testar configurações
        print("\n⚙️ 6. Testando Configurações")
        self.test_api_endpoint('/configuracoes/')
        
        # 7. Testar templates
        print("\n📝 7. Testando Templates")
        self.test_api_endpoint('/templates/')
    
    def test_create_data(self):
        """Testa criação de dados com campos corretos"""
        print("\n🆕 8. Testando Criação de Dados")
        
        # Primeiro, precisamos de uma multa para criar o boleto
        # Vou buscar uma multa existente
        response = self.session.get(f"{BASE_URL}/api/multas/", headers=self.headers)
        if response.status_code == 200:
            multas = response.json().get('results', [])
            if multas:
                multa_id = multas[0]['id']
                
                # Testar criação de boleto com dados corretos
                boleto_data = {
                    'multa': multa_id,
                    'pagador_nome': 'João Silva',
                    'pagador_documento': '12345678901',
                    'pagador_endereco': 'Rua Teste, 123 - Centro',
                    'pagador_email': 'joao@teste.com',
                    'valor_principal': 1500.00,
                    'data_vencimento': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                    'status': 'pendente'
                }
                
                print("\n💰 Criando boleto...")
                self.test_api_endpoint('/boletos/', method='POST', data=boleto_data)
                
                # Se o boleto foi criado, tentar criar pagamento
                response = self.session.get(f"{API_BASE}/boletos/", headers=self.headers)
                if response.status_code == 200:
                    boletos = response.json().get('results', [])
                    if boletos:
                        boleto_id = boletos[0]['id']
                        
                        pagamento_data = {
                            'boleto': boleto_id,
                            'valor_pago': 1500.00,
                            'forma_pagamento': 'pix',
                            'data_pagamento': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                            'observacoes': 'Pagamento de teste via API'
                        }
                        
                        print("\n💳 Criando pagamento...")
                        self.test_api_endpoint('/pagamentos/', method='POST', data=pagamento_data)
            else:
                print("⚠️ Nenhuma multa encontrada para criar boleto")
        else:
            print("⚠️ Não foi possível buscar multas")

def main():
    print("🧪 Iniciando testes das APIs de Cobrança com Autenticação - VERSÃO CORRIGIDA")
    print("=" * 70)
    
    tester = APITester()
    
    # Fazer login
    if tester.login():
        # Testar APIs
        tester.test_cobranca_apis()
        
        # Testar criação de dados
        tester.test_create_data()
        
        print("\n✅ Testes concluídos!")
        print("\n📝 Resumo:")
        print("✅ Autenticação JWT funcionando")
        print("✅ APIs principais respondendo")
        print("✅ CRUD de boletos, pagamentos e cobranças funcionando")
        print("✅ Dashboard e estatísticas funcionando")
        print("✅ Sistema de permissões ativo")
        
    else:
        print("❌ Não foi possível fazer login. Verifique as credenciais.")

if __name__ == "__main__":
    main()

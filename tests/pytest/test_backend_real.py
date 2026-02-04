#!/usr/bin/env python3
"""
Teste Completo do Backend PROCON - Baseado nas URLs Reais
"""

import requests
import json
import sys
from datetime import datetime

# Configurações
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'errors': []
        }
        self.auth_token = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Testa um endpoint específico"""
        self.results['total_tests'] += 1
        
        try:
            url = f"{BASE_URL}{endpoint}"
            
            if headers is None:
                headers = {}
                
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
                
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Metodo HTTP nao suportado: {method}")
                
            if response.status_code == expected_status:
                self.results['passed'] += 1
                self.log(f"OK {method} {endpoint} - Status: {response.status_code}")
                return True, response
            else:
                self.results['failed'] += 1
                error_msg = f"ERRO {method} {endpoint} - Esperado: {expected_status}, Recebido: {response.status_code}"
                self.log(error_msg, "ERROR")
                self.results['errors'].append(error_msg)
                return False, response
                
        except requests.exceptions.RequestException as e:
            self.results['failed'] += 1
            error_msg = f"ERRO {method} {endpoint} - Erro de conexao: {str(e)}"
            self.log(error_msg, "ERROR")
            self.results['errors'].append(error_msg)
            return False, None
        except Exception as e:
            self.results['failed'] += 1
            error_msg = f"ERRO {method} {endpoint} - Erro: {str(e)}"
            self.log(error_msg, "ERROR")
            self.results['errors'].append(error_msg)
            return False, None
    
    def test_health_check(self):
        """Testa endpoints de health check"""
        self.log("Testando Health Check...")
        
        endpoints = [
            ('GET', '/health/'),
            ('GET', '/health-check/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_auth_endpoints(self):
        """Testa endpoints de autenticação"""
        self.log("Testando Autenticacao...")
        
        # Teste de login
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        
        success, response = self.test_endpoint('POST', '/auth/login/', login_data)
        
        if success and response:
            try:
                data = response.json()
                if 'access' in data:
                    self.auth_token = data['access']
                    self.log("Login realizado com sucesso")
            except:
                pass
        
        # Teste de perfil
        self.test_endpoint('GET', '/auth/profile/')
        
        # Teste de endpoint protegido
        self.test_endpoint('GET', '/auth/protected/')
    
    def test_dashboard_endpoints(self):
        """Testa endpoints do dashboard"""
        self.log("Testando Dashboard...")
        
        endpoints = [
            ('GET', '/api/dashboard-stats/'),
            ('GET', '/api/dashboard/graficos/'),
            ('GET', '/api/dashboard/alertas/'),
            ('GET', '/api/dashboard/atividades/'),
            ('GET', '/api/dashboard/cached/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_fiscalizacao_endpoints(self):
        """Testa endpoints de fiscalização"""
        self.log("Testando Fiscalizacao...")
        
        endpoints = [
            ('GET', '/api/infracoes/'),
            ('GET', '/api/processos/'),
            ('GET', '/api/dashboard-stats/'),
            ('GET', '/api/estatisticas-gerais/'),
            ('GET', '/api/bancos/'),
            ('GET', '/api/postos/'),
            ('GET', '/api/supermercados/'),
            ('GET', '/api/diversos/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_protocolo_endpoints(self):
        """Testa endpoints de protocolo"""
        self.log("Testando Protocolo...")
        
        endpoints = [
            ('GET', '/api/protocolo/'),
            ('GET', '/api/protocolo-tramitacao/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_peticionamento_endpoints(self):
        """Testa endpoints de peticionamento"""
        self.log("Testando Peticionamento...")
        
        endpoints = [
            ('GET', '/api/peticionamento/'),
            ('GET', '/api/analise-juridica/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_portal_endpoints(self):
        """Testa endpoints do portal"""
        self.log("Testando Portal...")
        
        endpoints = [
            ('GET', '/api/portal/'),
            ('GET', '/api/denuncia/'),
            ('GET', '/api/peticao-juridica/'),
            ('GET', '/api/tipos-peticao/'),
            ('GET', '/api/acompanhar-processo/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_juridico_endpoints(self):
        """Testa endpoints jurídicos"""
        self.log("Testando Juridico...")
        
        endpoints = [
            ('GET', '/api/juridico/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_cobranca_endpoints(self):
        """Testa endpoints de cobrança"""
        self.log("Testando Cobranca...")
        
        endpoints = [
            ('GET', '/api/cobranca/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_notificacoes_endpoints(self):
        """Testa endpoints de notificações"""
        self.log("Testando Notificacoes...")
        
        endpoints = [
            ('GET', '/api/notificacoes/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_caixa_entrada_endpoints(self):
        """Testa endpoints de caixa entrada"""
        self.log("Testando Caixa Entrada...")
        
        endpoints = [
            ('GET', '/api/caixa-entrada/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_atendimento_endpoints(self):
        """Testa endpoints de atendimento"""
        self.log("Testando Atendimento...")
        
        endpoints = [
            ('GET', '/api/atendimento/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_multas_endpoints(self):
        """Testa endpoints de multas"""
        self.log("Testando Multas...")
        
        endpoints = [
            ('GET', '/api/multas/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_api_docs(self):
        """Testa documentação da API"""
        self.log("Testando Documentacao API...")
        
        endpoints = [
            ('GET', '/api/schema/'),
            ('GET', '/api/docs/'),
            ('GET', '/api/redoc/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def run_all_tests(self):
        """Executa todos os testes"""
        self.log("Iniciando Teste Completo do Backend PROCON")
        self.log("=" * 60)
        
        # Verificar se o servidor está rodando
        try:
            response = requests.get(f"{BASE_URL}/health/", timeout=5)
            if response.status_code == 200:
                self.log("Servidor esta rodando")
                data = response.json()
                self.log(f"Status: {data.get('status', 'N/A')}")
                self.log(f"Service: {data.get('service', 'N/A')}")
            else:
                self.log("Servidor nao esta respondendo corretamente", "ERROR")
                return
        except:
            self.log("Servidor nao esta acessivel", "ERROR")
            return
        
        # Executar todos os testes
        test_methods = [
            self.test_health_check,
            self.test_auth_endpoints,
            self.test_dashboard_endpoints,
            self.test_fiscalizacao_endpoints,
            self.test_protocolo_endpoints,
            self.test_peticionamento_endpoints,
            self.test_portal_endpoints,
            self.test_juridico_endpoints,
            self.test_cobranca_endpoints,
            self.test_notificacoes_endpoints,
            self.test_caixa_entrada_endpoints,
            self.test_atendimento_endpoints,
            self.test_multas_endpoints,
            self.test_api_docs,
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log(f"Erro ao executar {test_method.__name__}: {str(e)}", "ERROR")
                self.results['errors'].append(f"Erro em {test_method.__name__}: {str(e)}")
        
        # Relatório final
        self.log("=" * 60)
        self.log("RELATORIO FINAL")
        self.log(f"Total de testes: {self.results['total_tests']}")
        self.log(f"Sucessos: {self.results['passed']}")
        self.log(f"Falhas: {self.results['failed']}")
        
        if self.results['errors']:
            self.log("\nERROS DETALHADOS:")
            for error in self.results['errors']:
                self.log(f"  - {error}")
        
        success_rate = (self.results['passed'] / self.results['total_tests']) * 100 if self.results['total_tests'] > 0 else 0
        self.log(f"\nTaxa de Sucesso: {success_rate:.1f}%")
        
        if success_rate >= 80:
            self.log("Backend esta FUNCIONAL!")
        elif success_rate >= 60:
            self.log("Backend tem problemas menores")
        else:
            self.log("Backend tem problemas criticos!")

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()

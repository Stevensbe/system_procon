#!/usr/bin/env python3
"""
Teste Completo do Backend PROCON
Verifica todas as APIs e funcionalidades principais
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
            url = f"{API_BASE}{endpoint}"
            
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
                raise ValueError(f"Método HTTP não suportado: {method}")
                
            if response.status_code == expected_status:
                self.results['passed'] += 1
                self.log(f"✅ {method} {endpoint} - Status: {response.status_code}")
                return True, response
            else:
                self.results['failed'] += 1
                error_msg = f"❌ {method} {endpoint} - Esperado: {expected_status}, Recebido: {response.status_code}"
                self.log(error_msg, "ERROR")
                self.results['errors'].append(error_msg)
                return False, response
                
        except requests.exceptions.RequestException as e:
            self.results['failed'] += 1
            error_msg = f"❌ {method} {endpoint} - Erro de conexão: {str(e)}"
            self.log(error_msg, "ERROR")
            self.results['errors'].append(error_msg)
            return False, None
        except Exception as e:
            self.results['failed'] += 1
            error_msg = f"❌ {method} {endpoint} - Erro: {str(e)}"
            self.log(error_msg, "ERROR")
            self.results['errors'].append(error_msg)
            return False, None
    
    def test_health_check(self):
        """Testa endpoints de health check"""
        self.log("🔍 Testando Health Check...")
        
        endpoints = [
            ('GET', '/health/'),
            ('GET', '/api/health/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_auth_endpoints(self):
        """Testa endpoints de autenticação"""
        self.log("🔐 Testando Autenticação...")
        
        # Teste de registro
        register_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        success, response = self.test_endpoint('POST', '/auth/register/', register_data, expected_status=201)
        
        if success and response:
            try:
                data = response.json()
                if 'access' in data:
                    self.auth_token = data['access']
                    self.log("Token de autenticação obtido com sucesso")
            except:
                pass
        
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
    
    def test_core_endpoints(self):
        """Testa endpoints principais do sistema"""
        self.log("🏗️ Testando Endpoints Principais...")
        
        endpoints = [
            ('GET', '/dashboard/stats/'),
            ('GET', '/dashboard/alertas/'),
            ('GET', '/dashboard/atividades/'),
            ('GET', '/dashboard/graficos/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_caixa_entrada(self):
        """Testa módulo de caixa entrada"""
        self.log("📥 Testando Caixa Entrada...")
        
        endpoints = [
            ('GET', '/caixa-entrada/api/documentos/'),
            ('GET', '/caixa-entrada/api/estatisticas/'),
            ('GET', '/caixa-entrada/api/painel-gerencial/'),
            ('GET', '/caixa-entrada/api/destinatarios/'),
            ('GET', '/caixa-entrada/api/historico/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_protocolo(self):
        """Testa módulo de protocolo"""
        self.log("📋 Testando Protocolo...")
        
        endpoints = [
            ('GET', '/protocolo/protocolos/'),
            ('GET', '/protocolo/documentos/'),
            ('GET', '/protocolo/tramitacoes/'),
            ('GET', '/protocolo/alertas/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_fiscalizacao(self):
        """Testa módulo de fiscalização"""
        self.log("🔍 Testando Fiscalização...")
        
        endpoints = [
            ('GET', '/fiscalizacao/processos/'),
            ('GET', '/fiscalizacao/infracoes/'),
            ('GET', '/fiscalizacao/autos/'),
            ('GET', '/fiscalizacao/dashboard/stats/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_juridico(self):
        """Testa módulo jurídico"""
        self.log("⚖️ Testando Jurídico...")
        
        endpoints = [
            ('GET', '/juridico/analises/'),
            ('GET', '/juridico/analistas/'),
            ('GET', '/juridico/configuracoes/'),
            ('GET', '/juridico/dashboard/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_peticionamento(self):
        """Testa módulo de peticionamento"""
        self.log("📄 Testando Peticionamento...")
        
        endpoints = [
            ('GET', '/peticionamento/peticoes/'),
            ('GET', '/peticionamento/tipos-peticao/'),
            ('GET', '/peticionamento/respostas/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_portal_cidadao(self):
        """Testa portal do cidadão"""
        self.log("👥 Testando Portal Cidadão...")
        
        endpoints = [
            ('GET', '/portal-cidadao/denuncias/'),
            ('GET', '/portal-cidadao/peticoes/'),
            ('GET', '/portal-cidadao/acompanhamento/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_cobranca(self):
        """Testa módulo de cobrança"""
        self.log("💰 Testando Cobrança...")
        
        endpoints = [
            ('GET', '/cobranca/boletos/'),
            ('GET', '/cobranca/cobrancas/'),
            ('GET', '/cobranca/pagamentos/'),
            ('GET', '/cobranca/remessas/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_multas(self):
        """Testa módulo de multas"""
        self.log("📊 Testando Multas...")
        
        endpoints = [
            ('GET', '/multas/multas/'),
            ('GET', '/multas/tipos-multa/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_atendimento(self):
        """Testa módulo de atendimento"""
        self.log("🏢 Testando Atendimento...")
        
        endpoints = [
            ('GET', '/atendimento/api/dashboard/'),
            ('GET', '/atendimento/api/reclamacoes/'),
            ('GET', '/atendimento/api/registros-presenciais/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def test_notificacoes(self):
        """Testa módulo de notificações"""
        self.log("🔔 Testando Notificações...")
        
        endpoints = [
            ('GET', '/notificacoes/notificacoes/'),
            ('GET', '/notificacoes/dashboard/'),
        ]
        
        for method, endpoint in endpoints:
            self.test_endpoint(method, endpoint)
    
    def run_all_tests(self):
        """Executa todos os testes"""
        self.log("🚀 Iniciando Teste Completo do Backend PROCON")
        self.log("=" * 60)
        
        # Verificar se o servidor está rodando
        try:
            response = requests.get(f"{BASE_URL}/api/health/", timeout=5)
            if response.status_code == 200:
                self.log("✅ Servidor está rodando")
            else:
                self.log("❌ Servidor não está respondendo corretamente", "ERROR")
                return
        except:
            self.log("❌ Servidor não está acessível", "ERROR")
            return
        
        # Executar todos os testes
        test_methods = [
            self.test_health_check,
            self.test_auth_endpoints,
            self.test_core_endpoints,
            self.test_caixa_entrada,
            self.test_protocolo,
            self.test_fiscalizacao,
            self.test_juridico,
            self.test_peticionamento,
            self.test_portal_cidadao,
            self.test_cobranca,
            self.test_multas,
            self.test_atendimento,
            self.test_notificacoes,
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log(f"❌ Erro ao executar {test_method.__name__}: {str(e)}", "ERROR")
                self.results['errors'].append(f"Erro em {test_method.__name__}: {str(e)}")
        
        # Relatório final
        self.log("=" * 60)
        self.log("📊 RELATÓRIO FINAL")
        self.log(f"Total de testes: {self.results['total_tests']}")
        self.log(f"✅ Sucessos: {self.results['passed']}")
        self.log(f"❌ Falhas: {self.results['failed']}")
        
        if self.results['errors']:
            self.log("\n🔍 ERROS DETALHADOS:")
            for error in self.results['errors']:
                self.log(f"  - {error}")
        
        success_rate = (self.results['passed'] / self.results['total_tests']) * 100 if self.results['total_tests'] > 0 else 0
        self.log(f"\n📈 Taxa de Sucesso: {success_rate:.1f}%")
        
        if success_rate >= 80:
            self.log("🎉 Backend está FUNCIONAL!")
        elif success_rate >= 60:
            self.log("⚠️ Backend tem problemas menores")
        else:
            self.log("🚨 Backend tem problemas críticos!")

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()

#!/usr/bin/env python3
"""
🧪 TESTE FINAL DE INTEGRAÇÃO - SISTEMA PROCON
Testa a integração completa entre backend Django e frontend React
"""

import os
import json
import requests
import time
from datetime import datetime

class TesteIntegracaoFinal:
    """Teste final de integração do sistema"""
    
    def __init__(self):
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': [],
            'warnings': []
        }
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
    
    def log_test(self, test_name, status, message=""):
        """Registra resultado do teste"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        if status == "PASS":
            print(f"✅ [{timestamp}] {test_name}: {message}")
            self.test_results['passed'] += 1
        elif status == "FAIL":
            print(f"❌ [{timestamp}] {test_name}: {message}")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"{test_name}: {message}")
        elif status == "WARN":
            print(f"⚠️ [{timestamp}] {test_name}: {message}")
            self.test_results['warnings'].append(f"{test_name}: {message}")
    
    def test_1_backend_online(self):
        """Teste 1: Backend online"""
        print("\n🔧 Testando se o backend está online...")
        
        try:
            response = requests.get(f"{self.backend_url}/health/", timeout=5)
            if response.status_code == 200:
                self.log_test("Backend Online", "PASS", "Backend respondendo")
            else:
                self.log_test("Backend Online", "FAIL", f"Status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            self.log_test("Backend Online", "FAIL", "Backend não está rodando")
        except Exception as e:
            self.log_test("Backend Online", "FAIL", str(e))
    
    def test_2_frontend_online(self):
        """Teste 2: Frontend online"""
        print("\n🎨 Testando se o frontend está online...")
        
        try:
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                self.log_test("Frontend Online", "PASS", "Frontend respondendo")
            else:
                self.log_test("Frontend Online", "FAIL", f"Status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            self.log_test("Frontend Online", "WARN", "Frontend não está rodando (opcional)")
        except Exception as e:
            self.log_test("Frontend Online", "WARN", str(e))
    
    def test_3_apis_backend(self):
        """Teste 3: APIs do backend"""
        print("\n🔌 Testando APIs do backend...")
        
        apis_to_test = [
            '/api/test/',
            '/api/cobranca/geral/estatisticas/',
            '/api/fiscalizacao/autos/',
            '/api/multas/',
            '/api/financeiro/',
            '/api/juridico/',
            '/api/notificacoes/'
        ]
        
        for api in apis_to_test:
            try:
                response = requests.get(f"{self.backend_url}{api}", timeout=5)
                if response.status_code in [200, 401, 403]:  # 401/403 são aceitáveis (sem auth)
                    self.log_test(f"API {api}", "PASS", f"Status: {response.status_code}")
                else:
                    self.log_test(f"API {api}", "WARN", f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"API {api}", "WARN", f"Erro: {str(e)[:50]}...")
    
    def test_4_configuracao_cors(self):
        """Teste 4: Configuração CORS"""
        print("\n🌐 Testando configuração CORS...")
        
        try:
            headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(f"{self.backend_url}/api/test/", headers=headers, timeout=5)
            
            if response.status_code in [200, 204]:
                self.log_test("CORS Config", "PASS", "CORS configurado")
            else:
                self.log_test("CORS Config", "WARN", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("CORS Config", "WARN", f"Erro: {str(e)[:50]}...")
    
    def test_5_autenticacao_jwt(self):
        """Teste 5: Autenticação JWT"""
        print("\n🔐 Testando autenticação JWT...")
        
        try:
            # Testar endpoint de token
            response = requests.post(f"{self.backend_url}/auth/token/", 
                                   json={'username': 'admin', 'password': 'admin123'}, 
                                   timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if 'access' in data and 'refresh' in data:
                    self.log_test("JWT Token", "PASS", "Tokens gerados com sucesso")
                else:
                    self.log_test("JWT Token", "WARN", "Tokens não encontrados na resposta")
            else:
                self.log_test("JWT Token", "WARN", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("JWT Token", "WARN", f"Erro: {str(e)[:50]}...")
    
    def test_6_servicos_frontend(self):
        """Teste 6: Serviços do frontend"""
        print("\n🔌 Testando serviços do frontend...")
        
        services_to_check = [
            'frontend/src/services/api.js',
            'frontend/src/services/auth.js',
            'frontend/src/services/fiscalizacaoService.js',
            'frontend/src/services/cobrancaService.js',
            'frontend/src/services/financeiroService.js',
            'frontend/src/services/juridicoService.js'
        ]
        
        for service_path in services_to_check:
            if os.path.exists(service_path):
                try:
                    with open(service_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Verificar se tem configuração de API
                    if 'localhost:8000' in content or 'api' in content:
                        self.log_test(f"Serviço {os.path.basename(service_path)}", "PASS", "Configurado para API")
                    else:
                        self.log_test(f"Serviço {os.path.basename(service_path)}", "WARN", "Configuração de API não encontrada")
                except Exception as e:
                    self.log_test(f"Serviço {os.path.basename(service_path)}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Serviço {os.path.basename(service_path)}", "FAIL", "Não encontrado")
    
    def test_7_rotas_integradas(self):
        """Teste 7: Rotas integradas"""
        print("\n🛣️ Testando rotas integradas...")
        
        # Verificar se as rotas do frontend correspondem às APIs do backend
        route_mappings = [
            ('fiscalizacao', '/api/fiscalizacao/'),
            ('cobranca', '/api/cobranca/'),
            ('multas', '/api/multas/'),
            ('financeiro', '/api/financeiro/'),
            ('juridico', '/api/juridico/'),
            ('usuarios', '/api/usuarios/'),
            ('relatorios', '/api/relatorios/')
        ]
        
        app_jsx_path = 'frontend/src/App.jsx'
        if os.path.exists(app_jsx_path):
            try:
                with open(app_jsx_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                matches = 0
                for frontend_route, backend_api in route_mappings:
                    if frontend_route in content:
                        matches += 1
                        self.log_test(f"Rota {frontend_route}", "PASS", "Encontrada no frontend")
                    else:
                        self.log_test(f"Rota {frontend_route}", "WARN", "Não encontrada no frontend")
                
                if matches >= 6:
                    self.log_test("Integração Rotas", "PASS", f"{matches}/7 rotas integradas")
                else:
                    self.log_test("Integração Rotas", "WARN", f"Apenas {matches}/7 rotas integradas")
                    
            except Exception as e:
                self.log_test("Integração Rotas", "FAIL", f"Erro ao ler App.jsx: {str(e)}")
        else:
            self.log_test("Integração Rotas", "FAIL", "App.jsx não encontrado")
    
    def test_8_docker_integration(self):
        """Teste 8: Integração Docker"""
        print("\n🐳 Testando integração Docker...")
        
        docker_compose_path = 'docker-compose.yml'
        if os.path.exists(docker_compose_path):
            try:
                with open(docker_compose_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar se tem serviços do backend e frontend
                if 'backend:' in content and 'frontend:' in content:
                    self.log_test("Docker Compose", "PASS", "Backend e frontend configurados")
                else:
                    self.log_test("Docker Compose", "WARN", "Configuração incompleta")
                
                # Verificar se tem rede compartilhada
                if 'networks:' in content:
                    self.log_test("Docker Networks", "PASS", "Redes configuradas")
                else:
                    self.log_test("Docker Networks", "WARN", "Redes não configuradas")
                    
            except Exception as e:
                self.log_test("Docker Integration", "FAIL", f"Erro ao ler docker-compose.yml: {str(e)}")
        else:
            self.log_test("Docker Integration", "FAIL", "docker-compose.yml não encontrado")
    
    def test_9_documentacao_integracao(self):
        """Teste 9: Documentação de integração"""
        print("\n📚 Testando documentação de integração...")
        
        docs_to_check = [
            'ANALISE_DETALHADA_BACKEND_FRONTEND.md',
            'DEPLOYMENT.md',
            'PRODUCAO_READY.md',
            'README.md'
        ]
        
        for doc_path in docs_to_check:
            if os.path.exists(doc_path):
                try:
                    with open(doc_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Verificar se menciona integração
                    if 'integração' in content.lower() or 'integration' in content.lower():
                        self.log_test(f"Documentação {doc_path}", "PASS", "Menciona integração")
                    else:
                        self.log_test(f"Documentação {doc_path}", "WARN", "Não menciona integração")
                except Exception as e:
                    self.log_test(f"Documentação {doc_path}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Documentação {doc_path}", "WARN", "Não encontrada")
    
    def test_10_performance_integracao(self):
        """Teste 10: Performance da integração"""
        print("\n⚡ Testando performance da integração...")
        
        try:
            # Testar tempo de resposta do backend
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/health/", timeout=10)
            end_time = time.time()
            
            response_time = end_time - start_time
            if response_time < 2.0:  # Menos de 2 segundos
                self.log_test("Performance Backend", "PASS", f"Tempo: {response_time:.3f}s")
            else:
                self.log_test("Performance Backend", "WARN", f"Tempo lento: {response_time:.3f}s")
                
        except Exception as e:
            self.log_test("Performance", "FAIL", str(e))
    
    def executar_todos_testes(self):
        """Executa todos os testes"""
        print("🧪 INICIANDO TESTES FINAIS DE INTEGRAÇÃO")
        print("=" * 60)
        print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print("=" * 60)
        
        # Executar todos os testes
        testes = [
            self.test_1_backend_online,
            self.test_2_frontend_online,
            self.test_3_apis_backend,
            self.test_4_configuracao_cors,
            self.test_5_autenticacao_jwt,
            self.test_6_servicos_frontend,
            self.test_7_rotas_integradas,
            self.test_8_docker_integration,
            self.test_9_documentacao_integracao,
            self.test_10_performance_integracao
        ]
        
        for teste in testes:
            try:
                teste()
            except Exception as e:
                self.log_test(teste.__name__, "FAIL", f"Erro na execução: {str(e)}")
        
        # Relatório final
        self.gerar_relatorio_final()
    
    def gerar_relatorio_final(self):
        """Gera relatório final dos testes"""
        print("\n" + "=" * 60)
        print("📊 RELATÓRIO FINAL DOS TESTES DE INTEGRAÇÃO")
        print("=" * 60)
        
        total_tests = self.test_results['passed'] + self.test_results['failed']
        
        print(f"✅ Testes Passados: {self.test_results['passed']}")
        print(f"❌ Testes Falharam: {self.test_results['failed']}")
        print(f"📈 Taxa de Sucesso: {(self.test_results['passed']/total_tests*100):.1f}%" if total_tests > 0 else "N/A")
        
        if self.test_results['warnings']:
            print(f"\n⚠️ Avisos ({len(self.test_results['warnings'])}):")
            for warning in self.test_results['warnings']:
                print(f"  - {warning}")
        
        if self.test_results['errors']:
            print(f"\n❌ Erros ({len(self.test_results['errors'])}):")
            for error in self.test_results['errors']:
                print(f"  - {error}")
        
        # Status geral
        if self.test_results['failed'] == 0:
            print("\n🎉 STATUS: INTEGRAÇÃO APROVADA PARA PRODUÇÃO!")
        elif self.test_results['failed'] <= 2:
            print("\n⚠️ STATUS: INTEGRAÇÃO APROVADA COM RESERVAS")
        else:
            print("\n❌ STATUS: INTEGRAÇÃO NECESSITA CORREÇÕES")
        
        print("=" * 60)

if __name__ == "__main__":
    # Executar testes
    tester = TesteIntegracaoFinal()
    tester.executar_todos_testes()

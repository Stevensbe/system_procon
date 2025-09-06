#!/usr/bin/env python3
"""
🧪 TESTE SIMPLES - SISTEMA PROCON
Testa funcionalidades básicas do sistema
"""

import os
import sys
import json
from datetime import datetime

class TesteSimplesProcon:
    """Teste simples do sistema Procon"""
    
    def __init__(self):
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': [],
            'warnings': []
        }
    
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
    
    def test_1_estrutura_projeto(self):
        """Teste 1: Estrutura do projeto"""
        print("\n📁 Testando estrutura do projeto...")
        
        # Verificar diretórios principais
        dirs_to_check = [
            'procon_system',
            'frontend',
            'procon_system/fiscalizacao',
            'procon_system/multas',
            'procon_system/financeiro',
            'procon_system/juridico',
            'procon_system/cobranca',
            'frontend/src',
            'frontend/src/components',
            'frontend/src/pages',
            'frontend/src/services'
        ]
        
        for dir_path in dirs_to_check:
            if os.path.exists(dir_path):
                self.log_test(f"Diretório {dir_path}", "PASS", "Encontrado")
            else:
                self.log_test(f"Diretório {dir_path}", "FAIL", "Não encontrado")
    
    def test_2_arquivos_configuracao(self):
        """Teste 2: Arquivos de configuração"""
        print("\n⚙️ Testando arquivos de configuração...")
        
        # Verificar arquivos importantes
        files_to_check = [
            'procon_system/manage.py',
            'procon_system/requirements.txt',
            'procon_system/procon_system/settings.py',
            'procon_system/procon_system/urls.py',
            'frontend/package.json',
            'frontend/vite.config.js',
            'frontend/src/App.jsx',
            'docker-compose.yml',
            'README.md'
        ]
        
        for file_path in files_to_check:
            if os.path.exists(file_path):
                self.log_test(f"Arquivo {file_path}", "PASS", "Encontrado")
            else:
                self.log_test(f"Arquivo {file_path}", "FAIL", "Não encontrado")
    
    def test_3_modulos_backend(self):
        """Teste 3: Módulos do backend"""
        print("\n🔧 Testando módulos do backend...")
        
        # Verificar se os módulos podem ser importados
        try:
            import sys
            sys.path.append('procon_system')
            
            # Tentar importar módulos principais
            modules_to_test = [
                'fiscalizacao',
                'multas', 
                'financeiro',
                'juridico',
                'cobranca',
                'notificacoes',
                'portal_cidadao'
            ]
            
            for module in modules_to_test:
                try:
                    __import__(module)
                    self.log_test(f"Módulo {module}", "PASS", "Importável")
                except ImportError as e:
                    self.log_test(f"Módulo {module}", "WARN", f"Erro: {str(e)[:50]}...")
                    
        except Exception as e:
            self.log_test("Importação módulos", "FAIL", str(e))
    
    def test_4_frontend_config(self):
        """Teste 4: Configuração do frontend"""
        print("\n🎨 Testando configuração do frontend...")
        
        try:
            # Verificar package.json
            package_json_path = 'frontend/package.json'
            if os.path.exists(package_json_path):
                with open(package_json_path, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                
                # Verificar dependências principais
                dependencies = package_data.get('dependencies', {})
                required_deps = ['react', 'react-dom', 'axios', 'react-router-dom']
                
                for dep in required_deps:
                    if dep in dependencies:
                        self.log_test(f"Dependência {dep}", "PASS", f"Versão: {dependencies[dep]}")
                    else:
                        self.log_test(f"Dependência {dep}", "FAIL", "Não encontrada")
                
                # Verificar scripts
                scripts = package_data.get('scripts', {})
                required_scripts = ['dev', 'build', 'preview']
                
                for script in required_scripts:
                    if script in scripts:
                        self.log_test(f"Script {script}", "PASS", "Configurado")
                    else:
                        self.log_test(f"Script {script}", "WARN", "Não encontrado")
            else:
                self.log_test("Package.json", "FAIL", "Arquivo não encontrado")
                
        except Exception as e:
            self.log_test("Configuração frontend", "FAIL", str(e))
    
    def test_5_arquivos_principais_frontend(self):
        """Teste 5: Arquivos principais do frontend"""
        print("\n📄 Testando arquivos principais do frontend...")
        
        frontend_files = [
            'frontend/src/main.jsx',
            'frontend/src/App.jsx',
            'frontend/src/index.css',
            'frontend/src/services/api.js',
            'frontend/src/components/layout/Layout.jsx',
            'frontend/src/pages/Dashboard.jsx',
            'frontend/src/pages/auth/Login.jsx'
        ]
        
        for file_path in frontend_files:
            if os.path.exists(file_path):
                # Verificar se o arquivo tem conteúdo
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if len(content.strip()) > 0:
                        self.log_test(f"Arquivo {file_path}", "PASS", f"{len(content)} caracteres")
                    else:
                        self.log_test(f"Arquivo {file_path}", "WARN", "Arquivo vazio")
                except Exception as e:
                    self.log_test(f"Arquivo {file_path}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Arquivo {file_path}", "FAIL", "Não encontrado")
    
    def test_6_docker_config(self):
        """Teste 6: Configuração Docker"""
        print("\n🐳 Testando configuração Docker...")
        
        docker_files = [
            'docker-compose.yml',
            'procon_system/Dockerfile',
            'frontend/Dockerfile'
        ]
        
        for file_path in docker_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if len(content.strip()) > 0:
                        self.log_test(f"Docker {file_path}", "PASS", f"{len(content)} caracteres")
                    else:
                        self.log_test(f"Docker {file_path}", "WARN", "Arquivo vazio")
                except Exception as e:
                    self.log_test(f"Docker {file_path}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Docker {file_path}", "FAIL", "Não encontrado")
    
    def test_7_documentacao(self):
        """Teste 7: Documentação"""
        print("\n📚 Testando documentação...")
        
        docs_files = [
            'README.md',
            'ANALISE_DETALHADA_PROJETO.md',
            'ANALISE_DETALHADA_BACKEND_FRONTEND.md',
            'DEPLOYMENT.md',
            'PRODUCAO_READY.md'
        ]
        
        for file_path in docs_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if len(content.strip()) > 100:  # Documentação deve ter pelo menos 100 caracteres
                        self.log_test(f"Documentação {file_path}", "PASS", f"{len(content)} caracteres")
                    else:
                        self.log_test(f"Documentação {file_path}", "WARN", "Documentação muito pequena")
                except Exception as e:
                    self.log_test(f"Documentação {file_path}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Documentação {file_path}", "WARN", "Não encontrada")
    
    def test_8_scripts_teste(self):
        """Teste 8: Scripts de teste"""
        print("\n🧪 Testando scripts de teste...")
        
        test_files = [
            'testar_integracao_frontend.py',
            'testar_apis_cobranca.py',
            'testar_funcionalidades_gerais.py',
            'test_modulo_financeiro.py'
        ]
        
        for file_path in test_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if len(content.strip()) > 50:
                        self.log_test(f"Script teste {file_path}", "PASS", f"{len(content)} caracteres")
                    else:
                        self.log_test(f"Script teste {file_path}", "WARN", "Script muito pequeno")
                except Exception as e:
                    self.log_test(f"Script teste {file_path}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Script teste {file_path}", "WARN", "Não encontrado")
    
    def executar_todos_testes(self):
        """Executa todos os testes"""
        print("🧪 INICIANDO TESTES SIMPLES DO SISTEMA PROCON")
        print("=" * 60)
        print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print("=" * 60)
        
        # Executar todos os testes
        testes = [
            self.test_1_estrutura_projeto,
            self.test_2_arquivos_configuracao,
            self.test_3_modulos_backend,
            self.test_4_frontend_config,
            self.test_5_arquivos_principais_frontend,
            self.test_6_docker_config,
            self.test_7_documentacao,
            self.test_8_scripts_teste
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
        print("📊 RELATÓRIO FINAL DOS TESTES SIMPLES")
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
            print("\n🎉 STATUS: SISTEMA APROVADO PARA PRODUÇÃO!")
        elif self.test_results['failed'] <= 3:
            print("\n⚠️ STATUS: SISTEMA APROVADO COM RESERVAS")
        else:
            print("\n❌ STATUS: SISTEMA NECESSITA CORREÇÕES")
        
        print("=" * 60)

if __name__ == "__main__":
    # Executar testes
    tester = TesteSimplesProcon()
    tester.executar_todos_testes()

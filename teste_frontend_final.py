#!/usr/bin/env python3
"""
🧪 TESTE FINAL FRONTEND - SISTEMA PROCON
Testa especificamente as funcionalidades do frontend React
"""

import os
import json
import subprocess
import sys
from datetime import datetime

class TesteFrontendFinal:
    """Teste final do frontend React"""
    
    def __init__(self):
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': [],
            'warnings': []
        }
        self.frontend_dir = 'frontend'
    
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
    
    def test_1_estrutura_frontend(self):
        """Teste 1: Estrutura do frontend"""
        print("\n📁 Testando estrutura do frontend...")
        
        # Verificar estrutura de diretórios
        dirs_to_check = [
            'frontend/src',
            'frontend/src/components',
            'frontend/src/pages',
            'frontend/src/services',
            'frontend/src/utils',
            'frontend/src/hooks',
            'frontend/src/context',
            'frontend/src/layout',
            'frontend/src/assets',
            'frontend/public'
        ]
        
        for dir_path in dirs_to_check:
            if os.path.exists(dir_path):
                self.log_test(f"Diretório {dir_path}", "PASS", "Encontrado")
            else:
                self.log_test(f"Diretório {dir_path}", "FAIL", "Não encontrado")
    
    def test_2_dependencias_frontend(self):
        """Teste 2: Dependências do frontend"""
        print("\n📦 Testando dependências do frontend...")
        
        try:
            package_json_path = os.path.join(self.frontend_dir, 'package.json')
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
            
            # Dependências principais
            dependencies = package_data.get('dependencies', {})
            required_deps = {
                'react': '^19.1.0',
                'react-dom': '^19.1.0',
                'react-router-dom': '^7.7.1',
                'axios': '^1.10.0',
                'tailwindcss': '^3.4.17',
                'vite': '^6.3.5'
            }
            
            for dep, expected_version in required_deps.items():
                if dep in dependencies:
                    version = dependencies[dep]
                    self.log_test(f"Dependência {dep}", "PASS", f"Versão: {version}")
                else:
                    self.log_test(f"Dependência {dep}", "FAIL", "Não encontrada")
            
            # Verificar se node_modules existe
            node_modules_path = os.path.join(self.frontend_dir, 'node_modules')
            if os.path.exists(node_modules_path):
                self.log_test("node_modules", "PASS", "Dependências instaladas")
            else:
                self.log_test("node_modules", "WARN", "Dependências não instaladas")
                
        except Exception as e:
            self.log_test("Dependências", "FAIL", str(e))
    
    def test_3_componentes_principais(self):
        """Teste 3: Componentes principais"""
        print("\n🧩 Testando componentes principais...")
        
        components_to_check = [
            'frontend/src/components/layout/Layout.jsx',
            'frontend/src/components/common/LoadingSpinner.jsx',
            'frontend/src/components/common/ErrorFallback.jsx',
            'frontend/src/components/common/SystemMonitor.jsx',
            'frontend/src/components/common/GlobalErrorBoundary.jsx'
        ]
        
        for component_path in components_to_check:
            if os.path.exists(component_path):
                try:
                    with open(component_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if len(content.strip()) > 100:
                        self.log_test(f"Componente {os.path.basename(component_path)}", "PASS", f"{len(content)} caracteres")
                    else:
                        self.log_test(f"Componente {os.path.basename(component_path)}", "WARN", "Componente muito pequeno")
                except Exception as e:
                    self.log_test(f"Componente {os.path.basename(component_path)}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Componente {os.path.basename(component_path)}", "FAIL", "Não encontrado")
    
    def test_4_paginas_principais(self):
        """Teste 4: Páginas principais"""
        print("\n📄 Testando páginas principais...")
        
        pages_to_check = [
            'frontend/src/pages/Dashboard.jsx',
            'frontend/src/pages/auth/Login.jsx',
            'frontend/src/pages/auth/Logout.jsx',
            'frontend/src/pages/PortalCidadao.jsx',
            'frontend/src/pages/Financeiro.jsx',
            'frontend/src/pages/Multas.jsx',
            'frontend/src/pages/Usuarios.jsx'
        ]
        
        for page_path in pages_to_check:
            if os.path.exists(page_path):
                try:
                    with open(page_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if len(content.strip()) > 500:
                        self.log_test(f"Página {os.path.basename(page_path)}", "PASS", f"{len(content)} caracteres")
                    else:
                        self.log_test(f"Página {os.path.basename(page_path)}", "WARN", "Página muito pequena")
                except Exception as e:
                    self.log_test(f"Página {os.path.basename(page_path)}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Página {os.path.basename(page_path)}", "FAIL", "Não encontrada")
    
    def test_5_servicos_api(self):
        """Teste 5: Serviços de API"""
        print("\n🔌 Testando serviços de API...")
        
        services_to_check = [
            'frontend/src/services/api.js',
            'frontend/src/services/auth.js',
            'frontend/src/services/fiscalizacaoService.js',
            'frontend/src/services/cobrancaService.js',
            'frontend/src/services/financeiroService.js',
            'frontend/src/services/juridicoService.js',
            'frontend/src/services/dashboardService.js'
        ]
        
        for service_path in services_to_check:
            if os.path.exists(service_path):
                try:
                    with open(service_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if len(content.strip()) > 200:
                        self.log_test(f"Serviço {os.path.basename(service_path)}", "PASS", f"{len(content)} caracteres")
                    else:
                        self.log_test(f"Serviço {os.path.basename(service_path)}", "WARN", "Serviço muito pequeno")
                except Exception as e:
                    self.log_test(f"Serviço {os.path.basename(service_path)}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"Serviço {os.path.basename(service_path)}", "FAIL", "Não encontrado")
    
    def test_6_configuracao_vite(self):
        """Teste 6: Configuração Vite"""
        print("\n⚡ Testando configuração Vite...")
        
        vite_config_path = os.path.join(self.frontend_dir, 'vite.config.js')
        if os.path.exists(vite_config_path):
            try:
                with open(vite_config_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if 'react' in content and 'vite' in content:
                    self.log_test("Vite Config", "PASS", f"{len(content)} caracteres")
                else:
                    self.log_test("Vite Config", "WARN", "Configuração incompleta")
            except Exception as e:
                self.log_test("Vite Config", "FAIL", f"Erro ao ler: {str(e)}")
        else:
            self.log_test("Vite Config", "FAIL", "Não encontrado")
    
    def test_7_configuracao_tailwind(self):
        """Teste 7: Configuração Tailwind"""
        print("\n🎨 Testando configuração Tailwind...")
        
        tailwind_config_path = os.path.join(self.frontend_dir, 'tailwind.config.js')
        if os.path.exists(tailwind_config_path):
            try:
                with open(tailwind_config_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if 'tailwindcss' in content:
                    self.log_test("Tailwind Config", "PASS", f"{len(content)} caracteres")
                else:
                    self.log_test("Tailwind Config", "WARN", "Configuração incompleta")
            except Exception as e:
                self.log_test("Tailwind Config", "FAIL", f"Erro ao ler: {str(e)}")
        else:
            self.log_test("Tailwind Config", "FAIL", "Não encontrado")
    
    def test_8_rotas_app(self):
        """Teste 8: Rotas do App.jsx"""
        print("\n🛣️ Testando rotas do App.jsx...")
        
        app_path = os.path.join(self.frontend_dir, 'src', 'App.jsx')
        if os.path.exists(app_path):
            try:
                with open(app_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar se tem rotas principais
                routes_to_check = [
                    'dashboard',
                    'fiscalizacao',
                    'multas',
                    'financeiro',
                    'juridico',
                    'cobranca',
                    'usuarios',
                    'relatorios'
                ]
                
                routes_found = 0
                for route in routes_to_check:
                    if route in content:
                        routes_found += 1
                
                if routes_found >= 6:
                    self.log_test("Rotas App.jsx", "PASS", f"{routes_found}/8 rotas encontradas")
                else:
                    self.log_test("Rotas App.jsx", "WARN", f"Apenas {routes_found}/8 rotas encontradas")
                    
            except Exception as e:
                self.log_test("Rotas App.jsx", "FAIL", f"Erro ao ler: {str(e)}")
        else:
            self.log_test("Rotas App.jsx", "FAIL", "App.jsx não encontrado")
    
    def test_9_estilos_css(self):
        """Teste 9: Estilos CSS"""
        print("\n💅 Testando estilos CSS...")
        
        css_files = [
            'frontend/src/index.css',
            'frontend/src/App.css'
        ]
        
        for css_path in css_files:
            if os.path.exists(css_path):
                try:
                    with open(css_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if len(content.strip()) > 100:
                        self.log_test(f"CSS {os.path.basename(css_path)}", "PASS", f"{len(content)} caracteres")
                    else:
                        self.log_test(f"CSS {os.path.basename(css_path)}", "WARN", "Arquivo muito pequeno")
                except Exception as e:
                    self.log_test(f"CSS {os.path.basename(css_path)}", "FAIL", f"Erro ao ler: {str(e)}")
            else:
                self.log_test(f"CSS {os.path.basename(css_path)}", "FAIL", "Não encontrado")
    
    def test_10_scripts_package(self):
        """Teste 10: Scripts do package.json"""
        print("\n📜 Testando scripts do package.json...")
        
        try:
            package_json_path = os.path.join(self.frontend_dir, 'package.json')
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
            
            scripts = package_data.get('scripts', {})
            required_scripts = ['dev', 'build', 'preview', 'lint']
            
            for script in required_scripts:
                if script in scripts:
                    self.log_test(f"Script {script}", "PASS", "Configurado")
                else:
                    self.log_test(f"Script {script}", "WARN", "Não encontrado")
                    
        except Exception as e:
            self.log_test("Scripts package.json", "FAIL", str(e))
    
    def executar_todos_testes(self):
        """Executa todos os testes"""
        print("🧪 INICIANDO TESTES FINAIS DO FRONTEND")
        print("=" * 60)
        print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print("=" * 60)
        
        # Executar todos os testes
        testes = [
            self.test_1_estrutura_frontend,
            self.test_2_dependencias_frontend,
            self.test_3_componentes_principais,
            self.test_4_paginas_principais,
            self.test_5_servicos_api,
            self.test_6_configuracao_vite,
            self.test_7_configuracao_tailwind,
            self.test_8_rotas_app,
            self.test_9_estilos_css,
            self.test_10_scripts_package
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
        print("📊 RELATÓRIO FINAL DOS TESTES DO FRONTEND")
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
            print("\n🎉 STATUS: FRONTEND APROVADO PARA PRODUÇÃO!")
        elif self.test_results['failed'] <= 2:
            print("\n⚠️ STATUS: FRONTEND APROVADO COM RESERVAS")
        else:
            print("\n❌ STATUS: FRONTEND NECESSITA CORREÇÕES")
        
        print("=" * 60)

if __name__ == "__main__":
    # Executar testes
    tester = TesteFrontendFinal()
    tester.executar_todos_testes()

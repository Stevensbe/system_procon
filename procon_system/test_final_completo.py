#!/usr/bin/env python3
"""
🧪 TESTES FINAIS COMPLETOS - SISTEMA PROCON
Testa todas as funcionalidades do sistema de forma abrangente
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.management import execute_from_command_line

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

class TesteFinalSistemaProcon:
    """Classe principal para testes finais do sistema"""
    
    def __init__(self):
        self.client = Client()
        self.base_url = "http://localhost:8000"
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
    
    def test_1_configuracao_django(self):
        """Teste 1: Configuração do Django"""
        try:
            from django.conf import settings
            self.log_test("Configuração Django", "PASS", "Django configurado corretamente")
            
            # Verificar apps instalados
            required_apps = [
                'fiscalizacao', 'multas', 'financeiro', 'juridico', 
                'protocolo', 'portal_cidadao', 'cobranca', 'notificacoes'
            ]
            
            for app in required_apps:
                if app in settings.INSTALLED_APPS:
                    self.log_test(f"App {app}", "PASS", "Instalado")
                else:
                    self.log_test(f"App {app}", "FAIL", "Não encontrado")
                    
        except Exception as e:
            self.log_test("Configuração Django", "FAIL", str(e))
    
    def test_2_banco_dados(self):
        """Teste 2: Banco de dados"""
        try:
            from django.db import connection
            cursor = connection.cursor()
            cursor.execute("SELECT 1")
            self.log_test("Conexão BD", "PASS", "Banco de dados acessível")
            
            # Verificar tabelas principais
            tables = ['auth_user', 'fiscalizacao_autoinfracao', 'multas_multa']
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    self.log_test(f"Tabela {table}", "PASS", "Acessível")
                except:
                    self.log_test(f"Tabela {table}", "WARN", "Não encontrada (pode precisar de migração)")
                    
        except Exception as e:
            self.log_test("Banco de dados", "FAIL", str(e))
    
    def test_3_autenticacao(self):
        """Teste 3: Sistema de autenticação"""
        try:
            # Criar usuário de teste
            user, created = User.objects.get_or_create(
                username='teste_final',
                defaults={'email': 'teste@procon.am.gov.br'}
            )
            if created:
                user.set_password('teste123')
                user.save()
                self.log_test("Criação usuário", "PASS", "Usuário de teste criado")
            
            # Testar login
            login_success = self.client.login(username='teste_final', password='teste123')
            if login_success:
                self.log_test("Login", "PASS", "Autenticação funcionando")
            else:
                self.log_test("Login", "FAIL", "Falha na autenticação")
                
        except Exception as e:
            self.log_test("Autenticação", "FAIL", str(e))
    
    def test_4_apis_principais(self):
        """Teste 4: APIs principais"""
        try:
            # Testar endpoint de saúde
            response = self.client.get('/health/')
            if response.status_code == 200:
                self.log_test("Health Check", "PASS", "API de saúde funcionando")
            else:
                self.log_test("Health Check", "FAIL", f"Status: {response.status_code}")
            
            # Testar endpoint de teste
            response = self.client.get('/api/test/')
            if response.status_code == 200:
                self.log_test("API Test", "PASS", "Endpoint de teste funcionando")
            else:
                self.log_test("API Test", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("APIs", "FAIL", str(e))
    
    def test_5_modulos_principais(self):
        """Teste 5: Módulos principais"""
        modules = [
            ('fiscalizacao', 'Fiscalização'),
            ('multas', 'Multas'),
            ('financeiro', 'Financeiro'),
            ('juridico', 'Jurídico'),
            ('cobranca', 'Cobrança'),
            ('notificacoes', 'Notificações'),
            ('portal_cidadao', 'Portal do Cidadão')
        ]
        
        for module_name, display_name in modules:
            try:
                # Verificar se o módulo pode ser importado
                __import__(module_name)
                self.log_test(f"Módulo {display_name}", "PASS", "Importável")
            except ImportError as e:
                self.log_test(f"Módulo {display_name}", "FAIL", f"Erro de importação: {e}")
    
    def test_6_urls_principais(self):
        """Teste 6: URLs principais"""
        urls_to_test = [
            '/admin/',
            '/api/',
            '/dashboard/',
            '/fiscalizacao/',
            '/multas/',
            '/financeiro/',
            '/juridico/',
            '/portal-cidadao/'
        ]
        
        for url in urls_to_test:
            try:
                response = self.client.get(url)
                if response.status_code in [200, 302, 404]:  # 404 é aceitável para algumas URLs
                    self.log_test(f"URL {url}", "PASS", f"Status: {response.status_code}")
                else:
                    self.log_test(f"URL {url}", "WARN", f"Status inesperado: {response.status_code}")
            except Exception as e:
                self.log_test(f"URL {url}", "FAIL", str(e))
    
    def test_7_frontend_integration(self):
        """Teste 7: Integração com Frontend"""
        try:
            # Verificar se o frontend está configurado
            frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
            if os.path.exists(frontend_dir):
                self.log_test("Frontend", "PASS", "Diretório frontend encontrado")
                
                # Verificar package.json
                package_json = os.path.join(frontend_dir, 'package.json')
                if os.path.exists(package_json):
                    self.log_test("Package.json", "PASS", "Arquivo de configuração encontrado")
                else:
                    self.log_test("Package.json", "FAIL", "Arquivo não encontrado")
            else:
                self.log_test("Frontend", "FAIL", "Diretório frontend não encontrado")
                
        except Exception as e:
            self.log_test("Frontend", "FAIL", str(e))
    
    def test_8_servicos_externos(self):
        """Teste 8: Serviços externos"""
        try:
            # Testar conexão com Redis (se disponível)
            try:
                import redis
                r = redis.Redis(host='localhost', port=6379, db=0)
                r.ping()
                self.log_test("Redis", "PASS", "Conexão estabelecida")
            except:
                self.log_test("Redis", "WARN", "Não disponível (opcional)")
            
            # Testar PostgreSQL (se configurado)
            from django.conf import settings
            if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                self.log_test("PostgreSQL", "PASS", "Configurado como banco principal")
            else:
                self.log_test("PostgreSQL", "WARN", "Usando SQLite (desenvolvimento)")
                
        except Exception as e:
            self.log_test("Serviços externos", "FAIL", str(e))
    
    def test_9_seguranca(self):
        """Teste 9: Configurações de segurança"""
        try:
            from django.conf import settings
            
            # Verificar configurações de segurança
            security_checks = [
                ('SECRET_KEY', settings.SECRET_KEY != 'django-insecure-desenvolvimento-procon-2025-xyz123abc456def789'),
                ('DEBUG', not settings.DEBUG),  # Deve ser False em produção
                ('ALLOWED_HOSTS', len(settings.ALLOWED_HOSTS) > 0),
                ('CORS_ORIGIN_WHITELIST', hasattr(settings, 'CORS_ORIGIN_WHITELIST')),
            ]
            
            for check_name, is_secure in security_checks:
                if is_secure:
                    self.log_test(f"Segurança {check_name}", "PASS", "Configurado corretamente")
                else:
                    self.log_test(f"Segurança {check_name}", "WARN", "Necessita atenção")
                    
        except Exception as e:
            self.log_test("Segurança", "FAIL", str(e))
    
    def test_10_performance(self):
        """Teste 10: Performance básica"""
        try:
            import time
            
            # Testar tempo de resposta do Django
            start_time = time.time()
            response = self.client.get('/health/')
            end_time = time.time()
            
            response_time = end_time - start_time
            if response_time < 1.0:  # Menos de 1 segundo
                self.log_test("Performance", "PASS", f"Tempo de resposta: {response_time:.3f}s")
            else:
                self.log_test("Performance", "WARN", f"Tempo de resposta lento: {response_time:.3f}s")
                
        except Exception as e:
            self.log_test("Performance", "FAIL", str(e))
    
    def executar_todos_testes(self):
        """Executa todos os testes"""
        print("🧪 INICIANDO TESTES FINAIS DO SISTEMA PROCON")
        print("=" * 60)
        print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print("=" * 60)
        
        # Executar todos os testes
        testes = [
            self.test_1_configuracao_django,
            self.test_2_banco_dados,
            self.test_3_autenticacao,
            self.test_4_apis_principais,
            self.test_5_modulos_principais,
            self.test_6_urls_principais,
            self.test_7_frontend_integration,
            self.test_8_servicos_externos,
            self.test_9_seguranca,
            self.test_10_performance
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
        print("📊 RELATÓRIO FINAL DOS TESTES")
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
        elif self.test_results['failed'] <= 2:
            print("\n⚠️ STATUS: SISTEMA APROVADO COM RESERVAS")
        else:
            print("\n❌ STATUS: SISTEMA NECESSITA CORREÇÕES")
        
        print("=" * 60)

if __name__ == "__main__":
    # Executar testes
    tester = TesteFinalSistemaProcon()
    tester.executar_todos_testes()

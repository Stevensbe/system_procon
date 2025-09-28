#!/usr/bin/env python3
"""
Script de diagnóstico para problemas de 404 e autenticação
Sistema Procon - Amazonas
"""

import os
import sys
import django
from pathlib import Path

# Adicionar o diretório do projeto ao Python path
project_dir = Path(__file__).parent / 'procon_system'
sys.path.insert(0, str(project_dir))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.urls import reverse, NoReverseMatch
from django.conf import settings
from django.core.management import execute_from_command_line
from django.test import Client
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import json

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_warning(message):
    print(f"⚠️ {message}")

def print_info(message):
    print(f"ℹ️ {message}")

def check_django_setup():
    """Verifica se o Django está configurado corretamente"""
    print_header("VERIFICAÇÃO DO DJANGO")
    
    try:
        from django.conf import settings
        print_success(f"Django {django.get_version()} configurado")
        print_info(f"DEBUG: {settings.DEBUG}")
        print_info(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
        print_info(f"ROOT_URLCONF: {settings.ROOT_URLCONF}")
        return True
    except Exception as e:
        print_error(f"Erro na configuração do Django: {e}")
        return False

def check_urls():
    """Verifica se as URLs estão configuradas corretamente"""
    print_header("VERIFICAÇÃO DE URLs")
    
    # URLs críticas para verificar
    critical_urls = [
        'auth/token/',
        'auth/login/',
        'auth/logout/',
        'auth/register/',
        'api/docs/',
        'health/',
        'admin/',
    ]
    
    working_urls = []
    broken_urls = []
    
    for url in critical_urls:
        try:
            # Tentar resolver a URL
            resolved = reverse(url)
            working_urls.append(f"{url} -> {resolved}")
            print_success(f"URL {url} resolvida: {resolved}")
        except NoReverseMatch:
            broken_urls.append(url)
            print_error(f"URL {url} não encontrada")
        except Exception as e:
            broken_urls.append(url)
            print_error(f"Erro ao resolver {url}: {e}")
    
    print_info(f"URLs funcionando: {len(working_urls)}")
    print_info(f"URLs com problema: {len(broken_urls)}")
    
    return len(broken_urls) == 0

def check_authentication_endpoints():
    """Testa os endpoints de autenticação"""
    print_header("TESTE DE ENDPOINTS DE AUTENTICAÇÃO")
    
    client = APIClient()
    
    # Teste 1: Endpoint de token
    print_info("Testando /auth/token/...")
    try:
        response = client.post('/auth/token/', {
            'username': 'testuser',
            'password': 'testpass'
        }, format='json')
        
        if response.status_code == 404:
            print_error("Endpoint /auth/token/ retornando 404")
            return False
        elif response.status_code == 400:
            print_warning("Endpoint /auth/token/ funcionando (credenciais inválidas esperado)")
        else:
            print_success(f"Endpoint /auth/token/ respondendo: {response.status_code}")
    except Exception as e:
        print_error(f"Erro ao testar /auth/token/: {e}")
        return False
    
    # Teste 2: Endpoint de login alternativo
    print_info("Testando /auth/login/...")
    try:
        response = client.post('/auth/login/', {
            'username': 'testuser',
            'password': 'testpass'
        }, format='json')
        
        if response.status_code == 404:
            print_error("Endpoint /auth/login/ retornando 404")
            return False
        else:
            print_success(f"Endpoint /auth/login/ respondendo: {response.status_code}")
    except Exception as e:
        print_error(f"Erro ao testar /auth/login/: {e}")
        return False
    
    return True

def check_cors_configuration():
    """Verifica a configuração de CORS"""
    print_header("VERIFICAÇÃO DE CORS")
    
    try:
        from django.conf import settings
        
        print_info(f"CORS_ALLOWED_ORIGINS: {getattr(settings, 'CORS_ALLOWED_ORIGINS', 'Não configurado')}")
        print_info(f"CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', 'Não configurado')}")
        print_info(f"CORS_ALLOW_CREDENTIALS: {getattr(settings, 'CORS_ALLOW_CREDENTIALS', 'Não configurado')}")
        
        # Verificar se corsheaders está instalado
        if 'corsheaders' in settings.INSTALLED_APPS:
            print_success("corsheaders instalado")
        else:
            print_error("corsheaders não instalado")
            return False
            
        return True
    except Exception as e:
        print_error(f"Erro ao verificar CORS: {e}")
        return False

def create_test_user():
    """Cria um usuário de teste se não existir"""
    print_header("CRIAÇÃO DE USUÁRIO DE TESTE")
    
    try:
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@procon.am.gov.br',
                'first_name': 'Test',
                'last_name': 'User',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            user.set_password('testpass')
            user.save()
            print_success("Usuário de teste criado")
        else:
            print_info("Usuário de teste já existe")
            
        return True
    except Exception as e:
        print_error(f"Erro ao criar usuário de teste: {e}")
        return False

def test_jwt_authentication():
    """Testa a autenticação JWT"""
    print_header("TESTE DE AUTENTICAÇÃO JWT")
    
    try:
        # Criar usuário de teste
        user = User.objects.get(username='testuser')
        
        # Gerar token JWT
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        print_success("Token JWT gerado com sucesso")
        
        # Testar endpoint protegido
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Tentar acessar um endpoint protegido
        response = client.get('/auth/profile/')
        
        if response.status_code == 200:
            print_success("Autenticação JWT funcionando")
            return True
        else:
            print_warning(f"Endpoint protegido retornou: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Erro no teste JWT: {e}")
        return False

def check_static_files():
    """Verifica se os arquivos estáticos estão configurados"""
    print_header("VERIFICAÇÃO DE ARQUIVOS ESTÁTICOS")
    
    try:
        from django.conf import settings
        
        print_info(f"STATIC_URL: {settings.STATIC_URL}")
        print_info(f"STATIC_ROOT: {getattr(settings, 'STATIC_ROOT', 'Não configurado')}")
        print_info(f"STATICFILES_DIRS: {getattr(settings, 'STATICFILES_DIRS', 'Não configurado')}")
        
        return True
    except Exception as e:
        print_error(f"Erro ao verificar arquivos estáticos: {e}")
        return False

def generate_fix_suggestions():
    """Gera sugestões de correção"""
    print_header("SUGESTÕES DE CORREÇÃO")
    
    suggestions = [
        "1. Verificar se todas as apps estão em INSTALLED_APPS",
        "2. Executar 'python manage.py collectstatic' para arquivos estáticos",
        "3. Executar 'python manage.py migrate' para aplicar migrações",
        "4. Verificar se o servidor está rodando na porta correta",
        "5. Verificar configurações de CORS para o frontend",
        "6. Verificar se as URLs estão sendo importadas corretamente",
        "7. Verificar logs do servidor para erros específicos",
        "8. Testar endpoints individualmente com curl ou Postman"
    ]
    
    for suggestion in suggestions:
        print_info(suggestion)

def main():
    """Função principal de diagnóstico"""
    print_header("DIAGNÓSTICO COMPLETO - SISTEMA PROCON")
    print("Identificando e corrigindo problemas de 404 e autenticação...")
    
    results = []
    
    # Executar verificações
    results.append(("Django Setup", check_django_setup()))
    results.append(("URLs", check_urls()))
    results.append(("CORS", check_cors_configuration()))
    results.append(("Usuário Teste", create_test_user()))
    results.append(("Autenticação JWT", test_jwt_authentication()))
    results.append(("Arquivos Estáticos", check_static_files()))
    results.append(("Endpoints Auth", check_authentication_endpoints()))
    
    # Resumo dos resultados
    print_header("RESUMO DOS RESULTADOS")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        if result:
            print_success(f"{name}: OK")
        else:
            print_error(f"{name}: FALHOU")
    
    print_info(f"Testes passaram: {passed}/{total}")
    
    if passed == total:
        print_success("🎉 Todos os testes passaram! Sistema funcionando corretamente.")
    else:
        print_warning("⚠️ Alguns testes falharam. Verifique as sugestões abaixo.")
        generate_fix_suggestions()
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

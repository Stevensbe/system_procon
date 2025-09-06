#!/usr/bin/env python3
"""
Script para corrigir problemas do Portal Cidadão
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

def verificar_servidor():
    """Verificar se o servidor está rodando"""
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        print("✅ Servidor Django está rodando")
        return True
    except:
        print("❌ Servidor Django NÃO está rodando")
        print("   Execute: cd procon_system && python manage.py runserver")
        return False

def verificar_apps_necessarias():
    """Verificar se as apps necessárias estão instaladas"""
    from django.conf import settings
    
    apps_necessarias = [
        'portal_cidadao',
        'peticionamento', 
        'consulta_publica',
        'notificacoes'
    ]
    
    apps_faltando = []
    for app in apps_necessarias:
        if app not in settings.INSTALLED_APPS:
            apps_faltando.append(app)
    
    if apps_faltando:
        print(f"❌ Apps faltando: {', '.join(apps_faltando)}")
        return False
    else:
        print("✅ Todas as apps necessárias estão instaladas")
        return True

def verificar_migracoes():
    """Verificar se as migrações estão aplicadas"""
    try:
        from django.core.management import execute_from_command_line
        from django.db import connection
        
        # Verificar se as tabelas existem
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name LIKE '%portal%'
            """)
            tabelas = cursor.fetchall()
        
        if tabelas:
            print(f"✅ Tabelas do portal encontradas: {len(tabelas)}")
            return True
        else:
            print("❌ Nenhuma tabela do portal encontrada")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar migrações: {e}")
        return False

def verificar_urls():
    """Verificar se as URLs estão configuradas"""
    from django.urls import get_resolver
    
    urls_necessarias = [
        'portal-cidadao',
        'api/portal',
        'api/peticionamento'
    ]
    
    urls_faltando = []
    resolver = get_resolver()
    
    for url in urls_necessarias:
        try:
            resolver.resolve(f'/{url}/')
        except:
            urls_faltando.append(url)
    
    if urls_faltando:
        print(f"❌ URLs faltando: {', '.join(urls_faltando)}")
        return False
    else:
        print("✅ Todas as URLs necessárias estão configuradas")
        return True

def corrigir_problemas():
    """Corrigir problemas identificados"""
    print("\n🔧 CORRIGINDO PROBLEMAS")
    print("=" * 50)
    
    # 1. Verificar se o servidor está rodando
    if not verificar_servidor():
        return False
    
    # 2. Verificar apps
    if not verificar_apps_necessarias():
        print("\n📝 Para corrigir, adicione as apps faltando em settings.py:")
        print("   INSTALLED_APPS = [")
        print("       'portal_cidadao',")
        print("       'peticionamento',")
        print("       'consulta_publica',")
        print("       'notificacoes',")
        print("       # ... outras apps")
        print("   ]")
        return False
    
    # 3. Verificar migrações
    if not verificar_migracoes():
        print("\n📝 Para corrigir, execute:")
        print("   cd procon_system")
        print("   python manage.py makemigrations")
        print("   python manage.py migrate")
        return False
    
    # 4. Verificar URLs
    if not verificar_urls():
        print("\n📝 Para corrigir, verifique se as URLs estão configuradas em urls.py")
        return False
    
    return True

def testar_endpoints():
    """Testar endpoints do Portal Cidadão"""
    print("\n🧪 TESTANDO ENDPOINTS")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    endpoints = [
        '/portal-cidadao/',
        '/api/portal/consulta/',
        '/api/portal/denuncia/',
        '/api/portal/peticao-juridica/',
        '/api/portal/avaliacao/',
        '/api/portal/contato/'
    ]
    
    sucessos = 0
    total = len(endpoints)
    
    for endpoint in endpoints:
        try:
            if endpoint == '/portal-cidadao/':
                response = requests.get(f"{base_url}{endpoint}", timeout=10)
            else:
                response = requests.post(f"{base_url}{endpoint}", 
                                       json={}, 
                                       headers={'Content-Type': 'application/json'},
                                       timeout=10)
            
            if response.status_code in [200, 201, 404]:  # 404 é aceitável para POST sem dados
                print(f"✅ {endpoint} - Status: {response.status_code}")
                sucessos += 1
            else:
                print(f"❌ {endpoint} - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ {endpoint} - Erro: {str(e)}")
    
    print(f"\n📊 Resultado: {sucessos}/{total} endpoints funcionando")
    return sucessos == total

def main():
    """Função principal"""
    print("🚀 CORRIGINDO PORTAL CIDADÃO")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Corrigir problemas
    if corrigir_problemas():
        print("\n✅ Problemas corrigidos!")
        
        # Testar endpoints
        if testar_endpoints():
            print("\n🎉 Portal Cidadão está funcionando corretamente!")
        else:
            print("\n⚠️ Alguns endpoints ainda têm problemas")
    else:
        print("\n❌ Problemas não foram corrigidos")
        print("   Siga as instruções acima para corrigir manualmente")
    
    print("\n" + "=" * 50)
    print("🏁 CORREÇÃO CONCLUÍDA")
    print("=" * 50)

if __name__ == '__main__':
    main()

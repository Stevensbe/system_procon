#!/usr/bin/env python
"""
Script para migrar dados do SQLite para PostgreSQL
Execute este script quando resolver o problema de encoding do PostgreSQL
"""

import os
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.db import connections
from django.core.management import call_command

def migrate_to_postgresql():
    print("🔄 Iniciando migração do SQLite para PostgreSQL...")
    
    # 1. Fazer backup dos dados atuais
    print("📦 Fazendo backup dos dados...")
    call_command('dumpdata', '--exclude', 'contenttypes', '--exclude', 'auth.Permission', 
                '--indent', '2', '--output', 'backup_data.json')
    
    # 2. Limpar o banco PostgreSQL (se existir)
    print("🧹 Limpando banco PostgreSQL...")
    try:
        with connections['postgresql'].cursor() as cursor:
            cursor.execute("DROP SCHEMA public CASCADE;")
            cursor.execute("CREATE SCHEMA public;")
            cursor.execute("GRANT ALL ON SCHEMA public TO postgres;")
            cursor.execute("GRANT ALL ON SCHEMA public TO public;")
    except Exception as e:
        print(f"⚠️ Erro ao limpar PostgreSQL: {e}")
    
    # 3. Aplicar migrações no PostgreSQL
    print("📋 Aplicando migrações no PostgreSQL...")
    os.environ['DB_ENGINE'] = 'postgresql'
    call_command('migrate', '--database', 'postgresql')
    
    # 4. Restaurar dados
    print("📥 Restaurando dados...")
    call_command('loaddata', 'backup_data.json', '--database', 'postgresql')
    
    print("✅ Migração concluída!")
    print("🔧 Agora você pode usar PostgreSQL com: $env:DB_ENGINE='postgresql'")

if __name__ == '__main__':
    migrate_to_postgresql()

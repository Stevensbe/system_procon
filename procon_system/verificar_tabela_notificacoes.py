#!/usr/bin/env python3
"""
Script para verificar a estrutura da tabela de notificações
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.db import connection

def verificar_estrutura_tabela():
    """Verifica a estrutura da tabela TipoNotificacao"""
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(notificacoes_tiponotificacao)")
        columns = cursor.fetchall()
        
        print("📋 Estrutura da tabela notificacoes_tiponotificacao:")
        print("=" * 60)
        for column in columns:
            print(f"  {column[1]} ({column[2]}) - Nullable: {column[3]} - Default: {column[4]}")
        
        print("\n📊 Dados na tabela:")
        cursor.execute("SELECT * FROM notificacoes_tiponotificacao")
        rows = cursor.fetchall()
        print(f"  Total de registros: {len(rows)}")
        
        if rows:
            print("  Primeiros registros:")
            for i, row in enumerate(rows[:3]):
                print(f"    {i+1}: {row}")

if __name__ == '__main__':
    verificar_estrutura_tabela()

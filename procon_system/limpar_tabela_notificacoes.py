#!/usr/bin/env python3
"""
Script para limpar a tabela de notificações antiga
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.db import connection

def limpar_tabela_notificacoes():
    """Limpa a tabela de notificações antiga"""
    with connection.cursor() as cursor:
        print("🧹 Limpando tabela de notificações antiga...")
        
        # Verificar se a tabela existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notificacoes_tiponotificacao'")
        if cursor.fetchone():
            # Deletar todos os registros
            cursor.execute("DELETE FROM notificacoes_tiponotificacao")
            print("  ✅ Registros deletados da tabela notificacoes_tiponotificacao")
            
            # Resetar o auto-increment
            cursor.execute("DELETE FROM sqlite_sequence WHERE name='notificacoes_tiponotificacao'")
            print("  ✅ Auto-increment resetado")
        else:
            print("  ⚠️ Tabela notificacoes_tiponotificacao não encontrada")
        
        # Verificar outras tabelas relacionadas
        tabelas = [
            'notificacoes_notificacao',
            'notificacoes_preferencianotificacao', 
            'notificacoes_lognotificacao',
            'notificacoes_templatenotificacao'
        ]
        
        for tabela in tabelas:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{tabela}'")
            if cursor.fetchone():
                cursor.execute(f"DELETE FROM {tabela}")
                cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{tabela}'")
                print(f"  ✅ Tabela {tabela} limpa")

if __name__ == '__main__':
    limpar_tabela_notificacoes()

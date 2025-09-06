#!/usr/bin/env python3
"""
Script para verificar usuários existentes
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User

def verificar_usuarios():
    """Verifica os usuários existentes"""
    print("👥 Verificando usuários existentes")
    print("=" * 40)
    
    usuarios = User.objects.all()
    
    if not usuarios.exists():
        print("❌ Nenhum usuário encontrado!")
        return
    
    print(f"📊 Total de usuários: {usuarios.count()}")
    print()
    
    for user in usuarios:
        print(f"👤 Usuário: {user.username}")
        print(f"📧 Email: {user.email}")
        print(f"🔐 Ativo: {user.is_active}")
        print(f"👑 Superuser: {user.is_superuser}")
        print(f"📅 Criado em: {user.date_joined}")
        print("-" * 30)
    
    # Verificar se existe usuário admin
    admin_user = User.objects.filter(username='admin').first()
    if admin_user:
        print("✅ Usuário 'admin' encontrado!")
        print(f"🔑 Para redefinir a senha, use: python manage.py changepassword admin")
    else:
        print("❌ Usuário 'admin' não encontrado!")

if __name__ == "__main__":
    verificar_usuarios()

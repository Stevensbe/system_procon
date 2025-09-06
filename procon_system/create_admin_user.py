#!/usr/bin/env python
"""
Script para criar usuário administrador automaticamente
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User

def criar_admin():
    print("👤 Criando usuário administrador...")
    
    # Dados do usuário
    username = 'admin'
    email = 'admin@procon.gov.br'
    password = 'admin123'
    
    # Verificar se já existe
    if User.objects.filter(username=username).exists():
        print("⚠️ Usuário 'admin' já existe!")
        user = User.objects.get(username=username)
        print(f"✅ Use: Usuário: {username}")
        print(f"✅ Use: Senha: {password} (se não mudou)")
        return user
    
    # Criar novo usuário
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    
    print("🎉 Usuário criado com sucesso!")
    print(f"👤 Usuário: {username}")
    print(f"🔑 Senha: {password}")
    print(f"📧 Email: {email}")
    print()
    print("🌐 Acesse o admin em: http://localhost:8000/admin/")
    print("🎯 Use essas credenciais para fazer login")
    
    return user

if __name__ == '__main__':
    criar_admin()

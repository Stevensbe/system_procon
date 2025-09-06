#!/usr/bin/env python3
"""
Script para redefinir a senha do admin
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User

def redefinir_senha_admin():
    """Redefine a senha do admin"""
    print("🔑 Redefinindo senha do admin...")
    
    try:
        # Buscar usuário admin
        admin_user = User.objects.get(username='admin')
        
        # Definir nova senha
        nova_senha = 'admin123'
        admin_user.set_password(nova_senha)
        admin_user.save()
        
        print("✅ Senha redefinida com sucesso!")
        print(f"👤 Usuário: admin")
        print(f"🔑 Nova senha: {nova_senha}")
        print()
        print("🎯 Agora você pode fazer login com essas credenciais")
        
    except User.DoesNotExist:
        print("❌ Usuário 'admin' não encontrado!")
    except Exception as e:
        print(f"❌ Erro ao redefinir senha: {e}")

if __name__ == "__main__":
    redefinir_senha_admin()

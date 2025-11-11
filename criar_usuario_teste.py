#!/usr/bin/env python
"""
Criar usuário de teste para verificar login
"""
import os
import django
from django.conf import settings

# Configura o ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from ti.models import PerfilUsuario

User = get_user_model()

def criar_usuario_teste():
    """Criar usuário de teste"""
    
    print("=" * 60)
    print("🧪 CRIANDO USUÁRIO DE TESTE")
    print("=" * 60)
    
    username = '12345678901'  # CPF de teste
    email = 'teste@procon.am.gov.br'
    password = '123456'
    nome = 'Usuário Teste'
    
    try:
        # Verificar se já existe
        if User.objects.filter(username=username).exists():
            print(f"⚠️  Usuário {username} já existe!")
            user = User.objects.get(username=username)
            
            # Ativar usuário
            user.is_active = True
            user.is_staff = True
            user.save()
            print("✅ Usuário reativado!")
        else:
            # Criar usuário
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=nome.split(' ')[0],
                last_name=' '.join(nome.split(' ')[1:]) if len(nome.split(' ')) > 1 else '',
                is_staff=True,
                is_active=True
            )
            print("✅ Usuário criado!")
        
        # Criar/atualizar perfil
        perfil, created = PerfilUsuario.objects.get_or_create(
            user=user,
            defaults={
                'cpf': username,
                'matricula': 'TEST001',
                'telefone': '(92) 99999-9999',
                'cargo': 'Analista de TI',
                'departamento': 'Tecnologia da Informação',
                'ativo': True
            }
        )
        
        if created:
            print("✅ Perfil criado!")
        else:
            print("✅ Perfil atualizado!")
        
        print("\n" + "=" * 60)
        print("✅ USUÁRIO DE TESTE PRONTO!")
        print("=" * 60)
        print(f"👤 Username: {username}")
        print(f"🔑 Senha: {password}")
        print(f"📧 Email: {email}")
        print(f"✅ Ativo: {'SIM' if user.is_active else 'NÃO'}")
        print(f"✅ Staff: {'SIM' if user.is_staff else 'NÃO'}")
        print("\n🎯 Agora você pode fazer login com essas credenciais!")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {str(e)}")

if __name__ == '__main__':
    criar_usuario_teste()


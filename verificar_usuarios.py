#!/usr/bin/env python
"""
Script para verificar e corrigir usuários
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

def verificar_usuarios():
    """Verificar usuários criados"""
    
    print("=" * 60)
    print("👥 VERIFICAÇÃO DE USUÁRIOS")
    print("=" * 60)
    
    # Buscar usuários staff
    users = User.objects.filter(is_staff=True)
    
    print(f"\n📊 Total de usuários staff: {users.count()}")
    
    for user in users:
        perfil = getattr(user, 'perfilusuario', None)
        print(f"\n👤 Usuário ID: {user.id}")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Nome: {user.get_full_name()}")
        print(f"   Ativo: {'✅ SIM' if user.is_active else '❌ NÃO'}")
        print(f"   Staff: {'✅ SIM' if user.is_staff else '❌ NÃO'}")
        print(f"   Superuser: {'✅ SIM' if user.is_superuser else '❌ NÃO'}")
        
        if perfil:
            print(f"   CPF: {perfil.cpf}")
            print(f"   Matrícula: {perfil.matricula}")
            print(f"   Telefone: {perfil.telefone}")
            print(f"   Cargo: {perfil.cargo}")
            print(f"   Departamento: {perfil.departamento}")
        else:
            print("   ⚠️  Perfil não encontrado!")
    
    return users

def corrigir_usuario(username):
    """Corrigir usuário específico"""
    
    try:
        user = User.objects.get(username=username)
        
        print(f"\n🔧 Corrigindo usuário: {username}")
        
        # Ativar usuário
        user.is_active = True
        user.is_staff = True
        user.save()
        
        # Criar perfil se não existir
        perfil, created = PerfilUsuario.objects.get_or_create(
            user=user,
            defaults={
                'cpf': username if len(username) == 11 else '',
                'matricula': username if len(username) != 11 else '',
                'telefone': '',
                'cargo': 'Usuário',
                'departamento': 'TI',
                'ativo': True
            }
        )
        
        if created:
            print("✅ Perfil criado!")
        else:
            print("✅ Perfil já existia!")
        
        print(f"✅ Usuário {username} corrigido com sucesso!")
        print(f"   Username: {user.username}")
        print(f"   Senha: (use a senha que você definiu)")
        print(f"   Ativo: {'✅ SIM' if user.is_active else '❌ NÃO'}")
        
        return True
        
    except User.DoesNotExist:
        print(f"❌ Usuário {username} não encontrado!")
        return False
    except Exception as e:
        print(f"❌ Erro ao corrigir usuário: {str(e)}")
        return False

def criar_usuario_teste():
    """Criar usuário de teste"""
    
    print("\n" + "=" * 60)
    print("🧪 CRIANDO USUÁRIO DE TESTE")
    print("=" * 60)
    
    username = 'teste123'
    email = 'teste@procon.am.gov.br'
    password = '123456'
    nome = 'Usuário Teste'
    
    try:
        # Verificar se já existe
        if User.objects.filter(username=username).exists():
            print(f"⚠️  Usuário {username} já existe!")
            return
        
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
        
        # Criar perfil
        PerfilUsuario.objects.create(
            user=user,
            cpf='12345678901',
            matricula='TEST123',
            telefone='(92) 99999-9999',
            cargo='Analista de TI',
            departamento='Tecnologia da Informação',
            ativo=True
        )
        
        print("✅ Usuário de teste criado com sucesso!")
        print(f"   Username: {username}")
        print(f"   Senha: {password}")
        print(f"   Email: {email}")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário de teste: {str(e)}")

if __name__ == '__main__':
    print("Escolha uma opção:")
    print("1. Verificar usuários")
    print("2. Corrigir usuário específico")
    print("3. Criar usuário de teste")
    
    opcao = input("\nDigite sua opção (1-3): ").strip()
    
    if opcao == '1':
        verificar_usuarios()
    elif opcao == '2':
        username = input("Digite o username do usuário: ").strip()
        corrigir_usuario(username)
    elif opcao == '3':
        criar_usuario_teste()
    else:
        print("❌ Opção inválida!")


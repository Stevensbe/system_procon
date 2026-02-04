#!/usr/bin/env python
"""
Script para criar usuário de teste para o painel TI
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
    """Criar usuário de teste para o painel TI"""
    
    # Dados do usuário de teste
    username = 'teste_ti'
    email = 'teste@procon.am.gov.br'
    password = '123456'
    nome = 'Usuário Teste TI'
    
    # Verificar se usuário já existe
    if User.objects.filter(username=username).exists():
        print(f"Usuário {username} já existe!")
        user = User.objects.get(username=username)
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
        print(f"Usuário {username} criado com sucesso!")
    
    # Criar ou atualizar perfil
    perfil, created = PerfilUsuario.objects.get_or_create(
        user=user,
        defaults={
            'cpf': '00000000000',
            'matricula': 'TEST001',
            'telefone': '(92) 99999-9999',
            'cargo': 'Analista de TI',
            'departamento': 'Tecnologia da Informação',
            'ativo': True
        }
    )
    
    if created:
        print(f"Perfil criado para {username}")
    else:
        print(f"Perfil já existe para {username}")
    
    print("\n" + "="*50)
    print("CREDENCIAIS DE TESTE:")
    print("="*50)
    print(f"Username: {username}")
    print(f"Email: {email}")
    print(f"Senha: {password}")
    print(f"CPF: {perfil.cpf}")
    print(f"Matrícula: {perfil.matricula}")
    print("="*50)
    
    return user

if __name__ == '__main__':
    criar_usuario_teste()

#!/usr/bin/env python
"""
Script para criar analistas jurídicos no sistema
"""
import os
import django
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

def criar_analistas_juridicos():
    """Cria analistas jurídicos de exemplo"""
    print("👨‍💼 CRIANDO ANALISTAS JURÍDICOS")
    print("=" * 50)
    
    from django.contrib.auth.models import User
    from juridico.models import AnalistaJuridico
    
    # Lista de analistas para criar
    analistas_data = [
        {
            'username': 'dr.silva',
            'email': 'dr.silva@procon.am.gov.br',
            'password': 'procon123',
            'first_name': 'João',
            'last_name': 'Silva',
            'oab': '123456/AM',
            'especialidade': 'Direito do Consumidor',
            'ativo': True
        },
        {
            'username': 'dra.santos',
            'email': 'dra.santos@procon.am.gov.br',
            'password': 'procon123',
            'first_name': 'Maria',
            'last_name': 'Santos',
            'oab': '234567/AM',
            'especialidade': 'Direito Administrativo',
            'ativo': True
        },
        {
            'username': 'dr.oliveira',
            'email': 'dr.oliveira@procon.am.gov.br',
            'password': 'procon123',
            'first_name': 'Carlos',
            'last_name': 'Oliveira',
            'oab': '345678/AM',
            'especialidade': 'Direito Civil',
            'ativo': True
        },
        {
            'username': 'dra.costa',
            'email': 'dra.costa@procon.am.gov.br',
            'password': 'procon123',
            'first_name': 'Ana',
            'last_name': 'Costa',
            'oab': '456789/AM',
            'especialidade': 'Direito do Consumidor',
            'ativo': True
        },
        {
            'username': 'dr.pereira',
            'email': 'dr.pereira@procon.am.gov.br',
            'password': 'procon123',
            'first_name': 'Roberto',
            'last_name': 'Pereira',
            'oab': '567890/AM',
            'especialidade': 'Direito Tributário',
            'ativo': True
        }
    ]
    
    analistas_criados = []
    
    for data in analistas_data:
        try:
            # Criar usuário
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'is_staff': True,
                    'is_active': True
                }
            )
            
            if created:
                user.set_password(data['password'])
                user.save()
                print(f"✅ Usuário criado: {user.username}")
            else:
                print(f"✅ Usuário encontrado: {user.username}")
            
            # Criar analista jurídico
            analista, created = AnalistaJuridico.objects.get_or_create(
                user=user,
                defaults={
                    'oab': data['oab'],
                    'especialidade': data['especialidade'],
                    'ativo': data['ativo']
                }
            )
            
            if created:
                print(f"✅ Analista criado: {analista.user.first_name} {analista.user.last_name} - {analista.oab}")
                analistas_criados.append(analista)
            else:
                print(f"✅ Analista encontrado: {analista.user.first_name} {analista.user.last_name} - {analista.oab}")
                analistas_criados.append(analista)
                
        except Exception as e:
            print(f"❌ Erro ao criar analista {data['username']}: {e}")
    
    print(f"\n📊 RESUMO: {len(analistas_criados)} analistas jurídicos configurados")
    print("\n🔑 Credenciais de acesso:")
    print("=" * 30)
    for analista in analistas_criados:
        print(f"Usuário: {analista.user.username}")
        print(f"Senha: procon123")
        print(f"Nome: {analista.user.first_name} {analista.user.last_name}")
        print(f"OAB: {analista.oab}")
        print(f"Especialidade: {analista.especialidade}")
        print("-" * 30)
    
    return analistas_criados

if __name__ == '__main__':
    criar_analistas_juridicos()

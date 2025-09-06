#!/usr/bin/env python
"""
Script simples para criar dados de teste para multas
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from multas.models import Multa, Empresa
from fiscalizacao.models import AutoInfracao
from django.utils import timezone
from datetime import timedelta

def main():
    print("Criando dados de teste...")
    
    try:
        # Criar empresa teste
        empresa, created = Empresa.objects.get_or_create(
            cnpj="98.765.432/0001-10",
            defaults={
                'razao_social': 'Supermercado Central LTDA',
                'nome_fantasia': 'Supermercado Central',
                'endereco': 'Av. Principal, 500',
                'telefone': '(92) 3333-4444',
                'ativo': True
            }
        )
        
        if created:
            print(f"Nova empresa criada: {empresa.razao_social}")
        else:
            print(f"Empresa existente: {empresa.razao_social}")
        
        # Criar auto de infração simples
        auto, created = AutoInfracao.objects.get_or_create(
            numero="AI-TEST-001/2024",
            defaults={
                'data_fiscalizacao': timezone.now().date(),
                'hora_fiscalizacao': timezone.now().time(),
                'razao_social': empresa.razao_social,
                'cnpj': empresa.cnpj,
                'endereco': empresa.endereco,
                'valor_multa': 5000.00,
                'municipio': 'Manaus',
                'estado': 'AM',
                'atividade': 'Supermercado',
                'fundamentacao_juridica': 'Art. 56 CDC'
            }
        )
        
        if created:
            print(f"Novo auto criado: {auto.numero}")
        else:
            print(f"Auto existente: {auto.numero}")
        
        # Criar multa teste
        multa, created = Multa.objects.get_or_create(
            processo=auto,
            defaults={
                'empresa': empresa,
                'valor': 5000.00,
                'status': 'pendente',
                'data_vencimento': timezone.now().date() + timedelta(days=30),
                'observacoes': 'Multa de teste criada automaticamente'
            }
        )
        
        if created:
            print(f"Nova multa criada: ID {multa.id} - R$ {multa.valor}")
        else:
            print(f"Multa existente: ID {multa.id} - R$ {multa.valor}")
        
        print("\nResumo:")
        print(f"- Empresas: {Empresa.objects.count()}")
        print(f"- Autos: {AutoInfracao.objects.count()}")
        print(f"- Multas: {Multa.objects.count()}")
        print("\nDados de teste criados com sucesso!")
        
    except Exception as e:
        print(f"Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
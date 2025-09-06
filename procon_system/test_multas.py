#!/usr/bin/env python
"""
Script para testar o módulo de multas atualizado
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

def criar_dados_teste():
    """Cria dados de teste para o módulo de multas"""
    print("Criando dados de teste...")
    
    # Criar empresa
    empresa, created = Empresa.objects.get_or_create(
        cnpj="12.345.678/0001-90",
        defaults={
            'razao_social': 'Empresa Teste LTDA',
            'nome_fantasia': 'Empresa Teste',
            'endereco': 'Rua Teste, 123',
            'telefone': '(92) 99999-9999',
            'ativo': True
        }
    )
    print(f"Empresa: {empresa.razao_social}")
    
    # Criar auto de infração
    auto, created = AutoInfracao.objects.get_or_create(
        numero="AI-001/2024",
        defaults={
            'data_fiscalizacao': timezone.now().date(),
            'hora_fiscalizacao': timezone.now().time(),
            'razao_social': empresa.razao_social,
            'cnpj': empresa.cnpj,
            'endereco': empresa.endereco,
            'valor_multa': 1000.00,
            'municipio': 'Manaus',
            'estado': 'AM',
            'atividade': 'Comercio',
            'fundamentacao_juridica': 'Teste'
        }
    )
    print(f"Auto de Infracao: {auto.numero}")
    
    # Criar multas com diferentes status
    multas_dados = [
        {
            'status': 'pendente',
            'valor': 1000.00,
            'dias_vencimento': 30
        },
        {
            'status': 'vencida', 
            'valor': 2000.00,
            'dias_vencimento': -5  # vencida há 5 dias
        },
        {
            'status': 'paga',
            'valor': 1500.00,
            'dias_vencimento': 15
        }
    ]
    
    multas_criadas = []
    for i, dados in enumerate(multas_dados):
        # Criar auto de infração para cada multa
        auto_multa, created = AutoInfracao.objects.get_or_create(
            numero=f"AI-{i+2:03d}/2024",
            defaults={
                'data_fiscalizacao': timezone.now().date(),
                'hora_fiscalizacao': timezone.now().time(),
                'razao_social': empresa.razao_social,
                'cnpj': empresa.cnpj,
                'endereco': empresa.endereco,
                'valor_multa': dados['valor'],
                'municipio': 'Manaus',
                'estado': 'AM',
                'atividade': 'Comercio',
                'fundamentacao_juridica': 'Teste'
            }
        )
        
        # Criar multa
        multa, created = Multa.objects.get_or_create(
            processo=auto_multa,
            defaults={
                'empresa': empresa,
                'valor': dados['valor'],
                'status': dados['status'],
                'data_vencimento': timezone.now().date() + timedelta(days=dados['dias_vencimento']),
                'observacoes': f"Multa de teste - Status: {dados['status']}"
            }
        )
        
        if dados['status'] == 'paga':
            multa.marcar_como_paga(observacao="Pagamento teste via script")
        elif dados['status'] == 'vencida':
            multa.status = 'vencida'
            multa.save()
            
        multas_criadas.append(multa)
        print(f"Multa {multa.id}: R$ {multa.valor} - {multa.status}")
    
    return multas_criadas

def testar_funcionalidades():
    """Testa as funcionalidades do módulo"""
    print("\nTestando funcionalidades...")
    
    # Testar propriedades do modelo
    multa = Multa.objects.first()
    if multa:
        print(f"Data vencimento: {multa.data_vencimento}")
        print(f"Esta vencida: {multa.esta_vencida}")
        print(f"Dias para vencimento: {multa.dias_para_vencimento}")
        print(f"Status: {multa.status}")
    
    # Estatísticas
    total = Multa.objects.count()
    pendentes = Multa.objects.filter(status='pendente').count()
    pagas = Multa.objects.filter(status='paga').count()
    vencidas = Multa.objects.filter(status='vencida').count()
    
    print(f"\nEstatisticas:")
    print(f"   Total: {total}")
    print(f"   Pendentes: {pendentes}")
    print(f"   Pagas: {pagas}")
    print(f"   Vencidas: {vencidas}")

def main():
    """Função principal"""
    print("Testando Modulo de Multas SISPROCON")
    print("=" * 50)
    
    try:
        multas = criar_dados_teste()
        testar_funcionalidades()
        
        print(f"\nTeste concluido com sucesso!")
        print(f"{len(multas)} multas criadas para teste")
        
    except Exception as e:
        print(f"Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
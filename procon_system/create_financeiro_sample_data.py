#!/usr/bin/env python
"""
Script para criar dados de exemplo para o módulo financeiro
"""
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from multas.models import Multa, Empresa
from fiscalizacao.models import AutoInfracao, AutoConstatacao
from django.db import models

def criar_dados_exemplo():
    """Cria dados de exemplo para o dashboard financeiro"""
    
    print("Criando dados de exemplo para o módulo financeiro...")
    
    # Verificar se já existem empresas
    empresas = list(Empresa.objects.all())
    if not empresas:
        print("Criando empresas de exemplo...")
        empresas = [
            Empresa.objects.create(
                razao_social="Empresa A Ltda",
                nome_fantasia="Empresa A",
                cnpj="12.345.678/0001-01",
                endereco="Rua A, 123",
                telefone="(11) 1234-5678"
            ),
            Empresa.objects.create(
                razao_social="Empresa B S.A.",
                nome_fantasia="Empresa B",
                cnpj="23.456.789/0001-02",
                endereco="Rua B, 456",
                telefone="(11) 2345-6789"
            ),
            Empresa.objects.create(
                razao_social="Empresa C Comércio Ltda",
                nome_fantasia="Empresa C",
                cnpj="34.567.890/0001-03",
                endereco="Rua C, 789",
                telefone="(11) 3456-7890"
            ),
            Empresa.objects.create(
                razao_social="Empresa D Indústria S.A.",
                nome_fantasia="Empresa D",
                cnpj="45.678.901/0001-04",
                endereco="Rua D, 012",
                telefone="(11) 4567-8901"
            ),
            Empresa.objects.create(
                razao_social="Empresa E Serviços Ltda",
                nome_fantasia="Empresa E",
                cnpj="56.789.012/0001-05",
                endereco="Rua E, 345",
                telefone="(11) 5678-9012"
            )
        ]
    
    # Verificar se já existem autos de constatação e infração
    autos_constatacao = list(AutoConstatacao.objects.all())
    if not autos_constatacao:
        print("Criando autos de constatação de exemplo...")
        for i in range(50):
            constatacao = AutoConstatacao.objects.create(
                template='diversos',
                numero=f"AC-2024-{i+1:04d}",
                data=datetime.now().date() - timedelta(days=random.randint(1, 365)),
                hora_inicio=datetime.now().time(),
                hora_termino=datetime.now().time(),
                razao_social=f"Empresa {i+1} Ltda",
                nome_fantasia=f"Empresa {i+1}",
                porte="Médio",
                atuacao="Comércio",
                atividade="Comércio varejista",
                endereco=f"Rua {i+1}, {random.randint(100, 999)}",
                cep="69000-000",
                municipio="Manaus",
                estado="AM",
                cnpj=f"{random.randint(10000000, 99999999)}/0001-{random.randint(10, 99)}",
                telefone=f"(92) {random.randint(3000, 9999)}-{random.randint(1000, 9999)}"
            )
            autos_constatacao.append(constatacao)
    
    # Criar autos de infração baseados nas constatações
    autos = list(AutoInfracao.objects.all())
    if not autos:
        print("Criando autos de infração de exemplo...")
        for constatacao in autos_constatacao:
            auto = AutoInfracao.objects.create(
                constatacao=constatacao,
                natureza="Infração administrativa",
                valor_multa=Decimal(random.randint(1000, 10000)),
                data_infracao=constatacao.data,
                observacoes="Auto de infração de exemplo"
            )
            autos.append(auto)
    
    # Criar multas com dados variados para os últimos 12 meses
    print("Criando multas de exemplo...")
    
    # Valores base para multas
    valores_base = [500.00, 1000.00, 1500.00, 2000.00, 2500.00, 3000.00, 5000.00, 7500.00, 10000.00]
    
    # Verificar quantas multas já existem
    multas_existentes = Multa.objects.count()
    if multas_existentes > 0:
        print(f"Já existem {multas_existentes} multas no sistema.")
        return
    
    # Criar multas para os últimos 12 meses
    for mes in range(12):
        data_base = datetime.now().date() - timedelta(days=30 * mes)
        
        # Número de multas por mês (varia entre 5 e 15)
        num_multas = random.randint(5, 15)
        
        for i in range(num_multas):
            # Data de emissão dentro do mês
            dia_emissao = random.randint(1, 28)
            data_emissao = data_base.replace(day=dia_emissao)
            
            # Valor da multa
            valor = Decimal(random.choice(valores_base))
            
            # Status (70% pagas, 30% pendentes)
            pago = random.random() < 0.7
            
            # Empresa aleatória
            empresa = random.choice(empresas)
            
            # Auto de infração aleatório (usar apenas os que ainda não têm multa)
            autos_disponiveis = [auto for auto in autos if not hasattr(auto, 'multa')]
            if not autos_disponiveis:
                break
            auto = random.choice(autos_disponiveis)
            
            # Criar a multa
            multa = Multa.objects.create(
                processo=auto,
                empresa=empresa,
                valor=valor,
                data_emissao=data_emissao,
                pago=pago
            )
            
            print(f"Criada multa #{multa.id} - R$ {valor:.2f} - {'Paga' if pago else 'Pendente'} - {data_emissao.strftime('%d/%m/%Y')}")
    
    print(f"\nDados de exemplo criados com sucesso!")
    print(f"Total de multas criadas: {Multa.objects.count()}")
    print(f"Multas pagas: {Multa.objects.filter(pago=True).count()}")
    print(f"Multas pendentes: {Multa.objects.filter(pago=False).count()}")
    
    # Calcular totais
    total_arrecadado = Multa.objects.filter(pago=True).aggregate(total=models.Sum('valor'))['total'] or 0
    total_pendente = Multa.objects.filter(pago=False).aggregate(total=models.Sum('valor'))['total'] or 0
    
    print(f"Total arrecadado: R$ {total_arrecadado:.2f}")
    print(f"Total pendente: R$ {total_pendente:.2f}")

if __name__ == '__main__':
    try:
        criar_dados_exemplo()
    except Exception as e:
        print(f"Erro ao criar dados de exemplo: {e}")
        sys.exit(1)

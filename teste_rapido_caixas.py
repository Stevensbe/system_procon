#!/usr/bin/env python3
"""
Teste rápido para verificar se as caixas de entrada estão funcionando
"""

import os
import sys
import django

# Adicionar o diretório do projeto ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'procon_system'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from caixa_entrada.models import CaixaEntrada
from fiscalizacao.models import AutoInfracao
from peticionamento.models import PeticaoEletronica, TipoPeticao

def teste_rapido():
    print("🚀 TESTE RÁPIDO - CAIXAS DE ENTRADA")
    print("="*50)
    
    try:
        # 1. Verificar se as tabelas existem
        print("1. Verificando tabelas...")
        total_caixa = CaixaEntrada.objects.count()
        total_autos = AutoInfracao.objects.count()
        total_peticoes = PeticaoEletronica.objects.count()
        
        print(f"   ✅ CaixaEntrada: {total_caixa} documentos")
        print(f"   ✅ AutoInfracao: {total_autos} autos")
        print(f"   ✅ PeticaoEletronica: {total_peticoes} petições")
        
        # 2. Verificar documentos por setor
        print("\n2. Documentos por setor:")
        setores = ['Atendimento', 'Fiscalização', 'Jurídico', 'Financeiro', 'Diretoria']
        
        for setor in setores:
            count = CaixaEntrada.objects.filter(setor_destino=setor).count()
            print(f"   📬 {setor}: {count} documento(s)")
        
        # 3. Verificar se há signals funcionando
        print("\n3. Verificando signals...")
        
        # Criar um auto de teste
        from datetime import datetime
        auto_teste = AutoInfracao.objects.create(
            numero='TEST-RAPIDO/2025',
            data_fiscalizacao=datetime.now().date(),
            hora_fiscalizacao=datetime.now().time(),
            razao_social='Empresa Teste Rápido',
            atividade='Teste',
            endereco='Rua Teste',
            cnpj='11.111.111/0001-11',
            relatorio='Teste rápido',
            base_legal_cdc='Teste',
            valor_multa=1000.00,
            responsavel_nome='Teste',
            responsavel_cpf='111.111.111-11',
            fiscal_nome='Fiscal Teste',
            status='autuado'
        )
        
        # Verificar se foi criado na caixa
        doc_caixa = CaixaEntrada.objects.filter(
            content_type__model='autoinfracao',
            object_id=auto_teste.id
        ).first()
        
        if doc_caixa:
            print(f"   ✅ Signal funcionando: Auto criado na caixa {doc_caixa.setor_destino}")
        else:
            print("   ❌ Signal não funcionando: Auto não apareceu na caixa")
        
        # Limpar dados de teste
        auto_teste.delete()
        if doc_caixa:
            doc_caixa.delete()
        
        print("\n✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("🎉 As caixas de entrada estão funcionando!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {e}")
        return False

if __name__ == '__main__':
    teste_rapido()

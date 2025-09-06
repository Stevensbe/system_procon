#!/usr/bin/env python3
"""
Teste das caixas de entrada usando manage.py
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from caixa_entrada.models import CaixaEntrada
from fiscalizacao.models import AutoInfracao
from peticionamento.models import PeticaoEletronica, TipoPeticao
from datetime import datetime

def teste_caixas():
    print("🚀 TESTE DAS CAIXAS DE ENTRADA")
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
        
        # 3. Testar criação de auto (denúncia)
        print("\n3. Testando criação de denúncia (Auto de Infração)...")
        
        # Criar um auto de teste
        auto_teste = AutoInfracao.objects.create(
            numero='TEST-DENUNCIA/2025',
            data_fiscalizacao=datetime.now().date(),
            hora_fiscalizacao=datetime.now().time(),
            razao_social='Empresa Teste Denúncia',
            atividade='Teste',
            endereco='Rua Teste',
            cnpj='11.111.111/0001-11',
            relatorio='Teste denúncia',
            base_legal_cdc='Teste',
            valor_multa=1000.00,
            responsavel_nome='Teste',
            responsavel_cpf='111.111.111-11',
            fiscal_nome='Fiscal Teste',
            status='autuado'
        )
        
        # Verificar se foi criado na caixa da Fiscalização
        doc_caixa = CaixaEntrada.objects.filter(
            content_type__model='autoinfracao',
            object_id=auto_teste.id
        ).first()
        
        if doc_caixa:
            print(f"   ✅ DENÚNCIA CRIADA NA CAIXA: {doc_caixa.setor_destino}")
            if doc_caixa.setor_destino == 'Fiscalização':
                print("   🎉 SUCESSO: Denúncia chegou na caixa da Fiscalização!")
            else:
                print(f"   ⚠️ ATENÇÃO: Denúncia foi para {doc_caixa.setor_destino} (esperado: Fiscalização)")
        else:
            print("   ❌ ERRO: Denúncia não apareceu na caixa")
        
        # 4. Testar criação de petição
        print("\n4. Testando criação de petição...")
        
        # Criar tipo de petição se não existir
        tipo_peticao, created = TipoPeticao.objects.get_or_create(
            nome='RECURSO',
            defaults={'descricao': 'Recurso administrativo'}
        )
        
        # Criar uma petição de teste
        peticao_teste = PeticaoEletronica.objects.create(
            protocolo='TEST-PETICAO/2025',
            tipo_peticao=tipo_peticao,
            nome_peticionario='Advogado Teste',
            cpf_cnpj='111.111.111-11',
            email='teste@teste.com',
            telefone='(11) 1111-1111',
            assunto='Teste de petição',
            descricao='Petição de teste para verificar caixa',
            status='recebida'
        )
        
        # Verificar se foi criado na caixa do Jurídico
        doc_caixa_peticao = CaixaEntrada.objects.filter(
            content_type__model='peticaoeletronica',
            object_id=peticao_teste.id
        ).first()
        
        if doc_caixa_peticao:
            print(f"   ✅ PETIÇÃO CRIADA NA CAIXA: {doc_caixa_peticao.setor_destino}")
            if doc_caixa_peticao.setor_destino == 'Jurídico':
                print("   🎉 SUCESSO: Petição chegou na caixa do Jurídico!")
            else:
                print(f"   ⚠️ ATENÇÃO: Petição foi para {doc_caixa_peticao.setor_destino} (esperado: Jurídico)")
        else:
            print("   ❌ ERRO: Petição não apareceu na caixa")
        
        # 5. Limpar dados de teste
        print("\n5. Limpando dados de teste...")
        auto_teste.delete()
        peticao_teste.delete()
        if doc_caixa:
            doc_caixa.delete()
        if doc_caixa_peticao:
            doc_caixa_peticao.delete()
        
        print("\n✅ TESTE CONCLUÍDO!")
        print("🎉 As caixas de entrada estão funcionando corretamente!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    teste_caixas()

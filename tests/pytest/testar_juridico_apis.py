#!/usr/bin/env python
"""
Script para testar todas as APIs do módulo jurídico
"""
import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

BASE_URL = 'http://localhost:8000/api/juridico/api'

def testar_apis():
    print("🧪 TESTANDO APIs DO MÓDULO JURÍDICO")
    print("=" * 50)
    
    # 1. Testar Dashboard
    print("\n1️⃣ Testando Dashboard...")
    try:
        response = requests.get(f'http://localhost:8000/api/juridico/api/dashboard/')
        if response.status_code == 200:
            print("✅ Dashboard: OK")
            data = response.json()
            print(f"   - Total de processos: {data.get('total_processos', 'N/A')}")
        else:
            print(f"❌ Dashboard: ERRO {response.status_code}")
    except Exception as e:
        print(f"❌ Dashboard: ERRO {str(e)}")
    
    # 2. Testar Estatísticas
    print("\n2️⃣ Testando Estatísticas...")
    try:
        response = requests.get(f'http://localhost:8000/api/juridico/api/estatisticas/')
        if response.status_code == 200:
            print("✅ Estatísticas: OK")
            data = response.json()
            print(f"   - Dados retornados: {len(data) if isinstance(data, list) else 'dict'}")
        else:
            print(f"❌ Estatísticas: ERRO {response.status_code}")
    except Exception as e:
        print(f"❌ Estatísticas: ERRO {str(e)}")
    
    # 3. Testar Lista de Analistas
    print("\n3️⃣ Testando Lista de Analistas...")
    try:
        response = requests.get(f'{BASE_URL}/analistas/')
        if response.status_code == 200:
            print("✅ Lista de Analistas: OK")
            data = response.json()
            print(f"   - Total de analistas: {data.get('count', len(data))}")
        else:
            print(f"❌ Lista de Analistas: ERRO {response.status_code}")
    except Exception as e:
        print(f"❌ Lista de Analistas: ERRO {str(e)}")
    
    # 4. Testar Lista de Processos
    print("\n4️⃣ Testando Lista de Processos...")
    try:
        response = requests.get(f'{BASE_URL}/processos/')
        if response.status_code == 200:
            print("✅ Lista de Processos: OK")
            data = response.json()
            total = data.get('count', len(data))
            print(f"   - Total de processos: {total}")
            
            # Se há processos, testar detalhe do primeiro
            if total > 0:
                if 'results' in data and data['results']:
                    primeiro_id = data['results'][0]['id']
                elif isinstance(data, list) and data:
                    primeiro_id = data[0]['id']
                else:
                    primeiro_id = None
                
                if primeiro_id:
                    print(f"\n5️⃣ Testando Detalhe do Processo {primeiro_id}...")
                    try:
                        response = requests.get(f'{BASE_URL}/processos/{primeiro_id}/')
                        if response.status_code == 200:
                            print("✅ Detalhe do Processo: OK")
                            processo = response.json()
                            print(f"   - Número: {processo.get('numero', 'N/A')}")
                            print(f"   - Parte: {processo.get('parte', 'N/A')}")
                            print(f"   - Status: {processo.get('status', 'N/A')}")
                        else:
                            print(f"❌ Detalhe do Processo: ERRO {response.status_code}")
                    except Exception as e:
                        print(f"❌ Detalhe do Processo: ERRO {str(e)}")
        else:
            print(f"❌ Lista de Processos: ERRO {response.status_code}")
    except Exception as e:
        print(f"❌ Lista de Processos: ERRO {str(e)}")
    
    # 6. Testar Criação de Processo
    print("\n6️⃣ Testando Criação de Processo...")
    try:
        novo_processo = {
            'parte': 'João da Silva (Teste)',
            'empresa_cnpj': '12.345.678/0001-99',
            'assunto': 'Teste de Processo via API',
            'descricao': f'Processo de teste criado em {datetime.now().strftime("%d/%m/%Y %H:%M")}',
            'status': 'ABERTO',
            'prioridade': 'MEDIA',
            'valor_causa': '1500.00'
        }
        
        response = requests.post(f'{BASE_URL}/processos/', 
                               json=novo_processo,
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 201:
            print("✅ Criação de Processo: OK")
            processo_criado = response.json()
            print(f"   - ID criado: {processo_criado.get('id')}")
            print(f"   - Número: {processo_criado.get('numero')}")
            
            # Testar atualização do processo criado
            processo_id = processo_criado.get('id')
            if processo_id:
                print(f"\n7️⃣ Testando Atualização do Processo {processo_id}...")
                try:
                    processo_atualizado = {
                        'parte': 'João da Silva (Teste - Atualizado)',
                        'empresa_cnpj': '12.345.678/0001-99',
                        'assunto': 'Teste de Processo via API - ATUALIZADO',
                        'descricao': f'Processo de teste ATUALIZADO em {datetime.now().strftime("%d/%m/%Y %H:%M")}',
                        'status': 'EM_ANALISE',
                        'prioridade': 'ALTA',
                        'valor_causa': '2500.00'
                    }
                    
                    response = requests.put(f'{BASE_URL}/processos/{processo_id}/', 
                                          json=processo_atualizado,
                                          headers={'Content-Type': 'application/json'})
                    
                    if response.status_code == 200:
                        print("✅ Atualização de Processo: OK")
                        processo_novo = response.json()
                        print(f"   - Status: {processo_novo.get('status')}")
                        print(f"   - Prioridade: {processo_novo.get('prioridade')}")
                    else:
                        print(f"❌ Atualização de Processo: ERRO {response.status_code}")
                        print(f"   - Response: {response.text}")
                except Exception as e:
                    print(f"❌ Atualização de Processo: ERRO {str(e)}")
        else:
            print(f"❌ Criação de Processo: ERRO {response.status_code}")
            print(f"   - Response: {response.text}")
    except Exception as e:
        print(f"❌ Criação de Processo: ERRO {str(e)}")
    
    # 8. Testar outras APIs
    print("\n8️⃣ Testando outras APIs...")
    apis_para_testar = [
        ('analises', 'Análises'),
        ('respostas', 'Respostas'),
        ('prazos', 'Prazos'),
        ('documentos', 'Documentos'),
        ('historico', 'Histórico'),
        ('configuracoes', 'Configurações')
    ]
    
    for endpoint, nome in apis_para_testar:
        try:
            response = requests.get(f'{BASE_URL}/{endpoint}/')
            if response.status_code == 200:
                print(f"   ✅ {nome}: OK")
            else:
                print(f"   ❌ {nome}: ERRO {response.status_code}")
        except Exception as e:
            print(f"   ❌ {nome}: ERRO {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 TESTE CONCLUÍDO!")

if __name__ == '__main__':
    testar_apis()


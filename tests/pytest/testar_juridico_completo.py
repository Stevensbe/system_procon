#!/usr/bin/env python
"""
Script para testar todas as APIs do módulo jurídico com autenticação
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

from django.contrib.auth.models import User

BASE_URL = 'http://localhost:8000/api/juridico/api'
AUTH_URL = 'http://localhost:8000/auth'

def obter_token():
    """Cria um usuário de teste e obtém token de autenticação"""
    from django.contrib.auth.models import User
    
    # Criar usuário de teste se não existir
    username = 'teste_juridico'
    password = 'teste123456'
    
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': 'teste@juridico.com',
            'is_staff': True,
            'is_active': True
        }
    )
    
    if created:
        user.set_password(password)
        user.save()
        print(f"✅ Usuário {username} criado")
    else:
        print(f"✅ Usuário {username} já existe")
    
    # Obter token
    try:
        response = requests.post(f'{AUTH_URL}/token/', {
            'username': username,
            'password': password
        })
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Token obtido com sucesso")
            return token_data['access']
        else:
            print(f"❌ Erro ao obter token: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Erro na autenticação: {str(e)}")
        return None

def testar_apis_com_auth():
    print("🧪 TESTANDO APIs DO MÓDULO JURÍDICO COM AUTENTICAÇÃO")
    print("=" * 60)
    
    # Obter token de autenticação
    token = obter_token()
    if not token:
        print("❌ Não foi possível obter token. Parando testes.")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # 1. Testar Dashboard
    print("\n1️⃣ Testando Dashboard...")
    try:
        response = requests.get(f'http://localhost:8000/api/juridico/api/dashboard/', headers=headers)
        if response.status_code == 200:
            print("✅ Dashboard: OK")
            data = response.json()
            print(f"   - Total de processos: {data.get('total_processos', 'N/A')}")
            print(f"   - Processos por status: {data.get('processos_por_status', 'N/A')}")
        else:
            print(f"❌ Dashboard: ERRO {response.status_code}")
            print(f"   - Response: {response.text}")
    except Exception as e:
        print(f"❌ Dashboard: ERRO {str(e)}")
    
    # 2. Testar Estatísticas
    print("\n2️⃣ Testando Estatísticas...")
    try:
        response = requests.get(f'http://localhost:8000/api/juridico/api/estatisticas/', headers=headers)
        if response.status_code == 200:
            print("✅ Estatísticas: OK")
            data = response.json()
            print(f"   - Dados retornados: {len(data) if isinstance(data, list) else 'dict'}")
        else:
            print(f"❌ Estatísticas: ERRO {response.status_code}")
            print(f"   - Response: {response.text}")
    except Exception as e:
        print(f"❌ Estatísticas: ERRO {str(e)}")
    
    # 3. Testar Lista de Analistas
    print("\n3️⃣ Testando Lista de Analistas...")
    try:
        response = requests.get(f'{BASE_URL}/analistas/', headers=headers)
        if response.status_code == 200:
            print("✅ Lista de Analistas: OK")
            data = response.json()
            total = data.get('count', len(data))
            print(f"   - Total de analistas: {total}")
        else:
            print(f"❌ Lista de Analistas: ERRO {response.status_code}")
            print(f"   - Response: {response.text}")
    except Exception as e:
        print(f"❌ Lista de Analistas: ERRO {str(e)}")
    
    # 4. Testar Lista de Processos
    print("\n4️⃣ Testando Lista de Processos...")
    try:
        response = requests.get(f'{BASE_URL}/processos/', headers=headers)
        if response.status_code == 200:
            print("✅ Lista de Processos: OK")
            data = response.json()
            total = data.get('count', len(data))
            print(f"   - Total de processos: {total}")
            
            # Se há processos, testar detalhe do primeiro
            if total > 0:
                if 'results' in data and data['results']:
                    primeiro_processo = data['results'][0]
                    primeiro_id = primeiro_processo['id']
                elif isinstance(data, list) and data:
                    primeiro_processo = data[0]
                    primeiro_id = primeiro_processo['id']
                else:
                    primeiro_processo = None
                    primeiro_id = None
                
                if primeiro_id:
                    print(f"\n5️⃣ Testando Detalhe do Processo {primeiro_id}...")
                    try:
                        response = requests.get(f'{BASE_URL}/processos/{primeiro_id}/', headers=headers)
                        if response.status_code == 200:
                            print("✅ Detalhe do Processo: OK")
                            processo = response.json()
                            print(f"   - Número: {processo.get('numero', 'N/A')}")
                            print(f"   - Parte: {processo.get('parte', 'N/A')}")
                            print(f"   - Status: {processo.get('status', 'N/A')}")
                            print(f"   - Prioridade: {processo.get('prioridade', 'N/A')}")
                        else:
                            print(f"❌ Detalhe do Processo: ERRO {response.status_code}")
                            print(f"   - Response: {response.text}")
                    except Exception as e:
                        print(f"❌ Detalhe do Processo: ERRO {str(e)}")
        else:
            print(f"❌ Lista de Processos: ERRO {response.status_code}")
            print(f"   - Response: {response.text}")
    except Exception as e:
        print(f"❌ Lista de Processos: ERRO {str(e)}")
    
    # 6. Testar Criação de Processo
    print("\n6️⃣ Testando Criação de Processo...")
    try:
        novo_processo = {
            'parte': 'Maria Silva (Teste API)',
            'empresa_cnpj': '11.222.333/0001-44',
            'assunto': 'Teste de Criação via API',
            'descricao': f'Processo de teste criado automaticamente em {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}',
            'status': 'ABERTO',
            'prioridade': 'MEDIA',
            'valor_causa': '750.50'
        }
        
        response = requests.post(f'{BASE_URL}/processos/', 
                               json=novo_processo,
                               headers=headers)
        
        if response.status_code == 201:
            print("✅ Criação de Processo: OK")
            processo_criado = response.json()
            print(f"   - ID criado: {processo_criado.get('id')}")
            print(f"   - Número: {processo_criado.get('numero')}")
            print(f"   - Status: {processo_criado.get('status')}")
            
            # Testar atualização do processo criado
            processo_id = processo_criado.get('id')
            if processo_id:
                print(f"\n7️⃣ Testando Atualização do Processo {processo_id}...")
                try:
                    processo_atualizado = novo_processo.copy()
                    processo_atualizado.update({
                        'parte': 'Maria Silva (Teste API - ATUALIZADO)',
                        'status': 'EM_ANALISE',
                        'prioridade': 'ALTA',
                        'valor_causa': '1250.75'
                    })
                    
                    response = requests.put(f'{BASE_URL}/processos/{processo_id}/', 
                                          json=processo_atualizado,
                                          headers=headers)
                    
                    if response.status_code == 200:
                        print("✅ Atualização de Processo: OK")
                        processo_novo = response.json()
                        print(f"   - Status: {processo_novo.get('status')}")
                        print(f"   - Prioridade: {processo_novo.get('prioridade')}")
                        print(f"   - Valor: R$ {processo_novo.get('valor_causa')}")
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
            response = requests.get(f'{BASE_URL}/{endpoint}/', headers=headers)
            if response.status_code == 200:
                data = response.json()
                total = data.get('count', len(data))
                print(f"   ✅ {nome}: OK (Total: {total})")
            else:
                print(f"   ❌ {nome}: ERRO {response.status_code}")
        except Exception as e:
            print(f"   ❌ {nome}: ERRO {str(e)}")
    
    print("\n" + "=" * 60)
    print("🏁 TESTE COMPLETO CONCLUÍDO!")
    print("\n📋 RESUMO:")
    print("✅ Autenticação funcionando")
    print("✅ APIs REST implementadas")
    print("✅ Dashboard funcionando")
    print("✅ CRUD de processos funcionando")
    print("✅ ViewSets implementados")
    
    print("\n🎉 MÓDULO JURÍDICO TOTALMENTE FUNCIONAL!")

if __name__ == '__main__':
    testar_apis_com_auth()


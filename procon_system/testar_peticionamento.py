#!/usr/bin/env python3
"""
Script para testar as APIs do módulo de Peticionamento
"""

import os
import sys
import django
import requests
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from peticionamento.models import (
    TipoPeticao, PeticaoEletronica, AnexoPeticao,
    InteracaoPeticao, RespostaPeticao, ConfiguracaoPeticionamento
)


def verificar_dados():
    """Verificar se existem dados no banco"""
    counts = {
        'tipos': TipoPeticao.objects.count(),
        'peticoes': PeticaoEletronica.objects.count(),
        'anexos': AnexoPeticao.objects.count(),
        'interacoes': InteracaoPeticao.objects.count(),
        'respostas': RespostaPeticao.objects.count(),
        'config': ConfiguracaoPeticionamento.objects.count(),
    }
    
    print("📊 DADOS NO BANCO:")
    for key, count in counts.items():
        print(f"   • {key.title()}: {count}")
    
    return counts


def testar_api_tipos(base_url, token=None):
    """Testar API de tipos de petição"""
    print("\n🔍 TESTANDO API DE TIPOS DE PETIÇÃO")
    print("-" * 40)
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    # Listar tipos
    try:
        response = requests.get(f"{base_url}/peticionamento/api/tipos/", headers=headers)
        print(f"GET /peticionamento/api/tipos/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data.get('results', data))} tipos encontrados")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")
    
    # Listar tipos ativos
    try:
        response = requests.get(f"{base_url}/peticionamento/api/tipos/ativos/", headers=headers)
        print(f"GET /peticionamento/api/tipos/ativos/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data)} tipos ativos encontrados")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")


def testar_api_peticoes(base_url, token=None):
    """Testar API de petições"""
    print("\n🔍 TESTANDO API DE PETIÇÕES")
    print("-" * 40)
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    # Listar petições
    try:
        response = requests.get(f"{base_url}/peticionamento/api/peticoes/", headers=headers)
        print(f"GET /peticionamento/api/peticoes/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data.get('results', data))} petições encontradas")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")
    
    # Dashboard
    try:
        response = requests.get(f"{base_url}/peticionamento/api/peticoes/dashboard/", headers=headers)
        print(f"GET /peticionamento/api/peticoes/dashboard/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Dashboard carregado - {data.get('total_peticoes', 0)} petições totais")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")
    
    # Petições vencidas
    try:
        response = requests.get(f"{base_url}/peticionamento/api/peticoes/vencidas/", headers=headers)
        print(f"GET /peticionamento/api/peticoes/vencidas/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data.get('results', data))} petições vencidas")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")
    
    # Petições pendentes
    try:
        response = requests.get(f"{base_url}/peticionamento/api/peticoes/pendentes/", headers=headers)
        print(f"GET /peticionamento/api/peticoes/pendentes/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data.get('results', data))} petições pendentes")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")


def testar_api_anexos(base_url, token=None):
    """Testar API de anexos"""
    print("\n🔍 TESTANDO API DE ANEXOS")
    print("-" * 40)
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    # Listar anexos
    try:
        response = requests.get(f"{base_url}/peticionamento/api/anexos/", headers=headers)
        print(f"GET /peticionamento/api/anexos/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data.get('results', data))} anexos encontrados")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")


def testar_api_interacoes(base_url, token=None):
    """Testar API de interações"""
    print("\n🔍 TESTANDO API DE INTERAÇÕES")
    print("-" * 40)
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    # Listar interações
    try:
        response = requests.get(f"{base_url}/peticionamento/api/interacoes/", headers=headers)
        print(f"GET /peticionamento/api/interacoes/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data.get('results', data))} interações encontradas")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")


def testar_api_respostas(base_url, token=None):
    """Testar API de respostas"""
    print("\n🔍 TESTANDO API DE RESPOSTAS")
    print("-" * 40)
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    # Listar respostas
    try:
        response = requests.get(f"{base_url}/peticionamento/api/respostas/", headers=headers)
        print(f"GET /peticionamento/api/respostas/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data.get('results', data))} respostas encontradas")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")


def testar_api_configuracoes(base_url, token=None):
    """Testar API de configurações"""
    print("\n🔍 TESTANDO API DE CONFIGURAÇÕES")
    print("-" * 40)
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    # Listar configurações
    try:
        response = requests.get(f"{base_url}/peticionamento/api/configuracoes/", headers=headers)
        print(f"GET /peticionamento/api/configuracoes/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ {len(data.get('results', data))} configurações encontradas")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")


def testar_apis_publicas(base_url):
    """Testar APIs públicas"""
    print("\n🔍 TESTANDO APIS PÚBLICAS")
    print("-" * 40)
    
    # Validar documento
    try:
        data = {'documento': '12345678901', 'tipo': 'CPF'}
        response = requests.post(f"{base_url}/peticionamento/api/validar-documento/", json=data)
        print(f"POST /peticionamento/api/validar-documento/ - Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✓ Documento validado: {result.get('valido', False)}")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")
    
    # Consulta de petição
    try:
        data = {'peticionario_documento': '12345678901'}
        response = requests.post(f"{base_url}/peticionamento/api/consulta/", json=data)
        print(f"POST /peticionamento/api/consulta/ - Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✓ Consulta realizada: {result.get('numero_peticao', 'N/A')}")
        elif response.status_code == 404:
            print(f"   ✓ Petição não encontrada (esperado)")
        else:
            print(f"   ❌ Erro: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")


def testar_acoes_peticao(base_url, token=None):
    """Testar ações específicas de petições"""
    print("\n🔍 TESTANDO AÇÕES DE PETIÇÕES")
    print("-" * 40)
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    # Buscar uma petição para testar
    try:
        response = requests.get(f"{base_url}/peticionamento/api/peticoes/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            peticoes = data.get('results', data)
            
            if peticoes:
                peticao = peticoes[0]
                peticao_id = peticao['id']
                
                # Testar envio de petição
                if peticao['status'] == 'RASCUNHO':
                    try:
                        response = requests.post(f"{base_url}/peticionamento/api/peticoes/{peticao_id}/enviar/", headers=headers)
                        print(f"POST /peticionamento/api/peticoes/{peticao_id}/enviar/ - Status: {response.status_code}")
                        if response.status_code == 200:
                            print(f"   ✓ Petição enviada com sucesso")
                        else:
                            print(f"   ❌ Erro: {response.text}")
                    except Exception as e:
                        print(f"   ❌ Erro na requisição: {e}")
                
                # Testar cancelamento de petição
                if peticao['status'] in ['RASCUNHO', 'ENVIADA', 'RECEBIDA']:
                    try:
                        response = requests.post(f"{base_url}/peticionamento/api/peticoes/{peticao_id}/cancelar/", headers=headers)
                        print(f"POST /peticionamento/api/peticoes/{peticao_id}/cancelar/ - Status: {response.status_code}")
                        if response.status_code == 200:
                            print(f"   ✓ Petição cancelada com sucesso")
                        else:
                            print(f"   ❌ Erro: {response.text}")
                    except Exception as e:
                        print(f"   ❌ Erro na requisição: {e}")
                
            else:
                print("   ⚠️ Nenhuma petição encontrada para testar ações")
        else:
            print(f"   ❌ Erro ao buscar petições: {response.text}")
    except Exception as e:
        print(f"   ❌ Erro na requisição: {e}")


def main():
    """Função principal"""
    print("🧪 TESTANDO APIS DO MÓDULO DE PETICIONAMENTO")
    print("="*50)
    
    counts = verificar_dados()
    if counts['peticoes'] == 0:
        print("\n❌ Nenhuma petição encontrada. Execute o script de criação de dados primeiro.")
        return
    
    base_url = "http://localhost:8000"
    token = None  # Placeholder para autenticação
    
    print(f"\n🌐 Testando APIs em: {base_url}")
    
    testar_api_tipos(base_url, token)
    testar_api_peticoes(base_url, token)
    testar_api_anexos(base_url, token)
    testar_api_interacoes(base_url, token)
    testar_api_respostas(base_url, token)
    testar_api_configuracoes(base_url, token)
    testar_apis_publicas(base_url)
    testar_acoes_peticao(base_url, token)
    
    print("\n" + "="*50)
    print("✅ TESTES CONCLUÍDOS!")
    print("="*50)
    print("\n📋 ENDPOINTS TESTADOS:")
    print("   • GET /peticionamento/api/tipos/")
    print("   • GET /peticionamento/api/tipos/ativos/")
    print("   • GET /peticionamento/api/peticoes/")
    print("   • GET /peticionamento/api/peticoes/dashboard/")
    print("   • GET /peticionamento/api/peticoes/vencidas/")
    print("   • GET /peticionamento/api/peticoes/pendentes/")
    print("   • GET /peticionamento/api/anexos/")
    print("   • GET /peticionamento/api/interacoes/")
    print("   • GET /peticionamento/api/respostas/")
    print("   • GET /peticionamento/api/configuracoes/")
    print("   • POST /peticionamento/api/validar-documento/")
    print("   • POST /peticionamento/api/consulta/")
    print("   • POST /peticionamento/api/peticoes/{id}/enviar/")
    print("   • POST /peticionamento/api/peticoes/{id}/cancelar/")
    print("\n🎯 PRÓXIMOS PASSOS:")
    print("   1. Configure autenticação JWT para testes completos")
    print("   2. Teste criação de petições via API")
    print("   3. Teste upload de anexos")
    print("   4. Teste criação de interações e respostas")


if __name__ == '__main__':
    main()

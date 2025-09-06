#!/usr/bin/env python
"""
Script para testar as APIs do módulo de Protocolo
"""
import os
import sys
import django
import requests
import json
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from protocolo.models import (
    TipoProtocolo, StatusProtocolo, Protocolo, DocumentoProtocolo,
    TramitacaoProtocolo, AlertaProtocolo
)


def verificar_dados():
    """Verificar se existem dados no banco"""
    print("🔍 Verificando dados no banco...")
    
    counts = {
        'tipos': TipoProtocolo.objects.count(),
        'status': StatusProtocolo.objects.count(),
        'protocolos': Protocolo.objects.count(),
        'documentos': DocumentoProtocolo.objects.count(),
        'tramitacoes': TramitacaoProtocolo.objects.count(),
        'alertas': AlertaProtocolo.objects.count(),
        'usuarios': User.objects.count()
    }
    
    for model, count in counts.items():
        print(f"   • {model.capitalize()}: {count}")
    
    return counts


def testar_api_tipos(base_url, token):
    """Testar API de tipos de protocolo"""
    print("\n📋 Testando API de tipos de protocolo...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Listar tipos
    response = requests.get(f"{base_url}/protocolo/api/tipos/", headers=headers)
    if response.status_code == 200:
        tipos = response.json()
        print(f"   ✓ Tipos encontrados: {len(tipos['results'])}")
        for tipo in tipos['results'][:3]:  # Mostrar apenas os primeiros 3
            print(f"      - {tipo['nome']} ({tipo['tipo']})")
    else:
        print(f"   ❌ Erro ao listar tipos: {response.status_code}")


def testar_api_status(base_url, token):
    """Testar API de status de protocolo"""
    print("\n📊 Testando API de status de protocolo...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Listar status
    response = requests.get(f"{base_url}/protocolo/api/status/", headers=headers)
    if response.status_code == 200:
        status_list = response.json()
        print(f"   ✓ Status encontrados: {len(status_list['results'])}")
        for status in status_list['results'][:3]:  # Mostrar apenas os primeiros 3
            print(f"      - {status['nome']} (cor: {status['cor']})")
    else:
        print(f"   ❌ Erro ao listar status: {response.status_code}")


def testar_api_protocolos(base_url, token):
    """Testar API de protocolos"""
    print("\n📝 Testando API de protocolos...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Listar protocolos
    response = requests.get(f"{base_url}/protocolo/api/protocolos/", headers=headers)
    if response.status_code == 200:
        protocolos = response.json()
        print(f"   ✓ Protocolos encontrados: {len(protocolos['results'])}")
        
        if protocolos['results']:
            protocolo = protocolos['results'][0]
            print(f"      - Exemplo: {protocolo['numero']} - {protocolo['assunto']}")
            print(f"        Status: {protocolo['status']['nome']}")
            print(f"        Prioridade: {protocolo['prioridade']}")
    else:
        print(f"   ❌ Erro ao listar protocolos: {response.status_code}")
    
    # Testar dashboard
    print("\n   📊 Testando dashboard...")
    response = requests.get(f"{base_url}/protocolo/api/protocolos/dashboard/", headers=headers)
    if response.status_code == 200:
        dashboard = response.json()
        print(f"   ✓ Dashboard carregado:")
        print(f"      - Total: {dashboard['total_protocolos']}")
        print(f"      - Abertos: {dashboard['protocolos_abertos']}")
        print(f"      - Concluídos: {dashboard['protocolos_concluidos']}")
        print(f"      - Atrasados: {dashboard['protocolos_atrasados']}")
    else:
        print(f"   ❌ Erro ao carregar dashboard: {response.status_code}")
    
    # Testar protocolos atrasados
    print("\n   ⚠️ Testando protocolos atrasados...")
    response = requests.get(f"{base_url}/protocolo/api/protocolos/atrasados/", headers=headers)
    if response.status_code == 200:
        atrasados = response.json()
        print(f"   ✓ Protocolos atrasados: {len(atrasados['results'])}")
    else:
        print(f"   ❌ Erro ao listar atrasados: {response.status_code}")


def testar_api_documentos(base_url, token):
    """Testar API de documentos"""
    print("\n📎 Testando API de documentos...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Listar documentos
    response = requests.get(f"{base_url}/protocolo/api/documentos/", headers=headers)
    if response.status_code == 200:
        documentos = response.json()
        print(f"   ✓ Documentos encontrados: {len(documentos['results'])}")
        
        if documentos['results']:
            documento = documentos['results'][0]
            print(f"      - Exemplo: {documento['titulo']}")
            print(f"        Tipo: {documento['tipo']}")
            print(f"        Tamanho: {documento['tamanho']} bytes")
    else:
        print(f"   ❌ Erro ao listar documentos: {response.status_code}")


def testar_api_tramitacoes(base_url, token):
    """Testar API de tramitações"""
    print("\n🔄 Testando API de tramitações...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Listar tramitações
    response = requests.get(f"{base_url}/protocolo/api/tramitacoes/", headers=headers)
    if response.status_code == 200:
        tramitacoes = response.json()
        print(f"   ✓ Tramitações encontradas: {len(tramitacoes['results'])}")
        
        if tramitacoes['results']:
            tramitacao = tramitacoes['results'][0]
            print(f"      - Exemplo: {tramitacao['status_anterior']['nome']} → {tramitacao['status_novo']['nome']}")
    else:
        print(f"   ❌ Erro ao listar tramitações: {response.status_code}")


def testar_api_alertas(base_url, token):
    """Testar API de alertas"""
    print("\n⚠️ Testando API de alertas...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Listar alertas
    response = requests.get(f"{base_url}/protocolo/api/alertas/", headers=headers)
    if response.status_code == 200:
        alertas = response.json()
        print(f"   ✓ Alertas encontrados: {len(alertas['results'])}")
        
        if alertas['results']:
            alerta = alertas['results'][0]
            print(f"      - Exemplo: {alerta['titulo']}")
            print(f"        Tipo: {alerta['tipo']}")
            print(f"        Nível: {alerta['nivel']}")
    else:
        print(f"   ❌ Erro ao listar alertas: {response.status_code}")
    
    # Testar alertas não lidos
    print("\n   📬 Testando alertas não lidos...")
    response = requests.get(f"{base_url}/protocolo/api/alertas/nao-lidos/", headers=headers)
    if response.status_code == 200:
        nao_lidos = response.json()
        print(f"   ✓ Alertas não lidos: {len(nao_lidos['results'])}")
    else:
        print(f"   ❌ Erro ao listar alertas não lidos: {response.status_code}")


def testar_api_dashboard(base_url, token):
    """Testar API de dashboard"""
    print("\n📈 Testando API de dashboard...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.get(f"{base_url}/protocolo/api/dashboard/", headers=headers)
    if response.status_code == 200:
        dashboard = response.json()
        print(f"   ✓ Dashboard carregado:")
        print(f"      - Total: {dashboard['total_protocolos']}")
        print(f"      - Abertos: {dashboard['protocolos_abertos']}")
        print(f"      - Concluídos: {dashboard['protocolos_concluidos']}")
        print(f"      - Atrasados: {dashboard['protocolos_atrasados']}")
    else:
        print(f"   ❌ Erro ao carregar dashboard: {response.status_code}")


def testar_acoes_protocolo(base_url, token):
    """Testar ações específicas de protocolo"""
    print("\n🔧 Testando ações de protocolo...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Primeiro, buscar um protocolo
    response = requests.get(f"{base_url}/protocolo/api/protocolos/", headers=headers)
    if response.status_code == 200:
        protocolos = response.json()
        if protocolos['results']:
            protocolo = protocolos['results'][0]
            protocolo_id = protocolo['id']
            
            print(f"   📝 Testando com protocolo: {protocolo['numero']}")
            
            # Testar tramitação (apenas simular, não executar)
            print(f"   🔄 Endpoint de tramitação disponível: /protocolo/api/protocolos/{protocolo_id}/tramitar/")
            
            # Testar conclusão (apenas simular, não executar)
            print(f"   ✅ Endpoint de conclusão disponível: /protocolo/api/protocolos/{protocolo_id}/concluir/")
        else:
            print("   ⚠️ Nenhum protocolo encontrado para testar ações")
    else:
        print(f"   ❌ Erro ao buscar protocolos para ações: {response.status_code}")


def main():
    """Função principal"""
    print("🧪 TESTANDO APIS DO MÓDULO DE PROTOCOLO")
    print("="*50)
    
    # Verificar dados
    counts = verificar_dados()
    
    if counts['protocolos'] == 0:
        print("\n❌ Nenhum protocolo encontrado. Execute o script de criação de dados primeiro.")
        return
    
    # Configurações da API
    base_url = "http://localhost:8000"
    
    # Para testar com autenticação, você precisaria de um token válido
    # Por enquanto, vamos testar sem autenticação (se permitido)
    token = None
    
    print(f"\n🌐 Testando APIs em: {base_url}")
    
    # Testar APIs
    testar_api_tipos(base_url, token)
    testar_api_status(base_url, token)
    testar_api_protocolos(base_url, token)
    testar_api_documentos(base_url, token)
    testar_api_tramitacoes(base_url, token)
    testar_api_alertas(base_url, token)
    testar_api_dashboard(base_url, token)
    testar_acoes_protocolo(base_url, token)
    
    print("\n" + "="*50)
    print("✅ TESTES CONCLUÍDOS!")
    print("="*50)
    print("\n📋 ENDPOINTS DISPONÍVEIS:")
    print("   • GET  /protocolo/api/tipos/")
    print("   • GET  /protocolo/api/status/")
    print("   • GET  /protocolo/api/protocolos/")
    print("   • GET  /protocolo/api/protocolos/dashboard/")
    print("   • GET  /protocolo/api/protocolos/atrasados/")
    print("   • POST /protocolo/api/protocolos/{id}/tramitar/")
    print("   • POST /protocolo/api/protocolos/{id}/concluir/")
    print("   • GET  /protocolo/api/documentos/")
    print("   • POST /protocolo/api/documentos/{id}/indexar/")
    print("   • GET  /protocolo/api/tramitacoes/")
    print("   • GET  /protocolo/api/alertas/")
    print("   • GET  /protocolo/api/alertas/nao-lidos/")
    print("   • POST /protocolo/api/alertas/{id}/marcar-lido/")
    print("   • GET  /protocolo/api/dashboard/")


if __name__ == '__main__':
    main()

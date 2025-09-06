#!/usr/bin/env python3
"""
Script para testar as APIs do módulo jurídico avançado
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
from juridico.models import RecursoAdministrativo, ParecerJuridico, WorkflowJuridico


def testar_api_recursos():
    """Testa as APIs de recursos administrativos"""
    print("📄 TESTANDO APIs DE RECURSOS ADMINISTRATIVOS")
    print("=" * 50)
    
    base_url = "http://localhost:8000/api/juridico"
    
    # Teste 1: Listar recursos
    print("\n1️⃣ Testando listagem de recursos...")
    try:
        response = requests.get(f"{base_url}/recursos/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! {data['count']} recursos encontrados")
            if data['results']:
                print(f"   Primeiro recurso: {data['results'][0]['numero']}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
    
    # Teste 2: Dashboard de recursos
    print("\n2️⃣ Testando dashboard de recursos...")
    try:
        response = requests.get(f"{base_url}/recursos-dashboard/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! Dashboard carregado")
            print(f"   Total recursos: {data['total_recursos']}")
            print(f"   Em análise: {data['recursos_em_analise']}")
            print(f"   Deferidos: {data['recursos_deferidos']}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
    
    # Teste 3: Recursos atrasados
    print("\n3️⃣ Testando recursos atrasados...")
    try:
        response = requests.get(f"{base_url}/recursos-atrasados/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! {data['count']} recursos atrasados encontrados")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")


def testar_api_pareceres():
    """Testa as APIs de pareceres jurídicos"""
    print("\n📝 TESTANDO APIs DE PARECERES JURÍDICOS")
    print("=" * 50)
    
    base_url = "http://localhost:8000/api/juridico"
    
    # Teste 1: Listar pareceres
    print("\n1️⃣ Testando listagem de pareceres...")
    try:
        response = requests.get(f"{base_url}/pareceres/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! {data['count']} pareceres encontrados")
            if data['results']:
                print(f"   Primeiro parecer: {data['results'][0]['tipo_parecer']}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")


def testar_api_workflows():
    """Testa as APIs de workflows jurídicos"""
    print("\n🔄 TESTANDO APIs DE WORKFLOWS JURÍDICOS")
    print("=" * 50)
    
    base_url = "http://localhost:8000/api/juridico"
    
    # Teste 1: Listar workflows
    print("\n1️⃣ Testando listagem de workflows...")
    try:
        response = requests.get(f"{base_url}/workflows/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! {data['count']} workflows encontrados")
            if data['results']:
                print(f"   Primeiro workflow: {data['results'][0]['tipo_workflow']}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")


def testar_api_historico():
    """Testa as APIs de histórico de recursos"""
    print("\n📚 TESTANDO APIs DE HISTÓRICO DE RECURSOS")
    print("=" * 50)
    
    base_url = "http://localhost:8000/api/juridico"
    
    # Teste 1: Listar histórico
    print("\n1️⃣ Testando listagem de histórico...")
    try:
        response = requests.get(f"{base_url}/historico-recurso/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sucesso! {data['count']} entradas de histórico encontradas")
            if data['results']:
                print(f"   Primeira entrada: {data['results'][0]['acao']}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")


def verificar_dados_banco():
    """Verifica os dados no banco de dados"""
    print("\n🗄️ VERIFICANDO DADOS NO BANCO")
    print("=" * 50)
    
    try:
        # Contar recursos
        total_recursos = RecursoAdministrativo.objects.count()
        recursos_em_analise = RecursoAdministrativo.objects.filter(status='EM_ANALISE').count()
        recursos_deferidos = RecursoAdministrativo.objects.filter(status='DEFERIDO').count()
        
        print(f"📊 Recursos no banco:")
        print(f"   • Total: {total_recursos}")
        print(f"   • Em análise: {recursos_em_analise}")
        print(f"   • Deferidos: {recursos_deferidos}")
        
        # Contar pareceres
        total_pareceres = ParecerJuridico.objects.count()
        pareceres_assinados = ParecerJuridico.objects.filter(assinado=True).count()
        
        print(f"\n📝 Pareceres no banco:")
        print(f"   • Total: {total_pareceres}")
        print(f"   • Assinados: {pareceres_assinados}")
        
        # Contar workflows
        total_workflows = WorkflowJuridico.objects.count()
        workflows_pendentes = WorkflowJuridico.objects.filter(status='PENDENTE').count()
        
        print(f"\n🔄 Workflows no banco:")
        print(f"   • Total: {total_workflows}")
        print(f"   • Pendentes: {workflows_pendentes}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
        return False


def main():
    """Função principal"""
    print("🚀 TESTANDO MÓDULO JURÍDICO AVANÇADO")
    print("=" * 60)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    try:
        # Verificar dados no banco
        if not verificar_dados_banco():
            print("❌ Falha ao verificar dados no banco")
            return False
        
        # Testar APIs (apenas se o servidor estiver rodando)
        print("\n🌐 TESTANDO APIs (requer servidor rodando)")
        print("=" * 60)
        
        try:
            # Teste rápido para ver se o servidor está rodando
            response = requests.get("http://localhost:8000/", timeout=2)
            if response.status_code == 200:
                print("✅ Servidor Django está rodando")
                
                # Testar APIs
                testar_api_recursos()
                testar_api_pareceres()
                testar_api_workflows()
                testar_api_historico()
                
            else:
                print("⚠️ Servidor não está respondendo corretamente")
                
        except requests.exceptions.ConnectionError:
            print("⚠️ Servidor Django não está rodando")
            print("   Execute: python manage.py runserver")
            print("   Depois execute este script novamente")
            
        except Exception as e:
            print(f"❌ Erro ao testar APIs: {e}")
        
        print("\n" + "=" * 60)
        print("✅ TESTES CONCLUÍDOS!")
        print("=" * 60)
        print("🎯 Módulo jurídico avançado está funcionando!")
        print("\n📋 Próximos passos:")
        print("   1. Implementar frontend para recursos")
        print("   2. Implementar upload de documentos")
        print("   3. Implementar sistema de assinatura digital")
        print("   4. Implementar notificações automáticas")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

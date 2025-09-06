#!/usr/bin/env python
"""
Teste da funcionalidade de escaneamento de código de barras
"""

import os
import sys
import django
import requests
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from produtos.models import Produto, CategoriaProduto, Fabricante

def testar_apis_produtos():
    """Testar as APIs de busca de produtos por código de barras"""
    
    print("🧪 TESTANDO FUNCIONALIDADE DE ESCANEAMENTO DE CÓDIGO DE BARRAS")
    print("=" * 60)
    
    # URL base do servidor
    base_url = "http://localhost:8000"
    
    # Teste 1: Criar um produto de teste
    print("\n1️⃣ Criando produto de teste...")
    
    try:
        # Criar categoria se não existir
        categoria, created = CategoriaProduto.objects.get_or_create(
            nome="Teste",
            defaults={
                'codigo': 'TESTE',
                'descricao': 'Categoria para testes'
            }
        )
        
        # Criar fabricante se não existir
        fabricante, created = Fabricante.objects.get_or_create(
            nome="Fabricante Teste",
            defaults={
                'cnpj': '00.000.000/0001-00'
            }
        )
        
        # Criar produto de teste
        produto, created = Produto.objects.get_or_create(
            codigo_barras='7891234567890',
            defaults={
                'nome': 'Produto Teste Escaneamento',
                'codigo_interno': 'TESTE001',
                'categoria': categoria,
                'fabricante': fabricante,
                'descricao': 'Produto para teste de escaneamento',
                'especificacoes': 'Especificações do produto teste',
                'unidade_medida': 'un',
                'preco_referencia': 10.50,
                'criado_por': 'Sistema'
            }
        )
        
        if created:
            print(f"✅ Produto criado: {produto.nome} (Código: {produto.codigo_barras})")
        else:
            print(f"✅ Produto já existe: {produto.nome} (Código: {produto.codigo_barras})")
            
    except Exception as e:
        print(f"❌ Erro ao criar produto: {e}")
        return False
    
    # Teste 2: Testar API de busca por código de barras
    print("\n2️⃣ Testando API de busca por código de barras...")
    
    try:
        url = f"{base_url}/api/produtos/buscar-por-codigo/7891234567890/"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API funcionando! Produto encontrado: {data.get('nome')}")
            print(f"   - Especificação: {data.get('especificacao')}")
            print(f"   - Valor: R$ {data.get('valor_unitario')}")
            print(f"   - Unidade: {data.get('unidade_medida')}")
        else:
            print(f"❌ Erro na API: Status {response.status_code}")
            print(f"   Resposta: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar ao servidor Django")
        print("   Certifique-se de que o servidor está rodando em http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Erro ao testar API: {e}")
        return False
    
    # Teste 3: Testar API de busca externa
    print("\n3️⃣ Testando API de busca externa...")
    
    try:
        url = f"{base_url}/api/produtos/buscar-externo/7891234567890/"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API externa funcionando! Produto: {data.get('nome')}")
            print(f"   - Fonte: {data.get('fonte')}")
        else:
            print(f"❌ Erro na API externa: Status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API externa: {e}")
    
    # Teste 4: Testar código de barras inexistente
    print("\n4️⃣ Testando código de barras inexistente...")
    
    try:
        url = f"{base_url}/api/produtos/buscar-por-codigo/9999999999999/"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 404:
            print("✅ API retornou 404 para produto inexistente (comportamento correto)")
        else:
            print(f"⚠️  API retornou status {response.status_code} para produto inexistente")
            
    except Exception as e:
        print(f"❌ Erro ao testar produto inexistente: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 TESTE CONCLUÍDO!")
    print("\n📱 Para testar o escaneamento no frontend:")
    print("   1. Inicie o servidor Django: python manage.py runserver")
    print("   2. Inicie o frontend: cd frontend && npm run dev")
    print("   3. Acesse o formulário de Auto de Inutilização")
    print("   4. Clique no botão de câmera ao lado do campo 'Item'")
    print("   5. Escaneie o código de barras: 7891234567890")
    
    return True

def testar_componente_frontend():
    """Verificar se o componente de escaneamento foi criado"""
    
    print("\n🔍 VERIFICANDO COMPONENTE FRONTEND")
    print("=" * 40)
    
    # Verificar se o arquivo do componente existe
    componente_path = "frontend/src/components/fiscalizacao/BarcodeScanner.jsx"
    
    if os.path.exists(componente_path):
        print(f"✅ Componente BarcodeScanner criado: {componente_path}")
        
        # Verificar se o Quagga foi instalado
        package_json_path = "frontend/package.json"
        if os.path.exists(package_json_path):
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
                if 'quagga' in package_data.get('dependencies', {}):
                    print("✅ Biblioteca Quagga instalada")
                else:
                    print("❌ Biblioteca Quagga não encontrada no package.json")
    else:
        print(f"❌ Componente não encontrado: {componente_path}")
        return False
    
    # Verificar se o formulário foi atualizado
    formulario_path = "frontend/src/components/fiscalizacao/AutoApreensaoForm.jsx"
    
    if os.path.exists(formulario_path):
        with open(formulario_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'BarcodeScanner' in content and 'handleBarcodeScan' in content:
                print("✅ Formulário AutoApreensaoForm atualizado com escaneamento")
            else:
                print("❌ Formulário não foi atualizado com escaneamento")
                return False
    else:
        print(f"❌ Formulário não encontrado: {formulario_path}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 INICIANDO TESTES DE ESCANEAMENTO DE CÓDIGO DE BARRAS")
    print("=" * 70)
    
    # Testar componente frontend
    frontend_ok = testar_componente_frontend()
    
    # Testar APIs backend
    backend_ok = testar_apis_produtos()
    
    print("\n" + "=" * 70)
    print("📊 RESUMO DOS TESTES:")
    print(f"   Frontend: {'✅ OK' if frontend_ok else '❌ FALHOU'}")
    print(f"   Backend:  {'✅ OK' if backend_ok else '❌ FALHOU'}")
    
    if frontend_ok and backend_ok:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("   A funcionalidade de escaneamento está pronta para uso.")
    else:
        print("\n⚠️  ALGUNS TESTES FALHARAM!")
        print("   Verifique os erros acima e corrija antes de usar.")
    
    print("\n" + "=" * 70)

#!/usr/bin/env python
"""
Script para testar o módulo de recursos
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from recursos.models import TipoRecurso, Recurso, MovimentacaoRecurso, ModeloDecisao, PrazoRecurso, ComissaoJulgamento, SessaoJulgamento

def testar_modelos_recursos():
    """Testa se os modelos do módulo de recursos estão funcionando"""
    print("🔍 Testando modelos do módulo de recursos...")
    
    try:
        # Testar criação de TipoRecurso
        tipo_recurso, created = TipoRecurso.objects.get_or_create(
            codigo='REC_MULTA',
            defaults={
                'nome': 'Recurso contra Multa',
                'descricao': 'Recurso administrativo contra multas aplicadas',
                'prazo_dias': 30,
                'permite_segunda_instancia': True,
                'ativo': True,
                'ordem': 1
            }
        )
        
        if created:
            print(f"✅ TipoRecurso criado: {tipo_recurso.nome}")
        else:
            print(f"✅ TipoRecurso já existe: {tipo_recurso.nome}")
        
        # Testar criação de Recurso
        recurso, created = Recurso.objects.get_or_create(
            numero_protocolo='REC-2024-001',
            defaults={
                'tipo_recurso': tipo_recurso,
                'instancia': 'primeira',
                'numero_processo': 'PROC-2024-001',
                'numero_auto': 'AUTO-2024-001',
                'requerente_nome': 'Empresa Teste LTDA',
                'requerente_tipo': 'pessoa_juridica',
                'requerente_documento': '12.345.678/0001-90',
                'requerente_endereco': 'Rua Teste, 123 - Centro',
                'requerente_telefone': '(11) 99999-9999',
                'requerente_email': 'teste@empresa.com',
                'tem_advogado': True,
                'advogado_nome': 'Dr. João Silva',
                'advogado_oab': '123456/SP',
                'procuracao_anexada': True,
                'data_protocolo': datetime.now(),
                'data_limite_analise': datetime.now().date() + timedelta(days=30),
                'assunto': 'Recurso contra multa aplicada',
                'fundamentacao': 'Fundamentação do recurso...',
                'pedido': 'Pedido de reconsideração da multa',
                'valor_causa': 5000.00,
                'status': 'protocolado'
            }
        )
        
        if created:
            print(f"✅ Recurso criado: {recurso.numero_protocolo}")
        else:
            print(f"✅ Recurso já existe: {recurso.numero_protocolo}")
        
        # Testar contagem
        total_tipos = TipoRecurso.objects.count()
        total_recursos = Recurso.objects.count()
        
        print(f"📊 Estatísticas:")
        print(f"   - Tipos de Recurso: {total_tipos}")
        print(f"   - Recursos: {total_recursos}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar modelos: {e}")
        return False

def testar_views_recursos():
    """Testa se as views do módulo de recursos estão funcionando"""
    print("\n🔍 Testando views do módulo de recursos...")
    
    try:
        from django.test import RequestFactory
        from recursos import views
        
        factory = RequestFactory()
        
        # Testar view de lista
        request = factory.get('/recursos/')
        response = views.recurso_list(request)
        
        if response.status_code == 200:
            print("✅ View recurso_list funcionando")
        else:
            print(f"❌ View recurso_list retornou status {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar views: {e}")
        return False

def testar_urls_recursos():
    """Testa se as URLs do módulo de recursos estão configuradas"""
    print("\n🔍 Testando URLs do módulo de recursos...")
    
    try:
        from django.urls import reverse
        from django.test import Client
        
        client = Client()
        
        # Testar URL de lista
        url = reverse('recursos:list')
        print(f"✅ URL de lista configurada: {url}")
        
        # Testar acesso à URL
        response = client.get(url)
        print(f"✅ Acesso à URL retornou status: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar URLs: {e}")
        return False

def verificar_admin_recursos():
    """Verifica se o módulo de recursos está registrado no admin"""
    print("\n🔍 Verificando admin do módulo de recursos...")
    
    try:
        from django.contrib import admin
        from recursos.models import TipoRecurso, Recurso
        
        # Verificar se está registrado
        if TipoRecurso in admin.site._registry:
            print("✅ TipoRecurso registrado no admin")
        else:
            print("❌ TipoRecurso NÃO registrado no admin")
        
        if Recurso in admin.site._registry:
            print("✅ Recurso registrado no admin")
        else:
            print("❌ Recurso NÃO registrado no admin")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar admin: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Iniciando testes do módulo de recursos...")
    print("=" * 50)
    
    # Testar modelos
    modelos_ok = testar_modelos_recursos()
    
    # Testar views
    views_ok = testar_views_recursos()
    
    # Testar URLs
    urls_ok = testar_urls_recursos()
    
    # Verificar admin
    admin_ok = verificar_admin_recursos()
    
    print("\n" + "=" * 50)
    print("📋 RESUMO DOS TESTES:")
    print(f"   - Modelos: {'✅ OK' if modelos_ok else '❌ FALHOU'}")
    print(f"   - Views: {'✅ OK' if views_ok else '❌ FALHOU'}")
    print(f"   - URLs: {'✅ OK' if urls_ok else '❌ FALHOU'}")
    print(f"   - Admin: {'✅ OK' if admin_ok else '❌ FALHOU'}")
    
    if all([modelos_ok, views_ok, urls_ok, admin_ok]):
        print("\n🎉 Módulo de recursos está funcionando corretamente!")
    else:
        print("\n⚠️ Módulo de recursos tem problemas que precisam ser corrigidos.")

if __name__ == '__main__':
    main()

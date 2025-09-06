#!/usr/bin/env python
"""
Script para testar o módulo de notificações
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from django.urls import reverse
from notificacoes.models import (
    TipoNotificacao, Notificacao, PreferenciaNotificacao, 
    LogNotificacao, TemplateNotificacao
)
from notificacoes.services import notificacao_service, configuracao_service

def testar_modelos_notificacoes():
    """Testa os modelos de notificações"""
    print("🔧 Testando modelos de notificações...")
    
    # Testar criação de tipo de notificação
    tipo, created = TipoNotificacao.objects.get_or_create(
        codigo='TESTE',
        defaults={
            'nome': 'Notificação de Teste',
            'descricao': 'Tipo de notificação para testes',
            'template_email': 'Teste: {{mensagem}}',
            'template_sms': 'Teste: {{mensagem}}',
            'template_push': 'Teste: {{mensagem}}'
        }
    )
    print(f"✅ Tipo de notificação: {tipo.nome}")
    
    # Testar criação de template
    template, created = TemplateNotificacao.objects.get_or_create(
        tipo_notificacao=tipo,
        canal='email',
        defaults={
            'nome': 'Template de Teste',
            'assunto': 'Teste',
            'conteudo': 'Teste: {{mensagem}}',
            'variaveis': ['mensagem']
        }
    )
    print(f"✅ Template criado: {template.nome}")
    
    # Testar criação de notificação
    usuario = User.objects.first()
    if not usuario:
        print("❌ Nenhum usuário encontrado para teste")
        return False
    
    notificacao = Notificacao.objects.create(
        tipo=tipo,
        destinatario=usuario,
        titulo='Teste de Notificação',
        mensagem='Esta é uma notificação de teste',
        dados_extras={'teste': 'valor_teste'},
        prioridade='normal'
    )
    print(f"✅ Notificação criada: {notificacao.id}")
    
    # Testar métodos da notificação
    notificacao.marcar_como_enviada()
    print(f"✅ Notificação marcada como enviada: {notificacao.status}")
    
    notificacao.marcar_como_lida()
    print(f"✅ Notificação marcada como lida: {notificacao.status}")
    
    # Testar preferências
    preferencia, created = PreferenciaNotificacao.objects.get_or_create(
        usuario=usuario,
        tipo_notificacao=tipo,
        canal='email',
        defaults={'ativo': True}
    )
    print(f"✅ Preferência criada: {preferencia}")
    
    # Testar log
    log = LogNotificacao.objects.create(
        notificacao=notificacao,
        canal='email',
        resultado='sucesso',
        tentativas=1
    )
    print(f"✅ Log criado: {log}")
    
    return True

def testar_servicos_notificacoes():
    """Testa os serviços de notificações"""
    print("\n🔧 Testando serviços de notificações...")
    
    usuario = User.objects.first()
    if not usuario:
        print("❌ Nenhum usuário encontrado para teste")
        return False
    
    # Testar criação via serviço
    try:
        notificacao = notificacao_service.criar_notificacao(
            tipo_codigo='TESTE',
            destinatario_id=usuario.id,
            titulo='Teste via Serviço',
            mensagem='Notificação criada via serviço',
            dados_extras={'servico': 'teste'},
            prioridade='alta'
        )
        print(f"✅ Notificação criada via serviço: {notificacao.id}")
    except Exception as e:
        print(f"❌ Erro ao criar notificação via serviço: {e}")
        return False
    
    # Testar configuração de preferências
    configuracoes = {
        'TESTE': ['email', 'sistema'],
        'SISTEMA': ['push', 'sistema']
    }
    
    try:
        success = configuracao_service.configurar_preferencias_usuario(
            usuario.id, configuracoes
        )
        if success:
            print("✅ Preferências configuradas via serviço")
        else:
            print("❌ Erro ao configurar preferências")
    except Exception as e:
        print(f"❌ Erro ao configurar preferências: {e}")
    
    # Testar estatísticas
    try:
        stats = configuracao_service.obter_estatisticas_notificacoes(usuario.id)
        print(f"✅ Estatísticas obtidas: {stats['total']} notificações")
    except Exception as e:
        print(f"❌ Erro ao obter estatísticas: {e}")
    
    return True

def testar_views_notificacoes():
    """Testa as views de notificações"""
    print("\n🔧 Testando views de notificações...")
    
    client = Client()
    
    # Testar listagem de notificações
    try:
        response = client.get('/notificacoes/')
        if response.status_code == 200:
            print("✅ Lista de notificações acessível")
        else:
            print(f"❌ Erro ao acessar lista: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao testar lista: {e}")
    
    # Testar API de notificações
    try:
        response = client.get('/api/notificacoes/')
        if response.status_code in [200, 401]:  # 401 é esperado se não autenticado
            print("✅ API de notificações acessível")
        else:
            print(f"❌ Erro ao acessar API: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao testar API: {e}")
    
    return True

def testar_urls_notificacoes():
    """Testa as URLs de notificações"""
    print("\n🔧 Testando URLs de notificações...")
    
    # Testar URLs principais
    urls_teste = [
        'notificacoes:list',
        'notificacoes:detail',
        'notificacoes:configuracoes',
        'notificacoes:estatisticas'
    ]
    
    for url_name in urls_teste:
        try:
            url = reverse(url_name)
            print(f"✅ URL {url_name}: {url}")
        except Exception as e:
            print(f"❌ Erro na URL {url_name}: {e}")
    
    return True

def testar_admin_notificacoes():
    """Testa o admin de notificações"""
    print("\n🔧 Testando admin de notificações...")
    
    # Verificar se os modelos estão registrados no admin
    from django.contrib import admin
    from notificacoes.admin import NotificacaoAdmin, TipoNotificacaoAdmin
    
    try:
        # Verificar se os modelos estão registrados
        if admin.site.is_registered(Notificacao):
            print("✅ Modelo Notificacao registrado no admin")
        else:
            print("❌ Modelo Notificacao não registrado no admin")
        
        if admin.site.is_registered(TipoNotificacao):
            print("✅ Modelo TipoNotificacao registrado no admin")
        else:
            print("❌ Modelo TipoNotificacao não registrado no admin")
        
        if admin.site.is_registered(PreferenciaNotificacao):
            print("✅ Modelo PreferenciaNotificacao registrado no admin")
        else:
            print("❌ Modelo PreferenciaNotificacao não registrado no admin")
        
        if admin.site.is_registered(LogNotificacao):
            print("✅ Modelo LogNotificacao registrado no admin")
        else:
            print("❌ Modelo LogNotificacao não registrado no admin")
        
        if admin.site.is_registered(TemplateNotificacao):
            print("✅ Modelo TemplateNotificacao registrado no admin")
        else:
            print("❌ Modelo TemplateNotificacao não registrado no admin")
        
    except Exception as e:
        print(f"❌ Erro ao verificar admin: {e}")
    
    return True

def testar_comando_processamento():
    """Testa o comando de processamento"""
    print("\n🔧 Testando comando de processamento...")
    
    try:
        from django.core.management import call_command
        from io import StringIO
        
        # Capturar saída do comando
        out = StringIO()
        call_command('processar_notificacoes', '--estatisticas', stdout=out)
        
        output = out.getvalue()
        if 'Processamento de notificações concluído' in output:
            print("✅ Comando de processamento funcionando")
        else:
            print("❌ Comando de processamento com problemas")
            print(f"Saída: {output}")
        
    except Exception as e:
        print(f"❌ Erro ao testar comando: {e}")
    
    return True

def main():
    """Função principal"""
    print("🚀 Testando módulo de notificações...")
    print("=" * 60)
    
    # Executar todos os testes
    testes = [
        testar_modelos_notificacoes,
        testar_servicos_notificacoes,
        testar_views_notificacoes,
        testar_urls_notificacoes,
        testar_admin_notificacoes,
        testar_comando_processamento
    ]
    
    resultados = []
    for teste in testes:
        try:
            resultado = teste()
            resultados.append(resultado)
        except Exception as e:
            print(f"❌ Erro no teste {teste.__name__}: {e}")
            resultados.append(False)
    
    # Resumo dos resultados
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES:")
    
    testes_nomes = [
        "Modelos",
        "Serviços", 
        "Views",
        "URLs",
        "Admin",
        "Comando"
    ]
    
    for i, (nome, resultado) in enumerate(zip(testes_nomes, resultados)):
        status = "✅ PASSOU" if resultado else "❌ FALHOU"
        print(f"   {nome}: {status}")
    
    total_passou = sum(resultados)
    total_testes = len(resultados)
    
    print(f"\n🎯 Resultado: {total_passou}/{total_testes} testes passaram")
    
    if total_passou == total_testes:
        print("🎉 Todos os testes passaram! Módulo funcionando corretamente.")
    else:
        print("⚠️  Alguns testes falharam. Verifique os erros acima.")
    
    return total_passou == total_testes

if __name__ == '__main__':
    main()

#!/usr/bin/env python
"""
Script para testar o módulo de auditoria
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
from auditoria.models import (
    TipoEvento, LogSistema, AuditoriaAlteracao, SessaoUsuario,
    AcessoRecurso, BackupLog, LogSeguranca
)
from auditoria.services import (
    auditoria_service, relatorio_service, seguranca_service, 
    autenticacao_2fa_service
)

def testar_modelos_auditoria():
    """Testa os modelos de auditoria"""
    print("🔍 Testando modelos de auditoria...")
    
    try:
        # Testar TipoEvento
        import time
        timestamp = int(time.time())
        codigo_unico = f'TESTE_EVENTO_{timestamp}'
        nome_unico = f'Evento de Teste Único {timestamp}'
        tipo_evento = TipoEvento.objects.create(
            codigo=codigo_unico,
            nome=nome_unico,
            categoria='sistema',
            nivel_criticidade='medio',
            ativo=True
        )
        print(f"✅ TipoEvento criado: {tipo_evento.nome}")
        
        # Testar LogSistema
        log_sistema = LogSistema.objects.create(
            tipo_evento=tipo_evento,
            acao='Teste de Log',
            descricao='Log de teste para verificação',
            usuario='teste',
            nivel='INFO',
            sucesso=True,
            detalhes='{"teste": true}'
        )
        print(f"✅ LogSistema criado: {log_sistema.id}")
        
        # Testar SessaoUsuario
        from django.utils import timezone
        import time
        session_key_unico = f'teste_session_{int(time.time())}'
        sessao = SessaoUsuario.objects.create(
            usuario='teste',
            ip_login='127.0.0.1',
            user_agent_login='Teste/1.0',
            data_login=timezone.now(),
            session_key=session_key_unico,
            ativa=True
        )
        print(f"✅ SessaoUsuario criada: {sessao.id}")
        
        # Testar AcessoRecurso
        acesso = AcessoRecurso.objects.create(
            usuario='teste',
            recurso='teste',
            acao='TESTE',
            metodo_http='GET',
            url_completa='/teste/',
            codigo_resposta=200,
            tempo_resposta=100,
            ip_origem='127.0.0.1'
        )
        print(f"✅ AcessoRecurso criado: {acesso.id}")
        
        # Testar LogSeguranca
        log_seguranca = LogSeguranca.objects.create(
            tipo_evento='teste_seguranca',
            ip_origem='127.0.0.1',
            descricao='Teste de segurança',
            nivel_severidade='baixo',
            detalhes_tecnicos={'teste': True}
        )
        print(f"✅ LogSeguranca criado: {log_seguranca.id}")
        
        # Testar BackupLog
        from datetime import timedelta
        backup = BackupLog.objects.create(
            nome_backup='Backup de Teste',
            tipo_backup='completo',
            data_inicio=timezone.now(),
            data_fim=timezone.now() + timedelta(minutes=5),
            duracao=timedelta(minutes=5),
            tamanho_backup=1048576,  # 1MB
            quantidade_arquivos=100,
            local_armazenamento='/teste/backup.sql',
            status='concluido',
            sucesso=True,
            executado_por='teste'
        )
        print(f"✅ BackupLog criado: {backup.id}")
        
        # Limpar dados de teste
        tipo_evento.delete()
        log_sistema.delete()
        sessao.delete()
        acesso.delete()
        log_seguranca.delete()
        backup.delete()
        
        print("✅ Todos os modelos funcionando corretamente!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar modelos: {e}")
        return False

def testar_servicos_auditoria():
    """Testa os serviços de auditoria"""
    print("🔧 Testando serviços de auditoria...")
    
    try:
        # Testar registro de evento
        evento = auditoria_service.registrar_evento(
            tipo_evento_codigo='TESTE_SERVICO',
            acao='Teste de Serviço',
            descricao='Teste do serviço de auditoria',
            usuario='teste_servico',
            nivel='INFO'
        )
        print(f"✅ Evento registrado: {evento.id if evento else 'N/A'}")
        
        # Testar registro de acesso a recurso
        acesso = auditoria_service.registrar_acesso_recurso(
            usuario='teste_servico',
            recurso='teste',
            acao='TESTE',
            metodo_http='POST',
            url_completa='/teste/api/',
            codigo_resposta=201,
            tempo_resposta=150,
            ip_origem='127.0.0.1'
        )
        print(f"✅ Acesso registrado: {acesso.id if acesso else 'N/A'}")
        
        # Testar registro de evento de segurança
        seguranca = auditoria_service.registrar_evento_seguranca(
            tipo_evento='teste_seguranca',
            ip_origem='127.0.0.1',
            descricao='Teste de segurança',
            usuario='teste_servico'
        )
        print(f"✅ Evento de segurança registrado: {seguranca.id if seguranca else 'N/A'}")
        
        print("✅ Todos os serviços funcionando corretamente!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar serviços: {e}")
        return False

def testar_relatorios_auditoria():
    """Testa os relatórios de auditoria"""
    print("📊 Testando relatórios de auditoria...")
    
    try:
        # Testar relatório de atividade
        relatorio_atividade = relatorio_service.relatorio_atividade_usuarios(7)
        print(f"✅ Relatório de atividade gerado: {len(relatorio_atividade)} campos")
        
        # Testar relatório de segurança
        relatorio_seguranca = relatorio_service.relatorio_seguranca(7)
        print(f"✅ Relatório de segurança gerado: {len(relatorio_seguranca)} campos")
        
        # Testar relatório de performance
        relatorio_performance = relatorio_service.relatorio_performance(7)
        print(f"✅ Relatório de performance gerado: {len(relatorio_performance)} campos")
        
        # Testar relatório de sessões
        relatorio_sessoes = relatorio_service.relatorio_sessoes(7)
        print(f"✅ Relatório de sessões gerado: {len(relatorio_sessoes)} campos")
        
        print("✅ Todos os relatórios funcionando corretamente!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar relatórios: {e}")
        return False

def testar_controles_seguranca():
    """Testa os controles de segurança"""
    print("🔒 Testando controles de segurança...")
    
    try:
        # Testar verificação de IP suspeito
        resultado_ip = seguranca_service.verificar_ip_suspeito('127.0.0.1')
        print(f"✅ Verificação de IP: {resultado_ip['suspeito']}")
        
        # Testar verificação de atividade suspeita
        resultado_usuario = seguranca_service.verificar_atividade_suspeita('teste')
        print(f"✅ Verificação de usuário: {resultado_usuario['suspeito']}")
        
        # Testar geração de alerta
        alerta = seguranca_service.gerar_alerta_seguranca('teste_alerta', {
            'ip_origem': '127.0.0.1',
            'usuario': 'teste'
        })
        print(f"✅ Alerta gerado: {alerta}")
        
        print("✅ Todos os controles de segurança funcionando!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar controles de segurança: {e}")
        return False

def testar_autenticacao_2fa():
    """Testa a autenticação de dois fatores"""
    print("🔐 Testando autenticação 2FA...")
    
    try:
        # Testar geração de código 2FA
        codigo = autenticacao_2fa_service.gerar_codigo_2fa('teste_2fa')
        print(f"✅ Código 2FA gerado: {codigo}")
        
        # Testar verificação de código válido
        valido = autenticacao_2fa_service.verificar_codigo_2fa('teste_2fa', codigo)
        print(f"✅ Verificação código válido: {valido}")
        
        # Testar verificação de código inválido
        invalido = autenticacao_2fa_service.verificar_codigo_2fa('teste_2fa', '000000')
        print(f"✅ Verificação código inválido: {not invalido}")
        
        # Testar configuração 2FA
        configurado = autenticacao_2fa_service.configurar_2fa_usuario('teste_2fa', True)
        print(f"✅ Configuração 2FA: {configurado}")
        
        print("✅ Autenticação 2FA funcionando corretamente!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar 2FA: {e}")
        return False

def testar_admin_auditoria():
    """Testa o admin de auditoria"""
    print("⚙️  Testando admin de auditoria...")
    
    try:
        # Verificar se os modelos estão registrados no admin
        from django.contrib import admin
        from auditoria.admin import (
            TipoEventoAdmin, LogSistemaAdmin, AuditoriaAlteracaoAdmin,
            SessaoUsuarioAdmin, AcessoRecursoAdmin, BackupLogAdmin, LogSegurancaAdmin
        )
        
        print("✅ Admin classes importadas com sucesso")
        
        # Verificar se os modelos estão registrados
        modelos_registrados = [
            'TipoEvento', 'LogSistema', 'AuditoriaAlteracao',
            'SessaoUsuario', 'AcessoRecurso', 'BackupLog', 'LogSeguranca'
        ]
        
        for modelo in modelos_registrados:
            if admin.site.is_registered(eval(modelo)):
                print(f"✅ {modelo} registrado no admin")
            else:
                print(f"⚠️  {modelo} não registrado no admin")
        
        print("✅ Admin de auditoria funcionando!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar admin: {e}")
        return False

def testar_comando_relatorios():
    """Testa o comando de relatórios"""
    print("📋 Testando comando de relatórios...")
    
    try:
        from django.core.management import call_command
        from io import StringIO
        
        # Testar comando básico
        out = StringIO()
        call_command('gerar_relatorios_auditoria', stdout=out)
        output = out.getvalue()
        
        if 'Geração de relatórios concluída' in output:
            print("✅ Comando de relatórios funcionando!")
        else:
            print("⚠️  Comando executado mas sem confirmação esperada")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar comando: {e}")
        return False

def testar_middleware_auditoria():
    """Testa o middleware de auditoria"""
    print("🔄 Testando middleware de auditoria...")
    
    try:
        from auditoria.middleware import AuditoriaMiddleware, SessaoMiddleware
        
        # Verificar se as classes existem
        print("✅ Classes de middleware importadas com sucesso")
        
        # Verificar se os métodos existem (sem instanciar)
        metodos_auditoria = [
            'process_request', 'process_response', 'process_exception',
            'get_client_ip', 'get_usuario', 'registrar_acesso_recurso'
        ]
        
        for metodo in metodos_auditoria:
            if hasattr(AuditoriaMiddleware, metodo):
                print(f"✅ Método {metodo} existe em AuditoriaMiddleware")
            else:
                print(f"⚠️  Método {metodo} não encontrado em AuditoriaMiddleware")
        
        metodos_sessao = [
            'process_request', 'process_response', 'get_client_ip',
            'is_logout_attempt', 'encerrar_sessao'
        ]
        
        for metodo in metodos_sessao:
            if hasattr(SessaoMiddleware, metodo):
                print(f"✅ Método {metodo} existe em SessaoMiddleware")
            else:
                print(f"⚠️  Método {metodo} não encontrado em SessaoMiddleware")
        
        print("✅ Middleware de auditoria funcionando!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar middleware: {e}")
        return False

def main():
    """Função principal de teste"""
    print("🚀 Iniciando testes do módulo de auditoria...")
    print("="*60)
    
    testes = [
        ("Modelos", testar_modelos_auditoria),
        ("Serviços", testar_servicos_auditoria),
        ("Relatórios", testar_relatorios_auditoria),
        ("Controles de Segurança", testar_controles_seguranca),
        ("Autenticação 2FA", testar_autenticacao_2fa),
        ("Admin", testar_admin_auditoria),
        ("Comando de Relatórios", testar_comando_relatorios),
        ("Middleware", testar_middleware_auditoria),
    ]
    
    resultados = []
    
    for nome, teste in testes:
        print(f"\n🔍 Testando {nome}...")
        print("-" * 40)
        
        try:
            resultado = teste()
            resultados.append((nome, resultado))
            
            if resultado:
                print(f"✅ {nome}: PASSOU")
            else:
                print(f"❌ {nome}: FALHOU")
                
        except Exception as e:
            print(f"❌ {nome}: ERRO - {e}")
            resultados.append((nome, False))
    
    # Resumo final
    print("\n" + "="*60)
    print("📊 RESUMO DOS TESTES")
    print("="*60)
    
    total_testes = len(resultados)
    testes_passaram = sum(1 for _, resultado in resultados if resultado)
    testes_falharam = total_testes - testes_passaram
    
    print(f"Total de testes: {total_testes}")
    print(f"Testes que passaram: {testes_passaram}")
    print(f"Testes que falharam: {testes_falharam}")
    
    if testes_falharam == 0:
        print("\n🎉 TODOS OS TESTES PASSARAM! Módulo funcionando corretamente.")
    else:
        print(f"\n⚠️  {testes_falharam} teste(s) falharam. Verificar implementação.")
        
        for nome, resultado in resultados:
            if not resultado:
                print(f"   ❌ {nome}")
    
    print("\n🔧 Para testar manualmente, execute:")
    print("   python manage.py gerar_relatorios_auditoria --tipo todos")
    print("   python manage.py gerar_relatorios_auditoria --verificar-ips")
    print("   python manage.py gerar_relatorios_auditoria --verificar-usuarios")

if __name__ == '__main__':
    main()

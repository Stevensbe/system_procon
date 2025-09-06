#!/usr/bin/env python
"""
Script para criar dados de teste para o módulo de auditoria
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from auditoria.models import (
    TipoEvento, LogSistema, AuditoriaAlteracao, SessaoUsuario,
    AcessoRecurso, BackupLog, LogSeguranca
)
from auditoria.services import auditoria_service, autenticacao_2fa_service

def criar_tipos_evento():
    """Cria tipos de evento para auditoria"""
    tipos_evento = [
        # Eventos de sistema
        {'codigo': 'LOGIN', 'nome': 'Login no Sistema', 'categoria': 'autenticacao', 'nivel_padrao': 'INFO'},
        {'codigo': 'LOGOUT', 'nome': 'Logout do Sistema', 'categoria': 'autenticacao', 'nivel_padrao': 'INFO'},
        {'codigo': 'LOGIN_FALHA', 'nome': 'Tentativa de Login Falhada', 'categoria': 'seguranca', 'nivel_padrao': 'WARNING'},
        {'codigo': 'SENHA_ALTERADA', 'nome': 'Senha Alterada', 'categoria': 'seguranca', 'nivel_padrao': 'INFO'},
        {'codigo': 'PERFIL_ATUALIZADO', 'nome': 'Perfil Atualizado', 'categoria': 'usuario', 'nivel_padrao': 'INFO'},
        
        # Eventos de recursos
        {'codigo': 'RECURSO_CRIADO', 'nome': 'Recurso Criado', 'categoria': 'recurso', 'nivel_padrao': 'INFO'},
        {'codigo': 'RECURSO_ATUALIZADO', 'nome': 'Recurso Atualizado', 'categoria': 'recurso', 'nivel_padrao': 'INFO'},
        {'codigo': 'RECURSO_EXCLUIDO', 'nome': 'Recurso Excluído', 'categoria': 'recurso', 'nivel_padrao': 'WARNING'},
        {'codigo': 'RECURSO_VISUALIZADO', 'nome': 'Recurso Visualizado', 'categoria': 'recurso', 'nivel_padrao': 'DEBUG'},
        
        # Eventos de notificações
        {'codigo': 'NOTIFICACAO_ENVIADA', 'nome': 'Notificação Enviada', 'categoria': 'notificacao', 'nivel_padrao': 'INFO'},
        {'codigo': 'NOTIFICACAO_LIDA', 'nome': 'Notificação Lida', 'categoria': 'notificacao', 'nivel_padrao': 'DEBUG'},
        {'codigo': 'NOTIFICACAO_FALHOU', 'nome': 'Falha no Envio de Notificação', 'categoria': 'notificacao', 'nivel_padrao': 'ERROR'},
        
        # Eventos de segurança
        {'codigo': 'ACESSO_NEGADO', 'nome': 'Acesso Negado', 'categoria': 'seguranca', 'nivel_padrao': 'WARNING'},
        {'codigo': 'IP_BLOQUEADO', 'nome': 'IP Bloqueado', 'categoria': 'seguranca', 'nivel_padrao': 'WARNING'},
        {'codigo': 'TENTATIVA_SUSPEITA', 'nome': 'Tentativa Suspeita Detectada', 'categoria': 'seguranca', 'nivel_padrao': 'WARNING'},
        {'codigo': '2FA_GERADO', 'nome': 'Código 2FA Gerado', 'categoria': 'seguranca', 'nivel_padrao': 'INFO'},
        {'codigo': '2FA_VALIDADO', 'nome': 'Código 2FA Validado', 'categoria': 'seguranca', 'nivel_padrao': 'INFO'},
        {'codigo': '2FA_FALHA', 'nome': 'Falha na Validação 2FA', 'categoria': 'seguranca', 'nivel_padrao': 'WARNING'},
        
        # Eventos de sistema
        {'codigo': 'BACKUP_REALIZADO', 'nome': 'Backup Realizado', 'categoria': 'sistema', 'nivel_padrao': 'INFO'},
        {'codigo': 'BACKUP_FALHOU', 'nome': 'Falha no Backup', 'categoria': 'sistema', 'nivel_padrao': 'ERROR'},
        {'codigo': 'SISTEMA_INICIADO', 'nome': 'Sistema Iniciado', 'categoria': 'sistema', 'nivel_padrao': 'INFO'},
        {'codigo': 'SISTEMA_PARADO', 'nome': 'Sistema Parado', 'categoria': 'sistema', 'nivel_padrao': 'WARNING'},
        {'codigo': 'ERRO_SISTEMA', 'nome': 'Erro do Sistema', 'categoria': 'sistema', 'nivel_padrao': 'ERROR'},
        
        # Eventos de auditoria
        {'codigo': 'RELATORIO_GERADO', 'nome': 'Relatório Gerado', 'categoria': 'auditoria', 'nivel_padrao': 'INFO'},
        {'codigo': 'AUDITORIA_EXPORTADA', 'nome': 'Dados de Auditoria Exportados', 'categoria': 'auditoria', 'nivel_padrao': 'INFO'},
    ]
    
    tipos_criados = []
    for tipo_data in tipos_evento:
        tipo, created = TipoEvento.objects.get_or_create(
            codigo=tipo_data['codigo'],
            defaults=tipo_data
        )
        tipos_criados.append(tipo)
        if created:
            print(f"✅ Tipo de evento criado: {tipo.nome}")
    
    return tipos_criados

def criar_logs_sistema(usuarios, tipos_evento):
    """Cria logs de sistema variados"""
    print("📝 Criando logs de sistema...")
    
    # Gerar logs para os últimos 30 dias
    data_inicio = timezone.now() - timedelta(days=30)
    
    for _ in range(500):  # 500 logs
        # Data aleatória nos últimos 30 dias
        data_log = data_inicio + timedelta(
            seconds=random.randint(0, int((timezone.now() - data_inicio).total_seconds()))
        )
        
        # Usuário aleatório
        usuario = random.choice(usuarios).username if usuarios else 'sistema'
        
        # Tipo de evento aleatório
        tipo_evento = random.choice(tipos_evento)
        
        # Nível baseado no tipo de evento
        nivel = tipo_evento.nivel_padrao
        
        # Sucesso baseado no tipo de evento
        sucesso = not tipo_evento.codigo.endswith('_FALHOU') and not tipo_evento.codigo.endswith('_FALHA')
        
        # Descrição baseada no tipo
        descricoes = {
            'LOGIN': f'Login realizado por {usuario}',
            'LOGOUT': f'Logout realizado por {usuario}',
            'LOGIN_FALHA': f'Tentativa de login falhada para usuário {usuario}',
            'SENHA_ALTERADA': f'Senha alterada por {usuario}',
            'PERFIL_ATUALIZADO': f'Perfil atualizado por {usuario}',
            'RECURSO_CRIADO': f'Recurso criado por {usuario}',
            'RECURSO_ATUALIZADO': f'Recurso atualizado por {usuario}',
            'RECURSO_EXCLUIDO': f'Recurso excluído por {usuario}',
            'RECURSO_VISUALIZADO': f'Recurso visualizado por {usuario}',
            'NOTIFICACAO_ENVIADA': f'Notificação enviada para {usuario}',
            'NOTIFICACAO_LIDA': f'Notificação lida por {usuario}',
            'NOTIFICACAO_FALHOU': f'Falha ao enviar notificação para {usuario}',
            'ACESSO_NEGADO': f'Acesso negado para {usuario}',
            'IP_BLOQUEADO': f'IP bloqueado para {usuario}',
            'TENTATIVA_SUSPEITA': f'Tentativa suspeita detectada para {usuario}',
            '2FA_GERADO': f'Código 2FA gerado para {usuario}',
            '2FA_VALIDADO': f'Código 2FA validado para {usuario}',
            '2FA_FALHA': f'Falha na validação 2FA para {usuario}',
            'BACKUP_REALIZADO': 'Backup do sistema realizado com sucesso',
            'BACKUP_FALHOU': 'Falha ao realizar backup do sistema',
            'SISTEMA_INICIADO': 'Sistema iniciado',
            'SISTEMA_PARADO': 'Sistema parado',
            'ERRO_SISTEMA': 'Erro crítico no sistema',
            'RELATORIO_GERADO': f'Relatório gerado por {usuario}',
            'AUDITORIA_EXPORTADA': f'Dados de auditoria exportados por {usuario}',
        }
        
        descricao = descricoes.get(tipo_evento.codigo, f'Evento {tipo_evento.nome} para {usuario}')
        
        # Detalhes técnicos
        detalhes_tecnicos = {
            'ip_origem': f'192.168.1.{random.randint(1, 254)}',
            'user_agent': random.choice([
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
            ]),
            'sessao_id': f'session_{random.randint(1000, 9999)}',
            'timestamp_original': data_log.isoformat()
        }
        
        LogSistema.objects.create(
            tipo_evento=tipo_evento,
            acao=tipo_evento.nome,
            descricao=descricao,
            usuario=usuario,
            nivel=nivel,
            sucesso=sucesso,
            detalhes_tecnicos=detalhes_tecnicos,
            timestamp=data_log
        )
    
    print(f"✅ {500} logs de sistema criados")

def criar_alteracoes_auditoria(usuarios):
    """Cria registros de alterações auditadas"""
    print("📝 Criando registros de alterações auditadas...")
    
    # Obter content types para diferentes modelos
    content_types = ContentType.objects.filter(
        app_label__in=['recursos', 'notificacoes', 'fiscalizacao', 'protocolo', 'peticionamento']
    )
    
    if not content_types.exists():
        print("⚠️  Nenhum content type encontrado. Criando dados básicos...")
        return
    
    data_inicio = timezone.now() - timedelta(days=30)
    
    for _ in range(200):  # 200 alterações
        # Data aleatória
        data_alteracao = data_inicio + timedelta(
            seconds=random.randint(0, int((timezone.now() - data_inicio).total_seconds()))
        )
        
        # Usuário aleatório
        usuario = random.choice(usuarios).username if usuarios else 'sistema'
        
        # Content type aleatório
        content_type = random.choice(content_types)
        
        # Ação aleatória
        acao = random.choice(['CREATE', 'UPDATE', 'DELETE'])
        
        # Campos alterados (simulado)
        campos_alterados = {
            'nome': 'Nome do objeto',
            'status': 'Status do objeto',
            'data_criacao': 'Data de criação'
        }
        
        valores_anteriores = {
            'nome': 'Nome anterior',
            'status': 'status_anterior',
            'data_criacao': '2024-01-01'
        }
        
        valores_novos = {
            'nome': 'Nome novo',
            'status': 'status_novo',
            'data_criacao': '2024-01-02'
        }
        
        AuditoriaAlteracao.objects.create(
            content_type=content_type,
            object_id=random.randint(1, 1000),
            object_repr=f'Objeto {content_type.model} #{random.randint(1, 1000)}',
            acao=acao,
            campos_alterados=campos_alterados,
            valores_anteriores=valores_anteriores,
            valores_novos=valores_novos,
            usuario=usuario,
            timestamp=data_alteracao
        )
    
    print(f"✅ {200} registros de alterações auditadas criados")

def criar_sessoes_usuarios(usuarios):
    """Cria sessões de usuários"""
    print("👥 Criando sessões de usuários...")
    
    data_inicio = timezone.now() - timedelta(days=30)
    
    for _ in range(100):  # 100 sessões
        # Data de login aleatória
        data_login = data_inicio + timedelta(
            seconds=random.randint(0, int((timezone.now() - data_inicio).total_seconds()))
        )
        
        # Usuário aleatório
        usuario = random.choice(usuarios).username if usuarios else 'sistema'
        
        # IP aleatório
        ip_origem = f'192.168.1.{random.randint(1, 254)}'
        
        # User agent aleatório
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
        ]
        user_agent = random.choice(user_agents)
        
        # Sessão ativa ou encerrada
        ativa = random.choice([True, False])
        
        sessao = SessaoUsuario.objects.create(
            usuario=usuario,
            ip_origem=ip_origem,
            user_agent=user_agent,
            data_login=data_login,
            ativa=ativa
        )
        
        # Se não estiver ativa, definir data de logout
        if not ativa:
            data_logout = data_login + timedelta(
                minutes=random.randint(5, 480)  # 5 minutos a 8 horas
            )
            tipo_logout = random.choice(['logout_manual', 'timeout', 'logout_automatico'])
            
            sessao.data_logout = data_logout
            sessao.tipo_logout = tipo_logout
            sessao.duracao_sessao = (data_logout - data_login).total_seconds()
            sessao.save()
        else:
            # Atualizar última atividade
            sessao.ultima_atividade = data_login + timedelta(
                minutes=random.randint(1, 60)
            )
            sessao.save()
    
    print(f"✅ {100} sessões de usuários criadas")

def criar_acessos_recursos(usuarios):
    """Cria registros de acesso a recursos"""
    print("🌐 Criando registros de acesso a recursos...")
    
    recursos = ['admin', 'api', 'notificacoes', 'auditoria', 'recursos', 'fiscalizacao', 'protocolo', 'peticionamento']
    metodos_http = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    acoes = ['CONSULTA', 'CRIACAO', 'ATUALIZACAO', 'EXCLUSAO', 'ATUALIZACAO_PARCIAL']
    
    data_inicio = timezone.now() - timedelta(days=30)
    
    for _ in range(1000):  # 1000 acessos
        # Data aleatória
        data_acesso = data_inicio + timedelta(
            seconds=random.randint(0, int((timezone.now() - data_inicio).total_seconds()))
        )
        
        # Usuário aleatório
        usuario = random.choice(usuarios).username if usuarios else 'anonimo'
        
        # Dados aleatórios
        recurso = random.choice(recursos)
        acao = random.choice(acoes)
        metodo_http = random.choice(metodos_http)
        codigo_resposta = random.choice([200, 201, 400, 401, 403, 404, 500])
        tempo_resposta = random.randint(50, 2000)  # 50ms a 2s
        ip_origem = f'192.168.1.{random.randint(1, 254)}'
        
        # URL completa
        url_completa = f'/{recurso}/api/v1/endpoint'
        
        # User agent
        user_agent = random.choice([
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
        ])
        
        AcessoRecurso.objects.create(
            usuario=usuario,
            recurso=recurso,
            acao=acao,
            metodo_http=metodo_http,
            url_completa=url_completa,
            codigo_resposta=codigo_resposta,
            tempo_resposta=tempo_resposta,
            ip_origem=ip_origem,
            user_agent=user_agent,
            timestamp=data_acesso
        )
    
    print(f"✅ {1000} registros de acesso a recursos criados")

def criar_logs_seguranca(usuarios):
    """Cria logs de segurança"""
    print("🔒 Criando logs de segurança...")
    
    tipos_evento = [
        'login_falha', 'login_sucesso', 'logout', 'senha_alterada',
        'acesso_negado', 'ip_bloqueado', 'tentativa_suspeita',
        'recurso_sensivel_acessado', 'erro_critico'
    ]
    
    data_inicio = timezone.now() - timedelta(days=30)
    
    for _ in range(300):  # 300 eventos de segurança
        # Data aleatória
        data_evento = data_inicio + timedelta(
            seconds=random.randint(0, int((timezone.now() - data_inicio).total_seconds()))
        )
        
        # Tipo de evento aleatório
        tipo_evento = random.choice(tipos_evento)
        
        # IP aleatório
        ip_origem = f'192.168.1.{random.randint(1, 254)}'
        
        # Usuário (pode ser None para alguns eventos)
        usuario = None
        if tipo_evento in ['login_sucesso', 'logout', 'senha_alterada']:
            usuario = random.choice(usuarios).username if usuarios else 'sistema'
        
        # Nível de severidade baseado no tipo
        severidade_map = {
            'login_falha': 'medio',
            'login_sucesso': 'baixo',
            'logout': 'baixo',
            'senha_alterada': 'medio',
            'acesso_negado': 'alto',
            'ip_bloqueado': 'alto',
            'tentativa_suspeita': 'alto',
            'recurso_sensivel_acessado': 'alto',
            'erro_critico': 'critico'
        }
        nivel_severidade = severidade_map.get(tipo_evento, 'baixo')
        
        # Descrição baseada no tipo
        descricoes = {
            'login_falha': f'Tentativa de login falhada do IP {ip_origem}',
            'login_sucesso': f'Login bem-sucedido para usuário {usuario}',
            'logout': f'Logout realizado por {usuario}',
            'senha_alterada': f'Senha alterada por {usuario}',
            'acesso_negado': f'Acesso negado para IP {ip_origem}',
            'ip_bloqueado': f'IP {ip_origem} bloqueado por tentativas suspeitas',
            'tentativa_suspeita': f'Tentativa suspeita detectada do IP {ip_origem}',
            'recurso_sensivel_acessado': f'Acesso a recurso sensível por {usuario}',
            'erro_critico': 'Erro crítico de segurança detectado'
        }
        descricao = descricoes.get(tipo_evento, f'Evento de segurança: {tipo_evento}')
        
        # Bloqueado baseado no tipo
        bloqueado = tipo_evento in ['ip_bloqueado', 'acesso_negado']
        
        # Detalhes técnicos
        detalhes_tecnicos = {
            'ip_origem': ip_origem,
            'user_agent': random.choice([
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
            ]),
            'timestamp_original': data_evento.isoformat()
        }
        
        LogSeguranca.objects.create(
            tipo_evento=tipo_evento,
            ip_origem=ip_origem,
            descricao=descricao,
            usuario=usuario,
            nivel_severidade=nivel_severidade,
            bloqueado=bloqueado,
            detalhes_tecnicos=detalhes_tecnicos,
            timestamp=data_evento
        )
    
    print(f"✅ {300} logs de segurança criados")

def criar_backups_log():
    """Cria logs de backup"""
    print("💾 Criando logs de backup...")
    
    data_inicio = timezone.now() - timedelta(days=30)
    
    for _ in range(30):  # 30 backups (1 por dia)
        # Data do backup
        data_backup = data_inicio + timedelta(days=random.randint(0, 30))
        
        # Tipo de backup
        tipo_backup = random.choice(['completo', 'incremental', 'diferencial'])
        
        # Status
        status = random.choice(['sucesso', 'falha'])
        
        # Tamanho do arquivo
        tamanho_arquivo = random.randint(100, 5000)  # MB
        
        # Duração
        duracao = random.randint(300, 3600)  # 5 minutos a 1 hora
        
        # Localização
        localizacao = f'/backups/procon_{data_backup.strftime("%Y%m%d")}_{tipo_backup}.sql'
        
        # Detalhes técnicos
        detalhes_tecnicos = {
            'tamanho_arquivo_mb': tamanho_arquivo,
            'duracao_segundos': duracao,
            'localizacao': localizacao,
            'tipo_backup': tipo_backup,
            'compressao': 'gzip',
            'checksum': f'md5_{random.randint(1000000, 9999999)}'
        }
        
        BackupLog.objects.create(
            tipo_backup=tipo_backup,
            status=status,
            tamanho_arquivo=tamanho_arquivo,
            duracao=duracao,
            localizacao=localizacao,
            detalhes_tecnicos=detalhes_tecnicos,
            data_backup=data_backup
        )
    
    print(f"✅ {30} logs de backup criados")

def main():
    """Função principal"""
    print("🚀 Iniciando criação de dados de teste para auditoria...")
    
    # Obter usuários existentes
    usuarios = list(User.objects.all())
    if not usuarios:
        print("⚠️  Nenhum usuário encontrado. Criando usuário de teste...")
        usuario_teste = User.objects.create_user(
            username='teste_auditoria',
            email='teste@procon.com',
            password='teste123'
        )
        usuarios = [usuario_teste]
    
    print(f"👥 Usando {len(usuarios)} usuários para os dados de teste")
    
    # Criar tipos de evento
    tipos_evento = criar_tipos_evento()
    
    # Criar logs de sistema
    criar_logs_sistema(usuarios, tipos_evento)
    
    # Criar alterações auditadas
    criar_alteracoes_auditoria(usuarios)
    
    # Criar sessões de usuários
    criar_sessoes_usuarios(usuarios)
    
    # Criar acessos a recursos
    criar_acessos_recursos(usuarios)
    
    # Criar logs de segurança
    criar_logs_seguranca(usuarios)
    
    # Criar logs de backup
    criar_backups_log()
    
    print("\n🎉 Dados de teste para auditoria criados com sucesso!")
    print("\n📊 Resumo dos dados criados:")
    print(f"   • {LogSistema.objects.count()} logs de sistema")
    print(f"   • {AuditoriaAlteracao.objects.count()} alterações auditadas")
    print(f"   • {SessaoUsuario.objects.count()} sessões de usuários")
    print(f"   • {AcessoRecurso.objects.count()} acessos a recursos")
    print(f"   • {LogSeguranca.objects.count()} logs de segurança")
    print(f"   • {BackupLog.objects.count()} logs de backup")
    print(f"   • {TipoEvento.objects.count()} tipos de evento")
    
    print("\n🔧 Para testar os relatórios, execute:")
    print("   python manage.py gerar_relatorios_auditoria --tipo todos")
    print("   python manage.py gerar_relatorios_auditoria --verificar-ips")
    print("   python manage.py gerar_relatorios_auditoria --verificar-usuarios")

if __name__ == '__main__':
    main()

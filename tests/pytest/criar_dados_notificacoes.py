#!/usr/bin/env python3
"""
Script para criar dados de teste para o sistema de notificações
"""

import os
import django
import random
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from notificacoes.models import (
    TipoNotificacao, 
    Notificacao, 
    PreferenciaNotificacao, 
    LogNotificacao, 
    TemplateNotificacao
)

def criar_tipos_notificacao():
    """Cria tipos de notificação padrão"""
    print("📝 Criando tipos de notificação...")
    
    tipos = [
        {
            'nome': 'Prazo Vencendo',
            'codigo': 'PRAZO_VENCENDO',
            'descricao': 'Notificação sobre prazos que estão vencendo',
            'template_email': 'Olá {{usuario}}, o prazo {{prazo}} vence em {{dias}} dias.',
            'template_sms': 'Prazo {{prazo}} vence em {{dias}} dias.',
            'template_push': 'Prazo vencendo: {{prazo}}'
        },
        {
            'nome': 'Nova Multa',
            'codigo': 'NOVA_MULTA',
            'descricao': 'Notificação sobre novas multas aplicadas',
            'template_email': 'Olá {{usuario}}, uma nova multa foi aplicada: {{multa}}.',
            'template_sms': 'Nova multa aplicada: {{multa}}',
            'template_push': 'Nova multa: {{multa}}'
        },
        {
            'nome': 'Processo Atualizado',
            'codigo': 'PROCESSO_ATUALIZADO',
            'descricao': 'Notificação sobre atualizações em processos',
            'template_email': 'Olá {{usuario}}, o processo {{processo}} foi atualizado.',
            'template_sms': 'Processo {{processo}} atualizado',
            'template_push': 'Processo atualizado: {{processo}}'
        },
        {
            'nome': 'Sistema',
            'codigo': 'SISTEMA',
            'descricao': 'Notificações do sistema',
            'template_email': 'Olá {{usuario}}, {{mensagem}}.',
            'template_sms': '{{mensagem}}',
            'template_push': '{{mensagem}}'
        },
        {
            'nome': 'Recurso Administrativo',
            'codigo': 'RECURSO_ADMIN',
            'descricao': 'Notificações sobre recursos administrativos',
            'template_email': 'Olá {{usuario}}, um recurso administrativo foi protocolado: {{recurso}}.',
            'template_sms': 'Recurso protocolado: {{recurso}}',
            'template_push': 'Recurso administrativo: {{recurso}}'
        }
    ]
    
    tipos_criados = []
    for tipo_data in tipos:
        tipo, created = TipoNotificacao.objects.get_or_create(
            codigo=tipo_data['codigo'],
            defaults=tipo_data
        )
        if created:
            print(f"  ✅ Criado: {tipo.nome}")
        else:
            print(f"  ⚠️ Já existe: {tipo.nome}")
        tipos_criados.append(tipo)
    
    return tipos_criados

def criar_templates_notificacao(tipos):
    """Cria templates de notificação"""
    print("📋 Criando templates de notificação...")
    
    for tipo in tipos:
        # Template para email
        template_email, created = TemplateNotificacao.objects.get_or_create(
            tipo_notificacao=tipo,
            canal='email',
            defaults={
                'nome': f'Template Email - {tipo.nome}',
                'assunto': f'Notificação: {tipo.nome}',
                'conteudo': tipo.template_email,
                'variaveis': ['usuario', 'mensagem', 'prazo', 'dias', 'multa', 'processo', 'recurso']
            }
        )
        
        # Template para sistema
        template_sistema, created = TemplateNotificacao.objects.get_or_create(
            tipo_notificacao=tipo,
            canal='sistema',
            defaults={
                'nome': f'Template Sistema - {tipo.nome}',
                'assunto': f'Notificação: {tipo.nome}',
                'conteudo': tipo.template_push,
                'variaveis': ['usuario', 'mensagem', 'prazo', 'dias', 'multa', 'processo', 'recurso']
            }
        )
        
        if created:
            print(f"  ✅ Templates criados para: {tipo.nome}")

def criar_preferencias_notificacao(usuarios, tipos):
    """Cria preferências de notificação para usuários"""
    print("⚙️ Criando preferências de notificação...")
    
    canais = ['email', 'sistema']
    
    for usuario in usuarios:
        for tipo in tipos:
            for canal in canais:
                preferencia, created = PreferenciaNotificacao.objects.get_or_create(
                    usuario=usuario,
                    tipo_notificacao=tipo,
                    canal=canal,
                    defaults={'ativo': True}
                )
                if created:
                    print(f"  ✅ Preferência criada: {usuario.username} - {tipo.nome} - {canal}")

def criar_notificacoes_teste(usuarios, tipos):
    """Cria notificações de teste"""
    print("🔔 Criando notificações de teste...")
    
    # Criar notificações para cada usuário
    for usuario in usuarios:
        # Notificações pendentes
        for i in range(random.randint(2, 5)):
            tipo = random.choice(tipos)
            notificacao = Notificacao.objects.create(
                tipo=tipo,
                destinatario=usuario,
                titulo=f"Notificação de teste {i+1}",
                mensagem=f"Esta é uma notificação de teste para {usuario.username}",
                status='pendente',
                prioridade=random.choice(['baixa', 'normal', 'alta']),
                dados_extras={'teste': True, 'numero': i+1}
            )
            print(f"  ✅ Notificação pendente criada para {usuario.username}")
        
        # Notificações enviadas
        for i in range(random.randint(1, 3)):
            tipo = random.choice(tipos)
            notificacao = Notificacao.objects.create(
                tipo=tipo,
                destinatario=usuario,
                titulo=f"Notificação enviada {i+1}",
                mensagem=f"Esta é uma notificação enviada para {usuario.username}",
                status='enviada',
                prioridade=random.choice(['baixa', 'normal', 'alta']),
                enviada_em=timezone.now() - timedelta(hours=random.randint(1, 24)),
                dados_extras={'teste': True, 'numero': i+1}
            )
            print(f"  ✅ Notificação enviada criada para {usuario.username}")
        
        # Notificações lidas
        for i in range(random.randint(1, 4)):
            tipo = random.choice(tipos)
            notificacao = Notificacao.objects.create(
                tipo=tipo,
                destinatario=usuario,
                titulo=f"Notificação lida {i+1}",
                mensagem=f"Esta é uma notificação lida por {usuario.username}",
                status='lida',
                prioridade=random.choice(['baixa', 'normal', 'alta']),
                enviada_em=timezone.now() - timedelta(hours=random.randint(1, 48)),
                lida_em=timezone.now() - timedelta(hours=random.randint(1, 24)),
                dados_extras={'teste': True, 'numero': i+1}
            )
            print(f"  ✅ Notificação lida criada para {usuario.username}")

def criar_logs_notificacao():
    """Cria logs de notificação"""
    print("📊 Criando logs de notificação...")
    
    notificacoes = Notificacao.objects.filter(status__in=['enviada', 'lida'])
    
    for notificacao in notificacoes[:10]:  # Limitar a 10 logs
        log = LogNotificacao.objects.create(
            notificacao=notificacao,
            canal=random.choice(['email', 'sistema']),
            resultado=random.choice(['sucesso', 'falha']),
            tentativas=random.randint(1, 3),
            mensagem_erro='' if random.choice([True, False]) else 'Erro de teste'
        )
        print(f"  ✅ Log criado para notificação {notificacao.id}")

def main():
    """Função principal"""
    print("🚀 Criando dados de teste para o sistema de notificações...")
    print("=" * 60)
    
    # Buscar usuários existentes
    usuarios = list(User.objects.filter(is_active=True)[:5])
    if not usuarios:
        print("❌ Nenhum usuário ativo encontrado!")
        return
    
    print(f"👥 Usuários encontrados: {len(usuarios)}")
    
    # Criar tipos de notificação
    tipos = criar_tipos_notificacao()
    
    # Criar templates
    criar_templates_notificacao(tipos)
    
    # Criar preferências
    criar_preferencias_notificacao(usuarios, tipos)
    
    # Criar notificações de teste
    criar_notificacoes_teste(usuarios, tipos)
    
    # Criar logs
    criar_logs_notificacao()
    
    print("\n" + "=" * 60)
    print("✅ Dados de teste criados com sucesso!")
    print(f"📊 Resumo:")
    print(f"  - Tipos de notificação: {TipoNotificacao.objects.count()}")
    print(f"  - Templates: {TemplateNotificacao.objects.count()}")
    print(f"  - Preferências: {PreferenciaNotificacao.objects.count()}")
    print(f"  - Notificações: {Notificacao.objects.count()}")
    print(f"  - Logs: {LogNotificacao.objects.count()}")
    print("\n🎯 Agora você pode testar o sistema de notificações!")

if __name__ == '__main__':
    main()

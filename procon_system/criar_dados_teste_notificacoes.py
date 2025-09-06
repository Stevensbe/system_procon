#!/usr/bin/env python
"""
Script para criar dados de teste para o módulo de notificações
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
from notificacoes.models import (
    TipoNotificacao, Notificacao, PreferenciaNotificacao, 
    LogNotificacao, TemplateNotificacao
)
from notificacoes.services import notificacao_service

def criar_tipos_notificacao():
    """Cria tipos de notificação"""
    print("🔧 Criando tipos de notificação...")
    
    tipos = [
        {
            'nome': 'Prazo Vencendo',
            'codigo': 'PRAZO_VENCENDO',
            'descricao': 'Notificação quando um prazo está próximo de vencer',
            'template_email': 'Olá {{usuario}}, o prazo para {{objeto}} vence em {{dias}} dias.',
            'template_sms': 'Prazo vencendo: {{objeto}} - {{dias}} dias restantes',
            'template_push': 'Prazo vencendo: {{objeto}}'
        },
        {
            'nome': 'Nova Petição',
            'codigo': 'NOVA_PETICAO',
            'descricao': 'Notificação quando uma nova petição é protocolada',
            'template_email': 'Nova petição protocolada: {{numero_protocolo}} - {{assunto}}',
            'template_sms': 'Nova petição: {{numero_protocolo}}',
            'template_push': 'Nova petição recebida'
        },
        {
            'nome': 'Recurso Protocolado',
            'codigo': 'RECURSO_PROTOCOLADO',
            'descricao': 'Notificação quando um recurso é protocolado',
            'template_email': 'Recurso protocolado: {{numero_protocolo}} - {{tipo_recurso}}',
            'template_sms': 'Recurso: {{numero_protocolo}}',
            'template_push': 'Recurso protocolado'
        },
        {
            'nome': 'Auto de Infração',
            'codigo': 'AUTO_INFRACAO',
            'descricao': 'Notificação sobre autos de infração',
            'template_email': 'Auto de infração: {{numero_auto}} - {{empresa}}',
            'template_sms': 'Auto: {{numero_auto}}',
            'template_push': 'Auto de infração gerado'
        },
        {
            'nome': 'Decisão Tomada',
            'codigo': 'DECISAO_TOMADA',
            'descricao': 'Notificação quando uma decisão é tomada',
            'template_email': 'Decisão tomada: {{processo}} - {{decisao}}',
            'template_sms': 'Decisão: {{decisao}}',
            'template_push': 'Decisão tomada'
        },
        {
            'nome': 'Sistema',
            'codigo': 'SISTEMA',
            'descricao': 'Notificações do sistema',
            'template_email': 'Notificação do sistema: {{mensagem}}',
            'template_sms': 'Sistema: {{mensagem}}',
            'template_push': 'Notificação do sistema'
        }
    ]
    
    tipos_criados = []
    for tipo_data in tipos:
        tipo, created = TipoNotificacao.objects.get_or_create(
            codigo=tipo_data['codigo'],
            defaults=tipo_data
        )
        if created:
            print(f"✅ Tipo criado: {tipo.nome}")
        else:
            print(f"✅ Tipo já existe: {tipo.nome}")
        tipos_criados.append(tipo)
    
    return tipos_criados

def criar_templates_notificacao(tipos_notificacao):
    """Cria templates de notificação"""
    print("\n🔧 Criando templates de notificação...")
    
    for tipo in tipos_notificacao:
        # Template de email
        TemplateNotificacao.objects.get_or_create(
            tipo_notificacao=tipo,
            canal='email',
            defaults={
                'nome': f'Template Email - {tipo.nome}',
                'assunto': f'PROCON - {tipo.nome}',
                'conteudo': tipo.template_email,
                'variaveis': ['usuario', 'objeto', 'dias', 'numero_protocolo', 'assunto', 'numero_auto', 'empresa', 'processo', 'decisao', 'mensagem']
            }
        )
        
        # Template de SMS
        TemplateNotificacao.objects.get_or_create(
            tipo_notificacao=tipo,
            canal='sms',
            defaults={
                'nome': f'Template SMS - {tipo.nome}',
                'assunto': '',
                'conteudo': tipo.template_sms,
                'variaveis': ['objeto', 'dias', 'numero_protocolo', 'numero_auto', 'decisao', 'mensagem']
            }
        )
        
        # Template de Push
        TemplateNotificacao.objects.get_or_create(
            tipo_notificacao=tipo,
            canal='push',
            defaults={
                'nome': f'Template Push - {tipo.nome}',
                'assunto': '',
                'conteudo': tipo.template_push,
                'variaveis': ['objeto', 'numero_protocolo', 'numero_auto', 'decisao', 'mensagem']
            }
        )
    
    print(f"✅ Templates criados para {len(tipos_notificacao)} tipos")

def criar_preferencias_usuarios(usuarios, tipos_notificacao):
    """Cria preferências de notificação para usuários"""
    print("\n🔧 Criando preferências de usuários...")
    
    canais = ['email', 'sms', 'push', 'sistema']
    
    for usuario in usuarios:
        for tipo in tipos_notificacao:
            # Escolher canais aleatoriamente para cada usuário
            canais_ativos = random.sample(canais, random.randint(1, 3))
            
            for canal in canais_ativos:
                PreferenciaNotificacao.objects.get_or_create(
                    usuario=usuario,
                    tipo_notificacao=tipo,
                    canal=canal,
                    defaults={'ativo': True}
                )
    
    print(f"✅ Preferências criadas para {len(usuarios)} usuários")

def criar_notificacoes_teste(usuarios, tipos_notificacao):
    """Cria notificações de teste"""
    print("\n🔧 Criando notificações de teste...")
    
    titulos = [
        'Prazo de defesa vencendo',
        'Nova petição protocolada',
        'Recurso administrativo recebido',
        'Auto de infração gerado',
        'Decisão tomada sobre processo',
        'Manutenção do sistema programada',
        'Relatório mensal disponível',
        'Alerta de segurança',
        'Backup realizado com sucesso',
        'Nova funcionalidade disponível'
    ]
    
    mensagens = [
        'O prazo para apresentação de defesa vence em 3 dias.',
        'Uma nova petição foi protocolada e aguarda análise.',
        'Um recurso administrativo foi protocolado contra decisão anterior.',
        'Auto de infração foi gerado para empresa em fiscalização.',
        'Decisão foi tomada sobre processo administrativo.',
        'O sistema ficará indisponível para manutenção.',
        'Relatório mensal de atividades está disponível para download.',
        'Alerta de segurança: verifique suas credenciais.',
        'Backup automático foi realizado com sucesso.',
        'Nova funcionalidade foi implementada no sistema.'
    ]
    
    prioridades = ['baixa', 'normal', 'alta', 'urgente']
    status_choices = ['pendente', 'enviada', 'lida', 'falhada']
    
    notificacoes_criadas = []
    
    for i in range(50):  # Criar 50 notificações
        usuario = random.choice(usuarios)
        tipo = random.choice(tipos_notificacao)
        titulo = random.choice(titulos)
        mensagem = random.choice(mensagens)
        prioridade = random.choice(prioridades)
        status = random.choice(status_choices)
        
        # Gerar data aleatória nos últimos 30 dias
        data_criacao = datetime.now() - timedelta(days=random.randint(0, 30))
        
        # Dados extras aleatórios
        dados_extras = {
            'processo_id': f'PROC-{random.randint(1000, 9999)}',
            'empresa': f'Empresa {random.randint(1, 100)}',
            'valor': f'R$ {random.randint(100, 10000)}',
            'prazo_dias': random.randint(1, 30)
        }
        
        notificacao = Notificacao.objects.create(
            tipo=tipo,
            destinatario=usuario,
            titulo=titulo,
            mensagem=mensagem,
            dados_extras=dados_extras,
            prioridade=prioridade,
            status=status,
            criado_em=data_criacao
        )
        
        # Definir data de envio se foi enviada
        if status in ['enviada', 'lida']:
            notificacao.enviada_em = data_criacao + timedelta(minutes=random.randint(1, 60))
            notificacao.save()
        
        # Definir data de leitura se foi lida
        if status == 'lida':
            notificacao.lida_em = notificacao.enviada_em + timedelta(hours=random.randint(1, 24))
            notificacao.save()
        
        notificacoes_criadas.append(notificacao)
        
        if (i + 1) % 10 == 0:
            print(f"✅ {i + 1} notificações criadas")
    
    return notificacoes_criadas

def criar_logs_notificacao(notificacoes):
    """Cria logs de notificação"""
    print("\n🔧 Criando logs de notificação...")
    
    canais = ['email', 'sms', 'push', 'sistema']
    resultados = ['sucesso', 'falha', 'pendente']
    
    for notificacao in notificacoes:
        # Criar 1-3 logs por notificação
        num_logs = random.randint(1, 3)
        canais_usados = random.sample(canais, num_logs)
        
        for canal in canais_usados:
            resultado = random.choice(resultados)
            tentativas = random.randint(1, 3) if resultado == 'falha' else 1
            mensagem_erro = f"Erro no envio via {canal}" if resultado == 'falha' else ""
            
            LogNotificacao.objects.create(
                notificacao=notificacao,
                canal=canal,
                resultado=resultado,
                mensagem_erro=mensagem_erro,
                tentativas=tentativas
            )
    
    print(f"✅ Logs criados para {len(notificacoes)} notificações")

def main():
    """Função principal"""
    print("🚀 Criando dados de teste para o módulo de notificações...")
    print("=" * 60)
    
    # Obter usuários existentes
    usuarios = list(User.objects.all())
    if not usuarios:
        print("❌ Nenhum usuário encontrado. Crie usuários primeiro.")
        return
    
    # Criar tipos de notificação
    tipos_notificacao = criar_tipos_notificacao()
    
    # Criar templates
    criar_templates_notificacao(tipos_notificacao)
    
    # Criar preferências de usuários
    criar_preferencias_usuarios(usuarios, tipos_notificacao)
    
    # Criar notificações de teste
    notificacoes = criar_notificacoes_teste(usuarios, tipos_notificacao)
    
    # Criar logs de notificação
    criar_logs_notificacao(notificacoes)
    
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS DADOS CRIADOS:")
    print(f"   - Tipos de Notificação: {TipoNotificacao.objects.count()}")
    print(f"   - Templates: {TemplateNotificacao.objects.count()}")
    print(f"   - Preferências: {PreferenciaNotificacao.objects.count()}")
    print(f"   - Notificações: {Notificacao.objects.count()}")
    print(f"   - Logs: {LogNotificacao.objects.count()}")
    print("\n🎉 Dados de teste criados com sucesso!")
    print("\n💡 Para processar notificações pendentes, execute:")
    print("   python manage.py processar_notificacoes")

if __name__ == '__main__':
    main()

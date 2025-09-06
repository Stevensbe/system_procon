#!/usr/bin/env python
"""
Script para criar dados de teste para o módulo de fiscalização avançado
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from fiscalizacao.models import (
    TipoFiscalizacao, EvidenciaFiscalizacao, AutoInfracaoAvancado,
    HistoricoAutoInfracao, TemplateAutoInfracao, NotificacaoEletronica,
    ConfiguracaoFiscalizacao, AutoInfracao
)


def criar_tipos_fiscalizacao():
    """Criar tipos de fiscalização"""
    tipos_data = [
        {
            'nome': 'Fiscalização Presencial',
            'tipo': 'PRESENCIAL',
            'descricao': 'Fiscalização realizada presencialmente no estabelecimento'
        },
        {
            'nome': 'Fiscalização Remota',
            'tipo': 'REMOTA',
            'descricao': 'Fiscalização realizada remotamente através de sistemas'
        },
        {
            'nome': 'Denúncia',
            'tipo': 'DENUNCIA',
            'descricao': 'Fiscalização baseada em denúncia de consumidor'
        },
        {
            'nome': 'Ação Preventiva',
            'tipo': 'ACAO_PREVENTIVA',
            'descricao': 'Ação preventiva para evitar infrações'
        },
        {
            'nome': 'Força Tarefa',
            'tipo': 'FORCA_TAREFA',
            'descricao': 'Fiscalização em conjunto com outros órgãos'
        },
        {
            'nome': 'Monitoramento',
            'tipo': 'MONITORAMENTO',
            'descricao': 'Monitoramento contínuo de estabelecimentos'
        },
        {
            'nome': 'Auditoria',
            'tipo': 'AUDITORIA',
            'descricao': 'Auditoria de processos e procedimentos'
        }
    ]
    
    tipos = []
    for tipo_data in tipos_data:
        tipo, created = TipoFiscalizacao.objects.get_or_create(
            nome=tipo_data['nome'],
            defaults=tipo_data
        )
        if created:
            print(f"✅ Tipo criado: {tipo.nome}")
        tipos.append(tipo)
    
    return tipos


def criar_templates_auto_infracao(tipos):
    """Criar templates de autos de infração"""
    templates_data = [
        {
            'nome': 'Template Padrão - Bancos',
            'descricao': 'Template padrão para fiscalização de bancos',
            'tipo_fiscalizacao': tipos[0],  # Presencial
            'base_legal_padrao': 'Art. 34, 35 e 36 do CDC - Lei das Filas',
            'fundamentacao_padrao': 'Fundamentação técnica baseada na Lei das Filas e regulamentações do Banco Central',
            'valor_multa_padrao': Decimal('50000.00'),
            'prazo_defesa_padrao': 30,
            'prazo_pagamento_padrao': 30,
            'padrao': True
        },
        {
            'nome': 'Template - Postos de Combustível',
            'descricao': 'Template para fiscalização de postos de combustível',
            'tipo_fiscalizacao': tipos[0],  # Presencial
            'base_legal_padrao': 'Art. 55 e 56 do CDC - Preços Abusivos',
            'fundamentacao_padrao': 'Fundamentação técnica baseada na ANP e regulamentações de preços',
            'valor_multa_padrao': Decimal('30000.00'),
            'prazo_defesa_padrao': 30,
            'prazo_pagamento_padrao': 30,
            'padrao': False
        },
        {
            'nome': 'Template - Supermercados',
            'descricao': 'Template para fiscalização de supermercados',
            'tipo_fiscalizacao': tipos[0],  # Presencial
            'base_legal_padrao': 'Art. 34 e 35 do CDC - Publicidade Enganosa',
            'fundamentacao_padrao': 'Fundamentação técnica baseada em irregularidades de preços e produtos',
            'valor_multa_padrao': Decimal('25000.00'),
            'prazo_defesa_padrao': 30,
            'prazo_pagamento_padrao': 30,
            'padrao': False
        }
    ]
    
    templates = []
    usuarios = list(User.objects.all())
    
    for template_data in templates_data:
        template_data['criado_por'] = random.choice(usuarios)
        template, created = TemplateAutoInfracao.objects.get_or_create(
            nome=template_data['nome'],
            defaults=template_data
        )
        if created:
            print(f"✅ Template criado: {template.nome}")
        templates.append(template)
    
    return templates


def criar_autos_avancados(autos_existentes, templates, usuarios):
    """Criar autos de infração avançados"""
    autos_avancados = []
    
    for i, auto in enumerate(autos_existentes[:20]):  # Limitar a 20 autos
        template = random.choice(templates)
        
        # Criar auto avançado
        auto_avancado = AutoInfracaoAvancado.objects.create(
            auto_infracao=auto,
            gerado_automaticamente=random.choice([True, False]),
            template_utilizado=template.nome,
            gerado_por=random.choice(usuarios),
            assinatura_digital=random.choice([True, False]),
            certificado_assinatura='Certificado Padrão' if random.choice([True, False]) else '',
            data_assinatura=timezone.now() - timedelta(days=random.randint(1, 30)) if random.choice([True, False]) else None,
            assinado_por=random.choice(usuarios) if random.choice([True, False]) else None,
            notificacao_eletronica=random.choice([True, False]),
            email_notificacao=f'empresa{i+1}@exemplo.com' if random.choice([True, False]) else '',
            data_notificacao=timezone.now() - timedelta(days=random.randint(1, 15)) if random.choice([True, False]) else None,
            protocolo_notificacao=f'NOT{timezone.now().strftime("%Y%m%d")}{i+1:04d}' if random.choice([True, False]) else '',
            prazo_defesa=random.randint(15, 45),
            prazo_pagamento=random.randint(15, 45),
            status_workflow=random.choice(['RASCUNHO', 'EM_ANALISE', 'APROVADO', 'ASSINADO', 'NOTIFICADO', 'EM_DEFESA', 'JULGADO', 'PAGO']),
            versao_documento='1.0',
            hash_documento=f'hash_{i+1:08d}',
            modificado_por=random.choice(usuarios)
        )
        
        # Calcular prazos se notificado
        if auto_avancado.data_notificacao:
            auto_avancado.calcular_prazos()
            auto_avancado.save()
        
        autos_avancados.append(auto_avancado)
        print(f"✅ Auto avançado criado: {auto.numero}")
    
    return autos_avancados


def criar_evidencias(autos_avancados, usuarios):
    """Criar evidências de fiscalização"""
    evidencias = []
    tipos_evidencia = ['FOTO', 'VIDEO', 'DOCUMENTO', 'AUDIO', 'OUTROS']
    
    for auto_avancado in autos_avancados[:10]:  # Limitar a 10 autos
        num_evidencias = random.randint(1, 5)
        
        for i in range(num_evidencias):
            evidencia = EvidenciaFiscalizacao.objects.create(
                auto_infracao=auto_avancado.auto_infracao,
                tipo=random.choice(tipos_evidencia),
                titulo=f"Evidência {i+1} - {auto_avancado.auto_infracao.numero}",
                descricao=f"Evidência coletada durante fiscalização do auto {auto_avancado.auto_infracao.numero}",
                arquivo=f'evidencias/evidencia_{auto_avancado.auto_infracao.id}_{i+1}.pdf',
                nome_arquivo=f'evidencia_{auto_avancado.auto_infracao.id}_{i+1}.pdf',
                tamanho_arquivo=random.randint(100000, 5000000),
                upload_por=random.choice(usuarios)
            )
            
            evidencias.append(evidencia)
            print(f"✅ Evidência criada: {evidencia.titulo}")
    
    return evidencias


def criar_historico(autos_avancados, usuarios):
    """Criar histórico de autos de infração"""
    historicos = []
    acoes = ['CRIACAO', 'MODIFICACAO', 'ASSINATURA_DIGITAL', 'NOTIFICACAO_ELETRONICA', 'STATUS_ALTERADO', 'DEFESA_APRESENTADA']
    
    for auto_avancado in autos_avancados[:15]:  # Limitar a 15 autos
        num_historicos = random.randint(2, 8)
        
        for i in range(num_historicos):
            historico = HistoricoAutoInfracao.objects.create(
                auto_infracao=auto_avancado.auto_infracao,
                usuario=random.choice(usuarios),
                acao=random.choice(acoes),
                descricao=f"Ação {random.choice(acoes)} realizada no auto {auto_avancado.auto_infracao.numero}",
                dados_anteriores={'status': 'anterior'} if random.choice([True, False]) else None,
                dados_novos={'status': 'novo'} if random.choice([True, False]) else None,
                ip_origem=f'192.168.1.{random.randint(1, 255)}'
            )
            
            historicos.append(historico)
            print(f"✅ Histórico criado: {historico.acao} - {auto_avancado.auto_infracao.numero}")
    
    return historicos


def criar_notificacoes(autos_avancados, usuarios):
    """Criar notificações eletrônicas"""
    notificacoes = []
    tipos_notificacao = ['EMAIL', 'SMS', 'PUSH', 'WHATSAPP']
    status_notificacao = ['PENDENTE', 'ENVIADA', 'ENTREGUE', 'ERRO']
    
    for auto_avancado in autos_avancados[:12]:  # Limitar a 12 autos
        num_notificacoes = random.randint(1, 3)
        
        for i in range(num_notificacoes):
            status = random.choice(status_notificacao)
            
            notificacao = NotificacaoEletronica.objects.create(
                auto_infracao=auto_avancado.auto_infracao,
                tipo=random.choice(tipos_notificacao),
                destinatario=f'empresa{auto_avancado.auto_infracao.id}@exemplo.com',
                assunto=f'Notificação - Auto {auto_avancado.auto_infracao.numero}',
                mensagem=f'Notificação referente ao auto de infração {auto_avancado.auto_infracao.numero}',
                status=status,
                protocolo=f'NOT{timezone.now().strftime("%Y%m%d")}{auto_avancado.auto_infracao.id:04d}{i+1:02d}',
                data_envio=timezone.now() - timedelta(days=random.randint(1, 10)) if status in ['ENVIADA', 'ENTREGUE'] else None,
                data_entrega=timezone.now() - timedelta(days=random.randint(1, 5)) if status == 'ENTREGUE' else None,
                tentativas=random.randint(0, 3),
                erro_mensagem='Erro de conexão' if status == 'ERRO' else '',
                enviado_por=random.choice(usuarios)
            )
            
            notificacoes.append(notificacao)
            print(f"✅ Notificação criada: {notificacao.tipo} - {auto_avancado.auto_infracao.numero}")
    
    return notificacoes


def criar_configuracao():
    """Criar configuração de fiscalização"""
    config, created = ConfiguracaoFiscalizacao.objects.get_or_create(
        defaults={
            'max_evidencias_por_auto': 10,
            'max_tamanho_arquivo': 50,
            'tipos_arquivo_permitidos': ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'mp4', 'avi'],
            'notificar_prazos': True,
            'dias_antecedencia_prazo': 5,
            'notificar_atrasos': True,
            'assinatura_digital_obrigatoria': False,
            'certificado_padrao': 'Certificado Padrão PROCON',
            'workflow_automatico': True,
            'aprovacao_obrigatoria': True,
            'configurado_por': User.objects.first()
        }
    )
    
    if created:
        print(f"✅ Configuração criada")
    
    return config


def main():
    """Função principal"""
    print("🚀 CRIANDO DADOS DE TESTE - MÓDULO DE FISCALIZAÇÃO AVANÇADO")
    print("=" * 70)
    print(f"⏰ {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Verificar usuários
    usuarios = list(User.objects.all())
    if not usuarios:
        print("❌ ERRO: Nenhum usuário encontrado. Execute primeiro o script de criação de usuários.")
        return
    
    print(f"👥 Usuários encontrados: {len(usuarios)}")
    
    # Verificar autos existentes
    autos_existentes = list(AutoInfracao.objects.all())
    if not autos_existentes:
        print("❌ ERRO: Nenhum auto de infração encontrado. Execute primeiro o script de criação de autos básicos.")
        return
    
    print(f"📋 Autos existentes: {len(autos_existentes)}")
    
    try:
        # Criar dados
        tipos = criar_tipos_fiscalizacao()
        templates = criar_templates_auto_infracao(tipos)
        autos_avancados = criar_autos_avancados(autos_existentes, templates, usuarios)
        evidencias = criar_evidencias(autos_avancados, usuarios)
        historicos = criar_historico(autos_avancados, usuarios)
        notificacoes = criar_notificacoes(autos_avancados, usuarios)
        configuracao = criar_configuracao()
        
        print("\n" + "=" * 70)
        print("✅ DADOS CRIADOS COM SUCESSO!")
        print("=" * 70)
        print("📊 Resumo:")
        print(f"   • Tipos de fiscalização: {len(tipos)}")
        print(f"   • Templates: {len(templates)}")
        print(f"   • Autos avançados: {len(autos_avancados)}")
        print(f"   • Evidências: {len(evidencias)}")
        print(f"   • Históricos: {len(historicos)}")
        print(f"   • Notificações: {len(notificacoes)}")
        print(f"   • Configuração: 1")
        
        print("\n🎯 Módulo de fiscalização avançado implementado com sucesso!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()

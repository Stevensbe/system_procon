#!/usr/bin/env python
"""
Script para criar dados de teste para o módulo de Relatórios Avançados
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from relatorios.models import (
    TipoRelatorio, Relatorio, RelatorioAgendado, TemplateRelatorio,
    FiltroRelatorio, RelatorioCompartilhado, HistoricoRelatorio, ConfiguracaoRelatorio
)


def criar_tipos_relatorio():
    """Criar tipos de relatórios"""
    tipos = [
        {
            'nome': 'Relatório de Fiscalizações',
            'descricao': 'Relatórios sobre autos de infração e fiscalizações',
            'modulo': 'FISCALIZACAO',
            'ativo': True
        },
        {
            'nome': 'Relatório de Multas',
            'descricao': 'Relatórios sobre multas aplicadas e arrecadação',
            'modulo': 'MULTAS',
            'ativo': True
        },
        {
            'nome': 'Relatório de Empresas',
            'descricao': 'Relatórios sobre empresas cadastradas e infrações',
            'modulo': 'EMPRESAS',
            'ativo': True
        },
        {
            'nome': 'Relatório de Protocolos',
            'descricao': 'Relatórios sobre protocolos e processos',
            'modulo': 'PROTOCOLO',
            'ativo': True
        },
        {
            'nome': 'Relatório de Peticionamento',
            'descricao': 'Relatórios sobre petições e documentos',
            'modulo': 'PETICIONAMENTO',
            'ativo': True
        },
        {
            'nome': 'Relatório de Recursos',
            'descricao': 'Relatórios sobre recursos administrativos',
            'modulo': 'JURIDICO',
            'ativo': True
        },
        {
            'nome': 'Relatório de Produtividade',
            'descricao': 'Relatórios sobre produtividade dos fiscais',
            'modulo': 'FISCALIZACAO',
            'ativo': True
        },
        {
            'nome': 'Relatório de Arrecadação',
            'descricao': 'Relatórios sobre arrecadação de multas',
            'modulo': 'MULTAS',
            'ativo': True
        }
    ]
    
    tipos_criados = []
    for tipo_data in tipos:
        tipo, created = TipoRelatorio.objects.get_or_create(
            nome=tipo_data['nome'],
            defaults=tipo_data
        )
        if created:
            print(f"✅ Tipo de relatório criado: {tipo.nome}")
        tipos_criados.append(tipo)
    
    return tipos_criados


def criar_templates_relatorio(tipos, usuarios):
    """Criar templates de relatórios"""
    templates = [
        {
            'nome': 'Template Padrão',
            'descricao': 'Template padrão para relatórios gerais',
            'configuracao': {
                'cabecalho': True,
                'rodape': True,
                'logo': True,
                'paginacao': True
            },
            'layout': 'padrao',
            'css': 'default',
            'ativo': True,
            'padrao': True
        },
        {
            'nome': 'Template Executivo',
            'descricao': 'Template para relatórios executivos',
            'configuracao': {
                'cabecalho': True,
                'rodape': True,
                'logo': True,
                'paginacao': True,
                'graficos': True
            },
            'layout': 'executivo',
            'css': 'executive',
            'ativo': True,
            'padrao': False
        },
        {
            'nome': 'Template Detalhado',
            'descricao': 'Template para relatórios detalhados',
            'configuracao': {
                'cabecalho': True,
                'rodape': True,
                'logo': True,
                'paginacao': True,
                'detalhes': True
            },
            'layout': 'detalhado',
            'css': 'detailed',
            'ativo': True,
            'padrao': False
        }
    ]
    
    templates_criados = []
    for template_data in templates:
        template_data['tipo_relatorio'] = random.choice(tipos)
        template_data['criado_por'] = random.choice(usuarios)
        template, created = TemplateRelatorio.objects.get_or_create(
            nome=template_data['nome'],
            defaults=template_data
        )
        if created:
            print(f"✅ Template criado: {template.nome}")
        templates_criados.append(template)
    
    return templates_criados


def criar_filtros_relatorio(tipos):
    """Criar filtros para relatórios"""
    filtros = [
        {
            'nome': 'Período',
            'descricao': 'Filtro por período de data',
            'tipo_filtro': 'DATA',
            'campo': 'data_inicio',
            'opcoes': {},
            'obrigatorio': True,
            'valor_padrao': '30',
            'ativo': True,
            'ordem': 1
        },
        {
            'nome': 'Status',
            'descricao': 'Filtro por status',
            'tipo_filtro': 'SELECT',
            'campo': 'status',
            'opcoes': {
                'opcoes': ['PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO']
            },
            'obrigatorio': False,
            'valor_padrao': '',
            'ativo': True,
            'ordem': 2
        },
        {
            'nome': 'Formato',
            'descricao': 'Filtro por formato de saída',
            'tipo_filtro': 'SELECT',
            'campo': 'formato',
            'opcoes': {
                'opcoes': ['PDF', 'EXCEL', 'CSV', 'JSON']
            },
            'obrigatorio': False,
            'valor_padrao': 'PDF',
            'ativo': True,
            'ordem': 3
        },
        {
            'nome': 'Valor Mínimo',
            'descricao': 'Filtro por valor mínimo',
            'tipo_filtro': 'NUMERO',
            'campo': 'valor_minimo',
            'opcoes': {},
            'obrigatorio': False,
            'valor_padrao': '0',
            'ativo': True,
            'ordem': 4
        },
        {
            'nome': 'Valor Máximo',
            'descricao': 'Filtro por valor máximo',
            'tipo_filtro': 'NUMERO',
            'campo': 'valor_maximo',
            'opcoes': {},
            'obrigatorio': False,
            'valor_padrao': '1000000',
            'ativo': True,
            'ordem': 5
        }
    ]
    
    filtros_criados = []
    for filtro_data in filtros:
        filtro_data['tipo_relatorio'] = random.choice(tipos)
        filtro, created = FiltroRelatorio.objects.get_or_create(
            nome=filtro_data['nome'],
            tipo_relatorio=filtro_data['tipo_relatorio'],
            defaults=filtro_data
        )
        if created:
            print(f"✅ Filtro criado: {filtro.nome}")
        filtros_criados.append(filtro)
    
    return filtros_criados


def criar_relatorios(tipos, usuarios):
    """Criar relatórios de exemplo"""
    relatorios = []
    
    for i in range(20):
        tipo = random.choice(tipos)
        usuario = random.choice(usuarios)
        status = random.choice(['PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO'])
        formato = random.choice(['PDF', 'EXCEL', 'CSV', 'JSON'])
        
        # Data de solicitação (últimos 30 dias)
        data_solicitacao = timezone.now() - timedelta(days=random.randint(0, 30))
        
        # Preparar dados do relatório
        relatorio_data = {
            'titulo': f"Relatório {tipo.nome} #{i+1:03d}",
            'descricao': f"Relatório gerado automaticamente para teste",
            'tipo_relatorio': tipo,
            'parametros': {
                'data_inicio': (data_solicitacao - timedelta(days=30)).strftime('%Y-%m-%d'),
                'data_fim': data_solicitacao.strftime('%Y-%m-%d'),
                'formato': formato
            },
            'filtros': {
                'status': status,
                'formato': formato
            },
            'formato': formato,
            'status': status,
            'progresso': random.randint(0, 100) if status == 'PROCESSANDO' else (100 if status == 'CONCLUIDO' else 0),
            'data_solicitacao': data_solicitacao,
            'solicitado_por': usuario,
        }
        
        # Adicionar campos condicionais
        if status in ['CONCLUIDO', 'ERRO']:
            relatorio_data['data_conclusao'] = data_solicitacao + timedelta(minutes=random.randint(1, 60))
            relatorio_data['tempo_processamento'] = random.uniform(0.5, 5.0)
            
        if status == 'CONCLUIDO':
            relatorio_data['registros_processados'] = random.randint(50, 500)
        elif status == 'ERRO':
            relatorio_data['erro_mensagem'] = f"Erro simulado para teste"
        
        relatorio = Relatorio.objects.create(**relatorio_data)
        
        relatorios.append(relatorio)
        print(f"✅ Relatório criado: {relatorio.titulo}")
    
    return relatorios


def criar_relatorios_agendados(tipos, usuarios):
    """Criar relatórios agendados"""
    agendamentos = []
    
    frequencias = ['DIARIO', 'SEMANAL', 'MENSAL']
    
    for i in range(10):
        tipo = random.choice(tipos)
        usuario = random.choice(usuarios)
        frequencia = random.choice(frequencias)
        
        # Próxima execução (próximos 7 dias)
        proxima_execucao = timezone.now() + timedelta(days=random.randint(1, 7))
        
        agendamento = RelatorioAgendado.objects.create(
            nome=f"Agendamento {tipo.nome} #{i+1:02d}",
            descricao=f"Relatório agendado automaticamente para teste",
            tipo_relatorio=tipo,
            parametros={
                'data_inicio': '2024-01-01',
                'data_fim': '2024-12-31',
                'formato': 'PDF'
            },
            filtros={
                'status': 'CONCLUIDO',
                'formato': 'PDF'
            },
            formato='PDF',
            frequencia=frequencia,
            proxima_execucao=proxima_execucao,
            ultima_execucao=timezone.now() - timedelta(days=random.randint(1, 30)) if random.choice([True, False]) else None,
            status='ATIVO',
            ativo=True,
            criado_por=usuario
        )
        
        agendamentos.append(agendamento)
        print(f"✅ Agendamento criado: {agendamento.nome}")
    
    return agendamentos


def criar_compartilhamentos(relatorios, usuarios):
    """Criar compartilhamentos de relatórios"""
    compartilhamentos = []
    
    for relatorio in random.sample(relatorios, min(5, len(relatorios))):
        # Compartilhar com 1-3 usuários
        usuarios_compartilhamento = random.sample(usuarios, random.randint(1, min(3, len(usuarios))))
        
        for usuario in usuarios_compartilhamento:
            if usuario != relatorio.solicitado_por:
                compartilhamento = RelatorioCompartilhado.objects.create(
                    relatorio=relatorio,
                    compartilhado_por=relatorio.solicitado_por,
                    compartilhado_com=usuario,
                    pode_visualizar=True,
                    pode_baixar=random.choice([True, False]),
                    pode_compartilhar=False,
                    data_compartilhamento=timezone.now() - timedelta(days=random.randint(1, 10)),
                    data_expiracao=timezone.now() + timedelta(days=random.randint(30, 90)),
                    ativo=True
                )
                
                compartilhamentos.append(compartilhamento)
                print(f"✅ Compartilhamento criado: {relatorio.titulo} -> {usuario.username}")
    
    return compartilhamentos


def criar_historico_relatorios(relatorios, usuarios):
    """Criar histórico de relatórios"""
    historicos = []
    
    for relatorio in relatorios:
        # Criar histórico para relatórios concluídos ou com erro
        if relatorio.status in ['CONCLUIDO', 'ERRO']:
            historico = HistoricoRelatorio.objects.create(
                relatorio=relatorio,
                usuario=relatorio.solicitado_por,
                status=relatorio.status,
                tempo_processamento=relatorio.tempo_processamento,
                registros_processados=relatorio.registros_processados,
                erro_mensagem=relatorio.erro_mensagem,
                data_execucao=relatorio.data_conclusao or relatorio.data_solicitacao,
                ip_origem='127.0.0.1'
            )
            
            historicos.append(historico)
            print(f"✅ Histórico criado: {relatorio.titulo}")
    
    return historicos


def criar_configuracao_relatorio(usuarios):
    """Criar configuração de relatórios"""
    configuracao, created = ConfiguracaoRelatorio.objects.get_or_create(
        defaults={
            'max_relatorios_por_usuario': 10,
            'max_tamanho_arquivo': 50,  # MB
            'tempo_maximo_processamento': 30,  # minutos
            'dias_retencao_relatorios': 365,
            'dias_retencao_agendados': 730,
            'notificar_conclusao': True,
            'notificar_erro': True,
            'formato_padrao': 'PDF',
            'compressao_arquivos': True,
            'configurado_por': random.choice(usuarios)
        }
    )
    
    if created:
        print(f"✅ Configuração criada")
    
    return configuracao


def main():
    """Função principal"""
    print("🚀 CRIANDO DADOS DE TESTE - MÓDULO DE RELATÓRIOS AVANÇADOS")
    print("=" * 70)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    try:
        # Verificar se existem usuários
        usuarios = list(User.objects.all())
        if not usuarios:
            print("❌ Nenhum usuário encontrado. Crie usuários primeiro.")
            return False
        
        print(f"👥 Usuários encontrados: {len(usuarios)}")
        
        # Criar dados
        tipos = criar_tipos_relatorio()
        templates = criar_templates_relatorio(tipos, usuarios)
        filtros = criar_filtros_relatorio(tipos)
        relatorios = criar_relatorios(tipos, usuarios)
        agendamentos = criar_relatorios_agendados(tipos, usuarios)
        compartilhamentos = criar_compartilhamentos(relatorios, usuarios)
        historicos = criar_historico_relatorios(relatorios, usuarios)
        configuracao = criar_configuracao_relatorio(usuarios)
        
        print("\n" + "=" * 70)
        print("✅ DADOS CRIADOS COM SUCESSO!")
        print("=" * 70)
        print(f"📊 Resumo:")
        print(f"   • Tipos de relatório: {len(tipos)}")
        print(f"   • Templates: {len(templates)}")
        print(f"   • Filtros: {len(filtros)}")
        print(f"   • Relatórios: {len(relatorios)}")
        print(f"   • Agendamentos: {len(agendamentos)}")
        print(f"   • Compartilhamentos: {len(compartilhamentos)}")
        print(f"   • Históricos: {len(historicos)}")
        print(f"   • Configuração: 1")
        print("\n🎯 Módulo de relatórios avançados implementado com sucesso!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

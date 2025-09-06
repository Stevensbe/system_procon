#!/usr/bin/env python
"""
Script para criar dados de teste para o módulo de recursos
"""
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from recursos.models import (
    TipoRecurso, Recurso, MovimentacaoRecurso, ModeloDecisao,
    PrazoRecurso, ComissaoJulgamento, SessaoJulgamento
)

def criar_tipos_recurso():
    """Cria tipos de recurso"""
    print("🔧 Criando tipos de recurso...")
    
    tipos = [
        {
            'nome': 'Recurso contra Multa',
            'codigo': 'REC_MULTA',
            'descricao': 'Recurso administrativo contra multas aplicadas pelo PROCON',
            'prazo_dias': 30,
            'permite_segunda_instancia': True,
            'ordem': 1
        },
        {
            'nome': 'Recurso contra Auto de Infração',
            'codigo': 'REC_AUTO',
            'descricao': 'Recurso contra autos de infração aplicados em fiscalizações',
            'prazo_dias': 30,
            'permite_segunda_instancia': True,
            'ordem': 2
        },
        {
            'nome': 'Recurso contra Decisão',
            'codigo': 'REC_DECISAO',
            'descricao': 'Recurso contra decisões administrativas do PROCON',
            'prazo_dias': 15,
            'permite_segunda_instancia': False,
            'ordem': 3
        },
        {
            'nome': 'Recurso contra Indeferimento',
            'codigo': 'REC_INDEFERIMENTO',
            'descricao': 'Recurso contra indeferimento de petições',
            'prazo_dias': 10,
            'permite_segunda_instancia': True,
            'ordem': 4
        }
    ]
    
    tipos_criados = []
    for tipo_data in tipos:
        tipo, created = TipoRecurso.objects.get_or_create(
            codigo=tipo_data['codigo'],
            defaults=tipo_data
        )
        if created:
            print(f"✅ Tipo criado: {tipo.nome}")
        else:
            print(f"✅ Tipo já existe: {tipo.nome}")
        tipos_criados.append(tipo)
    
    return tipos_criados

def criar_modelos_decisao(tipos_recurso):
    """Cria modelos de decisão"""
    print("\n🔧 Criando modelos de decisão...")
    
    modelos = [
        {
            'nome': 'Modelo Deferimento Multa',
            'tipo_recurso': tipos_recurso[0],  # Recurso contra Multa
            'tipo_decisao': 'deferido',
            'template_decisao': 'Vistos os autos, DEFIRO o recurso administrativo, cancelando a multa aplicada.',
            'template_fundamentacao': 'Fundamentação baseada na análise dos documentos apresentados.',
            'variaveis_disponiveis': '{{numero_protocolo}}, {{requerente_nome}}, {{valor_multa}}',
            'ativo': True
        },
        {
            'nome': 'Modelo Indeferimento Multa',
            'tipo_recurso': tipos_recurso[0],
            'tipo_decisao': 'indeferido',
            'template_decisao': 'Vistos os autos, INDEFIRO o recurso administrativo, mantendo a multa aplicada.',
            'template_fundamentacao': 'Fundamentação baseada na análise dos documentos apresentados.',
            'variaveis_disponiveis': '{{numero_protocolo}}, {{requerente_nome}}, {{valor_multa}}',
            'ativo': True
        },
        {
            'nome': 'Modelo Deferimento Parcial',
            'tipo_recurso': tipos_recurso[0],
            'tipo_decisao': 'parcialmente_deferido',
            'template_decisao': 'Vistos os autos, DEFIRO PARCIALMENTE o recurso, reduzindo o valor da multa.',
            'template_fundamentacao': 'Fundamentação baseada na análise dos documentos apresentados.',
            'variaveis_disponiveis': '{{numero_protocolo}}, {{requerente_nome}}, {{valor_multa}}',
            'ativo': True
        }
    ]
    
    for modelo_data in modelos:
        modelo, created = ModeloDecisao.objects.get_or_create(
            nome=modelo_data['nome'],
            defaults=modelo_data
        )
        if created:
            print(f"✅ Modelo criado: {modelo.nome}")
        else:
            print(f"✅ Modelo já existe: {modelo.nome}")

def criar_comissoes_julgamento():
    """Cria comissões de julgamento"""
    print("\n🔧 Criando comissões de julgamento...")
    
    comissoes = [
        {
            'nome': 'Comissão de Julgamento 1',
            'tipo_instancia': 'primeira',
            'presidente': 'Dr. João Silva',
            'membros': 'Dr. Maria Santos\nDr. Pedro Oliveira\nDr. Ana Costa',
            'ativa': True
        },
        {
            'nome': 'Comissão de Julgamento 2',
            'tipo_instancia': 'segunda',
            'presidente': 'Dra. Fernanda Lima',
            'membros': 'Dr. Carlos Mendes\nDr. Roberto Alves\nDra. Juliana Pereira',
            'ativa': True
        }
    ]
    
    comissoes_criadas = []
    for comissao_data in comissoes:
        comissao, created = ComissaoJulgamento.objects.get_or_create(
            nome=comissao_data['nome'],
            defaults=comissao_data
        )
        if created:
            print(f"✅ Comissão criada: {comissao.nome}")
        else:
            print(f"✅ Comissão já existe: {comissao.nome}")
        comissoes_criadas.append(comissao)
    
    return comissoes_criadas

def criar_recursos(tipos_recurso):
    """Cria recursos de teste"""
    print("\n🔧 Criando recursos de teste...")
    
    requerentes = [
        {
            'nome': 'Empresa ABC LTDA',
            'tipo': 'pessoa_juridica',
            'documento': '12.345.678/0001-90',
            'endereco': 'Rua das Flores, 123 - Centro - São Paulo/SP',
            'telefone': '(11) 99999-9999',
            'email': 'contato@empresaabc.com.br'
        },
        {
            'nome': 'João da Silva',
            'tipo': 'pessoa_fisica',
            'documento': '123.456.789-00',
            'endereco': 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP',
            'telefone': '(11) 88888-8888',
            'email': 'joao.silva@email.com'
        },
        {
            'nome': 'Supermercado XYZ LTDA',
            'tipo': 'pessoa_juridica',
            'documento': '98.765.432/0001-10',
            'endereco': 'Rua do Comércio, 456 - Vila Madalena - São Paulo/SP',
            'telefone': '(11) 77777-7777',
            'email': 'gerencia@superxyz.com.br'
        }
    ]
    
    assuntos = [
        'Recurso contra multa aplicada por prática abusiva',
        'Recurso contra auto de infração por irregularidade',
        'Recurso contra indeferimento de petição',
        'Recurso contra decisão administrativa',
        'Recurso contra aplicação de penalidade'
    ]
    
    fundamentacoes = [
        'A multa aplicada não possui fundamentação legal adequada, violando o princípio da legalidade.',
        'O auto de infração foi lavrado sem a devida observância do contraditório e ampla defesa.',
        'A petição foi indeferida sem análise adequada dos documentos apresentados.',
        'A decisão administrativa não considerou os fatos apresentados pela defesa.',
        'A penalidade aplicada é desproporcional aos fatos apurados.'
    ]
    
    pedidos = [
        'Cancelamento da multa aplicada',
        'Anulação do auto de infração',
        'Reconsideração do indeferimento',
        'Reformulação da decisão administrativa',
        'Redução da penalidade aplicada'
    ]
    
    recursos_criados = []
    
    for i in range(1, 21):  # Criar 20 recursos
        requerente = random.choice(requerentes)
        tipo_recurso = random.choice(tipos_recurso)
        assunto = random.choice(assuntos)
        fundamentacao = random.choice(fundamentacoes)
        pedido = random.choice(pedidos)
        
        # Gerar datas
        data_protocolo = datetime.now() - timedelta(days=random.randint(1, 90))
        data_limite = data_protocolo.date() + timedelta(days=tipo_recurso.prazo_dias)
        
        # Status baseado na data limite
        if data_limite < datetime.now().date():
            status = random.choice(['deferido', 'indeferido', 'parcialmente_deferido'])
        else:
            status = random.choice(['protocolado', 'em_analise', 'com_parecer'])
        
        recurso_data = {
            'numero_protocolo': f'REC-2024-{i:03d}',
            'tipo_recurso': tipo_recurso,
            'instancia': random.choice(['primeira', 'segunda']),
            'numero_processo': f'PROC-2024-{i:03d}',
            'numero_auto': f'AUTO-2024-{i:03d}' if random.choice([True, False]) else '',
            'requerente_nome': requerente['nome'],
            'requerente_tipo': requerente['tipo'],
            'requerente_documento': requerente['documento'],
            'requerente_endereco': requerente['endereco'],
            'requerente_telefone': requerente['telefone'],
            'requerente_email': requerente['email'],
            'tem_advogado': random.choice([True, False]),
            'advogado_nome': 'Dr. Advogado Silva' if random.choice([True, False]) else '',
            'advogado_oab': '123456/SP' if random.choice([True, False]) else '',
            'procuracao_anexada': random.choice([True, False]),
            'data_protocolo': data_protocolo,
            'data_limite_analise': data_limite,
            'assunto': assunto,
            'fundamentacao': fundamentacao,
            'pedido': pedido,
            'valor_causa': Decimal(random.randint(1000, 50000)),
            'status': status
        }
        
        # Adicionar decisão se o recurso foi julgado
        if status in ['deferido', 'indeferido', 'parcialmente_deferido']:
            recurso_data['data_julgamento'] = data_limite - timedelta(days=random.randint(1, 10))
            recurso_data['data_decisao'] = recurso_data['data_julgamento']
            recurso_data['decisao'] = f'Decisão do recurso {recurso_data["numero_protocolo"]}'
            recurso_data['fundamentacao_decisao'] = 'Fundamentação da decisão baseada na análise dos autos.'
            recurso_data['relator'] = 'Dr. Relator Silva'
        
        recurso, created = Recurso.objects.get_or_create(
            numero_protocolo=recurso_data['numero_protocolo'],
            defaults=recurso_data
        )
        
        if created:
            print(f"✅ Recurso criado: {recurso.numero_protocolo}")
        else:
            print(f"✅ Recurso já existe: {recurso.numero_protocolo}")
        
        recursos_criados.append(recurso)
    
    return recursos_criados

def criar_movimentacoes(recursos):
    """Cria movimentações para os recursos"""
    print("\n🔧 Criando movimentações...")
    
    tipos_movimentacao = [
        'Protocolo',
        'Distribuição',
        'Análise',
        'Parecer',
        'Julgamento',
        'Decisão',
        'Publicação'
    ]
    
    for recurso in recursos:
        # Criar movimentação de protocolo
        MovimentacaoRecurso.objects.get_or_create(
            recurso=recurso,
            tipo_movimentacao='protocolo',
            defaults={
                'descricao': f'Recurso protocolado com número {recurso.numero_protocolo}',
                'responsavel': 'Sistema'
            }
        )
        
        # Criar outras movimentações baseadas no status
        if recurso.status != 'protocolado':
            data_analise = recurso.data_protocolo + timedelta(days=random.randint(1, 10))
            
            MovimentacaoRecurso.objects.get_or_create(
                recurso=recurso,
                tipo_movimentacao='distribuicao',
                defaults={
                    'descricao': 'Recurso distribuído para análise',
                    'responsavel': 'Sistema'
                }
            )
            
            if recurso.status in ['em_analise', 'com_parecer', 'deferido', 'indeferido', 'parcialmente_deferido']:
                data_parecer = data_analise + timedelta(days=random.randint(5, 15))
                
                MovimentacaoRecurso.objects.get_or_create(
                    recurso=recurso,
                    tipo_movimentacao='parecer',
                    defaults={
                        'descricao': 'Iniciada análise do recurso',
                        'responsavel': 'Analista'
                    }
                )
        
        if recurso.status in ['deferido', 'indeferido', 'parcialmente_deferido']:
            MovimentacaoRecurso.objects.get_or_create(
                recurso=recurso,
                tipo_movimentacao='julgamento',
                defaults={
                    'descricao': f'Recurso julgado - {recurso.get_status_display()}',
                    'responsavel': 'Comissão'
                }
            )
    
    print(f"✅ Movimentações criadas para {len(recursos)} recursos")

def criar_prazos(recursos):
    """Cria prazos para os recursos"""
    print("\n🔧 Criando prazos...")
    
    for recurso in recursos:
        # Prazo de análise
        PrazoRecurso.objects.get_or_create(
            recurso=recurso,
            defaults={
                'prazo_analise': recurso.tipo_recurso.prazo_dias,
                'data_inicio_prazo': recurso.data_protocolo.date(),
                'data_limite_prazo': recurso.data_limite_analise
            }
        )
    
    print(f"✅ Prazos criados para {len(recursos)} recursos")

def criar_sessoes_julgamento(comissoes):
    """Cria sessões de julgamento"""
    print("\n🔧 Criando sessões de julgamento...")
    
    locais = [
        'Sala de Julgamento 1',
        'Sala de Julgamento 2',
        'Auditório Principal',
        'Sala de Reuniões'
    ]
    
    for i in range(5):
        data_sessao = datetime.now() + timedelta(days=random.randint(1, 30))
        comissao = random.choice(comissoes)
        
        sessao, created = SessaoJulgamento.objects.get_or_create(
            comissao=comissao,
            numero_sessao=f'SESSAO-2024-{i+1:03d}',
            data_sessao=data_sessao.date(),
            defaults={
                'hora_inicio': datetime.now().time(),
                'local_sessao': random.choice(locais),
                'realizada': random.choice([True, False]),
                'publicada': random.choice([True, False])
            }
        )
        
        if created:
            print(f"✅ Sessão criada: {sessao.comissao.nome} - {sessao.data_sessao.strftime('%d/%m/%Y')}")
        else:
            print(f"✅ Sessão já existe: {sessao.comissao.nome} - {sessao.data_sessao.strftime('%d/%m/%Y')}")

def main():
    """Função principal"""
    print("🚀 Criando dados de teste para o módulo de recursos...")
    print("=" * 60)
    
    # Criar tipos de recurso
    tipos_recurso = criar_tipos_recurso()
    
    # Criar modelos de decisão
    criar_modelos_decisao(tipos_recurso)
    
    # Criar comissões de julgamento
    comissoes = criar_comissoes_julgamento()
    
    # Criar recursos
    recursos = criar_recursos(tipos_recurso)
    
    # Criar movimentações
    criar_movimentacoes(recursos)
    
    # Criar prazos
    criar_prazos(recursos)
    
    # Criar sessões de julgamento
    criar_sessoes_julgamento(comissoes)
    
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS DADOS CRIADOS:")
    print(f"   - Tipos de Recurso: {TipoRecurso.objects.count()}")
    print(f"   - Modelos de Decisão: {ModeloDecisao.objects.count()}")
    print(f"   - Comissões: {ComissaoJulgamento.objects.count()}")
    print(f"   - Recursos: {Recurso.objects.count()}")
    print(f"   - Movimentações: {MovimentacaoRecurso.objects.count()}")
    print(f"   - Prazos: {PrazoRecurso.objects.count()}")
    print(f"   - Sessões: {SessaoJulgamento.objects.count()}")
    print("\n🎉 Dados de teste criados com sucesso!")

if __name__ == '__main__':
    main()

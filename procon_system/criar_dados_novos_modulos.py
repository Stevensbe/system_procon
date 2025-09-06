#!/usr/bin/env python
"""
Script para criar dados de teste para os novos módulos implementados
"""
import os
import sys
import django
from datetime import date, datetime, timedelta
from decimal import Decimal

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.utils import timezone
from empresas.models import PorteEmpresa, SegmentoEconomico, Empresa, ResponsavelLegal
from notificacoes.models import TipoNotificacao, Notificacao
from relatorios.models import CategoriaRelatorio, IndicadorKPI
from agenda.models import Fiscal, TipoEvento, EventoAgenda, CalendarioFiscalizacao
from consulta_publica.models import EmpresaPublica, MonitoramentoPrecos, RestricaoEmpresa
from produtos.models import CategoriaProduto, Fabricante, Produto, ProdutoInutilizado
from recursos.models import TipoRecurso, Recurso
from auditoria.models import TipoEvento as TipoEventoAuditoria, LogSistema


def criar_dados_empresas():
    """Cria dados de teste para o módulo de empresas"""
    print("Criando dados de empresas...")
    
    # Portes
    portes = [
        ("Microempresa", 0, 81000),
        ("Pequena Empresa", 81001, 300000),
        ("Média Empresa", 300001, 3600000),
        ("Grande Empresa", 3600001, None),
    ]
    
    for nome, min_val, max_val in portes:
        PorteEmpresa.objects.get_or_create(
            nome=nome,
            defaults={
                'faturamento_min': min_val,
                'faturamento_max': max_val,
                'descricao': f"Porte {nome}"
            }
        )
    
    # Segmentos
    segmentos = [
        ("Alimentação", "ALIM"),
        ("Supermercados", "SUPER"),
        ("Farmácias", "FARM"),
        ("Posto de Combustível", "POSTO"),
        ("Banco", "BANCO"),
        ("Telecomunicações", "TELECOM"),
        ("Educação", "EDU"),
        ("Saúde", "SAUDE"),
    ]
    
    for nome, codigo in segmentos:
        SegmentoEconomico.objects.get_or_create(
            nome=nome,
            defaults={'codigo': codigo}
        )
    
    # Empresas de exemplo
    empresas_exemplo = [
        {
            'razao_social': 'Supermercado Amazonas LTDA',
            'nome_fantasia': 'Super Amazonas',
            'cnpj': '12.345.678/0001-90',
            'endereco': 'Av. Eduardo Ribeiro, 1000',
            'bairro': 'Centro',
            'cidade': 'Manaus',
            'segmento': 'Supermercados',
            'porte': 'Média Empresa',
        },
        {
            'razao_social': 'Farmácia Popular do Norte S/A',
            'nome_fantasia': 'Farmácia Popular',
            'cnpj': '98.765.432/0001-10',
            'endereco': 'Rua dos Remédios, 500',
            'bairro': 'Aleixo',
            'cidade': 'Manaus',
            'segmento': 'Farmácias',
            'porte': 'Pequena Empresa',
        },
        {
            'razao_social': 'Posto Tropical Combustíveis LTDA',
            'nome_fantasia': 'Posto Tropical',
            'cnpj': '11.222.333/0001-44',
            'endereco': 'Av. Torquato Tapajós, 2000',
            'bairro': 'Tarumã',
            'cidade': 'Manaus',
            'segmento': 'Posto de Combustível',
            'porte': 'Pequena Empresa',
        }
    ]
    
    for dados in empresas_exemplo:
        segmento = SegmentoEconomico.objects.get(nome=dados['segmento'])
        porte = PorteEmpresa.objects.get(nome=dados['porte'])
        
        empresa, created = Empresa.objects.get_or_create(
            cnpj=dados['cnpj'],
            defaults={
                'razao_social': dados['razao_social'],
                'nome_fantasia': dados['nome_fantasia'],
                'endereco': dados['endereco'],
                'bairro': dados['bairro'],
                'cidade': dados['cidade'],
                'estado': 'AM',
                'segmento': segmento,
                'porte': porte,
                'classificacao_risco': 'baixo',
            }
        )
        
        if created:
            # Adiciona responsável legal
            ResponsavelLegal.objects.create(
                empresa=empresa,
                nome=f"Responsável {empresa.razao_social.split()[0]}",
                cpf="123.456.789-00",
                cargo="Gerente Geral",
                telefone="(92) 99999-9999",
                email="responsavel@empresa.com.br"
            )


def criar_dados_notificacoes():
    """Cria dados de teste para notificações"""
    print("Criando dados de notificacoes...")
    
    tipos = [
        ("Lembrete de Evento", "lembrete_evento", "Lembretes automáticos de eventos"),
        ("Multa Vencida", "multa_vencida", "Notificação de multa vencida"),
        ("Processo Finalizado", "processo_finalizado", "Notificação de processo finalizado"),
        ("Prazo Vencendo", "prazo_vencendo", "Alerta de prazo próximo ao vencimento"),
    ]
    
    for nome, codigo, desc in tipos:
        TipoNotificacao.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nome': nome,
                'descricao': desc,
                'enviar_email': True,
                'dias_antecedencia': 3,
            }
        )


def criar_dados_relatorios():
    """Cria dados de teste para relatórios"""
    print("Criando dados de relatorios...")
    
    # Categorias
    categorias = [
        ("Geral", "fa-chart-bar"),
        ("Fiscalização", "fa-search"),
        ("Financeiro", "fa-dollar-sign"),
        ("Empresas", "fa-building"),
    ]
    
    for i, (nome, icone) in enumerate(categorias):
        CategoriaRelatorio.objects.get_or_create(
            nome=nome,
            defaults={'icone': icone, 'ordem': i}
        )
    
    # KPIs
    kpis = [
        {
            'nome': 'Total de Empresas',
            'categoria': 'Geral',
            'modelo_base': 'empresas.Empresa',
            'tipo_calculo': 'count',
            'formato': 'numero',
            'icone': 'fa-building',
        },
        {
            'nome': 'Processos do Mês',
            'categoria': 'Fiscalização', 
            'modelo_base': 'fiscalizacao.AutoInfracao',
            'tipo_calculo': 'count',
            'formato': 'numero',
            'icone': 'fa-file-alt',
        },
        {
            'nome': 'Arrecadação Total',
            'categoria': 'Financeiro',
            'modelo_base': 'multas.Multa',
            'tipo_calculo': 'sum',
            'campo_calculo': 'valor',
            'formato': 'moeda',
            'icone': 'fa-money-bill',
        }
    ]
    
    for dados in kpis:
        categoria = CategoriaRelatorio.objects.get(nome=dados['categoria'])
        IndicadorKPI.objects.get_or_create(
            nome=dados['nome'],
            defaults={
                'categoria': categoria,
                'modelo_base': dados['modelo_base'],
                'tipo_calculo': dados['tipo_calculo'],
                'campo_calculo': dados.get('campo_calculo', ''),
                'formato': dados['formato'],
                'icone': dados['icone'],
                'cor_primaria': '#007bff',
            }
        )


def criar_dados_agenda():
    """Cria dados de teste para agenda"""
    print("Criando dados de agenda...")
    
    # Fiscais
    fiscais = [
        ("João Silva", "12345"),
        ("Maria Santos", "12346"),
        ("Pedro Costa", "12347"),
    ]
    
    for nome, matricula in fiscais:
        Fiscal.objects.get_or_create(
            matricula=matricula,
            defaults={
                'nome': nome,
                'email': f"{nome.lower().replace(' ', '.')}@procon.am.gov.br",
                'telefone': "(92) 99999-9999",
            }
        )
    
    # Tipos de evento
    tipos = [
        ("Fiscalização", "#dc3545", "fa-search", 240),
        ("Reunião", "#007bff", "fa-users", 60),
        ("Audiência", "#28a745", "fa-gavel", 120),
        ("Treinamento", "#ffc107", "fa-graduation-cap", 480),
    ]
    
    for nome, cor, icone, duracao in tipos:
        TipoEvento.objects.get_or_create(
            nome=nome,
            defaults={
                'cor': cor,
                'icone': icone,
                'duracao_padrao': duracao,
            }
        )


def criar_dados_produtos():
    """Cria dados de teste para produtos"""
    print("Criando dados de produtos...")
    
    # Categorias
    categorias = [
        ("Alimentação", "ALIM", True, True),
        ("Medicamentos", "MED", True, False),
        ("Combustíveis", "COMB", False, False),
        ("Produtos de Limpeza", "LIMP", False, True),
    ]
    
    for nome, codigo, validade, inutilizacao in categorias:
        CategoriaProduto.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nome': nome,
                'prazo_validade_obrigatorio': validade,
                'permite_inutilizacao': inutilizacao,
            }
        )
    
    # Fabricantes
    fabricantes = [
        ("Nestlé Brasil LTDA", "00.123.456/0001-78"),
        ("Unilever Brasil LTDA", "11.234.567/0001-89"),
        ("Coca-Cola Brasil LTDA", "22.345.678/0001-90"),
    ]
    
    for nome, cnpj in fabricantes:
        Fabricante.objects.get_or_create(
            cnpj=cnpj,
            defaults={'nome': nome, 'pais_origem': 'Brasil'}
        )
    
    # Produtos
    produtos = [
        {
            'nome': 'Leite Condensado',
            'codigo': 'LC001',
            'categoria': 'ALIM',
            'fabricante': '00.123.456/0001-78',
            'tem_validade': True,
            'preco_referencia': Decimal('4.50'),
        },
        {
            'nome': 'Sabão em Pó',
            'codigo': 'SP001',
            'categoria': 'LIMP',
            'fabricante': '11.234.567/0001-89',
            'tem_validade': False,
            'preco_referencia': Decimal('12.90'),
        }
    ]
    
    for dados in produtos:
        categoria = CategoriaProduto.objects.get(codigo=dados['categoria'])
        fabricante = Fabricante.objects.get(cnpj=dados['fabricante'])
        
        Produto.objects.get_or_create(
            codigo_interno=dados['codigo'],
            defaults={
                'nome': dados['nome'],
                'categoria': categoria,
                'fabricante': fabricante,
                'tem_validade': dados['tem_validade'],
                'preco_referencia': dados['preco_referencia'],
                'criado_por': 'sistema',
            }
        )


def criar_dados_recursos():
    """Cria dados de teste para recursos"""
    print("Criando dados de recursos...")
    
    tipos = [
        ("Impugnação", "IMP", 15),
        ("Recurso Hierárquico", "RH", 30),
        ("Recurso Especial", "RE", 45),
    ]
    
    for nome, codigo, prazo in tipos:
        TipoRecurso.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nome': nome,
                'prazo_dias': prazo,
            }
        )


def criar_dados_auditoria():
    """Cria dados de teste para auditoria"""
    print("Criando dados de auditoria...")
    
    tipos = [
        ("Login", "login", "Eventos de login de usuários", "usuario", "baixo"),
        ("Criação", "create", "Criação de registros", "sistema", "medio"),
        ("Alteração", "update", "Alteração de registros", "sistema", "medio"),
        ("Exclusão", "delete", "Exclusão de registros", "sistema", "alto"),
        ("Erro", "error", "Erros do sistema", "sistema", "critico"),
    ]
    
    for nome, codigo, desc, categoria, criticidade in tipos:
        TipoEventoAuditoria.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nome': nome,
                'descricao': desc,
                'categoria': categoria,
                'nivel_criticidade': criticidade,
            }
        )


def main():
    """Executa a criação de todos os dados de teste"""
    print("Iniciando criacao de dados de teste para novos modulos...")
    
    try:
        criar_dados_empresas()
        criar_dados_notificacoes()
        criar_dados_relatorios()
        criar_dados_agenda()
        criar_dados_produtos()
        criar_dados_recursos()
        criar_dados_auditoria()
        
        print("\nDados de teste criados com sucesso!")
        print("\nResumo:")
        print(f"   - Empresas: {Empresa.objects.count()}")
        print(f"   - Tipos de Notificação: {TipoNotificacao.objects.count()}")
        print(f"   - KPIs: {IndicadorKPI.objects.count()}")
        print(f"   - Fiscais: {Fiscal.objects.count()}")
        print(f"   - Produtos: {Produto.objects.count()}")
        print(f"   - Tipos de Recurso: {TipoRecurso.objects.count()}")
        print(f"   - Tipos de Evento Auditoria: {TipoEventoAuditoria.objects.count()}")
        
    except Exception as e:
        print(f"Erro ao criar dados de teste: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
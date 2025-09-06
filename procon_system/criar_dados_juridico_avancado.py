#!/usr/bin/env python3
"""
Script para criar dados de teste para o módulo jurídico avançado
Inclui recursos administrativos, pareceres, workflows, etc.
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
from django.utils import timezone
from juridico.models import (
    AnalistaJuridico, ProcessoJuridico, RecursoAdministrativo, ParecerJuridico,
    DocumentoRecurso, WorkflowJuridico, HistoricoRecurso
)
from fiscalizacao.models import AutoInfracao
from multas.models import Multa


def criar_analistas_juridicos():
    """Cria analistas jurídicos se não existirem"""
    print("👨‍💼 CRIANDO ANALISTAS JURÍDICOS")
    print("=" * 50)
    
    analistas_data = [
        {
            'username': 'dr.silva',
            'first_name': 'João',
            'last_name': 'Silva',
            'email': 'joao.silva@procon.am.gov.br',
            'oab': '12345/AM',
            'especialidade': 'Direito do Consumidor'
        },
        {
            'username': 'dra.santos',
            'first_name': 'Maria',
            'last_name': 'Santos',
            'email': 'maria.santos@procon.am.gov.br',
            'oab': '23456/AM',
            'especialidade': 'Direito Administrativo'
        },
        {
            'username': 'dr.oliveira',
            'first_name': 'Carlos',
            'last_name': 'Oliveira',
            'email': 'carlos.oliveira@procon.am.gov.br',
            'oab': '34567/AM',
            'especialidade': 'Direito Civil'
        },
        {
            'username': 'dra.costa',
            'first_name': 'Ana',
            'last_name': 'Costa',
            'email': 'ana.costa@procon.am.gov.br',
            'oab': '45678/AM',
            'especialidade': 'Direito Tributário'
        }
    ]
    
    analistas_criados = []
    
    for dados in analistas_data:
        user, created = User.objects.get_or_create(
            username=dados['username'],
            defaults={
                'first_name': dados['first_name'],
                'last_name': dados['last_name'],
                'email': dados['email'],
                'is_staff': True,
                'is_active': True
            }
        )
        
        if created:
            user.set_password('123456')
            user.save()
            print(f"✅ Usuário criado: {user.get_full_name()}")
        else:
            print(f"ℹ️ Usuário já existe: {user.get_full_name()}")
        
        analista, created = AnalistaJuridico.objects.get_or_create(
            user=user,
            defaults={
                'oab': dados['oab'],
                'especialidade': dados['especialidade'],
                'ativo': True
            }
        )
        
        if created:
            print(f"✅ Analista jurídico criado: {analista}")
        else:
            print(f"ℹ️ Analista já existe: {analista}")
        
        analistas_criados.append(analista)
    
    return analistas_criados


def criar_processos_juridicos(analistas):
    """Cria processos jurídicos se não existirem"""
    print("\n📋 CRIANDO PROCESSOS JURÍDICOS")
    print("=" * 50)
    
    processos_data = [
        {
            'numero_peticao': 'PET-2024-001',
            'parte': 'João da Silva',
            'empresa_cnpj': '12.345.678/0001-90',
            'assunto': 'Reclamação contra cobrança indevida',
            'descricao': 'Cliente reclama de cobrança de taxa não autorizada',
            'valor_causa': Decimal('1500.00'),
            'status': 'EM_ANALISE',
            'prioridade': 'ALTA'
        },
        {
            'numero_peticao': 'PET-2024-002',
            'parte': 'Maria Santos',
            'empresa_cnpj': '98.765.432/0001-10',
            'assunto': 'Problemas com produto defeituoso',
            'descricao': 'Produto apresentou defeito após 30 dias de uso',
            'valor_causa': Decimal('2500.00'),
            'status': 'ABERTO',
            'prioridade': 'MEDIA'
        },
        {
            'numero_peticao': 'PET-2024-003',
            'parte': 'Carlos Oliveira',
            'empresa_cnpj': '11.222.333/0001-44',
            'assunto': 'Cobrança de juros abusivos',
            'descricao': 'Empresa cobrou juros acima do permitido',
            'valor_causa': Decimal('3000.00'),
            'status': 'RESPONDIDO',
            'prioridade': 'URGENTE'
        },
        {
            'numero_peticao': 'PET-2024-004',
            'parte': 'Ana Costa',
            'empresa_cnpj': '55.666.777/0001-88',
            'assunto': 'Problemas com contrato de prestação de serviços',
            'descricao': 'Serviço não foi executado conforme contratado',
            'valor_causa': Decimal('5000.00'),
            'status': 'AGUARDANDO_DOCUMENTO',
            'prioridade': 'BAIXA'
        },
        {
            'numero_peticao': 'PET-2024-005',
            'parte': 'Pedro Lima',
            'empresa_cnpj': '99.888.777/0001-66',
            'assunto': 'Publicidade enganosa',
            'descricao': 'Produto não corresponde ao anunciado',
            'valor_causa': Decimal('1800.00'),
            'status': 'EM_ANALISE',
            'prioridade': 'MEDIA'
        }
    ]
    
    processos_criados = []
    
    for dados in processos_data:
        processo, created = ProcessoJuridico.objects.get_or_create(
            numero_peticao=dados['numero_peticao'],
            defaults={
                'parte': dados['parte'],
                'empresa_cnpj': dados['empresa_cnpj'],
                'assunto': dados['assunto'],
                'descricao': dados['descricao'],
                'valor_causa': dados['valor_causa'],
                'status': dados['status'],
                'prioridade': dados['prioridade'],
                'analista': random.choice(analistas),
                'data_limite': timezone.now() + timedelta(days=random.randint(5, 30)),
                'criado_por': User.objects.first()
            }
        )
        
        if created:
            print(f"✅ Processo criado: {processo.numero}")
        else:
            print(f"ℹ️ Processo já existe: {processo.numero}")
        
        processos_criados.append(processo)
    
    return processos_criados


def criar_recursos_administrativos(processos, analistas):
    """Cria recursos administrativos"""
    print("\n📄 CRIANDO RECURSOS ADMINISTRATIVOS")
    print("=" * 50)
    
    recursos_data = [
        {
            'tipo_recurso': 'MULTA',
            'nome_recorrente': 'Empresa ABC Ltda',
            'cpf_cnpj_recorrente': '12.345.678/0001-90',
            'email_recorrente': 'contato@empresaabc.com.br',
            'telefone_recorrente': '(92) 99999-9999',
            'fundamentacao': 'A multa aplicada não possui fundamentação legal adequada',
            'pedido': 'Solicita a anulação da multa aplicada',
            'valor_questionado': Decimal('5000.00'),
            'status': 'EM_ANALISE'
        },
        {
            'tipo_recurso': 'AUTO_INFRACAO',
            'nome_recorrente': 'Comércio XYZ Ltda',
            'cpf_cnpj_recorrente': '98.765.432/0001-10',
            'email_recorrente': 'juridico@comercioxyz.com.br',
            'telefone_recorrente': '(92) 88888-8888',
            'fundamentacao': 'O auto de infração foi lavrado sem a devida notificação',
            'pedido': 'Solicita a anulação do auto de infração',
            'valor_questionado': Decimal('3000.00'),
            'status': 'PROTOCOLADO'
        },
        {
            'tipo_recurso': 'DECISAO',
            'nome_recorrente': 'Indústria DEF Ltda',
            'cpf_cnpj_recorrente': '11.222.333/0001-44',
            'email_recorrente': 'administrativo@industriadef.com.br',
            'telefone_recorrente': '(92) 77777-7777',
            'fundamentacao': 'A decisão não considerou os documentos apresentados',
            'pedido': 'Solicita a reforma da decisão',
            'valor_questionado': Decimal('7500.00'),
            'status': 'PARECER_ELABORADO'
        },
        {
            'tipo_recurso': 'INDEFERIMENTO',
            'nome_recorrente': 'Serviços GHI Ltda',
            'cpf_cnpj_recorrente': '55.666.777/0001-88',
            'email_recorrente': 'contato@servicosghi.com.br',
            'telefone_recorrente': '(92) 66666-6666',
            'fundamentacao': 'O indeferimento não possui fundamentação legal',
            'pedido': 'Solicita o deferimento da petição',
            'valor_questionado': Decimal('2000.00'),
            'status': 'AGUARDANDO_DOCUMENTO'
        },
        {
            'tipo_recurso': 'MULTA',
            'nome_recorrente': 'Comércio JKL Ltda',
            'cpf_cnpj_recorrente': '99.888.777/0001-66',
            'email_recorrente': 'juridico@comerciojkl.com.br',
            'telefone_recorrente': '(92) 55555-5555',
            'fundamentacao': 'A multa foi aplicada em valor superior ao permitido',
            'pedido': 'Solicita a redução do valor da multa',
            'valor_questionado': Decimal('4000.00'),
            'status': 'DEFERIDO'
        }
    ]
    
    recursos_criados = []
    
    for i, dados in enumerate(recursos_data):
        # Associar a um processo se disponível
        processo_origem = processos[i] if i < len(processos) else None
        
        recurso, created = RecursoAdministrativo.objects.get_or_create(
            numero=f"REC-{i+1:06d}/2024",
            defaults={
                'tipo_recurso': dados['tipo_recurso'],
                'processo_origem': processo_origem,
                'nome_recorrente': dados['nome_recorrente'],
                'cpf_cnpj_recorrente': dados['cpf_cnpj_recorrente'],
                'email_recorrente': dados['email_recorrente'],
                'telefone_recorrente': dados['telefone_recorrente'],
                'fundamentacao': dados['fundamentacao'],
                'pedido': dados['pedido'],
                'valor_questionado': dados['valor_questionado'],
                'status': dados['status'],
                'analista_responsavel': random.choice(analistas),
                'data_limite_analise': timezone.now() + timedelta(days=random.randint(10, 45)),
                'criado_por': User.objects.first()
            }
        )
        
        if created:
            print(f"✅ Recurso criado: {recurso.numero}")
        else:
            print(f"ℹ️ Recurso já existe: {recurso.numero}")
        
        recursos_criados.append(recurso)
    
    return recursos_criados


def criar_pareceres_juridicos(recursos, analistas):
    """Cria pareceres jurídicos"""
    print("\n📝 CRIANDO PARECERES JURÍDICOS")
    print("=" * 50)
    
    pareceres_data = [
        {
            'tipo_parecer': 'TECNICO',
            'fundamentacao_juridica': 'Com base no art. 55 do CDC, a multa aplicada não possui fundamentação legal adequada',
            'analise_fatos': 'Os fatos narrados demonstram que houve erro na aplicação da multa',
            'conclusao': 'O recurso deve ser deferido para anular a multa aplicada',
            'recomendacao': 'DEFERIR',
            'observacoes': 'Recomenda-se maior atenção na fundamentação de multas futuras'
        },
        {
            'tipo_parecer': 'FINAL',
            'fundamentacao_juridica': 'O auto de infração foi lavrado em conformidade com a legislação',
            'analise_fatos': 'A notificação foi realizada adequadamente',
            'conclusao': 'O recurso deve ser indeferido',
            'recomendacao': 'INDEFERIR',
            'observacoes': 'Manter o auto de infração como lavrado'
        },
        {
            'tipo_parecer': 'INICIAL',
            'fundamentacao_juridica': 'Necessário analisar documentos complementares',
            'analise_fatos': 'Fatos ainda não completamente esclarecidos',
            'conclusao': 'Solicitar mais informações',
            'recomendacao': 'SOLICITAR_MAIS_INFORMACOES',
            'observacoes': 'Aguardar apresentação de documentos'
        },
        {
            'tipo_parecer': 'COMPLEMENTAR',
            'fundamentacao_juridica': 'Com base nos novos documentos, a decisão deve ser reformada',
            'analise_fatos': 'Documentos apresentados demonstram erro na decisão',
            'conclusao': 'Recomenda-se reformar a decisão',
            'recomendacao': 'DEFERIR',
            'observacoes': 'Considerar os novos elementos probatórios'
        },
        {
            'tipo_parecer': 'FINAL',
            'fundamentacao_juridica': 'A multa foi aplicada corretamente',
            'analise_fatos': 'Valor da multa está dentro dos parâmetros legais',
            'conclusao': 'Manter a multa como aplicada',
            'recomendacao': 'INDEFERIR',
            'observacoes': 'Não há motivos para redução do valor'
        }
    ]
    
    pareceres_criados = []
    
    for i, dados in enumerate(pareceres_data):
        if i < len(recursos):
            parecer, created = ParecerJuridico.objects.get_or_create(
                recurso=recursos[i],
                tipo_parecer=dados['tipo_parecer'],
                defaults={
                    'analista': random.choice(analistas),
                    'fundamentacao_juridica': dados['fundamentacao_juridica'],
                    'analise_fatos': dados['analise_fatos'],
                    'conclusao': dados['conclusao'],
                    'recomendacao': dados['recomendacao'],
                    'observacoes': dados['observacoes'],
                    'assinado': random.choice([True, False])
                }
            )
            
            if created:
                print(f"✅ Parecer criado: {parecer.tipo_parecer} - {parecer.recurso.numero}")
            else:
                print(f"ℹ️ Parecer já existe: {parecer.tipo_parecer} - {parecer.recurso.numero}")
            
            pareceres_criados.append(parecer)
    
    return pareceres_criados


def criar_workflows_juridicos(recursos, pareceres, analistas):
    """Cria workflows jurídicos"""
    print("\n🔄 CRIANDO WORKFLOWS JURÍDICOS")
    print("=" * 50)
    
    workflows_data = [
        {
            'tipo_workflow': 'ANALISE_JURIDICA',
            'status': 'EM_ANALISE',
            'observacoes': 'Análise jurídica em andamento'
        },
        {
            'tipo_workflow': 'APROVACAO_PARECER',
            'status': 'PENDENTE',
            'observacoes': 'Aguardando aprovação do parecer'
        },
        {
            'tipo_workflow': 'DECISAO_RECURSO',
            'status': 'APROVADO',
            'observacoes': 'Decisão aprovada'
        },
        {
            'tipo_workflow': 'ASSINATURA_DOCUMENTO',
            'status': 'PENDENTE',
            'observacoes': 'Aguardando assinatura'
        },
        {
            'tipo_workflow': 'ANALISE_JURIDICA',
            'status': 'REPROVADO',
            'observacoes': 'Análise reprovada - necessita revisão'
        }
    ]
    
    workflows_criados = []
    
    for i, dados in enumerate(workflows_data):
        if i < len(recursos):
            workflow, created = WorkflowJuridico.objects.get_or_create(
                recurso=recursos[i],
                tipo_workflow=dados['tipo_workflow'],
                defaults={
                    'status': dados['status'],
                    'responsavel_atual': random.choice(analistas),
                    'observacoes': dados['observacoes'],
                    'data_conclusao': timezone.now() if dados['status'] in ['APROVADO', 'REPROVADO'] else None
                }
            )
            
            if created:
                print(f"✅ Workflow criado: {workflow.tipo_workflow} - {workflow.status}")
            else:
                print(f"ℹ️ Workflow já existe: {workflow.tipo_workflow} - {workflow.status}")
            
            workflows_criados.append(workflow)
    
    return workflows_criados


def criar_historico_recursos(recursos):
    """Cria histórico de recursos"""
    print("\n📚 CRIANDO HISTÓRICO DE RECURSOS")
    print("=" * 50)
    
    acoes = [
        'Recurso protocolado',
        'Análise iniciada',
        'Documentos solicitados',
        'Parecer elaborado',
        'Decisão proferida',
        'Status alterado',
        'Prazo prorrogado'
    ]
    
    historicos_criados = []
    
    for recurso in recursos:
        # Criar 2-4 entradas de histórico por recurso
        for i in range(random.randint(2, 4)):
            historico, created = HistoricoRecurso.objects.get_or_create(
                recurso=recurso,
                acao=random.choice(acoes),
                data_alteracao=timezone.now() - timedelta(days=random.randint(1, 30)),
                defaults={
                    'usuario': User.objects.first(),
                    'descricao': f'Histórico automático gerado para {recurso.numero}',
                    'dados_anteriores': {'status': 'ANTERIOR'},
                    'dados_novos': {'status': 'NOVO'}
                }
            )
            
            if created:
                print(f"✅ Histórico criado: {historico.acao} - {recurso.numero}")
            else:
                print(f"ℹ️ Histórico já existe: {historico.acao} - {recurso.numero}")
            
            historicos_criados.append(historico)
    
    return historicos_criados


def main():
    """Função principal"""
    print("🚀 CRIANDO DADOS DE TESTE - MÓDULO JURÍDICO AVANÇADO")
    print("=" * 60)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    try:
        # Criar analistas jurídicos
        analistas = criar_analistas_juridicos()
        
        # Criar processos jurídicos
        processos = criar_processos_juridicos(analistas)
        
        # Criar recursos administrativos
        recursos = criar_recursos_administrativos(processos, analistas)
        
        # Criar pareceres jurídicos
        pareceres = criar_pareceres_juridicos(recursos, analistas)
        
        # Criar workflows jurídicos
        workflows = criar_workflows_juridicos(recursos, pareceres, analistas)
        
        # Criar histórico de recursos
        historicos = criar_historico_recursos(recursos)
        
        print("\n" + "=" * 60)
        print("✅ DADOS CRIADOS COM SUCESSO!")
        print("=" * 60)
        print(f"📊 Resumo:")
        print(f"   • Analistas jurídicos: {len(analistas)}")
        print(f"   • Processos jurídicos: {len(processos)}")
        print(f"   • Recursos administrativos: {len(recursos)}")
        print(f"   • Pareceres jurídicos: {len(pareceres)}")
        print(f"   • Workflows jurídicos: {len(workflows)}")
        print(f"   • Históricos de recursos: {len(historicos)}")
        print("\n🎯 Módulo jurídico avançado implementado com sucesso!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

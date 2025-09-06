#!/usr/bin/env python
"""
Script para criar processos jurídicos de teste
"""
import os
import django
from datetime import datetime, timedelta
import random

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

def criar_processos_teste():
    """Cria processos jurídicos de teste"""
    print("📄 CRIANDO PROCESSOS JURÍDICOS DE TESTE")
    print("=" * 50)
    
    from django.contrib.auth.models import User
    from juridico.models import AnalistaJuridico, ProcessoJuridico, AnaliseJuridica, RespostaJuridica, PrazoJuridico
    
    # Obter analistas
    analistas = list(AnalistaJuridico.objects.filter(ativo=True))
    if not analistas:
        print("❌ Nenhum analista encontrado. Execute primeiro o script criar_analistas_juridicos.py")
        return
    
    # Obter usuários
    users = list(User.objects.filter(is_staff=True))
    if not users:
        print("❌ Nenhum usuário encontrado")
        return
    
    # Dados de processos de teste
    processos_data = [
        {
            'parte': 'Supermercado Central LTDA',
            'empresa_cnpj': '12.345.678/0001-90',
            'assunto': 'Venda de produtos vencidos',
            'descricao': 'Denúncia de venda de produtos com prazo de validade vencido em estabelecimento comercial.',
            'status': 'EM_ANALISE',
            'prioridade': 'ALTA',
            'valor_causa': 15000.00
        },
        {
            'parte': 'Posto de Combustível Expresso',
            'empresa_cnpj': '23.456.789/0001-01',
            'assunto': 'Cobrança indevida de combustível',
            'descricao': 'Reclamação sobre cobrança de valores superiores ao abastecido no posto.',
            'status': 'ABERTO',
            'prioridade': 'URGENTE',
            'valor_causa': 2500.00
        },
        {
            'parte': 'Banco Popular do Brasil',
            'empresa_cnpj': '34.567.890/0001-12',
            'assunto': 'Cobrança de tarifas bancárias indevidas',
            'descricao': 'Processo contra cobrança de tarifas bancárias não autorizadas pelo cliente.',
            'status': 'RESPONDIDO',
            'prioridade': 'MEDIA',
            'valor_causa': 5000.00
        },
        {
            'parte': 'Loja de Eletrodomésticos Mega',
            'empresa_cnpj': '45.678.901/0001-23',
            'assunto': 'Produto com defeito de fabricação',
            'descricao': 'Reclamação sobre produto com defeito de fabricação e recusa de troca.',
            'status': 'AGUARDANDO_DOCUMENTO',
            'prioridade': 'BAIXA',
            'valor_causa': 800.00
        },
        {
            'parte': 'Operadora de Telefonia Celular',
            'empresa_cnpj': '56.789.012/0001-34',
            'assunto': 'Cobrança de serviços não contratados',
            'descricao': 'Processo contra cobrança de serviços de telefonia não autorizados.',
            'status': 'ABERTO',
            'prioridade': 'ALTA',
            'valor_causa': 1200.00
        },
        {
            'parte': 'Construtora Horizonte',
            'empresa_cnpj': '67.890.123/0001-45',
            'assunto': 'Atraso na entrega de obra',
            'descricao': 'Reclamação sobre atraso na entrega de obra contratada.',
            'status': 'EM_ANALISE',
            'prioridade': 'URGENTE',
            'valor_causa': 50000.00
        },
        {
            'parte': 'Clínica Médica Saúde Total',
            'empresa_cnpj': '78.901.234/0001-56',
            'assunto': 'Cobrança de procedimentos não realizados',
            'descricao': 'Processo contra cobrança de procedimentos médicos não realizados.',
            'status': 'ABERTO',
            'prioridade': 'MEDIA',
            'valor_causa': 3000.00
        },
        {
            'parte': 'Escola Particular Futuro',
            'empresa_cnpj': '89.012.345/0001-67',
            'assunto': 'Cobrança de mensalidade durante pandemia',
            'descricao': 'Reclamação sobre cobrança de mensalidade escolar durante período de suspensão das aulas.',
            'status': 'RESPONDIDO',
            'prioridade': 'BAIXA',
            'valor_causa': 1800.00
        }
    ]
    
    processos_criados = []
    
    for i, data in enumerate(processos_data, 1):
        try:
            # Gerar número do processo
            numero = f"PROC-{i:06d}/2024"
            
            # Selecionar analista aleatório
            analista = random.choice(analistas)
            criado_por = random.choice(users)
            
            # Gerar data limite aleatória
            dias_aleatorios = random.randint(5, 60)
            data_limite = datetime.now() + timedelta(days=dias_aleatorios)
            
            # Criar processo
            processo, created = ProcessoJuridico.objects.get_or_create(
                numero=numero,
                defaults={
                    'parte': data['parte'],
                    'empresa_cnpj': data['empresa_cnpj'],
                    'assunto': data['assunto'],
                    'descricao': data['descricao'],
                    'status': data['status'],
                    'prioridade': data['prioridade'],
                    'valor_causa': data['valor_causa'],
                    'data_limite': data_limite,
                    'analista': analista,
                    'criado_por': criado_por
                }
            )
            
            if created:
                print(f"✅ Processo criado: {processo.numero} - {processo.parte}")
                processos_criados.append(processo)
                
                # Criar análise jurídica
                if processo.status in ['EM_ANALISE', 'RESPONDIDO']:
                    analise = AnaliseJuridica.objects.create(
                        processo=processo,
                        analista=analista,
                        tipo_analise='INICIAL',
                        fundamentacao=f'Fundamentação jurídica para o processo {processo.numero}.',
                        conclusao=f'Conclusão da análise inicial do processo {processo.numero}.',
                        recomendacoes=f'Recomendações para prosseguimento do processo {processo.numero}.'
                    )
                    print(f"   📋 Análise criada: {analise.tipo_analise}")
                
                # Criar resposta jurídica
                if processo.status == 'RESPONDIDO':
                    resposta = RespostaJuridica.objects.create(
                        processo=processo,
                        analista=analista,
                        tipo_resposta='DEFESA',
                        titulo=f'Defesa Preliminar - {processo.numero}',
                        conteudo=f'Conteúdo da defesa preliminar para o processo {processo.numero}.',
                        fundamentacao_legal='Fundamentação legal baseada no Código de Defesa do Consumidor.',
                        enviado=True
                    )
                    print(f"   📝 Resposta criada: {resposta.tipo_resposta}")
                
                # Criar prazo jurídico
                prazo = PrazoJuridico.objects.create(
                    processo=processo,
                    tipo_prazo='RESPOSTA',
                    descricao=f'Prazo para apresentação de resposta - {processo.numero}',
                    data_inicio=datetime.now(),
                    data_fim=data_limite,
                    status='PENDENTE',
                    responsavel=analista
                )
                print(f"   ⏰ Prazo criado: {prazo.tipo_prazo}")
                
            else:
                print(f"✅ Processo encontrado: {processo.numero} - {processo.parte}")
                processos_criados.append(processo)
                
        except Exception as e:
            print(f"❌ Erro ao criar processo {i}: {e}")
    
    print(f"\n📊 RESUMO: {len(processos_criados)} processos jurídicos criados")
    print(f"📋 Análises criadas: {AnaliseJuridica.objects.count()}")
    print(f"📝 Respostas criadas: {RespostaJuridica.objects.count()}")
    print(f"⏰ Prazos criados: {PrazoJuridico.objects.count()}")
    
    return processos_criados

if __name__ == '__main__':
    criar_processos_teste()

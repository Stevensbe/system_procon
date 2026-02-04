#!/usr/bin/env python3
"""
Script para criar dados de teste realistas para o módulo de Cobrança
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from cobranca.models import (
    BoletoMulta, PagamentoMulta, CobrancaMulta, 
    ConfiguracaoCobranca, TemplateCobranca, LogCobranca
)
from multas.models import Multa  # Assumindo que existe um app multas

class DadosTesteCobranca:
    def __init__(self):
        self.empresas = [
            "Empresa ABC Ltda",
            "Comércio XYZ S.A.",
            "Indústria 123 Ltda",
            "Serviços Delta Eireli",
            "Comércio Eletrônico Beta",
            "Transportes Gamma Ltda",
            "Construções Omega S.A.",
            "Alimentos Sigma Ltda",
            "Tecnologia Lambda Eireli",
            "Consultoria Theta Ltda"
        ]
        
        self.pessoas = [
            "João Silva Santos",
            "Maria Oliveira Costa",
            "Pedro Almeida Lima",
            "Ana Paula Ferreira",
            "Carlos Eduardo Rodrigues",
            "Fernanda Souza Martins",
            "Roberto Nascimento Silva",
            "Juliana Pereira Alves",
            "Marcos Antonio Costa",
            "Lucia Helena Santos"
        ]
        
        self.enderecos = [
            "Rua das Flores, 123 - Centro",
            "Av. Principal, 456 - Jardim América",
            "Rua do Comércio, 789 - Vila Nova",
            "Travessa das Palmeiras, 321 - Bairro Alto",
            "Alameda dos Ipês, 654 - Jardim Europa",
            "Rua das Acácias, 987 - Vila Progresso",
            "Av. das Indústrias, 147 - Distrito Industrial",
            "Rua dos Cravos, 258 - Jardim Primavera",
            "Travessa das Margaridas, 369 - Centro",
            "Alameda das Rosas, 741 - Jardim das Flores"
        ]
        
        self.emails = [
            "contato@empresaabc.com.br",
            "financeiro@xyz.com.br",
            "admin@industria123.com.br",
            "cobranca@delta.com.br",
            "pagamentos@beta.com.br",
            "financeiro@gamma.com.br",
            "contato@omega.com.br",
            "admin@sigma.com.br",
            "cobranca@lambda.com.br",
            "financeiro@theta.com.br"
        ]
        
        self.telefones = [
            "(92) 99999-9999",
            "(92) 88888-8888",
            "(92) 77777-7777",
            "(92) 66666-6666",
            "(92) 55555-5555",
            "(92) 44444-4444",
            "(92) 33333-3333",
            "(92) 22222-2222",
            "(92) 11111-1111",
            "(92) 00000-0000"
        ]
        
        self.documentos_cnpj = [
            "12.345.678/0001-90",
            "23.456.789/0001-01",
            "34.567.890/0001-12",
            "45.678.901/0001-23",
            "56.789.012/0001-34",
            "67.890.123/0001-45",
            "78.901.234/0001-56",
            "89.012.345/0001-67",
            "90.123.456/0001-78",
            "01.234.567/0001-89"
        ]
        
        self.documentos_cpf = [
            "123.456.789-00",
            "234.567.890-11",
            "345.678.901-22",
            "456.789.012-33",
            "567.890.123-44",
            "678.901.234-55",
            "789.012.345-66",
            "890.123.456-77",
            "901.234.567-88",
            "012.345.678-99"
        ]
        
        self.bancos = [
            ("001", "Banco do Brasil"),
            ("104", "Caixa Econômica Federal"),
            ("033", "Santander"),
            ("341", "Itaú Unibanco"),
            ("237", "Bradesco"),
            ("756", "Sicoob"),
            ("748", "Sicredi"),
            ("422", "Safra"),
            ("655", "Banco Votorantim"),
            ("077", "Banco Inter")
        ]
        
        self.status_boletos = ['pendente', 'pago', 'vencido', 'cancelado']
        self.formas_pagamento = ['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia']
        self.status_cobrancas = ['pendente', 'processada', 'finalizada', 'cancelada']
    
    def criar_configuracoes(self):
        """Cria configurações de cobrança"""
        print("⚙️ Criando configurações de cobrança...")
        
        configs = [
            {
                'beneficiario_nome': 'PROCON - Configuração Padrão',
                'beneficiario_cnpj': '12.345.678/0001-90',
                'beneficiario_endereco': 'Rua das Flores, 123 - Centro - Manaus/AM',
                'taxa_juros_mensal': Decimal('1.00'),
                'taxa_multa_atraso': Decimal('2.00'),
                'prazo_vencimento_boleto': 30,
                'banco_codigo': '001',
                'banco_nome': 'Banco do Brasil',
                'agencia': '1234',
                'conta': '12345-6',
                'carteira': '17',
                'ativo': True
            },
            {
                'beneficiario_nome': 'PROCON - Configuração Especial',
                'beneficiario_cnpj': '98.765.432/0001-10',
                'beneficiario_endereco': 'Av. Principal, 456 - Jardim América - Manaus/AM',
                'taxa_juros_mensal': Decimal('0.50'),
                'taxa_multa_atraso': Decimal('1.50'),
                'prazo_vencimento_boleto': 15,
                'banco_codigo': '104',
                'banco_nome': 'Caixa Econômica Federal',
                'agencia': '5678',
                'conta': '56789-0',
                'carteira': '14',
                'ativo': False
            }
        ]
        
        for config_data in configs:
            ConfiguracaoCobranca.objects.get_or_create(
                beneficiario_nome=config_data['beneficiario_nome'],
                defaults=config_data
            )
        
        print(f"✅ {len(configs)} configurações criadas")
    
    def criar_templates(self):
        """Cria templates de cobrança"""
        print("📝 Criando templates de cobrança...")
        
        templates = [
            {
                'nome': 'Template E-mail Padrão',
                'tipo_cobranca': 'remessa',
                'canal': 'email',
                'assunto_template': 'Boleto Bancário - {{numero_boleto}}',
                'mensagem_template': 'Olá {{nome}},\n\nSeu boleto bancário está disponível:\n\nNúmero: {{numero_boleto}}\nValor: R$ {{valor}}\nVencimento: {{vencimento}}\n\nAcesse o link para pagar: {{link_pagamento}}\n\nAtenciosamente,\nPROCON',
                'ativo': True,
                'padrao': True
            },
            {
                'nome': 'Template SMS Padrão',
                'tipo_cobranca': 'remessa',
                'canal': 'sms',
                'assunto_template': 'Cobrança PROCON',
                'mensagem_template': 'PROCON: Boleto {{numero_boleto}} - R$ {{valor}} - Vence em {{vencimento}}. Acesse: {{link_pagamento}}',
                'ativo': True,
                'padrao': True
            },
            {
                'nome': 'Template WhatsApp Padrão',
                'tipo_cobranca': 'remessa',
                'canal': 'whatsapp',
                'assunto_template': 'Cobrança PROCON',
                'mensagem_template': 'Olá {{nome}}! Seu boleto {{numero_boleto}} no valor de R$ {{valor}} vence em {{vencimento}}. Clique aqui para pagar: {{link_pagamento}}',
                'ativo': True,
                'padrao': False
            }
        ]
        
        for template_data in templates:
            TemplateCobranca.objects.get_or_create(
                nome=template_data['nome'],
                defaults=template_data
            )
        
        print(f"✅ {len(templates)} templates criados")
    
    def criar_multas_fake(self):
        """Cria multas fake se não existirem"""
        print("🚨 Criando multas para teste...")
        
        # Primeiro, preciso criar empresas e autos de infração
        from multas.models import Empresa, AutoInfracao
        
        if Multa.objects.count() == 0:
            # Criar empresas primeiro
            empresas_criadas = []
            for i in range(10):
                is_empresa = random.choice([True, False])
                
                if is_empresa:
                    nome = self.empresas[i % len(self.empresas)]
                    # Criar CNPJ único
                    base_cnpj = self.documentos_cnpj[i % len(self.documentos_cnpj)]
                    documento = f"{base_cnpj[:-2]}{i+1:02d}"
                else:
                    nome = self.pessoas[i % len(self.pessoas)]
                    # Criar CPF único
                    base_cpf = self.documentos_cpf[i % len(self.documentos_cpf)]
                    documento = f"{base_cpf[:-2]}{i+1:02d}"
                
                empresa = Empresa.objects.get_or_create(
                    razao_social=f"{nome} {i+1}",
                    defaults={
                        'cnpj': documento,
                        'endereco': random.choice(self.enderecos),
                        'telefone': random.choice(self.telefones),
                        'ativo': True
                    }
                )[0]
                empresas_criadas.append(empresa)
            
            # Criar autos de infração
            autos_criados = []
            for i in range(20):
                empresa = random.choice(empresas_criadas)
                
                auto = AutoInfracao.objects.get_or_create(
                    numero=f"PROC{i+1:03d}/2024",
                    defaults={
                        'razao_social': empresa.razao_social,
                        'cnpj': empresa.cnpj,
                        'endereco': empresa.endereco,
                        'telefone': empresa.telefone,
                        'data_fiscalizacao': datetime.now() - timedelta(days=random.randint(30, 365)),
                        'hora_fiscalizacao': datetime.now().time(),
                        'valor_multa': Decimal(random.uniform(500, 5000)),
                        'responsavel_nome': 'Responsável Teste',
                        'responsavel_cpf': '123.456.789-00',
                        'fiscal_nome': 'Fiscal Teste',
                        'status': 'julgado',
                        'relatorio': f'Relatório de fiscalização {i+1}',
                        'base_legal_cdc': 'Art. 35 do CDC',
                        'fundamentacao_juridica': 'Fundamentação jurídica teste'
                    }
                )[0]
                autos_criados.append(auto)
            
            # Criar multas
            for i, auto in enumerate(autos_criados):
                # Buscar empresa correspondente
                empresa = Empresa.objects.filter(cnpj=auto.cnpj).first()
                if not empresa:
                    # Criar empresa se não existir
                    empresa = Empresa.objects.create(
                        razao_social=auto.razao_social,
                        cnpj=auto.cnpj,
                        endereco=auto.endereco,
                        telefone=auto.telefone,
                        ativo=True
                    )
                
                multa = Multa.objects.create(
                    processo=auto,
                    empresa=empresa,
                    valor=auto.valor_multa,
                    data_vencimento=(datetime.now() + timedelta(days=30)).date(),
                    status='pendente',
                    observacoes=f'Multa gerada automaticamente para teste {i+1}'
                )
            
            print(f"✅ {len(autos_criados)} multas criadas")
        else:
            print(f"✅ {Multa.objects.count()} multas já existem")
    
    def criar_boletos(self):
        """Cria boletos de teste"""
        print("💰 Criando boletos de teste...")
        
        multas = list(Multa.objects.all())
        if not multas:
            print("❌ Nenhuma multa encontrada. Criando multas primeiro...")
            self.criar_multas_fake()
            multas = list(Multa.objects.all())
        
        boletos_existentes = BoletoMulta.objects.count()
        boletos_criados = 0
        
        for i in range(50):
            multa = random.choice(multas)
            empresa = multa.empresa
            
            # Usar dados da empresa
            pagador_nome = empresa.razao_social
            pagador_documento = empresa.cnpj
            pagador_email = random.choice(self.emails)
            
            # Calcular valores
            valor_principal = multa.valor
            valor_juros = valor_principal * Decimal('0.01')  # 1% de juros
            valor_multa_atraso = valor_principal * Decimal('0.02')  # 2% de multa
            valor_total = valor_principal + valor_juros + valor_multa_atraso
            
            # Definir datas
            data_emissao = datetime.now() - timedelta(days=random.randint(1, 60))
            data_vencimento = data_emissao + timedelta(days=30)
            
            # Definir status baseado na data de vencimento
            if data_vencimento < datetime.now():
                status = random.choice(['vencido', 'pago', 'cancelado'])
            else:
                status = random.choice(['pendente', 'pago'])
            
            # Gerar código de barras fake
            codigo_barras = f"0019337370000000100050094014481606068093503{i:01d}"
            
            boleto = BoletoMulta.objects.create(
                multa=multa,
                numero_boleto=f"BOL{boletos_existentes + boletos_criados + 1:03d}/2024",
                pagador_nome=pagador_nome,
                pagador_documento=pagador_documento,
                pagador_endereco=random.choice(self.enderecos),
                pagador_email=pagador_email,
                pagador_telefone=random.choice(self.telefones),
                valor_principal=valor_principal,
                valor_juros=valor_juros,
                valor_multa=valor_multa_atraso,
                valor_total=valor_total,
                data_vencimento=data_vencimento,
                status=status,
                observacoes=f"Boleto gerado automaticamente para teste {i+1}"
            )
            
            boletos_criados += 1
            
            # Criar log de cobrança
            LogCobranca.objects.create(
                boleto=boleto,
                acao='boleto_gerado',
                descricao=f'Boleto {boleto.numero_boleto} criado automaticamente',
                usuario="Sistema"
            )
        
        print(f"✅ {boletos_criados} boletos criados")
        return boletos_criados
    
    def criar_pagamentos(self):
        """Cria pagamentos de teste"""
        print("💳 Criando pagamentos de teste...")
        
        boletos_pagos = list(BoletoMulta.objects.filter(status='pago'))
        if not boletos_pagos:
            # Criar alguns boletos pagos
            boletos = list(BoletoMulta.objects.all()[:20])
            for boleto in boletos:
                boleto.status = 'pago'
                boleto.save()
            boletos_pagos = boletos
        
        pagamentos_criados = 0
        
        for i, boleto in enumerate(boletos_pagos):
            forma_pagamento = random.choice(self.formas_pagamento)
            data_pagamento = boleto.data_vencimento + timedelta(days=random.randint(-10, 5))
            
            # Ajustar valor baseado na forma de pagamento
            if forma_pagamento == 'pix':
                valor_pago = boleto.valor_total
                desconto = Decimal('0.00')
            else:
                desconto = boleto.valor_total * Decimal('0.02')  # 2% de desconto
                valor_pago = boleto.valor_total - desconto
            
            pagamento = PagamentoMulta.objects.create(
                boleto=boleto,
                valor_pago=valor_pago,
                forma_pagamento=forma_pagamento,
                data_pagamento=data_pagamento,
                comprovante=f"comprovante_{i+1}.pdf",
                observacoes=f"Pagamento realizado via {forma_pagamento}",
                status='confirmado',
                criado_por="Sistema"
            )
            
            pagamentos_criados += 1
            
            # Atualizar status do boleto
            boleto.status = 'pago'
            boleto.save()
            
            # Criar log
            LogCobranca.objects.create(
                boleto=boleto,
                acao='pagamento_confirmado',
                descricao=f'Pagamento confirmado: R$ {valor_pago} via {forma_pagamento}',
                usuario="Sistema"
            )
        
        print(f"✅ {pagamentos_criados} pagamentos criados")
        return pagamentos_criados
    
    def criar_cobrancas(self):
        """Cria cobranças de teste"""
        print("📤 Criando cobranças de teste...")
        
        boletos_pendentes = list(BoletoMulta.objects.filter(status='pendente'))
        if not boletos_pendentes:
            print("⚠️ Nenhum boleto pendente encontrado")
            return 0
        
        cobrancas_criadas = 0
        
        for i in range(min(10, len(boletos_pendentes))):
            boleto = boletos_pendentes[i]
            
            # Criar cobrança
            cobranca = CobrancaMulta.objects.create(
                boleto=boleto,
                tipo_cobranca='primeira',
                canal='email',
                data_agendamento=datetime.now() - timedelta(days=random.randint(1, 30)),
                data_envio=datetime.now() - timedelta(days=random.randint(1, 15)),
                assunto=f'Cobrança - Boleto {boleto.numero_boleto}',
                mensagem=f'Olá {boleto.pagador_nome}, seu boleto {boleto.numero_boleto} está pendente.',
                status=random.choice(['enviada', 'entregue', 'falhada']),
                criado_por="Sistema"
            )
            
            cobrancas_criadas += 1
            
            # Criar log
            LogCobranca.objects.create(
                boleto=boleto,
                acao='cobranca_enviada',
                descricao=f'Cobrança {cobranca.tipo_cobranca} criada',
                usuario="Sistema"
            )
        
        print(f"✅ {cobrancas_criadas} cobranças criadas")
        return cobrancas_criadas
    
    def gerar_relatorio(self):
        """Gera relatório dos dados criados"""
        print("\n📊 Relatório dos Dados Criados")
        print("=" * 50)
        
        total_boletos = BoletoMulta.objects.count()
        total_pagamentos = PagamentoMulta.objects.count()
        total_cobrancas = CobrancaMulta.objects.count()
        total_configs = ConfiguracaoCobranca.objects.count()
        total_templates = TemplateCobranca.objects.count()
        total_logs = LogCobranca.objects.count()
        
        print(f"💰 Boletos: {total_boletos}")
        print(f"💳 Pagamentos: {total_pagamentos}")
        print(f"📤 Cobranças: {total_cobrancas}")
        print(f"⚙️ Configurações: {total_configs}")
        print(f"📝 Templates: {total_templates}")
        print(f"📋 Logs: {total_logs}")
        
        # Estatísticas por status
        print("\n📈 Estatísticas por Status:")
        for status in self.status_boletos:
            count = BoletoMulta.objects.filter(status=status).count()
            print(f"   {status.title()}: {count}")
        
        # Valor total
        valor_total_boletos = sum(b.valor_total for b in BoletoMulta.objects.all())
        valor_total_pagos = sum(p.valor_pago for p in PagamentoMulta.objects.all())
        
        print(f"\n💰 Valor Total Boletos: R$ {valor_total_boletos:.2f}")
        print(f"💳 Valor Total Pago: R$ {valor_total_pagos:.2f}")
        print(f"📊 Taxa de Pagamento: {(valor_total_pagos/valor_total_boletos*100):.1f}%" if valor_total_boletos > 0 else "N/A")
    
    def executar(self):
        """Executa a criação de todos os dados de teste"""
        print("🚀 Criando dados de teste para o módulo de Cobrança")
        print("=" * 60)
        
        try:
            # Criar dados na ordem correta
            self.criar_configuracoes()
            self.criar_templates()
            self.criar_multas_fake()
            self.criar_boletos()
            self.criar_pagamentos()
            self.criar_cobrancas()
            
            # Gerar relatório
            self.gerar_relatorio()
            
            print("\n🎉 Dados de teste criados com sucesso!")
            print("\n📝 Próximos passos:")
            print("1. Acessar o Django Admin: http://localhost:8000/admin")
            print("2. Verificar os dados criados")
            print("3. Testar as APIs com dados reais")
            print("4. Navegar no frontend para ver os dados")
            
        except Exception as e:
            print(f"❌ Erro ao criar dados de teste: {e}")
            import traceback
            traceback.print_exc()

def main():
    print("🧪 Iniciando criação de dados de teste")
    print("=" * 50)
    
    criador = DadosTesteCobranca()
    criador.executar()

if __name__ == "__main__":
    main()

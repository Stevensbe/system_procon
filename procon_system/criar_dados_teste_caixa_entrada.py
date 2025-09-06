#!/usr/bin/env python3
"""
Script para criar dados de teste para o módulo de Caixa de Entrada
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
from django.contrib.contenttypes.models import ContentType
from caixa_entrada.models import (
    CaixaEntrada, AnexoCaixaEntrada, HistoricoCaixaEntrada, ConfiguracaoCaixaEntrada
)


def criar_configuracao_caixa_entrada():
    """Cria configuração padrão da caixa de entrada"""
    config, created = ConfiguracaoCaixaEntrada.objects.get_or_create(
        id=1,
        defaults={
            'auto_distribuir': True,
            'notificar_novos': True,
            'alerta_prazos': True,
            'dias_alerta_prazo': 3,
            'formato_protocolo': 'PROT-{ANO}-{SEQUENCIAL}',
            'sequencial_por_ano': True,
            'notificar_email': True,
            'notificar_sms': False,
            'notificar_push': True,
            'dias_retencao': 3650,
            'auto_arquivar': True
        }
    )
    
    if created:
        print(f"✅ Configuração da caixa de entrada criada")
    else:
        print(f"ℹ️ Configuração da caixa de entrada já existe")
    
    return config


def criar_documentos_teste():
    """Cria documentos de teste na caixa de entrada"""
    
    # Tipos de documento
    tipos_documento = [
        ('PETICAO', 'Petição'),
        ('RECURSO', 'Recurso'),
        ('DENUNCIA', 'Denúncia'),
        ('RECLAMACAO', 'Reclamação'),
        ('AUTO_INFRACAO', 'Auto de Infração'),
        ('MULTA', 'Multa'),
        ('PROTOCOLO', 'Protocolo'),
        ('DOCUMENTO_INTERNO', 'Documento Interno'),
        ('SOLICITACAO', 'Solicitação'),
        ('OUTROS', 'Outros'),
    ]
    
    # Setores
    setores = [
        'Jurídico',
        'Fiscalização',
        'Cobrança',
        'Atendimento',
        'Protocolo',
        'Administrativo',
        'Financeiro'
    ]
    
    # Status
    status_list = [
        ('NAO_LIDO', 'Não Lido'),
        ('LIDO', 'Lido'),
        ('EM_ANALISE', 'Em Análise'),
        ('RESPONDIDO', 'Respondido'),
        ('ARQUIVADO', 'Arquivado'),
        ('ENCAMINHADO', 'Encaminhado'),
    ]
    
    # Prioridades
    prioridades = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']
    
    # Origens
    origens = [
        'PORTAL_CIDADAO',
        'SISTEMA_INTERNO',
        'API_EXTERNA',
        'IMPORTACAO',
        'FISCALIZACAO',
        'JURIDICO',
        'MULTAS'
    ]
    
    # Dados de exemplo
    empresas = [
        {'nome': 'Supermercado ABC Ltda', 'cnpj': '12.345.678/0001-90'},
        {'nome': 'Posto de Combustível XYZ', 'cnpj': '23.456.789/0001-01'},
        {'nome': 'Banco Nacional S.A.', 'cnpj': '34.567.890/0001-12'},
        {'nome': 'Loja de Eletrônicos Tech', 'cnpj': '45.678.901/0001-23'},
        {'nome': 'Farmácia Popular', 'cnpj': '56.789.012/0001-34'},
    ]
    
    pessoas = [
        {'nome': 'João Silva', 'cpf': '123.456.789-00', 'email': 'joao@email.com'},
        {'nome': 'Maria Santos', 'cpf': '234.567.890-11', 'email': 'maria@email.com'},
        {'nome': 'Pedro Oliveira', 'cpf': '345.678.901-22', 'email': 'pedro@email.com'},
        {'nome': 'Ana Costa', 'cpf': '456.789.012-33', 'email': 'ana@email.com'},
        {'nome': 'Carlos Ferreira', 'cpf': '567.890.123-44', 'email': 'carlos@email.com'},
    ]
    
    assuntos = [
        'Reclamação sobre produto com defeito',
        'Denúncia de prática abusiva',
        'Recurso administrativo',
        'Solicitação de informações',
        'Auto de infração por irregularidade',
        'Multa por descumprimento',
        'Petição para revisão de processo',
        'Documentação complementar',
        'Solicitação de prazo',
        'Manifestação sobre processo'
    ]
    
    descricoes = [
        'Produto adquirido apresentou defeito logo após a compra',
        'Empresa está cobrando valores indevidos',
        'Recurso contra decisão administrativa',
        'Solicitação de cópia de documentos',
        'Auto de infração aplicado por irregularidade na fiscalização',
        'Multa aplicada por descumprimento de norma',
        'Petição solicitando revisão de processo administrativo',
        'Documentação complementar solicitada',
        'Solicitação de prazo para apresentação de defesa',
        'Manifestação sobre processo em andamento'
    ]
    
    # Buscar usuários para responsáveis
    usuarios = list(User.objects.filter(is_active=True))
    
    documentos_criados = []
    
    for i in range(50):  # Criar 50 documentos de teste
        # Escolher dados aleatórios
        tipo_doc = random.choice(tipos_documento)[0]
        setor = random.choice(setores)
        status = random.choice(status_list)[0]
        prioridade = random.choice(prioridades)
        origem = random.choice(origens)
        
        # Escolher entre empresa ou pessoa física
        if random.choice([True, False]):
            remetente = random.choice(empresas)
            remetente_nome = remetente['nome']
            remetente_documento = remetente['cnpj']
            empresa_nome = remetente['nome']
            empresa_cnpj = remetente['cnpj']
        else:
            remetente = random.choice(pessoas)
            remetente_nome = remetente['nome']
            remetente_documento = remetente['cpf']
            empresa_nome = ''
            empresa_cnpj = ''
        
        # Data de entrada (últimos 30 dias)
        dias_atras = random.randint(0, 30)
        data_entrada = datetime.now() - timedelta(days=dias_atras)
        
        # Prazo de resposta (entre 5 e 60 dias)
        prazo_dias = random.randint(5, 60)
        prazo_resposta = data_entrada + timedelta(days=prazo_dias)
        
        # Criar documento
        documento = CaixaEntrada.objects.create(
            tipo_documento=tipo_doc,
            assunto=random.choice(assuntos),
            descricao=random.choice(descricoes),
            prioridade=prioridade,
            status=status,
            remetente_nome=remetente_nome,
            remetente_documento=remetente_documento,
            remetente_email=remetente.get('email', ''),
            remetente_telefone=f'(11) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}',
            empresa_nome=empresa_nome,
            empresa_cnpj=empresa_cnpj,
            setor_destino=setor,
            responsavel_atual=random.choice(usuarios) if usuarios else None,
            origem=origem,
            prazo_resposta=prazo_resposta,
            data_entrada=data_entrada,
            data_atualizacao=data_entrada
        )
        
        # Marcar como lido se não for "NAO_LIDO"
        if status != 'NAO_LIDO' and documento.responsavel_atual:
            documento.lido_em = data_entrada + timedelta(hours=random.randint(1, 24))
            documento.lido_por = documento.responsavel_atual
            documento.save()
        
        # Criar histórico
        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='CRIADO',
            usuario=documento.responsavel_atual,
            detalhes=f'Documento criado via sistema de teste - Tipo: {tipo_doc}'
        )
        
        # Se foi lido, criar histórico de leitura
        if documento.lido_em:
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='LIDO',
                usuario=documento.lido_por,
                detalhes='Documento marcado como lido'
            )
        
        documentos_criados.append(documento)
        
        print(f"✅ Documento {documento.numero_protocolo} criado - {documento.assunto[:50]}...")
    
    print(f"\n🎉 {len(documentos_criados)} documentos criados na caixa de entrada!")
    return documentos_criados


def criar_anexos_teste():
    """Cria anexos de teste para alguns documentos"""
    
    documentos = CaixaEntrada.objects.all()[:20]  # Primeiros 20 documentos
    usuarios = list(User.objects.filter(is_active=True))
    
    tipos_anexo = [
        'documento_identidade.pdf',
        'nota_fiscal.pdf',
        'contrato.pdf',
        'foto_evidencia.jpg',
        'relatorio.pdf',
        'declaracao.pdf',
        'comprovante.pdf',
        'laudo_tecnico.pdf'
    ]
    
    anexos_criados = []
    
    for documento in documentos:
        # Criar 1-3 anexos por documento
        num_anexos = random.randint(1, 3)
        
        for i in range(num_anexos):
            anexo = AnexoCaixaEntrada.objects.create(
                documento=documento,
                arquivo=f'anexos/{documento.numero_protocolo}/anexo_{i+1}.pdf',
                nome_original=random.choice(tipos_anexo),
                tipo_mime='application/pdf',
                tamanho=random.randint(50000, 5000000),  # 50KB a 5MB
                descricao=f'Anexo {i+1} do documento {documento.numero_protocolo}',
                upload_por=random.choice(usuarios) if usuarios else None,
                upload_em=documento.data_entrada + timedelta(hours=random.randint(1, 48))
            )
            
            anexos_criados.append(anexo)
            print(f"✅ Anexo criado: {anexo.nome_original} para {documento.numero_protocolo}")
    
    print(f"\n📎 {len(anexos_criados)} anexos criados!")
    return anexos_criados


def main():
    """Função principal"""
    print("🚀 Criando dados de teste para Caixa de Entrada...")
    print("=" * 60)
    
    # Criar configuração
    config = criar_configuracao_caixa_entrada()
    
    # Criar documentos
    documentos = criar_documentos_teste()
    
    # Criar anexos
    anexos = criar_anexos_teste()
    
    # Estatísticas finais
    total_documentos = CaixaEntrada.objects.count()
    total_anexos = AnexoCaixaEntrada.objects.count()
    total_historico = HistoricoCaixaEntrada.objects.count()
    
    print("\n" + "=" * 60)
    print("📊 ESTATÍSTICAS FINAIS:")
    print(f"📄 Documentos na caixa de entrada: {total_documentos}")
    print(f"📎 Anexos: {total_anexos}")
    print(f"📝 Registros de histórico: {total_historico}")
    print(f"⚙️ Configurações: 1")
    print("=" * 60)
    print("✅ Dados de teste da Caixa de Entrada criados com sucesso!")
    print("\n🌐 Acesse: /caixa-entrada/ para ver a caixa de entrada")


if __name__ == '__main__':
    main()

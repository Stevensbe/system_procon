#!/usr/bin/env python3
"""
Script para criar dados de teste para o módulo de Peticionamento
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
from peticionamento.models import (
    TipoPeticao, PeticaoEletronica, AnexoPeticao,
    InteracaoPeticao, RespostaPeticao, ConfiguracaoPeticionamento
)


def criar_tipos_peticao():
    """Criar tipos de petição"""
    tipos_data = [
        {
            'nome': 'Denúncia de Prática Abusiva',
            'descricao': 'Denúncias sobre práticas comerciais abusivas',
            'categoria': 'DEFESA',
            'prazo_resposta_dias': 30,
            'requer_documentos': True,
            'permite_anonimo': True,
            'notificar_email': True,
            'notificar_sms': False,
            'campos_obrigatorios': ['empresa_nome', 'empresa_cnpj', 'data_fato', 'descricao'],
            'campos_opcionais': ['valor_causa', 'empresa_endereco'],
            'ativo': True,
            'ordem_exibicao': 1
        },
        {
            'nome': 'Reclamação de Produto',
            'descricao': 'Reclamações sobre qualidade de produtos',
            'categoria': 'SOLICITACAO',
            'prazo_resposta_dias': 15,
            'requer_documentos': True,
            'permite_anonimo': False,
            'notificar_email': True,
            'notificar_sms': True,
            'campos_obrigatorios': ['empresa_nome', 'produto', 'data_fato', 'descricao'],
            'campos_opcionais': ['valor_causa', 'nota_fiscal'],
            'ativo': True,
            'ordem_exibicao': 2
        },
        {
            'nome': 'Reclamação de Serviço',
            'descricao': 'Reclamações sobre qualidade de serviços',
            'categoria': 'SOLICITACAO',
            'prazo_resposta_dias': 20,
            'requer_documentos': True,
            'permite_anonimo': False,
            'notificar_email': True,
            'notificar_sms': False,
            'campos_obrigatorios': ['empresa_nome', 'servico', 'data_fato', 'descricao'],
            'campos_opcionais': ['valor_causa', 'contrato'],
            'ativo': True,
            'ordem_exibicao': 3
        },
        {
            'nome': 'Consulta sobre Direitos',
            'descricao': 'Consultas sobre direitos do consumidor',
            'categoria': 'CONSULTA',
            'prazo_resposta_dias': 10,
            'requer_documentos': False,
            'permite_anonimo': True,
            'notificar_email': True,
            'notificar_sms': False,
            'campos_obrigatorios': ['descricao'],
            'campos_opcionais': ['situacao_especifica'],
            'ativo': True,
            'ordem_exibicao': 4
        },
        {
            'nome': 'Recurso Administrativo',
            'descricao': 'Recursos contra decisões administrativas',
            'categoria': 'RECURSO',
            'prazo_resposta_dias': 60,
            'requer_documentos': True,
            'permite_anonimo': False,
            'notificar_email': True,
            'notificar_sms': True,
            'campos_obrigatorios': ['processo_original', 'fundamentacao', 'descricao'],
            'campos_opcionais': ['documentos_complementares'],
            'ativo': True,
            'ordem_exibicao': 5
        }
    ]
    
    tipos = []
    for tipo_data in tipos_data:
        tipo, created = TipoPeticao.objects.get_or_create(
            nome=tipo_data['nome'],
            defaults=tipo_data
        )
        tipos.append(tipo)
        if created:
            print(f"✓ Tipo criado: {tipo.nome}")
        else:
            print(f"✓ Tipo já existe: {tipo.nome}")
    
    return tipos


def criar_peticoes(tipos, usuarios):
    """Criar petições eletrônicas"""
    peticoes = []
    
    # Dados de exemplo
    peticionarios = [
        {'nome': 'João Silva', 'documento': '12345678901', 'email': 'joao@email.com'},
        {'nome': 'Maria Santos', 'documento': '98765432100', 'email': 'maria@email.com'},
        {'nome': 'Pedro Oliveira', 'documento': '11122233344', 'email': 'pedro@email.com'},
        {'nome': 'Ana Costa', 'documento': '55566677788', 'email': 'ana@email.com'},
        {'nome': 'Carlos Ferreira', 'documento': '99988877766', 'email': 'carlos@email.com'},
    ]
    
    empresas = [
        {'nome': 'Supermercado ABC Ltda', 'cnpj': '12345678000101'},
        {'nome': 'Posto de Combustível XYZ', 'cnpj': '98765432000102'},
        {'nome': 'Banco Nacional S.A.', 'cnpj': '11122233000103'},
        {'nome': 'Telecomunicações Brasil', 'cnpj': '55566677000104'},
        {'nome': 'Construtoras Unidos Ltda', 'cnpj': '99988877000105'},
    ]
    
    assuntos = [
        'Produto com defeito de fabricação',
        'Serviço não prestado conforme contratado',
        'Cobrança indevida',
        'Publicidade enganosa',
        'Cláusula abusiva em contrato',
        'Produto vencido',
        'Atendimento inadequado',
        'Problemas com garantia',
        'Cobrança de taxas não informadas',
        'Problemas com entrega'
    ]
    
    status_list = ['RASCUNHO', 'ENVIADA', 'RECEBIDA', 'EM_ANALISE', 'RESPONDIDA', 'FINALIZADA']
    prioridades = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']
    origens = ['PORTAL_CIDADAO', 'PRESENCIAL', 'TELEFONE', 'EMAIL', 'APLICATIVO']
    
    for i in range(50):  # Criar 50 petições
        peticionario = random.choice(peticionarios)
        empresa = random.choice(empresas)
        tipo = random.choice(tipos)
        status = random.choice(status_list)
        prioridade = random.choice(prioridades)
        origem = random.choice(origens)
        
        # Datas
        data_criacao = datetime.now() - timedelta(days=random.randint(0, 90))
        data_envio = None
        data_recebimento = None
        data_resposta = None
        data_finalizacao = None
        
        if status != 'RASCUNHO':
            data_envio = data_criacao + timedelta(hours=random.randint(1, 24))
        
        if status in ['RECEBIDA', 'EM_ANALISE', 'RESPONDIDA', 'FINALIZADA']:
            data_recebimento = data_envio + timedelta(hours=random.randint(1, 48))
        
        if status in ['RESPONDIDA', 'FINALIZADA']:
            data_resposta = data_recebimento + timedelta(days=random.randint(1, tipo.prazo_resposta_dias))
        
        if status == 'FINALIZADA':
            data_finalizacao = data_resposta + timedelta(days=random.randint(1, 7))
        
        # Dados específicos baseados no tipo
        dados_especificos = {}
        if tipo.categoria == 'DEFESA':
            dados_especificos = {
                'tipo_pratica': random.choice(['Cobrança Indevida', 'Publicidade Enganosa', 'Cláusula Abusiva']),
                'prejuizo_estimado': random.randint(100, 5000)
            }
        elif tipo.categoria == 'SOLICITACAO':
            dados_especificos = {
                'produto_servico': random.choice(['Produto', 'Serviço']),
                'marca': random.choice(['Marca A', 'Marca B', 'Marca C']),
                'lote': f"LOTE-{random.randint(1000, 9999)}"
            }
        
        peticao_data = {
            'tipo_peticao': tipo,
            'origem': origem,
            'assunto': random.choice(assuntos),
            'descricao': f"Descrição detalhada da petição #{i+1:03d}. Esta é uma petição de teste criada automaticamente.",
            'observacoes': f"Observações adicionais para a petição #{i+1:03d}",
            'status': status,
            'prioridade': prioridade,
            'peticionario_nome': peticionario['nome'],
            'peticionario_documento': peticionario['documento'],
            'peticionario_email': peticionario['email'],
            'peticionario_telefone': f"(11) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
            'peticionario_endereco': f"Rua {random.randint(1, 999)}, {random.randint(1, 999)}",
            'peticionario_cep': f"{random.randint(10000, 99999)}-{random.randint(100, 999)}",
            'peticionario_cidade': random.choice(['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília']),
            'peticionario_uf': random.choice(['SP', 'RJ', 'MG', 'BA', 'DF']),
            'empresa_nome': empresa['nome'],
            'empresa_cnpj': empresa['cnpj'],
            'empresa_endereco': f"Av. {random.randint(1, 999)}, {random.randint(1, 999)}",
            'empresa_telefone': f"(11) {random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
            'empresa_email': f"contato@{empresa['nome'].lower().replace(' ', '').replace('.', '').replace(',', '')}.com.br",
            'valor_causa': Decimal(random.randint(100, 10000)),
            'data_fato': data_criacao.date() - timedelta(days=random.randint(1, 30)),
            'usuario_criacao': random.choice(usuarios),
            'responsavel_atual': random.choice(usuarios) if status in ['RECEBIDA', 'EM_ANALISE', 'RESPONDIDA'] else None,
            'anonima': random.choice([True, False]),
            'confidencial': random.choice([True, False]),
            'notificar_peticionario': True,
            'dados_especificos': dados_especificos,
            'ip_origem': f"192.168.1.{random.randint(1, 255)}",
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'criado_em': data_criacao,
            'atualizado_em': data_criacao,
        }
        
        # Adicionar datas condicionais
        if data_envio:
            peticao_data['data_envio'] = data_envio
        if data_recebimento:
            peticao_data['data_recebimento'] = data_recebimento
        if data_resposta:
            peticao_data['data_resposta'] = data_resposta
        if data_finalizacao:
            peticao_data['data_finalizacao'] = data_finalizacao
        
        peticao = PeticaoEletronica.objects.create(**peticao_data)
        peticoes.append(peticao)
        
        print(f"✓ Petição criada: {peticao.numero_peticao} - {peticao.assunto}")
    
    return peticoes


def criar_anexos(peticoes, usuarios):
    """Criar anexos para as petições"""
    anexos = []
    
    tipos_anexo = ['DOCUMENTO', 'COMPROVANTE', 'FOTO', 'AUDIO', 'VIDEO']
    nomes_arquivos = [
        'documento.pdf', 'comprovante.pdf', 'foto.jpg', 'audio.mp3', 'video.mp4',
        'nota_fiscal.pdf', 'contrato.pdf', 'foto_produto.jpg', 'evidencia.pdf'
    ]
    
    for peticao in peticoes:
        # Criar 1-3 anexos por petição
        num_anexos = random.randint(1, 3)
        
        for i in range(num_anexos):
            tipo_anexo = random.choice(tipos_anexo)
            nome_arquivo = random.choice(nomes_arquivos)
            tamanho = random.randint(1024, 1024*1024)  # 1KB a 1MB
            
            anexo_data = {
                'peticao': peticao,
                'tipo_anexo': tipo_anexo,
                'nome_arquivo': nome_arquivo,
                'arquivo': f'peticionamento/anexos/{peticao.numero_peticao}/{nome_arquivo}',
                'descricao': f"Anexo {i+1} da petição {peticao.numero_peticao}",
                'tipo_mime': 'application/pdf' if nome_arquivo.endswith('.pdf') else 'image/jpeg',
                'tamanho_bytes': tamanho,
                'hash_arquivo': f"hash_{random.randint(100000, 999999)}",
                'uploaded_por': random.choice(usuarios),
                'uploaded_em': peticao.criado_em + timedelta(hours=random.randint(1, 24))
            }
            
            anexo = AnexoPeticao.objects.create(**anexo_data)
            anexos.append(anexo)
            
            print(f"✓ Anexo criado: {anexo.nome_arquivo} para {peticao.numero_peticao}")
    
    return anexos


def criar_interacoes(peticoes, usuarios):
    """Criar interações para as petições"""
    interacoes = []
    
    tipos_interacao = [
        'CRIACAO', 'ENVIO', 'RECEBIMENTO', 'ANALISE_INICIADA', 'SOLICITACAO_INFO',
        'INFO_COMPLEMENTAR', 'PARECER', 'RESPOSTA', 'FINALIZACAO'
    ]
    
    for peticao in peticoes:
        # Criar 2-5 interações por petição
        num_interacoes = random.randint(2, 5)
        
        for i in range(num_interacoes):
            tipo_interacao = random.choice(tipos_interacao)
            
            # Definir título e descrição baseado no tipo
            if tipo_interacao == 'CRIACAO':
                titulo = 'Petição criada'
                descricao = 'Petição foi criada no sistema'
            elif tipo_interacao == 'ENVIO':
                titulo = 'Petição enviada'
                descricao = 'Petição foi enviada para análise'
            elif tipo_interacao == 'RECEBIMENTO':
                titulo = 'Petição recebida'
                descricao = 'Petição foi recebida e está em análise'
            elif tipo_interacao == 'ANALISE_INICIADA':
                titulo = 'Análise iniciada'
                descricao = 'Análise da petição foi iniciada'
            elif tipo_interacao == 'SOLICITACAO_INFO':
                titulo = 'Solicitação de informações'
                descricao = 'Solicitadas informações complementares'
            elif tipo_interacao == 'INFO_COMPLEMENTAR':
                titulo = 'Informações complementares'
                descricao = 'Informações complementares foram fornecidas'
            elif tipo_interacao == 'PARECER':
                titulo = 'Parecer técnico'
                descricao = 'Parecer técnico foi elaborado'
            elif tipo_interacao == 'RESPOSTA':
                titulo = 'Resposta elaborada'
                descricao = 'Resposta oficial foi elaborada'
            elif tipo_interacao == 'FINALIZACAO':
                titulo = 'Petição finalizada'
                descricao = 'Petição foi finalizada'
            
            interacao_data = {
                'peticao': peticao,
                'tipo_interacao': tipo_interacao,
                'titulo': titulo,
                'descricao': descricao,
                'observacoes': f"Observações da interação {i+1}",
                'status_anterior': peticao.status,
                'status_novo': peticao.status,
                'usuario': random.choice(usuarios),
                'nome_usuario': random.choice(usuarios).get_full_name() or random.choice(usuarios).username,
                'ip_origem': f"192.168.1.{random.randint(1, 255)}",
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'visivel_peticionario': random.choice([True, False]),
                'data_interacao': peticao.criado_em + timedelta(hours=random.randint(1, 72))
            }
            
            interacao = InteracaoPeticao.objects.create(**interacao_data)
            interacoes.append(interacao)
            
            print(f"✓ Interação criada: {interacao.titulo} para {peticao.numero_peticao}")
    
    return interacoes


def criar_respostas(peticoes, usuarios):
    """Criar respostas para as petições"""
    respostas = []
    
    tipos_resposta = [
        'PROCEDENTE', 'IMPROCEDENTE', 'PARCIALMENTE_PROCEDENTE',
        'ORIENTACAO', 'ENCAMINHAMENTO', 'ARQUIVAMENTO'
    ]
    
    for peticao in peticoes:
        if peticao.status in ['RESPONDIDA', 'FINALIZADA']:
            tipo_resposta = random.choice(tipos_resposta)
            
            if tipo_resposta == 'PROCEDENTE':
                titulo = 'Petição procedente'
                conteudo = 'A petição foi julgada procedente. A empresa será notificada para tomar as providências necessárias.'
            elif tipo_resposta == 'IMPROCEDENTE':
                titulo = 'Petição improcedente'
                conteudo = 'A petição foi julgada improcedente. Não foram encontrados elementos que justifiquem a procedência.'
            elif tipo_resposta == 'PARCIALMENTE_PROCEDENTE':
                titulo = 'Petição parcialmente procedente'
                conteudo = 'A petição foi julgada parcialmente procedente. Alguns pontos foram acolhidos.'
            elif tipo_resposta == 'ORIENTACAO':
                titulo = 'Orientação fornecida'
                conteudo = 'Foi fornecida orientação sobre os direitos do consumidor e como proceder.'
            elif tipo_resposta == 'ENCAMINHAMENTO':
                titulo = 'Petição encaminhada'
                conteudo = 'A petição foi encaminhada para o órgão competente para análise.'
            elif tipo_resposta == 'ARQUIVAMENTO':
                titulo = 'Petição arquivada'
                conteudo = 'A petição foi arquivada por falta de elementos para análise.'
            
            resposta_data = {
                'peticao': peticao,
                'tipo_resposta': tipo_resposta,
                'titulo': titulo,
                'conteudo': conteudo,
                'fundamentacao': 'Fundamentação legal baseada no Código de Defesa do Consumidor e legislação aplicável.',
                'orientacoes': 'Orientações sobre próximos passos e direitos do consumidor.',
                'responsavel': random.choice(usuarios),
                'cargo_responsavel': random.choice(['Analista', 'Coordenador', 'Diretor']),
                'numero_documento': f"RESP-{random.randint(1000, 9999)}/2024",
                'data_elaboracao': peticao.data_resposta or peticao.criado_em + timedelta(days=random.randint(1, 30)),
                'data_envio': peticao.data_resposta,
                'enviado_email': random.choice([True, False]),
                'enviado_sms': random.choice([True, False]),
                'enviado_portal': True
            }
            
            resposta = RespostaPeticao.objects.create(**resposta_data)
            respostas.append(resposta)
            
            print(f"✓ Resposta criada: {resposta.titulo} para {peticao.numero_peticao}")
    
    return respostas


def criar_configuracao():
    """Criar configuração do sistema"""
    config, created = ConfiguracaoPeticionamento.objects.get_or_create(
        id=1,
        defaults={
            'sistema_ativo': True,
            'manutencao': False,
            'mensagem_manutencao': '',
            'prazo_padrao_resposta_dias': 30,
            'prazo_urgente_resposta_dias': 5,
            'prazo_notificacao_vencimento_dias': 3,
            'tamanho_maximo_arquivo_mb': 10,
            'numero_maximo_anexos': 5,
            'tipos_arquivo_permitidos': 'pdf,doc,docx,jpg,jpeg,png,txt',
            'notificar_nova_peticao': True,
            'notificar_vencimento_prazo': True,
            'email_notificacao': 'notificacoes@procon.gov.br',
            'template_confirmacao_envio': 'Sua petição foi enviada com sucesso.',
            'template_recebimento': 'Sua petição foi recebida e está em análise.',
            'template_resposta': 'Sua petição foi respondida.',
            'exigir_captcha': True,
            'limitar_ip': False,
            'peticoes_por_ip_dia': 10,
            'backup_automatico': True,
            'dias_backup': 1
        }
    )
    
    if created:
        print("✓ Configuração do sistema criada")
    else:
        print("✓ Configuração do sistema já existe")
    
    return config


def main():
    """Função principal"""
    print("🚀 Criando dados de teste para o módulo de Peticionamento...")
    
    # Verificar usuários
    usuarios = list(User.objects.all())
    if not usuarios:
        print("❌ Nenhum usuário encontrado. Crie usuários primeiro.")
        return
    print(f"✓ Usuários encontrados: {len(usuarios)}")
    
    print("\n📋 Criando tipos de petição...")
    tipos = criar_tipos_peticao()
    
    print("\n📝 Criando petições...")
    peticoes = criar_peticoes(tipos, usuarios)
    
    print("\n📎 Criando anexos...")
    anexos = criar_anexos(peticoes, usuarios)
    
    print("\n🔄 Criando interações...")
    interacoes = criar_interacoes(peticoes, usuarios)
    
    print("\n📄 Criando respostas...")
    respostas = criar_respostas(peticoes, usuarios)
    
    print("\n⚙️ Criando configuração...")
    config = criar_configuracao()
    
    print("\n" + "="*50)
    print("✅ DADOS DE TESTE CRIADOS COM SUCESSO!")
    print("="*50)
    print(f"📊 RESUMO:")
    print(f"   • Tipos de Petição: {len(tipos)}")
    print(f"   • Petições: {len(peticoes)}")
    print(f"   • Anexos: {len(anexos)}")
    print(f"   • Interações: {len(interacoes)}")
    print(f"   • Respostas: {len(respostas)}")
    print(f"   • Configuração: 1")
    print("\n🎯 PRÓXIMOS PASSOS:")
    print("   1. Execute: python testar_peticionamento.py")
    print("   2. Acesse: http://localhost:8000/peticionamento/")
    print("   3. Teste as APIs REST")


if __name__ == '__main__':
    main()

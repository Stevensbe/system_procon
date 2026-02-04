#!/usr/bin/env python
"""
Script para criar dados de teste para o portal do cidadão
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from portal_cidadao.models import (
    CategoriaConteudo, ConteudoPortal, FormularioPublico, BannerPortal,
    ConsultaPublica, AvaliacaoServico, ConfiguracaoPortal, EstatisticaPortal
)

def criar_categorias():
    """Criar categorias de conteúdo"""
    print("📂 Criando categorias de conteúdo...")
    
    categorias = [
        {
            'nome': 'Direitos do Consumidor',
            'descricao': 'Informações sobre os direitos básicos do consumidor',
            'icone': 'fas fa-shield-alt',
            'cor': '#007bff',
            'ordem': 1
        },
        {
            'nome': 'Como Proceder',
            'descricao': 'Orientações sobre como agir em diferentes situações',
            'icone': 'fas fa-info-circle',
            'cor': '#28a745',
            'ordem': 2
        },
        {
            'nome': 'Denúncias e Reclamações',
            'descricao': 'Como fazer denúncias e reclamações',
            'icone': 'fas fa-exclamation-triangle',
            'cor': '#dc3545',
            'ordem': 3
        },
        {
            'nome': 'Legislação',
            'descricao': 'Leis e regulamentações importantes',
            'icone': 'fas fa-gavel',
            'cor': '#6f42c1',
            'ordem': 4
        },
        {
            'nome': 'Dicas e Orientações',
            'descricao': 'Dicas práticas para o dia a dia',
            'icone': 'fas fa-lightbulb',
            'cor': '#ffc107',
            'ordem': 5
        }
    ]
    
    for cat_data in categorias:
        categoria, created = CategoriaConteudo.objects.get_or_create(
            nome=cat_data['nome'],
            defaults=cat_data
        )
        if created:
            print(f"   ✅ Categoria '{categoria.nome}' criada")
        else:
            print(f"   ℹ️  Categoria '{categoria.nome}' já existe")
    
    return CategoriaConteudo.objects.all()

def criar_conteudos(categorias):
    """Criar conteúdos do portal"""
    print("\n📝 Criando conteúdos do portal...")
    
    # Obter usuário admin ou criar um
    try:
        autor = User.objects.filter(is_staff=True).first()
        if not autor:
            autor = User.objects.create_user(
                username='admin_portal',
                email='admin@procon.am.gov.br',
                password='admin123456',
                first_name='Administrador',
                last_name='Portal',
                is_staff=True
            )
    except:
        autor = User.objects.first()
    
    conteudos = [
        {
            'categoria': categorias[0],  # Direitos do Consumidor
            'tipo': 'ORIENTACAO',
            'titulo': 'Seus Direitos como Consumidor',
            'subtitulo': 'Conheça os direitos básicos garantidos pelo Código de Defesa do Consumidor',
            'resumo': 'Informações essenciais sobre os direitos do consumidor brasileiro.',
            'conteudo': '''
            <h3>Direitos Básicos do Consumidor</h3>
            <p>O Código de Defesa do Consumidor (CDC) garante uma série de direitos fundamentais:</p>
            <ul>
                <li><strong>Direito à Informação:</strong> Produtos e serviços devem ter informações claras e precisas</li>
                <li><strong>Direito à Escolha:</strong> Liberdade de escolher entre produtos e serviços disponíveis</li>
                <li><strong>Direito à Segurança:</strong> Proteção contra produtos e serviços perigosos</li>
                <li><strong>Direito à Educação:</strong> Acesso a informações sobre consumo</li>
                <li><strong>Direito à Proteção:</strong> Defesa contra práticas abusivas</li>
            </ul>
            <h3>Como Exercer Seus Direitos</h3>
            <p>Para exercer seus direitos como consumidor:</p>
            <ol>
                <li>Documente sempre suas compras e contratos</li>
                <li>Guarde recibos, notas fiscais e contratos</li>
                <li>Faça reclamações por escrito</li>
                <li>Procure o PROCON em caso de problemas</li>
            </ol>
            ''',
            'slug': 'direitos-consumidor',
            'palavras_chave': 'direitos, consumidor, CDC, proteção',
            'meta_description': 'Conheça seus direitos como consumidor e como exercê-los',
            'destaque': True,
            'ativo': True
        },
        {
            'categoria': categorias[1],  # Como Proceder
            'tipo': 'TUTORIAL',
            'titulo': 'Como Fazer uma Reclamação',
            'subtitulo': 'Passo a passo para fazer uma reclamação eficaz',
            'resumo': 'Aprenda como fazer uma reclamação de forma adequada e eficaz.',
            'conteudo': '''
            <h3>Passo a Passo para Fazer uma Reclamação</h3>
            <h4>1. Documente o Problema</h4>
            <p>Colete todas as informações possíveis:</p>
            <ul>
                <li>Nome da empresa ou estabelecimento</li>
                <li>Data e local da ocorrência</li>
                <li>Descrição detalhada do problema</li>
                <li>Documentos comprobatórios</li>
            </ul>
            <h4>2. Tente Resolver Diretamente</h4>
            <p>Antes de procurar o PROCON, tente resolver diretamente com a empresa:</p>
            <ul>
                <li>Entre em contato com o SAC</li>
                <li>Faça a reclamação por escrito</li>
                <li>Dê um prazo para resposta</li>
            </ul>
            <h4>3. Procure o PROCON</h4>
            <p>Se não conseguir resolver, procure o PROCON:</p>
            <ul>
                <li>Leve todos os documentos</li>
                <li>Faça a reclamação detalhada</li>
                <li>Aguarde o processo de mediação</li>
            </ul>
            ''',
            'slug': 'como-fazer-reclamacao',
            'palavras_chave': 'reclamação, denúncia, PROCON, direitos',
            'meta_description': 'Aprenda como fazer uma reclamação de forma adequada',
            'destaque': True,
            'ativo': True
        },
        {
            'categoria': categorias[2],  # Denúncias e Reclamações
            'tipo': 'ORIENTACAO',
            'titulo': 'Quando Fazer uma Denúncia',
            'subtitulo': 'Saiba quando é necessário fazer uma denúncia ao PROCON',
            'resumo': 'Orientações sobre quando e como fazer denúncias ao PROCON.',
            'conteudo': '''
            <h3>Quando Fazer uma Denúncia</h3>
            <p>Você deve fazer uma denúncia quando:</p>
            <ul>
                <li>A empresa não cumpre o que foi prometido</li>
                <li>Produtos apresentam defeitos</li>
                <li>Serviços não são prestados adequadamente</li>
                <li>Há cobranças indevidas</li>
                <li>Práticas abusivas são identificadas</li>
            </ul>
            <h3>Diferença entre Reclamação e Denúncia</h3>
            <p><strong>Reclamação:</strong> Problema individual com uma empresa</p>
            <p><strong>Denúncia:</strong> Problema que afeta vários consumidores</p>
            <h3>Como Fazer a Denúncia</h3>
            <ol>
                <li>Colete evidências do problema</li>
                <li>Documente todas as tentativas de resolução</li>
                <li>Procure o PROCON com todos os documentos</li>
                <li>Faça a denúncia detalhada</li>
            </ol>
            ''',
            'slug': 'quando-fazer-denuncia',
            'palavras_chave': 'denúncia, PROCON, direitos, proteção',
            'meta_description': 'Saiba quando fazer uma denúncia ao PROCON',
            'destaque': False,
            'ativo': True
        }
    ]
    
    for cont_data in conteudos:
        conteudo, created = ConteudoPortal.objects.get_or_create(
            slug=cont_data['slug'],
            defaults={
                **cont_data,
                'autor': autor,
                'data_publicacao': datetime.now()
            }
        )
        if created:
            print(f"   ✅ Conteúdo '{conteudo.titulo}' criado")
        else:
            print(f"   ℹ️  Conteúdo '{conteudo.titulo}' já existe")

def criar_formularios():
    """Criar formulários públicos"""
    print("\n📄 Criando formulários públicos...")
    
    formularios = [
        {
            'nome': 'Formulário de Reclamação',
            'descricao': 'Formulário para fazer reclamações sobre produtos ou serviços',
            'categoria': 'RECLAMACAO',
            'versao': '2.0',
            'tamanho_bytes': 245760,  # 240KB
            'destaque': True,
            'ativo': True,
            'instrucoes': 'Preencha todos os campos obrigatórios e anexe os documentos necessários.'
        },
        {
            'nome': 'Formulário de Denúncia',
            'descricao': 'Formulário para denunciar práticas abusivas ou irregulares',
            'categoria': 'DENUNCIA',
            'versao': '1.5',
            'tamanho_bytes': 184320,  # 180KB
            'destaque': True,
            'ativo': True,
            'instrucoes': 'Descreva detalhadamente a situação e forneça evidências quando possível.'
        },
        {
            'nome': 'Solicitação de Orientação',
            'descricao': 'Formulário para solicitar orientações sobre direitos do consumidor',
            'categoria': 'ORIENTACAO',
            'versao': '1.0',
            'tamanho_bytes': 122880,  # 120KB
            'destaque': False,
            'ativo': True,
            'instrucoes': 'Descreva sua dúvida de forma clara para receber a melhor orientação.'
        },
        {
            'nome': 'Cadastro de Consumidor',
            'descricao': 'Formulário para cadastro no sistema do PROCON',
            'categoria': 'CADASTRO',
            'versao': '1.0',
            'tamanho_bytes': 102400,  # 100KB
            'destaque': False,
            'ativo': True,
            'instrucoes': 'Preencha seus dados pessoais para facilitar o atendimento.'
        }
    ]
    
    for form_data in formularios:
        formulario, created = FormularioPublico.objects.get_or_create(
            nome=form_data['nome'],
            defaults=form_data
        )
        if created:
            print(f"   ✅ Formulário '{formulario.nome}' criado")
        else:
            print(f"   ℹ️  Formulário '{formulario.nome}' já existe")

def criar_banners():
    """Criar banners do portal"""
    print("\n🖼️ Criando banners do portal...")
    
    banners = [
        {
            'titulo': 'Proteja Seus Direitos',
            'subtitulo': 'O PROCON está aqui para defender você',
            'texto': 'Conheça seus direitos como consumidor e saiba como exercê-los.',
            'link': '/orientacoes/',
            'link_texto': 'Saiba Mais',
            'ativo': True,
            'ordem': 1
        },
        {
            'titulo': 'Faça sua Reclamação Online',
            'subtitulo': 'Processo rápido e seguro',
            'texto': 'Não precisa sair de casa para fazer sua reclamação.',
            'link': '/peticionar/',
            'link_texto': 'Reclamar Agora',
            'ativo': True,
            'ordem': 2
        },
        {
            'titulo': 'Consulte seu Processo',
            'subtitulo': 'Acompanhe o andamento',
            'texto': 'Acompanhe o andamento do seu processo de forma online.',
            'link': '/consulta/',
            'link_texto': 'Consultar',
            'ativo': True,
            'ordem': 3
        }
    ]
    
    for banner_data in banners:
        banner, created = BannerPortal.objects.get_or_create(
            titulo=banner_data['titulo'],
            defaults=banner_data
        )
        if created:
            print(f"   ✅ Banner '{banner.titulo}' criado")
        else:
            print(f"   ℹ️  Banner '{banner.titulo}' já existe")

def criar_configuracao_portal():
    """Criar configuração do portal"""
    print("\n⚙️ Criando configuração do portal...")
    
    if not ConfiguracaoPortal.objects.exists():
        config = ConfiguracaoPortal.objects.create(
            nome_instituicao='PROCON - Amazonas',
            endereco='Rua da Justiça, 123 - Centro\nManaus/AM - CEP: 69000-000',
            telefone='(92) 1234-5678',
            email='contato@procon.am.gov.br',
            site='https://www.procon.am.gov.br',
            horario_funcionamento='Segunda a Sexta: 8h às 18h\nSábado: 8h às 12h',
            facebook='https://facebook.com/proconamazonas',
            instagram='https://instagram.com/proconamazonas',
            twitter='https://twitter.com/proconamazonas',
            youtube='https://youtube.com/proconamazonas',
            sobre_instituicao='O PROCON do Amazonas é uma instituição pública dedicada a proteger os direitos do consumidor.',
            missao='Proteger e defender os direitos do consumidor, promovendo a cidadania e a justiça social.',
            visao='Ser reconhecida como uma instituição de excelência na defesa do consumidor.',
            valores='Ética, Compromisso, Excelência e Inovação',
            permitir_consulta_publica=True,
            exigir_captcha=True,
            permitir_avaliacao=True
        )
        print("   ✅ Configuração do portal criada")
    else:
        print("   ℹ️  Configuração do portal já existe")

def criar_estatisticas():
    """Criar estatísticas de exemplo"""
    print("\n📊 Criando estatísticas de exemplo...")
    
    # Criar estatísticas para os últimos 30 dias
    for i in range(30):
        data = datetime.now().date() - timedelta(days=i)
        
        estatistica, created = EstatisticaPortal.objects.get_or_create(
            data=data,
            defaults={
                'visitas_unicas': 150 + (i * 5),
                'pageviews': 450 + (i * 15),
                'consultas_realizadas': 25 + (i * 2),
                'formularios_baixados': 10 + (i * 1),
                'avaliacoes_recebidas': 5 + (i * 1),
                'tempo_medio_sessao': 180 + (i * 5)
            }
        )
        
        if created and i < 5:  # Mostrar apenas os primeiros 5
            print(f"   ✅ Estatística para {data.strftime('%d/%m/%Y')} criada")

def main():
    """Função principal"""
    print("🚀 CRIANDO DADOS DE TESTE PARA O PORTAL DO CIDADÃO")
    print("=" * 60)
    
    try:
        # Criar categorias
        categorias = criar_categorias()
        
        # Criar conteúdos
        criar_conteudos(categorias)
        
        # Criar formulários
        criar_formularios()
        
        # Criar banners
        criar_banners()
        
        # Criar configuração
        criar_configuracao_portal()
        
        # Criar estatísticas
        criar_estatisticas()
        
        print("\n" + "=" * 60)
        print("✅ DADOS DE TESTE CRIADOS COM SUCESSO!")
        print("\n📋 RESUMO:")
        print(f"   📂 Categorias: {CategoriaConteudo.objects.count()}")
        print(f"   📝 Conteúdos: {ConteudoPortal.objects.count()}")
        print(f"   📄 Formulários: {FormularioPublico.objects.count()}")
        print(f"   🖼️ Banners: {BannerPortal.objects.count()}")
        print(f"   ⚙️ Configurações: {ConfiguracaoPortal.objects.count()}")
        print(f"   📊 Estatísticas: {EstatisticaPortal.objects.count()}")
        
        print("\n🎉 Portal do Cidadão pronto para uso!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()

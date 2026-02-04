#!/usr/bin/env python3
"""
Script para testar o fluxo completo de denúncias e petições nas caixas de entrada
"""

import os
import sys
import django
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from portal_cidadao.models import DenunciaCidadao
from peticionamento.models import PeticaoEletronica, TipoPeticao
from caixa_entrada.models import CaixaEntrada
from django.contrib.auth.models import User

def testar_fluxo_denuncias():
    """Testa o fluxo de denúncias para a caixa de fiscalização"""
    
    print("🧪 TESTANDO FLUXO DE DENÚNCIAS")
    print("=" * 50)
    
    # Criar uma denúncia de teste
    denuncia = DenunciaCidadao.objects.create(
        empresa_denunciada="Empresa Teste Fluxo LTDA",
        cnpj_empresa="11.222.333/0001-44",
        endereco_empresa="Rua Teste Fluxo, 123 - Centro",
        telefone_empresa="(11) 3333-4444",
        email_empresa="teste@empresa.com",
        
        # Dados da infração
        descricao_fatos="Esta é uma denúncia de teste para verificar o fluxo na caixa de entrada da fiscalização. A empresa está praticando preços abusivos e vendendo produtos vencidos.",
        data_ocorrencia=datetime.now().date(),
        tipo_infracao='precos_abusivos',
        
        # Dados do denunciante
        nome_denunciante="João Teste Fluxo",
        cpf_cnpj="123.456.789-00",
        email="joao.teste@email.com",
        telefone="(11) 99999-8888",
        
        # Controle de anonimato
        denuncia_anonima=False,
        motivo_anonimato="",
        
        # Status inicial
        status='denuncia_recebida',
        origem_denuncia='PORTAL_CIDADAO',
        
        # Metadados
        ip_origem='127.0.0.1',
        user_agent='Teste Script Fluxo',
    )
    
    print(f"✅ Denúncia criada: {denuncia.numero_denuncia}")
    print(f"   Empresa: {denuncia.empresa_denunciada}")
    print(f"   Denunciante: {denuncia.nome_denunciante}")
    
    # Verificar se foi criado documento na caixa de entrada
    documento_caixa = CaixaEntrada.objects.filter(
        content_type__model='denunciacidadao',
        object_id=denuncia.id
    ).first()
    
    if documento_caixa:
        print(f"\n📬 Documento na caixa de entrada:")
        print(f"   Número: {documento_caixa.numero_protocolo}")
        print(f"   Tipo: {documento_caixa.tipo_documento}")
        print(f"   Assunto: {documento_caixa.assunto}")
        print(f"   Setor Destino: {documento_caixa.setor_destino}")
        print(f"   Status: {documento_caixa.status}")
        
        # Verificar se chegou na caixa correta
        if documento_caixa.setor_destino == 'Fiscalização':
            print("✅ DENÚNCIA CHEGOU NA CAIXA CORRETA (Fiscalização)")
        else:
            print(f"❌ DENÚNCIA CHEGOU NA CAIXA ERRADA: {documento_caixa.setor_destino}")
    else:
        print("❌ Documento não foi criado na caixa de entrada!")
    
    return denuncia, documento_caixa

def testar_fluxo_peticoes():
    """Testa o fluxo de petições para a caixa do jurídico"""
    
    print("\n🧪 TESTANDO FLUXO DE PETIÇÕES")
    print("=" * 50)
    
    # Criar usuário de teste se não existir
    usuario_teste, created = User.objects.get_or_create(
        username='teste_peticionamento',
        defaults={
            'email': 'teste@peticionamento.com',
            'first_name': 'Usuário',
            'last_name': 'Teste Petição',
            'is_active': True
        }
    )
    
    # Criar tipo de petição se não existir
    tipo_peticao, created = TipoPeticao.objects.get_or_create(
        categoria='RECURSO',
        defaults={
            'nome': 'Recurso Administrativo',
            'descricao': 'Recurso contra decisão administrativa',
            'ativo': True,
            'ordem_exibicao': 1
        }
    )
    
    # Criar uma petição de teste
    peticao = PeticaoEletronica.objects.create(
        tipo_peticao=tipo_peticao,
        origem='PORTAL_CIDADAO',
        assunto='Recurso contra multa aplicada',
        descricao='Esta é uma petição de teste para verificar o fluxo na caixa de entrada do jurídico. O recurso é contra uma multa aplicada indevidamente.',
        
        # Dados do peticionário
        peticionario_nome='Maria Teste Petição',
        peticionario_documento='987.654.321-00',
        peticionario_email='maria.teste@email.com',
        peticionario_telefone='(11) 88888-7777',
        peticionario_endereco='Rua Petição, 456 - Bairro',
        peticionario_cep='01234-567',
        
        # Dados da empresa
        empresa_nome='Empresa Teste Petição LTDA',
        empresa_cnpj='55.666.777/0001-88',
        
        # Dados adicionais
        valor_causa=1000.00,
        data_fato=datetime.now().date(),
        
        # Status inicial
        status='ENVIADA',
        
        # Usuário de criação (obrigatório)
        usuario_criacao=usuario_teste,
        
        # Metadados
        ip_origem='127.0.0.1',
        user_agent='Teste Script Fluxo',
    )
    
    print(f"✅ Petição criada: {peticao.numero_peticao}")
    print(f"   Tipo: {peticao.tipo_peticao.nome}")
    print(f"   Peticionário: {peticao.peticionario_nome}")
    print(f"   Assunto: {peticao.assunto}")
    
    # Verificar se foi criado documento na caixa de entrada
    documento_caixa = CaixaEntrada.objects.filter(
        content_type__model='peticaoeletronica',
        object_id=peticao.id
    ).first()
    
    if documento_caixa:
        print(f"\n📬 Documento na caixa de entrada:")
        print(f"   Número: {documento_caixa.numero_protocolo}")
        print(f"   Tipo: {documento_caixa.tipo_documento}")
        print(f"   Assunto: {documento_caixa.assunto}")
        print(f"   Setor Destino: {documento_caixa.setor_destino}")
        print(f"   Status: {documento_caixa.status}")
        
        # Verificar se chegou na caixa correta
        if documento_caixa.setor_destino == 'Jurídico':
            print("✅ PETIÇÃO CHEGOU NA CAIXA CORRETA (Jurídico)")
        else:
            print(f"❌ PETIÇÃO CHEGOU NA CAIXA ERRADA: {documento_caixa.setor_destino}")
    else:
        print("❌ Documento não foi criado na caixa de entrada!")
    
    return peticao, documento_caixa

def verificar_caixas_geral():
    """Verifica o estado geral das caixas de entrada"""
    
    print("\n📊 VERIFICANDO CAIXAS DE ENTRADA")
    print("=" * 50)
    
    # Contar documentos por setor
    documentos_fiscalizacao = CaixaEntrada.objects.filter(setor_destino='Fiscalização')
    documentos_juridico = CaixaEntrada.objects.filter(setor_destino='Jurídico')
    documentos_atendimento = CaixaEntrada.objects.filter(setor_destino='Atendimento')
    
    print(f"📬 Caixa Fiscalização: {documentos_fiscalizacao.count()} documentos")
    print(f"📬 Caixa Jurídico: {documentos_juridico.count()} documentos")
    print(f"📬 Caixa Atendimento: {documentos_atendimento.count()} documentos")
    
    # Contar por tipo de documento
    denuncias = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA')
    peticoes = CaixaEntrada.objects.filter(tipo_documento='PETICAO')
    autos = CaixaEntrada.objects.filter(tipo_documento='AUTO_INFRACAO')
    
    print(f"\n📋 Por tipo de documento:")
    print(f"   Denúncias: {denuncias.count()}")
    print(f"   Petições: {peticoes.count()}")
    print(f"   Autos de Infração: {autos.count()}")
    
    # Mostrar últimos documentos
    print(f"\n📋 ÚLTIMOS DOCUMENTOS:")
    ultimos = CaixaEntrada.objects.order_by('-data_entrada')[:5]
    for doc in ultimos:
        print(f"   {doc.numero_protocolo} - {doc.tipo_documento} - {doc.setor_destino} - {doc.assunto[:50]}...")

def main():
    """Função principal"""
    print("🚀 INICIANDO TESTE DE FLUXO COMPLETO")
    print("=" * 60)
    
    # Testar fluxo de denúncias
    denuncia, doc_denuncia = testar_fluxo_denuncias()
    
    # Testar fluxo de petições
    peticao, doc_peticao = testar_fluxo_peticoes()
    
    # Verificar estado geral das caixas
    verificar_caixas_geral()
    
    # Resumo final
    print("\n📊 RESUMO DOS TESTES")
    print("=" * 30)
    
    sucessos = 0
    total = 0
    
    if doc_denuncia and doc_denuncia.setor_destino == 'Fiscalização':
        print("✅ Denúncia chegou na caixa correta (Fiscalização)")
        sucessos += 1
    else:
        print("❌ Denúncia não chegou na caixa correta")
    total += 1
    
    if doc_peticao and doc_peticao.setor_destino == 'Jurídico':
        print("✅ Petição chegou na caixa correta (Jurídico)")
        sucessos += 1
    else:
        print("❌ Petição não chegou na caixa correta")
    total += 1
    
    print(f"\n🎯 RESULTADO: {sucessos}/{total} fluxos funcionando corretamente")
    
    if sucessos == total:
        print("🎉 TODOS OS FLUXOS ESTÃO FUNCIONANDO PERFEITAMENTE!")
    else:
        print("⚠️  ALGUNS FLUXOS PRECISAM DE AJUSTE")
    
    return sucessos == total

if __name__ == "__main__":
    main()

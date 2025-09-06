#!/usr/bin/env python3
"""
Script para testar o fluxo de documentos nas caixas de entrada
Testa se denúncias chegam na caixa da fiscalização e peticionamentos no jurídico
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from caixa_entrada.models import CaixaEntrada, HistoricoCaixaEntrada
from fiscalizacao.models import AutoInfracao
from peticionamento.models import PeticaoEletronica, TipoPeticao

def criar_usuario_teste():
    """Cria usuário de teste se não existir"""
    try:
        usuario = User.objects.get(username='teste_sistema')
        print(f"✅ Usuário de teste já existe: {usuario.username}")
    except User.DoesNotExist:
        usuario = User.objects.create_user(
            username='teste_sistema',
            email='teste@procon.gov.br',
            password='teste123',
            first_name='Sistema',
            last_name='Teste',
            is_staff=True
        )
        print(f"✅ Usuário de teste criado: {usuario.username}")
    
    return usuario

def criar_tipo_peticao_teste():
    """Cria tipo de petição de teste"""
    try:
        tipo = TipoPeticao.objects.get(categoria='RECURSO')
        print(f"✅ Tipo de petição já existe: {tipo.nome}")
    except TipoPeticao.DoesNotExist:
        tipo = TipoPeticao.objects.create(
            nome='Recurso Administrativo',
            categoria='RECURSO',
            descricao='Recurso administrativo para testar caixa de entrada'
        )
        print(f"✅ Tipo de petição criado: {tipo.nome}")
    
    return tipo

def testar_denuncia_fiscalizacao():
    """Testa se denúncia chega na caixa da fiscalização"""
    print("\n" + "="*60)
    print("🧪 TESTANDO DENÚNCIA → CAIXA FISCALIZAÇÃO")
    print("="*60)
    
    try:
        # Criar auto de infração (simula denúncia)
        auto = AutoInfracao.objects.create(
            numero='TEST-001/2025',
            data_fiscalizacao=datetime.now().date(),
            hora_fiscalizacao=datetime.now().time(),
            razao_social='Empresa Teste Denúncia Ltda',
            nome_fantasia='Empresa Teste',
            atividade='Comércio de Teste',
            endereco='Rua Teste, 123',
            cnpj='12.345.678/0001-90',
            telefone='(92) 99999-9999',
            relatorio='Relatório de teste para denúncia',
            base_legal_cdc='Art. 39 do CDC',
            valor_multa=5000.00,
            responsavel_nome='João Teste',
            responsavel_cpf='123.456.789-00',
            fiscal_nome='Fiscal Teste',
            status='autuado'
        )
        
        print(f"✅ Auto de infração criado: {auto.numero}")
        
        # Verificar se documento foi criado na caixa de entrada
        documento_caixa = CaixaEntrada.objects.filter(
            content_type=ContentType.objects.get_for_model(auto),
            object_id=auto.id
        ).first()
        
        if documento_caixa:
            print(f"✅ Documento criado na caixa de entrada:")
            print(f"   📄 Protocolo: {documento_caixa.numero_protocolo}")
            print(f"   📬 Setor Destino: {documento_caixa.setor_destino}")
            print(f"   📋 Tipo: {documento_caixa.tipo_documento}")
            print(f"   🏢 Empresa: {documento_caixa.empresa_nome}")
            print(f"   ⚡ Prioridade: {documento_caixa.prioridade}")
            
            # Verificar se chegou na caixa da fiscalização
            if documento_caixa.setor_destino == 'Fiscalização':
                print("✅ SUCESSO: Denúncia chegou na caixa da Fiscalização!")
                return True
            else:
                print(f"❌ ERRO: Denúncia foi para {documento_caixa.setor_destino}, deveria ir para Fiscalização")
                return False
        else:
            print("❌ ERRO: Documento não foi criado na caixa de entrada")
            return False
            
    except Exception as e:
        print(f"❌ ERRO ao testar denúncia: {e}")
        return False

def testar_peticionamento_juridico():
    """Testa se peticionamento chega na caixa do jurídico"""
    print("\n" + "="*60)
    print("🧪 TESTANDO PETICIONAMENTO → CAIXA JURÍDICO")
    print("="*60)
    
    try:
        # Criar tipo de petição
        tipo_peticao = criar_tipo_peticao_teste()
        
        # Criar petição eletrônica
        peticao = PeticaoEletronica.objects.create(
            tipo_peticao=tipo_peticao,
            origem='PORTAL_CIDADAO',
            assunto='Recurso Administrativo - Teste',
            descricao='Petição de teste para verificar fluxo da caixa de entrada',
            peticionario_nome='Advogado Teste',
            peticionario_documento='123.456.789-00',
            peticionario_email='advogado@teste.com',
            peticionario_telefone='(92) 88888-8888',
            peticionario_endereco='Rua do Advogado, 456',
            empresa_nome='Empresa Teste Peticionamento',
            empresa_cnpj='98.765.432/0001-10',
            status='ENVIADA',
            ip_origem='127.0.0.1',
            user_agent='Script de Teste'
        )
        
        print(f"✅ Petição eletrônica criada: {peticao.numero_peticao}")
        
        # Verificar se documento foi criado na caixa de entrada
        documento_caixa = CaixaEntrada.objects.filter(
            content_type=ContentType.objects.get_for_model(peticao),
            object_id=peticao.id
        ).first()
        
        if documento_caixa:
            print(f"✅ Documento criado na caixa de entrada:")
            print(f"   📄 Protocolo: {documento_caixa.numero_protocolo}")
            print(f"   📬 Setor Destino: {documento_caixa.setor_destino}")
            print(f"   📋 Tipo: {documento_caixa.tipo_documento}")
            print(f"   👤 Peticionário: {documento_caixa.remetente_nome}")
            print(f"   ⚡ Prioridade: {documento_caixa.prioridade}")
            
            # Verificar se chegou na caixa do jurídico
            if documento_caixa.setor_destino == 'Jurídico':
                print("✅ SUCESSO: Peticionamento chegou na caixa do Jurídico!")
                return True
            else:
                print(f"❌ ERRO: Peticionamento foi para {documento_caixa.setor_destino}, deveria ir para Jurídico")
                return False
        else:
            print("❌ ERRO: Documento não foi criado na caixa de entrada")
            return False
            
    except Exception as e:
        print(f"❌ ERRO ao testar peticionamento: {e}")
        return False

def verificar_caixas_entrada():
    """Verifica o conteúdo atual das caixas de entrada"""
    print("\n" + "="*60)
    print("📬 VERIFICANDO CAIXAS DE ENTRADA")
    print("="*60)
    
    # Contar documentos por setor
    setores = ['Atendimento', 'Fiscalização', 'Jurídico', 'Financeiro', 'Diretoria']
    
    for setor in setores:
        count = CaixaEntrada.objects.filter(setor_destino=setor).count()
        print(f"📬 {setor}: {count} documento(s)")
        
        # Mostrar últimos 3 documentos
        documentos = CaixaEntrada.objects.filter(
            setor_destino=setor
        ).order_by('-data_entrada')[:3]
        
        for doc in documentos:
            print(f"   • {doc.numero_protocolo} - {doc.assunto[:50]}...")

def limpar_dados_teste():
    """Remove dados de teste criados"""
    print("\n" + "="*60)
    print("🧹 LIMPANDO DADOS DE TESTE")
    print("="*60)
    
    try:
        # Remover documentos de teste da caixa de entrada
        docs_removidos = CaixaEntrada.objects.filter(
            assunto__icontains='Teste'
        ).delete()
        print(f"✅ {docs_removidos[0]} documentos de teste removidos da caixa de entrada")
        
        # Remover autos de teste
        autos_removidos = AutoInfracao.objects.filter(
            numero__icontains='TEST'
        ).delete()
        print(f"✅ {autos_removidos[0]} autos de teste removidos")
        
        # Remover petições de teste
        peticoes_removidas = PeticaoEletronica.objects.filter(
            assunto__icontains='Teste'
        ).delete()
        print(f"✅ {peticoes_removidas[0]} petições de teste removidas")
        
    except Exception as e:
        print(f"❌ ERRO ao limpar dados: {e}")

def main():
    """Função principal do teste"""
    print("🚀 INICIANDO TESTE DE FLUXO DAS CAIXAS DE ENTRADA")
    print("="*60)
    
    # Criar usuário de teste
    usuario = criar_usuario_teste()
    
    # Verificar estado inicial
    print("\n📊 ESTADO INICIAL DAS CAIXAS:")
    verificar_caixas_entrada()
    
    # Executar testes
    sucesso_denuncia = testar_denuncia_fiscalizacao()
    sucesso_peticionamento = testar_peticionamento_juridico()
    
    # Verificar estado final
    print("\n📊 ESTADO FINAL DAS CAIXAS:")
    verificar_caixas_entrada()
    
    # Resultado final
    print("\n" + "="*60)
    print("📋 RESULTADO DOS TESTES")
    print("="*60)
    
    if sucesso_denuncia:
        print("✅ DENÚNCIA: Fluxo funcionando corretamente")
    else:
        print("❌ DENÚNCIA: Problema no fluxo")
    
    if sucesso_peticionamento:
        print("✅ PETICIONAMENTO: Fluxo funcionando corretamente")
    else:
        print("❌ PETICIONAMENTO: Problema no fluxo")
    
    if sucesso_denuncia and sucesso_peticionamento:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("✅ As denúncias chegam na caixa da Fiscalização")
        print("✅ Os peticionamentos chegam na caixa do Jurídico")
    else:
        print("\n⚠️ ALGUNS TESTES FALHARAM!")
        print("Verifique os logs acima para identificar os problemas")
    
    # Perguntar se quer limpar dados de teste
    resposta = input("\n🧹 Deseja limpar os dados de teste? (s/n): ").lower()
    if resposta in ['s', 'sim', 'y', 'yes']:
        limpar_dados_teste()
        print("✅ Dados de teste removidos")
    else:
        print("ℹ️ Dados de teste mantidos para inspeção manual")

if __name__ == '__main__':
    main()

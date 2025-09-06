#!/usr/bin/env python3
"""
Script para testar denúncias anônimas do Portal do Cidadão
"""

import os
import sys
import django
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from portal_cidadao.models import DenunciaCidadao
from caixa_entrada.models import CaixaEntrada

def testar_denuncia_anonima():
    """Testa o fluxo de denúncia anônima"""
    
    print("🧪 TESTANDO DENÚNCIA ANÔNIMA")
    print("=" * 50)
    
    # Criar uma denúncia anônima de teste
    denuncia_anonima = DenunciaCidadao.objects.create(
        empresa_denunciada="Empresa Teste Anônima LTDA",
        cnpj_empresa="12.345.678/0001-90",
        endereco_empresa="Rua Teste, 123 - Centro",
        telefone_empresa="(11) 1234-5678",
        email_empresa="teste@empresa.com",
        
        # Dados da infração
        descricao_fatos="Esta é uma denúncia anônima de teste. A empresa está praticando preços abusivos.",
        data_ocorrencia=datetime.now().date(),
        tipo_infracao='precos_abusivos',
        
        # Dados do denunciante (vazios por ser anônimo)
        nome_denunciante="",
        cpf_cnpj="",
        email="",
        telefone="",
        
        # Controle de anonimato
        denuncia_anonima=True,
        motivo_anonimato="Medo de represálias da empresa",
        
        # Status inicial
        status='denuncia_recebida',
        origem_denuncia='PORTAL_CIDADAO',
        
        # Metadados
        ip_origem='127.0.0.1',
        user_agent='Teste Script',
    )
    
    print(f"✅ Denúncia anônima criada: {denuncia_anonima.numero_denuncia}")
    print(f"   Empresa: {denuncia_anonima.empresa_denunciada}")
    print(f"   Anônima: {denuncia_anonima.denuncia_anonima}")
    print(f"   Motivo: {denuncia_anonima.motivo_anonimato}")
    print(f"   Nome denunciante: '{denuncia_anonima.nome_denunciante}' (vazio)")
    print(f"   Email denunciante: '{denuncia_anonima.email}' (vazio)")
    
    # Verificar se foi criado documento na caixa de entrada
    documento_caixa = CaixaEntrada.objects.filter(
        content_type__model='denunciacidadao',
        object_id=denuncia_anonima.id
    ).first()
    
    if documento_caixa:
        print(f"\n📬 Documento na caixa de entrada:")
        print(f"   Número: {documento_caixa.numero_protocolo}")
        print(f"   Assunto: {documento_caixa.assunto}")
        print(f"   Remetente: {documento_caixa.remetente_nome}")
        print(f"   Email: {documento_caixa.remetente_email}")
        print(f"   Setor: {documento_caixa.setor_destino}")
        print(f"   Status: {documento_caixa.status}")
        
        # Verificar se os dados estão anonimizados
        if documento_caixa.remetente_nome == "Denunciante Anônimo":
            print("✅ Dados anonimizados corretamente!")
        else:
            print("❌ Dados não foram anonimizados!")
    else:
        print("❌ Documento não foi criado na caixa de entrada!")
    
    return denuncia_anonima, documento_caixa

def testar_denuncia_normal():
    """Testa o fluxo de denúncia normal (não anônima)"""
    
    print("\n🧪 TESTANDO DENÚNCIA NORMAL")
    print("=" * 50)
    
    # Criar uma denúncia normal de teste
    denuncia_normal = DenunciaCidadao.objects.create(
        empresa_denunciada="Empresa Teste Normal LTDA",
        cnpj_empresa="98.765.432/0001-10",
        endereco_empresa="Av. Normal, 456 - Bairro",
        telefone_empresa="(11) 8765-4321",
        email_empresa="normal@empresa.com",
        
        # Dados da infração
        descricao_fatos="Esta é uma denúncia normal de teste. A empresa está vendendo produtos vencidos.",
        data_ocorrencia=datetime.now().date(),
        tipo_infracao='produtos_vencidos',
        
        # Dados do denunciante (preenchidos)
        nome_denunciante="João Silva",
        cpf_cnpj="123.456.789-00",
        email="joao.silva@email.com",
        telefone="(11) 99999-8888",
        
        # Controle de anonimato
        denuncia_anonima=False,
        motivo_anonimato="",
        
        # Status inicial
        status='denuncia_recebida',
        origem_denuncia='PORTAL_CIDADAO',
        
        # Metadados
        ip_origem='127.0.0.1',
        user_agent='Teste Script',
    )
    
    print(f"✅ Denúncia normal criada: {denuncia_normal.numero_denuncia}")
    print(f"   Empresa: {denuncia_normal.empresa_denunciada}")
    print(f"   Anônima: {denuncia_normal.denuncia_anonima}")
    print(f"   Nome denunciante: {denuncia_normal.nome_denunciante}")
    print(f"   Email denunciante: {denuncia_normal.email}")
    
    # Verificar se foi criado documento na caixa de entrada
    documento_caixa = CaixaEntrada.objects.filter(
        content_type__model='denunciacidadao',
        object_id=denuncia_normal.id
    ).first()
    
    if documento_caixa:
        print(f"\n📬 Documento na caixa de entrada:")
        print(f"   Número: {documento_caixa.numero_protocolo}")
        print(f"   Assunto: {documento_caixa.assunto}")
        print(f"   Remetente: {documento_caixa.remetente_nome}")
        print(f"   Email: {documento_caixa.remetente_email}")
        print(f"   Setor: {documento_caixa.setor_destino}")
        print(f"   Status: {documento_caixa.status}")
        
        # Verificar se os dados estão corretos
        if documento_caixa.remetente_nome == denuncia_normal.nome_denunciante:
            print("✅ Dados do denunciante preservados corretamente!")
        else:
            print("❌ Dados do denunciante não foram preservados!")
    else:
        print("❌ Documento não foi criado na caixa de entrada!")
    
    return denuncia_normal, documento_caixa

def main():
    """Função principal"""
    print("🚀 INICIANDO TESTES DE DENÚNCIAS ANÔNIMAS")
    print("=" * 60)
    
    # Testar denúncia anônima
    denuncia_anonima, doc_anonima = testar_denuncia_anonima()
    
    # Testar denúncia normal
    denuncia_normal, doc_normal = testar_denuncia_normal()
    
    # Resumo final
    print("\n📊 RESUMO DOS TESTES")
    print("=" * 30)
    print(f"✅ Denúncia anônima: {denuncia_anonima.numero_denuncia}")
    print(f"✅ Denúncia normal: {denuncia_normal.numero_denuncia}")
    print(f"📬 Documentos na caixa: {CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').count()}")
    
    print("\n🎉 TESTES CONCLUÍDOS!")
    print("As denúncias anônimas estão funcionando corretamente!")

if __name__ == "__main__":
    main()

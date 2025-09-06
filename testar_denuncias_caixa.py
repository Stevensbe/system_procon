#!/usr/bin/env python3
"""
Script para testar se as denúncias do Portal do Cidadão estão chegando na Caixa de Entrada
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

def testar_fluxo_denuncias():
    """Testa o fluxo completo de denúncias"""
    
    print("🧪 TESTANDO FLUXO DE DENÚNCIAS")
    print("=" * 50)
    
    # 1. Verificar se existem denúncias no banco
    denuncias = DenunciaCidadao.objects.all()
    print(f"📊 Total de denúncias no banco: {denuncias.count()}")
    
    if denuncias.exists():
        print("\n📋 ÚLTIMAS DENÚNCIAS:")
        for denuncia in denuncias.order_by('-criado_em')[:5]:
            print(f"  • {denuncia.numero_denuncia} - {denuncia.empresa_denunciada}")
            print(f"    Status: {denuncia.status}")
            print(f"    Criado: {denuncia.criado_em}")
            print()
    
    # 2. Verificar se existem documentos na caixa de entrada
    documentos_caixa = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA')
    print(f"📬 Total de documentos DENÚNCIA na caixa: {documentos_caixa.count()}")
    
    if documentos_caixa.exists():
        print("\n📥 ÚLTIMOS DOCUMENTOS NA CAIXA DE DENÚNCIAS:")
        for doc in documentos_caixa.order_by('-criado_em')[:5]:
            print(f"  • {doc.numero_protocolo} - {doc.assunto}")
            print(f"    Setor: {doc.setor_destino}")
            print(f"    Status: {doc.status}")
            print(f"    Criado: {doc.criado_em}")
            print()
    
    # 3. Criar uma denúncia de teste
    print("🔧 CRIANDO DENÚNCIA DE TESTE...")
    try:
        denuncia_teste = DenunciaCidadao.objects.create(
            empresa_denunciada="Empresa Teste LTDA",
            cnpj_empresa="12.345.678/0001-90",
            endereco_empresa="Rua Teste, 123 - Centro",
            telefone_empresa="(11) 99999-9999",
            email_empresa="teste@empresa.com",
            
            descricao_fatos="Esta é uma denúncia de teste para verificar o fluxo",
            data_ocorrencia=datetime.now().date(),
            tipo_infracao="teste",
            
            nome_denunciante="João Teste",
            cpf_cnpj="123.456.789-00",
            email="joao@teste.com",
            telefone="(11) 88888-8888",
            
            status="denuncia_recebida",
            origem_denuncia="PORTAL_CIDADAO",
            
            ip_origem="127.0.0.1",
            user_agent="Script de Teste"
        )
        
        print(f"✅ Denúncia criada: {denuncia_teste.numero_denuncia}")
        
        # Aguardar um pouco para o signal processar
        import time
        time.sleep(2)
        
        # Verificar se o documento foi criado na caixa
        documento_caixa = CaixaEntrada.objects.filter(
            tipo_documento='DENUNCIA',
            content_type__model='denunciacidadao',
            object_id=denuncia_teste.id
        ).first()
        
        if documento_caixa:
            print(f"✅ Documento criado na caixa: {documento_caixa.numero_protocolo}")
            print(f"   Setor destino: {documento_caixa.setor_destino}")
            print(f"   Status: {documento_caixa.status}")
        else:
            print("❌ Documento NÃO foi criado na caixa de entrada!")
            
    except Exception as e:
        print(f"❌ Erro ao criar denúncia de teste: {e}")
    
    # 4. Estatísticas finais
    print("\n📊 ESTATÍSTICAS FINAIS:")
    print(f"  • Denúncias totais: {DenunciaCidadao.objects.count()}")
    print(f"  • Documentos na caixa: {CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').count()}")
    print(f"  • Documentos por setor:")
    
    for setor in CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').values('setor_destino').distinct():
        count = CaixaEntrada.objects.filter(
            tipo_documento='DENUNCIA', 
            setor_destino=setor['setor_destino']
        ).count()
        print(f"    - {setor['setor_destino']}: {count}")

if __name__ == "__main__":
    testar_fluxo_denuncias()

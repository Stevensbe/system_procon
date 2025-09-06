#!/usr/bin/env python
"""
Script para testar a integração entre denúncias do Portal do Cidadão e Caixa de Entrada
"""

import os
import sys
import django
from datetime import datetime

# Configurar Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'procon_system'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from portal_cidadao.models import DenunciaCidadao
from caixa_entrada.models import CaixaEntrada

def testar_integracao():
    """Testa se denúncia do portal cai na caixa de entrada"""
    
    print("🧪 Testando integração denúncia → caixa de entrada...")
    
    # Contar documentos antes
    count_before = CaixaEntrada.objects.count()
    print(f"📊 Documentos na caixa de entrada antes: {count_before}")
    
    # Criar denúncia de teste
    denuncia_dados = {
        'empresa_denunciada': 'Empresa Teste Ltda',
        'cnpj_empresa': '12.345.678/0001-90',
        'endereco_empresa': 'Rua Teste, 123 - Centro',
        'telefone_empresa': '(92) 3234-5678',
        'email_empresa': 'contato@empresateste.com.br',
        'descricao_fatos': 'Cobrança indevida de taxa não autorizada pelo órgão regulador.',
        'data_ocorrencia': datetime.now().date(),
        'tipo_infracao': 'cobranca_indevida',
        'nome_denunciante': 'João da Silva',
        'cpf_cnpj': '123.456.789-00',
        'email': 'joao.silva@email.com',
        'telefone': '(92) 9 9999-9999',
        'denuncia_anonima': False,
        'status': 'denuncia_recebida',
        'origem_denuncia': 'PORTAL_CIDADAO',
        'ip_origem': '192.168.1.100'
    }
    
    try:
        # Criar denúncia
        denuncia = DenunciaCidadao.objects.create(**denuncia_dados)
        print(f"✅ Denúncia criada: {denuncia.numero_denuncia}")
        
        # Aguardar signal
        import time
        time.sleep(2)
        
        # Verificar se documento foi criado na caixa de entrada
        count_after = CaixaEntrada.objects.count()
        print(f"📊 Documentos na caixa de entrada depois: {count_after}")
        
        if count_after > count_before:
            # Buscar o documento criado
            documento = CaixaEntrada.objects.filter(
                tipo_documento='DENUNCIA',
                origem='PORTAL_CIDADAO'
            ).order_by('-data_entrada').first()
            
            if documento:
                print(f"🎉 SUCESSO! Documento criado na caixa de entrada:")
                print(f"   📋 Protocolo: {documento.numero_protocolo}")
                print(f"   📄 Tipo: {documento.get_tipo_documento_display()}")
                print(f"   📝 Assunto: {documento.assunto}")
                print(f"   🏢 Setor: {documento.setor_destino}")
                print(f"   ⚡ Prioridade: {documento.get_prioridade_display()}")
                print(f"   📅 Data: {documento.data_entrada.strftime('%d/%m/%Y %H:%M:%S')}")
                
                # Verificar histórico
                historico = documento.historico.all()
                if historico:
                    print(f"   📜 Histórico: {historico.count()} entradas")
                    for h in historico:
                        print(f"      - {h.get_acao_display()}: {h.detalhes}")
                
                print("✅ Integração funcionando corretamente!")
                return True
            else:
                print("❌ Documento não encontrado na caixa de entrada")
                return False
        else:
            print("❌ Nenhum documento foi criado na caixa de entrada")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao criar denúncia: {e}")
        import traceback
        traceback.print_exc()
        return False

def testar_denuncia_anonima():
    """Testa denúncia anônima"""
    
    print("\n🔒 Testando denúncia anônima...")
    
    denuncia_dados = {
        'empresa_denunciada': 'Empresa Anônima Teste Ltda',
        'cnpj_empresa': '98.765.432/0001-10',
        'descricao_fatos': 'Prática comercial abusiva observada por consumidor anônimo.',
        'data_ocorrencia': datetime.now().date(),
        'tipo_infracao': 'pratica_abusiva',
        'denuncia_anonima': True,
        'motivo_anonimato': 'Medo de retaliação',
        'status': 'denuncia_recebida',
        'origem_denuncia': 'PORTAL_CIDADAO',
        'ip_origem': '192.168.1.200'
    }
    
    try:
        denuncia = DenunciaCidadao.objects.create(**denuncia_dados)
        print(f"✅ Denúncia anônima criada: {denuncia.numero_denuncia}")
        
        # Aguardar signal
        import time
        time.sleep(2)
        
        # Verificar documento na caixa de entrada
        documento = CaixaEntrada.objects.filter(
            tipo_documento='DENUNCIA',
            origem='PORTAL_CIDADAO',
            remetente_nome='Denunciante Anônimo'
        ).order_by('-data_entrada').first()
        
        if documento:
            print(f"🎉 SUCESSO! Denúncia anônima na caixa de entrada:")
            print(f"   📋 Protocolo: {documento.numero_protocolo}")
            print(f"   👤 Remetente: {documento.remetente_nome}")
            print(f"   📧 Email: {documento.remetente_email}")
            print(f"   📞 Telefone: {documento.remetente_telefone}")
            return True
        else:
            print("❌ Denúncia anônima não encontrada na caixa de entrada")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao criar denúncia anônima: {e}")
        return False

def verificar_configuracao():
    """Verifica se a configuração está correta"""
    
    print("\n🔧 Verificando configuração...")
    
    # Verificar se apps estão instalados
    from django.conf import settings
    apps_required = ['portal_cidadao', 'caixa_entrada']
    
    for app in apps_required:
        if any(app in installed_app for installed_app in settings.INSTALLED_APPS):
            print(f"✅ App '{app}' está instalado")
        else:
            print(f"❌ App '{app}' NÃO está instalado")
    
    # Verificar se tabelas existem
    try:
        count_denuncias = DenunciaCidadao.objects.count()
        print(f"✅ Tabela portal_cidadao_denunciacidadao: {count_denuncias} registros")
    except Exception as e:
        print(f"❌ Tabela portal_cidadao_denunciacidadao: {e}")
    
    try:
        count_caixa = CaixaEntrada.objects.count()
        print(f"✅ Tabela caixa_entrada_caixaentrada: {count_caixa} registros")
    except Exception as e:
        print(f"❌ Tabela caixa_entrada_caixaentrada: {e}")
    
    # Verificar signals
    try:
        from caixa_entrada import signals
        print("✅ Signals do caixa_entrada importados")
    except Exception as e:
        print(f"❌ Erro ao importar signals: {e}")

def main():
    """Função principal"""
    
    print("=" * 60)
    print("🧪 TESTE DE INTEGRAÇÃO DENÚNCIA → CAIXA DE ENTRADA")
    print("=" * 60)
    
    # Verificar configuração
    verificar_configuracao()
    
    # Testar denúncia normal
    sucesso1 = testar_integracao()
    
    # Testar denúncia anônima
    sucesso2 = testar_denuncia_anonima()
    
    print("\n" + "=" * 60)
    if sucesso1 and sucesso2:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("✅ A integração está funcionando corretamente.")
    else:
        print("❌ ALGUNS TESTES FALHARAM!")
        print("🔧 Verifique a configuração e execute novamente.")
    print("=" * 60)

if __name__ == "__main__":
    main()
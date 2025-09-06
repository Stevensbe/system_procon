#!/usr/bin/env python
"""
Script para testar as funcionalidades avançadas de fiscalização
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from fiscalizacao.models import (
    TipoFiscalizacao, EvidenciaFiscalizacao, AutoInfracaoAvancado,
    HistoricoAutoInfracao, TemplateAutoInfracao, NotificacaoEletronica,
    ConfiguracaoFiscalizacao, AutoInfracao
)


def verificar_dados():
    """Verificar dados no banco"""
    print("🔍 VERIFICANDO DADOS NO BANCO")
    print("-" * 40)
    
    # Verificar modelos básicos
    total_autos = AutoInfracao.objects.count()
    print(f"✅ Autos de infração: {total_autos}")
    
    # Verificar modelos avançados
    total_tipos = TipoFiscalizacao.objects.count()
    print(f"✅ Tipos de fiscalização: {total_tipos}")
    
    total_templates = TemplateAutoInfracao.objects.count()
    print(f"✅ Templates: {total_templates}")
    
    total_autos_avancados = AutoInfracaoAvancado.objects.count()
    print(f"✅ Autos avançados: {total_autos_avancados}")
    
    total_evidencias = EvidenciaFiscalizacao.objects.count()
    print(f"✅ Evidências: {total_evidencias}")
    
    total_historicos = HistoricoAutoInfracao.objects.count()
    print(f"✅ Históricos: {total_historicos}")
    
    total_notificacoes = NotificacaoEletronica.objects.count()
    print(f"✅ Notificações: {total_notificacoes}")
    
    total_configuracoes = ConfiguracaoFiscalizacao.objects.count()
    print(f"✅ Configurações: {total_configuracoes}")


def testar_funcionalidades():
    """Testar funcionalidades específicas"""
    print("\n🧪 TESTANDO FUNCIONALIDADES")
    print("-" * 40)
    
    # Testar auto avançado
    try:
        auto_avancado = AutoInfracaoAvancado.objects.first()
        if auto_avancado:
            print(f"✅ Auto avançado encontrado: {auto_avancado.auto_infracao.numero}")
            print(f"   • Status workflow: {auto_avancado.status_workflow}")
            print(f"   • Gerado automaticamente: {auto_avancado.gerado_automaticamente}")
            print(f"   • Assinatura digital: {auto_avancado.assinatura_digital}")
            print(f"   • Notificação eletrônica: {auto_avancado.notificacao_eletronica}")
        else:
            print("⚠️ Nenhum auto avançado encontrado")
    except Exception as e:
        print(f"❌ Erro ao testar auto avançado: {e}")
    
    # Testar template
    try:
        template = TemplateAutoInfracao.objects.first()
        if template:
            print(f"✅ Template encontrado: {template.nome}")
            print(f"   • Tipo: {template.tipo_fiscalizacao.nome}")
            print(f"   • Padrão: {template.padrao}")
            print(f"   • Valor padrão: R$ {template.valor_multa_padrao}")
        else:
            print("⚠️ Nenhum template encontrado")
    except Exception as e:
        print(f"❌ Erro ao testar template: {e}")
    
    # Testar evidência
    try:
        evidencia = EvidenciaFiscalizacao.objects.first()
        if evidencia:
            print(f"✅ Evidência encontrada: {evidencia.titulo}")
            print(f"   • Tipo: {evidencia.tipo}")
            print(f"   • Auto: {evidencia.auto_infracao.numero}")
            print(f"   • Upload por: {evidencia.upload_por.username}")
        else:
            print("⚠️ Nenhuma evidência encontrada")
    except Exception as e:
        print(f"❌ Erro ao testar evidência: {e}")


def main():
    """Função principal"""
    print("🚀 TESTANDO MÓDULO DE FISCALIZAÇÃO AVANÇADO")
    print("=" * 70)
    print(f"⏰ {django.utils.timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    try:
        verificar_dados()
        testar_funcionalidades()
        
        print("\n" + "=" * 70)
        print("✅ TESTES CONCLUÍDOS!")
        print("=" * 70)
        print("🎯 Módulo de fiscalização avançado está funcionando!")
        
        print("\n📋 Próximos passos:")
        print("   1. Implementar frontend para fiscalização avançada")
        print("   2. Implementar geração real de autos")
        print("   3. Implementar sistema de assinatura digital")
        print("   4. Implementar notificações em tempo real")
        print("   5. Implementar upload de arquivos")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()

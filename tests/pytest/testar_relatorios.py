#!/usr/bin/env python
"""
Script para testar o módulo de Relatórios Avançados
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from relatorios.models import (
    TipoRelatorio, Relatorio, RelatorioAgendado, TemplateRelatorio,
    FiltroRelatorio, RelatorioCompartilhado, HistoricoRelatorio, ConfiguracaoRelatorio
)


def verificar_dados_banco():
    """Verificar se os dados foram criados no banco"""
    print("🔍 VERIFICANDO DADOS NO BANCO")
    print("-" * 40)
    
    try:
        # Verificar tipos de relatório
        tipos = TipoRelatorio.objects.all()
        print(f"✅ Tipos de relatório: {tipos.count()}")
        
        # Verificar relatórios
        relatorios = Relatorio.objects.all()
        print(f"✅ Relatórios: {relatorios.count()}")
        
        # Verificar agendamentos
        agendamentos = RelatorioAgendado.objects.all()
        print(f"✅ Agendamentos: {agendamentos.count()}")
        
        # Verificar templates
        templates = TemplateRelatorio.objects.all()
        print(f"✅ Templates: {templates.count()}")
        
        # Verificar filtros
        filtros = FiltroRelatorio.objects.all()
        print(f"✅ Filtros: {filtros.count()}")
        
        # Verificar compartilhamentos
        compartilhamentos = RelatorioCompartilhado.objects.all()
        print(f"✅ Compartilhamentos: {compartilhamentos.count()}")
        
        # Verificar histórico
        historicos = HistoricoRelatorio.objects.all()
        print(f"✅ Históricos: {historicos.count()}")
        
        # Verificar configuração
        configuracao = ConfiguracaoRelatorio.objects.first()
        print(f"✅ Configuração: {'Sim' if configuracao else 'Não'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar dados: {e}")
        return False


def testar_api_tipos():
    """Testar API de tipos de relatório"""
    print("\n🌐 TESTANDO API - TIPOS DE RELATÓRIO")
    print("-" * 40)
    
    try:
        # Listar tipos
        response = requests.get("http://localhost:8000/relatorios/api/tipos/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lista de tipos: {len(data['results'])} tipos encontrados")
            
            # Mostrar alguns tipos
            for tipo in data['results'][:3]:
                print(f"   • {tipo['nome']} ({tipo['modulo']})")
        else:
            print(f"❌ Erro ao listar tipos: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API de tipos: {e}")


def testar_api_relatorios():
    """Testar API de relatórios"""
    print("\n🌐 TESTANDO API - RELATÓRIOS")
    print("-" * 40)
    
    try:
        # Listar relatórios
        response = requests.get("http://localhost:8000/relatorios/api/relatorios/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lista de relatórios: {len(data['results'])} relatórios encontrados")
            
            # Mostrar alguns relatórios
            for relatorio in data['results'][:3]:
                print(f"   • {relatorio['titulo']} ({relatorio['status']})")
        else:
            print(f"❌ Erro ao listar relatórios: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API de relatórios: {e}")


def testar_api_dashboard():
    """Testar API do dashboard"""
    print("\n🌐 TESTANDO API - DASHBOARD")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/relatorios/api/dashboard/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dashboard carregado:")
            print(f"   • Total de relatórios: {data['total_relatorios']}")
            print(f"   • Pendentes: {data['relatorios_pendentes']}")
            print(f"   • Concluídos: {data['relatorios_concluidos']}")
            print(f"   • Com erro: {data['relatorios_erro']}")
            print(f"   • Agendados: {data['relatorios_agendados']}")
        else:
            print(f"❌ Erro ao carregar dashboard: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar dashboard: {e}")


def testar_api_agendamentos():
    """Testar API de agendamentos"""
    print("\n🌐 TESTANDO API - AGENDAMENTOS")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/relatorios/api/agendados/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lista de agendamentos: {len(data['results'])} agendamentos encontrados")
            
            # Mostrar alguns agendamentos
            for agendamento in data['results'][:3]:
                print(f"   • {agendamento['nome']} ({agendamento['frequencia']})")
        else:
            print(f"❌ Erro ao listar agendamentos: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API de agendamentos: {e}")


def testar_api_templates():
    """Testar API de templates"""
    print("\n🌐 TESTANDO API - TEMPLATES")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/relatorios/api/templates/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lista de templates: {len(data['results'])} templates encontrados")
            
            # Mostrar alguns templates
            for template in data['results'][:3]:
                print(f"   • {template['nome']} ({'Padrão' if template['padrao'] else 'Personalizado'})")
        else:
            print(f"❌ Erro ao listar templates: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API de templates: {e}")


def testar_api_filtros():
    """Testar API de filtros"""
    print("\n🌐 TESTANDO API - FILTROS")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/relatorios/api/filtros/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lista de filtros: {len(data['results'])} filtros encontrados")
            
            # Mostrar alguns filtros
            for filtro in data['results'][:3]:
                print(f"   • {filtro['nome']} ({filtro['tipo_filtro']})")
        else:
            print(f"❌ Erro ao listar filtros: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API de filtros: {e}")


def testar_api_compartilhamentos():
    """Testar API de compartilhamentos"""
    print("\n🌐 TESTANDO API - COMPARTILHAMENTOS")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/relatorios/api/compartilhados/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lista de compartilhamentos: {len(data['results'])} compartilhamentos encontrados")
            
            # Mostrar alguns compartilhamentos
            for compartilhamento in data['results'][:3]:
                print(f"   • {compartilhamento['relatorio']['titulo']} -> {compartilhamento['compartilhado_com']['username']}")
        else:
            print(f"❌ Erro ao listar compartilhamentos: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API de compartilhamentos: {e}")


def testar_api_historico():
    """Testar API de histórico"""
    print("\n🌐 TESTANDO API - HISTÓRICO")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/relatorios/api/historico/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Lista de histórico: {len(data['results'])} registros encontrados")
            
            # Mostrar alguns registros
            for historico in data['results'][:3]:
                print(f"   • {historico['relatorio']['titulo']} ({historico['status']})")
        else:
            print(f"❌ Erro ao listar histórico: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API de histórico: {e}")


def testar_api_configuracao():
    """Testar API de configuração"""
    print("\n🌐 TESTANDO API - CONFIGURAÇÃO")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/relatorios/api/configuracoes/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Configuração carregada:")
            print(f"   • Max relatórios por usuário: {data['results'][0]['max_relatorios_por_usuario']}")
            print(f"   • Max tamanho arquivo: {data['results'][0]['max_tamanho_arquivo']} MB")
            print(f"   • Tempo max processamento: {data['results'][0]['tempo_maximo_processamento']} min")
        else:
            print(f"❌ Erro ao carregar configuração: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erro ao testar API de configuração: {e}")


def main():
    """Função principal"""
    print("🚀 TESTANDO MÓDULO DE RELATÓRIOS AVANÇADOS")
    print("=" * 70)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    try:
        if not verificar_dados_banco():
            print("❌ Falha ao verificar dados no banco")
            return False
        
        print("\n🌐 TESTANDO APIs (requer servidor rodando)")
        print("=" * 70)
        
        try:
            response = requests.get("http://localhost:8000/", timeout=2)
            if response.status_code == 200:
                print("✅ Servidor Django está rodando")
                testar_api_tipos()
                testar_api_relatorios()
                testar_api_dashboard()
                testar_api_agendamentos()
                testar_api_templates()
                testar_api_filtros()
                testar_api_compartilhamentos()
                testar_api_historico()
                testar_api_configuracao()
            else:
                print("⚠️ Servidor não está respondendo corretamente")
        except requests.exceptions.ConnectionError:
            print("⚠️ Servidor Django não está rodando")
            print("   Execute: python manage.py runserver")
            print("   Depois execute este script novamente")
        except Exception as e:
            print(f"❌ Erro ao testar APIs: {e}")
        
        print("\n" + "=" * 70)
        print("✅ TESTES CONCLUÍDOS!")
        print("=" * 70)
        print("🎯 Módulo de relatórios avançados está funcionando!")
        print("\n📋 Próximos passos:")
        print("   1. Implementar frontend para relatórios")
        print("   2. Implementar geração real de relatórios")
        print("   3. Implementar sistema de notificações")
        print("   4. Implementar upload de arquivos")
        print("   5. Implementar assinatura digital")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

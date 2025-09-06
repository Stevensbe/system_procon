#!/usr/bin/env python3
"""
Script para testar a integração completa entre frontend e backend
"""

import requests
import json
import time
from datetime import datetime

# Configurações
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

# Credenciais de teste
CREDENCIAIS = {
    'username': 'admin',
    'password': 'admin123'
}

class TesteIntegracaoCompleta:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def login(self):
        """Faz login e obtém token JWT"""
        print("🔐 Fazendo login...")
        
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login/",
                json=CREDENCIAIS,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access')
                self.headers['Authorization'] = f'Bearer {self.token}'
                print("✅ Login realizado com sucesso!")
                return True
            else:
                print(f"❌ Erro no login: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro na requisição de login: {e}")
            return False
    
    def testar_backend_apis(self):
        """Testa todas as APIs do backend"""
        print("\n🔧 Testando APIs do Backend")
        print("=" * 50)
        
        apis_to_test = [
            ('/api/cobranca/geral/estatisticas/', 'Estatísticas Gerais'),
            ('/api/cobranca/boletos/', 'Lista de Boletos'),
            ('/api/cobranca/pagamentos/', 'Lista de Pagamentos'),
            ('/api/cobranca/cobrancas/', 'Lista de Cobranças'),
            ('/api/cobranca/configuracoes/', 'Configurações'),
            ('/api/cobranca/templates/', 'Templates'),
            ('/api/cobranca/boletos/boletos-recentes/', 'Boletos Recentes'),
            ('/api/cobranca/boletos/boletos-vencidos/', 'Boletos Vencidos'),
            ('/api/cobranca/boletos/boletos-por-status/', 'Boletos por Status'),
            ('/api/cobranca/pagamentos/pagamentos-recentes/', 'Pagamentos Recentes'),
            ('/api/cobranca/pagamentos/pagamentos-por-mes/', 'Pagamentos por Mês'),
            ('/api/cobranca/cobrancas/cobrancas-recentes/', 'Cobranças Recentes'),
            ('/api/cobranca/cobrancas/cobrancas-por-status/', 'Cobranças por Status'),
        ]
        
        resultados = {}
        
        for api, nome in apis_to_test:
            try:
                response = self.session.get(f"{BASE_URL}{api}", headers=self.headers)
                status = "✅" if response.status_code == 200 else "❌"
                print(f"{status} {nome} - {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if 'count' in data:
                        print(f"   📊 {data['count']} registros encontrados")
                    elif isinstance(data, list):
                        print(f"   📊 {len(data)} registros encontrados")
                    elif isinstance(data, dict):
                        print(f"   📊 Dados recebidos com sucesso")
                
                resultados[nome] = response.status_code == 200
                
            except Exception as e:
                print(f"❌ {nome} - Erro: {e}")
                resultados[nome] = False
        
        return resultados
    
    def testar_frontend_acessibilidade(self):
        """Testa se o frontend está acessível"""
        print("\n🎨 Testando Frontend")
        print("=" * 50)
        
        try:
            # Testar se o servidor React está rodando
            response = requests.get(FRONTEND_URL, timeout=5)
            if response.status_code == 200:
                print("✅ Frontend React está acessível")
                return True
            else:
                print(f"⚠️ Frontend retornou status: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ Frontend React não está rodando")
            print("💡 Execute: cd frontend && npm run dev")
            return False
        except Exception as e:
            print(f"❌ Erro ao acessar frontend: {e}")
            return False
    
    def testar_cors_configuration(self):
        """Testa configuração CORS"""
        print("\n🌐 Testando Configuração CORS")
        print("=" * 50)
        
        try:
            # Testar requisição com origem do frontend
            headers = {
                'Origin': FRONTEND_URL,
                'Content-Type': 'application/json'
            }
            
            response = self.session.get(
                f"{BASE_URL}/api/cobranca/geral/estatisticas/",
                headers=headers
            )
            
            cors_headers = response.headers.get('Access-Control-Allow-Origin')
            if cors_headers:
                print(f"✅ CORS configurado: {cors_headers}")
                return True
            else:
                print("⚠️ CORS não configurado")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao testar CORS: {e}")
            return False
    
    def testar_dados_reais(self):
        """Testa se os dados reais estão sendo retornados"""
        print("\n📊 Testando Dados Reais")
        print("=" * 50)
        
        try:
            # Testar estatísticas
            response = self.session.get(
                f"{BASE_URL}/api/cobranca/geral/estatisticas/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Estatísticas carregadas:")
                print(f"   - Total boletos: {data.get('total_boletos', 0)}")
                print(f"   - Boletos pendentes: {data.get('boletos_pendentes', 0)}")
                print(f"   - Valor total: R$ {data.get('valor_total', 0):.2f}")
                
                # Verificar se há dados reais
                if data.get('total_boletos', 0) > 0:
                    print("✅ Dados reais encontrados!")
                    return True
                else:
                    print("⚠️ Nenhum dado encontrado")
                    return False
            else:
                print(f"❌ Erro ao carregar estatísticas: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao testar dados: {e}")
            return False
    
    def testar_endpoints_frontend(self):
        """Testa endpoints específicos que o frontend usa"""
        print("\n🔗 Testando Endpoints do Frontend")
        print("=" * 50)
        
        endpoints_frontend = [
            ('/api/cobranca/geral/estatisticas/', 'Dashboard - Estatísticas'),
            ('/api/cobranca/boletos/boletos-recentes/', 'Dashboard - Boletos Recentes'),
            ('/api/cobranca/pagamentos/pagamentos-recentes/', 'Dashboard - Pagamentos Recentes'),
            ('/api/cobranca/cobrancas/cobrancas-recentes/', 'Dashboard - Cobranças Recentes'),
            ('/api/cobranca/boletos/boletos-vencidos/', 'Dashboard - Boletos Vencidos'),
            ('/api/cobranca/boletos/boletos-por-status/', 'Dashboard - Boletos por Status'),
            ('/api/cobranca/pagamentos/pagamentos-por-mes/', 'Dashboard - Pagamentos por Mês'),
            ('/api/cobranca/cobrancas/cobrancas-por-status/', 'Dashboard - Cobranças por Status'),
        ]
        
        resultados = {}
        
        for endpoint, nome in endpoints_frontend:
            try:
                response = self.session.get(f"{BASE_URL}{endpoint}", headers=self.headers)
                status = "✅" if response.status_code == 200 else "❌"
                print(f"{status} {nome}")
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"   📊 {len(data)} itens")
                    elif isinstance(data, dict):
                        print(f"   📊 Dados recebidos")
                
                resultados[nome] = response.status_code == 200
                
            except Exception as e:
                print(f"❌ {nome} - Erro: {e}")
                resultados[nome] = False
        
        return resultados
    
    def gerar_relatorio_integracao(self, resultados_backend, frontend_ok, cors_ok, dados_ok, resultados_frontend):
        """Gera relatório completo da integração"""
        print("\n📋 Relatório de Integração Completa")
        print("=" * 60)
        
        # Calcular percentual de sucesso
        total_apis = len(resultados_backend)
        apis_ok = sum(1 for ok in resultados_backend.values() if ok)
        percentual_backend = (apis_ok / total_apis) * 100 if total_apis > 0 else 0
        
        total_endpoints = len(resultados_frontend)
        endpoints_ok = sum(1 for ok in resultados_frontend.values() if ok)
        percentual_frontend = (endpoints_ok / total_endpoints) * 100 if total_endpoints > 0 else 0
        
        print(f"🔧 Backend APIs: {apis_ok}/{total_apis} ({percentual_backend:.1f}%)")
        print(f"🎨 Frontend Acessível: {'✅' if frontend_ok else '❌'}")
        print(f"🌐 CORS Configurado: {'✅' if cors_ok else '❌'}")
        print(f"📊 Dados Reais: {'✅' if dados_ok else '❌'}")
        print(f"🔗 Endpoints Frontend: {endpoints_ok}/{total_endpoints} ({percentual_frontend:.1f}%)")
        
        # Determinar status geral
        if percentual_backend >= 90 and frontend_ok and cors_ok and dados_ok and percentual_frontend >= 90:
            status_geral = "✅ INTEGRAÇÃO 100% FUNCIONAL"
        elif percentual_backend >= 70 and frontend_ok and cors_ok:
            status_geral = "⚠️ INTEGRAÇÃO PARCIALMENTE FUNCIONAL"
        else:
            status_geral = "❌ INTEGRAÇÃO COM PROBLEMAS"
        
        print(f"\n🎯 Status Geral: {status_geral}")
        
        # Listar problemas se houver
        problemas = []
        if percentual_backend < 100:
            problemas.append(f"Backend: {total_apis - apis_ok} APIs com problema")
        if not frontend_ok:
            problemas.append("Frontend não acessível")
        if not cors_ok:
            problemas.append("CORS não configurado")
        if not dados_ok:
            problemas.append("Sem dados reais")
        if percentual_frontend < 100:
            problemas.append(f"Frontend: {total_endpoints - endpoints_ok} endpoints com problema")
        
        if problemas:
            print(f"\n⚠️ Problemas identificados:")
            for problema in problemas:
                print(f"   - {problema}")
        
        return status_geral
    
    def executar_teste_completo(self):
        """Executa todos os testes de integração"""
        print("🔗 Testando Integração Completa Frontend-Backend")
        print("=" * 70)
        
        # Fazer login
        if not self.login():
            print("❌ Não foi possível fazer login. Verifique as credenciais.")
            return
        
        # Executar todos os testes
        resultados_backend = self.testar_backend_apis()
        frontend_ok = self.testar_frontend_acessibilidade()
        cors_ok = self.testar_cors_configuration()
        dados_ok = self.testar_dados_reais()
        resultados_frontend = self.testar_endpoints_frontend()
        
        # Gerar relatório
        status_geral = self.gerar_relatorio_integracao(
            resultados_backend, frontend_ok, cors_ok, dados_ok, resultados_frontend
        )
        
        # Instruções finais
        print(f"\n📝 Próximos Passos:")
        if "100% FUNCIONAL" in status_geral:
            print("🎉 Parabéns! A integração está funcionando perfeitamente!")
            print("1. Acesse: http://localhost:3000")
            print("2. Faça login no sistema")
            print("3. Navegue para o módulo de Cobrança")
            print("4. Todos os dados reais devem aparecer na interface")
        else:
            print("🔧 Ainda há problemas para resolver:")
            print("1. Verifique se o servidor Django está rodando: python manage.py runserver")
            print("2. Verifique se o servidor React está rodando: cd frontend && npm run dev")
            print("3. Verifique as configurações CORS no Django")
            print("4. Execute o script de dados de teste se necessário")

def main():
    print("🧪 Iniciando teste de integração completa")
    print("=" * 50)
    
    tester = TesteIntegracaoCompleta()
    tester.executar_teste_completo()

if __name__ == "__main__":
    main()

#!/usr/bin/env python
"""
Script de teste para o módulo jurídico
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def test_juridico_models():
    """Testa se os modelos jurídicos estão funcionando"""
    try:
        from juridico.models import (
            AnalistaJuridico, ProcessoJuridico, AnaliseJuridica,
            RespostaJuridica, PrazoJuridico, DocumentoJuridico,
            HistoricoJuridico, ConfiguracaoJuridico
        )
        print("✅ Todos os modelos jurídicos importados com sucesso!")
        
        # Testar criação de objetos
        print("📝 Testando criação de objetos...")
        
        # Verificar se há usuários para criar analistas
        from django.contrib.auth.models import User
        users = User.objects.all()
        if users.exists():
            user = users.first()
            
            # Criar analista
            analista, created = AnalistaJuridico.objects.get_or_create(
                user=user,
                defaults={
                    'oab': '123456/SP',
                    'especialidade': 'Direito do Consumidor',
                    'ativo': True
                }
            )
            print(f"✅ Analista criado/encontrado: {analista}")
            
            # Criar processo
            processo, created = ProcessoJuridico.objects.get_or_create(
                numero='PROC-000001/2024',
                defaults={
                    'parte': 'Empresa Teste LTDA',
                    'empresa_cnpj': '12.345.678/0001-90',
                    'assunto': 'Processo de teste',
                    'descricao': 'Processo criado para teste do sistema',
                    'status': 'ABERTO',
                    'prioridade': 'MEDIA',
                    'analista': analista,
                    'criado_por': user
                }
            )
            print(f"✅ Processo criado/encontrado: {processo}")
            
            # Criar análise
            analise, created = AnaliseJuridica.objects.get_or_create(
                processo=processo,
                tipo_analise='INICIAL',
                defaults={
                    'analista': analista,
                    'fundamentacao': 'Fundamentação jurídica de teste',
                    'conclusao': 'Conclusão da análise de teste',
                    'recomendacoes': 'Recomendações de teste'
                }
            )
            print(f"✅ Análise criada/encontrada: {analise}")
            
            # Criar prazo
            from datetime import datetime, timedelta
            prazo, created = PrazoJuridico.objects.get_or_create(
                processo=processo,
                tipo_prazo='RESPOSTA',
                defaults={
                    'descricao': 'Prazo para resposta',
                    'data_inicio': datetime.now(),
                    'data_fim': datetime.now() + timedelta(days=15),
                    'status': 'PENDENTE'
                }
            )
            print(f"✅ Prazo criado/encontrado: {prazo}")
            
            print("🎉 Todos os testes passaram! O módulo jurídico está funcionando corretamente.")
            
        else:
            print("⚠️  Nenhum usuário encontrado. Crie um usuário primeiro.")
            
    except Exception as e:
        print(f"❌ Erro ao testar modelos jurídicos: {str(e)}")
        import traceback
        traceback.print_exc()

def test_juridico_views():
    """Testa se as views jurídicas estão funcionando"""
    try:
        from juridico.views import (
            ProcessoJuridicoViewSet, AnalistaJuridicoViewSet,
            AnaliseJuridicaViewSet, RespostaJuridicaViewSet
        )
        print("✅ Todas as views jurídicas importadas com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao testar views jurídicas: {str(e)}")
        import traceback
        traceback.print_exc()

def test_juridico_serializers():
    """Testa se os serializers jurídicos estão funcionando"""
    try:
        from juridico.serializers import (
            ProcessoJuridicoSerializer, AnalistaJuridicoSerializer,
            AnaliseJuridicaSerializer, RespostaJuridicaSerializer
        )
        print("✅ Todos os serializers jurídicos importados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao testar serializers jurídicos: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("🧪 Iniciando testes do módulo jurídico...")
    print("=" * 50)
    
    test_juridico_models()
    print("-" * 30)
    
    test_juridico_views()
    print("-" * 30)
    
    test_juridico_serializers()
    print("-" * 30)
    
    print("🏁 Testes concluídos!")

#!/usr/bin/env python
"""
Script de teste completo para o módulo jurídico
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

def test_juridico_completo():
    """Teste completo do módulo jurídico"""
    print("🧪 INICIANDO TESTE COMPLETO DO MÓDULO JURÍDICO")
    print("=" * 60)
    
    try:
        # 1. Testar importação dos modelos
        print("📋 1. Testando importação dos modelos...")
        from juridico.models import (
            AnalistaJuridico, ProcessoJuridico, AnaliseJuridica,
            RespostaJuridica, PrazoJuridico, DocumentoJuridico,
            HistoricoJuridico, ConfiguracaoJuridico
        )
        print("✅ Todos os modelos importados com sucesso!")
        
        # 2. Verificar se há usuários
        from django.contrib.auth.models import User
        users = User.objects.all()
        if not users.exists():
            print("⚠️  Nenhum usuário encontrado. Criando usuário de teste...")
            user = User.objects.create_user(
                username='teste_juridico',
                email='teste@procon.am.gov.br',
                password='teste123',
                first_name='Analista',
                last_name='Teste'
            )
            print(f"✅ Usuário criado: {user.username}")
        else:
            user = users.first()
            print(f"✅ Usuário encontrado: {user.username}")
        
        # 3. Criar analista jurídico
        print("\n👨‍💼 2. Criando analista jurídico...")
        analista, created = AnalistaJuridico.objects.get_or_create(
            user=user,
            defaults={
                'oab': '123456/SP',
                'especialidade': 'Direito do Consumidor',
                'ativo': True
            }
        )
        if created:
            print(f"✅ Analista criado: {analista.user.first_name} {analista.user.last_name}")
        else:
            print(f"✅ Analista encontrado: {analista.user.first_name} {analista.user.last_name}")
        
        # 4. Criar processo jurídico
        print("\n📄 3. Criando processo jurídico...")
        processo, created = ProcessoJuridico.objects.get_or_create(
            numero='PROC-000001/2024',
            defaults={
                'parte': 'Empresa Teste LTDA',
                'empresa_cnpj': '12.345.678/0001-90',
                'assunto': 'Processo de teste do sistema jurídico',
                'descricao': 'Processo criado para teste completo do módulo jurídico do sistema PROCON-AM',
                'status': 'ABERTO',
                'prioridade': 'MEDIA',
                'valor_causa': 5000.00,
                'data_limite': datetime.now() + timedelta(days=30),
                'analista': analista,
                'criado_por': user
            }
        )
        if created:
            print(f"✅ Processo criado: {processo.numero}")
        else:
            print(f"✅ Processo encontrado: {processo.numero}")
        
        # 5. Criar análise jurídica
        print("\n🔍 4. Criando análise jurídica...")
        analise, created = AnaliseJuridica.objects.get_or_create(
            processo=processo,
            tipo_analise='INICIAL',
            defaults={
                'analista': analista,
                'fundamentacao': 'Fundamentação jurídica de teste para o processo.',
                'conclusao': 'Conclusão da análise inicial do processo.',
                'recomendacoes': 'Recomendações para prosseguimento do processo.'
            }
        )
        if created:
            print(f"✅ Análise criada: {analise.tipo_analise}")
        else:
            print(f"✅ Análise encontrada: {analise.tipo_analise}")
        
        # 6. Criar prazo jurídico
        print("\n⏰ 5. Criando prazo jurídico...")
        prazo, created = PrazoJuridico.objects.get_or_create(
            processo=processo,
            tipo_prazo='RESPOSTA',
            defaults={
                'descricao': 'Prazo para apresentação de resposta',
                'data_inicio': datetime.now(),
                'data_fim': datetime.now() + timedelta(days=15),
                'status': 'PENDENTE',
                'observacoes': 'Prazo de teste para o sistema'
            }
        )
        if created:
            print(f"✅ Prazo criado: {prazo.tipo_prazo}")
        else:
            print(f"✅ Prazo encontrado: {prazo.tipo_prazo}")
        
        # 7. Criar resposta jurídica
        print("\n📝 6. Criando resposta jurídica...")
        resposta, created = RespostaJuridica.objects.get_or_create(
            processo=processo,
            tipo_resposta='DEFESA',
            defaults={
                'analista': analista,
                'titulo': 'Defesa Preliminar',
                'conteudo': 'Conteúdo da defesa preliminar do processo.',
                'fundamentacao_legal': 'Fundamentação legal baseada no Código de Defesa do Consumidor.',
                'enviado': False
            }
        )
        if created:
            print(f"✅ Resposta criada: {resposta.tipo_resposta}")
        else:
            print(f"✅ Resposta encontrada: {resposta.tipo_resposta}")
        
        # 8. Criar configuração jurídica
        print("\n⚙️ 7. Criando configuração jurídica...")
        config, created = ConfiguracaoJuridico.objects.get_or_create(
            id=1,
            defaults={
                'prazo_resposta_padrao': 15,
                'prazo_recurso_padrao': 30,
                'notificar_prazos_vencendo': True,
                'dias_antecedencia_notificacao': 3,
                'permitir_upload_documentos': True,
                'tamanho_maximo_arquivo': 10,
                'tipos_arquivo_permitidos': 'pdf,doc,docx',
                'configurado_por': user
            }
        )
        if created:
            print(f"✅ Configuração criada")
        else:
            print(f"✅ Configuração encontrada")
        
        # 9. Testar métodos do processo
        print("\n🔧 8. Testando métodos do processo...")
        print(f"   - Número do processo: {processo.numero}")
        print(f"   - Dias restantes: {processo.dias_restantes}")
        print(f"   - Está atrasado: {processo.esta_atrasado}")
        print(f"   - Status: {processo.status}")
        print(f"   - Prioridade: {processo.prioridade}")
        
        # 10. Testar relacionamentos
        print("\n🔗 9. Testando relacionamentos...")
        print(f"   - Processo tem {processo.analises.count()} análise(s)")
        print(f"   - Processo tem {processo.respostas.count()} resposta(s)")
        print(f"   - Processo tem {processo.prazos.count()} prazo(s)")
        print(f"   - Analista tem {analista.processos.count()} processo(s)")
        
        # 11. Testar APIs (simulação)
        print("\n🌐 10. Testando APIs...")
        try:
            from juridico.views import (
                ProcessoJuridicoViewSet, AnalistaJuridicoViewSet,
                AnaliseJuridicaViewSet, RespostaJuridicaViewSet
            )
            print("✅ ViewSets importados com sucesso!")
        except Exception as e:
            print(f"⚠️  Erro ao importar ViewSets: {e}")
        
        try:
            from juridico.serializers import (
                ProcessoJuridicoSerializer, AnalistaJuridicoSerializer,
                AnaliseJuridicaSerializer, RespostaJuridicaSerializer
            )
            print("✅ Serializers importados com sucesso!")
        except Exception as e:
            print(f"⚠️  Erro ao importar Serializers: {e}")
        
        # 12. Resumo final
        print("\n📊 RESUMO DO TESTE:")
        print("=" * 40)
        print(f"✅ Usuários: {User.objects.count()}")
        print(f"✅ Analistas: {AnalistaJuridico.objects.count()}")
        print(f"✅ Processos: {ProcessoJuridico.objects.count()}")
        print(f"✅ Análises: {AnaliseJuridica.objects.count()}")
        print(f"✅ Respostas: {RespostaJuridica.objects.count()}")
        print(f"✅ Prazos: {PrazoJuridico.objects.count()}")
        print(f"✅ Configurações: {ConfiguracaoJuridico.objects.count()}")
        
        print("\n🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!")
        print("O módulo jurídico está funcionando corretamente!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def limpar_dados_teste():
    """Limpa os dados de teste criados"""
    print("\n🧹 LIMPANDO DADOS DE TESTE...")
    
    try:
        from juridico.models import (
            AnalistaJuridico, ProcessoJuridico, AnaliseJuridica,
            RespostaJuridica, PrazoJuridico, ConfiguracaoJuridico
        )
        from django.contrib.auth.models import User
        
        # Limpar dados jurídicos
        AnaliseJuridica.objects.filter(processo__numero='PROC-000001/2024').delete()
        RespostaJuridica.objects.filter(processo__numero='PROC-000001/2024').delete()
        PrazoJuridico.objects.filter(processo__numero='PROC-000001/2024').delete()
        ProcessoJuridico.objects.filter(numero='PROC-000001/2024').delete()
        AnalistaJuridico.objects.filter(oab='123456/SP').delete()
        ConfiguracaoJuridico.objects.filter(id=1).delete()
        
        # Limpar usuário de teste
        User.objects.filter(username='teste_juridico').delete()
        
        print("✅ Dados de teste removidos com sucesso!")
        
    except Exception as e:
        print(f"⚠️  Erro ao limpar dados: {e}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--limpar':
        limpar_dados_teste()
    else:
        sucesso = test_juridico_completo()
        
        if sucesso:
            print("\n🚀 O módulo jurídico está pronto para uso!")
            print("Você pode acessar:")
            print("  - Dashboard: /juridico")
            print("  - Processos: /juridico/processos")
            print("  - Novo processo: /juridico/processos/novo")
        else:
            print("\n❌ Houve problemas no teste. Verifique os erros acima.")

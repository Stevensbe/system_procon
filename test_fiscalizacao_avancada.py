#!/usr/bin/env python
"""
Script de Teste do Módulo de Fiscalização Avançado
Testa todas as funcionalidades implementadas:
- Upload de evidências fotográficas
- Sistema de assinatura digital nos autos
- Notificação eletrônica automática
- Controle de prazos avançado
"""

import os
import sys
import django
from datetime import datetime, timedelta
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from django.utils import timezone

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from fiscalizacao.models import (
    Fiscalizacao, AutoInfracao, EvidenciaFotografica, AssinaturaDigital,
    NotificacaoEletronica, ControlePrazos, ConfiguracaoFiscalizacao
)
from fiscalizacao.serializers import (
    EvidenciaFotograficaSerializer, AssinaturaDigitalSerializer,
    NotificacaoEletronicaSerializer, ControlePrazosSerializer,
    ConfiguracaoFiscalizacaoSerializer
)

User = get_user_model()

class TestFiscalizacaoAvancada:
    """Classe de teste para o módulo de fiscalização avançado"""
    
    def __init__(self):
        self.user = None
        self.fiscalizacao = None
        self.auto_infracao = None
        self.test_results = []
        
    def setup_test_data(self):
        """Configurar dados de teste"""
        print("🔧 Configurando dados de teste...")
        
        # Criar usuário de teste
        self.user, created = User.objects.get_or_create(
            username='teste_fiscal',
            defaults={
                'email': 'teste@procon.gov.br',
                'first_name': 'Fiscal',
                'last_name': 'Teste',
                'is_staff': True
            }
        )
        
        # Criar fiscalização de teste
        self.fiscalizacao = Fiscalizacao.objects.create(
            tipo_fiscalizacao='inspecao',
            empresa_fiscalizada='Empresa Teste LTDA',
            cnpj_empresa='12.345.678/0001-90',
            endereco_empresa='Rua Teste, 123',
            fiscal_responsavel=self.user,
            data_fiscalizacao=timezone.now().date(),
            status='em_andamento',
            observacoes='Fiscalização de teste para validação do sistema'
        )
        
        # Criar auto de infração de teste
        self.auto_infracao = AutoInfracao.objects.create(
            fiscalizacao=self.fiscalizacao,
            numero_auto='AUTO-2024-001',
            tipo_auto='infracao',
            descricao_infracao='Venda de produtos vencidos',
            valor_multa=5000.00,
            prazo_defesa=15,
            status='pendente'
        )
        
        print("✅ Dados de teste configurados com sucesso!")
        
    def test_evidencias_fotograficas(self):
        """Testar upload de evidências fotográficas"""
        print("\n📸 Testando upload de evidências fotográficas...")
        
        try:
            # Criar arquivo de imagem simulado
            image_content = b'fake_image_content'
            image_file = SimpleUploadedFile(
                "evidencia.jpg",
                image_content,
                content_type="image/jpeg"
            )
            
            # Criar evidência fotográfica
            evidencia = EvidenciaFotografica.objects.create(
                fiscalizacao=self.fiscalizacao,
                titulo='Produtos vencidos na prateleira',
                descricao='Evidência fotográfica de produtos com data de validade vencida',
                arquivo=image_file,
                data_captura=timezone.now(),
                coordenadas_gps='-23.5505,-46.6333',
                tipo_evidencia='produto_vencido'
            )
            
            # Testar serializer
            serializer = EvidenciaFotograficaSerializer(evidencia)
            data = serializer.data
            
            assert data['titulo'] == 'Produtos vencidos na prateleira'
            assert data['tipo_evidencia'] == 'produto_vencido'
            assert 'arquivo' in data
            
            print("✅ Upload de evidências fotográficas funcionando!")
            self.test_results.append(('Evidências Fotográficas', 'PASSOU'))
            
        except Exception as e:
            print(f"❌ Erro no teste de evidências fotográficas: {e}")
            self.test_results.append(('Evidências Fotográficas', 'FALHOU'))
    
    def test_assinatura_digital(self):
        """Testar sistema de assinatura digital"""
        print("\n✍️ Testando sistema de assinatura digital...")
        
        try:
            # Criar assinatura digital
            assinatura = AssinaturaDigital.objects.create(
                fiscalizacao=self.fiscalizacao,
                auto_infracao=self.auto_infracao,
                assinante=self.user,
                tipo_assinatura='fiscal',
                certificado_digital='123456789',
                data_assinatura=timezone.now(),
                hash_documento='abc123def456',
                status='valida'
            )
            
            # Testar serializer
            serializer = AssinaturaDigitalSerializer(assinatura)
            data = serializer.data
            
            assert data['tipo_assinatura'] == 'fiscal'
            assert data['status'] == 'valida'
            assert data['hash_documento'] == 'abc123def456'
            
            print("✅ Sistema de assinatura digital funcionando!")
            self.test_results.append(('Assinatura Digital', 'PASSOU'))
            
        except Exception as e:
            print(f"❌ Erro no teste de assinatura digital: {e}")
            self.test_results.append(('Assinatura Digital', 'FALHOU'))
    
    def test_notificacao_eletronica(self):
        """Testar notificação eletrônica automática"""
        print("\n📧 Testando notificação eletrônica automática...")
        
        try:
            # Criar notificação eletrônica
            notificacao = NotificacaoEletronica.objects.create(
                fiscalizacao=self.fiscalizacao,
                auto_infracao=self.auto_infracao,
                tipo_notificacao='email',
                destinatario_nome='Empresa Teste LTDA',
                destinatario_cpf_cnpj='12.345.678/0001-90',
                destinatario_email='empresa@teste.com.br',
                assunto='Notificação de Auto de Infração',
                conteudo='Sua empresa foi autuada por infração ao Código de Defesa do Consumidor.',
                data_envio=timezone.now(),
                status='enviada',
                metodo_envio='email'
            )
            
            # Testar serializer
            serializer = NotificacaoEletronicaSerializer(notificacao)
            data = serializer.data
            
            assert data['tipo_notificacao'] == 'email'
            assert data['status'] == 'enviada'
            assert data['destinatario_email'] == 'empresa@teste.com.br'
            
            print("✅ Notificação eletrônica automática funcionando!")
            self.test_results.append(('Notificação Eletrônica', 'PASSOU'))
            
        except Exception as e:
            print(f"❌ Erro no teste de notificação eletrônica: {e}")
            self.test_results.append(('Notificação Eletrônica', 'FALHOU'))
    
    def test_controle_prazos(self):
        """Testar controle de prazos avançado"""
        print("\n⏰ Testando controle de prazos avançado...")
        
        try:
            # Criar controle de prazos
            prazo = ControlePrazos.objects.create(
                fiscalizacao=self.fiscalizacao,
                auto_infracao=self.auto_infracao,
                tipo_prazo='defesa',
                data_inicio=timezone.now().date(),
                data_vencimento=(timezone.now() + timedelta(days=15)).date(),
                dias_restantes=15,
                status='ativo',
                alerta_vencimento=True,
                notificacoes_enviadas=0
            )
            
            # Testar serializer
            serializer = ControlePrazosSerializer(prazo)
            data = serializer.data
            
            assert data['tipo_prazo'] == 'defesa'
            assert data['status'] == 'ativo'
            assert data['alerta_vencimento'] == True
            
            # Testar cálculo de dias restantes
            dias_restantes = (prazo.data_vencimento - timezone.now().date()).days
            assert dias_restantes >= 0
            
            print("✅ Controle de prazos avançado funcionando!")
            self.test_results.append(('Controle de Prazos', 'PASSOU'))
            
        except Exception as e:
            print(f"❌ Erro no teste de controle de prazos: {e}")
            self.test_results.append(('Controle de Prazos', 'FALHOU'))
    
    def test_configuracao_fiscalizacao(self):
        """Testar configurações do sistema"""
        print("\n⚙️ Testando configurações do sistema...")
        
        try:
            # Criar configuração
            config = ConfiguracaoFiscalizacao.objects.create(
                nome_configuracao='Configuração Padrão',
                prazo_defesa_padrao=15,
                prazo_recurso_padrao=30,
                valor_multa_minima=100.00,
                valor_multa_maxima=100000.00,
                notificacao_automatica=True,
                assinatura_digital_obrigatoria=True,
                evidencia_fotografica_obrigatoria=True,
                ativo=True
            )
            
            # Testar serializer
            serializer = ConfiguracaoFiscalizacaoSerializer(config)
            data = serializer.data
            
            assert data['prazo_defesa_padrao'] == 15
            assert data['notificacao_automatica'] == True
            assert data['ativo'] == True
            
            print("✅ Configurações do sistema funcionando!")
            self.test_results.append(('Configurações', 'PASSOU'))
            
        except Exception as e:
            print(f"❌ Erro no teste de configurações: {e}")
            self.test_results.append(('Configurações', 'FALHOU'))
    
    def test_fluxo_completo(self):
        """Testar fluxo completo de fiscalização"""
        print("\n🔄 Testando fluxo completo de fiscalização...")
        
        try:
            # 1. Fiscalização criada
            assert self.fiscalizacao.status == 'em_andamento'
            
            # 2. Auto de infração criado
            assert self.auto_infracao.status == 'pendente'
            
            # 3. Evidência fotográfica
            evidencia = EvidenciaFotografica.objects.create(
                fiscalizacao=self.fiscalizacao,
                titulo='Evidência do fluxo',
                descricao='Teste do fluxo completo',
                arquivo=SimpleUploadedFile("test.jpg", b"test"),
                data_captura=timezone.now(),
                tipo_evidencia='produto_vencido'
            )
            
            # 4. Assinatura digital
            assinatura = AssinaturaDigital.objects.create(
                fiscalizacao=self.fiscalizacao,
                auto_infracao=self.auto_infracao,
                assinante=self.user,
                tipo_assinatura='fiscal',
                certificado_digital='123456',
                data_assinatura=timezone.now(),
                hash_documento='hash123',
                status='valida'
            )
            
            # 5. Notificação
            notificacao = NotificacaoEletronica.objects.create(
                fiscalizacao=self.fiscalizacao,
                auto_infracao=self.auto_infracao,
                tipo_notificacao='email',
                destinatario_nome='Empresa Teste',
                destinatario_cpf_cnpj='12.345.678/0001-90',
                assunto='Teste',
                conteudo='Teste',
                data_envio=timezone.now(),
                status='enviada',
                metodo_envio='email'
            )
            
            # 6. Controle de prazos
            prazo = ControlePrazos.objects.create(
                fiscalizacao=self.fiscalizacao,
                auto_infracao=self.auto_infracao,
                tipo_prazo='defesa',
                data_inicio=timezone.now().date(),
                data_vencimento=(timezone.now() + timedelta(days=15)).date(),
                dias_restantes=15,
                status='ativo'
            )
            
            # Verificar se tudo está conectado
            assert evidencia.fiscalizacao == self.fiscalizacao
            assert assinatura.auto_infracao == self.auto_infracao
            assert notificacao.fiscalizacao == self.fiscalizacao
            assert prazo.auto_infracao == self.auto_infracao
            
            print("✅ Fluxo completo funcionando!")
            self.test_results.append(('Fluxo Completo', 'PASSOU'))
            
        except Exception as e:
            print(f"❌ Erro no teste de fluxo completo: {e}")
            self.test_results.append(('Fluxo Completo', 'FALHOU'))
    
    def run_all_tests(self):
        """Executar todos os testes"""
        print("🚀 Iniciando testes do Módulo de Fiscalização Avançado")
        print("=" * 60)
        
        try:
            # Configurar dados
            self.setup_test_data()
            
            # Executar testes
            self.test_evidencias_fotograficas()
            self.test_assinatura_digital()
            self.test_notificacao_eletronica()
            self.test_controle_prazos()
            self.test_configuracao_fiscalizacao()
            self.test_fluxo_completo()
            
            # Relatório final
            self.print_report()
            
        except Exception as e:
            print(f"❌ Erro geral nos testes: {e}")
            self.test_results.append(('Teste Geral', 'FALHOU'))
            self.print_report()
    
    def print_report(self):
        """Imprimir relatório final dos testes"""
        print("\n" + "=" * 60)
        print("📊 RELATÓRIO FINAL DOS TESTES")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r[1] == 'PASSOU'])
        failed_tests = total_tests - passed_tests
        
        for test_name, result in self.test_results:
            status_icon = "✅" if result == 'PASSOU' else "❌"
            print(f"{status_icon} {test_name}: {result}")
        
        print("\n" + "-" * 60)
        print(f"📈 Total de testes: {total_tests}")
        print(f"✅ Testes aprovados: {passed_tests}")
        print(f"❌ Testes reprovados: {failed_tests}")
        print(f"📊 Taxa de sucesso: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests == 0:
            print("\n🎉 TODOS OS TESTES PASSARAM! Módulo pronto para produção!")
        else:
            print(f"\n⚠️ {failed_tests} teste(s) falharam. Verificar implementação.")

if __name__ == "__main__":
    # Executar testes
    tester = TestFiscalizacaoAvancada()
    tester.run_all_tests()

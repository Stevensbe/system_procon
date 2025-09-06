#!/usr/bin/env python
"""
Script para testar o fluxo completo do Portal do Cidadão → Caixas de Entrada
Verifica se tudo está funcionando para o deploy
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from portal_cidadao.models import DenunciaCidadao
from peticionamento.models import PeticaoEletronica, TipoPeticao
from caixa_entrada.models import CaixaEntrada, HistoricoCaixaEntrada
from fiscalizacao.models import AutoInfracao
from multas.models import Multa
from juridico.models import ProcessoJuridico

def criar_usuario_teste():
    """Cria usuário para testes"""
    try:
        user, created = User.objects.get_or_create(
            username='teste_deploy',
            defaults={
                'email': 'teste@procon.gov.br',
                'first_name': 'Usuário',
                'last_name': 'Teste',
                'is_staff': True,
                'is_active': True
            }
        )
        if created:
            user.set_password('teste123')
            user.save()
            print(f"✅ Usuário de teste criado: {user.username}")
        else:
            print(f"✅ Usuário de teste já existe: {user.username}")
        return user
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        return None

def testar_denuncia_portal():
    """Testa se denúncia do Portal cai na Caixa de Denúncias"""
    print("\n🔍 TESTANDO: Denúncia Portal → Caixa de Denúncias")
    
    try:
        # Contar documentos antes
        count_antes = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').count()
        print(f"📊 Documentos de denúncia antes: {count_antes}")
        
        # Criar denúncia anônima
        denuncia_anonima = DenunciaCidadao.objects.create(
            numero_denuncia=f"DEN-{datetime.now().strftime('%Y%m%d%H%M%S')}-001",
            empresa_denunciada="Empresa Teste Anônima",
            cnpj_empresa="12.345.678/0001-90",
            descricao_fatos="Teste de denúncia anônima para deploy",
            denuncia_anonima=True,
            motivo_anonimato="Teste de segurança",
            endereco_empresa="Rua Teste, 123",
            cidade_empresa="Cidade Teste",
            estado_empresa="SP",
            cep_empresa="01234-567",
            data_ocorrencia=datetime.now().date(),
            ip_origem="127.0.0.1",
            user_agent="Teste Deploy"
        )
        
        # Criar denúncia não anônima
        denuncia_normal = DenunciaCidadao.objects.create(
            numero_denuncia=f"DEN-{datetime.now().strftime('%Y%m%d%H%M%S')}-002",
            empresa_denunciada="Empresa Teste Normal",
            cnpj_empresa="98.765.432/0001-10",
            descricao_fatos="Teste de denúncia normal para deploy",
            denuncia_anonima=False,
            nome_denunciante="João da Silva",
            cpf_cnpj="123.456.789-00",
            email="joao@teste.com",
            telefone="(11) 99999-9999",
            endereco_empresa="Rua Teste, 456",
            cidade_empresa="Cidade Teste",
            estado_empresa="SP",
            cep_empresa="01234-567",
            data_ocorrencia=datetime.now().date(),
            ip_origem="127.0.0.1",
            user_agent="Teste Deploy"
        )
        
        # Verificar se documentos foram criados na caixa de entrada
        count_depois = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').count()
        print(f"📊 Documentos de denúncia depois: {count_depois}")
        
        if count_depois == count_antes + 2:
            print("✅ SUCESSO: 2 denúncias criadas na Caixa de Denúncias")
            
            # Verificar se estão na caixa correta
            documentos = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').order_by('-id')[:2]
            for doc in documentos:
                print(f"   📄 {doc.numero_protocolo} - {doc.assunto} → {doc.setor_destino}")
                if doc.setor_destino == 'Fiscalização':
                    print("   ✅ Setor destino correto: Fiscalização")
                else:
                    print(f"   ❌ Setor destino incorreto: {doc.setor_destino}")
            
            return True
        else:
            print(f"❌ ERRO: Esperado {count_antes + 2}, encontrado {count_depois}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO ao testar denúncias: {e}")
        return False

def testar_peticao_portal():
    """Testa se petição do Portal cai na Caixa Jurídico"""
    print("\n🔍 TESTANDO: Petição Portal → Caixa Jurídico")
    
    try:
        # Contar documentos antes
        count_antes = CaixaEntrada.objects.filter(tipo_documento='PETICAO').count()
        print(f"📊 Documentos de petição antes: {count_antes}")
        
        # Criar tipo de petição se não existir
        tipo_peticao, created = TipoPeticao.objects.get_or_create(
            nome="Recurso Administrativo",
            defaults={
                'categoria': 'RECURSO',
                'descricao': 'Recurso contra decisão administrativa',
                'prazo_resposta': 30,
                'ativo': True
            }
        )
        
        # Criar petição
        peticao = PeticaoEletronica.objects.create(
            numero_peticao=f"PET-{datetime.now().strftime('%Y%m%d%H%M%S')}-001",
            tipo_peticao=tipo_peticao,
            assunto="Teste de petição para deploy",
            descricao="Teste de petição eletrônica para verificar fluxo",
            peticionario_nome="Maria da Silva",
            peticionario_documento="987.654.321-00",
            peticionario_email="maria@teste.com",
            peticionario_telefone="(11) 88888-8888",
            empresa_nome="Empresa Teste Petição",
            empresa_cnpj="11.222.333/0001-44",
            prioridade="NORMAL",
            prazo_resposta=datetime.now().date() + timedelta(days=30),
            origem="PORTAL_CIDADAO",
            ip_origem="127.0.0.1",
            user_agent="Teste Deploy",
            usuario_criacao=User.objects.get(username='teste_deploy')
        )
        
        # Verificar se documento foi criado na caixa de entrada
        count_depois = CaixaEntrada.objects.filter(tipo_documento='PETICAO').count()
        print(f"📊 Documentos de petição depois: {count_depois}")
        
        if count_depois == count_antes + 1:
            print("✅ SUCESSO: 1 petição criada na Caixa de Entrada")
            
            # Verificar se está na caixa correta
            documento = CaixaEntrada.objects.filter(tipo_documento='PETICAO').order_by('-id').first()
            print(f"   📄 {documento.numero_protocolo} - {documento.assunto} → {documento.setor_destino}")
            if documento.setor_destino == 'Jurídico':
                print("   ✅ Setor destino correto: Jurídico")
                return True
            else:
                print(f"   ❌ Setor destino incorreto: {documento.setor_destino}")
                return False
        else:
            print(f"❌ ERRO: Esperado {count_antes + 1}, encontrado {count_depois}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO ao testar petições: {e}")
        return False

def testar_tramitacao_documentos():
    """Testa se tramitação entre setores funciona"""
    print("\n🔍 TESTANDO: Tramitação entre Setores")
    
    try:
        # Pegar um documento de denúncia
        documento = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').first()
        if not documento:
            print("❌ Nenhum documento de denúncia encontrado para testar tramitação")
            return False
        
        print(f"📄 Testando tramitação do documento: {documento.numero_protocolo}")
        print(f"   Setor atual: {documento.setor_destino}")
        
        # Simular tramitação para Jurídico
        documento.setor_destino = 'Jurídico'
        documento.status = 'TRAMITADO'
        documento.save()
        
        # Registrar no histórico
        HistoricoCaixaEntrada.objects.create(
            documento=documento,
            acao='TRAMITADO',
            detalhes='Documento tramitado de Fiscalização para Jurídico para análise legal',
            usuario_responsavel=User.objects.get(username='teste_deploy')
        )
        
        print(f"   ✅ Documento tramitado para: {documento.setor_destino}")
        print(f"   ✅ Status atualizado para: {documento.status}")
        
        return True
        
    except Exception as e:
        print(f"❌ ERRO ao testar tramitação: {e}")
        return False

def verificar_configuracoes_deploy():
    """Verifica configurações necessárias para deploy"""
    print("\n🔍 VERIFICANDO: Configurações para Deploy")
    
    configuracoes_ok = True
    
    # Verificar variáveis de ambiente críticas
    from django.conf import settings
    
    print("📋 Configurações Django:")
    print(f"   DEBUG: {settings.DEBUG}")
    print(f"   SECRET_KEY configurado: {'✅' if settings.SECRET_KEY else '❌'}")
    print(f"   ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    
    if settings.DEBUG:
        print("   ⚠️  ATENÇÃO: DEBUG=True em produção é inseguro!")
        configuracoes_ok = False
    
    # Verificar banco de dados
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("   ✅ Conexão com banco de dados: OK")
    except Exception as e:
        print(f"   ❌ Erro na conexão com banco: {e}")
        configuracoes_ok = False
    
    # Verificar Redis
    try:
        import redis
        r = redis.Redis.from_url(settings.REDIS_URL)
        r.ping()
        print("   ✅ Conexão com Redis: OK")
    except Exception as e:
        print(f"   ❌ Erro na conexão com Redis: {e}")
        configuracoes_ok = False
    
    return configuracoes_ok

def main():
    """Função principal de teste"""
    print("🚀 TESTE COMPLETO PARA DEPLOY - SYSTEM PROCON")
    print("=" * 60)
    
    # Criar usuário de teste
    user = criar_usuario_teste()
    if not user:
        print("❌ Não foi possível criar usuário de teste. Abortando.")
        return
    
    # Executar testes
    testes = [
        ("Denúncia Portal → Caixa Denúncias", testar_denuncia_portal),
        ("Petição Portal → Caixa Jurídico", testar_peticao_portal),
        ("Tramitação entre Setores", testar_tramitacao_documentos),
        ("Configurações Deploy", verificar_configuracoes_deploy)
    ]
    
    resultados = []
    for nome, funcao in testes:
        try:
            resultado = funcao()
            resultados.append((nome, resultado))
        except Exception as e:
            print(f"❌ ERRO CRÍTICO em {nome}: {e}")
            resultados.append((nome, False))
    
    # Resumo final
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES:")
    print("=" * 60)
    
    sucessos = 0
    for nome, resultado in resultados:
        status = "✅ PASSOU" if resultado else "❌ FALHOU"
        print(f"{status} - {nome}")
        if resultado:
            sucessos += 1
    
    print(f"\n🎯 RESULTADO FINAL: {sucessos}/{len(resultados)} testes passaram")
    
    if sucessos == len(resultados):
        print("🎉 SISTEMA PRONTO PARA DEPLOY!")
        print("\n📋 PRÓXIMOS PASSOS:")
        print("1. Configurar variáveis de ambiente em produção")
        print("2. Executar migrações: python manage.py migrate")
        print("3. Coletar arquivos estáticos: python manage.py collectstatic")
        print("4. Configurar servidor web (Nginx/Apache)")
        print("5. Configurar SSL/HTTPS")
        print("6. Configurar backup automático")
        print("7. Configurar monitoramento (Prometheus/Grafana)")
    else:
        print("⚠️  SISTEMA NÃO ESTÁ PRONTO PARA DEPLOY!")
        print("Corrija os problemas identificados antes de fazer deploy.")

if __name__ == "__main__":
    main()

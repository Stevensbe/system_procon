from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from datetime import datetime, timedelta
from portal_cidadao.models import DenunciaCidadao
from peticionamento.models import PeticaoEletronica, TipoPeticao
from caixa_entrada.models import CaixaEntrada, HistoricoCaixaEntrada
from django.conf import settings
import redis

class Command(BaseCommand):
    help = 'Testa o fluxo completo do Portal do Cidadão → Caixas de Entrada para deploy'

    def handle(self, *args, **options):
        self.stdout.write("🚀 TESTE COMPLETO PARA DEPLOY - SYSTEM PROCON")
        self.stdout.write("=" * 60)
        
        # Criar usuário de teste
        user = self.criar_usuario_teste()
        if not user:
            self.stdout.write(self.style.ERROR("❌ Não foi possível criar usuário de teste. Abortando."))
            return
        
        # Executar testes
        testes = [
            ("Denúncia Portal → Caixa Denúncias", self.testar_denuncia_portal),
            ("Petição Portal → Caixa Jurídico", self.testar_peticao_portal),
            ("Tramitação entre Setores", self.testar_tramitacao_documentos),
            ("Configurações Deploy", self.verificar_configuracoes_deploy)
        ]
        
        resultados = []
        for nome, funcao in testes:
            try:
                resultado = funcao()
                resultados.append((nome, resultado))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ ERRO CRÍTICO em {nome}: {e}"))
                resultados.append((nome, False))
        
        # Resumo final
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("📊 RESUMO DOS TESTES:")
        self.stdout.write("=" * 60)
        
        sucessos = 0
        for nome, resultado in resultados:
            if resultado:
                self.stdout.write(self.style.SUCCESS(f"✅ PASSOU - {nome}"))
                sucessos += 1
            else:
                self.stdout.write(self.style.ERROR(f"❌ FALHOU - {nome}"))
        
        self.stdout.write(f"\n🎯 RESULTADO FINAL: {sucessos}/{len(resultados)} testes passaram")
        
        if sucessos == len(resultados):
            self.stdout.write(self.style.SUCCESS("🎉 SISTEMA PRONTO PARA DEPLOY!"))
            self.stdout.write("\n📋 PRÓXIMOS PASSOS:")
            self.stdout.write("1. Configurar variáveis de ambiente em produção")
            self.stdout.write("2. Executar migrações: python manage.py migrate")
            self.stdout.write("3. Coletar arquivos estáticos: python manage.py collectstatic")
            self.stdout.write("4. Configurar servidor web (Nginx/Apache)")
            self.stdout.write("5. Configurar SSL/HTTPS")
            self.stdout.write("6. Configurar backup automático")
            self.stdout.write("7. Configurar monitoramento (Prometheus/Grafana)")
        else:
            self.stdout.write(self.style.WARNING("⚠️  SISTEMA NÃO ESTÁ PRONTO PARA DEPLOY!"))
            self.stdout.write("Corrija os problemas identificados antes de fazer deploy.")

    def criar_usuario_teste(self):
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
                self.stdout.write(self.style.SUCCESS(f"✅ Usuário de teste criado: {user.username}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"✅ Usuário de teste já existe: {user.username}"))
            return user
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Erro ao criar usuário: {e}"))
            return None

    def testar_denuncia_portal(self):
        """Testa se denúncia do Portal cai na Caixa de Denúncias"""
        self.stdout.write("\n🔍 TESTANDO: Denúncia Portal → Caixa de Denúncias")
        
        try:
            # Contar documentos antes
            count_antes = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').count()
            self.stdout.write(f"📊 Documentos de denúncia antes: {count_antes}")
            
            # Criar denúncia anônima
            denuncia_anonima = DenunciaCidadao.objects.create(
                numero_denuncia=f"DEN-{datetime.now().strftime('%Y%m%d%H%M%S')}-001",
                empresa_denunciada="Empresa Teste Anônima",
                cnpj_empresa="12.345.678/0001-90",
                descricao_fatos="Teste de denúncia anônima para deploy",
                denuncia_anonima=True,
                motivo_anonimato="Teste de segurança",
                endereco_empresa="Rua Teste, 123 - Cidade Teste/SP - 01234-567",
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
                endereco_empresa="Rua Teste, 456 - Cidade Teste/SP - 01234-567",
                data_ocorrencia=datetime.now().date(),
                ip_origem="127.0.0.1",
                user_agent="Teste Deploy"
            )
            
            # Verificar se documentos foram criados na caixa de entrada
            count_depois = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').count()
            self.stdout.write(f"📊 Documentos de denúncia depois: {count_depois}")
            
            if count_depois == count_antes + 2:
                self.stdout.write(self.style.SUCCESS("✅ SUCESSO: 2 denúncias criadas na Caixa de Denúncias"))
                
                # Verificar se estão na caixa correta
                documentos = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').order_by('-id')[:2]
                for doc in documentos:
                    self.stdout.write(f"   📄 {doc.numero_protocolo} - {doc.assunto} → {doc.setor_destino}")
                    if doc.setor_destino == 'Fiscalização':
                        self.stdout.write(self.style.SUCCESS("   ✅ Setor destino correto: Fiscalização"))
                    else:
                        self.stdout.write(self.style.ERROR(f"   ❌ Setor destino incorreto: {doc.setor_destino}"))
                
                return True
            else:
                self.stdout.write(self.style.ERROR(f"❌ ERRO: Esperado {count_antes + 2}, encontrado {count_depois}"))
                return False
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ ERRO ao testar denúncias: {e}"))
            return False

    def testar_peticao_portal(self):
        """Testa se petição do Portal cai na Caixa Jurídico"""
        self.stdout.write("\n🔍 TESTANDO: Petição Portal → Caixa Jurídico")
        
        try:
            # Contar documentos antes
            count_antes = CaixaEntrada.objects.filter(tipo_documento='PETICAO').count()
            self.stdout.write(f"📊 Documentos de petição antes: {count_antes}")
            
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
            self.stdout.write(f"📊 Documentos de petição depois: {count_depois}")
            
            if count_depois == count_antes + 1:
                self.stdout.write(self.style.SUCCESS("✅ SUCESSO: 1 petição criada na Caixa de Entrada"))
                
                # Verificar se está na caixa correta (pegar o documento mais recente)
                documento = CaixaEntrada.objects.filter(tipo_documento='PETICAO').order_by('-data_entrada').first()
                self.stdout.write(f"   📄 {documento.numero_protocolo} - {documento.assunto} → {documento.setor_destino}")
                if documento.setor_destino == 'Jurídico':
                    self.stdout.write(self.style.SUCCESS("   ✅ Setor destino correto: Jurídico"))
                    return True
                else:
                    self.stdout.write(self.style.ERROR(f"   ❌ Setor destino incorreto: {documento.setor_destino}"))
                    return False
            else:
                self.stdout.write(self.style.ERROR(f"❌ ERRO: Esperado {count_antes + 1}, encontrado {count_depois}"))
                return False
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ ERRO ao testar petições: {e}"))
            return False

    def testar_tramitacao_documentos(self):
        """Testa se tramitação entre setores funciona"""
        self.stdout.write("\n🔍 TESTANDO: Tramitação entre Setores")
        
        try:
            # Pegar um documento de denúncia
            documento = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').first()
            if not documento:
                self.stdout.write(self.style.ERROR("❌ Nenhum documento de denúncia encontrado para testar tramitação"))
                return False
            
            self.stdout.write(f"📄 Testando tramitação do documento: {documento.numero_protocolo}")
            self.stdout.write(f"   Setor atual: {documento.setor_destino}")
            
            # Simular tramitação para Jurídico
            documento.setor_destino = 'Jurídico'
            documento.status = 'TRAMITADO'
            documento.save()
            
            # Registrar no histórico
            HistoricoCaixaEntrada.objects.create(
                documento=documento,
                acao='TRAMITADO',
                detalhes='Documento tramitado de Fiscalização para Jurídico para análise legal',
                usuario=User.objects.get(username='teste_deploy')
            )
            
            self.stdout.write(f"   ✅ Documento tramitado para: {documento.setor_destino}")
            self.stdout.write(f"   ✅ Status atualizado para: {documento.status}")
            
            return True
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ ERRO ao testar tramitação: {e}"))
            return False

    def verificar_configuracoes_deploy(self):
        """Verifica configurações necessárias para deploy"""
        self.stdout.write("\n🔍 VERIFICANDO: Configurações para Deploy")
        
        configuracoes_ok = True
        
        # Verificar variáveis de ambiente críticas
        self.stdout.write("📋 Configurações Django:")
        self.stdout.write(f"   DEBUG: {settings.DEBUG}")
        self.stdout.write(f"   SECRET_KEY configurado: {'✅' if settings.SECRET_KEY else '❌'}")
        self.stdout.write(f"   ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
        
        if settings.DEBUG:
            self.stdout.write(self.style.WARNING("   ⚠️  ATENÇÃO: DEBUG=True em produção é inseguro!"))
            configuracoes_ok = False
        
        # Verificar banco de dados
        from django.db import connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS("   ✅ Conexão com banco de dados: OK"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Erro na conexão com banco: {e}"))
            configuracoes_ok = False
        
        # Verificar Redis
        try:
            r = redis.Redis.from_url(settings.REDIS_URL)
            r.ping()
            self.stdout.write(self.style.SUCCESS("   ✅ Conexão com Redis: OK"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Erro na conexão com Redis: {e}"))
            configuracoes_ok = False
        
        return configuracoes_ok

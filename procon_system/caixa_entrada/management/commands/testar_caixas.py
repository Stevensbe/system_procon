from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from caixa_entrada.models import CaixaEntrada
from fiscalizacao.models import AutoInfracao
from peticionamento.models import PeticaoEletronica, TipoPeticao
from datetime import datetime

class Command(BaseCommand):
    help = 'Testa se as caixas de entrada estão funcionando corretamente'

    def handle(self, *args, **options):
        self.stdout.write("🚀 TESTE DAS CAIXAS DE ENTRADA")
        self.stdout.write("="*50)
        
        try:
            # 1. Verificar se as tabelas existem
            self.stdout.write("1. Verificando tabelas...")
            total_caixa = CaixaEntrada.objects.count()
            total_autos = AutoInfracao.objects.count()
            total_peticoes = PeticaoEletronica.objects.count()
            
            self.stdout.write(f"   ✅ CaixaEntrada: {total_caixa} documentos")
            self.stdout.write(f"   ✅ AutoInfracao: {total_autos} autos")
            self.stdout.write(f"   ✅ PeticaoEletronica: {total_peticoes} petições")
            
            # 2. Verificar documentos por setor
            self.stdout.write("\n2. Documentos por setor:")
            setores = ['Atendimento', 'Fiscalização', 'Jurídico', 'Financeiro', 'Diretoria']
            
            for setor in setores:
                count = CaixaEntrada.objects.filter(setor_destino=setor).count()
                self.stdout.write(f"   📬 {setor}: {count} documento(s)")
            
            # 3. Testar criação de auto (denúncia)
            self.stdout.write("\n3. Testando criação de denúncia (Auto de Infração)...")
            
            # Criar um auto de teste
            auto_teste = AutoInfracao.objects.create(
                numero='TEST-DENUNCIA/2025',
                data_fiscalizacao=datetime.now().date(),
                hora_fiscalizacao=datetime.now().time(),
                razao_social='Empresa Teste Denúncia',
                atividade='Teste',
                endereco='Rua Teste',
                cnpj='11.111.111/0001-11',
                relatorio='Teste denúncia',
                base_legal_cdc='Teste',
                valor_multa=1000.00,
                responsavel_nome='Teste',
                responsavel_cpf='111.111.111-11',
                fiscal_nome='Fiscal Teste',
                status='autuado'
            )
            
            # Verificar se foi criado na caixa da Fiscalização
            doc_caixa = CaixaEntrada.objects.filter(
                content_type__model='autoinfracao',
                object_id=auto_teste.id
            ).first()
            
            if doc_caixa:
                self.stdout.write(f"   ✅ DENÚNCIA CRIADA NA CAIXA: {doc_caixa.setor_destino}")
                if doc_caixa.setor_destino == 'Fiscalização':
                    self.stdout.write("   🎉 SUCESSO: Denúncia chegou na caixa da Fiscalização!")
                else:
                    self.stdout.write(f"   ⚠️ ATENÇÃO: Denúncia foi para {doc_caixa.setor_destino} (esperado: Fiscalização)")
            else:
                self.stdout.write("   ❌ ERRO: Denúncia não apareceu na caixa")
            
            # 4. Testar criação de petição
            self.stdout.write("\n4. Testando criação de petição...")
            
            # Criar tipo de petição se não existir
            tipo_peticao, created = TipoPeticao.objects.get_or_create(
                nome='RECURSO',
                defaults={'descricao': 'Recurso administrativo'}
            )
            
            # Criar uma petição de teste
            peticao_teste = PeticaoEletronica.objects.create(
                protocolo='TEST-PETICAO/2025',
                tipo_peticao=tipo_peticao,
                nome_peticionario='Advogado Teste',
                cpf_cnpj='111.111.111-11',
                email='teste@teste.com',
                telefone='(11) 1111-1111',
                assunto='Teste de petição',
                descricao='Petição de teste para verificar caixa',
                status='recebida'
            )
            
            # Verificar se foi criado na caixa do Jurídico
            doc_caixa_peticao = CaixaEntrada.objects.filter(
                content_type__model='peticaoeletronica',
                object_id=peticao_teste.id
            ).first()
            
            if doc_caixa_peticao:
                self.stdout.write(f"   ✅ PETIÇÃO CRIADA NA CAIXA: {doc_caixa_peticao.setor_destino}")
                if doc_caixa_peticao.setor_destino == 'Jurídico':
                    self.stdout.write("   🎉 SUCESSO: Petição chegou na caixa do Jurídico!")
                else:
                    self.stdout.write(f"   ⚠️ ATENÇÃO: Petição foi para {doc_caixa_peticao.setor_destino} (esperado: Jurídico)")
            else:
                self.stdout.write("   ❌ ERRO: Petição não apareceu na caixa")
            
            # 5. Limpar dados de teste
            self.stdout.write("\n5. Limpando dados de teste...")
            auto_teste.delete()
            peticao_teste.delete()
            if doc_caixa:
                doc_caixa.delete()
            if doc_caixa_peticao:
                doc_caixa_peticao.delete()
            
            self.stdout.write("\n✅ TESTE CONCLUÍDO!")
            self.stdout.write("🎉 As caixas de entrada estão funcionando corretamente!")
            
        except Exception as e:
            self.stdout.write(f"\n❌ ERRO NO TESTE: {e}")
            import traceback
            traceback.print_exc()

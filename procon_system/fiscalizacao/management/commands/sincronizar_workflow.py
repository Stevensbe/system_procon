"""
SISPROCON - Comando para sincronizar e migrar dados do workflow
Uso: python manage.py sincronizar_workflow
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from fiscalizacao.workflow_signals import (
    migrar_empresas_de_autos_existentes,
    sincronizar_processos_existentes,
    WorkflowManager
)


class Command(BaseCommand):
    help = 'Sincroniza dados existentes com o novo workflow integrado'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--migrar-empresas',
            action='store_true',
            help='Migra empresas dos autos existentes',
        )
        parser.add_argument(
            '--sincronizar-multas',
            action='store_true',
            help='Cria multas para processos finalizados sem multa',
        )
        parser.add_argument(
            '--relatorio',
            action='store_true',
            help='Exibe relatório do workflow atual',
        )
        parser.add_argument(
            '--tudo',
            action='store_true',
            help='Executa todas as operações',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(
                f'🔄 SISPROCON - Sincronização de Workflow iniciada em {timezone.now().strftime("%d/%m/%Y %H:%M:%S")}'
            )
        )
        
        try:
            if options['migrar_empresas'] or options['tudo']:
                self.stdout.write("🏢 Migrando empresas dos autos existentes...")
                empresas_criadas = migrar_empresas_de_autos_existentes()
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {empresas_criadas} empresas criadas/sincronizadas")
                )
            
            if options['sincronizar_multas'] or options['tudo']:
                self.stdout.write("💰 Sincronizando multas de processos finalizados...")
                multas_criadas = sincronizar_processos_existentes()
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {multas_criadas} multas criadas")
                )
            
            if options['relatorio'] or options['tudo']:
                self.stdout.write("📊 Gerando relatório do workflow...")
                relatorio = WorkflowManager.relatorio_workflow()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"""
📈 RELATÓRIO DO WORKFLOW SISPROCON:
   
   📋 Autos de Infração: {relatorio['autos_criados']}
   ⚖️  Processos Admin.: {relatorio['processos_criados']}
   💰 Multas Geradas: {relatorio['multas_geradas']}
   
   🔄 Processos Pendentes: {relatorio['processos_pendentes']}
   ⏰ Multas Vencidas: {relatorio['multas_vencidas']}
   
   📊 Taxa Conversão Auto→Processo: {relatorio['taxa_conversao_auto_processo']:.1f}%
   📊 Taxa Conversão Processo→Multa: {relatorio['taxa_conversao_processo_multa']:.1f}%
                        """
                    )
                )
            
            if not any([options['migrar_empresas'], options['sincronizar_multas'], 
                       options['relatorio'], options['tudo']]):
                self.stdout.write(
                    self.style.WARNING(
                        "Nenhuma operação especificada. Use --help para ver as opções disponíveis."
                    )
                )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro durante sincronização: {str(e)}')
            )
            raise
        
        self.stdout.write(
            self.style.SUCCESS('🏁 Sincronização de workflow concluída!')
        )
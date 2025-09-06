"""
SISPROCON - Comando para verificação automática de prazos e notificações
Uso: python manage.py verificar_prazos
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from protocolo_tramitacao.notifications import executar_verificacoes_automaticas


class Command(BaseCommand):
    help = 'Executa verificações automáticas de prazos, multas vencidas e envio de notificações'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--apenas-prazos',
            action='store_true',
            help='Verifica apenas prazos de protocolos',
        )
        parser.add_argument(
            '--apenas-multas',
            action='store_true',
            help='Verifica apenas multas vencidas',
        )
        parser.add_argument(
            '--sem-envio',
            action='store_true',
            help='Não envia emails, apenas cria notificações',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Exibe informações detalhadas',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(
                f'🚀 SISPROCON - Verificações Automáticas iniciadas em {timezone.now().strftime("%d/%m/%Y %H:%M:%S")}'
            )
        )
        
        try:
            if options['apenas_prazos']:
                from protocolo_tramitacao.notifications import GerenciadorNotificacoes
                notifs = GerenciadorNotificacoes.verificar_prazos_vencendo()
                self.stdout.write(f"📅 {len(notifs)} notificações de prazos criadas")
                
            elif options['apenas_multas']:
                from protocolo_tramitacao.notifications import GerenciadorNotificacoes
                notifs = GerenciadorNotificacoes.verificar_multas_vencidas()
                self.stdout.write(f"💰 {len(notifs)} notificações de multas criadas")
                
            else:
                # Executa verificação completa
                resultado = executar_verificacoes_automaticas()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✅ Verificações concluídas:\n"
                        f"   📅 Prazos: {resultado['prazos']} notificações\n"
                        f"   💰 Multas: {resultado['multas']} notificações\n"
                        f"   📧 Emails enviados: {resultado['envios']['enviadas']}\n"
                        f"   ❌ Erros no envio: {resultado['envios']['erros']}"
                    )
                )
            
            # Envio de emails (se não foi desabilitado)
            if not options['sem_envio'] and not options['apenas_prazos'] and not options['apenas_multas']:
                from protocolo_tramitacao.notifications import GerenciadorNotificacoes
                resultado_envio = GerenciadorNotificacoes.enviar_notificacoes_pendentes()
                self.stdout.write(
                    f"📧 Emails: {resultado_envio['enviadas']} enviados, {resultado_envio['erros']} erros"
                )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro durante verificações: {str(e)}')
            )
            if options['verbose']:
                import traceback
                self.stdout.write(traceback.format_exc())
            raise
        
        self.stdout.write(
            self.style.SUCCESS('🏁 Verificações automáticas finalizadas com sucesso!')
        )
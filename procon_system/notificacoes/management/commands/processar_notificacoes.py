#!/usr/bin/env python
"""
Comando para processar notificações pendentes
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from notificacoes.services import notificacao_service, configuracao_service


class Command(BaseCommand):
    help = 'Processa notificações pendentes e envia por todos os canais configurados'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limpar-antigas',
            action='store_true',
            help='Remove notificações antigas (mais de 90 dias)',
        )
        parser.add_argument(
            '--dias',
            type=int,
            default=90,
            help='Número de dias para considerar notificação antiga (padrão: 90)',
        )
        parser.add_argument(
            '--estatisticas',
            action='store_true',
            help='Mostra estatísticas de notificações',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Iniciando processamento de notificações...')
        )

        # Processar notificações pendentes
        self.processar_notificacoes_pendentes()

        # Limpar notificações antigas se solicitado
        if options['limpar_antigas']:
            self.limpar_notificacoes_antigas(options['dias'])

        # Mostrar estatísticas se solicitado
        if options['estatisticas']:
            self.mostrar_estatisticas()

        self.stdout.write(
            self.style.SUCCESS('✅ Processamento de notificações concluído!')
        )

    def processar_notificacoes_pendentes(self):
        """Processa notificações pendentes"""
        self.stdout.write('📧 Processando notificações pendentes...')
        
        try:
            notificacao_service.processar_notificacoes_pendentes()
            self.stdout.write(
                self.style.SUCCESS('✅ Notificações pendentes processadas com sucesso!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao processar notificações: {e}')
            )

    def limpar_notificacoes_antigas(self, dias):
        """Remove notificações antigas"""
        self.stdout.write(f'🧹 Removendo notificações com mais de {dias} dias...')
        
        try:
            count = configuracao_service.limpar_notificacoes_antigas(dias)
            self.stdout.write(
                self.style.SUCCESS(f'✅ {count} notificações antigas removidas!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao limpar notificações antigas: {e}')
            )

    def mostrar_estatisticas(self):
        """Mostra estatísticas de notificações"""
        self.stdout.write('📊 Estatísticas de notificações:')
        
        try:
            stats = configuracao_service.obter_estatisticas_notificacoes()
            
            self.stdout.write(f'   Total: {stats["total"]}')
            self.stdout.write(f'   Enviadas: {stats["enviadas"]}')
            self.stdout.write(f'   Lidas: {stats["lidas"]}')
            self.stdout.write(f'   Pendentes: {stats["pendentes"]}')
            self.stdout.write(f'   Falhadas: {stats["falhadas"]}')
            
            self.stdout.write('\n   Por Prioridade:')
            for prioridade, count in stats['por_prioridade'].items():
                self.stdout.write(f'     {prioridade.title()}: {count}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao obter estatísticas: {e}')
            )

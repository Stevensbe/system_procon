from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from ti.services import EmailNotificationService
from ti.models import LogAuditoria
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Testar configuração de email do Sistema PROCON-AM'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email para teste (opcional)',
        )
        parser.add_argument(
            '--test-notification',
            action='store_true',
            help='Testar serviço de notificação',
        )

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("TESTE DE CONFIGURACAO DE EMAIL - SISTEMA PROCON-AM"))
        self.stdout.write("=" * 60)
        
        # Mostrar configurações atuais
        self.show_current_config()
        
        # Teste de email simples
        if options['email']:
            self.test_simple_email(options['email'])
        
        # Teste do serviço de notificação
        if options['test_notification']:
            self.test_notification_service()
        
        # Mostrar logs de auditoria
        self.show_audit_logs()
        
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.WARNING("PROXIMOS PASSOS:"))
        self.stdout.write("   1. Configure as variaveis de ambiente de email")
        self.stdout.write("   2. Execute: python manage.py testar_email --email seu_email@gmail.com")
        self.stdout.write("   3. Execute: python manage.py testar_email --test-notification")
        self.stdout.write("   4. Crie um usuario no painel TI para testar notificacoes")
        self.stdout.write("=" * 60)

    def show_current_config(self):
        """Mostrar configurações atuais"""
        self.stdout.write("CONFIGURACOES ATUAIS:")
        self.stdout.write(f"   Host: {settings.EMAIL_HOST}")
        self.stdout.write(f"   Port: {settings.EMAIL_PORT}")
        self.stdout.write(f"   TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"   SSL: {settings.EMAIL_USE_SSL}")
        self.stdout.write(f"   User: {settings.EMAIL_HOST_USER}")
        self.stdout.write(f"   From: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"   Backend: {settings.EMAIL_BACKEND}")
        self.stdout.write("")
        
        if not settings.EMAIL_HOST_USER:
            self.stdout.write(self.style.WARNING("AVISO: EMAIL_HOST_USER nao configurado!"))
            self.stdout.write("   O sistema esta usando modo console (desenvolvimento)")
            self.stdout.write("   Para emails reais, configure as variaveis de ambiente")
            self.stdout.write("")

    def test_simple_email(self, email):
        """Testar email simples"""
        self.stdout.write(f"Enviando email de teste para: {email}")
        
        try:
            send_mail(
                subject='Teste Sistema PROCON-AM',
                message=f'''
Este e um email de teste do Sistema PROCON-AM.

Se voce recebeu este email, a configuracao esta funcionando corretamente!

Configuracoes:
- Host: {settings.EMAIL_HOST}
- Port: {settings.EMAIL_PORT}
- TLS: {settings.EMAIL_USE_TLS}
- From: {settings.DEFAULT_FROM_EMAIL}

Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            
            self.stdout.write(self.style.SUCCESS("EMAIL ENVIADO COM SUCESSO!"))
            self.stdout.write(f"   Verifique a caixa de entrada de: {email}")
            self.stdout.write("   Se nao aparecer, verifique a pasta de SPAM")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"ERRO AO ENVIAR EMAIL: {str(e)}"))
            self.stdout.write("")
            self.stdout.write("POSSIVEIS SOLUCOES:")
            self.stdout.write("   1. Verifique se EMAIL_HOST_USER esta configurado")
            self.stdout.write("   2. Verifique se EMAIL_HOST_PASSWORD esta correto")
            self.stdout.write("   3. Para Gmail, use 'Senha de App'")
            self.stdout.write("   4. Verifique se a porta 587 esta liberada")
            self.stdout.write("   5. Verifique se TLS esta habilitado")

    def test_notification_service(self):
        """Testar serviço de notificação"""
        self.stdout.write("")
        self.stdout.write("=" * 60)
        self.stdout.write("TESTE DO SERVICO DE NOTIFICACAO")
        self.stdout.write("=" * 60)
        
        try:
            # Dados de teste
            user_data = {
                'nome': 'Joao Silva Teste',
                'email': 'joao.teste@procon.am.gov.br',
                'cpf': '12345678901',
                'matricula': '12345',
                'cargo': 'Analista de Teste',
                'departamento': 'TI',
                'status': 'ativo'
            }
            
            # Usuário admin para teste
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                self.stdout.write(self.style.ERROR("Nenhum usuario admin encontrado!"))
                return
            
            self.stdout.write(f"Enviando notificacao de usuario criado...")
            self.stdout.write(f"   Admin: {admin_user.get_full_name() or admin_user.username}")
            self.stdout.write(f"   Usuario: {user_data['nome']}")
            
            # Enviar notificação
            success = EmailNotificationService.send_user_created_notification(user_data, admin_user)
            
            if success:
                self.stdout.write(self.style.SUCCESS("NOTIFICACAO ENVIADA COM SUCESSO!"))
                self.stdout.write("   Verifique o email dos administradores")
            else:
                self.stdout.write(self.style.ERROR("ERRO AO ENVIAR NOTIFICACAO!"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"ERRO NO SERVICO DE NOTIFICACAO: {str(e)}"))

    def show_audit_logs(self):
        """Mostrar logs de auditoria"""
        self.stdout.write("")
        self.stdout.write("=" * 60)
        self.stdout.write("LOGS DE AUDITORIA - EMAILS")
        self.stdout.write("=" * 60)
        
        try:
            # Buscar logs de email dos últimos 7 dias
            data_limite = datetime.now() - timedelta(days=7)
            
            logs = LogAuditoria.objects.filter(
                modulo='TI',
                detalhes__tipo='notificacao_email',
                timestamp__gte=data_limite
            ).order_by('-timestamp')[:10]
            
            if not logs:
                self.stdout.write("Nenhum log de email encontrado nos ultimos 7 dias")
                return
            
            self.stdout.write(f"Ultimos {logs.count()} envios de email:")
            self.stdout.write("")
            
            for log in logs:
                status = "OK" if log.sucesso else "ERRO"
                timestamp = log.timestamp.strftime('%d/%m/%Y %H:%M:%S')
                user = log.user.get_full_name() if log.user else 'Sistema'
                
                self.stdout.write(f"{status} {timestamp} - {user}")
                self.stdout.write(f"   Acao: {log.get_acao_display()}")
                self.stdout.write(f"   Detalhes: {log.detalhes}")
                if log.erro:
                    self.stdout.write(f"   Erro: {log.erro}")
                self.stdout.write("")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"ERRO AO BUSCAR LOGS: {str(e)}"))
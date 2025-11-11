from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth.models import User
from ti.models import LogAuditoria
import logging

logger = logging.getLogger(__name__)

class EmailNotificationService:
    """Serviço para envio de notificações por email"""
    
    @staticmethod
    def send_user_created_notification(user_data, created_by):
        """Enviar notificação de usuário criado"""
        try:
            subject = f'Novo usuário criado no Sistema PROCON-AM'
            
            # Template HTML
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                        Sistema PROCON-AM - Novo Usuário
                    </h2>
                    
                    <p>Olá <strong>{created_by.get_full_name() or created_by.username}</strong>,</p>
                    
                    <p>Um novo usuário foi criado no sistema com as seguintes informações:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Dados do Usuário:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Nome:</strong> {user_data.get('nome', 'N/A')}</li>
                            <li><strong>Email:</strong> {user_data.get('email', 'N/A')}</li>
                            <li><strong>CPF:</strong> {user_data.get('cpf', 'N/A')}</li>
                            <li><strong>Matrícula:</strong> {user_data.get('matricula', 'N/A')}</li>
                            <li><strong>Cargo:</strong> {user_data.get('cargo', 'N/A')}</li>
                            <li><strong>Departamento:</strong> {user_data.get('departamento', 'N/A')}</li>
                            <li><strong>Status:</strong> {user_data.get('status', 'N/A')}</li>
                        </ul>
                    </div>
                    
                    <p>O usuário pode fazer login usando:</p>
                    <ul>
                        <li><strong>CPF:</strong> {user_data.get('cpf', 'N/A')}</li>
                        <li><strong>Senha:</strong> A senha definida durante a criação</li>
                    </ul>
                    
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
                        Esta é uma notificação automática do Sistema PROCON-AM.<br>
                        Por favor, não responda a este email.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # Enviar para administradores
            admins = User.objects.filter(is_superuser=True, is_active=True)
            admin_emails = [admin.email for admin in admins if admin.email]
            
            if admin_emails:
                send_mail(
                    subject=subject,
                    message=f'Novo usuário criado: {user_data.get("nome", "N/A")}',
                    html_message=html_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=False,
                )
                
                # Log da auditoria
                LogAuditoria.objects.create(
                    user=created_by,
                    acao='criar',
                    modulo='TI',
                    detalhes={'tipo': 'notificacao_email', 'destinatarios': len(admin_emails)},
                    sucesso=True
                )
                
                logger.info(f'Notificação de usuário criado enviada para {len(admin_emails)} administradores')
                return True
            
        except Exception as e:
            logger.error(f'Erro ao enviar notificação de usuário criado: {str(e)}')
            LogAuditoria.objects.create(
                user=created_by,
                acao='criar',
                modulo='TI',
                detalhes={'tipo': 'notificacao_email', 'erro': str(e)},
                sucesso=False,
                erro=str(e)
            )
            return False
    
    @staticmethod
    def send_user_updated_notification(user_data, updated_by):
        """Enviar notificação de usuário atualizado"""
        try:
            subject = f'Usuário atualizado no Sistema PROCON-AM'
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">
                        Sistema PROCON-AM - Usuário Atualizado
                    </h2>
                    
                    <p>Olá <strong>{updated_by.get_full_name() or updated_by.username}</strong>,</p>
                    
                    <p>Um usuário foi atualizado no sistema:</p>
                    
                    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #059669;">
                        <h3 style="color: #047857; margin-top: 0;">Dados Atualizados:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Nome:</strong> {user_data.get('nome', 'N/A')}</li>
                            <li><strong>Email:</strong> {user_data.get('email', 'N/A')}</li>
                            <li><strong>CPF:</strong> {user_data.get('cpf', 'N/A')}</li>
                            <li><strong>Matrícula:</strong> {user_data.get('matricula', 'N/A')}</li>
                            <li><strong>Cargo:</strong> {user_data.get('cargo', 'N/A')}</li>
                            <li><strong>Departamento:</strong> {user_data.get('departamento', 'N/A')}</li>
                            <li><strong>Status:</strong> {user_data.get('status', 'N/A')}</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
                        Esta é uma notificação automática do Sistema PROCON-AM.<br>
                        Por favor, não responda a este email.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # Enviar para administradores
            admins = User.objects.filter(is_superuser=True, is_active=True)
            admin_emails = [admin.email for admin in admins if admin.email]
            
            if admin_emails:
                send_mail(
                    subject=subject,
                    message=f'Usuário atualizado: {user_data.get("nome", "N/A")}',
                    html_message=html_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=False,
                )
                
                LogAuditoria.objects.create(
                    user=updated_by,
                    acao='editar',
                    modulo='TI',
                    detalhes={'tipo': 'notificacao_email', 'destinatarios': len(admin_emails)},
                    sucesso=True
                )
                
                logger.info(f'Notificação de usuário atualizado enviada para {len(admin_emails)} administradores')
                return True
                
        except Exception as e:
            logger.error(f'Erro ao enviar notificação de usuário atualizado: {str(e)}')
            LogAuditoria.objects.create(
                user=updated_by,
                acao='editar',
                modulo='TI',
                detalhes={'tipo': 'notificacao_email', 'erro': str(e)},
                sucesso=False,
                erro=str(e)
            )
            return False
    
    @staticmethod
    def send_password_reset_notification(user, reset_link):
        """Enviar notificação de redefinição de senha"""
        try:
            subject = f'Redefinição de senha - Sistema PROCON-AM'
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                        Sistema PROCON-AM - Redefinição de Senha
                    </h2>
                    
                    <p>Olá <strong>{user.get_full_name() or user.username}</strong>,</p>
                    
                    <p>Você solicitou a redefinição de sua senha no Sistema PROCON-AM.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="background-color: #dc2626; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Redefinir Senha
                        </a>
                    </div>
                    
                    <p><strong>Importante:</strong></p>
                    <ul>
                        <li>Este link é válido por 24 horas</li>
                        <li>Se você não solicitou esta redefinição, ignore este email</li>
                        <li>Não compartilhe este link com outras pessoas</li>
                    </ul>
                    
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
                        Esta é uma notificação automática do Sistema PROCON-AM.<br>
                        Por favor, não responda a este email.
                    </p>
                </div>
            </body>
            </html>
            """
            
            send_mail(
                subject=subject,
                message=f'Link para redefinição de senha: {reset_link}',
                html_message=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            LogAuditoria.objects.create(
                user=user,
                acao='alterar_senha',
                modulo='TI',
                detalhes={'tipo': 'notificacao_email', 'destinatario': user.email},
                sucesso=True
            )
            
            logger.info(f'Notificação de redefinição de senha enviada para {user.email}')
            return True
            
        except Exception as e:
            logger.error(f'Erro ao enviar notificação de redefinição de senha: {str(e)}')
            LogAuditoria.objects.create(
                user=user,
                acao='alterar_senha',
                modulo='TI',
                detalhes={'tipo': 'notificacao_email', 'erro': str(e)},
                sucesso=False,
                erro=str(e)
            )
            return False

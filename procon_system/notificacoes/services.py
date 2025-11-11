#!/usr/bin/env python
"""
Serviços avançados para o módulo de notificações
Inclui: notificações em tempo real, push, SMS, configurações avançadas
"""
import json
import logging
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Q
import requests
from .models import (
    Notificacao, TipoNotificacao, PreferenciaNotificacao,
    LogNotificacao, TemplateNotificacao, DispositivoNotificacao,
)

logger = logging.getLogger(__name__)

class NotificacaoService:
    """Serviço principal para gerenciamento de notificações"""
    
    def __init__(self):
        pass
    
    def criar_notificacao(
        self,
        tipo_codigo: str,
        destinatario_id: int,
        titulo: str,
        mensagem: str,
        dados_extras: Dict = None,
        prioridade: str = 'normal',
        agendada_para: datetime = None,
        remetente_id: int = None,
        objeto_relacionado = None
    ) -> Notificacao:
        """Cria uma nova notificação"""
        try:
            tipo = TipoNotificacao.objects.get(codigo=tipo_codigo, ativo=True)
            
            notificacao = Notificacao.objects.create(
                tipo=tipo,
                destinatario_id=destinatario_id,
                remetente_id=remetente_id,
                titulo=titulo,
                mensagem=mensagem,
                dados_extras=dados_extras or {},
                prioridade=prioridade,
                agendada_para=agendada_para
            )
            
            if objeto_relacionado:
                notificacao.objeto_relacionado = objeto_relacionado
                notificacao.save()
            
            # Enviar notificação em tempo real se não for agendada
            if not agendada_para or agendada_para <= timezone.now():
                self.enviar_notificacao_tempo_real(notificacao)
            
            logger.info(f"Notificação criada: {notificacao.id}")
            return notificacao
            
        except TipoNotificacao.DoesNotExist:
            logger.error(f"Tipo de notificação não encontrado: {tipo_codigo}")
            raise ValueError(f"Tipo de notificação '{tipo_codigo}' não encontrado")
        except Exception as e:
            logger.error(f"Erro ao criar notificação: {e}")
            raise
    
    def enviar_notificacao_tempo_real(self, notificacao: Notificacao):
        """Envia notificação em tempo real via WebSocket"""
        try:
            # TODO: Implementar WebSocket quando channels estiver configurado
            logger.info(f"Notificação em tempo real enviada: {notificacao.id}")
        except Exception as e:
            logger.error(f"Erro ao enviar notificação em tempo real: {e}")
    
    def enviar_notificacao_push(self, notificacao: Notificacao) -> bool:
        """Envia notificação push (Firebase/OneSignal)"""
        try:
            # Verificar se o usuário tem preferência para push
            if not self._verificar_preferencia_push(notificacao.destinatario, notificacao.tipo):
                return False
            
            # Obter token do dispositivo do usuário (implementar conforme necessário)
            device_tokens = self._obter_tokens_dispositivo(notificacao.destinatario)
            if not device_tokens:
                return False
            
            # Configuração do Firebase/OneSignal
            push_data = {
                "tokens": device_tokens,
                "notification": {
                    "title": notificacao.titulo,
                    "body": notificacao.mensagem,
                    "icon": "/static/img/notification-icon.png",
                    "click_action": f"/notificacoes/{notificacao.id}"
                },
                "data": {
                    "notificacao_id": str(notificacao.id),
                    "tipo": notificacao.tipo.codigo,
                    "prioridade": notificacao.prioridade,
                    **notificacao.dados_extras
                }
            }
            
            # Enviar via Firebase (exemplo)
            success = self._enviar_firebase_push(push_data)
            
            # Registrar log
            self._registrar_log_notificacao(notificacao, 'push', 'sucesso' if success else 'falha')
            
            return success
            
        except Exception as e:
            logger.error(f"Erro ao enviar notificação push: {e}")
            self._registrar_log_notificacao(notificacao, 'push', 'falha', str(e))
            return False
    
    def enviar_notificacao_sms(self, notificacao: Notificacao) -> bool:
        """Envia notificação SMS"""
        try:
            # Verificar se o usuário tem preferência para SMS
            if not self._verificar_preferencia_sms(notificacao.destinatario, notificacao.tipo):
                return False
            
            # Obter número de telefone do usuário
            telefone = self._obter_telefone_usuario(notificacao.destinatario)
            if not telefone:
                return False
            
            # Preparar mensagem SMS
            mensagem_sms = self._preparar_mensagem_sms(notificacao)
            
            # Enviar via provedor SMS (exemplo com Twilio)
            success = self._enviar_sms_twilio(telefone, mensagem_sms)
            
            # Registrar log
            self._registrar_log_notificacao(notificacao, 'sms', 'sucesso' if success else 'falha')
            
            return success
            
        except Exception as e:
            logger.error(f"Erro ao enviar notificação SMS: {e}")
            self._registrar_log_notificacao(notificacao, 'sms', 'falha', str(e))
            return False
    
    def enviar_notificacao_email(self, notificacao: Notificacao) -> bool:
        """Envia notificação por email"""
        try:
            # Verificar se o usuário tem preferência para email
            if not self._verificar_preferencia_email(notificacao.destinatario, notificacao.tipo):
                return False
            
            # Preparar template de email
            template = self._obter_template_email(notificacao.tipo)
            if not template:
                return False
            
            # Renderizar conteúdo
            contexto = {
                'notificacao': notificacao,
                'usuario': notificacao.destinatario,
                'dados_extras': notificacao.dados_extras
            }
            
            assunto = template.assunto or notificacao.titulo
            conteudo_html = render_to_string('notificacoes/email_template.html', contexto)
            conteudo_texto = render_to_string('notificacoes/email_template.txt', contexto)
            
            # Enviar email
            success = send_mail(
                subject=assunto,
                message=conteudo_texto,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notificacao.destinatario.email],
                html_message=conteudo_html,
                fail_silently=False
            )
            
            # Registrar log
            self._registrar_log_notificacao(notificacao, 'email', 'sucesso' if success else 'falha')
            
            return success > 0
            
        except Exception as e:
            logger.error(f"Erro ao enviar notificação email: {e}")
            self._registrar_log_notificacao(notificacao, 'email', 'falha', str(e))
            return False
    
    def processar_notificacoes_pendentes(self):
        """Processa todas as notificações pendentes"""
        notificacoes = Notificacao.objects.filter(
            status='pendente'
        ).filter(
            Q(agendada_para__isnull=True) | Q(agendada_para__lte=timezone.now())
        )
        
        for notificacao in notificacoes:
            try:
                self._processar_notificacao(notificacao)
            except Exception as e:
                logger.error(f"Erro ao processar notificação {notificacao.id}: {e}")
    
    def _processar_notificacao(self, notificacao: Notificacao):
        """Processa uma notificação específica"""
        # Enviar por todos os canais ativos
        canais_ativos = self._obter_canais_ativos(notificacao.destinatario, notificacao.tipo)
        
        for canal in canais_ativos:
            if canal == 'push':
                self.enviar_notificacao_push(notificacao)
            elif canal == 'sms':
                self.enviar_notificacao_sms(notificacao)
            elif canal == 'email':
                self.enviar_notificacao_email(notificacao)
            elif canal == 'sistema':
                # Notificação do sistema já foi enviada em tempo real
                pass
        
        # Marcar como enviada
        notificacao.marcar_como_enviada()
    
    def _verificar_preferencia_push(self, usuario, tipo_notificacao) -> bool:
        """Verifica se o usuário tem preferência para notificações push"""
        return PreferenciaNotificacao.objects.filter(
            usuario=usuario,
            tipo_notificacao=tipo_notificacao,
            canal='push',
            ativo=True
        ).exists()
    
    def _verificar_preferencia_sms(self, usuario, tipo_notificacao) -> bool:
        """Verifica se o usuário tem preferência para notificações SMS"""
        return PreferenciaNotificacao.objects.filter(
            usuario=usuario,
            tipo_notificacao=tipo_notificacao,
            canal='sms',
            ativo=True
        ).exists()
    
    def _verificar_preferencia_email(self, usuario, tipo_notificacao) -> bool:
        """Verifica se o usuário tem preferência para notificações email"""
        return PreferenciaNotificacao.objects.filter(
            usuario=usuario,
            tipo_notificacao=tipo_notificacao,
            canal='email',
            ativo=True
        ).exists()
    
    def _obter_canais_ativos(self, usuario, tipo_notificacao) -> List[str]:
        """Obtém os canais ativos para um usuário e tipo de notificação"""
        preferencias = list(PreferenciaNotificacao.objects.filter(
            usuario=usuario,
            tipo_notificacao=tipo_notificacao,
            ativo=True
        ))
        if not preferencias:
            return ['email']
        return [p.canal for p in preferencias]
    
    def _obter_tokens_dispositivo(self, usuario) -> List[str]:
        """Obtém tokens de dispositivo do usuário cadastrados para push."""
        if not usuario:
            return []
        return list(
            DispositivoNotificacao.objects.filter(
                usuario=usuario,
                ativo=True
            ).values_list('token', flat=True)
        )
    
    def _obter_telefone_usuario(self, usuario) -> Optional[str]:
        """Obtém telefone do usuário a partir dos perfis relacionados."""
        if not usuario:
            return None

        telefone = None

        perfil_cidadao = getattr(usuario, 'perfil_cidadao', None)
        if perfil_cidadao and getattr(perfil_cidadao, 'telefone', None):
            telefone = perfil_cidadao.telefone

        if not telefone:
            perfil_generico = getattr(usuario, 'profile', None)
            if perfil_generico and getattr(perfil_generico, 'telefone', None):
                telefone = perfil_generico.telefone

        if not telefone and hasattr(usuario, 'empresas_autorizadas'):
            telefone = (
                usuario.empresas_autorizadas.filter(
                    telefone_principal__isnull=False
                )
                .values_list('telefone_principal', flat=True)
                .first()
            )

        if not telefone:
            username_digits = re.sub(r'\D', '', usuario.username or '')
            if len(username_digits) >= 10:
                telefone = username_digits

        return self._formatar_numero_telefone(telefone)
    
    def _preparar_mensagem_sms(self, notificacao: Notificacao) -> str:
        """Prepara mensagem SMS"""
        # Limitar a 160 caracteres
        mensagem = f"{notificacao.titulo}: {notificacao.mensagem}"
        return mensagem[:160]

    def _formatar_numero_telefone(self, telefone: Optional[str]) -> Optional[str]:
        """Formata número de telefone para o padrão E.164."""
        if not telefone:
            return None

        digits = re.sub(r'\D', '', telefone)
        if not digits:
            return None

        if digits.startswith('00'):
            digits = digits[2:]

        padrao = getattr(settings, 'DEFAULT_SMS_COUNTRY_CODE', '+55')
        country_digits = re.sub(r'\D', '', padrao or '')

        if country_digits and digits.startswith(country_digits):
            local = digits[len(country_digits):]
        else:
            local = digits

        if not local:
            return None

        if len(local) > 11:
            local = local[-11:]

        if not country_digits:
            return f"+{local}" if not local.startswith('+') else local

        return f"+{country_digits}{local}"

    def enviar_sms_direto(self, telefone: str, mensagem: str) -> bool:
        """Permite enviar SMS sem precisar de uma instância de Notificação."""
        return self._enviar_sms_twilio(telefone, mensagem[:160])
    
    def _obter_template_email(self, tipo_notificacao) -> Optional[TemplateNotificacao]:
        """Obtém template de email para o tipo de notificação"""
        return TemplateNotificacao.objects.filter(
            tipo_notificacao=tipo_notificacao,
            canal='email',
            ativo=True
        ).first()
    
    def _enviar_firebase_push(self, push_data: Dict) -> bool:
        """Envia notificação push via Firebase."""
        server_key = getattr(settings, 'FIREBASE_SERVER_KEY', '')
        tokens = push_data.get('tokens') or []

        if not server_key:
            logger.warning("FIREBASE_SERVER_KEY não configurado; push não será enviado.")
            return False

        if not tokens:
            logger.debug("Nenhum token de dispositivo disponível para envio de push.")
            return False

        payload = {
            'registration_ids': tokens,
            'notification': push_data.get('notification', {}),
            'data': push_data.get('data', {}),
            'priority': 'high',
        }
        headers = {
            'Authorization': f'key={server_key}',
            'Content-Type': 'application/json',
        }

        try:
            response = requests.post(
                'https://fcm.googleapis.com/fcm/send',
                headers=headers,
                json=payload,
                timeout=10,
            )
            if response.status_code != 200:
                logger.error(
                    "Falha ao enviar push (status: %s, resposta: %s)",
                    response.status_code,
                    response.text,
                )
                return False

            resultado = response.json()
            if resultado.get('failure'):
                logger.warning("Firebase retornou falhas: %s", resultado)
            return bool(resultado.get('success'))
        except requests.RequestException as exc:
            logger.error(f"Erro de comunicação com Firebase: {exc}")
            return False
        except Exception as exc:
            logger.error(f"Erro ao enviar push Firebase: {exc}")
            return False
    
    def _enviar_sms_twilio(self, telefone: str, mensagem: str) -> bool:
        """Envia SMS via Twilio utilizando as credenciais configuradas."""
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        from_number = getattr(settings, 'TWILIO_FROM_NUMBER', '')

        if not (account_sid and auth_token and from_number):
            logger.warning("Credenciais do Twilio não configuradas; SMS não será enviado.")
            return False

        numero_formatado = self._formatar_numero_telefone(telefone)
        if not numero_formatado:
            logger.warning("Número de telefone inválido para envio de SMS: %s", telefone)
            return False

        payload = {
            'To': numero_formatado,
            'From': from_number,
            'Body': mensagem[:160],
        }

        try:
            response = requests.post(
                f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json',
                data=payload,
                auth=(account_sid, auth_token),
                timeout=10,
            )
            if response.status_code not in (200, 201):
                logger.error(
                    "Falha ao enviar SMS (status: %s, resposta: %s)",
                    response.status_code,
                    response.text,
                )
                return False
            logger.info("SMS enviado para %s", numero_formatado)
            return True
        except requests.RequestException as exc:
            logger.error(f"Erro de comunicação com Twilio: {exc}")
            return False
        except Exception as exc:
            logger.error(f"Erro ao enviar SMS via Twilio: {exc}")
            return False
    
    def _registrar_log_notificacao(self, notificacao: Notificacao, canal: str, resultado: str, mensagem_erro: str = ""):
        """Registra log de notificação"""
        LogNotificacao.objects.create(
            notificacao=notificacao,
            canal=canal,
            resultado=resultado,
            mensagem_erro=mensagem_erro
        )


class ConfiguracaoNotificacaoService:
    """Serviço para configurações avançadas de notificações"""
    
    @staticmethod
    def configurar_preferencias_usuario(usuario_id: int, configuracoes: Dict[str, Any]):
        """Configura preferências de notificação para um usuário"""
        try:
            for tipo_codigo, canais in configuracoes.items():
                tipo = TipoNotificacao.objects.get(codigo=tipo_codigo)
                
                # Desativar todos os canais para este tipo
                PreferenciaNotificacao.objects.filter(
                    usuario_id=usuario_id,
                    tipo_notificacao=tipo
                ).update(ativo=False)
                
                # Ativar canais selecionados
                for canal in canais:
                    PreferenciaNotificacao.objects.update_or_create(
                        usuario_id=usuario_id,
                        tipo_notificacao=tipo,
                        canal=canal,
                        defaults={'ativo': True}
                    )
            
            logger.info(f"Preferências configuradas para usuário {usuario_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao configurar preferências: {e}")
            return False
    
    @staticmethod
    def obter_estatisticas_notificacoes(usuario_id: int = None, periodo_dias: int = 30) -> Dict[str, Any]:
        """Obtém estatísticas de notificações"""
        data_inicio = timezone.now() - timedelta(days=periodo_dias)
        
        filtros = {'criado_em__gte': data_inicio}
        if usuario_id:
            filtros['destinatario_id'] = usuario_id
        
        notificacoes = Notificacao.objects.filter(**filtros)
        
        return {
            'total': notificacoes.count(),
            'enviadas': notificacoes.filter(status='enviada').count(),
            'lidas': notificacoes.filter(status='lida').count(),
            'pendentes': notificacoes.filter(status='pendente').count(),
            'falhadas': notificacoes.filter(status='falhada').count(),
            'por_prioridade': {
                'baixa': notificacoes.filter(prioridade='baixa').count(),
                'normal': notificacoes.filter(prioridade='normal').count(),
                'alta': notificacoes.filter(prioridade='alta').count(),
                'urgente': notificacoes.filter(prioridade='urgente').count(),
            },
            'por_tipo': {}
        }
    
    @staticmethod
    def limpar_notificacoes_antigas(dias: int = 90):
        """Remove notificações antigas"""
        data_limite = timezone.now() - timedelta(days=dias)
        count = Notificacao.objects.filter(
            criado_em__lt=data_limite,
            status__in=['enviada', 'lida', 'falhada']
        ).delete()[0]
        
        logger.info(f"Removidas {count} notificações antigas")
        return count


# Instância global do serviço
notificacao_service = NotificacaoService()
configuracao_service = ConfiguracaoNotificacaoService()

"""
Serviços para Portal da Empresa
Sistema Procon - Fase 5 - Portal Externo & Integradores
"""

import json
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import re
from django.utils import timezone
from django.db import transaction
from django.db.models import Avg, Max, ExpressionWrapper, DurationField, F, Value, CharField
from django.db.models.functions import Replace
from django.core.mail import send_mail
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.models import User
from django.template import TemplateDoesNotExist
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import (
    EmpresaAutorizada, UsuarioEmpresaAutorizado, TokenEmpresa,
    RespostaEmpresaPortal, HistoricoEmpresaPortal, WebhookConfiguration,
    APIAnalytics
)
from cip_automatica.models import CIPAutomatica, RespostaEmpresa
from audiencia_calendario.models import AgendamentoAudiencia
from logging_config import logger_manager, LoggedOperation, log_execution_time
from portal_cidadao.models import ReclamacaoDenuncia


class GestaoEmpresaService:
    """Serviço principal para gestão de empresas no portal"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('portal_empresa')
    
    @log_execution_time('registrar_empresa')
    def registrar_empresa(self, dados_empresa: Dict[str, Any], 
                         usuario_solicitante: User) -> EmpresaAutorizada:
        """Registra nova empresa no portal"""
        
        with LoggedOperation('registrar_empresa', {
            'razao_social': dados_empresa.get('razao_social'),
            'cnpj': dados_empresa.get('cnpj'),
            'solicitante': usuario_solicitante.username,
        }):
            try:
                with transaction.atomic():
                    empresa = EmpresaAutorizada.objects.create(
                        razao_social=dados_empresa['razao_social'],
                        nome_fantasia=dados_empresa.get('nome_fantasia', ''),
                        cnpj=dados_empresa['cnpj'],
                        
                        email_principal=dados_empresa['email_principal'],
                        telefone_principal=dados_empresa.get('telefone_principal', ''),
                        responsavel_legal=dados_empresa['responsavel_legal'],
                        
                        endereco_completo=dados_empresa['endereco_completo'],
                        cidade=dados_empresa['cidade'],
                        estado=dados_empresa['estado'],
                        cep=dados_empresa['cep'],
                        
                        canal_contato_preferencial=dados_empresa.get('canal_contato_preferencial', 'EMAIL'),
                    )
                    
                    # Gerar API key
                    empresa.gerar_api_key()
                    empresa.save()
                    
                    # Autorizar usuário solicitante
                    empresa.autorizar_usuario(usuario_solicitante, 'ADMIN')
                    
                    # Registrar histórico
                    self._registrar_historico(empresa, usuario_solicitante, 'REGISTRO', 
                                            f'Empresa {empresa.razao_social} registrada no portal')
                    
                    # Enviar confirmação
                    self._enviar_confirmacao_registro(empresa)
                    
                    self.logger.log_operation('empresa_registrada', {
                        'empresa_id': empresa.id,
                        'cnpj': empresa.cnpj,
                        'status': empresa.status,
                    })
                    
                    return empresa
                    
            except Exception as e:
                self.logger.error(f'Erro no registro da empresa: {str(e)}', exc_info=True)
                return False
    
    @log_execution_time('gerenciar_token')
    def gerar_token_acesso(self, empresa: EmpresaAutorizada, usuario_gerador: User, 
                          escopo_permitido: List[str] = None) -> TokenEmpresa:
        """Gera token de acesso para empresa"""
        
        try:
            escopo_default = ['read_cips', 'write_responses', 'read_audiences']
            escopo = escopo_permitido or escopo_default
            
            with transaction.atomic():
                token = TokenEmpresa.objects.create(
                    empresa=empresa,
                    usuario_criador=usuario_gerador,
                    escopo_permitido=escopo,
                    ips_permitidos=[],  # Todos os IPs por padrão
                )
                
                token.gerar_tokens()
                token.save()
                
                # Registrar histórico
                self._registrar_historico(empresa, usuario_gerador, 'TOKEN_CREATED', 
                                        f'Token de acesso gerado - Escopo: {", ".join(escopo)}')
                
                return token
                
        except Exception as e:
            self.logger.error(f'Erro ao gerar token: {str(e)}', exc_info=True)
    
    @log_execution_time('autenticar_empresa')
    def autenticar_empresa_token(self, token: str, ip_acesso: str) -> Tuple[bool, Optional[EmpresaAutorizada]]:
        """Autentica empresa via token"""
        
        try:
            self.sincronizar_tokens_expirados()
            token_obj = TokenEmpresa.objects.select_related('empresa').get(
                token=token,
                ativo=True
            )
            
            if not token_obj.is_valid(ip_acesso):
                return False, None
            
            # Incrementar uso
            token_obj.contador_acesso += 1
            token_obj.ultimo_ip_acesso = ip_acesso
            token_obj.usado_em = timezone.now()
            token_obj.save()
            
            # Atualizar último acesso da empresa
            token_obj.empresa.data_ultimo_acesso = timezone.now()
            token_obj.empresa.save(update_fields=['data_ultimo_acesso'])
            
            return True, token_obj.empresa
            
        except TokenEmpresa.DoesNotExist:
            return False, None
        except Exception as e:
            self.logger.error(f'Erro na autenticação: {str(e)}')
            return False, None
    
    def _registrar_historico(self, empresa: EmpresaAutorizada, usuario: User, 
                           tipo_acao: str, descricao: str, protocolo: str=''):
        """Registra ação no histórico da empresa"""
        
        HistoricoEmpresaPortal.objects.create(
            empresa=empresa,
            usuario=usuario,
            tipo_acao=tipo_acao,
            descricao_acao=descricao,
            protocolo_relacionado=protocolo,
            ip_address='127.0.0.1',  # Placeholder
        )

    @staticmethod
    def _converter_duracao_em_horas(valor: Optional[timedelta]) -> Optional[float]:
        """Converte `timedelta` em horas com duas casas decimais."""
        if not valor:
            return None
        return round(valor.total_seconds() / 3600, 2)

    def obter_metricas_globais_engajamento(self) -> Dict[str, Any]:
        """Consolida métricas de engajamento para o dashboard corporativo."""
        empresas_ativas = EmpresaAutorizada.objects.exclude(status__in=['BLOQUEADA', 'REVOGADA'])
        empresas_count = empresas_ativas.count()

        cnpj_numericos = [
            re.sub(r'\D', '', cnpj or '')
            for cnpj in empresas_ativas.values_list('cnpj', flat=True)
        ]
        cnpj_numericos = [cnpj for cnpj in cnpj_numericos if cnpj]

        reclamacoes = ReclamacaoDenuncia.objects.annotate(
            cnpj_numeric=Replace(
                Replace(Replace(F('empresa_cnpj'), Value('.'), Value('')), Value('/'), Value('')),
                Value('-'),
                Value(''),
                output_field=CharField(),
            )
        )
        if cnpj_numericos:
            reclamacoes = reclamacoes.filter(cnpj_numeric__in=cnpj_numericos)
        else:
            reclamacoes = reclamacoes.none()

        agora = timezone.now()
        periodo_30_dias = agora - timedelta(days=30)

        reclamacoes_total = reclamacoes.count()
        reclamacoes_respondidas = (
            reclamacoes.filter(respostas_portal__empresa__in=empresas_ativas)
            .distinct()
            .count()
        )
        reclamacoes_pendentes = max(reclamacoes_total - reclamacoes_respondidas, 0)
        reclamacoes_ultimos_30 = reclamacoes.filter(criado_em__gte=periodo_30_dias).count()

        respostas = RespostaEmpresaPortal.objects.filter(
            empresa__in=empresas_ativas,
            status__in=['ENVIADA', 'RECEBIDA_AUDITORIA', 'ANALISANDO', 'ACEITA', 'REJEITADA', 'SOLICITA_COMPLEMENTO'],
        )
        respostas_total = respostas.count()
        respostas_ultimos_30 = respostas.filter(data_envio__gte=periodo_30_dias).count()

        taxa_resposta = (
            (reclamacoes_respondidas / reclamacoes_total * 100)
            if reclamacoes_total else 0
        )

        respostas_com_tempo = respostas.filter(
            data_envio__isnull=False,
            reclamacao_relacionada__data_notificacao__isnull=False,
        ).annotate(
            tempo_resposta=ExpressionWrapper(
                F('data_envio') - F('reclamacao_relacionada__data_notificacao'),
                output_field=DurationField(),
            )
        )
        agregados_tempo = respostas_com_tempo.aggregate(
            media=Avg('tempo_resposta'),
            maximo=Max('tempo_resposta'),
        )

        tokens_ativos = TokenEmpresa.objects.filter(ativo=True).count()
        tokens_expirando = TokenEmpresa.objects.filter(
            ativo=True,
            data_expiracao__gt=agora,
            data_expiracao__lte=agora + timedelta(days=7),
        ).count()
        tokens_expirados = TokenEmpresa.objects.filter(
            ativo=False,
            revogado_em__isnull=False,
        ).count()

        return {
            'empresas_monitoradas': empresas_count,
            'reclamacoes_total': reclamacoes_total,
            'reclamacoes_respondidas': reclamacoes_respondidas,
            'reclamacoes_pendentes': reclamacoes_pendentes,
            'reclamacoes_ultimos_30_dias': reclamacoes_ultimos_30,
            'respostas_total': respostas_total,
            'respostas_ultimos_30_dias': respostas_ultimos_30,
            'taxa_resposta_percentual': round(taxa_resposta, 2),
            'tempo_medio_resposta_horas': self._converter_duracao_em_horas(agregados_tempo.get('media')),
            'tempo_maximo_resposta_horas': self._converter_duracao_em_horas(agregados_tempo.get('maximo')),
            'tokens_ativos': tokens_ativos,
            'tokens_expirando_7_dias': tokens_expirando,
            'tokens_expirados': tokens_expirados,
        }

    def obter_metricas_engajamento(self, empresa: EmpresaAutorizada) -> Dict[str, Any]:
        """Resumo detalhado de engajamento para uma empresa espec�fica."""
        if not empresa:
            return {}

        self.sincronizar_tokens_expirados()

        agora = timezone.now()
        periodo_30_dias = agora - timedelta(days=30)

        cnpj_numerico = re.sub(r'\D', '', empresa.cnpj or '')
        reclamacoes = ReclamacaoDenuncia.objects.annotate(
            cnpj_numeric=Replace(
                Replace(Replace(F('empresa_cnpj'), Value('.'), Value('')), Value('/'), Value('')),
                Value('-'),
                Value(''),
                output_field=CharField(),
            )
        )
        if cnpj_numerico:
            reclamacoes = reclamacoes.filter(cnpj_numeric=cnpj_numerico)
        else:
            reclamacoes = reclamacoes.none()

        reclamacoes_total = reclamacoes.count()
        reclamacoes_respondidas = (
            reclamacoes.filter(respostas_portal__empresa=empresa)
            .distinct()
            .count()
        )
        reclamacoes_ultimos_30 = reclamacoes.filter(criado_em__gte=periodo_30_dias).count()
        reclamacoes_pendentes = max(reclamacoes_total - reclamacoes_respondidas, 0)

        respostas = RespostaEmpresaPortal.objects.filter(
            empresa=empresa,
            status__in=['ENVIADA', 'RECEBIDA_AUDITORIA', 'ANALISANDO', 'ACEITA', 'REJEITADA', 'SOLICITA_COMPLEMENTO'],
        )
        respostas_total = respostas.count()
        respostas_ultimos_30 = respostas.filter(data_envio__gte=periodo_30_dias).count()

        taxa_resposta = (
            (reclamacoes_respondidas / reclamacoes_total * 100)
            if reclamacoes_total else 0
        )

        respostas_com_tempo = respostas.filter(
            data_envio__isnull=False,
            reclamacao_relacionada__data_notificacao__isnull=False,
        ).annotate(
            tempo_resposta=ExpressionWrapper(
                F('data_envio') - F('reclamacao_relacionada__data_notificacao'),
                output_field=DurationField(),
            )
        )
        agregados_tempo = respostas_com_tempo.aggregate(
            media=Avg('tempo_resposta'),
            maximo=Max('tempo_resposta'),
        )

        tokens_empresa = TokenEmpresa.objects.filter(empresa=empresa)
        tokens_ativos = tokens_empresa.filter(ativo=True).count()
        tokens_expirando = tokens_empresa.filter(
            ativo=True,
            data_expiracao__gt=agora,
            data_expiracao__lte=agora + timedelta(days=7),
        ).count()
        tokens_expirados = tokens_empresa.filter(ativo=False, revogado_em__isnull=False).count()

        return {
            'empresa_id': empresa.id,
            'empresa_razao_social': empresa.razao_social,
            'reclamacoes_total': reclamacoes_total,
            'reclamacoes_respondidas': reclamacoes_respondidas,
            'reclamacoes_pendentes': reclamacoes_pendentes,
            'reclamacoes_ultimos_30_dias': reclamacoes_ultimos_30,
            'respostas_total': respostas_total,
            'respostas_ultimos_30_dias': respostas_ultimos_30,
            'taxa_resposta_percentual': round(taxa_resposta, 2),
            'tempo_medio_resposta_horas': self._converter_duracao_em_horas(agregados_tempo.get('media')),
            'tempo_maximo_resposta_horas': self._converter_duracao_em_horas(agregados_tempo.get('maximo')),
            'tokens_ativos': tokens_ativos,
            'tokens_expirando_7_dias': tokens_expirando,
            'tokens_expirados': tokens_expirados,
            'ultima_atualizacao': agora.isoformat(),
        }

    def sincronizar_tokens_expirados(self) -> int:
        """Desativa tokens expirados e registra histórico."""
        agora = timezone.now()
        expirados = TokenEmpresa.objects.filter(ativo=True, data_expiracao__lt=agora).select_related('empresa')
        total = 0

        for token in expirados:
            token.ativo = False
            token.revogado_em = agora
            token.motivo_revocacao = f'Token expirado automaticamente em {agora.strftime("%d/%m/%Y %H:%M")}.'
            token.save(update_fields=['ativo', 'revogado_em', 'motivo_revocacao'])

            self._registrar_historico(
                empresa=token.empresa,
                usuario=token.usuario_criador,
                tipo_acao='TOKEN_EXPIRED',
                descricao=f'Token com final {token.token[-6:]} expirado automaticamente.',
            )
            total += 1

        return total
    
    def _enviar_confirmacao_registro(self, empresa: EmpresaAutorizada) -> bool:
        """Envia email de confirmacao para empresa com fallback seguro."""
        subject = f"Confirmacao de Registro - {empresa.razao_social}"
        context = {
            'empresa': empresa,
            'portal_url': getattr(settings, 'PORTAL_EMPRESA_URL', ''),
        }

        html_message = None
        for template_name in [
            'portal_empresa/email_confirmacao_registro.html',
            'portal_empresa/default_email_confirmacao_registro.html',
        ]:
            try:
                html_message = render_to_string(template_name, context)
                break
            except TemplateDoesNotExist:
                continue

        if not html_message:
            html_message = (
                "<html><body>"
                f"<p>Prezada empresa <strong>{empresa.razao_social}</strong>,</p>"
                "<p>Seu registro no Portal da Empresa foi realizado com sucesso.</p>"
                f"<p>API Key: <strong>{empresa.api_key or ''}</strong></p>"
                "<p>Atenciosamente,<br>Equipe PROCON</p>"
                "</body></html>"
            )

        plain_message = strip_tags(html_message) or f"Registro confirmado para {empresa.razao_social}."

        destinatarios = set()
        if empresa.email_principal:
            destinatarios.add(empresa.email_principal)

        usuarios = UsuarioEmpresaAutorizado.objects.filter(empresa=empresa).select_related('usuario')
        for relacao in usuarios:
            email = getattr(relacao.usuario, 'email', None)
            if email:
                destinatarios.add(email)

        destinatarios = [email for email in destinatarios if email]
        if not destinatarios:
            self.logger.warning('Nenhum destinatario localizado para confirmacao de registro.')
            return False

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=destinatarios,
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as exc:
            self.logger.error(f'Erro ao enviar confirmacao de registro: {exc}', exc_info=True)
            return False

    def enviar_email_boas_vindas(self, empresa: EmpresaAutorizada) -> bool:
        """Interface publica para envio de mensagem de boas-vindas."""
        return bool(self._enviar_confirmacao_registro(empresa))

class RespostaEmpresaService:
    """Serviço para gestão de respostas da empresa"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('resposta_empresa_plugin')
    
    @log_execution_time('enviar_resposta_empresa')
    def enviar_resposta_empresa(self, empresa: EmpresaAutorizada, usuario: User,
                              dados_resposta: Dict[str, Any], token_usado: TokenEmpresa = None) -> RespostaEmpresaPortal:
        """Envia resposta formal da empresa"""
        
        with LoggedOperation('enviar_resposta_empresa', {
            'empresa': empresa.razao_social,
            'tipo_documento': dados_resposta.get('tipo_documento'),
            'tem_cip': bool(dados_resposta.get('cip_id')),
        }):
            try:
                with transaction.atomic():
                    # Buscar CIP relacionada
                    cip_relacionada = None
                    audiencia_relacionada = None
                    reclamacao_relacionada = None
                    
                    if dados_resposta.get('cip_id'):
                        try:
                            cip_relacionada = CIPAutomatica.objects.get(id=dados_resposta['cip_id'])
                        except CIPAutomatica.DoesNotExist:
                            raise ValueError("CIP não encontrada")
                    
                    if dados_resposta.get('audiencia_id'):
                        try:
                            audiencia_relacionada = AgendamentoAudiencia.objects.get(id=dados_resposta['audiencia_id'])
                        except AgendamentoAudiencia.DoesNotExist:
                            raise ValueError("Audiência não encontrada")
                    
                    if dados_resposta.get('reclamacao_id'):
                        try:
                            reclamacao_relacionada = ReclamacaoDenuncia.objects.get(id=dados_resposta['reclamacao_id'])
                        except ReclamacaoDenuncia.DoesNotExist:
                            raise ValueError("Reclama��o não encontrada")

                    # Criar resposta
                    resposta = RespostaEmpresaPortal.objects.create(
                        empresa=empresa,
                        usuario_enviador=usuario,
                        token_usado=token_usado,
                        
                        cip_relacionada=cip_relacionada,
                        audiencia_relacionada=audiencia_relacionada,
                        reclamacao_relacionada=reclamacao_relacionada,
                        
                        tipo_documento=dados_resposta['tipo_documento'],
                        titulo_resposta=dados_resposta['titulo'],
                        conteudo_resposta=dados_resposta['conteudo'],
                        
                        documentos_anexados=dados_resposta.get('anexos', []),
                        quantidade_anexos=len(dados_resposta.get('anexos', [])),
                        
                        valor_proposta=dados_resposta.get('valor_proposta'),
                        prazo_pagamento_proposta=dados_resposta.get('prazo_pagamento'),
                        forma_pagamento_proposta=dados_resposta.get('forma_pagamento', ''),
                    )
                    
                    # Enviar formalmente
                    resposta.enviar_resposta()
                    
                    # Registrar hist�rico
                    protocolo_rel = ''
                    tipo_acao_hist = 'RESPONSE_CIP'
                    if cip_relacionada:
                        protocolo_rel = getattr(cip_relacionada, 'numero_protocolo', '') or ''
                    elif reclamacao_relacionada:
                        tipo_acao_hist = 'RESPONSE_RECLAMACAO'
                        protocolo_rel = reclamacao_relacionada.numero_protocolo

                    self._registrar_historico(
                        empresa=empresa,
                        usuario=usuario,
                        tipo_acao=tipo_acao_hist,
                        descricao=f'Resposta enviada: {resposta.titulo_resposta}',
                        protocolo=protocolo_rel,
                    )

                    # Integrar com m�dulos relacionados
                    if cip_relacionada:
                        self._atualizar_resposta_cip_automatica(resposta)

                    self.logger.log_operation('resposta_enviada', {
                        'resposta_id': resposta.id,
                        'empresa': empresa.razao_social,
                        'tipo': resposta.tipo_documento,
                        'protocolo': protocolo_rel or None,
                    })
                    
                    return resposta
                    
            except Exception as e:
                self.logger.error(f'Erro ao enviar resposta empresa: {str(e)}', exc_info=True)
    
    def _registrar_historico(
        self,
        empresa: EmpresaAutorizada,
        usuario: Optional[User],
        tipo_acao: str,
        descricao: str,
        protocolo: str = '',
        ip_address: str = '127.0.0.1',
    ) -> None:
        """Registra histórico corporativo específico das respostas enviadas."""
        HistoricoEmpresaPortal.objects.create(
            empresa=empresa,
            usuario=usuario,
            tipo_acao=tipo_acao,
            descricao_acao=descricao,
            protocolo_relacionado=protocolo,
            ip_address=ip_address,
        )

    def _atualizar_resposta_cip_automatica(self, resposta: RespostaEmpresaPortal):
        """Integra resposta do portal com módulo de CIP automática"""
        
        try:
            if resposta.cip_relacionada and resposta.tipo_documento == 'DEFESA_CIP':
                
                # Criar resposta estruturada usando análise automática
                from resposta_empresa.services import analise_service
                
                analise_resultado = analise_service.analisar_resposta_empresa(
                    cip_id=str(resposta.cip_relacionada.id),
                    texto_resposta=resposta.conteudo_resposta,
                    valor_oferecido=resposta.valor_proposta,
                    usuario_analista=None  # Processado automaticamente
                )
                
                self.logger.info(f'Resposta integrada com análise automática: {analise_resultado.id}')
                
        except Exception as e:
            self.logger.error(f'Erro na integração da resposta: {str(e)}')


class APIIntegrationService:
    """Serviço para integração via API e webhooks"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('api_integration_empresa')
    
    @log_execution_time('processar_webhook')
    def processar_webhook(self, empresa: EmpresaAutorizada, evento: str, 
                         dados_evento: Dict[str, Any]) -> bool:
        """Processa webhook enviado para empresa"""
        
        try:
            webhooks_empresa = WebhookConfiguration.objects.filter(
                empresa=empresa,
                ativo=True,
                eventos_suscritos__contains=[evento]
            )
            
            resultados = []
            
            for webhook in webhooks_empresa:
                resultado = self._enviar_webhook(webhook, evento, dados_evento)
                resultados.append(resultado)
                
                # Atualizar contadores
                if resultado['sucesso']:
                    webhook.contador_enviadas += 1
                    webhook.ultimo_test_success = timezone.now()
                else:
                    webhook.contador_falhas += 1
                
                webhook.save()
            
            sucesso_geral = any(r['sucesso'] for r in resultados)
            
            self.logger.log_operation('webhook_processado', {
                'empresa': empresa.razao_social,
                'evento': evento,
                'webhooks_ativos': len(webhooks_empresa),
                'sucesso': sucesso_geral,
            })
            
            return sucesso_geral
            
        except Exception as e:
            self.logger.error(f'Erro no processamento de webhook: {str(e)}')
            return False
    
    def _enviar_webhook(self, webhook: WebhookConfiguration, evento: str, 
                        dados: Dict[str, Any]) -> Dict[str, Any]:
        """Envia webhook para endpoint da empresa"""
        
        try:
            import requests
            import time
            
            payload = {
                'evento': evento,
                'timestamp': timezone.now().isoformat(),
                'dados': dados,
                'empresa_cnpj': webhook.empresa.cnpj,
            }
            
            # Assinatura de segurança
            payload['signature'] = self._gerar_signature(payload, webhook.secret_key)
            
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'PROCON-Webhook-Delivery'
            }
            
            # Enviar webhook
            inicio = time.perf_counter()
            response = requests.post(
                webhook.endpoint_url,
                json=payload,
                headers=headers,
                timeout=webhook.timeout_segundos,
                verify=webhook.verificar_ssl
            )
            fim = time.perf_counter()
            
            return {
                'sucesso': response.status_code in [200, 201, 202],
                'status_code': response.status_code,
                'tempo_resposta': fim - inicio,
                'webhook_id': webhook.id,
            }
            
        except Exception as e:
            return {
                'sucesso': False,
                'erro': str(e),
                'webhook_id': webhook.id,
            }
    
    def _gerar_signature(self, payload: Dict[str, Any], secret: str) -> str:
        """Gera assinatura de segurança para webhook"""
        
        payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        signature = hmac.new(
            secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    @log_execution_time('gerar_relatorio_api')
    def gerar_relatorio_api(self, empresa: EmpresaAutorizada, 
                           periodo_inicio: datetime, periodo_fim: datetime) -> Dict[str, Any]:
        """Gera relatório de uso da API da empresa"""
        
        try:
            # Buscar analytics do período
            analytics = APIAnalytics.objects.filter(
                empresa=empresa,
                data_analise__range=[periodo_inicio.date(), periodo_fim.date()]
            )
            
            # Agregar dados
            total_requests = sum(a.total_requests for a in analytics)
            requests_sucesso = sum(a.requests_success for a in analytics)
            requests_falha = sum(a.requests_failed for a in analytics)
            
            taxa_sucesso = (requests_sucesso / total_requests * 100) if total_requests > 0 else 0
            
            tempo_medio_ms = sum(a.tempo_resposta_medio_ms * a.total_requests for a in analytics)
            tempo_medio_ms = tempo_medio_ms / total_requests if total_requests > 0 else 0
            
            relatorio = {
                'periodo': {
                    'inicio': periodo_inicio.date().isoformat(),
                    'fim': periodo_fim.date().isoformat(),
                },
                'empresa': {
                    'razao_social': empresa.razao_social,
                    'cnpj': empresa.cnpj,
                    'nivel_acesso': empresa.nivel_acesso,
                },
                'resumo': {
                    'total_requests': total_requests,
                    'requests_sucesso': requests_sucesso,
                    'requests_falha': requests_falha,
                    'taxa_sucesso_percent': round(taxa_sucesso, 2),
                    'tempo_resposta_medio_ms': round(tempo_medio_ms, 2),
                },
                'bandwidth_total_mb': sum(a.bandwidth_consumida_mb for a in analytics),
                'eventos_webhook': metrics_webhook_empresa(empresa, periodo_inicio, periodo_fim),
            }
            
            return relatorio
            
        except Exception as e:
            self.logger.error(f'Erro no relatório API: {str(e)}')


# Instâncias globais dos serviços
gestao_empresa_service = GestaoEmpresaService()
resposta_empresa_service = RespostaEmpresaService()
api_integration_service = APIIntegrationService()

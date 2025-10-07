"""
Serviços para Portal da Empresa
Sistema Procon - Fase 5 - Portal Externo & Integradores
"""

import json
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.http import JsonResponse
from django.conf import settings

from .models import (
    EmpresaAutorizada, UsuarioEmpresaAutorizado, TokenEmpresa,
    RespostaEmpresaPortal, HistoricoEmpresaPortal, WebhookConfiguration,
    APIAnalytics
)
from cip_automatica.models import CIPAutomatica, RespostaEmpresa
from audiencia_calendario.models import AgendamentoAudiencia
from logging_config import logger_manager, LoggedOperation, log_execution_time


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
                raise
    
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
            raise
    
    @log_execution_time('autenticar_empresa')
    def autenticar_empresa_token(self, token: str, ip_acesso: str) -> Tuple[bool, Optional[EmpresaAutorizada]]:
        """Autentica empresa via token"""
        
        try:
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
    
    def _enviar_confirmacao_registro(self, empresa: EmpresaAutorizada):
        """Envia email de confirmação para empresa"""
        subject = f"Confirmação de Registro - {empresa.razao_social}"
        
        html_message = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ background-color: #1976d2; color: white; padding: 20px; text-align: center; }}
                .content {{ margin-top: 20px; }}
                .info {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PROCON - Portal da Empresa</h1>
            </div>
            
            <div class="content">
                <h2>Registro Confirmado</h2>
                <p>Prezada Empresa <strong>{empresa.razao_social}</strong>,</p>
                
                <p>Seu registro no Portal da Empresa foi realizado com sucesso!</p>
                
                <div class="info">
                    <h3>Informações do Registro:</h3>
                    <p><strong>CNPJ:</strong> {empresa.cnpj}</p>
                    <p><strong>Status:</strong> {empresa.get_status_display()}</p>
                    <p><strong>Nível de Acesso:</strong> {empresa.get_nivel_acesso_display()}</p>
                    <p><strong>API Key:</strong> {empresa.api_key}</p>
                </div>
                
                <p>Agora você pode:</p>
                <ul>
                    <li>Acessar CIPs enviadas para sua empresa</li>
                    <li>Enviar respostas e defesas</li>
                    <li>Agendar audiências de conciliação</li>
                    <li>Visualizar relatórios gerenciais</li>
                    <li>Integrar via API/webhook</li>
                </ul>
                
                <p><em>Atenciosamente,<br>Equipe PROCON</em></p>
            </div>
        </body>
        </html>
        """
        
        try:
            send_mail(
                subject=subject,
                message=f"Registro confirmado para {empresa.razao_social}",
                html_message=html_message,
                from_email='noreply@procon.local',
                recipient_list=[empresa.email_principal],
                fail_silently=False,
            )
        except Exception as e:
            self.logger.error(f'Erro ao enviar confirmação: {str(e)}')


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
                    
                    # Criar resposta
                    resposta = RespostaEmpresaPortal.objects.create(
                        empresa=empresa,
                        usuario_enviador=usuario,
                        token_usado=token_usado,
                        
                        cip_relacionada=cip_relacionada,
                        audiencia_relacionada=audiencia_relacionada,
                        
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
                    
                    # Registrar histórico
                    self._registrar_historico(empresa, usuario, 'RESPONSE_CIP', 
                                            f'Resposta enviada: {resposta.titulo_resposta}')
                    
                    # Integrar com módulos relacionados
                    if cip_relacionada:
                        self._atualizar_resposta_cip_automatica(resposta)
                    
                    self.logger.log_operation('resposta_enviada', {
                        'resposta_id': resposta.id,
                        'empresa': empresa.razao_social,
                        'tipo': resposta.tipo_documento,
                        'protocolo': cip_relacionada.numero_protocolo if cip_relacionada else None,
                    })
                    
                    return resposta
                    
            except Exception as e:
                self.logger.error(f'Erro ao enviar resposta empresa: {str(e)}', exc_info=True)
                raise
    
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
            raise


# Instâncias globais dos serviços
gestao_empresa_service = GestaoEmpresaService()
resposta_empresa_service = RespostaEmpresaService()
api_integration_service = APIIntegrationService()

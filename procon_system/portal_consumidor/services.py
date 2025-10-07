"""
Serviços para Portal do Consumidor
Sistema Procon - Fase 5 - Portal Externo & Integradores
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.utils.text import slugify
from django.template.loader import render_to_string

from .models import (
    SessaoConsulta, HistoricoConsulta, DocumentosPortal,
    NotificacaoConsumidor, FeedbackConsumidor
)
from caixa_entrada.models import CaixaEntrada
from cip_automatica.models import CIPAutomatica, RespostaEmpresa
from audiencia_calendario.models import AgendamentoAudiencia
from portal_cidadao.models import ReclamacaoDenuncia
from logging_config import logger_manager, LoggedOperation, log_execution_time


class ConsultaPortalService:
    """Serviço principal de consultas no portal do consumidor"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('portal_consumidor')
    
    @log_execution_time('criar_sessao_consulta')
    def criar_sessao_consulta(self, ip_address: str, user_agent: str, 
                             tipo_consulta: str='PROTOCOLO') -> SessaoConsulta:
        """Cria nova sessão de consulta para o consumidor"""
        
        with LoggedOperation('criar_sessao_consulta', {
            'ip_address': ip_address,
            'tipo_consulta': tipo_consulta,
        }):
            try:
                # Verificar limites de segurança por IP
                agora = timezone.now()
                ultima_hora = agora - timedelta(hours=1)
                
                sessoes_recentes = SessaoConsulta.objects.filter(
                    ip_address=ip_address,
                    data_criacao__gte=ultima_hora
                ).count()
                
                if sessoes_recentes >= 10:  # Limite de segurança
                    raise ValueError("Muitas consultas recentes deste IP. Aguarde 1 hora.")
                
                with transaction.atomic():
                    sessao = SessaoConsulta.objects.create(
                        tipo_consulta=tipo_consulta,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        data_expiracao=agora + timedelta(hours=2),  # Validade de 2 horas
                    )
                    
                    sessao.gerar_token_consulta()
                    sessao.save()
                    
                    self.logger.log_operation('sessao_consulta_criada', {
                        'sessao_id': sessao.id,
                        'token': sessao.token_consulta[:8],
                        'ip_address': ip_address,
                    })
                    
                    return sessao
                    
            except Exception as e:
                self.logger.error(f'Erro ao criar sessão de consulta: {str(e)}', exc_info=True)
                raise
    
    @log_execution_time('buscar_documento_consumidor')
    def buscar_documento_consumidor(self, sessao: SessaoConsulta, 
                                  protocolo: str = '', cpf: str = '', 
                                  email: str = '') -> HistoricoConsulta:
        """Busca documentos relacionados ao consumidor"""
        
        with LoggedOperation('buscar_documento_consumidor', {
            'sessao_id': sessao.id,
            'protocolo': protocolo[:10] if protocolo else '',
            'tem_cpf': bool(cpf),
            'tem_email': bool(email),
        }):
            try:
                inicio_busca = timezone.now()
                
                documentos_encontrados = []
                quantidade_encontrada = 0
                resultado = 'NAO_ENCONTRADO'
                
                # Buscar em diferentes módulos baseado nos critérios
                if protocolo:
                    documentos_encontrados.extend(self._buscar_por_protocolo(protocolo))
                elif cpf:
                    documentos_encontrados.extend(self._buscar_por_cpf(cpf))
                elif email:
                    documentos_encontrados.extend(self._buscar_por_email(email))
                
                quantidade_encontrada = len(documentos_encontrados)
                
                if quantidade_encontrada > 0:
                    resultado = 'ENCONTRADO'
                    
                    # Incrementar contador de consultas na sessão
                    sessao.incrementar_consulta()
                
                # Calcular tempo gasto
                tempo_gasto = timezone.now() - inicio_busca
                
                # Criar registro histórico
                historico = HistoricoConsulta.objects.create(
                    sessao=sessao,
                    protocolo_buscado=protocolo,
                    cpf_informado=cpf,
                    resultado=resultado,
                    documentos_encontrados=documentos_encontrados,
                    quantidade_encontrada=quantidade_encontrada,
                    tempo_gasto_esta_consulta=tempo_gasto,
                )
                
                # Log da busca
                self.logger.log_operation('consulta_realizada', {
                    'historico_id': historico.id,
                    'resultado': resultado,
                    'quantidade': quantidade_encontrada,
                    'tempo_gasto': tempo_gasto.total_seconds(),
                })
                
                return historico
                
            except Exception as e:
                self.logger.error(f'Erro na busca do consumidor: {str(e)}', exc_info=True)
                raise
    
    @log_execution_time('buscar_por_protocolo')
    def _buscar_por_protocolo(self, protocolo: str) -> List[Dict[str, Any]]:
        """Busca documentos por número de protocolo"""
        
        documentos = []
        
        # Buscar em CaixaEntrada
        caixa_docs = CaixaEntrada.objects.filter(numero_protocolo=protocolo).values(
            'id', 'numero_protocolo', 'assunto', 'status', 'data_entrada',
            'setor_destino', 'responsavel_atual__username'
        )
        
        for doc in caixa_docs:
            documentos.append({
                'tipo': 'caixa_entrada',
                'titulo': doc['assunto'],
                'status': doc['status'],
                'data': doc['data_entrada'].isoformat() if doc['data_entrada'] else None,
                'setor': doc['setor_destino'],
                'responsavel': doc['responsavel_atual__username'],
                'categoria': 'Tramitação'
            })
        
        # Buscar CIPs relacionadas
        cips = CIPAutomatica.objects.filter(numero_protocolo=protocolo).values(
            'id', 'numero_protocolo', 'numero_cip', 'assunto', 'status',
            'valor_total', 'empresa_razao_social', 'data_geracao'
        )
        
        for cip in cips:
            documentos.append({
                'tipo': 'cip',
                'titulo': f"CIP {cip['numero']} - {cip['assunto']}",
                'status': f"CIP {cip['status']}",
                'data': cip['data_geracao'].isoformat() if cip['data_geracao'] else None,
                'empresa': cip['empresa_razao_social'],
                'valor': float(cip['valor_total']) if cip['valor_total'] else 0,
                'categoria': 'CIP Automática'
            })
        
        # Buscar Audiências relacionadas
        audiencias = AgendamentoAudiencia.objects.filter(
            cips_relacionadas__numero_protocolo=protocolo
        ).values(
            'id', 'numero_protocolo', 'tipo_audiencia', 'status',
            'data_agendamento', 'mediador__usuario__username'
        )
        
        for aud in audiencias:
            documentos.append({
                'tipo': 'audiencia',
                'titulo': f"Audiência {aud['tipo_audiencia']}",
                'status': aud['status'],
                'data': aud['data_agendamento'].isoformat() if aud['data_agendamento'] else None,
                'mediador': aud['mediador__usuario__username'],
                'categoria': 'Conciliação'
            })
        
        return documentos
    
    @log_execution_time('buscar_por_cpf')
    def _buscar_por_cpf(self, cpf: str) -> List[Dict[str, Any]]:
        """Busca documentos por CPF do consumidor"""
        
        documentos = []
        
        # Limpar CPF para busca
        cpf_limpo = re.sub(r'[^0-9]', '', cpf)
        
        # Buscar reclamações no Portal Cidadão
        reclamacoes = ReclamacaoDenuncia.objects.filter(
            consumidor_cpf__icontains=cpf_limpo
        ).values(
            'id', 'numero_protocolo', 'assunto', 'tipo_reclamacao',
            'status', 'data_criacao', 'empresa_razao_social'
        )
        
        for rec in reclamacoes:
            documentos.append({
                'tipo': 'reclamacao',
                'titulo': rec['assunto'],
                'status': rec['status'],
                'data': rec['data_criacao'].isoformat() if rec['data_criacao'] else None,
                'empresa': rec['empresa_razao_social'],
                'categoria': 'Reclamação',
                'numero_protocolo': rec['numero_protocolo']
            })
        
        return documentos
    
    @log_execution_time('buscar_por_email')
    def _buscar_por_email(self, email: str) -> List[Dict[str, Any]]:
        """Busca documentos por email do consumidor"""
        
        documentos = []
        
        # Buscar reclamações
        reclamacoes = ReclamacaoDenuncia.objects.filter(
            consumidor_email__icontains=email.lower()
        ).values(
            'id', 'numero_protocolo', 'assunto', 'tipo_reclamacao',
            'status', 'data_criacao', 'empresa_razao_social'
        )
        
        for rec in reclamacoes:
            documentos.append({
                'tipo': 'reclamacao',
                'titulo': rec['assunto'],
                'status': rec['status'],
                'data': rec['data_criacao'].isoformat() if rec['data_criacao'] else None,
                'empresa': rec['empresa_razao_social'],
                'categoria': 'Reclamação',
                'numero_protocolo': rec['numero_protocolo']
            })
        
        return documentos


class DocumentoPortalService:
    """Serviço para geração e gerenciamento de documentos do portal"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('documentos_portal')
    
    @log_execution_time('gerar_documento_portal')
    def gerar_documento_portal(self, tipo_documento: str, dados_contexto: Dict[str, Any],
                              consumidor_cpf: str, protocolo: str) -> DocumentosPortal:
        """Gera documento específico para exibição no portal"""
        
        try:
            # Buscar template do documento
            template_doc = DocumentosPortal.objects.filter(
                tipo_documento=tipo_documento,
                ativo=True
            ).first()
            
            if not template_doc:
                # Criar documento dinâmico se não existe template
                template_doc = self._criar_documento_dinamico(tipo_documento, dados_contexto)
            
            # Renderizar documento
            dados_completos = {
                **dados_contexto,
                'consumidor_cpf': consumidor_cpf,
                'protocolo': protocolo,
                'data_emissao': timezone.now().strftime('%d/%m/%Y'),
                'horario_emissao': timezone.now().strftime('%H:%M:%S'),
            }
            
            documento_renderizado = template_doc.renderizar_documento(dados_completos)
            
            self.logger.log_operation('documento_portal_gerado', {
                'tipo_documento': tipo_documento,
                'protocolo': protocolo,
                'template_id': template_doc.id,
            })
            
            return template_doc
            
        except Exception as e:
            self.logger.error(f'Erro ao gerar documento portal: {str(e)}', exc_info=True)
            raise
    
    def _criar_documento_dinamico(self, tipo_documento: str, dados_contexto: Dict[str, Any]) -> DocumentosPortal:
        """Cria documento dinâmico quando não há template específico"""
        
        templates_default = {
            'CIP_RESPONDIDA': {
                'titulo_template': 'CIP {numero_cip} - Resposta da Empresa {empresa}',
                'conteudo_template': '''
                <h2>Carta de Intimação para Pagamento</h2>
                <p><strong>Número:</strong> {numero_protocolo}</p>
                <p><strong>Situação:</strong> Respondida pela empresa</p>
                <p><strong>Status:</strong> {status_resposta}</p>
                <p><strong>Valor:</strong> R$ {valor_total}</p>
                
                <h3>Resposta da Empresa</h3>
                <p>{texto_resposta}</p>
                
                <p><em>Documento gerado em {data_emissao}</em></p>
                '''
            },
            'ACORDO_REALIZADO': {
                'titulo_template': 'Acordo Realizado - Protocolo {numero_protocolo}',
                'conteudo_template': '''
                <h2>Acordo de Conciliação</h2>
                <p><strong>Protocolo:</strong> {numero_protocolo}</p>
                <p><strong>Valor Acordado:</strong> R$ {valor_acordado}</p>
                <p><strong>Data do Acordo:</strong> {data_acordo}</p>
                <p><strong>Prazo de Pagamento:</strong> {prazo_pagamento} dias</p>
                
                <h3>Condições do Acordo</h3>
                <p>{condicoes_acordo}</p>
                
                <p><em>Documento gerado em {data_emissao}</em></p>
                '''
            }
        }
        
        template_especifico = templates_default.get(tipo_documento)
        if not template_especifico:
            template_especifico = {
                'titulo_template': f'Documento {tipo_documento}',
                'conteudo_template': '<p>Informações do protocolo {numero_protocolo}</p>'
            }
        
        return DocumentosPortal.objects.create(
            nome=f'Template Automático - {tipo_documento}',
            tipo_documento=tipo_documento,
            titulo_template=template_especifico['titulo_template'],
            conteudo_template=template_especifico['conteudo_template'],
            visibilidade='CONSUMIDOR_LOGADO',
        )


class NotificacaoConsumidorService:
    """Serviço para envio de notificações aos consumidores"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('notificacao_consumidor')
    
    @log_execution_time('enviar_notificacao')
    def enviar_notificacao_consumidor(self, consumidor_email: str, titulo: str, mensagem: str,
                                    canal: str='EMAIL', protocolo: str='',
                                    consumidor_telefone: str='') -> NotificacaoConsumidor:
        """Envia notificação para consumidor pelo canal escolhido"""
        
        with LoggedOperation('enviar_notificacao_consumidor', {
            'consumidor_email': consumidor_email,
            'canal': canal,
            'tem_protocolo': bool(protocolo),
        }):
            try:
                with transaction.atomic():
                    notificacao = NotificacaoConsumidor.objects.create(
                        consumidor_email=consumidor_email,
                        consumidor_telefone=consumidor_telefone,
                        titulo=titulo,
                        mensagem=mensagem,
                        canal_escolhido=canal,
                        protocolo_relacionado=protocolo,
                        data_envio_real=timezone.now(),
                    )
                    
                    # Enviar pelo canal escolhido
                    if canal == 'EMAIL':
                        self._enviar_email(notificacao)
                    elif canal == 'SMS':
                        self._enviar_sms(notificacao)
                    elif canal == 'WHATSAPP':
                        self._enviar_whatsapp(notificacao)
                    elif canal == 'NOTIFICACAO_SITE':
                        self._gerar_notificacao_site(notificacao)
                    
                    notificacao.status = 'ENVIADA'
                    notificacao.save()
                    
                    self.logger.log_operation('notificacao_enviada', {
                        'notificacao_id': notificacao.id,
                        'canal': canal,
                        'consumidor': consumidor_email,
                    })
                    
                    return notificacao
                    
            except Exception as e:
                self.logger.error(f'Erro ao enviar notificação: {str(e)}', exc_info=True)
                raise
    
    def _enviar_email(self, notificacao: NotificacaoConsumidor):
        """Envia notificação por email"""
        try:
            subject = f"[PROCON] {notificacao.titulo}"
            
            html_message = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 40px; }}
                    .header {{ background-color: #1976d2; color: white; padding: 20px; text-align: center; }}
                    .content {{ margin-top: 20px; }}
                    .protocolo {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>PROCON</h1>
                    <p>Sistema de Atendimento ao Consumidor</p>
                </div>
                
                <div class="content">
                    <h2>{notificacao.titulo}</h2>
                    <p>{notificacao.mensagem}</p>
                    
                    {f'<div class="protocolo"><strong>Protocolo:</strong> {notificacao.protocolo_relacionado}</div>' if notificacao.protocolo_relacionado else ''}
                    
                    <p><em>Esta é uma mensagem automática do sistema PROCON.</em></p>
                </div>
            </body>
            </html>
            """
            
            send_mail(
                subject=subject,
                message=notificacao.mensagem,
                html_message=html_message,
                from_email='noreply@procon.local',
                recipient_list=[notificacao.consumidor_email],
                fail_silently=False,
            )
            
            notificacao.codigo_entrega = 'email_send_success'
            notificacao.detalhes_entrega = {'method': 'smtp', 'status': 'delivered'}
            
        except Exception as e:
            notificacao.status = 'FALHA_ENVIO'
            notificacao.erro_envio = str(e)
            notificacao.save()
            raise e
    
    def _enviar_sms(self, notificacao: NotificacaoConsumidor):
        """Envia notificação por SMS (implementação placeholder)"""
        try:
            # Placeholder - em produção seria integração com gateway SMS
            mensagem_sms = f"{notificacao.titulo}: {notificacao.mensagem[:140]}"
            
            # Simular envio
            notificacao.detalhes_entrega = {
                'status': 'sent',
                'provider': 'twilio',
                'message_id': f'sms_{notificacao.id}',
            }
            
            self.logger.info(f'SMS simulado enviado para {notificacao.consumidor_telefone}: {mensagem_sms[:50]}...')
            
        except Exception as e:
            notificacao.status = 'FALHA_ENVIO'
            notificacao.erro_envio = str(e)
            notificacao.save()
            raise e
    
    def _enviar_whatsapp(self, notificacao: NotificacaoConsumidor):
        """Envia notificação por WhatsApp (implementação placeholder)"""
        try:
            # Placeholder - em produção seria integração com WhatsApp Business API
            mensagem_whatsapp = f"PROCON - {notificacao.titulo}\n{notificacao.mensagem}"
            
            # Simular envio
            notificacao.detalhes_entrega = {
                'status': 'sent',
                'api_provider': 'whatsapp_business_api',
                'message_id': f'wa_{notificacao.id}',
            }
            
            self.logger.info(f'WhatsApp simulado enviado: {mensagem_whatsapp[:50]}...')
            
        except Exception as e:
            notificacao.status = 'FALHA_ENVIO'
            notificacao.erro_envio = str(e)
            notificacao.save()
            raise e
    
    def _gerar_notificacao_site(self, notificacao: NotificacaoConsumidor):
        """Gera notificação para aparecer no site"""
        try:
            # Esta notificação aparece na próxima vez que o usuário acessar o portal
            notificacao.detalhes_entrega = {
                'tipo': 'notificacao_site',
                'aparecer_ate': (timezone.now() + timedelta(days=30)).isoformat(),
                'posicao': 'topo',
                'persistencia': True,
            }
            
        except Exception as e:
            notificacao.status = 'FALHA_ENVIO'
            notificacao.erro_envio = str(e)
            notificacao.save()
            raise e


class FeedbackService:
    """Serviço para análise e processamento de feedbacks"""
    
    def __init__(self):
        self.logger = logger_manager.get_logger('feedback_consumidor')
    
    @log_execution_time('processar_feedback')
    def processar_feedback_consumidor(self, tipo_feedback: str, nota: int,
                                    aspecto_positivo: str, aspecto_melhoria: str,
                                    sugestoes: str, consumidor_email: str='',
                                    protocolo: str='', ip_address: str='') -> FeedbackConsumidor:
        """Processa feedback do consumidor com análise automática"""
        
        with LoggedOperation('processar_feedback', {
            'tipo_feedback': tipo_feedback,
            'nota': nota,
            'tem_email': bool(consumidor_email),
            'tem_protocolo': bool(protocolo),
        }):
            try:
                with transaction.atomic():
                    feedback = FeedbackConsumidor.objects.create(
                        consumidor_email=consumidor_email,
                        tipo_feedback=tipo_feedback,
                        protocolo_relacionado=protocolo,
                        nota_geral=nota,
                        aspecto_positivo=aspecto_positivo,
                        aspecto_melhoria=aspecto_melhoria,
                        sugestoes=sugestoes,
                        ip_address=ip_address,
                    )
                    
                    # Análise automática de sentimento
                    if aspecto_positivo or aspecto_melhoria or sugestoes:
                        analise_sentimento = self._analisar_sentimento_feedback(
                            aspecto_positivo, aspecto_melhoria, sugestoes
                        )
                        feedback.analise_sentimento = analise_sentimento['sentimento']
                        feedback.confianca_analise_sentimento = analise_sentimento['confianca']
                        
                        # Categorização automática
                        feedback.categoria_feedback = self._categorizar_feedback(
                            tipo_feedback, nota, analise_sentimento['sentimento']
                        )
                    
                    feedback.save()
                    
                    # Alertas para gestão se necessário
                    self._processar_alertas_feedback(feedback)
                    
                    self.logger.log_operation('feedback_processado', {
                        'feedback_id': feedback.id,
                        'nota': nota,
                        'sentimento': feedback.analise_sentimento,
                        'categoria': feedback.categoria_feedback,
                    })
                    
                    return feedback
                    
            except Exception as e:
                self.logger.error(f'Erro ao processar feedback: {str(e)}', exc_info=True)
                raise
    
    def _analisar_sentimento_feedback(self, positivo: str, melhoria: str, sugestoes: str) -> Dict[str, Any]:
        """Análise básica de sentimento do feedback"""
        
        texto_completo = f"{positivo} {melhoria} {sugestoes}".lower()
        
        # Palavras positivas
        palavras_positivas = ['bom', 'ótimo', 'excelente', 'satisfeito', 'conforme', 'eficiente', 'rápido']
        # Palavras negativas
        palavras_negativas = ['ruim', 'lento', 'demorado', 'problema', 'dificuldade', 'insatisfeito']
        
        contador_positivo = sum(1 for palavra in palavras_positivas if palavra in texto_completo)
        contador_negativo = sum(1 for palavra in palavras_negativas if palavra in texto_completo)
        
        # Determinar sentimento
        if contador_positivo > contador_negativo:
            sentimento = 'POSITIVO'
            confianca = min(0.9, (contador_positivo / max(len(texto_completo.split()), 10)))
        elif contador_negativo > contador_positivo:
            sentimento = 'NEGATIVO'
            confianca = min(0.9, (contador_negativo / max(len(texto_completo.split()), 10)))
        else:
            sentimento = 'NEUTRO'
            confianca = 0.5
        
        return {
            'sentimento': sentimento,
            'confianca': confianca,
        }
    
    def _categorizar_feedback(self, tipo_feedback: str, nota: int, sentimento: str) -> str:
        """Categoriza feedback para análise gerencial"""
        
        if nota <= 3:
            return 'CRITICO_MELHORIA_NECESSARIA'
        elif nota <= 6:
            return 'MEDIO_PROCESO_PODE_MELHORAR'
        elif sentimento == 'NEGATIVO' and nota <= 7:
            return 'MIXTO_SATISFACAO_PARCIAL'
        else:
            return 'POSITIVO_SATISFEITO'
    
    def _processar_alertas_feedback(self, feedback: FeedbackConsumidor):
        """Processa alertas baseados no feedback recebido"""
        
        # Alertas para feedback muito negativo
        if feedback.nota_geral <= 3:
            self.logger.warning(f'Feedback crítico recebido: Nota {feedback.nota_geral} - Protocolo {feedback.protocolo_relacionado}')
            
            # TODO: Implementar notificação para gestão
            # Criar NotificacaoConsumidor para responsáveis pelo protocolo


# Instâncias globais dos serviços
consulta_service = ConsultaPortalService()
documento_service = DocumentoPortalService()
notificacao_service = NotificacaoConsumidorService()
feedback_service = FeedbackService()

#!/usr/bin/env python
"""
Serviços avançados para o módulo de auditoria
Inclui: relatórios avançados, controles de segurança granulares, autenticação de dois fatores
"""
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from django.db.models import Q, Count, Avg, Max, Min
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.cache import cache
from .models import (
    LogSistema, TipoEvento, AuditoriaAlteracao, SessaoUsuario,
    AcessoRecurso, BackupLog, LogSeguranca
)

logger = logging.getLogger(__name__)

class AuditoriaService:
    """Serviço principal para auditoria do sistema"""
    
    @staticmethod
    def registrar_evento(tipo_evento_codigo: str, acao: str, descricao: str, 
                        usuario: str = None, objeto=None, **kwargs):
        """Registra um evento de auditoria"""
        try:
            return LogSistema.log_evento(
                tipo_evento_codigo=tipo_evento_codigo,
                acao=acao,
                descricao=descricao,
                usuario=usuario,
                objeto=objeto,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Erro ao registrar evento de auditoria: {e}")
            return None
    
    @staticmethod
    def registrar_alteracao(objeto, acao: str, usuario: str, 
                          campos_alterados: Dict = None, valores_anteriores: Dict = None,
                          valores_novos: Dict = None, **kwargs):
        """Registra alteração em um objeto"""
        try:
            content_type = ContentType.objects.get_for_model(objeto)
            
            return AuditoriaAlteracao.objects.create(
                content_type=content_type,
                object_id=objeto.pk,
                object_repr=str(objeto),
                acao=acao,
                campos_alterados=json.dumps(campos_alterados or {}),
                valores_anteriores=json.dumps(valores_anteriores or {}),
                valores_novos=json.dumps(valores_novos or {}),
                usuario=usuario,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Erro ao registrar alteração: {e}")
            return None
    
    @staticmethod
    def registrar_acesso_recurso(usuario: str, recurso: str, acao: str,
                               metodo_http: str, url_completa: str,
                               codigo_resposta: int, tempo_resposta: int,
                               ip_origem: str, **kwargs):
        """Registra acesso a um recurso"""
        try:
            return AcessoRecurso.objects.create(
                usuario=usuario,
                recurso=recurso,
                acao=acao,
                metodo_http=metodo_http,
                url_completa=url_completa,
                codigo_resposta=codigo_resposta,
                tempo_resposta=tempo_resposta,
                ip_origem=ip_origem,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Erro ao registrar acesso a recurso: {e}")
            return None
    
    @staticmethod
    def registrar_evento_seguranca(tipo_evento: str, ip_origem: str, descricao: str,
                                 usuario: str = None, **kwargs):
        """Registra evento de segurança"""
        try:
            return LogSeguranca.log_evento_seguranca(
                tipo_evento=tipo_evento,
                ip_origem=ip_origem,
                descricao=descricao,
                usuario=usuario,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Erro ao registrar evento de segurança: {e}")
            return None


class RelatorioAuditoriaService:
    """Serviço para geração de relatórios de auditoria avançados"""
    
    @staticmethod
    def relatorio_atividade_usuarios(periodo_dias: int = 30, usuario: str = None) -> Dict[str, Any]:
        """Relatório de atividade dos usuários"""
        data_inicio = timezone.now() - timedelta(days=periodo_dias)
        
        filtros = {'timestamp__gte': data_inicio}
        if usuario:
            filtros['usuario'] = usuario
        
        # Estatísticas gerais
        total_eventos = LogSistema.objects.filter(**filtros).count()
        usuarios_ativos = LogSistema.objects.filter(**filtros).values('usuario').distinct().count()
        
        # Eventos por usuário
        eventos_por_usuario = LogSistema.objects.filter(**filtros).values('usuario').annotate(
            total=Count('id'),
            sucessos=Count('id', filter=Q(sucesso=True)),
            falhas=Count('id', filter=Q(sucesso=False))
        ).order_by('-total')
        
        # Eventos por tipo
        eventos_por_tipo = LogSistema.objects.filter(**filtros).values(
            'tipo_evento__nome', 'tipo_evento__categoria'
        ).annotate(
            total=Count('id'),
            nivel_critico=Count('id', filter=Q(nivel='CRITICAL')),
            nivel_erro=Count('id', filter=Q(nivel='ERROR'))
        ).order_by('-total')
        
        # Horários de pico (simplificado para evitar problemas de SQL)
        eventos_por_hora = []
        for hora in range(24):
            count = LogSistema.objects.filter(
                **filtros,
                timestamp__hour=hora
            ).count()
            if count > 0:
                eventos_por_hora.append({'hora': hora, 'total': count})
        
        return {
            'periodo': {
                'inicio': data_inicio,
                'fim': timezone.now(),
                'dias': periodo_dias
            },
            'resumo': {
                'total_eventos': total_eventos,
                'usuarios_ativos': usuarios_ativos,
                'media_eventos_por_dia': total_eventos / periodo_dias if periodo_dias > 0 else 0
            },
            'eventos_por_usuario': list(eventos_por_usuario),
            'eventos_por_tipo': list(eventos_por_tipo),
            'eventos_por_hora': list(eventos_por_hora)
        }
    
    @staticmethod
    def relatorio_seguranca(periodo_dias: int = 30) -> Dict[str, Any]:
        """Relatório de segurança"""
        data_inicio = timezone.now() - timedelta(days=periodo_dias)
        
        # Eventos de segurança
        eventos_seguranca = LogSeguranca.objects.filter(
            timestamp__gte=data_inicio
        )
        
        # Estatísticas por tipo de evento
        eventos_por_tipo = eventos_seguranca.values('tipo_evento').annotate(
            total=Count('id'),
            criticos=Count('id', filter=Q(nivel_severidade='critico')),
            altos=Count('id', filter=Q(nivel_severidade='alto')),
            bloqueados=Count('id', filter=Q(bloqueado=True))
        ).order_by('-total')
        
        # IPs suspeitos
        ips_suspeitos = eventos_seguranca.filter(
            nivel_severidade__in=['alto', 'critico']
        ).values('ip_origem').annotate(
            total_eventos=Count('id'),
            eventos_bloqueados=Count('id', filter=Q(bloqueado=True))
        ).order_by('-total_eventos')[:10]
        
        # Tentativas de login falhadas
        tentativas_falhadas = eventos_seguranca.filter(
            tipo_evento='login_falha'
        ).values('ip_origem', 'usuario').annotate(
            total_tentativas=Count('id')
        ).filter(total_tentativas__gte=3).order_by('-total_tentativas')
        
        return {
            'periodo': {
                'inicio': data_inicio,
                'fim': timezone.now(),
                'dias': periodo_dias
            },
            'resumo': {
                'total_eventos_seguranca': eventos_seguranca.count(),
                'eventos_criticos': eventos_seguranca.filter(nivel_severidade='critico').count(),
                'eventos_bloqueados': eventos_seguranca.filter(bloqueado=True).count()
            },
            'eventos_por_tipo': list(eventos_por_tipo),
            'ips_suspeitos': list(ips_suspeitos),
            'tentativas_falhadas': list(tentativas_falhadas)
        }
    
    @staticmethod
    def relatorio_performance(periodo_dias: int = 30) -> Dict[str, Any]:
        """Relatório de performance do sistema"""
        data_inicio = timezone.now() - timedelta(days=periodo_dias)
        
        # Acessos a recursos
        acessos = AcessoRecurso.objects.filter(timestamp__gte=data_inicio)
        
        # Performance por recurso
        performance_por_recurso = acessos.values('recurso').annotate(
            total_acessos=Count('id'),
            tempo_medio=Avg('tempo_resposta'),
            tempo_maximo=Max('tempo_resposta'),
            tempo_minimo=Min('tempo_resposta'),
            erros_4xx=Count('id', filter=Q(codigo_resposta__gte=400, codigo_resposta__lt=500)),
            erros_5xx=Count('id', filter=Q(codigo_resposta__gte=500))
        ).order_by('-total_acessos')
        
        # Performance por hora (simplificado para evitar problemas de SQL)
        performance_por_hora = []
        for hora in range(24):
            acessos_hora = acessos.filter(timestamp__hour=hora)
            if acessos_hora.exists():
                total_requisicoes = acessos_hora.count()
                tempo_medio = acessos_hora.aggregate(Avg('tempo_resposta'))['tempo_resposta__avg'] or 0
                erros = acessos_hora.filter(codigo_resposta__gte=400).count()
                taxa_erro = (erros * 100.0 / total_requisicoes) if total_requisicoes > 0 else 0
                
                performance_por_hora.append({
                    'hora': hora,
                    'total_requisicoes': total_requisicoes,
                    'tempo_medio': tempo_medio,
                    'taxa_erro': taxa_erro
                })
        
        # Métodos HTTP mais utilizados
        metodos_http = acessos.values('metodo_http').annotate(
            total=Count('id'),
            tempo_medio=Avg('tempo_resposta')
        ).order_by('-total')
        
        return {
            'periodo': {
                'inicio': data_inicio,
                'fim': timezone.now(),
                'dias': periodo_dias
            },
            'resumo': {
                'total_requisicoes': acessos.count(),
                'tempo_medio_geral': acessos.aggregate(Avg('tempo_resposta'))['tempo_resposta__avg'],
                'taxa_erro_geral': acessos.filter(codigo_resposta__gte=400).count() * 100.0 / acessos.count() if acessos.count() > 0 else 0
            },
            'performance_por_recurso': list(performance_por_recurso),
            'performance_por_hora': list(performance_por_hora),
            'metodos_http': list(metodos_http)
        }
    
    @staticmethod
    def relatorio_sessoes(periodo_dias: int = 30) -> Dict[str, Any]:
        """Relatório de sessões de usuários"""
        data_inicio = timezone.now() - timedelta(days=periodo_dias)
        
        # Sessões no período
        sessoes = SessaoUsuario.objects.filter(data_login__gte=data_inicio)
        
        # Estatísticas de sessão
        sessoes_por_usuario = sessoes.values('usuario').annotate(
            total_sessoes=Count('id'),
            sessoes_ativas=Count('id', filter=Q(ativa=True))
        ).order_by('-total_sessoes')
        
        # Tipos de logout
        tipos_logout = sessoes.filter(data_logout__isnull=False).values('tipo_logout').annotate(
            total=Count('id')
        ).order_by('-total')
        
        # Sessões ativas
        sessoes_ativas = sessoes.filter(ativa=True).values('usuario', 'data_login', 'ultima_atividade')
        
        return {
            'periodo': {
                'inicio': data_inicio,
                'fim': timezone.now(),
                'dias': periodo_dias
            },
            'resumo': {
                'total_sessoes': sessoes.count(),
                'sessoes_ativas': sessoes.filter(ativa=True).count(),
                'sessoes_encerradas': sessoes.filter(ativa=False).count()
            },
            'sessoes_por_usuario': list(sessoes_por_usuario),
            'tipos_logout': list(tipos_logout),
            'sessoes_ativas': list(sessoes_ativas)
        }


class ControleSegurancaService:
    """Serviço para controles de segurança granulares"""
    
    @staticmethod
    def verificar_ip_suspeito(ip_origem: str) -> Dict[str, Any]:
        """Verifica se um IP é suspeito"""
        # Verificar eventos de segurança recentes
        eventos_recentes = LogSeguranca.objects.filter(
            ip_origem=ip_origem,
            timestamp__gte=timezone.now() - timedelta(hours=1)
        )
        
        eventos_criticos = eventos_recentes.filter(nivel_severidade__in=['alto', 'critico'])
        tentativas_falhadas = eventos_recentes.filter(tipo_evento='login_falha').count()
        
        # Verificar tentativas de brute force
        tentativas_por_minuto = LogSeguranca.objects.filter(
            ip_origem=ip_origem,
            tipo_evento='login_falha',
            timestamp__gte=timezone.now() - timedelta(minutes=1)
        ).count()
        
        # Critérios de suspeição
        suspeito = False
        nivel_risco = 'baixo'
        acoes = []
        
        if tentativas_por_minuto >= 5:
            suspeito = True
            nivel_risco = 'alto'
            acoes.append('Bloquear IP temporariamente')
        
        if tentativas_falhadas >= 10:
            suspeito = True
            nivel_risco = 'medio'
            acoes.append('Requerer CAPTCHA')
        
        if eventos_criticos.count() >= 3:
            suspeito = True
            nivel_risco = 'critico'
            acoes.append('Bloquear IP permanentemente')
        
        return {
            'ip': ip_origem,
            'suspeito': suspeito,
            'nivel_risco': nivel_risco,
            'eventos_recentes': eventos_recentes.count(),
            'eventos_criticos': eventos_criticos.count(),
            'tentativas_falhadas': tentativas_falhadas,
            'tentativas_por_minuto': tentativas_por_minuto,
            'acoes_recomendadas': acoes
        }
    
    @staticmethod
    def verificar_atividade_suspeita(usuario: str) -> Dict[str, Any]:
        """Verifica atividade suspeita de um usuário"""
        # Verificar acessos recentes
        acessos_recentes = AcessoRecurso.objects.filter(
            usuario=usuario,
            timestamp__gte=timezone.now() - timedelta(hours=1)
        )
        
        # Verificar recursos sensíveis acessados
        recursos_sensiveis = acessos_recentes.filter(
            recurso__in=['admin/', 'config/', 'backup/', 'log/']
        )
        
        # Verificar múltiplas sessões
        sessoes_ativas = SessaoUsuario.objects.filter(
            usuario=usuario,
            ativa=True
        )
        
        # Verificar alterações críticas
        alteracoes_criticas = AuditoriaAlteracao.objects.filter(
            usuario=usuario,
            timestamp__gte=timezone.now() - timedelta(hours=1),
            acao__in=['DELETE', 'UPDATE']
        )
        
        suspeito = False
        nivel_risco = 'baixo'
        acoes = []
        
        if recursos_sensiveis.count() > 5:
            suspeito = True
            nivel_risco = 'alto'
            acoes.append('Revisar permissões do usuário')
        
        if sessoes_ativas.count() > 3:
            suspeito = True
            nivel_risco = 'medio'
            acoes.append('Encerrar sessões extras')
        
        if alteracoes_criticas.count() > 10:
            suspeito = True
            nivel_risco = 'alto'
            acoes.append('Suspender usuário temporariamente')
        
        return {
            'usuario': usuario,
            'suspeito': suspeito,
            'nivel_risco': nivel_risco,
            'acessos_recentes': acessos_recentes.count(),
            'recursos_sensiveis': recursos_sensiveis.count(),
            'sessoes_ativas': sessoes_ativas.count(),
            'alteracoes_criticas': alteracoes_criticas.count(),
            'acoes_recomendadas': acoes
        }
    
    @staticmethod
    def gerar_alerta_seguranca(tipo: str, dados: Dict[str, Any]) -> bool:
        """Gera alerta de segurança"""
        try:
            # Registrar evento de segurança
            LogSeguranca.log_evento_seguranca(
                tipo_evento='tentativa_acesso_negado',
                ip_origem=dados.get('ip_origem', ''),
                descricao=f"Alerta de segurança: {tipo}",
                usuario=dados.get('usuario', ''),
                nivel_severidade='alto',
                detalhes_tecnicos=json.dumps(dados),
                acao_tomada='Alerta gerado automaticamente'
            )
            
            # TODO: Implementar notificação (email, SMS, etc.)
            logger.warning(f"Alerta de segurança gerado: {tipo} - {dados}")
            
            return True
        except Exception as e:
            logger.error(f"Erro ao gerar alerta de segurança: {e}")
            return False


class Autenticacao2FAService:
    """Serviço para autenticação de dois fatores"""
    
    @staticmethod
    def gerar_codigo_2fa(usuario: str) -> str:
        """Gera código 2FA para um usuário"""
        import random
        import string
        
        # Gerar código de 6 dígitos
        codigo = ''.join(random.choices(string.digits, k=6))
        
        # Armazenar no cache com expiração de 5 minutos
        cache_key = f"2fa_code_{usuario}"
        cache.set(cache_key, codigo, 300)  # 5 minutos
        
        # Registrar evento
        AuditoriaService.registrar_evento(
            tipo_evento_codigo='2FA_GERADO',
            acao='Gerar código 2FA',
            descricao=f'Código 2FA gerado para usuário {usuario}',
            usuario=usuario,
            nivel='INFO'
        )
        
        return codigo
    
    @staticmethod
    def verificar_codigo_2fa(usuario: str, codigo: str) -> bool:
        """Verifica código 2FA"""
        cache_key = f"2fa_code_{usuario}"
        codigo_armazenado = cache.get(cache_key)
        
        if codigo_armazenado and codigo == codigo_armazenado:
            # Remover código do cache após uso
            cache.delete(cache_key)
            
            # Registrar sucesso
            AuditoriaService.registrar_evento(
                tipo_evento_codigo='2FA_VALIDADO',
                acao='Validar código 2FA',
                descricao=f'Código 2FA validado com sucesso para usuário {usuario}',
                usuario=usuario,
                nivel='INFO',
                sucesso=True
            )
            
            return True
        else:
            # Registrar falha
            AuditoriaService.registrar_evento(
                tipo_evento_codigo='2FA_FALHA',
                acao='Falha na validação 2FA',
                descricao=f'Código 2FA inválido para usuário {usuario}',
                usuario=usuario,
                nivel='WARNING',
                sucesso=False
            )
            
            return False
    
    @staticmethod
    def configurar_2fa_usuario(usuario: str, habilitado: bool) -> bool:
        """Configura 2FA para um usuário"""
        try:
            # TODO: Implementar configuração no modelo de usuário
            # Por enquanto, apenas registra o evento
            
            AuditoriaService.registrar_evento(
                tipo_evento_codigo='2FA_CONFIGURADO',
                acao='Configurar 2FA',
                descricao=f'2FA {"habilitado" if habilitado else "desabilitado"} para usuário {usuario}',
                usuario=usuario,
                nivel='INFO',
                sucesso=True
            )
            
            return True
        except Exception as e:
            logger.error(f"Erro ao configurar 2FA: {e}")
            return False


# Instâncias globais dos serviços
auditoria_service = AuditoriaService()
relatorio_service = RelatorioAuditoriaService()
seguranca_service = ControleSegurancaService()
autenticacao_2fa_service = Autenticacao2FAService()

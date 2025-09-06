#!/usr/bin/env python
"""
Middleware para captura automática de eventos de auditoria
"""
import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser
from .services import auditoria_service, seguranca_service
from .models import LogSistema, AcessoRecurso, SessaoUsuario


class AuditoriaMiddleware(MiddlewareMixin):
    """Middleware para capturar eventos de auditoria automaticamente"""
    
    def process_request(self, request):
        """Processa requisição e captura dados para auditoria"""
        # Marcar tempo de início
        request.start_time = time.time()
        
        # Capturar informações básicas
        request.auditoria_data = {
            'ip_origem': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'metodo_http': request.method,
            'url_completa': request.get_full_path(),
            'usuario': self.get_usuario(request),
        }
    
    def process_response(self, request, response):
        """Processa resposta e registra evento de auditoria"""
        if hasattr(request, 'start_time'):
            # Calcular tempo de resposta
            tempo_resposta = int((time.time() - request.start_time) * 1000)  # em ms
            
            # Obter dados da requisição
            auditoria_data = getattr(request, 'auditoria_data', {})
            
            # Registrar acesso ao recurso
            self.registrar_acesso_recurso(
                request=request,
                response=response,
                tempo_resposta=tempo_resposta,
                auditoria_data=auditoria_data
            )
            
            # Verificar se é uma tentativa de login
            if self.is_login_attempt(request):
                self.verificar_login_seguranca(request, response)
            
            # Verificar atividade suspeita
            if auditoria_data.get('usuario'):
                self.verificar_atividade_suspeita(request, auditoria_data)
        
        return response
    
    def process_exception(self, request, exception):
        """Processa exceções e registra eventos de erro"""
        auditoria_data = getattr(request, 'auditoria_data', {})
        
        # Registrar evento de erro
        LogSistema.log_evento(
            tipo_evento_codigo='ERRO_SISTEMA',
            acao='Exceção capturada',
            descricao=f'Erro: {str(exception)}',
            usuario=auditoria_data.get('usuario'),
            nivel='ERROR',
            sucesso=False,
            detalhes_tecnicos={
                'exception_type': type(exception).__name__,
                'exception_message': str(exception),
                'url': auditoria_data.get('url_completa'),
                'ip_origem': auditoria_data.get('ip_origem')
            }
        )
        
        # Registrar evento de segurança se for erro crítico
        if self.is_erro_critico(exception):
            seguranca_service.registrar_evento_seguranca(
                tipo_evento='erro_critico',
                ip_origem=auditoria_data.get('ip_origem', ''),
                descricao=f'Erro crítico: {str(exception)}',
                usuario=auditoria_data.get('usuario'),
                nivel_severidade='alto'
            )
    
    def get_client_ip(self, request):
        """Obtém IP real do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def get_usuario(self, request):
        """Obtém usuário da requisição"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            return request.user.username
        return 'anonimo'
    
    def registrar_acesso_recurso(self, request, response, tempo_resposta, auditoria_data):
        """Registra acesso a recurso"""
        try:
            # Determinar ação baseada no método HTTP
            acao = self.determinar_acao(request.method)
            
            # Determinar recurso
            recurso = self.determinar_recurso(request.path)
            
            # Registrar acesso
            auditoria_service.registrar_acesso_recurso(
                usuario=auditoria_data.get('usuario', 'anonimo'),
                recurso=recurso,
                acao=acao,
                metodo_http=auditoria_data.get('metodo_http', ''),
                url_completa=auditoria_data.get('url_completa', ''),
                codigo_resposta=response.status_code,
                tempo_resposta=tempo_resposta,
                ip_origem=auditoria_data.get('ip_origem', ''),
                user_agent=auditoria_data.get('user_agent', '')
            )
            
        except Exception as e:
            # Log silencioso para evitar loops infinitos
            pass
    
    def determinar_acao(self, metodo_http):
        """Determina ação baseada no método HTTP"""
        acoes = {
            'GET': 'CONSULTA',
            'POST': 'CRIACAO',
            'PUT': 'ATUALIZACAO',
            'PATCH': 'ATUALIZACAO_PARCIAL',
            'DELETE': 'EXCLUSAO',
            'HEAD': 'CONSULTA',
            'OPTIONS': 'CONSULTA'
        }
        return acoes.get(metodo_http, 'OUTRO')
    
    def determinar_recurso(self, path):
        """Determina recurso baseado no path"""
        # Remover parâmetros de query
        path = path.split('?')[0]
        
        # Mapear paths para recursos
        mapeamento = {
            '/admin/': 'admin',
            '/api/': 'api',
            '/notificacoes/': 'notificacoes',
            '/auditoria/': 'auditoria',
            '/recursos/': 'recursos',
            '/fiscalizacao/': 'fiscalizacao',
            '/protocolo/': 'protocolo',
            '/peticionamento/': 'peticionamento',
        }
        
        for prefixo, recurso in mapeamento.items():
            if path.startswith(prefixo):
                return recurso
        
        return 'outro'
    
    def is_login_attempt(self, request):
        """Verifica se é uma tentativa de login"""
        login_paths = ['/admin/login/', '/api/auth/login/', '/login/']
        return request.path in login_paths and request.method == 'POST'
    
    def verificar_login_seguranca(self, request, response):
        """Verifica segurança de tentativas de login"""
        ip_origem = getattr(request, 'auditoria_data', {}).get('ip_origem', '')
        
        # Verificar se o login falhou
        if response.status_code in [400, 401, 403]:
            # Registrar tentativa falhada
            seguranca_service.registrar_evento_seguranca(
                tipo_evento='login_falha',
                ip_origem=ip_origem,
                descricao='Tentativa de login falhada',
                nivel_severidade='medio'
            )
            
            # Verificar se o IP é suspeito
            resultado = seguranca_service.verificar_ip_suspeito(ip_origem)
            if resultado['suspeito']:
                seguranca_service.gerar_alerta_seguranca(
                    'ip_suspeito_login',
                    {
                        'ip_origem': ip_origem,
                        'tentativas_falhadas': resultado['tentativas_falhadas'],
                        'nivel_risco': resultado['nivel_risco']
                    }
                )
        else:
            # Login bem-sucedido
            usuario = getattr(request, 'auditoria_data', {}).get('usuario', '')
            if usuario:
                seguranca_service.registrar_evento_seguranca(
                    tipo_evento='login_sucesso',
                    ip_origem=ip_origem,
                    descricao=f'Login bem-sucedido para usuário {usuario}',
                    usuario=usuario,
                    nivel_severidade='baixo'
                )
    
    def verificar_atividade_suspeita(self, request, auditoria_data):
        """Verifica atividade suspeita do usuário"""
        usuario = auditoria_data.get('usuario')
        if not usuario or usuario == 'anonimo':
            return
        
        # Verificar recursos sensíveis
        recursos_sensiveis = ['/admin/', '/config/', '/backup/', '/log/']
        path = request.path
        
        if any(path.startswith(recurso) for recurso in recursos_sensiveis):
            seguranca_service.registrar_evento_seguranca(
                tipo_evento='acesso_recurso_sensivel',
                ip_origem=auditoria_data.get('ip_origem', ''),
                descricao=f'Acesso a recurso sensível: {path}',
                usuario=usuario,
                nivel_severidade='alto'
            )
    
    def is_erro_critico(self, exception):
        """Verifica se é um erro crítico"""
        erros_criticos = [
            'DatabaseError',
            'OperationalError',
            'IntegrityError',
            'PermissionDenied',
            'SuspiciousOperation'
        ]
        
        return type(exception).__name__ in erros_criticos


class SessaoMiddleware(MiddlewareMixin):
    """Middleware para gerenciar sessões de usuário"""
    
    def process_request(self, request):
        """Processa requisição e gerencia sessão"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Verificar se já existe uma sessão ativa
            sessao_ativa = SessaoUsuario.objects.filter(
                usuario=request.user.username,
                ativa=True
            ).first()
            
            if not sessao_ativa:
                # Criar nova sessão
                SessaoUsuario.objects.create(
                    usuario=request.user.username,
                    ip_origem=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    ativa=True
                )
            else:
                # Atualizar última atividade
                sessao_ativa.ultima_atividade = timezone.now()
                sessao_ativa.save()
    
    def process_response(self, request, response):
        """Processa resposta e gerencia logout"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Verificar se é um logout
            if self.is_logout_attempt(request):
                self.encerrar_sessao(request.user.username)
        
        return response
    
    def get_client_ip(self, request):
        """Obtém IP real do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_logout_attempt(self, request):
        """Verifica se é uma tentativa de logout"""
        logout_paths = ['/admin/logout/', '/api/auth/logout/', '/logout/']
        return request.path in logout_paths
    
    def encerrar_sessao(self, usuario):
        """Encerra sessão do usuário"""
        try:
            sessoes_ativas = SessaoUsuario.objects.filter(
                usuario=usuario,
                ativa=True
            )
            
            for sessao in sessoes_ativas:
                sessao.encerrar_sessao('logout_manual')
                
        except Exception as e:
            # Log silencioso
            pass

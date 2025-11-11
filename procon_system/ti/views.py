from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import transaction
import re
import logging

from .models import LogAuditoria, PerfilUsuario, Modulo, PermissaoModulo, PermissaoUsuario
from .services import EmailNotificationService

logger = logging.getLogger(__name__)

class TIUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar usuários do sistema via painel TI
    """
    queryset = User.objects.all()
    
    def list(self, request):
        """Listar todos os usuários com perfis estendidos"""
        try:
            users = User.objects.filter(is_staff=True).order_by('id')
            users_data = []
            for user in users:
                perfil = getattr(user, 'perfilusuario', None)
                user_data = {
                    'id': user.id,
                    'nome': user.get_full_name(),
                    'email': user.email,
                    'username': user.username, # CPF ou Matrícula
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined,
                    'last_login': user.last_login,
                    'cpf': perfil.cpf if perfil else '',
                    'matricula': perfil.matricula if perfil else '',
                    'telefone': perfil.telefone if perfil else '',
                    'cargo': perfil.cargo if perfil else '',
                    'departamento': perfil.departamento if perfil else '',
                    'status': 'ativo' if user.is_active else 'inativo'
                }
                user_data['role'] = self._get_user_role(user.is_staff, user.is_superuser)
                users_data.append(user_data)
            
            return Response(users_data)
        except Exception as e:
            logger.error(f'Erro ao listar usuários: {str(e)}')
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """Criar novo usuário"""
        try:
            data = request.data
            
            # Validações
            if not data.get('cpf') and not data.get('matricula'):
                return Response(
                    {'error': 'CPF ou Matrícula é obrigatório'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not data.get('senha'):
                return Response(
                    {'error': 'Senha é obrigatória'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Usar CPF como username se disponível, senão matrícula
            username = data.get('cpf') or data.get('matricula')
            
            # Verificar se usuário já existe
            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'Usuário já existe'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                # Criar usuário
                user = User.objects.create_user(
                    username=username,
                    email=data.get('email', ''),
                    password=data.get('senha'),
                    first_name=data.get('nome', '').split(' ')[0] if data.get('nome') else '',
                    last_name=' '.join(data.get('nome', '').split(' ')[1:]) if data.get('nome') else '',
                    is_staff=True,
                    is_active=data.get('status', 'ativo') == 'ativo'
                )
                
                # Criar perfil estendido
                PerfilUsuario.objects.create(
                    user=user,
                    cpf=data.get('cpf', ''),
                    matricula=data.get('matricula', ''),
                    telefone=data.get('telefone', ''),
                    cargo=data.get('cargo', ''),
                    departamento=data.get('departamento', ''),
                    ativo=data.get('status', 'ativo') == 'ativo'
                )
                
                # Log de auditoria
                LogAuditoria.objects.create(
                    user=request.user,
                    acao='criar',
                    modulo='TI',
                    objeto_id=user.id,
                    detalhes={
                        'usuario_criado': user.username,
                        'nome': user.get_full_name(),
                        'email': user.email,
                        'cpf': data.get('cpf'),
                        'matricula': data.get('matricula'),
                        'cargo': data.get('cargo'),
                        'departamento': data.get('departamento')
                    },
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    sucesso=True
                )
                
                # Enviar notificação por email
                EmailNotificationService.send_user_created_notification(data, request.user)
                
                logger.info(f'Usuário {user.username} criado por {request.user.username}')
                
                return Response({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'cpf': data.get('cpf'),
                    'matricula': data.get('matricula'),
                    'role': self._get_user_role(user.is_staff, user.is_superuser),
                    'status': 'ativo' if user.is_active else 'inativo'
                }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f'Erro ao criar usuário: {str(e)}')
            
            # Log de erro
            LogAuditoria.objects.create(
                user=request.user,
                acao='criar',
                modulo='TI',
                detalhes={'erro': str(e), 'dados': data},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                sucesso=False,
                erro=str(e)
            )
            
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, pk=None):
        """Atualizar usuário"""
        try:
            user = User.objects.get(pk=pk)
            data = request.data
            
            # Atualizar campos básicos
            if 'nome' in data:
                name_parts = data['nome'].split(' ')
                user.first_name = name_parts[0] if name_parts else ''
                user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            if 'email' in data:
                user.email = data['email']
            
            if 'status' in data:
                user.is_active = data['status'] == 'ativo'
            
            if 'senha' in data and data['senha']:
                user.set_password(data['senha'])
            
            user.save()
            
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'cpf': data.get('cpf'),
                'matricula': data.get('matricula'),
                'role': self._get_user_role(user.is_staff, user.is_superuser),
                'status': 'ativo' if user.is_active else 'inativo'
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuário não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, pk=None):
        """Excluir usuário"""
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuário não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def modulos(self, request):
        """Listar módulos do sistema"""
        modulos = [
            {'id': 'dashboard', 'nome': 'Dashboard', 'descricao': 'Painel principal do sistema'},
            {'id': 'fiscalizacao', 'nome': 'Fiscalização', 'descricao': 'Módulo de fiscalização e autos'},
            {'id': 'atendimento', 'nome': 'Atendimento', 'descricao': 'Sistema de atendimento ao consumidor'},
            {'id': 'portal-empresa', 'nome': 'Portal Empresa', 'descricao': 'Portal para empresas'},
            {'id': 'portal-consumidor', 'nome': 'Portal Consumidor', 'descricao': 'Portal para consumidores'},
            {'id': 'cobranca', 'nome': 'Cobrança', 'descricao': 'Módulo de cobrança e multas'},
            {'id': 'juridico', 'nome': 'Jurídico', 'descricao': 'Módulo jurídico e processos'},
            {'id': 'relatorios', 'nome': 'Relatórios', 'descricao': 'Relatórios e estatísticas'},
            {'id': 'auditoria', 'nome': 'Auditoria', 'descricao': 'Logs e auditoria do sistema'},
            {'id': 'configuracoes', 'nome': 'Configurações', 'descricao': 'Configurações gerais'}
        ]
        return Response(modulos)
    
    @action(detail=False, methods=['get'])
    def cargos(self, request):
        """Listar cargos do sistema"""
        cargos = [
            {'id': 'admin', 'nome': 'Administrador', 'nivel': 5, 'descricao': 'Acesso total ao sistema'},
            {'id': 'coordenador', 'nome': 'Coordenador', 'nivel': 4, 'descricao': 'Acesso a módulos específicos'},
            {'id': 'fiscal', 'nome': 'Fiscal', 'nivel': 3, 'descricao': 'Acesso ao módulo de fiscalização'},
            {'id': 'atendente', 'nome': 'Atendente', 'nivel': 2, 'descricao': 'Acesso ao módulo de atendimento'},
            {'id': 'analista', 'nome': 'Analista', 'nivel': 2, 'descricao': 'Acesso limitado a relatórios'},
            {'id': 'usuario', 'nome': 'Usuário', 'nivel': 1, 'descricao': 'Acesso básico'}
        ]
        return Response(cargos)
    
    @action(detail=False, methods=['get'])
    def auditoria(self, request):
        """Relatórios de auditoria"""
        try:
            # Parâmetros de filtro
            user_id = request.query_params.get('user_id')
            acao = request.query_params.get('acao')
            modulo = request.query_params.get('modulo')
            data_inicio = request.query_params.get('data_inicio')
            data_fim = request.query_params.get('data_fim')
            sucesso = request.query_params.get('sucesso')
            
            # Query base
            logs = LogAuditoria.objects.all()
            
            # Aplicar filtros
            if user_id:
                logs = logs.filter(user_id=user_id)
            if acao:
                logs = logs.filter(acao=acao)
            if modulo:
                logs = logs.filter(modulo__icontains=modulo)
            if data_inicio:
                logs = logs.filter(timestamp__date__gte=data_inicio)
            if data_fim:
                logs = logs.filter(timestamp__date__lte=data_fim)
            if sucesso is not None:
                logs = logs.filter(sucesso=sucesso.lower() == 'true')
            
            # Paginação
            page_size = int(request.query_params.get('page_size', 50))
            page = int(request.query_params.get('page', 1))
            start = (page - 1) * page_size
            end = start + page_size
            
            logs_page = logs[start:end]
            
            # Serializar dados
            logs_data = []
            for log in logs_page:
                logs_data.append({
                    'id': log.id,
                    'user': log.user.get_full_name() if log.user else 'Sistema',
                    'username': log.user.username if log.user else 'sistema',
                    'acao': log.get_acao_display(),
                    'modulo': log.modulo,
                    'objeto_id': log.objeto_id,
                    'detalhes': log.detalhes,
                    'ip_address': log.ip_address,
                    'timestamp': log.timestamp,
                    'sucesso': log.sucesso,
                    'erro': log.erro
                })
            
            return Response({
                'logs': logs_data,
                'total': logs.count(),
                'page': page,
                'page_size': page_size,
                'total_pages': (logs.count() + page_size - 1) // page_size
            })
            
        except Exception as e:
            logger.error(f'Erro ao buscar logs de auditoria: {str(e)}')
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Estatísticas do sistema"""
        try:
            from django.db.models import Count, Q
            from datetime import datetime, timedelta
            
            # Estatísticas gerais
            total_usuarios = User.objects.filter(is_staff=True).count()
            usuarios_ativos = User.objects.filter(is_staff=True, is_active=True).count()
            usuarios_inativos = total_usuarios - usuarios_ativos
            
            # Logs de auditoria (últimos 30 dias)
            data_limite = datetime.now() - timedelta(days=30)
            logs_30_dias = LogAuditoria.objects.filter(timestamp__gte=data_limite)
            
            # Ações mais comuns
            acoes_comuns = logs_30_dias.values('acao').annotate(
                count=Count('acao')
            ).order_by('-count')[:5]
            
            # Módulos mais acessados
            modulos_acessados = logs_30_dias.values('modulo').annotate(
                count=Count('modulo')
            ).order_by('-count')[:5]
            
            # Usuários mais ativos
            usuarios_ativos_logs = logs_30_dias.values('user__username').annotate(
                count=Count('user')
            ).order_by('-count')[:5]
            
            # Logs por dia (últimos 7 dias)
            logs_por_dia = []
            for i in range(7):
                data = datetime.now() - timedelta(days=i)
                count = logs_30_dias.filter(timestamp__date=data.date()).count()
                logs_por_dia.append({
                    'data': data.strftime('%Y-%m-%d'),
                    'count': count
                })
            
            return Response({
                'usuarios': {
                    'total': total_usuarios,
                    'ativos': usuarios_ativos,
                    'inativos': usuarios_inativos
                },
                'auditoria': {
                    'total_30_dias': logs_30_dias.count(),
                    'acoes_comuns': list(acoes_comuns),
                    'modulos_acessados': list(modulos_acessados),
                    'usuarios_ativos': list(usuarios_ativos_logs),
                    'logs_por_dia': logs_por_dia
                }
            })
            
        except Exception as e:
            logger.error(f'Erro ao buscar estatísticas: {str(e)}')
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_client_ip(self, request):
        """Obter IP do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _is_cpf(self, text):
        """Verificar se o texto é um CPF"""
        if not text:
            return False
        # Remove pontos e traços
        clean_text = re.sub(r'[^\d]', '', text)
        return len(clean_text) == 11
    
    def _get_user_role(self, is_staff, is_superuser):
        """Determinar role do usuário"""
        if is_superuser:
            return 'admin'
        elif is_staff:
            return 'coordenador'
        else:
            return 'usuario'

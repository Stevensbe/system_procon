from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import transaction
import re
import logging

from .models import LogAuditoria, PerfilUsuario, Modulo, PermissaoModulo, PermissaoUsuario, ConfiguracaoSistema
from protocolo_tramitacao.models import Setor
from .serializers import ConfiguracaoSistemaSerializer
from .services import EmailNotificationService

logger = logging.getLogger(__name__)


class TIUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar usuarios do sistema via painel TI
    """
    queryset = User.objects.all()

    def list(self, request):
        """Listar todos os usuarios com perfis estendidos"""
        try:
            self._ensure_modulos_padrao()
            users = User.objects.filter(is_staff=True).order_by('id')
            users_data = []
            for user in users:
                perfil = self._get_perfil(user)
                permissoes_modulos = self._montar_permissoes_modulos(user)
                user_data = {
                    'id': user.id,
                    'nome': user.get_full_name(),
                    'email': user.email,
                    'username': user.username, # CPF ou Matricula
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
                    'setor': perfil.setor if perfil else '',
                    'status': 'ativo' if user.is_active else 'inativo',
                    'permissoesModulos': permissoes_modulos,
                }
                user_data['role'] = self._get_user_role(user.is_staff, user.is_superuser)
                users_data.append(user_data)

            return Response(users_data)
        except Exception as e:
            logger.error(f'Erro ao listar usuarios: {str(e)}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request):
        """Criar novo usuario"""
        try:
            data = request.data

            # Validacoes
            if not data.get('cpf') and not data.get('matricula'):
                return Response(
                    {'error': 'CPF ou Matricula e obrigatorio'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not data.get('senha'):
                return Response(
                    {'error': 'Senha e obrigatoria'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Usar CPF como username se disponivel, senao matricula
            username = data.get('cpf') or data.get('matricula')

            # Verificar se usuario ja existe
            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'Usuario ja existe'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # Criar usuario
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
                perfil = PerfilUsuario.objects.create(
                    user=user,
                    cpf=data.get('cpf', ''),
                    matricula=data.get('matricula', ''),
                    telefone=data.get('telefone', ''),
                    cargo=data.get('cargo', ''),
                    departamento=data.get('departamento', ''),
                    setor=data.get('setor', '') or data.get('departamento', ''),
                    ativo=data.get('status', 'ativo') == 'ativo'
                )

                self._aplicar_setor(perfil, data)
                perfil.save()

                self._atualizar_permissoes_usuario(user, data.get('permissoesModulos'))

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

                # Enviar notificacao por email
                EmailNotificationService.send_user_created_notification(data, request.user)

                logger.info(f'Usuario {user.username} criado por {request.user.username}')

                return Response({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'cpf': data.get('cpf'),
                    'matricula': data.get('matricula'),
                    'role': self._get_user_role(user.is_staff, user.is_superuser),
                    'status': 'ativo' if user.is_active else 'inativo',
                    'setor': perfil.setor,
                    'permissoesModulos': self._montar_permissoes_modulos(user),
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f'Erro ao criar usuario: {str(e)}')

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
        """Atualizar usuario"""
        try:
            user = User.objects.get(pk=pk)
            data = request.data
            perfil = self._get_perfil(user)
            if not perfil:
                perfil = PerfilUsuario.objects.create(user=user)

            # Atualizar campos basicos
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

            perfil.cpf = data.get('cpf', perfil.cpf)
            perfil.matricula = data.get('matricula', perfil.matricula)
            perfil.telefone = data.get('telefone', perfil.telefone)
            perfil.cargo = data.get('cargo', perfil.cargo)
            perfil.departamento = data.get('departamento', perfil.departamento)
            perfil.setor = data.get('setor', perfil.setor) or perfil.departamento
            perfil.ativo = user.is_active
            self._aplicar_setor(perfil, data)
            perfil.save()

            self._atualizar_permissoes_usuario(user, data.get('permissoesModulos'))

            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'cpf': data.get('cpf'),
                'matricula': data.get('matricula'),
                'role': self._get_user_role(user.is_staff, user.is_superuser),
                'status': 'ativo' if user.is_active else 'inativo',
                'setor': perfil.setor,
                'permissoesModulos': self._montar_permissoes_modulos(user),
            })

        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario nao encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, pk=None):
        """Excluir usuario"""
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario nao encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def modulos(self, request):
        """Listar modulos do sistema"""
        self._ensure_modulos_padrao()
        modulos = Modulo.objects.all().order_by('ordem', 'nome')
        modulos_data = [
            {
                'id': modulo.id,
                'nome': modulo.nome,
                'descricao': modulo.descricao,
                'icone': modulo.icone,
                'ativo': modulo.ativo,
            }
            for modulo in modulos
        ]
        return Response(modulos_data)

    @action(detail=False, methods=['get'])
    def cargos(self, request):
        """Listar cargos do sistema"""
        cargos = [
            {'id': 'admin', 'nome': 'Administrador', 'nivel': 5, 'descricao': 'Acesso total ao sistema'},
            {'id': 'coordenador', 'nome': 'Coordenador', 'nivel': 4, 'descricao': 'Acesso a modulos especificos'},
            {'id': 'fiscal', 'nome': 'Fiscal', 'nivel': 3, 'descricao': 'Acesso ao modulo de fiscalizacao'},
            {'id': 'atendente', 'nome': 'Atendente', 'nivel': 2, 'descricao': 'Acesso ao modulo de atendimento'},
            {'id': 'analista', 'nome': 'Analista', 'nivel': 2, 'descricao': 'Acesso limitado a relatorios'},
            {'id': 'usuario', 'nome': 'Usuario', 'nivel': 1, 'descricao': 'Acesso basico'}
        ]
        return Response(cargos)

    @action(detail=False, methods=['get'])
    def setores(self, request):
        """Listar setores cadastrados para associacao de usuarios"""
        setores = Setor.objects.all().order_by('nome')
        data = [
            {
                'id': setor.id,
                'nome': setor.nome,
                'sigla': setor.sigla,
            }
            for setor in setores
        ]
        return Response(data)

    @action(detail=False, methods=['get'])
    def auditoria(self, request):
        """Relatorios de auditoria"""
        try:
            # Parametros de filtro
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

            # Paginacao
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
        """Estatisticas do sistema"""
        try:
            from django.db.models import Count, Q
            from datetime import datetime, timedelta

            # Estatisticas gerais
            total_usuarios = User.objects.filter(is_staff=True).count()
            usuarios_ativos = User.objects.filter(is_staff=True, is_active=True).count()
            usuarios_inativos = total_usuarios - usuarios_ativos

            # Logs de auditoria (ultimos 30 dias)
            data_limite = datetime.now() - timedelta(days=30)
            logs_30_dias = LogAuditoria.objects.filter(timestamp__gte=data_limite)

            # Acoes mais comuns
            acoes_comuns = logs_30_dias.values('acao').annotate(
                count=Count('acao')
            ).order_by('-count')[:5]

            # Modulos mais acessados
            modulos_acessados = logs_30_dias.values('modulo').annotate(
                count=Count('modulo')
            ).order_by('-count')[:5]

            # Usuarios mais ativos
            usuarios_ativos_logs = logs_30_dias.values('user__username').annotate(
                count=Count('user')
            ).order_by('-count')[:5]

            # Logs por dia (ultimos 7 dias)
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
            logger.error(f'Erro ao buscar estatisticas: {str(e)}')
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
        """Verificar se o texto e um CPF"""
        if not text:
            return False
        # Remove pontos e tracos
        clean_text = re.sub(r'[^\d]', '', text)
        return len(clean_text) == 11

    def _get_user_role(self, is_staff, is_superuser):
        """Determinar role do usuario"""
        if is_superuser:
            return 'admin'
        elif is_staff:
            return 'coordenador'
        else:
            return 'usuario'

    def _get_perfil(self, user):
        return getattr(user, 'perfil', None) or getattr(user, 'perfilusuario', None)

    def _aplicar_setor(self, perfil, data):
        setor_id = data.get('setor_id') or data.get('setor')
        if not setor_id:
            return
        try:
            setor = None
            if isinstance(setor_id, int) or str(setor_id).isdigit():
                setor = Setor.objects.filter(pk=int(setor_id)).first()
            else:
                setor = Setor.objects.filter(nome__iexact=str(setor_id).strip()).first()
            if setor:
                perfil.setor = setor.nome
                if not perfil.departamento:
                    perfil.departamento = setor.nome
        except Exception:
            return

    def _ensure_modulos_padrao(self):
        """Garante que os módulos básicos existam no banco."""
        defaults = [
            {"nome": "Dashboard", "descricao": "Painel principal do sistema", "icone": "fa-chart-bar", "ordem": 1},
            {"nome": "Fiscalizacao", "descricao": "Modulo de fiscalizacao e autos", "icone": "fa-search", "ordem": 2},
            {"nome": "Atendimento", "descricao": "Sistema de atendimento ao consumidor", "icone": "fa-headset", "ordem": 3},
            {"nome": "Portal Empresa", "descricao": "Portal para empresas", "icone": "fa-building", "ordem": 4},
            {"nome": "Portal Consumidor", "descricao": "Portal para consumidores", "icone": "fa-user", "ordem": 5},
            {"nome": "Processos", "descricao": "Modulo de processos e tramitacao", "icone": "fa-tasks", "ordem": 6},
            {"nome": "Cobranca", "descricao": "Modulo de cobranca e multas", "icone": "fa-dollar-sign", "ordem": 7},
            {"nome": "Juridico", "descricao": "Modulo juridico e processos", "icone": "fa-balance-scale", "ordem": 8},
            {"nome": "Relatorios", "descricao": "Relatorios e estatisticas", "icone": "fa-chart-pie", "ordem": 9},
            {"nome": "Auditoria", "descricao": "Logs e auditoria do sistema", "icone": "fa-shield-alt", "ordem": 10},
            {"nome": "Configuracoes", "descricao": "Configuracoes gerais", "icone": "fa-cogs", "ordem": 11},
        ]
        for item in defaults:
            Modulo.objects.get_or_create(
                nome=item["nome"],
                defaults={
                    "descricao": item["descricao"],
                    "icone": item["icone"],
                    "ordem": item["ordem"],
                    "ativo": True,
                },
            )

    def _modulo_key(self, nome):
        return str(nome or "").lower().replace(" ", "-")

    def _ensure_permissoes_modulo(self, modulo):
        permissoes = []
        for codigo, _ in PermissaoModulo.TIPOS_PERMISSAO:
            perm, _ = PermissaoModulo.objects.get_or_create(
                nome=codigo,
                modulo=modulo,
                defaults={"descricao": f"{codigo} em {modulo.nome}"},
            )
            permissoes.append(perm)
        return permissoes

    def _montar_permissoes_modulos(self, user):
        self._ensure_modulos_padrao()
        modulos = Modulo.objects.all()
        tipos = [codigo for codigo, _ in PermissaoModulo.TIPOS_PERMISSAO]
        base = {
            self._modulo_key(modulo.nome): {tipo: False for tipo in tipos}
            for modulo in modulos
        }

        permissoes_usuario = (
            PermissaoUsuario.objects.filter(user=user, concedida=True)
            .select_related("permissao__modulo")
        )
        for pu in permissoes_usuario:
            modulo_key = self._modulo_key(pu.permissao.modulo.nome)
            if modulo_key not in base:
                base[modulo_key] = {tipo: False for tipo in tipos}
            base[modulo_key][pu.permissao.nome] = True
        return base

    def _atualizar_permissoes_usuario(self, user, permissoes_modulos):
        if permissoes_modulos is None:
            return

        if isinstance(permissoes_modulos, str):
            try:
                import json
                permissoes_modulos = json.loads(permissoes_modulos)
            except Exception:
                return

        if not isinstance(permissoes_modulos, dict):
            return

        self._ensure_modulos_padrao()
        modulos = {self._modulo_key(m.nome): m for m in Modulo.objects.all()}
        tipos = [codigo for codigo, _ in PermissaoModulo.TIPOS_PERMISSAO]

        PermissaoUsuario.objects.filter(user=user).delete()

        for modulo_key, perms in permissoes_modulos.items():
            modulo = modulos.get(modulo_key) or modulos.get(self._modulo_key(modulo_key))
            if not modulo:
                continue
            permissoes_modulo = {p.nome: p for p in self._ensure_permissoes_modulo(modulo)}
            for tipo in tipos:
                if not perms or not isinstance(perms, dict):
                    continue
                if perms.get(tipo):
                    permissao = permissoes_modulo.get(tipo)
                    if permissao:
                        PermissaoUsuario.objects.get_or_create(
                            user=user,
                            permissao=permissao,
                            defaults={"concedida": True, "concedida_por": None},
                        )


class ConfiguracaoSistemaViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracaoSistema.objects.all().order_by('chave')
    serializer_class = ConfiguracaoSistemaSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'chave'

    def get_queryset(self):
        ConfiguracaoSistema.ensure_defaults()
        return super().get_queryset()

    def list(self, request, *args, **kwargs):
        ConfiguracaoSistema.ensure_defaults()
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        ConfiguracaoSistema.ensure_defaults()
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.editavel:
            return Response(
                {'error': 'Configuracao bloqueada para edicao.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.editavel:
            return Response(
                {'error': 'Configuracao bloqueada para edicao.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

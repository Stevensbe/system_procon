"""
Mixins para controle de permissões da Caixa de Entrada
"""

from django.contrib.auth.mixins import UserPassesTestMixin, LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.contrib import messages
from django.http import JsonResponse
from .models import PermissaoSetorCaixaEntrada, AcessoEspecialCaixaEntrada


class SetorPermissionMixin(LoginRequiredMixin):
    """Mixin para verificar permissões de setor"""
    
    def dispatch(self, request, *args, **kwargs):
        # Verificar se o usuário tem permissão para acessar a caixa de entrada
        if not self.tem_permissao_caixa_entrada(request.user):
            messages.error(request, "Você não tem permissão para acessar a Caixa de Entrada.")
            return redirect('home')  # Redirecionar para página inicial
        
        return super().dispatch(request, *args, **kwargs)
    
    def tem_permissao_caixa_entrada(self, user):
        """Verifica se o usuário tem permissão para acessar a caixa de entrada"""
        # Superusuários sempre têm acesso
        if user.is_superuser:
            return True
        
        # Verificar se o usuário está em algum setor com permissão
        return PermissaoSetorCaixaEntrada.objects.filter(
            usuarios=user,
            ativo=True,
            pode_visualizar=True
        ).exists()
    
    def get_documentos_permitidos(self, user):
        """Retorna os documentos que o usuário pode visualizar"""
        from .models import CaixaEntrada
        
        # Superusuários veem tudo
        if user.is_superuser:
            return CaixaEntrada.objects.all()
        
        # Buscar permissões do usuário
        permissoes = PermissaoSetorCaixaEntrada.objects.filter(
            usuarios=user,
            ativo=True,
            pode_visualizar=True
        )
        
        if not permissoes.exists():
            return CaixaEntrada.objects.none()
        
        # Filtrar documentos baseado nas permissões
        documentos_permitidos = CaixaEntrada.objects.none()
        
        for permissao in permissoes:
            # Se tem acesso geral
            if permissao.setor == 'GERAL':
                return CaixaEntrada.objects.all()
            
            # Filtrar por setor do documento
            setor_display = permissao.get_setor_display()
            documentos_setor = CaixaEntrada.objects.filter(setor_destino=setor_display)
            
            # Adicionar documentos de setores permitidos
            for setor_permitido in permissao.setores_permitidos:
                documentos_setor = documentos_setor | CaixaEntrada.objects.filter(
                    setor_destino=setor_permitido
                )
            
            # Adicionar documentos por tipo permitido
            for tipo_permitido in permissao.tipos_documento_permitidos:
                documentos_setor = documentos_setor | CaixaEntrada.objects.filter(
                    tipo_documento=tipo_permitido
                )
            
            documentos_permitidos = documentos_permitidos | documentos_setor
        
        # Adicionar documentos com acesso especial
        acessos_especiais = AcessoEspecialCaixaEntrada.objects.filter(
            usuario=user,
            ativo=True
        )
        
        for acesso in acessos_especiais:
            if acesso.esta_valido():
                documentos_permitidos = documentos_permitidos | CaixaEntrada.objects.filter(
                    id=acesso.documento.id
                )
        
        return documentos_permitidos.distinct()


class DocumentoPermissionMixin(SetorPermissionMixin):
    """Mixin para verificar permissões específicas de documento"""
    
    def pode_acessar_documento(self, user, documento):
        """Verifica se o usuário pode acessar um documento específico"""
        # Superusuários sempre podem acessar
        if user.is_superuser:
            return True
        
        # Verificar permissões de setor
        permissoes = PermissaoSetorCaixaEntrada.objects.filter(
            usuarios=user,
            ativo=True,
            pode_visualizar=True
        )
        
        for permissao in permissoes:
            if permissao.pode_acessar_documento(documento):
                return True
        
        # Verificar acesso especial
        return AcessoEspecialCaixaEntrada.objects.filter(
            usuario=user,
            documento=documento,
            ativo=True
        ).exists()
    
    def pode_editar_documento(self, user, documento):
        """Verifica se o usuário pode editar um documento"""
        # Superusuários sempre podem editar
        if user.is_superuser:
            return True
        
        # Verificar permissões de setor
        permissoes = PermissaoSetorCaixaEntrada.objects.filter(
            usuarios=user,
            ativo=True,
            pode_editar=True
        )
        
        for permissao in permissoes:
            if permissao.pode_acessar_documento(documento):
                return True
        
        # Verificar acesso especial
        return AcessoEspecialCaixaEntrada.objects.filter(
            usuario=user,
            documento=documento,
            ativo=True,
            pode_editar=True
        ).exists()
    
    def pode_encaminhar_documento(self, user, documento):
        """Verifica se o usuário pode encaminhar um documento"""
        # Superusuários sempre podem encaminhar
        if user.is_superuser:
            return True
        
        # Verificar permissões de setor
        permissoes = PermissaoSetorCaixaEntrada.objects.filter(
            usuarios=user,
            ativo=True,
            pode_encaminhar=True
        )
        
        for permissao in permissoes:
            if permissao.pode_acessar_documento(documento):
                return True
        
        # Verificar acesso especial
        return AcessoEspecialCaixaEntrada.objects.filter(
            usuario=user,
            documento=documento,
            ativo=True,
            pode_encaminhar=True
        ).exists()
    
    def pode_arquivar_documento(self, user, documento):
        """Verifica se o usuário pode arquivar um documento"""
        # Superusuários sempre podem arquivar
        if user.is_superuser:
            return True
        
        # Verificar permissões de setor
        permissoes = PermissaoSetorCaixaEntrada.objects.filter(
            usuarios=user,
            ativo=True,
            pode_arquivar=True
        )
        
        for permissao in permissoes:
            if permissao.pode_acessar_documento(documento):
                return True
        
        # Verificar acesso especial
        return AcessoEspecialCaixaEntrada.objects.filter(
            usuario=user,
            documento=documento,
            ativo=True,
            pode_arquivar=True
        ).exists()


class AdminPermissionMixin(LoginRequiredMixin, UserPassesTestMixin):
    """Mixin para verificar permissões administrativas"""
    
    def test_func(self):
        user = self.request.user
        
        # Superusuários sempre têm acesso
        if user.is_superuser:
            return True
        
        # Verificar se tem permissão para gerenciar permissões
        return PermissaoSetorCaixaEntrada.objects.filter(
            usuarios=user,
            ativo=True,
            pode_gerenciar_permissoes=True
        ).exists()


def verificar_permissao_documento(view_func):
    """Decorator para verificar permissão de documento em views baseadas em função"""
    def wrapper(request, *args, **kwargs):
        from .models import CaixaEntrada
        
        # Obter o documento
        documento_id = kwargs.get('documento_id') or kwargs.get('pk')
        try:
            documento = CaixaEntrada.objects.get(id=documento_id)
        except CaixaEntrada.DoesNotExist:
            messages.error(request, "Documento não encontrado.")
            return redirect('caixa_entrada:caixa_entrada')
        
        # Verificar permissão
        mixin = DocumentoPermissionMixin()
        if not mixin.pode_acessar_documento(request.user, documento):
            messages.error(request, "Você não tem permissão para acessar este documento.")
            return redirect('caixa_entrada:caixa_entrada')
        
        return view_func(request, *args, **kwargs)
    
    return wrapper

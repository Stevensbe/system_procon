from rest_framework import permissions


class CobrancaPermission(permissions.BasePermission):
    """
    Permissões para o módulo de cobrança
    """
    
    def has_permission(self, request, view):
        # Verificar se o usuário está autenticado
        if not request.user.is_authenticated:
            return False
        
        # Verificar se o usuário tem permissão para acessar cobrança
        if not request.user.has_perm('cobranca.view_boleto'):
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Verificar permissões específicas por objeto
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_perm('cobranca.view_boleto')
        
        if request.method == 'POST':
            return request.user.has_perm('cobranca.add_boleto')
        
        if request.method in ['PUT', 'PATCH']:
            return request.user.has_perm('cobranca.change_boleto')
        
        if request.method == 'DELETE':
            return request.user.has_perm('cobranca.delete_boleto')
        
        return False


class BoletoPermission(permissions.BasePermission):
    """
    Permissões específicas para boletos
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_perm('cobranca.view_boleto')
        
        if request.method == 'POST':
            return request.user.has_perm('cobranca.add_boleto')
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_perm('cobranca.view_boleto')
        
        if request.method in ['PUT', 'PATCH']:
            return request.user.has_perm('cobranca.change_boleto')
        
        if request.method == 'DELETE':
            return request.user.has_perm('cobranca.delete_boleto')
        
        return False


class PagamentoPermission(permissions.BasePermission):
    """
    Permissões específicas para pagamentos
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_perm('cobranca.view_pagamento')
        
        if request.method == 'POST':
            return request.user.has_perm('cobranca.add_pagamento')
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_perm('cobranca.view_pagamento')
        
        if request.method in ['PUT', 'PATCH']:
            return request.user.has_perm('cobranca.change_pagamento')
        
        if request.method == 'DELETE':
            return request.user.has_perm('cobranca.delete_pagamento')
        
        return False


class RemessaPermission(permissions.BasePermission):
    """
    Permissões específicas para remessas
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_perm('cobranca.view_remessa')
        
        if request.method == 'POST':
            return request.user.has_perm('cobranca.add_remessa')
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_perm('cobranca.view_remessa')
        
        if request.method in ['PUT', 'PATCH']:
            return request.user.has_perm('cobranca.change_remessa')
        
        if request.method == 'DELETE':
            return request.user.has_perm('cobranca.delete_remessa')
        
        return False

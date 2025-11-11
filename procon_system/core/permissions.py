"""
Permissões e decoradores relacionados a papéis de usuário.
"""
from __future__ import annotations

from functools import wraps
from typing import Iterable

from django.core.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission

from .roles import get_user_roles, user_has_role


class RolePermission(BasePermission):
    """
    Verifica se o usuário autenticado possui um dos papéis permitidos.
    A view pode definir:
        - allowed_roles: tuple/list de papéis aceitos por padrão
        - action_role_map: dict{'nome_da_action': ('role1', 'role2')}
    """

    allowed_roles: Iterable[str] = ("admin", "staff")
    permission_denied_message = "Você não tem permissão para acessar este recurso."

    def _resolve_allowed_roles(self, view) -> Iterable[str]:
        action_map = getattr(view, "action_role_map", None)
        action = getattr(view, "action", None)
        if action_map and action in action_map:
            return action_map[action]

        return getattr(view, "allowed_roles", self.allowed_roles)

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        roles = self._resolve_allowed_roles(view)
        return user_has_role(request.user, roles)

    def has_object_permission(self, request, view, obj) -> bool:  # noqa: D401
        # Para este cenário, a verificação em nível de view é suficiente.
        return self.has_permission(request, view)


def role_required(*roles):
    """
    Decorador para views Django que exige papéis específicos.
    Deve ser utilizado em conjunto com @login_required.
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                raise PermissionDenied("Autenticação necessária.")

            if not user_has_role(request.user, roles):
                detalhes = ", ".join(get_user_roles(request.user))
                raise PermissionDenied(f"Acesso restrito. Seus perfis: {detalhes}.")

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator

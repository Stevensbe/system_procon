from __future__ import annotations

from typing import Any, Dict, Optional

from django.contrib.auth import get_user_model

from .roles import get_empresas, get_primary_role, get_redirect_for_role, get_user_roles

User = get_user_model()


def serialize_user(user: Optional[User]) -> Optional[Dict[str, Any]]:
    """
    Serializa o usuário autenticado incluindo papéis, empresas vinculadas e rota sugerida.
    """
    if not user:
        return None

    roles = get_user_roles(user)
    primary_role = get_primary_role(user)
    redirect_to = get_redirect_for_role(user)

    data: Dict[str, Any] = {
        "id": user.id,
        "username": user.get_username(),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "roles": roles,
        "role": primary_role,
        "redirect_to": redirect_to,
        "empresas": get_empresas(user),
    }

    return data

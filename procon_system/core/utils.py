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

    if user.is_staff:
        try:
            from ti.models import Modulo, PermissaoModulo, PermissaoUsuario, PerfilUsuario  # type: ignore

            tipos = [codigo for codigo, _ in PermissaoModulo.TIPOS_PERMISSAO]
            modulos = Modulo.objects.all()
            permissoes_modulos = {
                str(modulo.nome).lower().replace(" ", "-"): {tipo: False for tipo in tipos}
                for modulo in modulos
            }

            permissoes_usuario = (
                PermissaoUsuario.objects.filter(user=user, concedida=True)
                .select_related("permissao__modulo")
            )
            for pu in permissoes_usuario:
                modulo_key = str(pu.permissao.modulo.nome).lower().replace(" ", "-")
                if modulo_key not in permissoes_modulos:
                    permissoes_modulos[modulo_key] = {tipo: False for tipo in tipos}
                permissoes_modulos[modulo_key][pu.permissao.nome] = True

            perfil = getattr(user, "perfil", None) or getattr(user, "perfilusuario", None)
            if not perfil:
                perfil = PerfilUsuario.objects.filter(user=user).first()

            if perfil:
                data["setor"] = getattr(perfil, "setor", "") or getattr(perfil, "departamento", "")

            data["permissoesModulos"] = permissoes_modulos
        except Exception:
            # Mantém payload mínimo caso o módulo TI ainda não esteja configurado
            pass

    return data

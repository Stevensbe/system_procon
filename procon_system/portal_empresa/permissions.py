from __future__ import annotations

import re
from typing import Iterable

from rest_framework.permissions import BasePermission

from portal_empresa.models import EmpresaAutorizada, UsuarioEmpresaAutorizado


def _sanitize_cnpj(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\D", "", value)


def empresas_do_usuario(usuario) -> Iterable[EmpresaAutorizada]:
    """
    Retorna as empresas associadas ao usuário.
    Usuários staff/suporte têm acesso a todas as empresas aprovadas.
    """
    if not getattr(usuario, "is_authenticated", False):
        return EmpresaAutorizada.objects.none()

    if usuario.is_staff or usuario.is_superuser:
        return EmpresaAutorizada.objects.exclude(status__in=["BLOQUEADA", "REVOGADA"])

    empresas = EmpresaAutorizada.objects.filter(
        usuarioempresaautorizado__usuario=usuario,
        usuarioempresaautorizado__ativo=True,
    ).exclude(status__in=["BLOQUEADA", "REVOGADA", "SUSPENSA"])

    return empresas.distinct()


class IsEmpresaAutorizada(BasePermission):
    """
    Garante que o usuário autenticado possui vínculo ativo com alguma empresa autorizada
    (ou é membro da equipe interna).
    """

    message = "Acesso restrito ao portal da empresa. Vincule uma empresa autorizada para prosseguir."

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        return UsuarioEmpresaAutorizado.objects.filter(
            usuario=user,
            ativo=True,
            empresa__status__in=["ATIVA", "PENDING_CONF"],
        ).exists()

    @staticmethod
    def cnpjs_permitidos(usuario) -> set[str]:
        """Lista os CNPJs normalizados que o usuário pode acessar."""
        empresas = empresas_do_usuario(usuario)
        return {
            _sanitize_cnpj(empresa.cnpj)
            for empresa in empresas
            if empresa.cnpj
        }

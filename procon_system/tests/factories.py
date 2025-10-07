from __future__ import annotations

from typing import Any

import factory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.utils import timezone


User = get_user_model()


class GroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Group
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"grupo_{n}")

    @factory.post_generation
    def permissions(self, create: bool, extracted: list[Permission] | None, **kwargs: Any) -> None:  # noqa: D401
        """Attach permissions if provided."""
        if not create or not extracted:
            return
        for perm in extracted:
            self.permissions.add(perm)


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ("username",)

    username = factory.Faker("user_name", locale="pt_BR")
    first_name = factory.Faker("first_name", locale="pt_BR")
    last_name = factory.Faker("last_name", locale="pt_BR")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    is_active = True

    @factory.post_generation
    def password(self, create: bool, extracted: str | None, **kwargs: Any) -> None:  # noqa: D401
        """Set hashed password; pass a raw password via `password="..."`."""
        raw_password = extracted or "senha_teste_123"
        self.set_password(raw_password)
        if create:
            self.save(update_fields=["password"])

    @factory.post_generation
    def groups(self, create: bool, extracted: list[Group] | None, **kwargs: Any) -> None:  # noqa: D401
        """Attach groups if provided."""
        if not create or not extracted:
            return
        for group in extracted:
            self.groups.add(group)


class StaffUserFactory(UserFactory):
    is_staff = True


class SuperUserFactory(UserFactory):
    is_staff = True
    is_superuser = True


# Example domain factories (kept lightweight for immediate use in tests).
# Add more as tests require.
try:
    from protocolo_tramitacao.models import Setor  # type: ignore

    class SetorFactory(factory.django.DjangoModelFactory):
        class Meta:
            model = Setor

        nome = factory.Faker("job", locale="pt_BR")
        sigla = factory.Sequence(lambda n: f"S{n:03d}")
        pode_protocolar = True
        pode_tramitar = True
        ativo = True
        criado_em = factory.LazyFunction(timezone.now)
except Exception:  # pragma: no cover - optional app
    # App may not be installed in all test runs; keep factories optional.
    pass



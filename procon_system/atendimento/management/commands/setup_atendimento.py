from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from atendimento.models import (
    BalcaoAtendimento,
    ConfiguracaoAtendimento,
    FilaAtendimento,
)


DEFAULT_BALCOES = [
    ("GUICH1", "Guichê 1", "Atendimento geral"),
    ("GUICH2", "Guichê 2", "Atendimento geral"),
    ("PRIO", "Guichê Prioritário", "Atendimento prioritário (idosos, gestantes, PCD)"),
]


class Command(BaseCommand):
    help = "Cria configuração e registros básicos para o módulo de atendimento presencial."

    def add_arguments(self, parser):
        parser.add_argument(
            "--balcao",
            action="append",
            metavar="CODIGO:NOME",
            help="Define balções personalizados no formato CODIGO:NOME.",
        )
        parser.add_argument(
            "--descricao",
            action="append",
            metavar="CODIGO:DESCRICAO",
            help="Descrição adicional para um balção existente.",
        )
        parser.add_argument(
            "--create-staff-user",
            nargs=3,
            metavar=("USERNAME", "EMAIL", "SENHA"),
            help="Cria um usuário de atendimento (staff) com os dados informados.",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Executando setup do módulo de atendimento..."))

        # Cria/garante configuração ativa
        config = ConfiguracaoAtendimento.get_config()
        self.stdout.write(self.style.SUCCESS(f"Configuração ativa: {config.nome_sistema} (versão {config.versao})"))

        # Resolver balções
        balcoes_custom = self._parse_custom_balcoes(options.get("balcao"))
        descricoes_custom = self._parse_descricoes(options.get("descricao"))

        if balcoes_custom:
            seeds = balcoes_custom
        else:
            seeds = DEFAULT_BALCOES

        created_balcoes = []
        for codigo, nome, descricao in seeds:
            descricao_final = descricoes_custom.get(codigo, descricao)
            balcao, created = BalcaoAtendimento.objects.get_or_create(
                codigo=codigo,
                defaults={
                    "nome": nome,
                    "descricao": descricao_final,
                    "ordem_prioridade": len(created_balcoes) + 1,
                },
            )
            if not created and descricao_final and balcao.descricao != descricao_final:
                balcao.descricao = descricao_final
                balcao.save(update_fields=["descricao"])
            created_balcoes.append((balcao, created))

        for balcao, created in created_balcoes:
            status = "criado" if created else "existente"
            self.stdout.write(self.style.SUCCESS(f"Balcão {balcao.codigo} - {balcao.nome} ({status})"))
            fila = FilaAtendimento.obter_fila_ativa(balcao)
            self.stdout.write(
                f"  ↳ fila ativa para {fila.data_referencia} (emitidas: {fila.quantidade_emitidas}, chamadas: {fila.quantidade_chamadas})"
            )

        # Usuário staff opcional
        staff_args = options.get("create_staff_user")
        if staff_args:
            self._ensure_staff_user(*staff_args)

        self.stdout.write(self.style.SUCCESS("Setup concluído."))  # final message

    def _parse_custom_balcoes(self, balcao_options):
        if not balcao_options:
            return []

        result = []
        for item in balcao_options:
            try:
                codigo, nome = item.split(":", 1)
            except ValueError as exc:
                raise CommandError(f"Formato inválido para --balcao '{item}'. Use CODIGO:NOME.") from exc
            result.append((codigo.strip().upper(), nome.strip(), ""))
        return result

    def _parse_descricoes(self, descricao_options):
        if not descricao_options:
            return {}

        result = {}
        for item in descricao_options:
            try:
                codigo, descricao = item.split(":", 1)
            except ValueError as exc:
                raise CommandError(f"Formato inválido para --descricao '{item}'. Use CODIGO:DESCRICAO.") from exc
            result[codigo.strip().upper()] = descricao.strip()
        return result

    @transaction.atomic
    def _ensure_staff_user(self, username, email, senha):
        User = get_user_model()
        usuario, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_active": True,
            },
        )
        if created:
            usuario.set_password(senha)
            usuario.save(update_fields=["password"])
            self.stdout.write(self.style.SUCCESS(f"Usuário staff '{username}' criado."))
        else:
            self.stdout.write(self.style.WARNING(f"Usuário '{username}' já existe."))

from django.core.management.base import BaseCommand
from django.utils import timezone

from business_intelligence.models import RelatorioPersonalizado
from business_intelligence.services import portal_consumidor_analytics_service


class Command(BaseCommand):
    help = "Sincroniza métricas do portal do consumidor e persiste no BI."

    def add_arguments(self, parser):
        parser.add_argument("--start-date", dest="start_date", help="Data inicial (YYYY-MM-DD).")
        parser.add_argument("--end-date", dest="end_date", help="Data final (YYYY-MM-DD).")

    def handle(self, *args, **options):
        start_date = options.get("start_date")
        end_date = options.get("end_date")
        self.stdout.write("Coletando métricas do portal do consumidor...")
        overview = portal_consumidor_analytics_service.get_overview(start_date, end_date)
        analise = portal_consumidor_analytics_service.persist_overview(overview)

        relatorio, created = RelatorioPersonalizado.objects.get_or_create(
            codigo="REL_PORTAL_CONSUMIDOR",
            defaults={
                "nome": "Portal do Consumidor - Indicadores",
                "descricao": "Relatório de métricas consolidadas do portal do consumidor",
                "tipo_relatorio": "EXECUTIVO",
                "formato": "JSON",
                "frequencia_geracao": "IMEDIATO",
                "created_by": getattr(analise, "executado_por", None),
            },
        )
        relatorio.configuracoes_exibicao = {
            "ultima_sincronizacao": timezone.now().isoformat(),
            "overview": overview,
            "analise_id": analise.id,
        }
        relatorio.ultima_execucao = timezone.now()
        relatorio.save(update_fields=["configuracoes_exibicao", "ultima_execucao"])

        self.stdout.write(self.style.SUCCESS("Overview sincronizado com sucesso."))
        self.stdout.write(f"Período: {overview['periodo']['inicio']} a {overview['periodo']['fim']}")
        self.stdout.write(f"Total de tickets: {overview['tickets']['total']}")
        tempo_medio = overview['tickets']['tempo_medio_resposta_horas']
        self.stdout.write(f"Tempo médio de resposta (h): {tempo_medio}")
        self.stdout.write(f"Total de feedbacks: {overview['feedbacks']['total']}")
        self.stdout.write(f"Relatório atualizado: {relatorio.codigo}")
        if analise:
            self.stdout.write(f"Análise registrada: {analise.codigo} (versão {analise.versao_analise})")
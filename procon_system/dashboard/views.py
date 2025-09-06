from django.views.generic import TemplateView
from fiscalizacao.models import AutoBanco, AutoPosto, AutoSupermercado, AutoDiversos, AutoInfracao
from multas.models import Multa
from django.db.models import Count, Q

class DashboardView(TemplateView):
    template_name = 'dashboard/home.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        # totais de autos
        ctx['total_constatacoes'] = (AutoBanco.objects.count() + 
                                     AutoPosto.objects.count() + 
                                     AutoSupermercado.objects.count() + 
                                     AutoDiversos.objects.count())
        ctx['total_infracoes']    = AutoInfracao.objects.count()
        # multas e status de pagamento
        ctx['total_multas']       = Multa.objects.count()
        ctx['multas_pagas']       = Multa.objects.filter(pago=True).count()
        ctx['multas_debito']      = Multa.objects.filter(pago=False).count()
        # conversão Constatação → Infração
        ctx['percent_convert']    = (
            ctx['total_infracoes'] / ctx['total_constatacoes'] * 100
        ) if ctx['total_constatacoes'] else 0
        return ctx

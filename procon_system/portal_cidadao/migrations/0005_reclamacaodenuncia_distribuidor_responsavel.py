from django.db import migrations, models
import django.db.models.deletion


def set_distribuidor_reclamacao(apps, schema_editor):
    Reclamacao = apps.get_model('portal_cidadao', 'ReclamacaoDenuncia')
    for reclamacao in Reclamacao.objects.select_related('atendente_responsavel', 'analista_responsavel').all():
        reclamacao.distribuidor_responsavel = (
            reclamacao.atendente_responsavel
            or reclamacao.analista_responsavel
        )
        reclamacao.save(update_fields=['distribuidor_responsavel'])


class Migration(migrations.Migration):

    dependencies = [
        ('portal_cidadao', '0004_anexoreclamacao_armazenamento_origem_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='reclamacaodenuncia',
            name='distribuidor_responsavel',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reclamacoes_distribuidas', to='auth.user', verbose_name='Responsável Distribuído'),
        ),
        migrations.RunPython(set_distribuidor_reclamacao, migrations.RunPython.noop),
    ]

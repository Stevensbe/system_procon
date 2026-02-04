from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('portal_cidadao', '0008_historicoatividade'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='denunciacidadao',
            name='competencia_procon',
            field=models.BooleanField(blank=True, null=True, verbose_name='Competencia do PROCON'),
        ),
        migrations.AddField(
            model_name='denunciacidadao',
            name='orientacao_destino',
            field=models.TextField(blank=True, verbose_name='Orientacao ao cidadao'),
        ),
        migrations.AddField(
            model_name='denunciacidadao',
            name='resposta_fiscal',
            field=models.TextField(blank=True, verbose_name='Resposta do fiscal'),
        ),
        migrations.AddField(
            model_name='denunciacidadao',
            name='respondido_em',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Respondido em'),
        ),
        migrations.AddField(
            model_name='denunciacidadao',
            name='respondido_por',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='denuncias_cidadao_respondidas',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]

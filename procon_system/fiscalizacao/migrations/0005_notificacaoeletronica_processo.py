from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('fiscalizacao', '0004_processo_sei_auto_constatacao'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificacaoeletronica',
            name='processo',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='notificacoes',
                to='fiscalizacao.processo',
                verbose_name='Processo Administrativo',
            ),
        ),
    ]

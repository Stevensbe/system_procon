from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('fiscalizacao', '0006_notificacao_numero_sequencia'),
        ('ppa', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificacaoeletronica',
            name='ppa',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='notificacoes_fiscalizacao',
                to='ppa.procedimentopreadministrativo',
                verbose_name='PPA',
            ),
        ),
    ]

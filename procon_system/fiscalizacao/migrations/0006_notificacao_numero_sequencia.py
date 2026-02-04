from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('fiscalizacao', '0005_notificacaoeletronica_processo'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificacaoeletronica',
            name='numero',
            field=models.CharField(blank=True, max_length=20, unique=True, null=True, verbose_name='Numero da Notificacao'),
        ),
        migrations.CreateModel(
            name='SequenciaNotificacaoFiscalizacao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ano', models.IntegerField(unique=True, verbose_name='Ano')),
                ('ultimo_numero', models.IntegerField(default=0, verbose_name='Ultimo Numero Gerado')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
            ],
            options={
                'verbose_name': 'Sequencia de Notificacao Fiscalizacao',
                'verbose_name_plural': 'Sequencias de Notificacao Fiscalizacao',
                'ordering': ['-ano'],
            },
        ),
    ]

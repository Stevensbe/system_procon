from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notificacoes', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DispositivoNotificacao',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=255)),
                ('plataforma', models.CharField(choices=[('android', 'Android'), ('ios', 'iOS'), ('web', 'Web'), ('desktop', 'Desktop')], default='web', max_length=20)),
                ('descricao', models.CharField(blank=True, max_length=100)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('usuario', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='dispositivos_notificacao', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-atualizado_em'],
                'verbose_name': 'Dispositivo de Notificação',
                'verbose_name_plural': 'Dispositivos de Notificação',
                'unique_together': {('usuario', 'token')},
            },
        ),
    ]

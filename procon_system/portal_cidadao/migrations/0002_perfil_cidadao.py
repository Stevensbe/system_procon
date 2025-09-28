# Generated manually by Codex
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('portal_cidadao', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PerfilCidadao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome_completo', models.CharField(max_length=150, verbose_name='Nome completo')),
                ('cpf', models.CharField(max_length=14, unique=True, verbose_name='CPF')),
                ('telefone', models.CharField(blank=True, max_length=20, verbose_name='Telefone')),
                ('cidade', models.CharField(blank=True, max_length=100, verbose_name='Cidade')),
                ('estado', models.CharField(blank=True, max_length=2, verbose_name='Estado')),
                ('endereco', models.CharField(blank=True, max_length=255, verbose_name='Endereço')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='perfil_cidadao', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Perfil do Cidadão',
                'verbose_name_plural': 'Perfis dos Cidadãos',
                'ordering': ['nome_completo'],
            },
        ),
    ]

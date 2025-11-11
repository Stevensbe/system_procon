from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def set_distribuidor_existente(apps, schema_editor):
    Atendimento = apps.get_model('atendimento', 'Atendimento')
    for atendimento in Atendimento.objects.select_related('atendente'):
        atendimento.distribuidor_responsavel = atendimento.atendente
        atendimento.save(update_fields=['distribuidor_responsavel'])


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('atendimento', '0003_atendimento_consentimento_origem_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='RegraDistribuicaoAtendimento',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=120, verbose_name='Nome da Regra')),
                ('prioridade', models.PositiveIntegerField(default=1, verbose_name='Prioridade')),
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('gravidade', models.CharField(blank=True, choices=[('BAIXA', 'Baixa'), ('MEDIA', 'Média'), ('ALTA', 'Alta')], max_length=10, verbose_name='Gravidade')),
                ('assunto', models.CharField(blank=True, max_length=100, verbose_name='Assunto Classificado')),
                ('tipo_classificacao', models.CharField(blank=True, max_length=40, verbose_name='Tipo de Classificação')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('responsavel', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='regras_distribuicao_atendimento', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Regra de Distribuição',
                'verbose_name_plural': 'Regras de Distribuição',
                'ordering': ['prioridade', 'nome'],
            },
        ),
        migrations.AddField(
            model_name='atendimento',
            name='distribuidor_responsavel',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='atendimentos_distribuidos', to=settings.AUTH_USER_MODEL, verbose_name='Responsável Distribuído'),
        ),
        migrations.RunPython(set_distribuidor_existente, migrations.RunPython.noop),
    ]

from django.db import migrations, models
import django.core.validators
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('financeiro', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='financeiro',
            name='categoria',
            field=models.CharField(default='GERAL', max_length=50, verbose_name='Categoria'),
        ),
        migrations.AlterField(
            model_name='financeiro',
            name='data',
            field=models.DateField(default=django.utils.timezone.now, verbose_name='Data'),
        ),
        migrations.AlterField(
            model_name='financeiro',
            name='tipo',
            field=models.CharField(choices=[('RECEITA', 'Receita'), ('DESPESA', 'Despesa')], max_length=20, verbose_name='Tipo'),
        ),
        migrations.AlterField(
            model_name='financeiro',
            name='valor',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0, message='Valor deve ser positivo')], verbose_name='Valor'),
        ),
        migrations.CreateModel(
            name='Transacao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('receita', 'Receita'), ('despesa', 'Despesa')], max_length=20, verbose_name='Tipo')),
                ('valor', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0, message='Valor deve ser positivo')], verbose_name='Valor')),
                ('descricao', models.CharField(max_length=200, verbose_name='Descrição')),
                ('data_transacao', models.DateField(default=django.utils.timezone.now, verbose_name='Data da Transação')),
                ('status', models.CharField(choices=[('pendente', 'Pendente'), ('confirmada', 'Confirmada'), ('cancelada', 'Cancelada')], default='pendente', max_length=20, verbose_name='Status')),
                ('categoria', models.CharField(default='GERAL', max_length=50, verbose_name='Categoria')),
            ],
            options={
                'verbose_name': 'Transação Financeira',
                'verbose_name_plural': 'Transações Financeiras',
                'ordering': ['-data_transacao'],
            },
        ),
    ]

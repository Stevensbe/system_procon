from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('atendimento', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BalcaoAtendimento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100, verbose_name='Nome do Balcão')),
                ('codigo', models.CharField(max_length=20, unique=True, verbose_name='Código')),
                ('descricao', models.TextField(blank=True, verbose_name='Descrição')),
                ('localizacao', models.CharField(blank=True, max_length=150, verbose_name='Localização')),
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('ordem_prioridade', models.PositiveIntegerField(default=1, verbose_name='Ordem de Prioridade')),
                ('capacidade_simultanea', models.PositiveIntegerField(default=1, verbose_name='Capacidade Simultânea')),
                ('ultima_chamada_em', models.DateTimeField(blank=True, null=True, verbose_name='Última chamada')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
            ],
            options={
                'verbose_name': 'Balcão de Atendimento',
                'verbose_name_plural': 'Balcões de Atendimento',
                'ordering': ['ordem_prioridade', 'nome'],
            },
        ),
        migrations.AddField(
            model_name='atendimento',
            name='classificacao_automatica',
            field=models.JSONField(blank=True, default=dict, verbose_name='Classificação Automática'),
        ),
        migrations.AddField(
            model_name='atendimento',
            name='consentimento_lgpd',
            field=models.BooleanField(default=False, verbose_name='Consentimento LGPD'),
        ),
        migrations.AddField(
            model_name='atendimento',
            name='gravidade',
            field=models.CharField(choices=[('BAIXA', 'Baixa'), ('MEDIA', 'Média'), ('ALTA', 'Alta')], default='MEDIA', max_length=10, verbose_name='Gravidade'),
        ),
        migrations.CreateModel(
            name='SenhaAtendimento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sequencia_diaria', models.PositiveIntegerField()),
                ('identificador', models.CharField(max_length=20, verbose_name='Identificador da senha')),
                ('prioridade', models.CharField(choices=[('NORMAL', 'Normal'), ('PRIORITARIA', 'Prioritária')], default='NORMAL', max_length=15, verbose_name='Prioridade')),
                ('status', models.CharField(choices=[('EM_ESPERA', 'Em espera'), ('CHAMADA', 'Chamada'), ('EM_ATENDIMENTO', 'Em atendimento'), ('FINALIZADA', 'Finalizada'), ('CANCELADA', 'Cancelada')], default='EM_ESPERA', max_length=15, verbose_name='Status')),
                ('emitido_em', models.DateTimeField(auto_now_add=True, verbose_name='Emitido em')),
                ('chamado_em', models.DateTimeField(blank=True, null=True, verbose_name='Chamado em')),
                ('iniciado_em', models.DateTimeField(blank=True, null=True, verbose_name='Iniciado em')),
                ('finalizado_em', models.DateTimeField(blank=True, null=True, verbose_name='Finalizado em')),
                ('cancelado_em', models.DateTimeField(blank=True, null=True, verbose_name='Cancelado em')),
                ('observacoes', models.TextField(blank=True, verbose_name='Observações')),
                ('atendente_responsavel', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='senhas_atendidas', to=settings.AUTH_USER_MODEL)),
                ('balcao', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='senhas', to='atendimento.balcaoatendimento')),
            ],
            options={
                'verbose_name': 'Senha de Atendimento',
                'verbose_name_plural': 'Senhas de Atendimento',
                'ordering': ['-emitido_em'],
                'unique_together': {('balcao', 'identificador')},
            },
        ),
        migrations.CreateModel(
            name='FilaAtendimento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data_referencia', models.DateField(default=django.utils.timezone.localdate, verbose_name='Data de Referência')),
                ('status', models.CharField(choices=[('ATIVA', 'Ativa'), ('ENCERRADA', 'Encerrada')], default='ATIVA', max_length=10, verbose_name='Status')),
                ('quantidade_emitidas', models.PositiveIntegerField(default=0, verbose_name='Senhas Emitidas')),
                ('quantidade_chamadas', models.PositiveIntegerField(default=0, verbose_name='Senhas Chamadas')),
                ('quantidade_finalizadas', models.PositiveIntegerField(default=0, verbose_name='Senhas Finalizadas')),
                ('ultima_senha_emitida', models.CharField(blank=True, max_length=20, verbose_name='Última Senha Emitida')),
                ('ultima_senha_chamada', models.CharField(blank=True, max_length=20, verbose_name='Última Senha Chamada')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('balcao', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='filas', to='atendimento.balcaoatendimento')),
            ],
            options={
                'verbose_name': 'Fila de Atendimento',
                'verbose_name_plural': 'Filas de Atendimento',
                'ordering': ['-criado_em'],
                'unique_together': {('balcao', 'data_referencia', 'status')},
            },
        ),
    ]

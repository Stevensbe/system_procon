# Generated manually - RegistroFinanceiro model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('multas', '0001_initial'),
        ('financeiro', '0002_configuracaofinanceira_alter_financeiro_options'),
    ]

    operations = [
        migrations.CreateModel(
            name='RegistroFinanceiro',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data_vencimento', models.DateField(help_text='Data limite para pagamento sem juros', verbose_name='Data de Vencimento')),
                ('data_pagamento', models.DateField(blank=True, help_text='Data em que o pagamento foi efetivado', null=True, verbose_name='Data de Pagamento')),
                ('status', models.CharField(choices=[('pendente', 'Pendente'), ('paga', 'Paga'), ('vencida', 'Vencida'), ('cancelada', 'Cancelada'), ('contestada', 'Contestada'), ('parcelada', 'Parcelada')], db_index=True, default='pendente', max_length=20, verbose_name='Status')),
                ('valor_original', models.DecimalField(decimal_places=2, help_text='Valor original da multa', max_digits=12, verbose_name='Valor Original')),
                ('valor_juros', models.DecimalField(decimal_places=2, default=0, help_text='Juros aplicados por atraso', max_digits=12, verbose_name='Valor de Juros')),
                ('valor_multa_atraso', models.DecimalField(decimal_places=2, default=0, help_text='Multa aplicada por atraso no pagamento', max_digits=12, verbose_name='Multa por Atraso')),
                ('valor_desconto', models.DecimalField(decimal_places=2, default=0, help_text='Desconto concedido (pagamento à vista, etc.)', max_digits=12, verbose_name='Valor de Desconto')),
                ('valor_pago', models.DecimalField(decimal_places=2, default=0, help_text='Valor que foi efetivamente pago', max_digits=12, verbose_name='Valor Efetivamente Pago')),
                ('tipo_pagamento', models.CharField(blank=True, choices=[('boleto', 'Boleto Bancário'), ('pix', 'PIX'), ('cartao', 'Cartão de Crédito/Débito'), ('transferencia', 'Transferência Bancária'), ('dinheiro', 'Dinheiro'), ('desconto_folha', 'Desconto em Folha')], max_length=20, null=True, verbose_name='Tipo de Pagamento')),
                ('numero_comprovante', models.CharField(blank=True, help_text='Número do boleto, código PIX, etc.', max_length=100, verbose_name='Número do Comprovante')),
                ('comprovante_pagamento', models.FileField(blank=True, help_text='Upload do comprovante de pagamento', null=True, upload_to='comprovantes_pagamento/%Y/%m/%d/', verbose_name='Comprovante de Pagamento')),
                ('observacoes', models.TextField(blank=True, help_text='Informações adicionais sobre o pagamento', verbose_name='Observações')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('criado_por', models.CharField(blank=True, help_text='Usuário que criou o registro', max_length=100, verbose_name='Criado por')),
                ('multa', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='registro_financeiro', to='multas.multa', verbose_name='Multa')),
            ],
            options={
                'verbose_name': 'Registro Financeiro de Multa',
                'verbose_name_plural': 'Registros Financeiros de Multas',
                'ordering': ['-criado_em'],
            },
        ),
        migrations.AddIndex(
            model_name='registrofinanceiro',
            index=models.Index(fields=['status'], name='financeiro_r_status_c8fd6c_idx'),
        ),
        migrations.AddIndex(
            model_name='registrofinanceiro',
            index=models.Index(fields=['data_vencimento'], name='financeiro_r_data_ve_0a66d8_idx'),
        ),
        migrations.AddIndex(
            model_name='registrofinanceiro',
            index=models.Index(fields=['data_pagamento'], name='financeiro_r_data_pa_8e7ec8_idx'),
        ),
    ]
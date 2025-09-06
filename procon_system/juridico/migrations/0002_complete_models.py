# Generated manually for complete juridico models

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('juridico', '0001_initial'),
    ]

    operations = [
        # AnalistaJuridico
        migrations.CreateModel(
            name='AnalistaJuridico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('oab', models.CharField(blank=True, max_length=20, verbose_name='Número OAB')),
                ('especialidade', models.CharField(blank=True, max_length=100, verbose_name='Especialidade')),
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('data_cadastro', models.DateTimeField(auto_now_add=True, verbose_name='Data de Cadastro')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='analista_juridico', to='auth.user')),
            ],
            options={
                'verbose_name': 'Analista Jurídico',
                'verbose_name_plural': 'Analistas Jurídicos',
            },
        ),
        
        # Atualizar ProcessoJuridico
        migrations.AddField(
            model_name='processojuridico',
            name='numero_peticao',
            field=models.CharField(blank=True, max_length=50, verbose_name='Número da Petição'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='empresa_cnpj',
            field=models.CharField(blank=True, max_length=18, verbose_name='CNPJ da Empresa'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='assunto',
            field=models.CharField(default='', max_length=200, verbose_name='Assunto'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='valor_causa',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True, verbose_name='Valor da Causa'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='status',
            field=models.CharField(choices=[('ABERTO', 'Aberto'), ('EM_ANALISE', 'Em Análise'), ('AGUARDANDO_DOCUMENTO', 'Aguardando Documento'), ('RESPONDIDO', 'Respondido'), ('ARQUIVADO', 'Arquivado'), ('CANCELADO', 'Cancelado')], default='ABERTO', max_length=20, verbose_name='Status'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='prioridade',
            field=models.CharField(choices=[('BAIXA', 'Baixa'), ('MEDIA', 'Média'), ('ALTA', 'Alta'), ('URGENTE', 'Urgente')], default='MEDIA', max_length=10, verbose_name='Prioridade'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='data_limite',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Data Limite'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='data_conclusao',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Data de Conclusão'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='analista',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='processos', to='juridico.analistajuridico'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='criado_por',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='processos_criados', to='auth.user'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='modificado_por',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='processos_modificados', to='auth.user'),
        ),
        migrations.AddField(
            model_name='processojuridico',
            name='data_modificacao',
            field=models.DateTimeField(auto_now=True, verbose_name='Data de Modificação'),
        ),
        migrations.AlterField(
            model_name='processojuridico',
            name='data_abertura',
            field=models.DateTimeField(auto_now_add=True, verbose_name='Data de Abertura'),
        ),
        
        # AnaliseJuridica
        migrations.CreateModel(
            name='AnaliseJuridica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_analise', models.CharField(choices=[('INICIAL', 'Análise Inicial'), ('DOCUMENTAL', 'Análise Documental'), ('LEGAL', 'Análise Legal'), ('FINAL', 'Análise Final')], max_length=20, verbose_name='Tipo de Análise')),
                ('fundamentacao', models.TextField(verbose_name='Fundamentação Jurídica')),
                ('conclusao', models.TextField(verbose_name='Conclusão')),
                ('recomendacoes', models.TextField(blank=True, verbose_name='Recomendações')),
                ('data_analise', models.DateTimeField(auto_now_add=True, verbose_name='Data da Análise')),
                ('data_modificacao', models.DateTimeField(auto_now=True, verbose_name='Data de Modificação')),
                ('analista', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='analises_realizadas', to='juridico.analistajuridico')),
                ('processo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='analises', to='juridico.processojuridico')),
            ],
            options={
                'verbose_name': 'Análise Jurídica',
                'verbose_name_plural': 'Análises Jurídicas',
                'ordering': ['-data_analise'],
            },
        ),
        
        # RespostaJuridica
        migrations.CreateModel(
            name='RespostaJuridica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_resposta', models.CharField(choices=[('DEFESA', 'Defesa'), ('RECURSO', 'Recurso'), ('PETICAO', 'Petição'), ('PARECER', 'Parecer'), ('OUTROS', 'Outros')], max_length=20, verbose_name='Tipo de Resposta')),
                ('titulo', models.CharField(max_length=200, verbose_name='Título')),
                ('conteudo', models.TextField(verbose_name='Conteúdo da Resposta')),
                ('fundamentacao_legal', models.TextField(verbose_name='Fundamentação Legal')),
                ('data_elaboracao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Elaboração')),
                ('data_envio', models.DateTimeField(blank=True, null=True, verbose_name='Data de Envio')),
                ('enviado', models.BooleanField(default=False, verbose_name='Enviado')),
                ('analista', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='respostas_elaboradas', to='juridico.analistajuridico')),
                ('processo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='respostas', to='juridico.processojuridico')),
            ],
            options={
                'verbose_name': 'Resposta Jurídica',
                'verbose_name_plural': 'Respostas Jurídicas',
                'ordering': ['-data_elaboracao'],
            },
        ),
        
        # PrazoJuridico
        migrations.CreateModel(
            name='PrazoJuridico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_prazo', models.CharField(choices=[('RESPOSTA', 'Prazo para Resposta'), ('RECURSO', 'Prazo para Recurso'), ('APRESENTACAO', 'Prazo para Apresentação'), ('OUTROS', 'Outros Prazos')], max_length=20, verbose_name='Tipo de Prazo')),
                ('descricao', models.CharField(max_length=200, verbose_name='Descrição')),
                ('data_inicio', models.DateTimeField(verbose_name='Data de Início')),
                ('data_fim', models.DateTimeField(verbose_name='Data de Fim')),
                ('status', models.CharField(choices=[('PENDENTE', 'Pendente'), ('CUMPRIDO', 'Cumprido'), ('VENCIDO', 'Vencido'), ('PRORROGADO', 'Prorrogado')], default='PENDENTE', max_length=15, verbose_name='Status')),
                ('observacoes', models.TextField(blank=True, verbose_name='Observações')),
                ('processo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prazos', to='juridico.processojuridico')),
            ],
            options={
                'verbose_name': 'Prazo Jurídico',
                'verbose_name_plural': 'Prazos Jurídicos',
                'ordering': ['data_fim'],
            },
        ),
        
        # DocumentoJuridico
        migrations.CreateModel(
            name='DocumentoJuridico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_documento', models.CharField(choices=[('PETICAO', 'Petição'), ('DEFESA', 'Defesa'), ('RECURSO', 'Recurso'), ('PARECER', 'Parecer'), ('DECISAO', 'Decisão'), ('PROVA', 'Prova'), ('OUTROS', 'Outros')], max_length=20, verbose_name='Tipo de Documento')),
                ('titulo', models.CharField(max_length=200, verbose_name='Título')),
                ('descricao', models.TextField(blank=True, verbose_name='Descrição')),
                ('arquivo', models.FileField(upload_to='juridico/documentos/', verbose_name='Arquivo')),
                ('nome_arquivo', models.CharField(max_length=255, verbose_name='Nome do Arquivo')),
                ('tamanho_arquivo', models.IntegerField(blank=True, null=True, verbose_name='Tamanho (bytes)')),
                ('data_upload', models.DateTimeField(auto_now_add=True, verbose_name='Data de Upload')),
                ('processo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documentos', to='juridico.processojuridico')),
                ('upload_por', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documentos_upload', to='auth.user')),
            ],
            options={
                'verbose_name': 'Documento Jurídico',
                'verbose_name_plural': 'Documentos Jurídicos',
                'ordering': ['-data_upload'],
            },
        ),
        
        # HistoricoJuridico
        migrations.CreateModel(
            name='HistoricoJuridico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('acao', models.CharField(max_length=100, verbose_name='Ação')),
                ('descricao', models.TextField(verbose_name='Descrição')),
                ('dados_anteriores', models.JSONField(blank=True, null=True, verbose_name='Dados Anteriores')),
                ('dados_novos', models.JSONField(blank=True, null=True, verbose_name='Dados Novos')),
                ('data_alteracao', models.DateTimeField(auto_now_add=True, verbose_name='Data da Alteração')),
                ('ip_origem', models.GenericIPAddressField(blank=True, null=True, verbose_name='IP de Origem')),
                ('processo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='historico', to='juridico.processojuridico')),
                ('usuario', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='alteracoes_juridicas', to='auth.user')),
            ],
            options={
                'verbose_name': 'Histórico Jurídico',
                'verbose_name_plural': 'Históricos Jurídicos',
                'ordering': ['-data_alteracao'],
            },
        ),
        
        # ConfiguracaoJuridico
        migrations.CreateModel(
            name='ConfiguracaoJuridico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prazo_resposta_padrao', models.IntegerField(default=15, verbose_name='Prazo Padrão para Resposta (dias)')),
                ('prazo_recurso_padrao', models.IntegerField(default=30, verbose_name='Prazo Padrão para Recurso (dias)')),
                ('notificar_prazos_vencendo', models.BooleanField(default=True, verbose_name='Notificar Prazos Vencendo')),
                ('dias_antecedencia_notificacao', models.IntegerField(default=3, verbose_name='Dias de Antecedência')),
                ('permitir_upload_documentos', models.BooleanField(default=True, verbose_name='Permitir Upload de Documentos')),
                ('tamanho_maximo_arquivo', models.IntegerField(default=10, verbose_name='Tamanho Máximo (MB)')),
                ('tipos_arquivo_permitidos', models.CharField(default='pdf,doc,docx', max_length=200, verbose_name='Tipos Permitidos')),
                ('data_configuracao', models.DateTimeField(auto_now_add=True, verbose_name='Data de Configuração')),
                ('configurado_por', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='configuracoes_juridicas', to='auth.user')),
            ],
            options={
                'verbose_name': 'Configuração Jurídica',
                'verbose_name_plural': 'Configurações Jurídicas',
            },
        ),
    ]

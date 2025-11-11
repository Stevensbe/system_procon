from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal_cidadao", "0005_reclamacaodenuncia_distribuidor_responsavel"),
        ("fiscalizacao", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="reclamacaodenuncia",
            name="ata_conciliacao",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="reclamacoes/atas/",
                verbose_name="Ata da Conciliação",
            ),
        ),
        migrations.AddField(
            model_name="reclamacaodenuncia",
            name="decisao_documento",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="reclamacoes/decisoes/",
                verbose_name="Documento de Decisão",
            ),
        ),
        migrations.AddField(
            model_name="reclamacaodenuncia",
            name="auto_infracao_relacionado",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="reclamacoes_origem",
                to="fiscalizacao.autoinfracao",
                verbose_name="Auto de infração vinculado",
            ),
        ),
    ]

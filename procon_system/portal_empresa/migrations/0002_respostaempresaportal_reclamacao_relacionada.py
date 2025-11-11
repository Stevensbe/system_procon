from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portal_cidadao", "0004_anexoreclamacao_armazenamento_origem_and_more"),
        ("portal_empresa", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="respostaempresaportal",
            name="reclamacao_relacionada",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="respostas_portal",
                to="portal_cidadao.reclamacaodenuncia",
            ),
        ),
    ]

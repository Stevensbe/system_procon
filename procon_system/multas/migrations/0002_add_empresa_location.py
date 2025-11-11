from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('multas', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='empresa',
            name='cidade',
            field=models.CharField(blank=True, max_length=100, verbose_name='Cidade'),
        ),
        migrations.AddField(
            model_name='empresa',
            name='estado',
            field=models.CharField(blank=True, max_length=2, verbose_name='Estado'),
        ),
    ]

from django.db import models

class Lei(models.Model):
    numero       = models.CharField("Número da Lei", max_length=50, unique=True)
    titulo       = models.CharField("Título", max_length=255)
    publicada_em = models.DateField("Data de Publicação")
    link         = models.URLField("Link", blank=True)
    observacoes  = models.TextField("Observações", blank=True)

    class Meta:
        ordering = ['-publicada_em','numero']
        verbose_name = "Lei"
        verbose_name_plural = "Leis"

    def __str__(self):
        return f"{self.numero} — {self.titulo}"

class Artigo(models.Model):
    lei           = models.ForeignKey(Lei, on_delete=models.CASCADE, related_name='artigos')
    numero_artigo = models.CharField("Artigo", max_length=20)
    texto         = models.TextField("Texto do Artigo")

    class Meta:
        unique_together = ('lei','numero_artigo')
        ordering = ['lei','numero_artigo']
        verbose_name = "Artigo"
        verbose_name_plural = "Artigos"

    def __str__(self):
        return f"Art. {self.numero_artigo} — {self.lei.numero}"

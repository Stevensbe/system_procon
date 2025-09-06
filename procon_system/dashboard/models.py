from django.db import models

# Create your models here.

class Dashboard(models.Model):
    titulo = models.CharField("Título", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)

    def __str__(self):
        return self.titulo

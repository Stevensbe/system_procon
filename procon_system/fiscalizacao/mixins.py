"""
Mixins para modelos de fiscalização - System Procon
"""
from django.db import models


class AutoNumeracaoMixin(models.Model):
    """
    Mixin que fornece numeração automática para todos os tipos de Auto de Constatação.
    
    Centraliza a lógica de geração de números sequenciais, evitando duplicação
    de código nos models AutoBanco, AutoPosto, AutoSupermercado, etc.
    """
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        """
        Override do save para gerar número automático se não existir.
        
        Usa a sequência ÚNICA compartilhada entre todos os tipos de auto.
        """
        if not self.numero:
            from .utils import gerar_proximo_numero_auto
            self.numero = gerar_proximo_numero_auto()
        super().save(*args, **kwargs)


class BaseAutoMeta:
    """
    Classe utilitária que fornece configurações padrão de Meta para os models de Auto.
    
    Padroniza ordenação e configurações comuns.
    """
    abstract = True
    ordering = ['-data_fiscalizacao', '-id']
    
    @classmethod
    def get_meta_dict(cls, verbose_name, verbose_name_plural):
        """
        Retorna um dicionário com configurações padrão para Meta.
        
        Args:
            verbose_name (str): Nome singular do modelo
            verbose_name_plural (str): Nome plural do modelo
            
        Returns:
            dict: Configurações para usar na classe Meta
        """
        return {
            'verbose_name': verbose_name,
            'verbose_name_plural': verbose_name_plural,
            'ordering': cls.ordering,
        }


class TimestampMixin(models.Model):
    """
    Mixin que adiciona campos de timestamp automáticos.
    
    Útil para modelos que precisam de auditoria de criação/atualização.
    """
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        abstract = True

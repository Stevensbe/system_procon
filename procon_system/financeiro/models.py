from django.db import models
from django.utils import timezone
from datetime import timedelta
from multas.models import Multa


class Financeiro(models.Model):
    """
    Modelo para registro de entradas e saídas financeiras (LEGACY)
    """
    descricao = models.CharField("Descrição", max_length=200)
    valor = models.DecimalField("Valor", max_digits=10, decimal_places=2)
    data = models.DateField("Data", auto_now_add=True)
    tipo = models.CharField("Tipo", max_length=20, choices=[('entrada', 'Entrada'), ('saida', 'Saída')])

    def __str__(self):
        return f"{self.descricao} - {self.valor} ({self.tipo})"

    class Meta:
        verbose_name = "Registro Financeiro (Legacy)"
        verbose_name_plural = "Registros Financeiros (Legacy)"
        ordering = ['-data']


class RegistroFinanceiro(models.Model):
    """
    Modelo dedicado para controle financeiro de multas
    Integra perfeitamente com o frontend React
    """
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('paga', 'Paga'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
        ('contestada', 'Contestada'),
        ('parcelada', 'Parcelada'),
    ]

    TIPO_PAGAMENTO_CHOICES = [
        ('boleto', 'Boleto Bancário'),
        ('pix', 'PIX'),
        ('cartao', 'Cartão de Crédito/Débito'),
        ('transferencia', 'Transferência Bancária'),
        ('dinheiro', 'Dinheiro'),
        ('desconto_folha', 'Desconto em Folha'),
    ]

    # Relacionamento com a multa
    multa = models.OneToOneField(
        Multa,
        on_delete=models.CASCADE,
        related_name='registro_financeiro',
        verbose_name="Multa"
    )

    # Dados de vencimento e pagamento
    data_vencimento = models.DateField(
        "Data de Vencimento",
        help_text="Data limite para pagamento sem juros"
    )
    data_pagamento = models.DateField(
        "Data de Pagamento",
        blank=True,
        null=True,
        help_text="Data em que o pagamento foi efetivado"
    )

    # Status e controle
    status = models.CharField(
        "Status",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pendente',
        db_index=True
    )

    # Valores financeiros
    valor_original = models.DecimalField(
        "Valor Original",
        max_digits=12,
        decimal_places=2,
        help_text="Valor original da multa"
    )
    valor_juros = models.DecimalField(
        "Valor de Juros",
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Juros aplicados por atraso"
    )
    valor_multa_atraso = models.DecimalField(
        "Multa por Atraso",
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Multa aplicada por atraso no pagamento"
    )
    valor_desconto = models.DecimalField(
        "Valor de Desconto",
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Desconto concedido (pagamento à vista, etc.)"
    )
    valor_pago = models.DecimalField(
        "Valor Efetivamente Pago",
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Valor que foi efetivamente pago"
    )

    # Dados do pagamento
    tipo_pagamento = models.CharField(
        "Tipo de Pagamento",
        max_length=20,
        choices=TIPO_PAGAMENTO_CHOICES,
        blank=True,
        null=True
    )
    numero_comprovante = models.CharField(
        "Número do Comprovante",
        max_length=100,
        blank=True,
        help_text="Número do boleto, código PIX, etc."
    )
    comprovante_pagamento = models.FileField(
        "Comprovante de Pagamento",
        upload_to='comprovantes_pagamento/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text="Upload do comprovante de pagamento"
    )

    # Observações e controle
    observacoes = models.TextField(
        "Observações",
        blank=True,
        help_text="Informações adicionais sobre o pagamento"
    )
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    criado_por = models.CharField(
        "Criado por",
        max_length=100,
        blank=True,
        help_text="Usuário que criou o registro"
    )

    def __str__(self):
        return f"Registro Financeiro - Multa #{self.multa.id} - {self.get_status_display()}"

    class Meta:
        verbose_name = "Registro Financeiro de Multa"
        verbose_name_plural = "Registros Financeiros de Multas"
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['data_vencimento']),
            models.Index(fields=['data_pagamento']),
        ]

    @property
    def valor_total_com_encargos(self):
        """Calcula o valor total incluindo juros e multa por atraso"""
        return self.valor_original + self.valor_juros + self.valor_multa_atraso - self.valor_desconto

    @property
    def dias_em_atraso(self):
        """Calcula quantos dias a multa está em atraso"""
        if self.status == 'paga' or not self.data_vencimento:
            return 0
        
        hoje = timezone.now().date()
        if hoje > self.data_vencimento:
            return (hoje - self.data_vencimento).days
        return 0

    @property
    def esta_vencida(self):
        """Verifica se a multa está vencida"""
        return self.dias_em_atraso > 0 and self.status != 'paga'

    def calcular_juros_automatico(self):
        """Calcula juros e multa automaticamente baseado nos dias de atraso"""
        if self.status == 'paga' or self.dias_em_atraso <= 0:
            return

        # Juros de 1% ao mês (0.033% ao dia)
        taxa_juros_diaria = 0.0003333
        juros = self.valor_original * taxa_juros_diaria * self.dias_em_atraso

        # Multa de 2% após 30 dias de atraso
        multa_atraso = 0
        if self.dias_em_atraso > 30:
            multa_atraso = self.valor_original * 0.02

        self.valor_juros = juros
        self.valor_multa_atraso = multa_atraso

    def marcar_como_paga(self, valor_pago, data_pagamento=None, tipo_pagamento=None, numero_comprovante=None, observacoes=None):
        """Marca o registro como pago e atualiza os dados"""
        self.status = 'paga'
        self.valor_pago = valor_pago
        self.data_pagamento = data_pagamento or timezone.now().date()
        
        if tipo_pagamento:
            self.tipo_pagamento = tipo_pagamento
        if numero_comprovante:
            self.numero_comprovante = numero_comprovante
        if observacoes:
            self.observacoes = observacoes
            
        # Atualizar também o campo pago na multa original para compatibilidade
        self.multa.pago = True
        self.multa.save()
        
        self.save()

    def save(self, *args, **kwargs):
        # Definir valor original baseado na multa se não foi definido
        if not self.valor_original and self.multa:
            self.valor_original = self.multa.valor
            
        # Calcular data de vencimento automática se não foi definida (30 dias após emissão)
        if not self.data_vencimento and self.multa:
            self.data_vencimento = self.multa.data_emissao + timedelta(days=30)
            
        # Atualizar status baseado na data de vencimento
        if self.status == 'pendente' and self.esta_vencida:
            self.status = 'vencida'
            
        # Calcular juros automaticamente se está em atraso
        if self.status in ['vencida'] and self.dias_em_atraso > 0:
            self.calcular_juros_automatico()
            
        super().save(*args, **kwargs)


class ConfiguracaoFinanceira(models.Model):
    """
    Configurações para o dashboard financeiro
    """
    nome = models.CharField("Nome da Configuração", max_length=100)
    valor = models.CharField("Valor", max_length=255)
    descricao = models.TextField("Descrição", blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Configuração Financeira"
        verbose_name_plural = "Configurações Financeiras"

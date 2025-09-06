from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from datetime import timedelta
import uuid
from decimal import Decimal


class ConfiguracaoCobranca(models.Model):
    """Configurações gerais do sistema de cobrança"""
    
    # Prazos padrão
    prazo_vencimento_boleto = models.IntegerField("Prazo Vencimento Boleto (dias)", default=30)
    prazo_primeira_cobranca = models.IntegerField("Primeira Cobrança (dias)", default=15)
    prazo_segunda_cobranca = models.IntegerField("Segunda Cobrança (dias)", default=30)
    prazo_terceira_cobranca = models.IntegerField("Terceira Cobrança (dias)", default=45)
    
    # Juros e multas
    taxa_juros_mensal = models.DecimalField("Taxa de Juros Mensal (%)", max_digits=5, decimal_places=2, default=1.0)
    taxa_multa_atraso = models.DecimalField("Multa por Atraso (%)", max_digits=5, decimal_places=2, default=2.0)
    
    # Dados do beneficiário
    beneficiario_nome = models.CharField("Nome do Beneficiário", max_length=255, default="PROCON")
    beneficiario_cnpj = models.CharField("CNPJ do Beneficiário", max_length=18)
    beneficiario_endereco = models.TextField("Endereço do Beneficiário")
    
    # Banco
    banco_codigo = models.CharField("Código do Banco", max_length=3, default="001")
    banco_nome = models.CharField("Nome do Banco", max_length=100, default="Banco do Brasil")
    agencia = models.CharField("Agência", max_length=10)
    conta = models.CharField("Conta", max_length=15)
    carteira = models.CharField("Carteira", max_length=10, default="18")
    
    # Configurações de envio
    enviar_boleto_email = models.BooleanField("Enviar Boleto por E-mail", default=True)
    enviar_cobranca_sms = models.BooleanField("Enviar Cobrança por SMS", default=False)
    
    # Controle
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Configuração de Cobrança"
        verbose_name_plural = "Configurações de Cobrança"
    
    def __str__(self):
        return f"Configuração de Cobrança - {self.beneficiario_nome}"


class BoletoMulta(models.Model):
    """Boletos gerados para cobrança de multas"""
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('enviado', 'Enviado'),
        ('pago', 'Pago'),
        ('vencido', 'Vencido'),
        ('cancelado', 'Cancelado'),
        ('protestado', 'Protestado'),
    ]
    
    FORMA_PAGAMENTO_CHOICES = [
        ('boleto', 'Boleto Bancário'),
        ('pix', 'PIX'),
        ('cartao', 'Cartão'),
        ('dinheiro', 'Dinheiro'),
        ('transferencia', 'Transferência'),
    ]
    
    # Identificação
    uuid = models.UUIDField("UUID", default=uuid.uuid4, editable=False, unique=True)
    numero_boleto = models.CharField("Número do Boleto", max_length=20, unique=True, blank=True)
    nosso_numero = models.CharField("Nosso Número", max_length=20, blank=True)
    
    # Relação com multa
    multa = models.ForeignKey('multas.Multa', on_delete=models.CASCADE, related_name='boletos', verbose_name="Multa")
    
    # Banco
    banco = models.ForeignKey('Banco', on_delete=models.PROTECT, verbose_name="Banco", null=True, blank=True)
    
    # Dados do pagador
    pagador_nome = models.CharField("Nome do Pagador", max_length=255)
    pagador_documento = models.CharField("CPF/CNPJ", max_length=18)
    pagador_endereco = models.TextField("Endereço")
    pagador_email = models.EmailField("E-mail", blank=True)
    pagador_telefone = models.CharField("Telefone", max_length=20, blank=True)
    
    # Valores
    valor_principal = models.DecimalField("Valor Principal", max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    valor_juros = models.DecimalField("Valor Juros", max_digits=12, decimal_places=2, default=0)
    valor_multa = models.DecimalField("Valor Multa", max_digits=12, decimal_places=2, default=0)
    valor_desconto = models.DecimalField("Valor Desconto", max_digits=12, decimal_places=2, default=0)
    valor_total = models.DecimalField("Valor Total", max_digits=12, decimal_places=2)
    
    # Datas
    data_emissao = models.DateField("Data de Emissão", auto_now_add=True)
    data_vencimento = models.DateField("Data de Vencimento")
    data_pagamento = models.DateTimeField("Data de Pagamento", null=True, blank=True)
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    
    # Status e controle
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='pendente')
    forma_pagamento = models.CharField("Forma de Pagamento", max_length=15, choices=FORMA_PAGAMENTO_CHOICES, blank=True)
    
    # Dados bancários
    codigo_barras = models.CharField("Código de Barras", max_length=54, blank=True)
    linha_digitavel = models.CharField("Linha Digitável", max_length=54, blank=True)
    
    # Instruções
    instrucoes = models.TextField("Instruções", blank=True)
    observacoes = models.TextField("Observações", blank=True)
    
    # PIX
    pix_codigo = models.TextField("Código PIX", blank=True)
    pix_qr_code = models.ImageField("QR Code PIX", upload_to='cobranca/pix/%Y/%m/', blank=True)
    
    # Controle
    tentativas_envio = models.IntegerField("Tentativas de Envio", default=0)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    criado_por = models.CharField("Criado por", max_length=100, blank=True)
    
    class Meta:
        verbose_name = "Boleto de Multa"
        verbose_name_plural = "Boletos de Multas"
        ordering = ['-data_emissao']
        indexes = [
            models.Index(fields=['numero_boleto']),
            models.Index(fields=['multa']),
            models.Index(fields=['status']),
            models.Index(fields=['data_vencimento']),
            models.Index(fields=['pagador_documento']),
        ]
    
    def __str__(self):
        return f"Boleto {self.numero_boleto} - {self.pagador_nome}"
    
    def save(self, *args, **kwargs):
        if not self.numero_boleto:
            self.numero_boleto = self.gerar_numero_boleto()
        if not self.nosso_numero:
            self.nosso_numero = self.gerar_nosso_numero()
        if not self.valor_total:
            self.calcular_valor_total()
        super().save(*args, **kwargs)
    
    def gerar_numero_boleto(self):
        """Gera número único do boleto"""
        from datetime import datetime
        agora = datetime.now()
        sequencial = BoletoMulta.objects.count() + 1
        return f"{agora.strftime('%Y%m%d')}{sequencial:06d}"
    
    def gerar_nosso_numero(self):
        """Gera nosso número para o banco"""
        sequencial = BoletoMulta.objects.count() + 1
        return f"{sequencial:010d}"
    
    def calcular_valor_total(self):
        """Calcula o valor total do boleto"""
        self.valor_total = self.valor_principal + self.valor_juros + self.valor_multa - self.valor_desconto
    
    def calcular_juros_multa(self, data_calculo=None):
        """Calcula juros e multa com base na data"""
        if not data_calculo:
            data_calculo = timezone.now().date()
        
        if data_calculo <= self.data_vencimento:
            return Decimal('0.00'), Decimal('0.00')
        
        config = ConfiguracaoCobranca.objects.filter(ativo=True).first()
        if not config:
            return Decimal('0.00'), Decimal('0.00')
        
        # Calcula dias de atraso
        dias_atraso = (data_calculo - self.data_vencimento).days
        
        # Multa por atraso (apenas uma vez)
        valor_multa = self.valor_principal * (config.taxa_multa_atraso / 100)
        
        # Juros (por mês ou fração)
        meses_atraso = dias_atraso / 30
        valor_juros = self.valor_principal * (config.taxa_juros_mensal / 100) * meses_atraso
        
        return valor_juros, valor_multa
    
    def atualizar_valores_vencimento(self):
        """Atualiza valores quando o boleto está vencido"""
        if self.status == 'vencido':
            juros, multa = self.calcular_juros_multa()
            self.valor_juros = juros
            self.valor_multa = multa
            self.calcular_valor_total()
            self.save()
    
    @property
    def esta_vencido(self):
        """Verifica se o boleto está vencido"""
        return timezone.now().date() > self.data_vencimento
    
    @property
    def dias_vencimento(self):
        """Calcula dias até/após vencimento"""
        hoje = timezone.now().date()
        delta = self.data_vencimento - hoje
        return delta.days
    
    def gerar_codigo_barras(self):
        """Gera código de barras do boleto"""
        # Implementação simplificada - em produção usar biblioteca específica
        banco = "001"  # Banco do Brasil
        moeda = "9"    # Real
        dv = "1"       # Dígito verificador (calculado)
        vencimento = f"{(self.data_vencimento - timezone.now().date()).days + 1000:04d}"
        valor = f"{int(self.valor_total * 100):010d}"
        
        # Campos específicos do banco
        agencia = "1234"
        conta = "12345678"
        carteira = "18"
        nosso_numero = f"{self.nosso_numero:010d}"
        
        codigo = f"{banco}{moeda}{dv}{vencimento}{valor}{agencia}{conta}{carteira}{nosso_numero}"
        self.codigo_barras = codigo
        self.linha_digitavel = self.gerar_linha_digitavel(codigo)
        self.save()
    
    def gerar_linha_digitavel(self, codigo_barras):
        """Gera linha digitável a partir do código de barras"""
        # Implementação simplificada
        return f"{codigo_barras[:5]}.{codigo_barras[5:10]} {codigo_barras[10:15]}.{codigo_barras[15:21]} {codigo_barras[21:26]}.{codigo_barras[26:32]} {codigo_barras[32]} {codigo_barras[33:]}"
    
    def gerar_pix(self):
        """Gera código PIX para pagamento"""
        # Implementação simplificada - em produção integrar com PSP
        import qrcode
        from io import BytesIO
        from django.core.files import File
        
        # Dados para PIX
        chave_pix = "12345678000199"  # Chave PIX do PROCON
        valor = str(self.valor_total)
        
        # Código PIX simplificado
        self.pix_codigo = f"PIX{chave_pix}{valor}{self.numero_boleto}"
        
        # Gera QR Code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(self.pix_codigo)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, 'PNG')
        buffer.seek(0)
        
        self.pix_qr_code.save(
            f'pix_{self.numero_boleto}.png',
            File(buffer),
            save=False
        )
        self.save()
    
    def registrar_pagamento(self, valor_pago, forma_pagamento, comprovante=None, observacoes=""):
        """Registra pagamento do boleto"""
        pagamento = PagamentoMulta.objects.create(
            boleto=self,
            valor_pago=valor_pago,
            forma_pagamento=forma_pagamento,
            data_pagamento=timezone.now(),
            comprovante=comprovante,
            observacoes=observacoes,
            criado_por="Sistema"
        )
        
        self.status = 'pago'
        self.data_pagamento = timezone.now()
        self.forma_pagamento = forma_pagamento
        self.save()
        
        # Atualiza status da multa
        self.multa.status = 'paga'
        self.multa.data_pagamento = timezone.now()
        self.multa.save()
        
        return pagamento
    
    def cancelar_boleto(self, motivo=""):
        """Cancela o boleto"""
        self.status = 'cancelado'
        self.observacoes = f"{self.observacoes}\nCancelado: {motivo}".strip()
        self.save()


class PagamentoMulta(models.Model):
    """Registro de pagamentos de multas"""
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente Confirmação'),
        ('confirmado', 'Confirmado'),
        ('rejeitado', 'Rejeitado'),
        ('estornado', 'Estornado'),
    ]
    
    # Identificação
    uuid = models.UUIDField("UUID", default=uuid.uuid4, editable=False, unique=True)
    numero_pagamento = models.CharField("Número do Pagamento", max_length=20, unique=True, blank=True)
    
    # Relações
    boleto = models.ForeignKey(BoletoMulta, on_delete=models.CASCADE, related_name='pagamentos', verbose_name="Boleto")
    
    # Dados do pagamento
    valor_pago = models.DecimalField("Valor Pago", max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    forma_pagamento = models.CharField("Forma de Pagamento", max_length=15, choices=BoletoMulta.FORMA_PAGAMENTO_CHOICES)
    data_pagamento = models.DateTimeField("Data do Pagamento")
    
    # Comprovante
    comprovante = models.FileField("Comprovante", upload_to='cobranca/comprovantes/%Y/%m/', blank=True)
    numero_transacao = models.CharField("Número da Transação", max_length=100, blank=True)
    
    # Status e validação
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='pendente')
    data_confirmacao = models.DateTimeField("Data de Confirmação", null=True, blank=True)
    confirmado_por = models.CharField("Confirmado por", max_length=100, blank=True)
    
    # Observações
    observacoes = models.TextField("Observações", blank=True)
    motivo_rejeicao = models.TextField("Motivo da Rejeição", blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    criado_por = models.CharField("Criado por", max_length=100, blank=True)
    
    class Meta:
        verbose_name = "Pagamento de Multa"
        verbose_name_plural = "Pagamentos de Multas"
        ordering = ['-data_pagamento']
        indexes = [
            models.Index(fields=['numero_pagamento']),
            models.Index(fields=['boleto']),
            models.Index(fields=['status']),
            models.Index(fields=['data_pagamento']),
        ]
    
    def __str__(self):
        return f"Pagamento {self.numero_pagamento} - R$ {self.valor_pago}"
    
    def save(self, *args, **kwargs):
        if not self.numero_pagamento:
            self.numero_pagamento = self.gerar_numero_pagamento()
        super().save(*args, **kwargs)
    
    def gerar_numero_pagamento(self):
        """Gera número único do pagamento"""
        from datetime import datetime
        agora = datetime.now()
        sequencial = PagamentoMulta.objects.count() + 1
        return f"PAG{agora.strftime('%Y%m%d')}{sequencial:06d}"
    
    def confirmar_pagamento(self, confirmado_por=""):
        """Confirma o pagamento"""
        self.status = 'confirmado'
        self.data_confirmacao = timezone.now()
        self.confirmado_por = confirmado_por
        self.save()
        
        # Atualiza boleto se valor total foi pago
        if self.valor_pago >= self.boleto.valor_total:
            self.boleto.status = 'pago'
            self.boleto.data_pagamento = self.data_pagamento
            self.boleto.save()
    
    def rejeitar_pagamento(self, motivo=""):
        """Rejeita o pagamento"""
        self.status = 'rejeitado'
        self.motivo_rejeicao = motivo
        self.save()
    
    def estornar_pagamento(self, motivo=""):
        """Estorna o pagamento"""
        self.status = 'estornado'
        self.observacoes = f"{self.observacoes}\nEstornado: {motivo}".strip()
        self.save()
        
        # Volta status do boleto
        self.boleto.status = 'vencido' if self.boleto.esta_vencido else 'pendente'
        self.boleto.data_pagamento = None
        self.boleto.save()


class CobrancaMulta(models.Model):
    """Histórico de cobranças enviadas"""
    
    TIPO_COBRANCA_CHOICES = [
        ('primeira', 'Primeira Cobrança'),
        ('segunda', 'Segunda Cobrança'),
        ('terceira', 'Terceira Cobrança'),
        ('final', 'Cobrança Final'),
        ('protesto', 'Aviso de Protesto'),
    ]
    
    CANAL_CHOICES = [
        ('email', 'E-mail'),
        ('sms', 'SMS'),
        ('correios', 'Correios'),
        ('whatsapp', 'WhatsApp'),
        ('oficial', 'Oficial de Justiça'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('enviada', 'Enviada'),
        ('entregue', 'Entregue'),
        ('falhada', 'Falhada'),
    ]
    
    # Relações
    boleto = models.ForeignKey(BoletoMulta, on_delete=models.CASCADE, related_name='cobrancas', verbose_name="Boleto")
    
    # Tipo e canal
    tipo_cobranca = models.CharField("Tipo de Cobrança", max_length=15, choices=TIPO_COBRANCA_CHOICES)
    canal = models.CharField("Canal", max_length=15, choices=CANAL_CHOICES)
    
    # Datas
    data_agendamento = models.DateTimeField("Data de Agendamento")
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    data_entrega = models.DateTimeField("Data de Entrega", null=True, blank=True)
    
    # Conteúdo
    assunto = models.CharField("Assunto", max_length=255)
    mensagem = models.TextField("Mensagem")
    
    # Status
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='pendente')
    tentativas = models.IntegerField("Tentativas", default=0)
    max_tentativas = models.IntegerField("Máximo Tentativas", default=3)
    
    # Logs
    log_envio = models.TextField("Log de Envio", blank=True)
    erro_envio = models.TextField("Erro de Envio", blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    criado_por = models.CharField("Criado por", max_length=100, blank=True)
    
    class Meta:
        verbose_name = "Cobrança de Multa"
        verbose_name_plural = "Cobranças de Multas"
        ordering = ['-data_agendamento']
        indexes = [
            models.Index(fields=['boleto']),
            models.Index(fields=['tipo_cobranca']),
            models.Index(fields=['status']),
            models.Index(fields=['data_agendamento']),
        ]
    
    def __str__(self):
        return f"{self.get_tipo_cobranca_display()} - {self.boleto.numero_boleto}"
    
    def enviar_cobranca(self):
        """Envia a cobrança pelo canal especificado"""
        if self.tentativas >= self.max_tentativas:
            self.status = 'falhada'
            self.erro_envio = "Máximo de tentativas excedido"
            self.save()
            return False
        
        self.tentativas += 1
        
        try:
            if self.canal == 'email':
                return self._enviar_email()
            elif self.canal == 'sms':
                return self._enviar_sms()
            elif self.canal == 'whatsapp':
                return self._enviar_whatsapp()
            elif self.canal == 'correios':
                return self._registrar_correios()
            else:
                raise ValueError(f"Canal não implementado: {self.canal}")
        
        except Exception as e:
            self.erro_envio = str(e)
            if self.tentativas >= self.max_tentativas:
                self.status = 'falhada'
            self.save()
            return False
    
    def _enviar_email(self):
        """Envia cobrança por e-mail"""
        from django.core.mail import send_mail
        from django.conf import settings
        
        send_mail(
            subject=self.assunto,
            message=self.mensagem,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.boleto.pagador_email],
            fail_silently=False,
        )
        
        self.status = 'enviada'
        self.data_envio = timezone.now()
        self.log_envio = f"E-mail enviado para {self.boleto.pagador_email}"
        self.save()
        return True
    
    def _enviar_sms(self):
        """Envia cobrança por SMS"""
        # Implementar integração com provedor de SMS
        self.status = 'enviada'
        self.data_envio = timezone.now()
        self.log_envio = f"SMS enviado para {self.boleto.pagador_telefone}"
        self.save()
        return True
    
    def _enviar_whatsapp(self):
        """Envia cobrança por WhatsApp"""
        # Implementar integração com WhatsApp Business API
        self.status = 'enviada'
        self.data_envio = timezone.now()
        self.log_envio = f"WhatsApp enviado para {self.boleto.pagador_telefone}"
        self.save()
        return True
    
    def _registrar_correios(self):
        """Registra envio pelos correios"""
        self.status = 'enviada'
        self.data_envio = timezone.now()
        self.log_envio = "Registrado para envio pelos correios"
        self.save()
        return True


class TemplateCobranca(models.Model):
    """Templates para cobranças"""
    
    nome = models.CharField("Nome", max_length=100, unique=True)
    tipo_cobranca = models.CharField("Tipo de Cobrança", max_length=15, choices=CobrancaMulta.TIPO_COBRANCA_CHOICES)
    canal = models.CharField("Canal", max_length=15, choices=CobrancaMulta.CANAL_CHOICES)
    
    # Templates
    assunto_template = models.CharField("Template do Assunto", max_length=255)
    mensagem_template = models.TextField("Template da Mensagem")
    
    # Configuração
    ativo = models.BooleanField("Ativo", default=True)
    padrao = models.BooleanField("Padrão", default=False)
    
    # Variáveis disponíveis
    variaveis_disponiveis = models.TextField(
        "Variáveis Disponíveis",
        default="{{nome}}, {{valor}}, {{vencimento}}, {{numero_boleto}}, {{dias_atraso}}",
        help_text="Lista das variáveis que podem ser usadas"
    )
    
    class Meta:
        verbose_name = "Template de Cobrança"
        verbose_name_plural = "Templates de Cobrança"
        ordering = ['tipo_cobranca', 'nome']
        unique_together = ['tipo_cobranca', 'canal', 'padrao']
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_cobranca_display()} - {self.get_canal_display()})"
    
    def renderizar(self, contexto=None):
        """Renderiza o template com o contexto fornecido"""
        if not contexto:
            contexto = {}
        
        assunto = self.assunto_template
        mensagem = self.mensagem_template
        
        # Substituição de variáveis
        for chave, valor in contexto.items():
            placeholder = f"{{{{{chave}}}}}"
            assunto = assunto.replace(placeholder, str(valor))
            mensagem = mensagem.replace(placeholder, str(valor))
        
        return assunto, mensagem


class LogCobranca(models.Model):
    """Log de atividades do sistema de cobrança"""
    
    ACAO_CHOICES = [
        ('boleto_gerado', 'Boleto Gerado'),
        ('boleto_enviado', 'Boleto Enviado'),
        ('cobranca_enviada', 'Cobrança Enviada'),
        ('pagamento_registrado', 'Pagamento Registrado'),
        ('pagamento_confirmado', 'Pagamento Confirmado'),
        ('boleto_cancelado', 'Boleto Cancelado'),
        ('erro_envio', 'Erro no Envio'),
    ]
    
    # Relação genérica
    boleto = models.ForeignKey(BoletoMulta, on_delete=models.CASCADE, related_name='logs', null=True, blank=True)
    cobranca = models.ForeignKey(CobrancaMulta, on_delete=models.CASCADE, related_name='logs', null=True, blank=True)
    pagamento = models.ForeignKey(PagamentoMulta, on_delete=models.CASCADE, related_name='logs', null=True, blank=True)
    
    # Log
    acao = models.CharField("Ação", max_length=25, choices=ACAO_CHOICES)
    descricao = models.TextField("Descrição")
    dados_extras = models.JSONField("Dados Extras", default=dict, blank=True)
    
    # Controle
    timestamp = models.DateTimeField("Timestamp", auto_now_add=True)
    usuario = models.CharField("Usuário", max_length=100, blank=True)
    ip_address = models.GenericIPAddressField("IP Address", null=True, blank=True)
    
    class Meta:
        verbose_name = "Log de Cobrança"
        verbose_name_plural = "Logs de Cobrança"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['boleto', 'timestamp']),
            models.Index(fields=['acao', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_acao_display()} - {self.timestamp.strftime('%d/%m/%Y %H:%M')}"


class Remessa(models.Model):
    """Arquivos de remessa bancária (CNAB)"""
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('gerado', 'Gerado'),
        ('enviado', 'Enviado ao Banco'),
        ('processado', 'Processado'),
        ('erro', 'Erro'),
        ('cancelado', 'Cancelado'),
    ]
    
    TIPO_CHOICES = [
        ('remessa', 'Remessa'),
        ('retorno', 'Retorno'),
    ]
    
    # Identificação
    numero = models.CharField("Número da Remessa", max_length=20, unique=True)
    tipo = models.CharField("Tipo", max_length=10, choices=TIPO_CHOICES, default='remessa')
    
    # Banco
    banco = models.ForeignKey('Banco', on_delete=models.PROTECT, verbose_name="Banco")
    
    # Dados da remessa
    quantidade_boletos = models.IntegerField("Quantidade de Boletos", default=0)
    valor_total = models.DecimalField("Valor Total", max_digits=15, decimal_places=2, default=0)
    
    # Arquivos
    arquivo_remessa = models.FileField("Arquivo de Remessa", upload_to='cobranca/remessas/%Y/%m/', blank=True)
    arquivo_retorno = models.FileField("Arquivo de Retorno", upload_to='cobranca/retornos/%Y/%m/', blank=True)
    
    # Datas
    data_geracao = models.DateTimeField("Data de Geração", auto_now_add=True)
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    data_processamento = models.DateTimeField("Data de Processamento", null=True, blank=True)
    
    # Status e controle
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='pendente')
    sequencial = models.IntegerField("Sequencial", default=1)
    
    # Observações
    observacoes = models.TextField("Observações", blank=True)
    erro_processamento = models.TextField("Erro de Processamento", blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    criado_por = models.CharField("Criado por", max_length=100, blank=True)
    
    class Meta:
        verbose_name = "Remessa"
        verbose_name_plural = "Remessas"
        ordering = ['-data_geracao']
        indexes = [
            models.Index(fields=['numero']),
            models.Index(fields=['banco']),
            models.Index(fields=['status']),
            models.Index(fields=['data_geracao']),
        ]
    
    def __str__(self):
        return f"Remessa {self.numero} - {self.banco.nome}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self.gerar_numero_remessa()
        super().save(*args, **kwargs)
    
    def gerar_numero_remessa(self):
        """Gera número único da remessa"""
        from datetime import datetime
        agora = datetime.now()
        sequencial = Remessa.objects.count() + 1
        return f"REM{agora.strftime('%Y%m%d')}{sequencial:04d}"
    
    def gerar_arquivo_remessa(self):
        """Gera arquivo de remessa CNAB"""
        try:
            # Buscar boletos pendentes para esta remessa
            boletos = BoletoMulta.objects.filter(
                status='pendente',
                banco=self.banco
            ).order_by('data_vencimento')[:50]  # Máximo 50 boletos por remessa
            
            if not boletos.exists():
                raise ValueError("Não há boletos pendentes para gerar remessa")
            
            # Gerar conteúdo CNAB
            conteudo_cnab = self._gerar_conteudo_cnab(boletos)
            
            # Salvar arquivo
            from django.core.files.base import ContentFile
            nome_arquivo = f"remessa_{self.numero}_{self.banco.codigo}.rem"
            
            self.arquivo_remessa.save(
                nome_arquivo,
                ContentFile(conteudo_cnab.encode('utf-8')),
                save=False
            )
            
            # Atualizar dados
            self.quantidade_boletos = boletos.count()
            self.valor_total = sum(boleto.valor_total for boleto in boletos)
            self.status = 'gerado'
            self.save()
            
            return self.arquivo_remessa.url if self.arquivo_remessa else None
            
        except Exception as e:
            self.erro_processamento = str(e)
            self.status = 'erro'
            self.save()
            return False
    
    def _gerar_conteudo_cnab(self, boletos):
        """Gera conteúdo CNAB para os boletos"""
        # Implementação simplificada do CNAB 400 (Banco do Brasil)
        linhas = []
        
        # Header
        header = self._gerar_header_cnab()
        linhas.append(header)
        
        # Registros de transação
        for boleto in boletos:
            transacao = self._gerar_transacao_cnab(boleto)
            linhas.append(transacao)
        
        # Trailer
        trailer = self._gerar_trailer_cnab(len(boletos))
        linhas.append(trailer)
        
        return '\n'.join(linhas)
    
    def _gerar_header_cnab(self):
        """Gera registro header do CNAB"""
        config = ConfiguracaoCobranca.objects.filter(ativo=True).first()
        
        # CNAB 400 - Header
        header = "0"  # Tipo de registro
        header += "1"  # Operação
        header += "REMESSA"  # Literal
        header += "01"  # Código do serviço
        header += "COBRANCA"  # Literal
        header += " " * 7  # Brancos
        header += config.beneficiario_nome.ljust(30)  # Nome da empresa
        header += self.banco.codigo.ljust(3)  # Código do banco
        header += config.banco_nome.ljust(15)  # Nome do banco
        header += self.data_geracao.strftime("%d%m%y")  # Data de geração
        header += " " * 8  # Brancos
        header += "000001"  # Sequencial
        header += " " * 277  # Brancos
        header += "000001"  # Sequencial
        
        return header
    
    def _gerar_transacao_cnab(self, boleto):
        """Gera registro de transação do CNAB"""
        # CNAB 400 - Transação
        transacao = "1"  # Tipo de registro
        transacao += "01"  # Código da operação
        transacao += boleto.nosso_numero.ljust(10)  # Nosso número
        transacao += " " * 4  # Brancos
        transacao += "01"  # Código da carteira
        transacao += "01"  # Código da agência
        transacao += "00000000"  # Conta corrente
        transacao += " " * 1  # Dígito da conta
        transacao += " " * 6  # Brancos
        transacao += "01"  # Código da multa
        transacao += "0000000000"  # Percentual da multa
        transacao += "00"  # Código do desconto
        transacao += "0000000000"  # Valor do desconto
        transacao += "01"  # Código da mora
        transacao += "0000000000"  # Percentual da mora
        transacao += "00"  # Código da multa
        transacao += "0000000000"  # Valor da multa
        transacao += boleto.pagador_documento.replace(".", "").replace("-", "").ljust(14)  # CPF/CNPJ
        transacao += boleto.pagador_nome.ljust(40)  # Nome do pagador
        transacao += " " * 40  # Endereço
        transacao += " " * 12  # Bairro
        transacao += " " * 8  # CEP
        transacao += " " * 15  # Cidade
        transacao += " " * 2  # UF
        transacao += " " * 40  # Observações
        transacao += "000"  # Número de dias para protesto
        transacao += " " * 1  # Branco
        transacao += "0000000000"  # Valor do título
        transacao += "0000000000"  # Valor do abatimento
        transacao += "0000000000"  # Valor do desconto
        transacao += "0000000000"  # Valor da mora
        transacao += "0000000000"  # Valor da multa
        transacao += " " * 10  # Brancos
        transacao += "000001"  # Sequencial
        
        return transacao
    
    def _gerar_trailer_cnab(self, quantidade_boletos):
        """Gera registro trailer do CNAB"""
        # CNAB 400 - Trailer
        trailer = "9"  # Tipo de registro
        trailer += " " * 393  # Brancos
        trailer += f"{quantidade_boletos:06d}"  # Quantidade de registros
        trailer += "000001"  # Sequencial
        
        return trailer
    
    def processar_retorno(self, arquivo_retorno):
        """Processa arquivo de retorno do banco"""
        try:
            # Salvar arquivo de retorno
            self.arquivo_retorno = arquivo_retorno
            self.data_processamento = timezone.now()
            
            # Processar linhas do arquivo
            conteudo = arquivo_retorno.read().decode('utf-8')
            linhas = conteudo.split('\n')
            
            for linha in linhas:
                if linha.strip() and linha[0] == '1':  # Registro de transação
                    self._processar_linha_retorno(linha)
            
            self.status = 'processado'
            self.save()
            
            return True
            
        except Exception as e:
            self.erro_processamento = str(e)
            self.status = 'erro'
            self.save()
            return False
    
    def _processar_linha_retorno(self, linha):
        """Processa uma linha do arquivo de retorno"""
        # Implementação simplificada
        nosso_numero = linha[62:72].strip()
        codigo_ocorrencia = linha[108:110]
        
        try:
            boleto = BoletoMulta.objects.get(nosso_numero=nosso_numero)
            
            if codigo_ocorrencia == '06':  # Liquidação
                boleto.status = 'pago'
                boleto.data_pagamento = timezone.now()
                boleto.save()
                
                # Registrar pagamento
                PagamentoMulta.objects.create(
                    boleto=boleto,
                    valor_pago=boleto.valor_total,
                    forma_pagamento='boleto',
                    data_pagamento=timezone.now(),
                    status='confirmado',
                    criado_por='Sistema'
                )
                
        except BoletoMulta.DoesNotExist:
            pass  # Boleto não encontrado


class Banco(models.Model):
    """Bancos disponíveis para cobrança"""
    
    codigo = models.CharField("Código", max_length=3, unique=True)
    nome = models.CharField("Nome", max_length=100)
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Banco"
        verbose_name_plural = "Bancos"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.codigo} - {self.nome}"
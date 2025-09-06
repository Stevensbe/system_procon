from django.db import models
from django.utils import timezone
from datetime import timedelta
from fiscalizacao.models import AutoInfracao, Processo  # importa os modelos da fiscalização

class Departamento(models.Model):
    nome      = models.CharField("Nome", max_length=100, unique=True)
    descricao = models.TextField("Descrição", blank=True)

    def __str__(self):
        return self.nome

class Empresa(models.Model):
    razao_social   = models.CharField("Razão Social", max_length=255, unique=True)
    nome_fantasia  = models.CharField("Nome Fantasia", max_length=255, blank=True)
    cnpj           = models.CharField("CNPJ", max_length=18, unique=True)
    endereco       = models.CharField("Endereço", max_length=255)
    telefone       = models.CharField("Telefone", max_length=20, blank=True)
    ativo          = models.BooleanField("Ativo", default=True)

    def __str__(self):
        return self.razao_social

class Multa(models.Model):
    """
    Modelo que representa uma multa aplicada a partir de um processo administrativo finalizado.
    Segue a especificação SISPROCON para gestão de penalidades financeiras.
    """
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('paga', 'Paga'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
    ]
    
    # Relação um-para-um com AutoInfracao (temporário - será migrado para Processo)
    processo = models.OneToOneField(
        AutoInfracao,
        on_delete=models.PROTECT,  # Impede exclusão se houver multa
        related_name='multa',
        verbose_name="Auto de Infração",
        help_text="Auto de infração que originou esta multa (será migrado para Processo)"
    )
    
    # Empresa autuada (redundante com processo, mas facilita consultas)
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.PROTECT,  # Preserva histórico mesmo se empresa for "excluída"
        related_name='multas',
        verbose_name="Empresa Autuada"
    )
    
    # Dados financeiros
    valor = models.DecimalField(
        "Valor da Multa (R$)", 
        max_digits=12, 
        decimal_places=2,
        help_text="Valor exato da penalidade financeira"
    )
    
    # Datas importantes
    data_emissao = models.DateField(
        "Data de Emissão", 
        auto_now_add=True,
        help_text="Data em que a multa foi criada no sistema"
    )
    
    data_vencimento = models.DateField(
        "Data de Vencimento",
        null=True,
        blank=True,
        help_text="Prazo final para pagamento da multa"
    )
    
    # Status da multa
    status = models.CharField(
        "Status da Multa",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pendente',
        help_text="Estado atual da multa no ciclo de cobrança"
    )
    
    # Comprovante de pagamento
    comprovante_pagamento = models.FileField(
        "Comprovante de Pagamento",
        upload_to='comprovantes/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text="Arquivo PDF ou imagem do comprovante de pagamento"
    )
    
    # Observações administrativas
    observacoes = models.TextField(
        "Observações",
        blank=True,
        help_text="Anotações administrativas sobre a multa"
    )
    
    # Campos de controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True, null=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True, null=True)
    
    # Campo legacy para compatibilidade (será removido em migração futura)
    pago = models.BooleanField("Pago (Legacy)", default=False, help_text="Campo de compatibilidade - use o campo 'status'")

    class Meta:
        verbose_name = "Multa"
        verbose_name_plural = "Multas"
        ordering = ['-data_emissao', '-criado_em']
        
    def __str__(self):
        return f"Multa #{self.pk} - {self.processo.numero_processo} - R$ {self.valor:.2f}"
    
    def save(self, *args, **kwargs):
        """
        Sobrescreve o save para:
        1. Definir data_vencimento automaticamente se não informada
        2. Atualizar status baseado na data atual
        3. Sincronizar campo legacy 'pago'
        """
        # Define data de vencimento padrão (30 dias após emissão)
        if not self.data_vencimento and self.data_emissao:
            self.data_vencimento = self.data_emissao + timedelta(days=30)
        elif not self.data_vencimento:
            # Se ainda não tem data_emissao (primeira criação)
            self.data_vencimento = timezone.now().date() + timedelta(days=30)
            
        # Atualiza status automático baseado na data
        if self.status == 'pendente' and self.data_vencimento:
            hoje = timezone.now().date()
            if hoje > self.data_vencimento:
                self.status = 'vencida'
        
        # Sincroniza campo legacy
        self.pago = (self.status == 'paga')
        
        super().save(*args, **kwargs)
    
    @property
    def esta_vencida(self):
        """Verifica se a multa está vencida"""
        if not self.data_vencimento:
            return False
        hoje = timezone.now().date()
        return hoje > self.data_vencimento and self.status in ['pendente', 'vencida']
    
    @property
    def dias_para_vencimento(self):
        """Calcula dias restantes para vencimento (negativo se vencida)"""
        if not self.data_vencimento:
            return None
        hoje = timezone.now().date()
        delta = self.data_vencimento - hoje
        return delta.days
    
    def marcar_como_paga(self, comprovante=None, observacao=""):
        """Marca a multa como paga"""
        self.status = 'paga'
        if comprovante:
            self.comprovante_pagamento = comprovante
        if observacao:
            self.observacoes = f"{self.observacoes}\n{observacao}".strip()
        self.save()
    
    def cancelar(self, motivo=""):
        """Cancela a multa"""
        self.status = 'cancelada'
        if motivo:
            self.observacoes = f"{self.observacoes}\nCancelada: {motivo}".strip()
        self.save()
    
    @classmethod
    def criar_a_partir_de_processo(cls, processo, usuario=None):
        """Cria multa automaticamente a partir de um processo finalizado"""
        if processo.status not in ['finalizado_procedente']:
            raise ValueError("Só é possível criar multa de processo finalizado como procedente")
        
        # Busca ou cria empresa baseada no auto de infração
        empresa = None
        if processo.auto_infracao:
            empresa, created = Empresa.objects.get_or_create(
                cnpj=processo.auto_infracao.cnpj,
                defaults={
                    'razao_social': processo.auto_infracao.razao_social,
                    'endereco': processo.auto_infracao.endereco,
                    'telefone': processo.auto_infracao.telefone
                }
            )
        
        if not empresa:
            raise ValueError("Não foi possível identificar a empresa para criar a multa")
        
        # Cria a multa
        multa = cls.objects.create(
            processo=processo.auto_infracao,  # Temporário - será migrado para processo
            empresa=empresa,
            valor=processo.valor_multa or processo.auto_infracao.valor_multa,
            observacoes=f"Multa criada automaticamente a partir do processo {processo.numero_processo}"
        )
        
        return multa
    
    def gerar_cobranca(self, usuario=None):
        """Gera cobrança automática para a multa"""
        if self.status != 'pendente':
            raise ValueError("Só é possível gerar cobrança para multas pendentes")
        
        # Aqui seria integrado com sistema bancário para gerar boleto
        # Por enquanto, apenas registra a intenção de cobrança
        cobranca = Cobranca.objects.create(
            multa=self,
            data_vencimento=self.data_vencimento
        )
        
        return cobranca
    
    def notificar_vencimento(self):
        """Cria notificação de vencimento da multa"""
        try:
            from protocolo_tramitacao.notifications import GerenciadorNotificacoes
            return GerenciadorNotificacoes.criar_notificacao_multa_vencida(self)
        except ImportError:
            return None

class Cobranca(models.Model):
    multa           = models.ForeignKey(
        Multa,
        on_delete=models.CASCADE,
        related_name='cobrancas',
        verbose_name="Multa"
    )
    boleto          = models.FileField("Arquivo do Boleto", upload_to='boletos/%Y/%m/%d/')
    remessa         = models.FileField("Arquivo de Remessa CNAB", upload_to='remessas/%Y/%m/%d/')
    retorno         = models.FileField(
        "Arquivo de Retorno CNAB",
        upload_to='retornos/%Y/%m/%d/',
        blank=True,
        null=True
    )
    data_vencimento = models.DateField("Vencimento")
    data_pagamento  = models.DateField("Pagamento", blank=True, null=True)

    def __str__(self):
        return f"Cobrança #{self.pk} da Multa #{self.multa_id}"

class Peticao(models.Model):
    PROCESSO_CHOICES = [
        ('ren_impugn', 'Renúncia à Impugnação'),
        ('rec1',       'Recurso 1ª Instância'),
        ('rec2',       'Recurso 2ª Instância'),
    ]
    processo  = models.ForeignKey(
        Processo,
        on_delete=models.PROTECT,
        related_name='peticoes',
        verbose_name="Processo Administrativo"
    )
    tipo      = models.CharField("Tipo", max_length=20, choices=PROCESSO_CHOICES)
    texto     = models.TextField("Texto")
    documento = models.FileField("Documento", upload_to='peticoes/%Y/%m/%d/')
    data      = models.DateField("Data", auto_now_add=True)

    def __str__(self):
        return f"Petição #{self.pk} — {self.get_tipo_display()}"

class Recurso(models.Model):
    TIPO_RECURSO = [
        ('impugnacao','Impugnação'),
        ('rec1',      'Recurso 1ª Instância'),
        ('rec2',      'Recurso 2ª Instância'),
    ]
    processo  = models.ForeignKey(
        Processo,
        on_delete=models.PROTECT,
        related_name='recursos',
        verbose_name="Processo Administrativo"
    )
    tipo      = models.CharField("Tipo", max_length=20, choices=TIPO_RECURSO)
    texto     = models.TextField("Texto")
    documento = models.FileField("Documento", upload_to='recursos/%Y/%m/%d/')
    data      = models.DateField("Data", auto_now_add=True)

    def __str__(self):
        return f"Recurso #{self.pk} — {self.get_tipo_display()}"

class Analise(models.Model):
    ANALISE_CHOICES = [
        ('rec2', '2ª Instância'),
        ('rec3', '3ª Instância'),
    ]
    recurso = models.ForeignKey(
        Recurso,
        on_delete=models.CASCADE,
        related_name='analises',
        verbose_name="Recurso"
    )
    tipo    = models.CharField("Tipo de Análise", max_length=20, choices=ANALISE_CHOICES)
    parecer = models.TextField("Parecer")
    decisao = models.BooleanField("Deferido")
    data    = models.DateField("Data", auto_now_add=True)

    def __str__(self):
        return f"Análise #{self.pk} — {'Deferido' if self.decisao else 'Indeferido'}"

class ConfigBancaria(models.Model):
    banco    = models.CharField("Banco", max_length=100)
    agencia  = models.CharField("Agência", max_length=20)
    conta    = models.CharField("Conta", max_length=20)
    convenio = models.CharField("Convênio", max_length=20, blank=True)

    def __str__(self):
        return f"{self.banco} - {self.agencia}/{self.conta}"

class ConfigSistema(models.Model):
    chave = models.CharField("Chave", max_length=100, unique=True)
    valor = models.CharField("Valor", max_length=255)

    def __str__(self):
        return self.chave

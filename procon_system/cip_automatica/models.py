"""
Modelos para CIP (Carta de Intimação para Pagamento) Automática
Sistema Procon - Fase 4 - Fluxo Completo do Atendimento
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()


class TipoCIP(models.Model):
    """Tipos de CIP disponíveis no sistema"""
    
    TIPO_CHOICES = [
        ('COMPRAS_VENDAS', 'Compras e Vendas'),
        ('PRESTACAO_SERVICOS', 'Prestação de Serviços'),
        ('CONDICOES_CONTRAACEIAS', 'Condições Contratuais'),
        ('CARTAO_PAGAMENTO', 'Cartão de Pagamento'),
        ('TELEFONIA_INTERNET', 'Telefonia e Internet'),
        ('EDUCACAO', 'Educação'),
        ('SAUDE_MEDICAMENTOS', 'Saúde e Medicamentos'),
        ('VEICULOS_AUTOMOTIVOS', 'Veículos Automotivos'),
        ('IMOVEIS_CONSTRUCAO', 'Imóveis e Construção'),
        ('GENERICO', 'Genérico'),
    ]
    
    nome = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=50, unique=True)
    descricao = models.TextField(blank=True)
    template_cip = models.TextField(help_text="Template da CIP em HTML")
    prazo_resposta = models.PositiveIntegerField(
        default=10, 
        help_text="Prazo em dias para resposta da empresa"
    )
    prazo_acordo = models.PositiveIntegerField(
        default=15,
        help_text="Prazo em dias para acordo de pagamento"
    )
    valor_minimo = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Valor mínimo para gerar CIP"
    )
    valor_maximo = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Valor máximo para gerar CIP"
    )
    setor_responsavel = models.CharField(max_length=100)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Tipo de CIP"
        verbose_name_plural = "Tipos de CIP"
        
    def __str__(self):
        return f"{self.nome} ({self.codigo})"


class CIPAutomatica(models.Model):
    """CIP Automática gerada pelo sistema"""
    
    STATUS_CHOICES = [
        ('GERADA', 'Gerada'),
        ('ENVIADA', 'Enviada'),
        ('ENTREGUECIDADAO', 'Entregue ao Cidadão'),
        ('PRODUCAO_JURIDICA', 'Em Produção Jurídica'),
        ('MANDADO_BUSCA', 'Mandado de Busca'),
        ('OBJECAO_PRECARIO', 'Objeção de Precário'),
        ('ARQUIVADA', 'Arquivada'),
        ('RESPONDIDA_EMPRESA', 'Respondida pela Empresa'),
        ('ACEITA_EMPRESA', 'Aceita pela Empresa'),
        ('RECUSADA_EMPRESA', 'Recusada pela Empresa'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
        ('CRITICA', 'Crítica'),
    ]
    
    # Identificação única
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_protocolo = models.CharField(max_length=50, unique=True, blank=True)
    numero_cip = models.CharField(max_length=50, unique=True, blank=True)
    
    # Dados da CIP
    tipo_cip = models.ForeignKey(TipoCIP, on_delete=models.PROTECT)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='GERADA')
    prioridade = models.CharField(max_length=15, choices=PRIORIDADE_CHOICES, default='NORMAL')
    
    # Dados do cidadão
    consumidor_nome = models.CharField(max_length=200)
    consumidor_cpf = models.CharField(max_length=15)
    consumidor_email = models.EmailField()
    consumidor_telefone = models.CharField(max_length=20)
    consumidor_endereco = models.TextField()
    consumidor_cidade = models.CharField(max_length=100)
    consumidor_uf = models.CharField(max_length=2)
    consumidor_cep = models.CharField(max_length=10)
    
    # Dados da empresa
    empresa_razao_social = models.CharField(max_length=200)
    empresa_cnpj = models.CharField(max_length=18)
    empresa_endereco = models.TextField()
    empresa_cidade = models.CharField(max_length=100)
    empresa_uf = models.CharField(max_length=2)
    empresa_email = models.EmailField(null=True, blank=True)
    empresa_telefone = models.CharField(max_length=20, null=True, blank=True)
    
    # Dados do caso
    assunto = models.CharField(max_length=300)
    descricao_fatos = models.TextField()
    valor_indenizacao = models.DecimalField(max_digits=10, decimal_places=2)
    valor_multa = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Controle de prazos
    data_geracao = models.DateTimeField(auto_now_add=True)
    data_envio_producao = models.DateTimeField(null=True, blank=True)
    data_entrega_cidadao = models.DateTimeField(null=True, blank=True)
    prazo_resposta_empresa = models.DateTimeField()
    prazo_acordo_pagamento = models.DateTimeField()
    
    # Responsáveis e controle
    responsavel_producao = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='cips_producao'
    )
    responsavel_juridico = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cips_juridicas'
    )
    
    # Vinculações
    documento_origem = models.ForeignKey(
        'caixa_entrada.CaixaEntrada',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Documentos gerados
    documento_cip = models.FileField(
        upload_to='cip/documentos/',
        null=True,
        blank=True
    )
    
    # Comentários e observações
    observacoes = models.TextField(blank=True)
    
    # Relacionamento com histórico das audiências relacionadas
    historico_relacionado = models.ManyToManyField(
        'audiencia_calendario.HistoricoAudiencia',
        blank=True,
        related_name='cips_viculadas'
    )
    
    class Meta:
        verbose_name = "CIP Automática"
        verbose_name_plural = "CIPs Automáticas"
        ordering = ['-data_geracao']
        
    def __str__(self):
        return f"CIP {self.numero_cip or 'SEM NUMERO'} - {self.assunto[:50]}"
    
    def gerar_numero_cip(self):
        """Gera número único da CIP"""
        if not self.numero_cip:
            ano = timezone.now().year
            prefixo = self.tipo_cip.codigo[:3].upper()
            
            # Contar CIPs deste ano deste tipo
            count = CIPAutomatica.objects.filter(
                tipo_cip=self.tipo_cip,
                data_geracao__year=ano
            ).count() + 1
            
            self.numero_cip = f"{prefixo}{ano:04d}{count:06d}"
            
    def calcular_valor_total(self):
        """Calcula valor total incluindo indenização e multa"""
        self.valor_total = self.valor_indenizacao + self.valor_multa
        
    def definir_prazos(self):
        """Define prazos baseados no tipo de CIP"""
        now = timezone.now()
        self.prazo_resposta_empresa = now + timedelta(days=self.tipo_cip.prazo_resposta)
        self.prazo_acordo_pagamento = now + timedelta(days=self.tipo_cip.prazo_acordo)
        
    def save(self, *args, **kwargs):
        if not self.numero_cip:
            self.gerar_numero_cip()
        if not self.pk:
            self.definir_prazos()
        self.calcular_valor_total()
        super().save(*args, **kwargs)


class RespostaEmpresa(models.Model):
    """Resposta da empresa à CIP"""
    
    TIPO_RESPOSTA_COMMONS = [
        ('ACEITA_TOTALMENTE', 'Aceita Totalmente'),
        ('ACEITA_PARCIALMENTE', 'Aceita Parcialmente'),
        ('RECUSA_COM_JUSTIFICATIVA', 'Recusa com Justificativa'),
        ('SOLICITA_MEDUACAO', 'Solicita Medição'),
        ('SOLICITA_PROVAS', 'Solicita Provas'),
        ('OBJETA_PROCESSO', 'Objetiva o Processo'),
        ('PROPOSTA_CONTESTACION', 'Proposta de Contensão'),
    ]
    
    STATUS_CHOICES = [
        ('ANALISANDO', 'Analisando'),
        ('ACEITA', 'Aceita'),
        ('REJEITADA', 'Rejeitada'),
        ('AGUARDANDO_COMPLEMENTO', 'Aguardando Complemento'),
        ('ENCAMINHADO_PROCESSO', 'Encaminhado para Processo'),
    ]
    
    cip = models.OneToOneField(CIPAutomatica, on_delete=models.CASCADE, related_name='resposta')
    
    # Dados da resposta
    tipo_resposta = models.CharField(max_length=30, choices=TIPO_RESPOSTA_COMMONS)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ANALISANDO')
    
    # Conteúdo da resposta
    texto_resposta = models.TextField()
    valor_oferecido = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Valor oferecido pela empresa (se aplicável)"
    )
    prazo_pagamento_oferecido = models.IntegerField(
        null=True,
        blank=True,
        help_text="Prazo de pagamento oferecido em dias"
    )
    
    # Controle de prazo
    data_recebimento = models.DateTimeField(auto_now_add=True)
    prazo_analise = models.DateTimeField()
    
    # Responsável pela análise
    responsavel_analise = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='respostas_analisadas'
    )
    
    # Decisão final
    decisao_final = models.TextField(blank=True)
    data_decisao = models.DateTimeField(null=True, blank=True)
    
    # Documentos anexos
    documentos_anexos = models.JSONField(default=list, blank=True)
    
    class Meta:
        verbose_name = "Resposta da Empresa"
        verbose_name_plural = "Respostas das Empresas"
        
    def __str__(self):
        return f"Resposta de {self.cip.empresa_razao_social} - CIP {self.cip.numero_cip}"
    
    def definir_prazo_analise(self):
        """Define prazo para análise da resposta"""
        self.prazo_analise = timezone.now() + timedelta(days=5)


class AudienciaConciligiao(models.Model):
    """Audência ou conciliação relacionada à CIP"""
    
    TIPO_CHOICES = [
        ('CONCILIACAO_PRESENCIAL', 'Conciliação Presencial'),
        ('CONCILIACAO_VIRTUAL', 'Conciliação Virtual'),
        ('AUDIENCIA_JURIDICA', 'Audência Jurídica'),
        ('MEDIACAO', 'Mediação'),
        ('ARBITRAGEM', 'Arbitragen'),
    ]
    
    STATUS_CHOICES = [
        ('AGENDADA', 'Agendada'),
        ('REALIZADA', 'Realizada'),
        ('ADIADA', 'Adiada'),
        ('CANCELADA', 'Cancelada'),
        ('MEDIACUON_SEM_SUCESSO', 'Mediação sem Sucesso'),
        ('ACORDO_FEITO', 'Acordo Feito'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Vinculação à CIP
    cips_relacionadas = models.ManyToManyField(
        CIPAutomatica,
        related_name='audiencia_relacionadas'
    )
    
    # Dados da audiência
    tipo = models.CharField(max_length=25, choices=TIPO_CHOICES)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='AGENDADA')
    
    data_agendamento = models.DateTimeField()
    data_realizacao = models.DateTimeField()
    duracao_estimada = models.DurationField(default=timedelta(hours=1))
    
    # Local e participantes
    localizacao = models.CharField(max_length=200)
    modalidade = models.CharField(max_length=20, choices=[
        ('PRESENCIAL', 'Presencial'),
        ('VIRTUAL', 'Virtual'),
        ('HIBRIDO', 'Híbrido'),
    ])
    
    # Participantes
    mediador = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audiencias_mediadas'
    )
    participantes_consumidor = models.JSONField(default=list)
    participantes_empresa = models.JSONField(default=list)
    
    # Ata e resultados
    ata_audiência = models.FileField(
        upload_to='audiencias/atas/',
        null=True,
        blank=True
    )
    resultados_acordo = models.JSONField(default=dict, blank=True)
    valor_acordado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Controle
    criado_em = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField()
    
    class Meta:
        verbose_name = "Audência de Conciliação"
        verbose_name_plural = "Audências de Conciliação"
        ordering = ['data_realizacao']
        
    def __str__(self):
        return f"Audiência {self.get_tipo_display()} - {self.data_realizacao.strftime('%d/%m/%Y %H:%M')}"

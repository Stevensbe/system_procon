from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator
from .mixins import AutoNumeracaoMixin, TimestampMixin
from django.contrib.auth import get_user_model
from datetime import datetime


ORIGEM_CHOICES = [
    ('acao', 'Ação Fiscalizatória'),
    ('denuncia', 'Denúncia'),
    ('forca_tarefa', 'Força Tarefa'),
    ('outros', 'Outros'),
]

PORTE_CHOICES = [
    ('microempresa', 'Microempresa'),
    ('pequeno', 'Pequeno Porte'),
    ('medio', 'Médio Porte'),
    ('grande', 'Grande Porte'),
]

# --- CLASSE BASE ABSTRATA COM CAMPOS COMUNS E ASSINATURAS ---
class AutoConstatacaoBase(AutoNumeracaoMixin, TimestampMixin):
    numero = models.CharField("Número do Auto", max_length=20, unique=True, blank=True)
    razao_social = models.CharField("Razão Social", max_length=255)
    nome_fantasia = models.CharField("Nome Fantasia", max_length=255, blank=True)
    atividade = models.CharField("Atividade", max_length=255)
    endereco = models.CharField("Endereço", max_length=255)
    cep = models.CharField("CEP", max_length=10)
    municipio = models.CharField("Município", max_length=100)
    estado = models.CharField("Estado", max_length=50, default='AM')
    cnpj = models.CharField("CNPJ", max_length=18)
    telefone = models.CharField("Telefone", max_length=20, blank=True)
    data_fiscalizacao = models.DateField("Data da Fiscalização")
    hora_fiscalizacao = models.TimeField("Hora da Fiscalização")
    origem = models.CharField("Origem", max_length=20, choices=ORIGEM_CHOICES, default='acao')
    origem_outros = models.CharField("Outras Origens", max_length=255, blank=True)

    # Nomes dos responsáveis pelas assinaturas
    fiscal_nome_1 = models.CharField("Nome do 1º Fiscal", max_length=255, blank=True, null=True)
    fiscal_nome_2 = models.CharField("Nome do 2º Fiscal", max_length=255, blank=True, null=True)
    responsavel_nome = models.CharField("Nome do Responsável", max_length=255, blank=True, null=True)
    responsavel_cpf = models.CharField("CPF/RG do Responsável", max_length=20, blank=True, null=True)

    # Imagens das assinaturas desenhadas
    assinatura_fiscal_1 = models.ImageField("Assinatura Fiscal 1", upload_to='assinaturas/', blank=True, null=True)
    assinatura_fiscal_2 = models.ImageField("Assinatura Fiscal 2", upload_to='assinaturas/', blank=True, null=True)
    assinatura_representante = models.ImageField("Assinatura Representante", upload_to='assinaturas/', blank=True, null=True)

    class Meta:
        abstract = True
        ordering = ['-data_fiscalizacao', '-id']
        indexes = [
            models.Index(fields=['numero']),
            models.Index(fields=['data_fiscalizacao']),
            models.Index(fields=['cnpj']),
            models.Index(fields=['razao_social']),
            models.Index(fields=['municipio']),
            models.Index(fields=['origem']),
        ]

    def __str__(self):
        return f"{self.numero} - {self.razao_social}"

    def clean(self):
        from django.core.exceptions import ValidationError
        # Validação de CNPJ básica
        if self.cnpj and len(self.cnpj.replace('.', '').replace('/', '').replace('-', '')) != 14:
            raise ValidationError({'cnpj': 'CNPJ deve ter 14 dígitos'})


# --- AUTO DE CONSTATAÇÃO PARA AGÊNCIAS BANCÁRIAS ---
class AutoBanco(AutoConstatacaoBase):
    porte = models.CharField("Porte", max_length=100, choices=PORTE_CHOICES, blank=True)
    atuacao = models.CharField("Atuação", max_length=100, blank=True)
    
    # Cominação Legal
    nada_consta = models.BooleanField("Nada Consta", default=False)
    sem_irregularidades = models.BooleanField("Não foram encontradas irregularidades", default=False)
    
    # Lei das Filas - Campos booleanos com 3 estados (True, False, None)
    todos_caixas_funcionando = models.BooleanField("Todos os caixas em funcionamento?", null=True, blank=True)
    distribuiu_senha = models.BooleanField("Distribuiu senha?", null=True, blank=True)
    distribuiu_senha_fora_padrao = models.BooleanField("Distribuiu senha fora do padrão?", null=True, blank=True)
    ausencia_cartaz_informativo = models.BooleanField("Ausência de Cartaz Informativo?", default=False)
    ausencia_profissional_libras = models.BooleanField("Ausência de profissional de LIBRAS?", default=False)
    
    # Campos adicionais para senhas fora do padrão
    senha_sem_nome_estabelecimento = models.BooleanField("Senha sem nome do estabelecimento?", default=False)
    senha_sem_horarios = models.BooleanField("Senha sem horários?", default=False)
    senha_sem_rubrica = models.BooleanField("Senha sem rubrica?", default=False)
    
    observacoes = models.TextField("Observações", blank=True)

    class Meta:
        verbose_name = "Auto de Banco"
        verbose_name_plural = "Autos de Banco"
        ordering = ['-data_fiscalizacao']
        indexes = [
            models.Index(fields=['porte']),
            models.Index(fields=['nada_consta']),
            models.Index(fields=['sem_irregularidades']),
        ]

    @property
    def total_atendimentos(self):
        return self.atendimentos_caixa.count()

    @property
    def tem_irregularidades(self):
        return not self.nada_consta and not self.sem_irregularidades


# --- AUTO DE CONSTATAÇÃO PARA POSTOS DE COMBUSTÍVEL ---
# ========================================
# ARQUIVO: fiscalizacao/models.py
# LOCALIZAR A CLASSE AutoPosto E ADICIONAR O CAMPO matricula_fiscal_1
# ========================================

# Encontre esta classe no seu arquivo models.py:

class AutoPosto(AutoConstatacaoBase):
    # Dados específicos do posto
    porte = models.CharField(
        max_length=20,
        choices=[
            ('microempresa', 'Microempresa'),
            ('pequeno', 'Pequeno Porte'),
            ('medio', 'Médio Porte'),
            ('grande', 'Grande Porte'),
        ],
        blank=True,
        null=True,
        verbose_name="Porte da Empresa"
    )
    
    atuacao = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Atuação"
    )
    
    # Cominação Legal
    nada_consta = models.BooleanField(
        default=False,
        verbose_name="Nada Consta"
    )
    
    sem_irregularidades = models.BooleanField(
        default=False,
        verbose_name="Sem Irregularidades"
    )
    
    # Preços dos combustíveis no totem
    preco_gasolina_comum = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True,
        verbose_name="Preço Gasolina Comum (R$/litro)"
    )
    
    preco_gasolina_aditivada = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True,
        verbose_name="Preço Gasolina Aditivada (R$/litro)"
    )
    
    preco_etanol = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True,
        verbose_name="Preço Etanol (R$/litro)"
    )
    
    preco_diesel_comum = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True,
        verbose_name="Preço Diesel Comum (R$/litro)"
    )
    
    preco_diesel_s10 = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True,
        verbose_name="Preço Diesel S-10 (R$/litro)"
    )
    
    preco_gnv = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        blank=True,
        null=True,
        verbose_name="Preço GNV (R$/m³)"
    )
    
    # Produtos não comercializados
    nao_vende_gas_comum = models.BooleanField(
        default=False,
        verbose_name="Não vende Gasolina Comum"
    )
    
    nao_vende_gas_aditivada = models.BooleanField(
        default=False,
        verbose_name="Não vende Gasolina Aditivada"
    )
    
    nao_vende_etanol = models.BooleanField(
        default=False,
        verbose_name="Não vende Etanol"
    )
    
    nao_vende_diesel_comum = models.BooleanField(
        default=False,
        verbose_name="Não vende Diesel Comum"
    )
    
    nao_vende_diesel_s10 = models.BooleanField(
        default=False,
        verbose_name="Não vende Diesel S-10"
    )
    
    nao_vende_gnv = models.BooleanField(
        default=False,
        verbose_name="Não vende GNV"
    )
    
    # Prazo para envio de documentos
    prazo_envio_documentos = models.IntegerField(
        default=48,
        verbose_name="Prazo para envio de documentos (horas)"
    )
    
    # Campos para observações
    info_adicionais = models.TextField(
        blank=True,
        null=True,
        verbose_name="Informações Adicionais"
    )
    
    outras_irregularidades = models.TextField(
        blank=True,
        null=True,
        verbose_name="Outras Irregularidades Constatadas"
    )
    
    dispositivos_legais = models.TextField(
        blank=True,
        null=True,
        verbose_name="Dispositivos Legais Infringidos"
    )
    
    # ========================================
    # ADICIONAR ESTE CAMPO NOVO:
    # ========================================
    matricula_fiscal_1 = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Matrícula do Fiscal 1",
        help_text="Matrícula do fiscal responsável pela fiscalização"
    )
    
    class Meta:
        verbose_name = "Auto de Posto"
        verbose_name_plural = "Autos de Posto"
        ordering = ['-data_fiscalizacao']
        indexes = [
            models.Index(fields=['porte']),
            models.Index(fields=['nada_consta']),
            models.Index(fields=['sem_irregularidades']),
            models.Index(fields=['preco_gasolina_comum']),
            models.Index(fields=['preco_etanol']),
        ]
    
    def __str__(self):
        return f"Auto {self.numero} - {self.razao_social}"

# --- AUTO DE CONSTATAÇÃO PARA SUPERMERCADOS ---
class AutoSupermercado(AutoConstatacaoBase):
    # Irregularidades específicas do formulário de supermercados
    comercializar_produtos_vencidos = models.BooleanField("Comercializar produtos vencidos", default=False)
    comercializar_embalagem_violada = models.BooleanField("Comercializar produtos com embalagem violada", default=False)
    comercializar_lata_amassada = models.BooleanField("Comercializar produtos com lata amassada", default=False)
    comercializar_sem_validade = models.BooleanField("Comercializar produtos sem validade ou com validade ilegível", default=False)
    comercializar_mal_armazenados = models.BooleanField("Comercializar produtos mal armazenados", default=False)
    comercializar_descongelados = models.BooleanField("Comercializar produtos parcialmente/totalmente descongelados", default=False)
    publicidade_enganosa = models.BooleanField("Publicidade enganosa", default=False)
    obstrucao_monitor = models.BooleanField("Obstrução do monitor", default=False)
    afixacao_precos_fora_padrao = models.BooleanField("Afixação de preços fora do padrão", default=False)
    ausencia_afixacao_precos = models.BooleanField("Ausência de afixação de preços", default=False)
    afixacao_precos_fracionados_fora_padrao = models.BooleanField("Afixação de preços na venda a varejo de produtos fracionados fora do padrão", default=False)
    ausencia_visibilidade_descontos = models.BooleanField("Ausência de visibilidade de descontos", default=False)
    ausencia_placas_promocao_vencimento = models.BooleanField("Ausência das placas ou cartazes informativos acerca da data de validade de produtos em promoção", default=False)
    
    # Campos específicos do formulário
    nada_consta = models.BooleanField("Nada Consta", default=False)
    
    # Prazo para cumprimento de obrigação
    prazo_cumprimento_dias = models.IntegerField("Prazo para cumprimento (dias)", null=True, blank=True)
    
    # Campos textuais
    outras_irregularidades = models.TextField("Outras Irregularidades Constatadas/Outras Cominações Legais", blank=True)
    narrativa_fatos = models.TextField("Narrativa dos Fatos", blank=True)
    
    # Anexos e apreensão
    possui_anexo = models.BooleanField("Possui Anexo?", default=False)
    auto_apreensao = models.BooleanField("Gerou Auto de Apreensão/Inutilização?", default=False)
    auto_apreensao_numero = models.CharField("Nº do Auto de Apreensão", max_length=50, blank=True)
    
    # Perícia
    necessita_pericia = models.BooleanField("Os itens apreendidos necessitam de perícia?", null=True, blank=True)
    justificativa_pericia = models.TextField("Justificativa da Perícia", blank=True)
    
    # Receita bruta (notificação padrão)
    receita_bruta_notificada = models.BooleanField("Receita Bruta Notificada?", default=True)
    
    # Campos adicionais baseados no formulário oficial
    cominacao_legal = models.TextField("Cominação Legal", blank=True)
    instrucoes_fiscalizado = models.TextField("Instruções ao Fiscalizado", blank=True)
    prazo_cumprimento_dias = models.IntegerField("Prazo para Cumprimento (dias)", default=5)

    def save(self, *args, **kwargs):
        """Gera número usando a sequência ÚNICA compartilhada"""
        if not self.numero:
            from .utils import gerar_proximo_numero_auto
            self.numero = gerar_proximo_numero_auto()
        super().save(*args, **kwargs)


    @property
    def tem_irregularidades(self):
        """Retorna True se houver alguma irregularidade marcada"""
        irregularidades = [
            self.comercializar_produtos_vencidos,
            self.comercializar_embalagem_violada,
            self.comercializar_lata_amassada,
            self.comercializar_sem_validade,
            self.comercializar_mal_armazenados,
            self.comercializar_descongelados,
            self.publicidade_enganosa,
            self.obstrucao_monitor,
            self.afixacao_precos_fora_padrao,
            self.ausencia_afixacao_precos,
            self.afixacao_precos_fracionados_fora_padrao,
            self.ausencia_visibilidade_descontos,
            self.ausencia_placas_promocao_vencimento,
        ]
        return any(irregularidades) or bool(self.outras_irregularidades.strip())

    class Meta:
        verbose_name = "Auto de Supermercado"
        verbose_name_plural = "Autos de Supermercado"
        ordering = ['-data_fiscalizacao']
        indexes = [
            models.Index(fields=['nada_consta']),
            models.Index(fields=['comercializar_produtos_vencidos']),
            models.Index(fields=['prazo_cumprimento_dias']),
            models.Index(fields=['auto_apreensao']),
        ]


# --- AUTO DE CONSTATAÇÃO DIVERSOS (LEGISLAÇÃO DIVERSA) ---
class AutoDiversos(AutoConstatacaoBase):
    porte = models.CharField("Porte", max_length=100, choices=PORTE_CHOICES, blank=True)
    atuacao = models.CharField("Atuação", max_length=100, blank=True)
    
    # Irregularidades específicas do formulário de legislação diversa
    publicidade_enganosa = models.BooleanField("Publicidade enganosa", default=False)
    afixacao_precos_fora_padrao = models.BooleanField("Afixação de preços fora do padrão", default=False)
    ausencia_afixacao_precos = models.BooleanField("Ausência de afixação de preços", default=False)
    afixacao_precos_eletronico_fora_padrao = models.BooleanField("Afixação de preços no comércio eletrônico fora do padrão", default=False)
    ausencia_afixacao_precos_eletronico = models.BooleanField("Ausência de afixação de preços no comércio eletrônico", default=False)
    afixacao_precos_fracionados_fora_padrao = models.BooleanField("Afixação de preços na venda a varejo de produtos fracionados fora do padrão", default=False)
    ausencia_visibilidade_descontos = models.BooleanField("Ausência de visibilidade de descontos", default=False)
    ausencia_exemplar_cdc = models.BooleanField("Ausência do exemplar do CDC em local visível", default=False)
    substituicao_troco = models.BooleanField("Substituição do troco em dinheiro por outros produtos não consentidos", default=False)
    
    # Advertência
    advertencia = models.BooleanField("Houve Advertência?", default=False)
    
    # Campos textuais
    outras_irregularidades = models.TextField("Outras Irregularidades Constatadas/Outras Cominações Legais", blank=True)
    narrativa_fatos = models.TextField("Narrativa dos Fatos", blank=True)
    
    # Receita bruta (notificação padrão)
    receita_bruta_notificada = models.BooleanField("Receita Bruta Notificada?", default=True)

    def save(self, *args, **kwargs):
        """Gera número usando a sequência ÚNICA compartilhada"""
        if not self.numero:
            from .utils import gerar_proximo_numero_auto
            self.numero = gerar_proximo_numero_auto()
        super().save(*args, **kwargs)


    @property
    def tem_irregularidades(self):
        """Retorna True se houver alguma irregularidade marcada"""
        irregularidades = [
            self.publicidade_enganosa,
            self.afixacao_precos_fora_padrao,
            self.ausencia_afixacao_precos,
            self.afixacao_precos_eletronico_fora_padrao,
            self.ausencia_afixacao_precos_eletronico,
            self.afixacao_precos_fracionados_fora_padrao,
            self.ausencia_visibilidade_descontos,
            self.ausencia_exemplar_cdc,
            self.substituicao_troco,
        ]
        return any(irregularidades) or bool(self.outras_irregularidades.strip())

    class Meta:
        verbose_name = "Auto Diversos"
        verbose_name_plural = "Autos Diversos"
        ordering = ['-data_fiscalizacao']
        indexes = [
            models.Index(fields=['porte']),
            models.Index(fields=['advertencia']),
            models.Index(fields=['receita_bruta_notificada']),
        ]


# --- MODELOS RELACIONADOS ---

class AtendimentoCaixaBanco(models.Model):
    auto_banco = models.ForeignKey(AutoBanco, related_name='atendimentos_caixa', on_delete=models.CASCADE)
    letra_senha = models.CharField("Letra da Senha", max_length=10)
    horario_chegada = models.TimeField("Horário de Chegada")
    horario_atendimento = models.TimeField("Horário de Atendimento")
    tempo_decorrido = models.IntegerField(
        "Tempo Decorrido (minutos)", 
        validators=[MinValueValidator(0), MaxValueValidator(300)]
    )
    
    class Meta:
        ordering = ['horario_chegada']
        verbose_name = "Atendimento de Caixa"
        verbose_name_plural = "Atendimentos de Caixa"

    def __str__(self):
        return f"Senha {self.letra_senha} - {self.auto_banco.numero}"

    @property
    def tempo_espera_formatado(self):
        """Retorna o tempo de espera formatado"""
        if self.tempo_decorrido >= 60:
            horas = self.tempo_decorrido // 60
            minutos = self.tempo_decorrido % 60
            return f"{horas}h {minutos}min"
        return f"{self.tempo_decorrido}min"


class NotaFiscalPosto(models.Model):
    auto_posto = models.ForeignKey(AutoPosto, related_name='notas_fiscais', on_delete=models.CASCADE)
    TIPO_NOTA_CHOICES = [
        ('aumento', 'Último Aumento'), 
        ('anterior', 'Anteriores')
    ]
    PRODUTO_CHOICES = [
        ('gas_comum', 'Gasolina Comum'), 
        ('gas_aditivada', 'Gasolina Aditivada'),
        ('etanol', 'Etanol'), 
        ('diesel_comum', 'Diesel Comum'),
        ('diesel_s10', 'Diesel S-10'), 
        ('gnv', 'GNV'),
    ]
    tipo_nota = models.CharField("Tipo da Nota", max_length=10, choices=TIPO_NOTA_CHOICES)
    produto = models.CharField("Produto", max_length=20, choices=PRODUTO_CHOICES)
    numero_nota = models.CharField("Número da Nota Fiscal", max_length=50)
    data = models.DateField("Data da Nota")
    preco = models.DecimalField("Preço por Litro", max_digits=6, decimal_places=3)

    class Meta:
        verbose_name = "Nota Fiscal do Posto"
        verbose_name_plural = "Notas Fiscais do Posto"
        ordering = ['-data']

    def __str__(self):
        return f"Nota {self.numero_nota} - {self.get_produto_display()} - {self.data}"


class CupomFiscalPosto(models.Model):
    auto_posto = models.ForeignKey(AutoPosto, related_name='cupons_fiscais', on_delete=models.CASCADE)
    item_tabela = models.CharField("Item da Tabela", max_length=5)
    dia = models.DateField("Dia do Cupom")
    numero_cupom = models.CharField("Nº do Cupom", max_length=50)
    produto = models.CharField("Produto", max_length=255)
    valor = models.DecimalField("Valor em R$", max_digits=10, decimal_places=2)
    percentual_diferenca = models.DecimalField("Diferença (%)", max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = "Cupom Fiscal do Posto"
        verbose_name_plural = "Cupons Fiscais do Posto"
        ordering = ['-dia']

    def __str__(self):
        return f"Cupom {self.numero_cupom} - {self.produto}"


# --- MODELO GENÉRICO PARA ANEXOS ---
class AnexoAuto(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    arquivo = models.FileField("Arquivo Anexo", upload_to='anexos/%Y/%m/%d/')
    descricao = models.CharField("Descrição", max_length=255, blank=True)
    enviado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Anexo do Auto"
        verbose_name_plural = "Anexos dos Autos"

    def __str__(self):
        return f"Anexo para {self.content_object}"


# Adicione ao seu models.py existente

# Choices para o modelo de infração
GRAVIDADE_CHOICES = [
    ('leve', 'Leve'),
    ('media', 'Média'),
    ('grave', 'Grave'),
    ('gravissima', 'Gravíssima'),
]

STATUS_INFRACAO_CHOICES = [
    ('autuado', 'Autuado'),
    ('notificado', 'Notificado'),
    ('em_defesa', 'Em Defesa'),
    ('em_recurso', 'Em Recurso'),
    ('finalizado', 'Finalizado'),
    ('arquivado', 'Arquivado'),
]

TIPO_INFRACAO_CHOICES = [
    ('publicidade_enganosa', 'Publicidade Enganosa'),
    ('precos_abusivos', 'Preços Abusivos'),
    ('produtos_vencidos', 'Produtos Vencidos'),
    ('ausencia_informacoes', 'Ausência de Informações'),
    ('descumprimento_oferta', 'Descumprimento de Oferta'),
    ('cobranca_indevida', 'Cobrança Indevida'),
    ('condicoes_irregulares', 'Condições Irregulares de Armazenamento'),
    ('falta_documento', 'Falta de Documentação Obrigatória'),
    ('outros', 'Outros'),
]

FORMA_NOTIFICACAO_CHOICES = [
    ('pessoal', 'Pessoal'),
    ('correios', 'Correios'),
    ('edital', 'Edital'),
    ('email', 'E-mail'),
]

class AutoInfracao(models.Model):
    """
    Auto de Infração - Baseado no modelo oficial do PROCON-AM
    Documento para autuação de estabelecimentos que infringem o CDC
    """
    
    # === DADOS BÁSICOS DO AUTO ===
    numero = models.CharField("Número da Infração", max_length=20, unique=True, blank=True)
    data_fiscalizacao = models.DateField("Data da Fiscalização")
    hora_fiscalizacao = models.TimeField("Hora da Fiscalização")
    municipio = models.CharField("Município", max_length=100, default="MANAUS")
    estado = models.CharField("Estado", max_length=2, default="AMAZONAS")
    
    # === DADOS DO ESTABELECIMENTO ===
    razao_social = models.CharField("Razão Social", max_length=255)
    nome_fantasia = models.CharField("Nome Fantasia", max_length=255, blank=True)
    atividade = models.CharField("Atividade", max_length=255, default="Não informado")
    endereco = models.CharField("Endereço", max_length=500)
    cnpj = models.CharField("CNPJ", max_length=18)
    telefone = models.CharField("Telefone", max_length=20, blank=True)
    
    # === PARECER PRÉVIO ===
    parecer_numero = models.CharField("Número do Parecer", max_length=50, blank=True, 
                                    help_text="Ex: 152/2025")
    parecer_origem = models.CharField("Origem do Parecer", max_length=100, 
                                    default="FISCALIZAÇÃO/PROCON/AM")
    
    # === RELATÓRIO DETALHADO ===
    relatorio = models.TextField("Relatório", 
                                help_text="Narrativa detalhada dos fatos constatados durante a fiscalização")
    
    # === BASE LEGAL E FUNDAMENTAÇÃO ===
    base_legal_cdc = models.TextField("Base Legal CDC", 
                                     help_text="Artigos do CDC violados")
    base_legal_outras = models.TextField("Outras Bases Legais", blank=True,
                                       help_text="Outras leis e decretos aplicáveis")
    
    # === INFRAÇÕES ESPECÍFICAS (Campos booleanos para marcar as infrações) ===
    
    # Infrações do CDC - Art. 34, 35, 36
    infracao_art_34 = models.BooleanField("Art. 34 CDC", default=False)
    infracao_art_35 = models.BooleanField("Art. 35 CDC", default=False) 
    infracao_art_36 = models.BooleanField("Art. 36 CDC", default=False)
    
    # Infrações do CDC - Art. 55 e seguintes
    infracao_art_55 = models.BooleanField("Art. 55 CDC", default=False)
    infracao_art_56 = models.BooleanField("Art. 56 CDC", default=False)
    
    # Outras infrações comuns
    infracao_publicidade_enganosa = models.BooleanField("Publicidade Enganosa", default=False)
    infracao_precos_abusivos = models.BooleanField("Preços Abusivos", default=False)
    infracao_produtos_vencidos = models.BooleanField("Produtos Vencidos", default=False)
    infracao_falta_informacao = models.BooleanField("Falta de Informação", default=False)
    
    # Campo para outras infrações
    outras_infracoes = models.TextField("Outras Infrações", blank=True)
    
    # === FUNDAMENTAÇÃO TÉCNICA E JURÍDICA ===
    fundamentacao_tecnica = models.TextField("Fundamentação Técnica", blank=True,
                                           help_text="Fundamentação técnica da autuação")
    fundamentacao_juridica = models.TextField("Fundamentação Jurídica", blank=True,
                                            help_text="Fundamentação jurídica da autuação")
    
    # === VALOR DA MULTA ===
    valor_multa = models.DecimalField("Valor da Multa (R$)", max_digits=12, decimal_places=2,
                                    help_text="Valor da multa aplicada")
    
    # === DADOS DO RESPONSÁVEL ===
    responsavel_nome = models.CharField("Nome do Responsável", max_length=255)
    responsavel_cpf = models.CharField("CPF do Responsável", max_length=14)
    responsavel_funcao = models.CharField("Função/Cargo", max_length=100, blank=True)
    
    # === AUTORIDADE FISCALIZADORA ===
    fiscal_nome = models.CharField("Nome do Fiscal", max_length=255)
    fiscal_cargo = models.CharField("Cargo do Fiscal", max_length=100, 
                                  default="Agente de Fiscalização")
    
    # === ESTABELECIMENTO FISCALIZADO ===
    estabelecimento_responsavel = models.CharField("Responsável pelo Estabelecimento", 
                                                 max_length=255, blank=True)
    
    # === DATAS IMPORTANTES ===
    data_notificacao = models.DateField("Data de Notificação", null=True, blank=True)
    data_vencimento = models.DateField("Data de Vencimento", null=True, blank=True)
    
    # === STATUS DO PROCESSO ===
    STATUS_CHOICES = [
        ('autuado', 'Autuado'),
        ('notificado', 'Notificado'),
        ('em_defesa', 'Em Defesa'),
        ('julgado', 'Julgado'),
        ('pago', 'Pago'),
        ('cancelado', 'Cancelado'),
    ]
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='autuado')
    
    # === OBSERVAÇÕES ===
    observacoes = models.TextField("Observações", blank=True)
    
    # === ANEXOS ===
    possui_anexo = models.BooleanField("Possui Anexo?", default=False)
    descricao_anexo = models.TextField("Descrição dos Anexos", blank=True)
    
    # === ASSINATURAS ===
    assinatura_fiscal = models.ImageField("Assinatura do Fiscal", 
                                        upload_to='assinaturas/infrações/', 
                                        blank=True, null=True)
    assinatura_responsavel = models.ImageField("Assinatura do Responsável", 
                                             upload_to='assinaturas/infrações/', 
                                             blank=True, null=True)
    
    # === METADADOS ===
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Auto de Infração"
        verbose_name_plural = "Autos de Infração"
        ordering = ['-data_fiscalizacao', '-numero']
        indexes = [
            models.Index(fields=['numero']),
            models.Index(fields=['data_fiscalizacao']),
            models.Index(fields=['razao_social']),
            models.Index(fields=['cnpj']),
            models.Index(fields=['status']),
            models.Index(fields=['valor_multa']),
            models.Index(fields=['data_notificacao']),
        ]

    def __str__(self):
        return f"Auto de Infração {self.numero} - {self.razao_social}"

    def save(self, *args, **kwargs):
        """Gera número automático no formato 001/2025"""
        if not self.numero:
            ano = timezone.now().year
            
            # Busca o último auto de infração do ano atual
            ultimo_auto = AutoInfracao.objects.filter(
                numero__endswith=f"/{ano}"
            ).order_by('-id').first()

            # Inicia a sequência como 1, se não houver nenhum auto registrado
            seq = 1
            if ultimo_auto:
                try:
                    # Pega o número sequencial e incrementa
                    seq = int(ultimo_auto.numero.split('/')[0]) + 1
                except (ValueError, IndexError):
                    seq = 1

            # Formata o novo número de auto de infração
            self.numero = f"{seq:03d}/{ano}"
        
        super().save(*args, **kwargs)

    def clean(self):
        """Validações do modelo"""
        from django.core.exceptions import ValidationError
        
        # Validação de CNPJ básica
        if self.cnpj and len(self.cnpj.replace('.', '').replace('/', '').replace('-', '')) != 14:
            raise ValidationError({'cnpj': 'CNPJ deve ter 14 dígitos'})
        
        # Validação de CPF básica
        if self.responsavel_cpf and len(self.responsavel_cpf.replace('.', '').replace('-', '')) != 11:
            raise ValidationError({'responsavel_cpf': 'CPF deve ter 11 dígitos'})
        
        # Validação de valor da multa
        if self.valor_multa and self.valor_multa <= 0:
            raise ValidationError({'valor_multa': 'Valor da multa deve ser maior que zero'})

    @property
    def tem_infracoes_marcadas(self):
        """Retorna True se há pelo menos uma infração marcada"""
        return any([
            self.infracao_art_34,
            self.infracao_art_35,
            self.infracao_art_36,
            self.infracao_art_55,
            self.infracao_art_56,
            self.infracao_publicidade_enganosa,
            self.infracao_precos_abusivos,
            self.infracao_produtos_vencidos,
            self.infracao_falta_informacao,
        ]) or bool(self.outras_infracoes.strip())

    @property
    def status_display(self):
        """Retorna o status formatado"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    @property
    def valor_multa_formatado(self):
        """Retorna o valor da multa formatado em Real"""
        if self.valor_multa:
            return f"R$ {self.valor_multa:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        return "R$ 0,00"

    def gerar_documento_docx(self):
        """Gera documento Word do Auto de Infração"""
        from django.template.loader import get_template
        from docx import Document
        from io import BytesIO
        
        # Carrega template
        doc = Document('fiscalizacao/templates/docs/AutoInfracao.docx')
        
        # Substitui marcadores no documento
        context = {
            'auto': self,
            'data_extenso': self.data_fiscalizacao.strftime('%d de %B de %Y'),
            'hora_formatada': self.hora_fiscalizacao.strftime('%H:%M'),
        }
        
        # Processamento do documento (implementar conforme necessário)
        
        # Retorna o documento
        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer








# Fim do modelo AutoInfracao


class HistoricoStatusInfracao(models.Model):
    auto_infracao = models.ForeignKey(AutoInfracao, on_delete=models.CASCADE, related_name='historico_status')
    status_anterior = models.CharField("Status Anterior", max_length=20, choices=STATUS_INFRACAO_CHOICES, null=True, blank=True)
    status_novo = models.CharField("Status Novo", max_length=20, choices=STATUS_INFRACAO_CHOICES)
    data_mudanca = models.DateTimeField("Data da Mudança", auto_now_add=True)
    observacoes = models.TextField("Observações", blank=True)
    usuario = models.CharField("Usuário", max_length=255, blank=True)

    class Meta:
        verbose_name = "Histórico de Status"
        verbose_name_plural = "Históricos de Status"
        ordering = ['-data_mudanca']

    def __str__(self):
        return f"{self.auto_infracao.numero} - {self.status_anterior} → {self.status_novo}"

# No final de fiscalizacao/models.py

# fiscalizacao/models.py
# ADICIONAR este modelo no FINAL do arquivo models.py:

class SequenciaAutos(models.Model):
    """
    Controla a sequência numérica ÚNICA para TODOS os tipos de auto de constatação.
    
    Garante que todos os autos (Banco, Posto, Supermercado, Diversos) sigam
    a mesma numeração sequencial:
    - Auto Banco: 001/2025
    - Auto Posto: 002/2025  
    - Auto Supermercado: 003/2025
    - Auto Diversos: 004/2025
    - etc.
    """
    ano = models.IntegerField("Ano", unique=True)
    ultimo_numero = models.IntegerField("Último Número Gerado", default=0)
    
    # Campos informativos (opcionais)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    def __str__(self):
        return f"Sequência {self.ano}: próximo será {self.ultimo_numero + 1:03d}/{self.ano}"

    class Meta:
        verbose_name = "Sequência de Auto"
        verbose_name_plural = "Sequências de Autos"
        ordering = ['-ano']
    
    @property
    def proximo_numero(self):
        """Retorna uma prévia do próximo número que será gerado"""
        return f"{self.ultimo_numero + 1:03d}/{self.ano}"
    
    @property
    def total_autos_gerados(self):
        """Retorna quantos autos já foram gerados neste ano"""
        return self.ultimo_numero

class SequenciaAutosApreensao(models.Model):
    """
    Controla a sequência numérica para autos de apreensão/inutilização.
    
    Garante que os autos de apreensão sigam uma numeração sequencial:
    - Auto Apreensão: 001/2025
    - Auto Inutilização: 002/2025  
    - etc.
    """
    ano = models.IntegerField("Ano", unique=True)
    ultimo_numero = models.IntegerField("Último Número Gerado", default=0)
    
    # Campos informativos (opcionais)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    def __str__(self):
        return f"Sequência Apreensão {self.ano}: próximo será {self.ultimo_numero + 1:03d}/{self.ano}"

    class Meta:
        verbose_name = "Sequência de Auto de Apreensão"
        verbose_name_plural = "Sequências de Autos de Apreensão"
        ordering = ['-ano']
    
    @property
    def proximo_numero(self):
        """Retorna uma prévia do próximo número que será gerado"""
        return f"{self.ultimo_numero + 1:03d}/{self.ano}"
    
    @property
    def total_autos_gerados(self):
        """Retorna quantos autos já foram gerados neste ano"""
        return self.ultimo_numero

# fiscalizacao/models.py
# SUBSTITUIR o modelo Processo existente por esta versão melhorada:

class Processo(models.Model):
    """
    Modelo que representa o Processo Administrativo completo.
    Versão melhorada com mais campos e funcionalidades.
    """
    
    # Relacionamento com Auto de Infração (um-para-um)
    auto_infracao = models.OneToOneField(
        AutoInfracao, 
        on_delete=models.CASCADE, 
        related_name='processo',
        verbose_name="Auto de Infração"
    )
    
    # Dados básicos do processo
    numero_processo = models.CharField(
        "Número do Processo", 
        max_length=25, 
        unique=True, 
        blank=True,
        help_text="Gerado automaticamente no formato PROC-00001/2025"
    )
    
    autuado = models.CharField(
        "Autuado (Razão Social)", 
        max_length=255,
        help_text="Razão social da empresa autuada"
    )
    
    cnpj = models.CharField(
        "CNPJ", 
        max_length=18,
        help_text="CNPJ da empresa autuada"
    )
    
    # Status expandido com mais opções
    STATUS_CHOICES = [
        ('aguardando_defesa', 'Aguardando Defesa'),
        ('defesa_apresentada', 'Defesa Apresentada'),
        ('em_analise', 'Em Análise'),
        ('aguardando_recurso', 'Aguardando Recurso'),
        ('recurso_apresentado', 'Recurso Apresentado'),
        ('julgamento', 'Em Julgamento'),
        ('finalizado_procedente', 'Finalizado - Procedente'),
        ('finalizado_improcedente', 'Finalizado - Improcedente'),
        ('arquivado', 'Arquivado'),
        ('prescrito', 'Prescrito'),
    ]
    
    status = models.CharField(
        "Status do Processo", 
        max_length=50, 
        choices=STATUS_CHOICES,
        default='aguardando_defesa'
    )
    
    # Campos de prioridade e urgência
    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('normal', 'Normal'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    prioridade = models.CharField(
        "Prioridade",
        max_length=20,
        choices=PRIORIDADE_CHOICES,
        default='normal'
    )
    
    # Prazos importantes
    prazo_defesa = models.DateField(
        "Prazo para Defesa",
        null=True,
        blank=True,
        help_text="Data limite para apresentação da defesa"
    )
    
    prazo_recurso = models.DateField(
        "Prazo para Recurso",
        null=True, 
        blank=True,
        help_text="Data limite para apresentação do recurso"
    )
    
    # Datas de controle
    data_notificacao = models.DateField(
        "Data de Notificação",
        null=True,
        blank=True
    )
    
    data_defesa = models.DateField(
        "Data da Defesa",
        null=True,
        blank=True
    )
    
    data_recurso = models.DateField(
        "Data do Recurso", 
        null=True,
        blank=True
    )
    
    data_julgamento = models.DateField(
        "Data do Julgamento",
        null=True,
        blank=True
    )
    
    data_finalizacao = models.DateField(
        "Data de Finalização",
        null=True,
        blank=True
    )
    
    # Campos de valor e multa
    valor_multa = models.DecimalField(
        "Valor da Multa (R$)",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    valor_final = models.DecimalField(
        "Valor Final (R$)",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Valor após recursos e decisão final"
    )
    
    # Responsáveis pelo processo
    fiscal_responsavel = models.CharField(
        "Fiscal Responsável",
        max_length=255,
        blank=True,
        help_text="Fiscal que conduziu a fiscalização"
    )
    
    analista_responsavel = models.CharField(
        "Analista Responsável", 
        max_length=255,
        blank=True,
        help_text="Analista responsável pela análise do processo"
    )
    
    # Observações e anotações
    observacoes = models.TextField(
        "Observações",
        blank=True,
        help_text="Observações gerais sobre o processo"
    )
    
    observacoes_internas = models.TextField(
        "Observações Internas",
        blank=True,
        help_text="Observações internas não incluídas nos documentos"
    )
    
    # Metadados
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Processo Administrativo"
        verbose_name_plural = "Processos Administrativos"
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['numero_processo']),
            models.Index(fields=['status']),
            models.Index(fields=['prazo_defesa']),
            models.Index(fields=['prioridade']),
            models.Index(fields=['cnpj']),
        ]

    def __str__(self):
        return f"{self.numero_processo} - {self.autuado}"

    def save(self, *args, **kwargs):
        """Override do save para gerar número do processo automaticamente"""
        if not self.numero_processo:
            self.numero_processo = self._gerar_numero_processo()
        
        # Auto-preenche dados do auto de infração se disponível
        if self.auto_infracao_id and not self.autuado:
            self.autuado = self.auto_infracao.razao_social
            self.cnpj = self.auto_infracao.cnpj
            self.valor_multa = self.auto_infracao.valor_multa
            self.fiscal_responsavel = self.auto_infracao.fiscal_responsavel
        
        # Atualiza data de finalização se status for finalizado
        if self.status in ['finalizado_procedente', 'finalizado_improcedente', 'arquivado', 'prescrito']:
            if not self.data_finalizacao:
                self.data_finalizacao = timezone.now().date()
        
        super().save(*args, **kwargs)

    def _gerar_numero_processo(self):
        """Gera número sequencial para o processo"""
        ano = timezone.now().year
        ultimo = Processo.objects.filter(
            numero_processo__endswith=f"/{ano}"
        ).order_by('-id').first()
        
        seq = 1
        if ultimo and '-' in ultimo.numero_processo:
            try:
                seq = int(ultimo.numero_processo.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"PROC-{seq:05d}/{ano}"

    def clean(self):
        """Validações customizadas"""
        from django.core.exceptions import ValidationError
        
        # Validação de prazos
        if self.prazo_defesa and self.data_notificacao:
            if self.prazo_defesa <= self.data_notificacao:
                raise ValidationError({
                    'prazo_defesa': 'Prazo para defesa deve ser posterior à data de notificação'
                })
        
        if self.prazo_recurso and self.data_defesa:
            if self.prazo_recurso <= self.data_defesa:
                raise ValidationError({
                    'prazo_recurso': 'Prazo para recurso deve ser posterior à data da defesa'
                })
        
        # Validação de valores
        if self.valor_final and self.valor_multa:
            if self.valor_final > self.valor_multa:
                raise ValidationError({
                    'valor_final': 'Valor final não pode ser maior que o valor da multa original'
                })

    # === PROPRIEDADES CALCULADAS ===
    
    @property
    def dias_ate_prazo_defesa(self):
        """Calcula quantos dias faltam para o prazo de defesa"""
        if not self.prazo_defesa:
            return None
        
        hoje = timezone.now().date()
        diferenca = (self.prazo_defesa - hoje).days
        return diferenca if diferenca >= 0 else 0

    @property
    def dias_ate_prazo_recurso(self):
        """Calcula quantos dias faltam para o prazo de recurso"""
        if not self.prazo_recurso:
            return None
        
        hoje = timezone.now().date()
        diferenca = (self.prazo_recurso - hoje).days
        return diferenca if diferenca >= 0 else 0

    @property
    def prazo_vencido(self):
        """Verifica se algum prazo está vencido"""
        hoje = timezone.now().date()
        
        if self.status == 'aguardando_defesa' and self.prazo_defesa:
            return hoje > self.prazo_defesa
        
        if self.status == 'aguardando_recurso' and self.prazo_recurso:
            return hoje > self.prazo_recurso
        
        return False

    @property
    def tempo_tramitacao(self):
        """Calcula tempo de tramitação do processo em dias"""
        fim = self.data_finalizacao or timezone.now().date()
        return (fim - self.criado_em.date()).days

    @property
    def status_cor(self):
        """Retorna cor para exibição do status"""
        cores = {
            'aguardando_defesa': 'orange',
            'defesa_apresentada': 'blue', 
            'em_analise': 'purple',
            'aguardando_recurso': 'orange',
            'recurso_apresentado': 'blue',
            'julgamento': 'purple',
            'finalizado_procedente': 'green',
            'finalizado_improcedente': 'red',
            'arquivado': 'gray',
            'prescrito': 'gray',
        }
        return cores.get(self.status, 'gray')

    @property
    def prioridade_cor(self):
        """Retorna cor para exibição da prioridade"""
        cores = {
            'baixa': 'gray',
            'normal': 'blue',
            'alta': 'orange', 
            'urgente': 'red',
        }
        return cores.get(self.prioridade, 'blue')

    @property
    def pode_apresentar_defesa(self):
        """Verifica se ainda pode apresentar defesa"""
        return (
            self.status == 'aguardando_defesa' and
            self.prazo_defesa and
            timezone.now().date() <= self.prazo_defesa
        )

    @property
    def pode_apresentar_recurso(self):
        """Verifica se ainda pode apresentar recurso"""
        return (
            self.status == 'aguardando_recurso' and
            self.prazo_recurso and
            timezone.now().date() <= self.prazo_recurso
        )

    # === MÉTODOS DE NEGÓCIO ===
    
    def calcular_prazos(self):
        """Calcula prazos baseados na data de notificação"""
        if not self.data_notificacao:
            return
        
        # Prazo padrão: 15 dias para defesa
        if not self.prazo_defesa:
            self.prazo_defesa = self.data_notificacao + timezone.timedelta(days=15)
        
        # Prazo padrão: 10 dias para recurso (será calculado após defesa)
        # self.prazo_recurso será definido quando defesa for apresentada

    def atualizar_status(self, novo_status, observacao=""):
        """Atualiza status do processo e registra no histórico"""
        status_anterior = self.status
        self.status = novo_status
        
        # Atualiza datas específicas
        hoje = timezone.now().date()
        
        if novo_status == 'defesa_apresentada' and not self.data_defesa:
            self.data_defesa = hoje
            # Calcula prazo para recurso (10 dias após defesa)
            self.prazo_recurso = hoje + timezone.timedelta(days=10)
        
        elif novo_status == 'recurso_apresentado' and not self.data_recurso:
            self.data_recurso = hoje
        
        elif novo_status in ['finalizado_procedente', 'finalizado_improcedente', 'arquivado']:
            if not self.data_finalizacao:
                self.data_finalizacao = hoje
        
        self.save()
        
        # Registra mudança no histórico (se modelo existir)
        try:
            HistoricoProcesso.objects.create(
                processo=self,
                status_anterior=status_anterior,
                status_novo=novo_status,
                observacao=observacao,
                data_mudanca=timezone.now()
            )
        except:
            pass  # Se modelo HistoricoProcesso não existir ainda

    def gerar_numero_defesa(self):
        """Gera número para documento de defesa"""
        return f"DEF-{self.numero_processo.replace('PROC-', '')}"

    def gerar_numero_recurso(self):
        """Gera número para documento de recurso"""
        return f"REC-{self.numero_processo.replace('PROC-', '')}"


# === MODELO PARA HISTÓRICO DE MUDANÇAS ===
class HistoricoProcesso(models.Model):
    """
    Registra todas as mudanças de status do processo
    """
    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name='historico'
    )
    
    status_anterior = models.CharField(
        "Status Anterior",
        max_length=50,
        blank=True,
        null=True
    )
    
    status_novo = models.CharField(
        "Status Novo", 
        max_length=50
    )
    
    observacao = models.TextField(
        "Observação",
        blank=True
    )
    
    usuario = models.CharField(
        "Usuário",
        max_length=255,
        blank=True,
        help_text="Usuário que fez a alteração"
    )
    
    data_mudanca = models.DateTimeField(
        "Data da Mudança",
        auto_now_add=True
    )

    class Meta:
        verbose_name = "Histórico do Processo"
        verbose_name_plural = "Históricos dos Processos"
        ordering = ['-data_mudanca']

    def __str__(self):
        return f"{self.processo.numero_processo} - {self.status_anterior} → {self.status_novo}"


# === MODELO PARA DOCUMENTOS DO PROCESSO ===
class DocumentoProcesso(models.Model):
    """
    Armazena documentos relacionados ao processo (defesas, recursos, etc.)
    """
    TIPO_DOCUMENTO_CHOICES = [
        ('defesa', 'Defesa'),
        ('recurso', 'Recurso'),
        ('parecer', 'Parecer Técnico'),
        ('decisao', 'Decisão'),
        ('outros', 'Outros'),
    ]
    
    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name='documentos'
    )
    
    tipo = models.CharField(
        "Tipo do Documento",
        max_length=20,
        choices=TIPO_DOCUMENTO_CHOICES
    )
    
    titulo = models.CharField(
        "Título",
        max_length=255
    )
    
    arquivo = models.FileField(
        "Arquivo",
        upload_to='processos/documentos/%Y/%m/'
    )
    
    descricao = models.TextField(
        "Descrição",
        blank=True
    )
    
    data_upload = models.DateTimeField(
        "Data do Upload",
        auto_now_add=True
    )
    
    usuario_upload = models.CharField(
        "Usuário",
        max_length=255,
        blank=True
    )

    class Meta:
        verbose_name = "Documento do Processo"
        verbose_name_plural = "Documentos dos Processos"
        ordering = ['-data_upload']

    def __str__(self):
        return f"{self.processo.numero_processo} - {self.get_tipo_display()}"

# === MODELOS AVANÇADOS PARA FISCALIZAÇÃO ===

class TipoFiscalizacao(models.Model):
    """Tipos de fiscalização disponíveis"""
    TIPO_CHOICES = [
        ('PRESENCIAL', 'Fiscalização Presencial'),
        ('REMOTA', 'Fiscalização Remota'),
        ('DENUNCIA', 'Denúncia'),
        ('ACAO_PREVENTIVA', 'Ação Preventiva'),
        ('FORCA_TAREFA', 'Força Tarefa'),
        ('MONITORAMENTO', 'Monitoramento'),
        ('AUDITORIA', 'Auditoria'),
    ]
    
    nome = models.CharField("Nome", max_length=100)
    tipo = models.CharField("Tipo", max_length=20, choices=TIPO_CHOICES)
    descricao = models.TextField("Descrição", blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Tipo de Fiscalização"
        verbose_name_plural = "Tipos de Fiscalização"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"


class EvidenciaFiscalizacao(models.Model):
    """Evidências coletadas durante fiscalização"""
    TIPO_CHOICES = [
        ('FOTO', 'Foto'),
        ('VIDEO', 'Vídeo'),
        ('DOCUMENTO', 'Documento'),
        ('AUDIO', 'Áudio'),
        ('OUTROS', 'Outros'),
    ]
    
    auto_infracao = models.ForeignKey(AutoInfracao, on_delete=models.CASCADE, related_name='evidencias')
    tipo = models.CharField("Tipo", max_length=20, choices=TIPO_CHOICES)
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    arquivo = models.FileField("Arquivo", upload_to='evidencias_fiscalizacao/')
    nome_arquivo = models.CharField("Nome do Arquivo", max_length=255, blank=True)
    tamanho_arquivo = models.IntegerField("Tamanho (bytes)", null=True, blank=True)
    data_upload = models.DateTimeField("Data de Upload", auto_now_add=True)
    upload_por = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='evidencias_upload')
    
    class Meta:
        verbose_name = "Evidência de Fiscalização"
        verbose_name_plural = "Evidências de Fiscalização"
        ordering = ['-data_upload']
    
    def __str__(self):
        return f"{self.titulo} - {self.auto_infracao.numero}"
    
    def save(self, *args, **kwargs):
        if self.arquivo:
            self.nome_arquivo = self.arquivo.name
            self.tamanho_arquivo = self.arquivo.size
        super().save(*args, **kwargs)


class AutoInfracaoAvancado(models.Model):
    """Auto de infração com funcionalidades avançadas"""
    auto_infracao = models.OneToOneField(AutoInfracao, on_delete=models.CASCADE, related_name='avancado')
    
    # === GERAÇÃO AUTOMÁTICA ===
    gerado_automaticamente = models.BooleanField("Gerado Automaticamente", default=False)
    template_utilizado = models.CharField("Template Utilizado", max_length=100, blank=True)
    data_geracao = models.DateTimeField("Data de Geração", auto_now_add=True)
    gerado_por = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='autos_gerados')
    
    # === ASSINATURA DIGITAL ===
    assinatura_digital = models.BooleanField("Assinatura Digital", default=False)
    certificado_assinatura = models.CharField("Certificado de Assinatura", max_length=255, blank=True)
    data_assinatura = models.DateTimeField("Data de Assinatura", null=True, blank=True)
    assinado_por = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='autos_assinados')
    
    # === NOTIFICAÇÃO ELETRÔNICA ===
    notificacao_eletronica = models.BooleanField("Notificação Eletrônica", default=False)
    email_notificacao = models.EmailField("Email de Notificação", blank=True)
    data_notificacao = models.DateTimeField("Data de Notificação", null=True, blank=True)
    protocolo_notificacao = models.CharField("Protocolo de Notificação", max_length=100, blank=True)
    
    # === CONTROLE DE PRAZOS ===
    prazo_defesa = models.IntegerField("Prazo para Defesa (dias)", default=30)
    data_limite_defesa = models.DateField("Data Limite para Defesa", null=True, blank=True)
    prazo_pagamento = models.IntegerField("Prazo para Pagamento (dias)", default=30)
    data_limite_pagamento = models.DateField("Data Limite para Pagamento", null=True, blank=True)
    
    # === WORKFLOW ===
    STATUS_WORKFLOW_CHOICES = [
        ('RASCUNHO', 'Rascunho'),
        ('EM_ANALISE', 'Em Análise'),
        ('APROVADO', 'Aprovado'),
        ('ASSINADO', 'Assinado'),
        ('NOTIFICADO', 'Notificado'),
        ('EM_DEFESA', 'Em Defesa'),
        ('JULGADO', 'Julgado'),
        ('PAGO', 'Pago'),
        ('CANCELADO', 'Cancelado'),
    ]
    status_workflow = models.CharField("Status do Workflow", max_length=20, choices=STATUS_WORKFLOW_CHOICES, default='RASCUNHO')
    
    # === METADADOS ===
    versao_documento = models.CharField("Versão do Documento", max_length=20, default='1.0')
    hash_documento = models.CharField("Hash do Documento", max_length=64, blank=True)
    data_modificacao = models.DateTimeField("Data de Modificação", auto_now=True)
    modificado_por = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='autos_modificados')
    
    class Meta:
        verbose_name = "Auto de Infração Avançado"
        verbose_name_plural = "Autos de Infração Avançados"
        ordering = ['-data_modificacao']
    
    def __str__(self):
        return f"Auto Avançado - {self.auto_infracao.numero}"
    
    def calcular_prazos(self):
        """Calcula automaticamente os prazos baseado na data de notificação"""
        if self.data_notificacao:
            from datetime import timedelta
            data_notif = self.data_notificacao.date()
            self.data_limite_defesa = data_notif + timedelta(days=self.prazo_defesa)
            self.data_limite_pagamento = data_notif + timedelta(days=self.prazo_pagamento)
            self.save()
    
    @property
    def dias_restantes_defesa(self):
        """Retorna dias restantes para defesa"""
        if self.data_limite_defesa:
            from datetime import date
            delta = self.data_limite_defesa - date.today()
            return delta.days
        return None
    
    @property
    def dias_restantes_pagamento(self):
        """Retorna dias restantes para pagamento"""
        if self.data_limite_pagamento:
            from datetime import date
            delta = self.data_limite_pagamento - date.today()
            return delta.days
        return None
    
    @property
    def esta_atrasado_defesa(self):
        """Verifica se está atrasado para defesa"""
        if self.data_limite_defesa and self.status_workflow not in ['EM_DEFESA', 'JULGADO', 'PAGO', 'CANCELADO']:
            from datetime import date
            return date.today() > self.data_limite_defesa
        return False
    
    @property
    def esta_atrasado_pagamento(self):
        """Verifica se está atrasado para pagamento"""
        if self.data_limite_pagamento and self.status_workflow not in ['PAGO', 'CANCELADO']:
            from datetime import date
            return date.today() > self.data_limite_pagamento
        return False


class HistoricoAutoInfracao(models.Model):
    """Histórico de mudanças no auto de infração"""
    auto_infracao = models.ForeignKey(AutoInfracao, on_delete=models.CASCADE, related_name='historico')
    usuario = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='historico_autos')
    acao = models.CharField("Ação", max_length=100)
    descricao = models.TextField("Descrição")
    dados_anteriores = models.JSONField("Dados Anteriores", null=True, blank=True)
    dados_novos = models.JSONField("Dados Novos", null=True, blank=True)
    data_acao = models.DateTimeField("Data da Ação", auto_now_add=True)
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    
    class Meta:
        verbose_name = "Histórico de Auto de Infração"
        verbose_name_plural = "Histórico de Autos de Infração"
        ordering = ['-data_acao']
    
    def __str__(self):
        return f"{self.auto_infracao.numero} - {self.acao} - {self.data_acao}"


class TemplateAutoInfracao(models.Model):
    """Templates para geração automática de autos de infração"""
    nome = models.CharField("Nome", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    tipo_fiscalizacao = models.ForeignKey(TipoFiscalizacao, on_delete=models.CASCADE, related_name='templates')
    
    # === CONFIGURAÇÃO DO TEMPLATE ===
    configuracao = models.JSONField("Configuração", default=dict)
    campos_obrigatorios = models.JSONField("Campos Obrigatórios", default=list)
    campos_opcionais = models.JSONField("Campos Opcionais", default=list)
    
    # === BASE LEGAL ===
    base_legal_padrao = models.TextField("Base Legal Padrão", blank=True)
    fundamentacao_padrao = models.TextField("Fundamentação Padrão", blank=True)
    
    # === VALORES PADRÃO ===
    valor_multa_padrao = models.DecimalField("Valor da Multa Padrão", max_digits=12, decimal_places=2, null=True, blank=True)
    prazo_defesa_padrao = models.IntegerField("Prazo para Defesa Padrão (dias)", default=30)
    prazo_pagamento_padrao = models.IntegerField("Prazo para Pagamento Padrão (dias)", default=30)
    
    # === STATUS ===
    ativo = models.BooleanField("Ativo", default=True)
    padrao = models.BooleanField("Template Padrão", default=False)
    criado_por = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='templates_fiscalizacao_criados')
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Template de Auto de Infração"
        verbose_name_plural = "Templates de Autos de Infração"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} - {self.tipo_fiscalizacao.nome}"
    
    def save(self, *args, **kwargs):
        # Se este template for definido como padrão, remove o padrão dos outros
        if self.padrao:
            TemplateAutoInfracao.objects.filter(
                tipo_fiscalizacao=self.tipo_fiscalizacao,
                padrao=True
            ).exclude(id=self.id).update(padrao=False)
        super().save(*args, **kwargs)


class NotificacaoEletronica(models.Model):
    """Sistema de notificações eletrônicas"""
    TIPO_CHOICES = [
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('PUSH', 'Push Notification'),
        ('WHATSAPP', 'WhatsApp'),
    ]
    
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('ENVIADA', 'Enviada'),
        ('ENTREGUE', 'Entregue'),
        ('ERRO', 'Erro'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    auto_infracao = models.ForeignKey(AutoInfracao, on_delete=models.CASCADE, related_name='notificacoes')
    tipo = models.CharField("Tipo", max_length=20, choices=TIPO_CHOICES)
    destinatario = models.CharField("Destinatário", max_length=255)
    assunto = models.CharField("Assunto", max_length=200)
    mensagem = models.TextField("Mensagem")
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    
    # === METADADOS ===
    protocolo = models.CharField("Protocolo", max_length=100, blank=True)
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    data_entrega = models.DateTimeField("Data de Entrega", null=True, blank=True)
    tentativas = models.IntegerField("Tentativas", default=0)
    erro_mensagem = models.TextField("Mensagem de Erro", blank=True)
    
    # === RESPONSÁVEL ===
    enviado_por = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='notificacoes_fiscalizacao_enviadas')
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Notificação Eletrônica"
        verbose_name_plural = "Notificações Eletrônicas"
        ordering = ['-data_criacao']
    
    def __str__(self):
        return f"{self.tipo} - {self.destinatario} - {self.auto_infracao.numero}"
    
    def gerar_protocolo(self):
        """Gera protocolo único para a notificação"""
        from datetime import datetime
        import random
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        self.protocolo = f"NOT{timestamp}{random_num}"
        self.save()
    
    def marcar_enviada(self):
        """Marca a notificação como enviada"""
        from django.utils import timezone
        self.status = 'ENVIADA'
        self.data_envio = timezone.now()
        self.save()
    
    def marcar_entregue(self):
        """Marca a notificação como entregue"""
        from django.utils import timezone
        self.status = 'ENTREGUE'
        self.data_entrega = timezone.now()
        self.save()
    
    def registrar_erro(self, erro):
        """Registra erro na notificação"""
        self.status = 'ERRO'
        self.erro_mensagem = str(erro)
        self.tentativas += 1
        self.save()


class ConfiguracaoFiscalizacao(models.Model):
    """Configurações do sistema de fiscalização"""
    # === CONFIGURAÇÕES GERAIS ===
    max_evidencias_por_auto = models.IntegerField("Máximo de Evidências por Auto", default=10)
    max_tamanho_arquivo = models.IntegerField("Máximo Tamanho de Arquivo (MB)", default=50)
    tipos_arquivo_permitidos = models.JSONField("Tipos de Arquivo Permitidos", default=list)
    
    # === CONFIGURAÇÕES DE NOTIFICAÇÃO ===
    notificar_prazos = models.BooleanField("Notificar Prazos", default=True)
    dias_antecedencia_prazo = models.IntegerField("Dias de Antecedência para Prazo", default=5)
    notificar_atrasos = models.BooleanField("Notificar Atrasos", default=True)
    
    # === CONFIGURAÇÕES DE ASSINATURA ===
    assinatura_digital_obrigatoria = models.BooleanField("Assinatura Digital Obrigatória", default=False)
    certificado_padrao = models.CharField("Certificado Padrão", max_length=255, blank=True)
    
    # === CONFIGURAÇÕES DE WORKFLOW ===
    workflow_automatico = models.BooleanField("Workflow Automático", default=True)
    aprovacao_obrigatoria = models.BooleanField("Aprovação Obrigatória", default=True)
    
    # === METADADOS ===
    configurado_por = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='configuracoes_fiscalizacao')
    data_configuracao = models.DateTimeField("Data de Configuração", auto_now=True)
    
    class Meta:
        verbose_name = "Configuração de Fiscalização"
        verbose_name_plural = "Configurações de Fiscalização"
    
    def __str__(self):
        return f"Configuração de Fiscalização - {self.data_configuracao}"
    
    @classmethod
    def get_configuracao(cls):
        """Retorna a configuração atual ou cria uma nova"""
        config, created = cls.objects.get_or_create(
            defaults={
                'tipos_arquivo_permitidos': ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'mp4', 'avi'],
            }
        )
        return config

class AutoApreensaoInutilizacao(models.Model):
    """
    Auto de Apreensão/Inutilização - Formulário único que faz ambos
    Baseado no formulário oficial do PROCON-AM
    """
    TIPO_CHOICES = [
        ('apreensao', 'Auto de Apreensão'),
        ('inutilizacao', 'Inutilização'),
    ]
    
    # Referência ao Auto de Constatação (Supermercado)
    auto_constatacao = models.ForeignKey(
        'AutoSupermercado', 
        on_delete=models.CASCADE, 
        verbose_name="Auto de Constatação",
        related_name='autos_apreensao_inutilizacao',
        null=True,
        blank=True
    )
    
    # Identificação do documento
    tipo_documento = models.CharField(max_length=20, choices=TIPO_CHOICES, default='apreensao')
    numero_documento = models.CharField(max_length=20, blank=True)
    ano_documento = models.IntegerField(default=datetime.now().year)
    
    # Estabelecimento fiscalizado
    razao_social = models.CharField(max_length=200, verbose_name="Razão Social")
    nome_fantasia = models.CharField(max_length=200, verbose_name="Nome Fantasia")
    atividade = models.CharField(max_length=200, verbose_name="Atividade")
    endereco = models.TextField(verbose_name="Endereço")
    cep = models.CharField(max_length=10, verbose_name="CEP")
    municipio = models.CharField(max_length=100, verbose_name="Município")
    estado = models.CharField(max_length=2, default="AM", verbose_name="Estado")
    cnpj = models.CharField(max_length=18, verbose_name="CNPJ")
    telefone = models.CharField(max_length=20, verbose_name="Telefone")
    
    # Justificativa legal
    cominacao_legal = models.TextField(verbose_name="Cominação Legal")
    auto_constatacao_numero = models.CharField(max_length=20, verbose_name="Auto de Constatação Nº")
    
    # Itens apreendidos/inutilizados
    itens = models.JSONField(default=list, verbose_name="Lista de Itens")
    
    # Perícia
    necessita_pericia = models.BooleanField(default=False, verbose_name="Necessita Perícia")
    justificativa_pericia = models.TextField(blank=True, verbose_name="Justificativa")
    
    # Data e hora
    local = models.CharField(max_length=200, verbose_name="Local")
    data_fiscalizacao = models.DateField(verbose_name="Data")
    hora_inicio = models.TimeField(verbose_name="Hora do Início")
    hora_termino = models.TimeField(verbose_name="Hora do Término")
    
    # Assinaturas
    fiscal_1 = models.CharField(max_length=100, verbose_name="Fiscal 1")
    fiscal_2 = models.CharField(max_length=100, verbose_name="Fiscal 2")
    responsavel_estabelecimento = models.CharField(max_length=100, verbose_name="Nome do Responsável")
    cpf_responsavel = models.CharField(max_length=14, verbose_name="CPF do Responsável")
    
    # Metadados
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    
    class Meta:
        verbose_name = "Auto de Apreensão/Inutilização"
        verbose_name_plural = "Autos de Apreensão/Inutilização"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_tipo_documento_display()} Nº {self.numero_documento}/{self.ano_documento} - {self.nome_fantasia}"
    
    def get_numero_completo(self):
        """Retorna o número completo do documento"""
        return f"{self.numero_documento}/{self.ano_documento}"
    
    def get_total_itens(self):
        """Retorna o total de itens apreendidos/inutilizados"""
        return len(self.itens)
    
    def save(self, *args, **kwargs):
        """Gera número automaticamente e preenche dados do auto de constatação"""
        # Gerar número do documento se não existir
        if not self.numero_documento:
            from .utils import gerar_proximo_numero_auto_apreensao
            self.numero_documento = gerar_proximo_numero_auto_apreensao()
        
        # Preencher dados do auto de constatação se existir
        if self.auto_constatacao and not self.pk:  # Apenas na criação
            self.razao_social = self.auto_constatacao.razao_social
            self.nome_fantasia = self.auto_constatacao.nome_fantasia
            self.atividade = self.auto_constatacao.atividade
            self.endereco = self.auto_constatacao.endereco
            self.cep = self.auto_constatacao.cep
            self.municipio = self.auto_constatacao.municipio
            self.estado = self.auto_constatacao.estado
            self.cnpj = self.auto_constatacao.cnpj
            self.telefone = self.auto_constatacao.telefone
            self.auto_constatacao_numero = self.auto_constatacao.numero
            self.data_fiscalizacao = self.auto_constatacao.data_fiscalizacao
            self.hora_inicio = self.auto_constatacao.hora_fiscalizacao
            self.fiscal_1 = self.auto_constatacao.fiscal_nome_1 or ''
            self.fiscal_2 = self.auto_constatacao.fiscal_nome_2 or ''
            self.responsavel_estabelecimento = self.auto_constatacao.responsavel_nome or ''
            self.cpf_responsavel = self.auto_constatacao.responsavel_cpf or ''
        
        super().save(*args, **kwargs)
    
    def get_valor_total(self):
        """Calcula o valor total dos itens"""
        total = 0
        for item in self.itens:
            valor = item.get('valor_unitario', 0) * item.get('quantidade', 0)
            total += valor
        return total

class ItemApreensaoInutilizacao(models.Model):
    """
    Item individual apreendido ou inutilizado
    """
    auto = models.ForeignKey(AutoApreensaoInutilizacao, on_delete=models.CASCADE, related_name='itens_detalhados')
    item = models.CharField(max_length=100, verbose_name="Item")
    quantidade = models.IntegerField(verbose_name="Quantidade")
    unidade = models.CharField(max_length=20, verbose_name="Unidade")
    especificacao = models.TextField(verbose_name="Especificação")
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Unitário")
    motivo_apreensao = models.TextField(verbose_name="Motivo da Apreensão/Inutilização")
    
    class Meta:
        verbose_name = "Item Apreendido/Inutilizado"
        verbose_name_plural = "Itens Apreendidos/Inutilizados"
    
    def __str__(self):
        return f"{self.item} - {self.quantidade} {self.unidade}"
    
    def get_valor_total(self):
        """Calcula o valor total do item"""
        return self.valor_unitario * self.quantidade

# --- MODELOS PARA UPLOAD DE EVIDÊNCIAS FOTOGRÁFICAS ---
class EvidenciaFotografica(models.Model):
    TIPO_EVIDENCIA_CHOICES = [
        ('irregularidade', 'Irregularidade'),
        ('documento', 'Documento'),
        ('ambiente', 'Ambiente'),
        ('produto', 'Produto'),
        ('outros', 'Outros'),
    ]
    
    auto = models.ForeignKey('AutoBanco', on_delete=models.CASCADE, related_name='evidencias', null=True, blank=True)
    auto_posto = models.ForeignKey('AutoPosto', on_delete=models.CASCADE, related_name='evidencias', null=True, blank=True)
    auto_supermercado = models.ForeignKey('AutoSupermercado', on_delete=models.CASCADE, related_name='evidencias', null=True, blank=True)
    auto_diversos = models.ForeignKey('AutoDiversos', on_delete=models.CASCADE, related_name='evidencias', null=True, blank=True)
    
    tipo_evidencia = models.CharField("Tipo de Evidência", max_length=20, choices=TIPO_EVIDENCIA_CHOICES)
    descricao = models.TextField("Descrição da Evidência")
    foto = models.ImageField("Foto", upload_to='evidencias_fiscais/')
    data_upload = models.DateTimeField("Data do Upload", auto_now_add=True)
    fiscal_upload = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, verbose_name="Fiscal Responsável")
    
    class Meta:
        verbose_name = "Evidência Fotográfica"
        verbose_name_plural = "Evidências Fotográficas"
        ordering = ['-data_upload']
    
    def __str__(self):
        return f"Evidência {self.id} - {self.tipo_evidencia}"


# --- SISTEMA DE ASSINATURA DIGITAL ---
class AssinaturaDigital(models.Model):
    TIPO_ASSINATURA_CHOICES = [
        ('fiscal_1', 'Fiscal 1'),
        ('fiscal_2', 'Fiscal 2'),
        ('responsavel', 'Responsável'),
        ('testemunha', 'Testemunha'),
    ]
    
    STATUS_ASSINATURA_CHOICES = [
        ('pendente', 'Pendente'),
        ('assinado', 'Assinado'),
        ('rejeitado', 'Rejeitado'),
        ('expirado', 'Expirado'),
    ]
    
    auto = models.ForeignKey('AutoBanco', on_delete=models.CASCADE, related_name='assinaturas_digitais', null=True, blank=True)
    auto_posto = models.ForeignKey('AutoPosto', on_delete=models.CASCADE, related_name='assinaturas_digitais', null=True, blank=True)
    auto_supermercado = models.ForeignKey('AutoSupermercado', on_delete=models.CASCADE, related_name='assinaturas_digitais', null=True, blank=True)
    auto_diversos = models.ForeignKey('AutoDiversos', on_delete=models.CASCADE, related_name='assinaturas_digitais', null=True, blank=True)
    
    tipo_assinatura = models.CharField("Tipo de Assinatura", max_length=20, choices=TIPO_ASSINATURA_CHOICES)
    nome_assinante = models.CharField("Nome do Assinante", max_length=255)
    cpf_assinante = models.CharField("CPF do Assinante", max_length=14)
    email_assinante = models.EmailField("Email do Assinante", blank=True)
    
    # Assinatura digital (hash criptográfico)
    hash_assinatura = models.CharField("Hash da Assinatura", max_length=255, blank=True)
    certificado_digital = models.TextField("Certificado Digital", blank=True)
    
    # Status e controle
    status = models.CharField("Status", max_length=20, choices=STATUS_ASSINATURA_CHOICES, default='pendente')
    data_assinatura = models.DateTimeField("Data da Assinatura", null=True, blank=True)
    data_expiracao = models.DateTimeField("Data de Expiração")
    ip_assinatura = models.GenericIPAddressField("IP da Assinatura", null=True, blank=True)
    user_agent = models.TextField("User Agent", blank=True)
    
    # Assinatura manual (imagem)
    assinatura_manual = models.ImageField("Assinatura Manual", upload_to='assinaturas_manuais/', blank=True, null=True)
    
    class Meta:
        verbose_name = "Assinatura Digital"
        verbose_name_plural = "Assinaturas Digitais"
        ordering = ['-data_assinatura']
    
    def __str__(self):
        return f"Assinatura {self.tipo_assinatura} - {self.nome_assinante}"
    
    def is_expired(self):
        return timezone.now() > self.data_expiracao


# --- SISTEMA DE NOTIFICAÇÃO ELETRÔNICA ---
class NotificacaoEletronica(models.Model):
    TIPO_NOTIFICACAO_CHOICES = [
        ('auto_infracao', 'Auto de Infração'),
        ('prazo_vencendo', 'Prazo Vencendo'),
        ('prazo_vencido', 'Prazo Vencido'),
        ('defesa_apresentada', 'Defesa Apresentada'),
        ('recurso_apresentado', 'Recurso Apresentado'),
        ('decisao_proferida', 'Decisão Proferida'),
    ]
    
    STATUS_NOTIFICACAO_CHOICES = [
        ('pendente', 'Pendente'),
        ('enviada', 'Enviada'),
        ('entregue', 'Entregue'),
        ('lida', 'Lida'),
        ('erro', 'Erro'),
    ]
    
    auto = models.ForeignKey('AutoBanco', on_delete=models.CASCADE, related_name='notificacoes', null=True, blank=True)
    auto_posto = models.ForeignKey('AutoPosto', on_delete=models.CASCADE, related_name='notificacoes', null=True, blank=True)
    auto_supermercado = models.ForeignKey('AutoSupermercado', on_delete=models.CASCADE, related_name='notificacoes', null=True, blank=True)
    auto_diversos = models.ForeignKey('AutoDiversos', on_delete=models.CASCADE, related_name='notificacoes', null=True, blank=True)
    
    tipo_notificacao = models.CharField("Tipo de Notificação", max_length=20, choices=TIPO_NOTIFICACAO_CHOICES)
    destinatario_nome = models.CharField("Nome do Destinatário", max_length=255)
    destinatario_email = models.EmailField("Email do Destinatário", blank=True, null=True)
    destinatario_cpf_cnpj = models.CharField("CPF/CNPJ do Destinatário", max_length=18, blank=True, null=True)
    
    assunto = models.CharField("Assunto", max_length=255)
    mensagem = models.TextField("Mensagem")
    anexos = models.JSONField("Anexos", default=list, blank=True)
    
    # Controle de envio
    status = models.CharField("Status", max_length=20, choices=STATUS_NOTIFICACAO_CHOICES, default='pendente')
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    data_entrega = models.DateTimeField("Data de Entrega", null=True, blank=True)
    data_leitura = models.DateTimeField("Data de Leitura", null=True, blank=True)
    
    # Tentativas de envio
    tentativas_envio = models.IntegerField("Tentativas de Envio", default=0)
    max_tentativas = models.IntegerField("Máximo de Tentativas", default=3)
    proxima_tentativa = models.DateTimeField("Próxima Tentativa", null=True, blank=True)
    
    # Logs
    logs_envio = models.JSONField("Logs de Envio", default=list, blank=True)
    
    class Meta:
        verbose_name = "Notificação Eletrônica"
        verbose_name_plural = "Notificações Eletrônicas"
        ordering = ['-data_envio']
    
    def __str__(self):
        return f"Notificação {self.tipo_notificacao} - {self.destinatario_nome}"


# --- CONTROLE DE PRAZOS AVANÇADO ---
class ControlePrazos(models.Model):
    TIPO_PRAZO_CHOICES = [
        ('defesa', 'Prazo para Defesa'),
        ('recurso', 'Prazo para Recurso'),
        ('envio_documentos', 'Prazo para Envio de Documentos'),
        ('pagamento', 'Prazo para Pagamento'),
        ('compliance', 'Prazo para Compliance'),
        ('outros', 'Outros'),
    ]
    
    STATUS_PRAZO_CHOICES = [
        ('ativo', 'Ativo'),
        ('vencendo', 'Vencendo'),
        ('vencido', 'Vencido'),
        ('prorrogado', 'Prorrogado'),
        ('suspenso', 'Suspenso'),
        ('finalizado', 'Finalizado'),
    ]
    
    auto = models.ForeignKey('AutoBanco', on_delete=models.CASCADE, related_name='prazos', null=True, blank=True)
    auto_posto = models.ForeignKey('AutoPosto', on_delete=models.CASCADE, related_name='prazos', null=True, blank=True)
    auto_supermercado = models.ForeignKey('AutoSupermercado', on_delete=models.CASCADE, related_name='prazos', null=True, blank=True)
    auto_diversos = models.ForeignKey('AutoDiversos', on_delete=models.CASCADE, related_name='prazos', null=True, blank=True)
    
    tipo_prazo = models.CharField("Tipo de Prazo", max_length=20, choices=TIPO_PRAZO_CHOICES)
    descricao = models.TextField("Descrição do Prazo")
    
    # Datas do prazo
    data_inicio = models.DateTimeField("Data de Início")
    data_fim = models.DateTimeField("Data de Fim")
    data_prorrogacao = models.DateTimeField("Data de Prorrogação", null=True, blank=True)
    
    # Controle de status
    status = models.CharField("Status", max_length=20, choices=STATUS_PRAZO_CHOICES, default='ativo')
    dias_restantes = models.IntegerField("Dias Restantes", null=True, blank=True)
    
    # Alertas
    alerta_5_dias = models.BooleanField("Alerta 5 dias antes", default=False)
    alerta_3_dias = models.BooleanField("Alerta 3 dias antes", default=False)
    alerta_1_dia = models.BooleanField("Alerta 1 dia antes", default=False)
    alerta_vencido = models.BooleanField("Alerta vencido", default=False)
    
    # Responsáveis
    responsavel = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, verbose_name="Responsável")
    notificar_emails = models.JSONField("Emails para Notificação", default=list, blank=True)
    
    # Histórico
    historico_alteracoes = models.JSONField("Histórico de Alterações", default=list, blank=True)
    
    class Meta:
        verbose_name = "Controle de Prazo"
        verbose_name_plural = "Controle de Prazos"
        ordering = ['data_fim']
    
    def __str__(self):
        return f"Prazo {self.tipo_prazo} - {self.descricao}"
    
    def calcular_dias_restantes(self):
        """Calcula os dias restantes até o vencimento"""
        if self.data_fim:
            delta = self.data_fim - timezone.now()
            return max(0, delta.days)
        return None
    
    def is_vencendo(self):
        """Verifica se o prazo está vencendo (5 dias ou menos)"""
        dias_restantes = self.calcular_dias_restantes()
        return dias_restantes is not None and 0 <= dias_restantes <= 5
    
    def is_vencido(self):
        """Verifica se o prazo está vencido"""
        dias_restantes = self.calcular_dias_restantes()
        return dias_restantes is not None and dias_restantes < 0
    
    def save(self, *args, **kwargs):
        # Atualiza os dias restantes antes de salvar
        self.dias_restantes = self.calcular_dias_restantes()
        super().save(*args, **kwargs)


# --- CONFIGURAÇÕES DE FISCALIZAÇÃO ---
class ConfiguracaoFiscalizacao(models.Model):
    """Configurações gerais do módulo de fiscalização"""
    
    # Configurações de upload
    max_tamanho_arquivo = models.IntegerField("Tamanho Máximo de Arquivo (MB)", default=10)
    tipos_arquivo_permitidos = models.JSONField("Tipos de Arquivo Permitidos", default=list)
    max_arquivos_por_auto = models.IntegerField("Máximo de Arquivos por Auto", default=20)
    
    # Configurações de assinatura digital
    assinatura_digital_obrigatoria = models.BooleanField("Assinatura Digital Obrigatória", default=True)
    prazo_assinatura_dias = models.IntegerField("Prazo para Assinatura (dias)", default=7)
    certificado_digital_obrigatorio = models.BooleanField("Certificado Digital Obrigatório", default=False)
    
    # Configurações de notificação
    notificacao_automatica = models.BooleanField("Notificação Automática", default=True)
    email_notificacao = models.EmailField("Email para Notificações", blank=True)
    sms_notificacao = models.CharField("SMS para Notificações", max_length=20, blank=True)
    
    # Configurações de prazos
    prazo_defesa_dias = models.IntegerField("Prazo para Defesa (dias)", default=15)
    prazo_recurso_dias = models.IntegerField("Prazo para Recurso (dias)", default=10)
    alerta_prazo_dias = models.IntegerField("Alerta de Prazo (dias antes)", default=5)
    
    # Configurações de backup
    backup_automatico = models.BooleanField("Backup Automático", default=True)
    retencao_backup_dias = models.IntegerField("Retenção de Backup (dias)", default=365)
    
    class Meta:
        verbose_name = "Configuração de Fiscalização"
        verbose_name_plural = "Configurações de Fiscalização"
    
    def __str__(self):
        return "Configurações de Fiscalização"
    
    @classmethod
    def get_config(cls):
        """Retorna a configuração atual ou cria uma nova"""
        config, created = cls.objects.get_or_create(pk=1)
        if created:
            # Configurações padrão
            config.tipos_arquivo_permitidos = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
            config.save()
        return config
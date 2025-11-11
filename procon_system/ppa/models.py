from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import uuid
import datetime


class ProcedimentoPreAdministrativo(models.Model):
    """
    PPA - Procedimento Preliminar Administrativo
    Capa do processo onde se anexa todos os documentos (AC, AI, NOT, Defesas, etc)
    """
    
    STATUS_CHOICES = [
        ('criado', 'Criado'),
        ('em_analise', 'Em Análise'),
        ('notificado', 'Notificado'),
        ('aguardando_resposta', 'Aguardando Resposta'),
        ('com_defesa', 'Com Defesa'),
        ('parecer_elaborado', 'Parecer Elaborado'),
        ('concluido', 'Concluído'),
        ('arquivado', 'Arquivado'),
    ]
    
    DECISAO_CHOICES = [
        ('pendente', 'Pendente'),
        ('arquivado', 'Arquivado - Sem Fundamento'),
        ('auto_criado', 'Auto de Infração Criado'),
        ('encaminhado', 'Encaminhado para Outro Órgão'),
    ]
    
    SIGLA_CHOICES = [
        ('BANCO', 'Banco'),
        ('POSTO', 'Posto de Combustível'),
        ('SUPERMERCADO', 'Supermercado'),
        ('DIVERSOS', 'Diversos'),
        ('TELECOMUNICACOES', 'Telecomunicações'),
        ('ENERGIA', 'Energia'),
        ('PLANO_SAUDE', 'Plano de Saúde'),
        ('OUTROS', 'Outros'),
    ]
    
    # === IDENTIFICAÇÃO ===
    uuid = models.UUIDField("UUID", default=uuid.uuid4, editable=False, unique=True)
    numero = models.CharField("Número do PPA", max_length=20, unique=True, blank=True)
    # Ex: PPA-560/2024
    
    # === CLASSIFICAÇÃO ===
    sigla = models.CharField("Sigla/Tipo", max_length=50, choices=SIGLA_CHOICES)
    assunto = models.TextField("Assunto")
    interessado = models.CharField("Interessado (Empresa)", max_length=255)
    cnpj_interessado = models.CharField("CNPJ", max_length=18, blank=True)
    endereco_interessado = models.TextField("Endereço", blank=True)
    
    # === RESPONSÁVEIS ===
    analista_responsavel = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='ppas_responsavel',
        verbose_name="Analista Responsável"
    )
    supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ppas_supervisionados',
        verbose_name="Supervisor"
    )
    
    # === STATUS E DECISÃO ===
    status = models.CharField("Status", max_length=30, choices=STATUS_CHOICES, default='criado')
    decisao_final = models.CharField(
        "Decisão Final",
        max_length=20,
        choices=DECISAO_CHOICES,
        default='pendente'
    )
    
    # === PRAZOS ===
    prazo_analise = models.DateField("Prazo para Análise", null=True, blank=True)
    prazo_resposta = models.DateField("Prazo para Resposta Empresa", null=True, blank=True)
    data_conclusao = models.DateTimeField("Data de Conclusão", null=True, blank=True)
    
    # === OBSERVAÇÕES ===
    observacoes = models.TextField("Observações Gerais", blank=True)
    observacoes_internas = models.TextField("Observações Internas", blank=True)
    fundamentacao_decisao = models.TextField("Fundamentação da Decisão", blank=True)
    
    # === CONTROLE ===
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    criado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='ppas_criados',
        verbose_name="Criado por"
    )
    
    class Meta:
        verbose_name = "PPA - Procedimento Pré-Administrativo"
        verbose_name_plural = "PPAs - Procedimentos Pré-Administrativos"
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['numero']),
            models.Index(fields=['status']),
            models.Index(fields=['analista_responsavel']),
            models.Index(fields=['sigla']),
            models.Index(fields=['criado_em']),
        ]
    
    def __str__(self):
        return f"{self.numero} - {self.interessado}"
    
    def save(self, *args, **kwargs):
        """Gera número automático do PPA"""
        if not self.numero:
            self.numero = self._gerar_numero_ppa()
        super().save(*args, **kwargs)
    
    def _gerar_numero_ppa(self):
        """Gera número sequencial para o PPA"""
        ano = timezone.now().year
        ultimo = ProcedimentoPreAdministrativo.objects.filter(
            numero__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultimo:
            try:
                seq = int(ultimo.numero.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"PPA-{seq:05d}/{ano}"
    
    @property
    def total_anexos(self):
        """Retorna total de anexos"""
        return self.anexos.count()
    
    @property
    def total_movimentacoes(self):
        """Retorna total de movimentações"""
        return self.movimentacoes.count()
    
    @property
    def esta_no_prazo(self):
        """Verifica se está dentro do prazo"""
        if not self.prazo_analise:
            return True
        return timezone.now().date() <= self.prazo_analise
    
    @property
    def dias_ate_prazo(self):
        """Dias restantes até o prazo"""
        if not self.prazo_analise:
            return None
        delta = self.prazo_analise - timezone.now().date()
        return delta.days if delta.days >= 0 else 0


class MovimentacaoPPA(models.Model):
    """
    Tabela de Movimentação do PPA
    Registra TODOS os eventos que acontecem no processo
    """
    
    TIPO_MOVIMENTACAO_CHOICES = [
        ('criacao', 'Criação do PPA'),
        ('anexo_ac', 'Anexo de Auto de Constatação'),
        ('anexo_ai', 'Anexo de Auto de Infração'),
        ('anexo_notificacao', 'Anexo de Notificação'),
        ('anexo_defesa', 'Anexo de Defesa'),
        ('anexo_parecer', 'Anexo de Parecer'),
        ('anexo_documento', 'Anexo de Documento'),
        ('mudanca_status', 'Mudança de Status'),
        ('observacao', 'Observação'),
        ('analise', 'Análise'),
        ('decisao', 'Decisão'),
        ('outros', 'Outros'),
    ]
    
    ppa = models.ForeignKey(
        ProcedimentoPreAdministrativo,
        on_delete=models.CASCADE,
        related_name='movimentacoes',
        verbose_name="PPA"
    )
    
    # === DADOS DA MOVIMENTAÇÃO ===
    data = models.DateField("Data", default=timezone.localdate)
    hora = models.TimeField("Hora", null=True, blank=True)
    tipo_movimentacao = models.CharField(
        "Tipo de Movimentação",
        max_length=30,
        choices=TIPO_MOVIMENTACAO_CHOICES,
        default='outros'
    )
    atendimento = models.TextField("Atendimento/Descrição")
    # Ex: "NOT 047/2024", "AC 367/2024", "Img pl defesa", "Análise"
    
    # === USUÁRIO ===
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Usuário"
    )
    
    # === CONTROLE ===
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    
    class Meta:
        verbose_name = "Movimentação de PPA"
        verbose_name_plural = "Movimentações de PPA"
        ordering = ['data', 'hora', '-criado_em']
        indexes = [
            models.Index(fields=['ppa', 'data']),
            models.Index(fields=['tipo_movimentacao']),
        ]
    
    def __str__(self):
        return f"{self.ppa.numero} - {self.data} - {self.atendimento[:50]}"
    
    def save(self, *args, **kwargs):
        """Normaliza data/hora para evitar inconsistências"""
        if isinstance(self.data, datetime.datetime):
            # Garante que o campo DateField receba apenas date
            self.data = timezone.localtime(self.data).date()
        elif self.data is None:
            self.data = timezone.localdate()

        if not self.hora:
            self.hora = timezone.localtime().time()

        super().save(*args, **kwargs)


class AnexoPPA(models.Model):
    """
    Documentos anexados ao PPA
    Pode vincular AC, AI, Notificações, Defesas, Pareceres ou arquivos
    """
    
    TIPO_DOCUMENTO_CHOICES = [
        ('AC', 'Auto de Constatação'),
        ('AI', 'Auto de Infração'),
        ('NOT', 'Notificação'),
        ('DEFESA', 'Defesa'),
        ('PARECER', 'Parecer'),
        ('RESPOSTA', 'Resposta da Empresa'),
        ('DOCUMENTO', 'Documento Complementar'),
        ('IMAGEM', 'Imagem/Foto'),
        ('COMPROVANTE', 'Comprovante'),
        ('OUTROS', 'Outros'),
    ]
    
    ppa = models.ForeignKey(
        ProcedimentoPreAdministrativo,
        on_delete=models.CASCADE,
        related_name='anexos',
        verbose_name="PPA"
    )
    
    # === TIPO ===
    tipo_documento = models.CharField(
        "Tipo de Documento",
        max_length=20,
        choices=TIPO_DOCUMENTO_CHOICES
    )
    
    # === REFERÊNCIA GENÉRICA (para vincular AC, AI, etc) ===
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    documento_relacionado = GenericForeignKey('content_type', 'object_id')
    
    # === ARQUIVO FÍSICO ===
    arquivo = models.FileField(
        "Arquivo",
        upload_to='ppa/anexos/%Y/%m/',
        null=True,
        blank=True
    )
    nome_arquivo_original = models.CharField("Nome Original", max_length=255, blank=True)
    
    # === DESCRIÇÃO ===
    descricao = models.TextField("Descrição", blank=True)
    numero_documento = models.CharField("Número do Documento", max_length=50, blank=True)
    # Ex: "NOT 047/2024", "AC 367/2024"
    
    # === CONTROLE ===
    data_anexacao = models.DateTimeField("Data de Anexação", auto_now_add=True)
    anexado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Anexado por"
    )
    
    class Meta:
        verbose_name = "Anexo de PPA"
        verbose_name_plural = "Anexos de PPA"
        ordering = ['-data_anexacao']
        indexes = [
            models.Index(fields=['ppa', 'tipo_documento']),
            models.Index(fields=['data_anexacao']),
        ]
    
    def __str__(self):
        return f"{self.ppa.numero} - {self.get_tipo_documento_display()} - {self.numero_documento}"
    
    @property
    def tamanho_arquivo(self):
        """Retorna tamanho do arquivo em formato legível"""
        if not self.arquivo:
            return None
        
        tamanho = self.arquivo.size
        if tamanho < 1024:
            return f"{tamanho} B"
        elif tamanho < 1024**2:
            return f"{tamanho/1024:.1f} KB"
        elif tamanho < 1024**3:
            return f"{tamanho/(1024**2):.1f} MB"
        else:
            return f"{tamanho/(1024**3):.1f} GB"


class ParecerPPA(models.Model):
    """
    Parecer técnico elaborado durante o PPA
    """
    
    CONCLUSAO_CHOICES = [
        ('procedente', 'Procedente - Criar AI'),
        ('improcedente', 'Improcedente - Arquivar'),
        ('mais_informacoes', 'Necessita Mais Informações'),
        ('encaminhar', 'Encaminhar para Outro Órgão'),
    ]
    
    ppa = models.ForeignKey(
        ProcedimentoPreAdministrativo,
        on_delete=models.CASCADE,
        related_name='pareceres',
        verbose_name="PPA"
    )
    
    # === PARECER ===
    numero_parecer = models.CharField("Número do Parecer", max_length=50, blank=True)
    titulo = models.CharField("Título", max_length=300)
    relatorio = models.TextField("Relatório")
    fundamentacao = models.TextField("Fundamentação Legal")
    conclusao = models.CharField(
        "Conclusão",
        max_length=30,
        choices=CONCLUSAO_CHOICES
    )
    recomendacoes = models.TextField("Recomendações", blank=True)
    
    # === RESPONSÁVEL ===
    elaborado_por = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='pareceres_ppa_elaborados',
        verbose_name="Elaborado por"
    )
    cargo_elaborador = models.CharField("Cargo", max_length=100, blank=True)
    
    # === APROVAÇÃO ===
    aprovado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pareceres_ppa_aprovados',
        verbose_name="Aprovado por"
    )
    data_aprovacao = models.DateTimeField("Data de Aprovação", null=True, blank=True)
    
    # === CONTROLE ===
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Parecer de PPA"
        verbose_name_plural = "Pareceres de PPA"
        ordering = ['-criado_em']
    
    def __str__(self):
        return f"Parecer {self.numero_parecer} - {self.ppa.numero}"
    
    def save(self, *args, **kwargs):
        """Gera número automático do parecer"""
        if not self.numero_parecer:
            self.numero_parecer = self._gerar_numero_parecer()
        super().save(*args, **kwargs)
    
    def _gerar_numero_parecer(self):
        """Gera número sequencial para o parecer"""
        ano = timezone.now().year
        ultimo = ParecerPPA.objects.filter(
            numero_parecer__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultimo:
            try:
                seq = int(ultimo.numero_parecer.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"PAR-{seq:05d}/{ano}"


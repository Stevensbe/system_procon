from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class AnaliseJuridica(models.Model):
    """Análise jurídica principal de processos administrativos"""
    
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente de Análise'),
        ('EM_ANALISE', 'Em Análise'),
        ('PARECER_ELABORADO', 'Parecer Elaborado'),
        ('REVISAO', 'Em Revisão'),
        ('AGUARDANDO_DECISAO', 'Aguardando Decisão'),
        ('DECIDIDO', 'Decidido'),
        ('FINALIZADO', 'Finalizado'),
        ('ARQUIVADO', 'Arquivado'),
    ]
    
    TIPO_PROCESSO_CHOICES = [
        ('AUTO_INFRACAO', 'Auto de Infração'),
        ('PETICAO', 'Petição'),
        ('PROTOCOLO', 'Protocolo'),
        ('RECURSO', 'Recurso'),
        ('DEFESA', 'Defesa'),
        ('OUTROS', 'Outros'),
    ]
    
    COMPLEXIDADE_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('MEDIA', 'Média'),
        ('ALTA', 'Alta'),
        ('MUITO_ALTA', 'Muito Alta'),
    ]
    
    # Identificação
    numero_analise = models.CharField("Número da Análise", max_length=50, unique=True, blank=True)
    uuid = models.UUIDField("UUID", default=uuid.uuid4, editable=False, unique=True)
    
    # Processo relacionado
    tipo_processo = models.CharField("Tipo de Processo", max_length=20, choices=TIPO_PROCESSO_CHOICES)
    numero_processo = models.CharField("Número do Processo", max_length=100)
    
    # Relações com outros módulos (usar strings para evitar import circular)
    processo_fiscalizacao_id = models.IntegerField("ID Processo Fiscalização", null=True, blank=True)
    peticao_id = models.IntegerField("ID Petição", null=True, blank=True)
    protocolo_id = models.IntegerField("ID Protocolo", null=True, blank=True)
    
    # Dados básicos
    assunto = models.CharField("Assunto", max_length=300)
    resumo_fatos = models.TextField("Resumo dos Fatos")
    questoes_juridicas = models.TextField("Questões Jurídicas Identificadas")
    
    # Status e controle
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    complexidade = models.CharField("Complexidade", max_length=15, choices=COMPLEXIDADE_CHOICES, default='MEDIA')
    prioridade = models.CharField("Prioridade", max_length=10, choices=[
        ('BAIXA', 'Baixa'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ], default='NORMAL')
    
    # Responsáveis
    analista_responsavel = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='analises_responsavel',
        verbose_name="Analista Responsável"
    )
    supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analises_supervisionadas',
        verbose_name="Supervisor"
    )
    relator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analises_relatadas',
        verbose_name="Relator"
    )
    
    # Dados da empresa/autuado
    empresa_nome = models.CharField("Nome da Empresa", max_length=300, blank=True)
    empresa_cnpj = models.CharField("CNPJ", max_length=20, blank=True)
    empresa_endereco = models.TextField("Endereço", blank=True)
    
    # Valores
    valor_multa_aplicada = models.DecimalField(
        "Valor da Multa Aplicada (R$)",
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    valor_multa_final = models.DecimalField(
        "Valor Final da Multa (R$)",
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Prazos
    prazo_analise = models.DateTimeField("Prazo para Análise", null=True, blank=True)
    prazo_decisao = models.DateTimeField("Prazo para Decisão", null=True, blank=True)
    
    # Datas importantes
    data_distribuicao = models.DateTimeField("Data de Distribuição", auto_now_add=True)
    data_inicio_analise = models.DateTimeField("Início da Análise", null=True, blank=True)
    data_conclusao_analise = models.DateTimeField("Conclusão da Análise", null=True, blank=True)
    data_decisao = models.DateTimeField("Data da Decisão", null=True, blank=True)
    data_finalizacao = models.DateTimeField("Data de Finalização", null=True, blank=True)
    
    # Observações
    observacoes = models.TextField("Observações Gerais", blank=True)
    observacoes_internas = models.TextField("Observações Internas", blank=True)
    
    # Metadados
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Análise Jurídica"
        verbose_name_plural = "Análises Jurídicas"
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['numero_analise']),
            models.Index(fields=['status']),
            models.Index(fields=['tipo_processo']),
            models.Index(fields=['analista_responsavel']),
            models.Index(fields=['prazo_analise']),
            models.Index(fields=['prazo_decisao']),
            models.Index(fields=['empresa_cnpj']),
        ]
    
    def __str__(self):
        return f"Análise {self.numero_analise} - {self.assunto}"
    
    def save(self, *args, **kwargs):
        if not self.numero_analise:
            self.numero_analise = self._gerar_numero_analise()
        super().save(*args, **kwargs)
    
    def _gerar_numero_analise(self):
        """Gera número único da análise"""
        ano = timezone.now().year
        ultima = AnaliseJuridica.objects.filter(
            numero_analise__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultima:
            try:
                seq = int(ultima.numero_analise.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"AJ-{seq:05d}/{ano}"
    
    @property
    def tempo_analise_dias(self):
        """Calcula tempo de análise em dias"""
        if not self.data_inicio_analise:
            return 0
        
        fim = self.data_conclusao_analise or timezone.now()
        return (fim - self.data_inicio_analise).days
    
    @property
    def esta_no_prazo(self):
        """Verifica se está dentro do prazo"""
        if not self.prazo_analise:
            return True
        return timezone.now() <= self.prazo_analise
    
    @property
    def dias_para_vencimento(self):
        """Dias restantes para vencimento"""
        if not self.prazo_analise:
            return None
        delta = self.prazo_analise - timezone.now()
        return delta.days if delta.days >= 0 else 0


class ParecerTecnico(models.Model):
    """Parecer técnico da análise jurídica"""
    
    TIPO_PARECER_CHOICES = [
        ('TECNICO', 'Parecer Técnico'),
        ('JURIDICO', 'Parecer Jurídico'),
        ('CONJUNTO', 'Parecer Técnico-Jurídico'),
        ('COMPLEMENTAR', 'Parecer Complementar'),
        ('REVISAO', 'Parecer de Revisão'),
    ]
    
    CONCLUSAO_CHOICES = [
        ('PROCEDENTE', 'Procedente'),
        ('IMPROCEDENTE', 'Improcedente'),
        ('PARCIALMENTE_PROCEDENTE', 'Parcialmente Procedente'),
        ('NECESSITA_COMPLEMENTACAO', 'Necessita Complementação'),
        ('AGUARDA_DOCUMENTOS', 'Aguarda Documentos'),
        ('ENCAMINHA_OUTRO_ORGAO', 'Encaminha para Outro Órgão'),
    ]
    
    analise = models.ForeignKey(AnaliseJuridica, on_delete=models.CASCADE, related_name='pareceres')
    
    # Identificação
    numero_parecer = models.CharField("Número do Parecer", max_length=50, unique=True, blank=True)
    tipo_parecer = models.CharField("Tipo de Parecer", max_length=20, choices=TIPO_PARECER_CHOICES)
    
    # Conteúdo do parecer
    titulo = models.CharField("Título", max_length=300)
    relatorio = models.TextField("Relatório")
    fundamentacao_tecnica = models.TextField("Fundamentação Técnica", blank=True)
    fundamentacao_juridica = models.TextField("Fundamentação Jurídica")
    conclusao = models.CharField("Conclusão", max_length=30, choices=CONCLUSAO_CHOICES)
    recomendacoes = models.TextField("Recomendações", blank=True)
    
    # Base legal
    legislacao_aplicada = models.TextField("Legislação Aplicada")
    jurisprudencia = models.TextField("Jurisprudência", blank=True)
    doutrina = models.TextField("Doutrina", blank=True)
    
    # Responsável
    elaborado_por = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name="Elaborado por")
    cargo_elaborador = models.CharField("Cargo do Elaborador", max_length=100, blank=True)
    
    # Revisão
    revisado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pareceres_revisados',
        verbose_name="Revisado por"
    )
    data_revisao = models.DateTimeField("Data da Revisão", null=True, blank=True)
    observacoes_revisao = models.TextField("Observações da Revisão", blank=True)
    
    # Aprovação
    aprovado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pareceres_aprovados',
        verbose_name="Aprovado por"
    )
    data_aprovacao = models.DateTimeField("Data da Aprovação", null=True, blank=True)
    
    # Status
    status = models.CharField("Status", max_length=20, choices=[
        ('RASCUNHO', 'Rascunho'),
        ('ELABORADO', 'Elaborado'),
        ('EM_REVISAO', 'Em Revisão'),
        ('APROVADO', 'Aprovado'),
        ('PUBLICADO', 'Publicado'),
    ], default='RASCUNHO')
    
    # Arquivos
    arquivo_parecer = models.FileField(
        "Arquivo do Parecer",
        upload_to='analise_juridica/pareceres/%Y/%m/',
        blank=True
    )
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Parecer Técnico"
        verbose_name_plural = "Pareceres Técnicos"
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['numero_parecer']),
            models.Index(fields=['analise']),
            models.Index(fields=['status']),
            models.Index(fields=['elaborado_por']),
        ]
    
    def __str__(self):
        return f"Parecer {self.numero_parecer} - {self.titulo}"
    
    def save(self, *args, **kwargs):
        if not self.numero_parecer:
            self.numero_parecer = self._gerar_numero_parecer()
        super().save(*args, **kwargs)
    
    def _gerar_numero_parecer(self):
        """Gera número único do parecer"""
        ano = timezone.now().year
        ultimo = ParecerTecnico.objects.filter(
            numero_parecer__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultimo:
            try:
                seq = int(ultimo.numero_parecer.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"PAR-{seq:05d}/{ano}"


class DecisaoAdministrativa(models.Model):
    """Decisão administrativa final"""
    
    TIPO_DECISAO_CHOICES = [
        ('PROCEDENCIA', 'Procedência'),
        ('IMPROCEDENCIA', 'Improcedência'),
        ('PROCEDENCIA_PARCIAL', 'Procedência Parcial'),
        ('ARQUIVAMENTO', 'Arquivamento'),
        ('ENCAMINHAMENTO', 'Encaminhamento'),
        ('CONVERSAO_MULTA', 'Conversão de Multa'),
        ('REDUCAO_MULTA', 'Redução de Multa'),
        ('MANUTENCAO_MULTA', 'Manutenção de Multa'),
    ]
    
    analise = models.OneToOneField(
        AnaliseJuridica,
        on_delete=models.CASCADE,
        related_name='decisao'
    )
    
    # Identificação
    numero_decisao = models.CharField("Número da Decisão", max_length=50, unique=True, blank=True)
    tipo_decisao = models.CharField("Tipo de Decisão", max_length=25, choices=TIPO_DECISAO_CHOICES)
    
    # Conteúdo da decisão
    titulo = models.CharField("Título", max_length=300)
    ementa = models.TextField("Ementa")
    relatorio = models.TextField("Relatório")
    fundamentacao = models.TextField("Fundamentação")
    dispositivo = models.TextField("Dispositivo")
    
    # Valores decididos
    valor_multa_decidido = models.DecimalField(
        "Valor da Multa Decidido (R$)",
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    percentual_reducao = models.DecimalField(
        "Percentual de Redução (%)",
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Prazos para cumprimento
    prazo_cumprimento_dias = models.IntegerField("Prazo para Cumprimento (dias)", null=True, blank=True)
    prazo_recurso_dias = models.IntegerField("Prazo para Recurso (dias)", default=10)
    
    # Autoridade julgadora
    julgador = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name="Julgador")
    cargo_julgador = models.CharField("Cargo do Julgador", max_length=100)
    
    # Controle processual
    data_julgamento = models.DateTimeField("Data do Julgamento", auto_now_add=True)
    data_publicacao = models.DateTimeField("Data de Publicação", null=True, blank=True)
    data_transito_julgado = models.DateTimeField("Data do Trânsito em Julgado", null=True, blank=True)
    
    # Recursos
    permite_recurso = models.BooleanField("Permite Recurso", default=True)
    recurso_apresentado = models.BooleanField("Recurso Apresentado", default=False)
    data_recurso = models.DateTimeField("Data do Recurso", null=True, blank=True)
    
    # Cumprimento
    cumprida = models.BooleanField("Decisão Cumprida", default=False)
    data_cumprimento = models.DateTimeField("Data do Cumprimento", null=True, blank=True)
    forma_cumprimento = models.TextField("Forma de Cumprimento", blank=True)
    
    # Arquivos
    arquivo_decisao = models.FileField(
        "Arquivo da Decisão",
        upload_to='analise_juridica/decisoes/%Y/%m/',
        blank=True
    )
    
    # Notificações
    notificado_interessado = models.BooleanField("Interessado Notificado", default=False)
    data_notificacao = models.DateTimeField("Data da Notificação", null=True, blank=True)
    forma_notificacao = models.CharField("Forma de Notificação", max_length=50, blank=True)
    
    # Observações
    observacoes = models.TextField("Observações", blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Decisão Administrativa"
        verbose_name_plural = "Decisões Administrativas"
        ordering = ['-data_julgamento']
        indexes = [
            models.Index(fields=['numero_decisao']),
            models.Index(fields=['tipo_decisao']),
            models.Index(fields=['julgador']),
            models.Index(fields=['data_julgamento']),
            models.Index(fields=['data_publicacao']),
        ]
    
    def __str__(self):
        return f"Decisão {self.numero_decisao} - {self.tipo_decisao}"
    
    def save(self, *args, **kwargs):
        if not self.numero_decisao:
            self.numero_decisao = self._gerar_numero_decisao()
        super().save(*args, **kwargs)
    
    def _gerar_numero_decisao(self):
        """Gera número único da decisão"""
        ano = timezone.now().year
        ultima = DecisaoAdministrativa.objects.filter(
            numero_decisao__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultima:
            try:
                seq = int(ultima.numero_decisao.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"DEC-{seq:05d}/{ano}"
    
    @property
    def transitou_em_julgado(self):
        """Verifica se a decisão transitou em julgado"""
        return self.data_transito_julgado is not None
    
    @property
    def prazo_recurso_vencido(self):
        """Verifica se o prazo para recurso venceu"""
        if not self.data_publicacao:
            return False
        
        prazo_limite = self.data_publicacao + timezone.timedelta(days=self.prazo_recurso_dias)
        return timezone.now() > prazo_limite


class RecursoAdministrativo(models.Model):
    """Recurso contra decisão administrativa"""
    
    TIPO_RECURSO_CHOICES = [
        ('RECURSO_ORDINARIO', 'Recurso Ordinário'),
        ('RECURSO_EXTRAORDINARIO', 'Recurso Extraordinário'),
        ('REVISAO', 'Pedido de Revisão'),
        ('RECONSIDERACAO', 'Pedido de Reconsideração'),
    ]
    
    STATUS_CHOICES = [
        ('PROTOCOLADO', 'Protocolado'),
        ('EM_ANALISE', 'Em Análise'),
        ('JULGADO_PROVIDO', 'Julgado Provido'),
        ('JULGADO_IMPROVIDO', 'Julgado Improvido'),
        ('JULGADO_PARCIALMENTE', 'Julgado Parcialmente Provido'),
        ('EXTINTO', 'Extinto'),
    ]
    
    decisao_recorrida = models.ForeignKey(
        DecisaoAdministrativa,
        on_delete=models.CASCADE,
        related_name='recursos'
    )
    
    # Identificação
    numero_recurso = models.CharField("Número do Recurso", max_length=50, unique=True, blank=True)
    tipo_recurso = models.CharField("Tipo de Recurso", max_length=25, choices=TIPO_RECURSO_CHOICES)
    
    # Dados do recorrente
    recorrente_nome = models.CharField("Nome do Recorrente", max_length=300)
    recorrente_documento = models.CharField("CPF/CNPJ do Recorrente", max_length=20)
    representante_nome = models.CharField("Nome do Representante", max_length=300, blank=True)
    
    # Conteúdo do recurso
    fundamentacao = models.TextField("Fundamentação do Recurso")
    pedidos = models.TextField("Pedidos")
    valor_causas = models.DecimalField(
        "Valor da Causa (R$)",
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Processamento
    status = models.CharField("Status", max_length=25, choices=STATUS_CHOICES, default='PROTOCOLADO')
    
    # Responsáveis
    relator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recursos_analise_relatados',
        verbose_name="Relator"
    )
    
    # Prazos
    data_protocolo = models.DateTimeField("Data do Protocolo", auto_now_add=True)
    prazo_julgamento = models.DateTimeField("Prazo para Julgamento", null=True, blank=True)
    data_julgamento = models.DateTimeField("Data do Julgamento", null=True, blank=True)
    
    # Resultado
    resultado = models.TextField("Resultado do Julgamento", blank=True)
    valor_final_recurso = models.DecimalField(
        "Valor Final após Recurso (R$)",
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Arquivos
    arquivo_recurso = models.FileField(
        "Arquivo do Recurso",
        upload_to='analise_juridica/recursos/%Y/%m/',
        blank=True
    )
    arquivo_decisao_recurso = models.FileField(
        "Arquivo da Decisão do Recurso",
        upload_to='analise_juridica/decisoes_recurso/%Y/%m/',
        blank=True
    )
    
    # Observações
    observacoes = models.TextField("Observações", blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Recurso Administrativo"
        verbose_name_plural = "Recursos Administrativos"
        ordering = ['-data_protocolo']
        indexes = [
            models.Index(fields=['numero_recurso']),
            models.Index(fields=['status']),
            models.Index(fields=['relator']),
            models.Index(fields=['data_protocolo']),
        ]
    
    def __str__(self):
        return f"Recurso {self.numero_recurso} - {self.recorrente_nome}"
    
    def save(self, *args, **kwargs):
        if not self.numero_recurso:
            self.numero_recurso = self._gerar_numero_recurso()
        super().save(*args, **kwargs)
    
    def _gerar_numero_recurso(self):
        """Gera número único do recurso"""
        ano = timezone.now().year
        ultimo = RecursoAdministrativo.objects.filter(
            numero_recurso__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultimo:
            try:
                seq = int(ultimo.numero_recurso.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"REC-{seq:05d}/{ano}"


class DocumentoJuridico(models.Model):
    """Documentos anexados às análises jurídicas"""
    
    TIPO_DOCUMENTO_CHOICES = [
        ('DEFESA', 'Defesa'),
        ('RECURSO', 'Recurso'),
        ('DOCUMENTO_FISCAL', 'Documento Fiscal'),
        ('COMPROVANTE', 'Comprovante'),
        ('JURISPRUDENCIA', 'Jurisprudência'),
        ('LEGISLACAO', 'Legislação'),
        ('LAUDO_TECNICO', 'Laudo Técnico'),
        ('OUTROS', 'Outros'),
    ]
    
    analise = models.ForeignKey(AnaliseJuridica, on_delete=models.CASCADE, related_name='documentos')
    
    # Dados do documento
    tipo_documento = models.CharField("Tipo", max_length=20, choices=TIPO_DOCUMENTO_CHOICES)
    titulo = models.CharField("Título", max_length=300)
    descricao = models.TextField("Descrição", blank=True)
    
    # Arquivo
    arquivo = models.FileField("Arquivo", upload_to='analise_juridica/documentos/%Y/%m/%d/')
    nome_arquivo_original = models.CharField("Nome Original", max_length=255)
    tamanho_bytes = models.BigIntegerField("Tamanho (bytes)")
    tipo_mime = models.CharField("Tipo MIME", max_length=100)
    hash_arquivo = models.CharField("Hash SHA-256", max_length=64)
    
    # Dados de quem enviou
    enviado_por = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name="Enviado por")
    data_envio = models.DateTimeField("Data de Envio", auto_now_add=True)
    
    # Validação
    validado = models.BooleanField("Validado", default=False)
    validado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_juridicos_validados',
        verbose_name="Validado por"
    )
    data_validacao = models.DateTimeField("Data da Validação", null=True, blank=True)
    observacoes_validacao = models.TextField("Observações da Validação", blank=True)
    
    class Meta:
        verbose_name = "Documento Jurídico"
        verbose_name_plural = "Documentos Jurídicos"
        ordering = ['-data_envio']
        indexes = [
            models.Index(fields=['analise']),
            models.Index(fields=['tipo_documento']),
            models.Index(fields=['enviado_por']),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.analise.numero_analise}"
    
    @property
    def tamanho_formatado(self):
        """Retorna tamanho formatado"""
        if self.tamanho_bytes < 1024:
            return f"{self.tamanho_bytes} B"
        elif self.tamanho_bytes < 1024**2:
            return f"{self.tamanho_bytes/1024:.1f} KB"
        elif self.tamanho_bytes < 1024**3:
            return f"{self.tamanho_bytes/(1024**2):.1f} MB"
        else:
            return f"{self.tamanho_bytes/(1024**3):.1f} GB"


class ConfiguracaoAnalise(models.Model):
    """Configurações do módulo de análise jurídica"""
    
    # Prazos padrão
    prazo_analise_dias = models.IntegerField("Prazo Padrão para Análise (dias)", default=30)
    prazo_parecer_dias = models.IntegerField("Prazo para Elaboração de Parecer (dias)", default=15)
    prazo_decisao_dias = models.IntegerField("Prazo para Decisão (dias)", default=10)
    prazo_recurso_dias = models.IntegerField("Prazo para Recurso (dias)", default=10)
    
    # Notificações
    notificar_prazo_vencimento = models.BooleanField("Notificar Vencimento de Prazos", default=True)
    dias_antecedencia_notificacao = models.IntegerField("Dias de Antecedência para Notificação", default=3)
    
    # Configurações de documento
    tamanho_maximo_documento_mb = models.IntegerField("Tamanho Máximo de Documento (MB)", default=20)
    tipos_arquivo_permitidos = models.TextField(
        "Tipos de Arquivo Permitidos",
        default="pdf,doc,docx,jpg,jpeg,png,txt",
        help_text="Separados por vírgula"
    )
    
    # Fluxo de trabalho
    exigir_revisao_parecer = models.BooleanField("Exigir Revisão de Parecer", default=True)
    exigir_aprovacao_supervisor = models.BooleanField("Exigir Aprovação do Supervisor", default=True)
    
    # Templates
    template_parecer = models.TextField("Template de Parecer", blank=True)
    template_decisao = models.TextField("Template de Decisão", blank=True)
    
    # E-mails de notificação
    email_coordenacao = models.EmailField("E-mail da Coordenação", blank=True)
    email_supervisao = models.EmailField("E-mail da Supervisão", blank=True)
    
    class Meta:
        verbose_name = "Configuração da Análise Jurídica"
        verbose_name_plural = "Configurações da Análise Jurídica"
    
    def __str__(self):
        return "Configurações do Módulo de Análise Jurídica"
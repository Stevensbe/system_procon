"""
SISPROCON - Sistema de Recursos e Defesas
Gerencia todo o processo de defesas, recursos e análises jurídicas
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from fiscalizacao.models import Processo, AutoInfracao


class TipoDefesa(models.Model):
    """Tipos de defesa disponíveis no sistema"""
    
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    prazo_dias = models.IntegerField("Prazo em Dias", default=15)
    requer_documentos = models.BooleanField("Requer Documentos", default=True)
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Tipo de Defesa"
        verbose_name_plural = "Tipos de Defesas"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class DefesaAdministrativa(models.Model):
    """Defesas apresentadas contra autos de infração"""
    
    STATUS_CHOICES = [
        ('protocolada', 'Protocolada'),
        ('em_analise', 'Em Análise'),
        ('deferida', 'Deferida'),
        ('indeferida', 'Indeferida'),
        ('parcialmente_deferida', 'Parcialmente Deferida'),
    ]
    
    FORMA_APRESENTACAO_CHOICES = [
        ('presencial', 'Presencial'),
        ('digital', 'Digital'),
        ('correios', 'Correios'),
        ('protocolo', 'Protocolo'),
    ]
    
    # Relacionamentos
    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name='defesas',
        verbose_name="Processo Administrativo"
    )
    
    tipo_defesa = models.ForeignKey(
        TipoDefesa,
        on_delete=models.PROTECT,
        verbose_name="Tipo de Defesa"
    )
    
    # Dados básicos
    numero_defesa = models.CharField("Número da Defesa", max_length=25, unique=True, blank=True)
    data_protocolo = models.DateTimeField("Data de Protocolo", auto_now_add=True)
    data_apresentacao = models.DateField("Data de Apresentação", auto_now_add=True)
    forma_apresentacao = models.CharField("Forma de Apresentação", max_length=20, choices=FORMA_APRESENTACAO_CHOICES)
    
    # Dados do requerente/advogado
    requerente_nome = models.CharField("Nome do Requerente", max_length=255)
    requerente_cpf_cnpj = models.CharField("CPF/CNPJ", max_length=18)
    requerente_oab = models.CharField("OAB", max_length=20, blank=True, help_text="Se apresentado por advogado")
    
    # Conteúdo da defesa
    argumentos = models.TextField("Argumentos da Defesa")
    pedidos = models.TextField("Pedidos", help_text="O que está sendo solicitado")
    
    # Status e resultado
    status = models.CharField("Status", max_length=25, choices=STATUS_CHOICES, default='protocolada')
    data_analise = models.DateField("Data da Análise", null=True, blank=True)
    resultado_analise = models.TextField("Resultado da Análise", blank=True)
    
    # Responsáveis
    analista_responsavel = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='defesas_analisadas',
        verbose_name="Analista Responsável"
    )
    
    # Controle de prazos
    prazo_resposta = models.DateField("Prazo para Resposta", null=True, blank=True)
    
    # Metadados
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Defesa Administrativa"
        verbose_name_plural = "Defesas Administrativas"
        ordering = ['-data_protocolo']
        indexes = [
            models.Index(fields=['numero_defesa']),
            models.Index(fields=['processo', 'status']),
            models.Index(fields=['data_apresentacao']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Defesa {self.numero_defesa} - {self.processo.numero_processo}"
    
    def save(self, *args, **kwargs):
        # Gera número da defesa automaticamente
        if not self.numero_defesa:
            self.numero_defesa = self._gerar_numero_defesa()
        
        # Calcula prazo de resposta se não definido
        if not self.prazo_resposta:
            self.prazo_resposta = self.data_apresentacao + timedelta(days=30)
        
        # Atualiza status do processo
        if self.status == 'protocolada' and self.processo.status == 'aguardando_defesa':
            self.processo.status = 'defesa_apresentada'
            self.processo.data_defesa = self.data_apresentacao
            self.processo.save()
        
        super().save(*args, **kwargs)
    
    def _gerar_numero_defesa(self):
        """Gera número sequencial para a defesa"""
        ano = timezone.now().year
        ultimo = DefesaAdministrativa.objects.filter(
            numero_defesa__endswith=f"/{ano}"
        ).order_by('-id').first()
        
        seq = 1
        if ultimo and '-' in ultimo.numero_defesa:
            try:
                seq = int(ultimo.numero_defesa.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"DEF-{seq:05d}/{ano}"
    
    @property
    def esta_no_prazo(self):
        """Verifica se a análise está no prazo"""
        if not self.prazo_resposta:
            return True
        return timezone.now().date() <= self.prazo_resposta
    
    @property
    def dias_para_vencimento(self):
        """Dias restantes para vencimento da análise"""
        if not self.prazo_resposta:
            return None
        delta = self.prazo_resposta - timezone.now().date()
        return delta.days
    
    def deferir(self, motivo="", usuario=None):
        """Defere a defesa"""
        self.status = 'deferida'
        self.data_analise = timezone.now().date()
        self.resultado_analise = f"DEFERIDA. {motivo}".strip()
        if usuario:
            self.analista_responsavel = usuario
        
        # Atualiza processo
        self.processo.status = 'finalizado_improcedente'
        self.processo.data_finalizacao = timezone.now().date()
        self.processo.save()
        
        self.save()
    
    def indeferir(self, motivo="", usuario=None):
        """Indefere a defesa"""
        self.status = 'indeferida'
        self.data_analise = timezone.now().date()
        self.resultado_analise = f"INDEFERIDA. {motivo}".strip()
        if usuario:
            self.analista_responsavel = usuario
        
        # Processo continua - pode haver recurso
        self.processo.status = 'aguardando_recurso'
        self.processo.save()
        
        self.save()


class DocumentoDefesa(models.Model):
    """Documentos anexados à defesa"""
    
    TIPO_DOCUMENTO_CHOICES = [
        ('procuracao', 'Procuração'),
        ('contrato_social', 'Contrato Social'),
        ('certidao', 'Certidão'),
        ('nota_fiscal', 'Nota Fiscal'),
        ('foto', 'Fotografia'),
        ('laudo', 'Laudo Técnico'),
        ('outros', 'Outros'),
    ]
    
    defesa = models.ForeignKey(
        DefesaAdministrativa,
        on_delete=models.CASCADE,
        related_name='documentos'
    )
    
    tipo = models.CharField("Tipo", max_length=20, choices=TIPO_DOCUMENTO_CHOICES)
    nome_arquivo = models.CharField("Nome do Arquivo", max_length=255)
    arquivo = models.FileField("Arquivo", upload_to='defesas/documentos/%Y/%m/')
    descricao = models.TextField("Descrição", blank=True)
    
    upload_em = models.DateTimeField("Upload em", auto_now_add=True)
    tamanho_bytes = models.BigIntegerField("Tamanho (bytes)", null=True, blank=True)
    
    class Meta:
        verbose_name = "Documento da Defesa"
        verbose_name_plural = "Documentos das Defesas"
        ordering = ['-upload_em']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.defesa.numero_defesa}"


class RecursoAdministrativo(models.Model):
    """Recursos contra decisões de defesas"""
    
    STATUS_CHOICES = [
        ('protocolado', 'Protocolado'),
        ('em_analise', 'Em Análise'),
        ('deferido', 'Deferido'),
        ('indeferido', 'Indeferido'),
        ('parcialmente_deferido', 'Parcialmente Deferido'),
    ]
    
    INSTANCIA_CHOICES = [
        ('primeira', 'Primeira Instância'),
        ('segunda', 'Segunda Instância'),
        ('terceira', 'Terceira Instância'),
    ]
    
    # Relacionamentos
    defesa = models.ForeignKey(
        DefesaAdministrativa,
        on_delete=models.CASCADE,
        related_name='recursos',
        verbose_name="Defesa Administrativa"
    )
    
    # Dados básicos
    numero_recurso = models.CharField("Número do Recurso", max_length=25, unique=True, blank=True)
    instancia = models.CharField("Instância", max_length=15, choices=INSTANCIA_CHOICES)
    data_protocolo = models.DateTimeField("Data de Protocolo", auto_now_add=True)
    data_apresentacao = models.DateField("Data de Apresentação", auto_now_add=True)
    
    # Dados do recorrente
    recorrente_nome = models.CharField("Nome do Recorrente", max_length=255)
    recorrente_oab = models.CharField("OAB", max_length=20, blank=True)
    
    # Conteúdo do recurso
    fundamentos = models.TextField("Fundamentos do Recurso")
    pedidos = models.TextField("Pedidos")
    
    # Status e resultado
    status = models.CharField("Status", max_length=25, choices=STATUS_CHOICES, default='protocolado')
    data_julgamento = models.DateField("Data do Julgamento", null=True, blank=True)
    resultado_julgamento = models.TextField("Resultado do Julgamento", blank=True)
    
    # Responsáveis
    relator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recursos_defesas_relatados'
    )
    
    # Prazos
    prazo_julgamento = models.DateField("Prazo para Julgamento", null=True, blank=True)
    
    # Metadados
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Recurso Administrativo"
        verbose_name_plural = "Recursos Administrativos"
        ordering = ['-data_protocolo']
        indexes = [
            models.Index(fields=['numero_recurso']),
            models.Index(fields=['defesa', 'status']),
            models.Index(fields=['instancia']),
        ]
    
    def __str__(self):
        return f"Recurso {self.numero_recurso} - {self.get_instancia_display()}"
    
    def save(self, *args, **kwargs):
        if not self.numero_recurso:
            self.numero_recurso = self._gerar_numero_recurso()
        
        if not self.prazo_julgamento:
            self.prazo_julgamento = self.data_apresentacao + timedelta(days=60)
        
        # Atualiza status do processo
        if self.status == 'protocolado':
            processo = self.defesa.processo
            processo.status = 'recurso_apresentado'
            processo.data_recurso = self.data_apresentacao
            processo.save()
        
        super().save(*args, **kwargs)
    
    def _gerar_numero_recurso(self):
        """Gera número sequencial para o recurso"""
        ano = timezone.now().year
        ultimo = RecursoAdministrativo.objects.filter(
            numero_recurso__endswith=f"/{ano}"
        ).order_by('-id').first()
        
        seq = 1
        if ultimo and '-' in ultimo.numero_recurso:
            try:
                seq = int(ultimo.numero_recurso.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"REC-{seq:05d}/{ano}"
    
    def julgar(self, decisao, motivo="", usuario=None):
        """Julga o recurso"""
        if decisao not in ['deferido', 'indeferido', 'parcialmente_deferido']:
            raise ValueError("Decisão deve ser: deferido, indeferido ou parcialmente_deferido")
        
        self.status = decisao
        self.data_julgamento = timezone.now().date()
        self.resultado_julgamento = motivo
        if usuario:
            self.relator = usuario
        
        # Atualiza processo baseado na decisão
        processo = self.defesa.processo
        if decisao == 'deferido':
            processo.status = 'finalizado_improcedente'
        else:
            processo.status = 'finalizado_procedente'
        
        processo.data_finalizacao = timezone.now().date()
        processo.save()
        
        self.save()


class AnaliseJuridica(models.Model):
    """Análises jurídicas das defesas e recursos"""
    
    TIPO_ANALISE_CHOICES = [
        ('defesa', 'Análise de Defesa'),
        ('recurso_1', 'Análise de Recurso 1ª Instância'),
        ('recurso_2', 'Análise de Recurso 2ª Instância'),
    ]
    
    # Relacionamento flexível
    defesa = models.ForeignKey(
        DefesaAdministrativa,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='analises'
    )
    
    recurso = models.ForeignKey(
        RecursoAdministrativo,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='analises'
    )
    
    # Dados da análise
    tipo = models.CharField("Tipo de Análise", max_length=15, choices=TIPO_ANALISE_CHOICES)
    numero_analise = models.CharField("Número da Análise", max_length=25, unique=True, blank=True)
    
    # Conteúdo técnico
    relatorio_fatos = models.TextField("Relatório dos Fatos")
    fundamentacao_juridica = models.TextField("Fundamentação Jurídica")
    conclusao = models.TextField("Conclusão")
    
    # Recomendação
    RECOMENDACAO_CHOICES = [
        ('deferir', 'Deferir'),
        ('indeferir', 'Indeferir'),
        ('deferir_parcial', 'Deferir Parcialmente'),
    ]
    
    recomendacao = models.CharField("Recomendação", max_length=15, choices=RECOMENDACAO_CHOICES)
    justificativa_recomendacao = models.TextField("Justificativa da Recomendação")
    
    # Responsável
    analista = models.ForeignKey(User, on_delete=models.PROTECT, related_name='analises_juridicas')
    data_analise = models.DateField("Data da Análise", auto_now_add=True)
    
    # Metadados
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    
    class Meta:
        verbose_name = "Análise Jurídica"
        verbose_name_plural = "Análises Jurídicas"
        ordering = ['-data_analise']
    
    def __str__(self):
        objeto = self.defesa or self.recurso
        return f"Análise {self.numero_analise} - {objeto}"
    
    def save(self, *args, **kwargs):
        if not self.numero_analise:
            self.numero_analise = self._gerar_numero_analise()
        super().save(*args, **kwargs)
    
    def _gerar_numero_analise(self):
        """Gera número sequencial para a análise"""
        ano = timezone.now().year
        ultimo = AnaliseJuridica.objects.filter(
            numero_analise__endswith=f"/{ano}"
        ).order_by('-id').first()
        
        seq = 1
        if ultimo and '-' in ultimo.numero_analise:
            try:
                seq = int(ultimo.numero_analise.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"ANL-{seq:05d}/{ano}"


class ConfiguracaoRecursos(models.Model):
    """Configurações do sistema de recursos e defesas"""
    
    # Prazos padrão
    prazo_defesa_dias = models.IntegerField("Prazo para Defesa (dias)", default=15)
    prazo_recurso_dias = models.IntegerField("Prazo para Recurso (dias)", default=10)
    prazo_analise_dias = models.IntegerField("Prazo para Análise (dias)", default=30)
    prazo_julgamento_dias = models.IntegerField("Prazo para Julgamento (dias)", default=60)
    
    # Notificações
    notificar_prazos = models.BooleanField("Notificar Prazos", default=True)
    dias_antecedencia_notificacao = models.IntegerField("Dias de Antecedência", default=3)
    
    # Configurações de arquivo
    tamanho_maximo_arquivo_mb = models.IntegerField("Tamanho Máximo Arquivo (MB)", default=10)
    tipos_arquivo_permitidos = models.TextField(
        "Tipos de Arquivo Permitidos",
        default="pdf,doc,docx,jpg,jpeg,png",
        help_text="Separados por vírgula"
    )
    
    class Meta:
        verbose_name = "Configuração de Recursos"
        verbose_name_plural = "Configurações de Recursos"
    
    def __str__(self):
        return "Configurações do Sistema de Recursos e Defesas"

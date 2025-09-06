from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from datetime import datetime, timedelta
import uuid


class AnalistaJuridico(models.Model):
    """Analista jurídico responsável por processos"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='analista_juridico')
    oab = models.CharField("Número OAB", max_length=20, blank=True)
    especialidade = models.CharField("Especialidade", max_length=100, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    data_cadastro = models.DateTimeField("Data de Cadastro", auto_now_add=True)
    
    class Meta:
        verbose_name = "Analista Jurídico"
        verbose_name_plural = "Analistas Jurídicos"
    
    def __str__(self):
        return f"{self.user.get_full_name()} - OAB: {self.oab}"


class ProcessoJuridico(models.Model):
    """Processo jurídico principal"""
    STATUS_CHOICES = [
        ('ABERTO', 'Aberto'),
        ('EM_ANALISE', 'Em Análise'),
        ('AGUARDANDO_DOCUMENTO', 'Aguardando Documento'),
        ('RESPONDIDO', 'Respondido'),
        ('ARQUIVADO', 'Arquivado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('MEDIA', 'Média'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]
    
    numero = models.CharField("Número do Processo", max_length=50, unique=True)
    numero_peticao = models.CharField("Número da Petição", max_length=50, blank=True)
    parte = models.CharField("Parte Envolvida", max_length=200)
    empresa_cnpj = models.CharField("CNPJ da Empresa", max_length=18, blank=True)
    
    # Dados do processo
    assunto = models.CharField("Assunto", max_length=200)
    descricao = models.TextField("Descrição")
    valor_causa = models.DecimalField("Valor da Causa", max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Controle
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='ABERTO')
    prioridade = models.CharField("Prioridade", max_length=10, choices=PRIORIDADE_CHOICES, default='MEDIA')
    data_abertura = models.DateTimeField("Data de Abertura", auto_now_add=True)
    data_limite = models.DateTimeField("Data Limite", null=True, blank=True)
    data_conclusao = models.DateTimeField("Data de Conclusão", null=True, blank=True)
    
    # Responsável
    analista = models.ForeignKey(AnalistaJuridico, on_delete=models.SET_NULL, null=True, blank=True, related_name='processos')
    
    # Metadados
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processos_criados')
    modificado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processos_modificados')
    data_modificacao = models.DateTimeField("Data de Modificação", auto_now=True)
    
    class Meta:
        verbose_name = "Processo Jurídico"
        verbose_name_plural = "Processos Jurídicos"
        ordering = ['-data_abertura']
    
    def __str__(self):
        return f"{self.numero} - {self.parte}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self._gerar_numero_processo()
        super().save(*args, **kwargs)
    
    def _gerar_numero_processo(self):
        """Gera número único do processo"""
        ano = datetime.now().year
        ultimo = ProcessoJuridico.objects.filter(
            numero__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultimo:
            try:
                seq = int(ultimo.numero.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"PROC-{seq:06d}/{ano}"
    
    @property
    def dias_restantes(self):
        """Calcula dias restantes até o prazo"""
        if self.data_limite:
            delta = self.data_limite - timezone.now()
            return delta.days
        return None
    
    @property
    def esta_atrasado(self):
        """Verifica se o processo está atrasado"""
        if self.data_limite and self.status not in ['RESPONDIDO', 'ARQUIVADO', 'CANCELADO']:
            return timezone.now() > self.data_limite
        return False


class AnaliseJuridica(models.Model):
    """Análise jurídica de um processo"""
    TIPO_ANALISE_CHOICES = [
        ('INICIAL', 'Análise Inicial'),
        ('DOCUMENTAL', 'Análise Documental'),
        ('LEGAL', 'Análise Legal'),
        ('FINAL', 'Análise Final'),
    ]
    
    processo = models.ForeignKey(ProcessoJuridico, on_delete=models.CASCADE, related_name='analises')
    tipo_analise = models.CharField("Tipo de Análise", max_length=20, choices=TIPO_ANALISE_CHOICES)
    analista = models.ForeignKey(AnalistaJuridico, on_delete=models.CASCADE, related_name='analises_realizadas')
    
    # Conteúdo da análise
    fundamentacao = models.TextField("Fundamentação Jurídica")
    conclusao = models.TextField("Conclusão")
    recomendacoes = models.TextField("Recomendações", blank=True)
    
    # Controle
    data_analise = models.DateTimeField("Data da Análise", auto_now_add=True)
    data_modificacao = models.DateTimeField("Data de Modificação", auto_now=True)
    
    class Meta:
        verbose_name = "Análise Jurídica"
        verbose_name_plural = "Análises Jurídicas"
        ordering = ['-data_analise']
    
    def __str__(self):
        return f"Análise {self.tipo_analise} - {self.processo.numero}"


class RespostaJuridica(models.Model):
    """Resposta jurídica formal"""
    TIPO_RESPOSTA_CHOICES = [
        ('DEFESA', 'Defesa'),
        ('RECURSO', 'Recurso'),
        ('PETICAO', 'Petição'),
        ('PARECER', 'Parecer'),
        ('OUTROS', 'Outros'),
    ]
    
    processo = models.ForeignKey(ProcessoJuridico, on_delete=models.CASCADE, related_name='respostas')
    tipo_resposta = models.CharField("Tipo de Resposta", max_length=20, choices=TIPO_RESPOSTA_CHOICES)
    analista = models.ForeignKey(AnalistaJuridico, on_delete=models.CASCADE, related_name='respostas_elaboradas')
    
    # Conteúdo da resposta
    titulo = models.CharField("Título", max_length=200)
    conteudo = models.TextField("Conteúdo da Resposta")
    fundamentacao_legal = models.TextField("Fundamentação Legal")
    
    # Controle
    data_elaboracao = models.DateTimeField("Data de Elaboração", auto_now_add=True)
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    enviado = models.BooleanField("Enviado", default=False)
    
    class Meta:
        verbose_name = "Resposta Jurídica"
        verbose_name_plural = "Respostas Jurídicas"
        ordering = ['-data_elaboracao']
    
    def __str__(self):
        return f"{self.tipo_resposta} - {self.processo.numero}"


class PrazoJuridico(models.Model):
    """Controle de prazos jurídicos"""
    TIPO_PRAZO_CHOICES = [
        ('RESPOSTA', 'Prazo para Resposta'),
        ('RECURSO', 'Prazo para Recurso'),
        ('DOCUMENTO', 'Prazo para Documento'),
        ('AUDIENCIA', 'Prazo para Audiência'),
        ('OUTROS', 'Outros'),
    ]
    
    STATUS_PRAZO_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('CUMPRIDO', 'Cumprido'),
        ('VENCIDO', 'Vencido'),
        ('PRORROGADO', 'Prorrogado'),
    ]
    
    processo = models.ForeignKey(ProcessoJuridico, on_delete=models.CASCADE, related_name='prazos')
    tipo_prazo = models.CharField("Tipo de Prazo", max_length=20, choices=TIPO_PRAZO_CHOICES)
    descricao = models.CharField("Descrição", max_length=200)
    
    # Datas
    data_inicio = models.DateTimeField("Data de Início")
    data_fim = models.DateTimeField("Data de Fim")
    data_cumprimento = models.DateTimeField("Data de Cumprimento", null=True, blank=True)
    
    # Controle
    status = models.CharField("Status", max_length=20, choices=STATUS_PRAZO_CHOICES, default='PENDENTE')
    responsavel = models.ForeignKey(AnalistaJuridico, on_delete=models.CASCADE, related_name='prazos_responsavel')
    
    # Notificações
    notificar_antes = models.IntegerField("Notificar (dias antes)", default=3)
    notificado = models.BooleanField("Notificado", default=False)
    
    class Meta:
        verbose_name = "Prazo Jurídico"
        verbose_name_plural = "Prazos Jurídicos"
        ordering = ['data_fim']
    
    def __str__(self):
        return f"{self.tipo_prazo} - {self.processo.numero}"
    
    @property
    def dias_restantes(self):
        """Calcula dias restantes"""
        delta = self.data_fim - timezone.now()
        return delta.days
    
    @property
    def esta_vencido(self):
        """Verifica se está vencido"""
        return timezone.now() > self.data_fim and self.status == 'PENDENTE'


class DocumentoJuridico(models.Model):
    """Documentos do processo jurídico"""
    TIPO_DOCUMENTO_CHOICES = [
        ('PETICAO', 'Petição'),
        ('DEFESA', 'Defesa'),
        ('RECURSO', 'Recurso'),
        ('PARECER', 'Parecer'),
        ('DECISAO', 'Decisão'),
        ('PROVA', 'Prova'),
        ('OUTROS', 'Outros'),
    ]
    
    processo = models.ForeignKey(ProcessoJuridico, on_delete=models.CASCADE, related_name='documentos')
    tipo_documento = models.CharField("Tipo de Documento", max_length=20, choices=TIPO_DOCUMENTO_CHOICES)
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    
    # Arquivo
    arquivo = models.FileField("Arquivo", upload_to='juridico/documentos/')
    nome_arquivo = models.CharField("Nome do Arquivo", max_length=255)
    tamanho_arquivo = models.IntegerField("Tamanho (bytes)", null=True, blank=True)
    
    # Controle
    data_upload = models.DateTimeField("Data de Upload", auto_now_add=True)
    upload_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='documentos_upload')
    
    class Meta:
        verbose_name = "Documento Jurídico"
        verbose_name_plural = "Documentos Jurídicos"
        ordering = ['-data_upload']
    
    def __str__(self):
        return f"{self.tipo_documento} - {self.titulo}"


class HistoricoJuridico(models.Model):
    """Histórico de alterações do processo"""
    processo = models.ForeignKey(ProcessoJuridico, on_delete=models.CASCADE, related_name='historico')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='alteracoes_juridicas')
    
    # Dados da alteração
    acao = models.CharField("Ação", max_length=100)
    descricao = models.TextField("Descrição")
    dados_anteriores = models.JSONField("Dados Anteriores", null=True, blank=True)
    dados_novos = models.JSONField("Dados Novos", null=True, blank=True)
    
    # Controle
    data_alteracao = models.DateTimeField("Data da Alteração", auto_now_add=True)
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    
    class Meta:
        verbose_name = "Histórico Jurídico"
        verbose_name_plural = "Históricos Jurídicos"
        ordering = ['-data_alteracao']
    
    def __str__(self):
        return f"{self.acao} - {self.processo.numero}"


class ConfiguracaoJuridico(models.Model):
    """Configurações do módulo jurídico"""
    # Prazos padrão
    prazo_resposta_padrao = models.IntegerField("Prazo Padrão para Resposta (dias)", default=15)
    prazo_recurso_padrao = models.IntegerField("Prazo Padrão para Recurso (dias)", default=30)
    
    # Notificações
    notificar_prazos_vencendo = models.BooleanField("Notificar Prazos Vencendo", default=True)
    dias_antecedencia_notificacao = models.IntegerField("Dias de Antecedência", default=3)
    
    # Configurações gerais
    permitir_upload_documentos = models.BooleanField("Permitir Upload de Documentos", default=True)
    tamanho_maximo_arquivo = models.IntegerField("Tamanho Máximo (MB)", default=10)
    tipos_arquivo_permitidos = models.CharField("Tipos Permitidos", max_length=200, default="pdf,doc,docx")
    
    # Metadados
    data_configuracao = models.DateTimeField("Data de Configuração", auto_now_add=True)
    configurado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='configuracoes_juridicas')
    
    class Meta:
        verbose_name = "Configuração Jurídica"
        verbose_name_plural = "Configurações Jurídicas"
    
    def __str__(self):
        return f"Configuração Jurídica - {self.data_configuracao.strftime('%d/%m/%Y')}"


class RecursoAdministrativo(models.Model):
    """Recursos administrativos contra multas e autos de infração"""
    TIPO_RECURSO_CHOICES = [
        ('MULTA', 'Recurso contra Multa'),
        ('AUTO_INFRACAO', 'Recurso contra Auto de Infração'),
        ('DECISAO', 'Recurso contra Decisão'),
        ('INDEFERIMENTO', 'Recurso contra Indeferimento'),
        ('OUTROS', 'Outros'),
    ]
    
    STATUS_RECURSO_CHOICES = [
        ('PROTOCOLADO', 'Protocolado'),
        ('EM_ANALISE', 'Em Análise'),
        ('AGUARDANDO_DOCUMENTO', 'Aguardando Documento'),
        ('PARECER_ELABORADO', 'Parecer Elaborado'),
        ('DEFERIDO', 'Deferido'),
        ('INDEFERIDO', 'Indeferido'),
        ('ARQUIVADO', 'Arquivado'),
    ]
    
    # Dados básicos
    numero = models.CharField("Número do Recurso", max_length=50, unique=True)
    tipo_recurso = models.CharField("Tipo de Recurso", max_length=20, choices=TIPO_RECURSO_CHOICES)
    status = models.CharField("Status", max_length=20, choices=STATUS_RECURSO_CHOICES, default='PROTOCOLADO')
    
    # Relacionamentos
    processo_origem = models.ForeignKey(ProcessoJuridico, on_delete=models.CASCADE, related_name='recursos', null=True, blank=True)
    auto_infracao = models.ForeignKey('fiscalizacao.AutoInfracao', on_delete=models.CASCADE, related_name='recursos', null=True, blank=True)
    multa = models.ForeignKey('multas.Multa', on_delete=models.CASCADE, related_name='recursos', null=True, blank=True)
    
    # Dados do recorrente
    nome_recorrente = models.CharField("Nome do Recorrente", max_length=200)
    cpf_cnpj_recorrente = models.CharField("CPF/CNPJ do Recorrente", max_length=18)
    email_recorrente = models.EmailField("Email do Recorrente", blank=True)
    telefone_recorrente = models.CharField("Telefone do Recorrente", max_length=20, blank=True)
    
    # Conteúdo do recurso
    fundamentacao = models.TextField("Fundamentação do Recurso")
    pedido = models.TextField("Pedido")
    valor_questionado = models.DecimalField("Valor Questionado", max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Controle de prazos
    data_protocolo = models.DateTimeField("Data de Protocolo", auto_now_add=True)
    data_limite_analise = models.DateTimeField("Data Limite para Análise", null=True, blank=True)
    data_conclusao = models.DateTimeField("Data de Conclusão", null=True, blank=True)
    
    # Responsável
    analista_responsavel = models.ForeignKey(AnalistaJuridico, on_delete=models.SET_NULL, null=True, blank=True, related_name='recursos_analisados')
    
    # Metadados
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recursos_criados')
    modificado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recursos_modificados')
    data_modificacao = models.DateTimeField("Data de Modificação", auto_now=True)
    
    class Meta:
        verbose_name = "Recurso Administrativo"
        verbose_name_plural = "Recursos Administrativos"
        ordering = ['-data_protocolo']
    
    def __str__(self):
        return f"{self.numero} - {self.nome_recorrente}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self._gerar_numero_recurso()
        super().save(*args, **kwargs)
    
    def _gerar_numero_recurso(self):
        """Gera número único do recurso"""
        ano = datetime.now().year
        ultimo = RecursoAdministrativo.objects.filter(
            numero__endswith=f'/{ano}'
        ).order_by('-id').first()
        
        seq = 1
        if ultimo:
            try:
                seq = int(ultimo.numero.split('/')[0].split('-')[1]) + 1
            except (ValueError, IndexError):
                seq = 1
        
        return f"REC-{seq:06d}/{ano}"
    
    @property
    def dias_restantes(self):
        """Calcula dias restantes até o prazo"""
        if self.data_limite_analise:
            delta = self.data_limite_analise - timezone.now()
            return delta.days
        return None
    
    @property
    def esta_atrasado(self):
        """Verifica se o recurso está atrasado"""
        if self.data_limite_analise and self.status not in ['DEFERIDO', 'INDEFERIDO', 'ARQUIVADO']:
            return timezone.now() > self.data_limite_analise
        return False


class ParecerJuridico(models.Model):
    """Pareceres jurídicos sobre recursos"""
    TIPO_PARECER_CHOICES = [
        ('INICIAL', 'Parecer Inicial'),
        ('TECNICO', 'Parecer Técnico'),
        ('FINAL', 'Parecer Final'),
        ('COMPLEMENTAR', 'Parecer Complementar'),
    ]
    
    RECOMENDACAO_CHOICES = [
        ('DEFERIR', 'Deferir'),
        ('INDEFERIR', 'Indeferir'),
        ('PARCIALMENTE_DEFERIDO', 'Parcialmente Deferido'),
        ('ARQUIVAR', 'Arquivar'),
        ('SOLICITAR_MAIS_INFORMACOES', 'Solicitar Mais Informações'),
    ]
    
    recurso = models.ForeignKey(RecursoAdministrativo, on_delete=models.CASCADE, related_name='pareceres')
    tipo_parecer = models.CharField("Tipo de Parecer", max_length=20, choices=TIPO_PARECER_CHOICES)
    analista = models.ForeignKey(AnalistaJuridico, on_delete=models.CASCADE, related_name='pareceres_elaborados')
    
    # Conteúdo do parecer
    fundamentacao_juridica = models.TextField("Fundamentação Jurídica")
    analise_fatos = models.TextField("Análise dos Fatos")
    conclusao = models.TextField("Conclusão")
    recomendacao = models.CharField("Recomendação", max_length=30, choices=RECOMENDACAO_CHOICES)
    observacoes = models.TextField("Observações", blank=True)
    
    # Controle
    data_elaboracao = models.DateTimeField("Data de Elaboração", auto_now_add=True)
    data_modificacao = models.DateTimeField("Data de Modificação", auto_now=True)
    assinado = models.BooleanField("Assinado", default=False)
    data_assinatura = models.DateTimeField("Data de Assinatura", null=True, blank=True)
    
    class Meta:
        verbose_name = "Parecer Jurídico"
        verbose_name_plural = "Pareceres Jurídicos"
        ordering = ['-data_elaboracao']
    
    def __str__(self):
        return f"Parecer {self.tipo_parecer} - {self.recurso.numero}"


class DocumentoRecurso(models.Model):
    """Documentos relacionados aos recursos"""
    TIPO_DOCUMENTO_CHOICES = [
        ('RECURSO', 'Recurso'),
        ('DEFESA', 'Defesa'),
        ('PROVA', 'Prova'),
        ('DECISAO', 'Decisão'),
        ('PARECER', 'Parecer'),
        ('OUTROS', 'Outros'),
    ]
    
    recurso = models.ForeignKey(RecursoAdministrativo, on_delete=models.CASCADE, related_name='documentos')
    tipo_documento = models.CharField("Tipo de Documento", max_length=20, choices=TIPO_DOCUMENTO_CHOICES)
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    
    # Arquivo
    arquivo = models.FileField("Arquivo", upload_to='juridico/recursos/documentos/')
    nome_arquivo = models.CharField("Nome do Arquivo", max_length=255)
    tamanho_arquivo = models.IntegerField("Tamanho (bytes)", null=True, blank=True)
    
    # Controle
    data_upload = models.DateTimeField("Data de Upload", auto_now_add=True)
    upload_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='documentos_recurso_upload')
    
    class Meta:
        verbose_name = "Documento de Recurso"
        verbose_name_plural = "Documentos de Recurso"
        ordering = ['-data_upload']
    
    def __str__(self):
        return f"{self.tipo_documento} - {self.titulo}"


class WorkflowJuridico(models.Model):
    """Workflow de aprovação para processos jurídicos"""
    TIPO_WORKFLOW_CHOICES = [
        ('ANALISE_JURIDICA', 'Análise Jurídica'),
        ('APROVACAO_PARECER', 'Aprovação de Parecer'),
        ('DECISAO_RECURSO', 'Decisão de Recurso'),
        ('ASSINATURA_DOCUMENTO', 'Assinatura de Documento'),
    ]
    
    STATUS_WORKFLOW_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('EM_ANALISE', 'Em Análise'),
        ('APROVADO', 'Aprovado'),
        ('REPROVADO', 'Reprovado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    tipo_workflow = models.CharField("Tipo de Workflow", max_length=30, choices=TIPO_WORKFLOW_CHOICES)
    status = models.CharField("Status", max_length=20, choices=STATUS_WORKFLOW_CHOICES, default='PENDENTE')
    
    # Relacionamentos
    processo = models.ForeignKey(ProcessoJuridico, on_delete=models.CASCADE, related_name='workflows', null=True, blank=True)
    recurso = models.ForeignKey(RecursoAdministrativo, on_delete=models.CASCADE, related_name='workflows', null=True, blank=True)
    parecer = models.ForeignKey(ParecerJuridico, on_delete=models.CASCADE, related_name='workflows', null=True, blank=True)
    
    # Controle
    responsavel_atual = models.ForeignKey(AnalistaJuridico, on_delete=models.SET_NULL, null=True, related_name='workflows_responsavel')
    data_inicio = models.DateTimeField("Data de Início", auto_now_add=True)
    data_conclusao = models.DateTimeField("Data de Conclusão", null=True, blank=True)
    observacoes = models.TextField("Observações", blank=True)
    
    class Meta:
        verbose_name = "Workflow Jurídico"
        verbose_name_plural = "Workflows Jurídicos"
        ordering = ['-data_inicio']
    
    def __str__(self):
        return f"Workflow {self.tipo_workflow} - {self.status}"


class HistoricoRecurso(models.Model):
    """Histórico de alterações dos recursos"""
    recurso = models.ForeignKey(RecursoAdministrativo, on_delete=models.CASCADE, related_name='historico')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='alteracoes_recursos')
    
    # Dados da alteração
    acao = models.CharField("Ação", max_length=100)
    descricao = models.TextField("Descrição")
    dados_anteriores = models.JSONField("Dados Anteriores", null=True, blank=True)
    dados_novos = models.JSONField("Dados Novos", null=True, blank=True)
    
    # Controle
    data_alteracao = models.DateTimeField("Data da Alteração", auto_now_add=True)
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    
    class Meta:
        verbose_name = "Histórico de Recurso"
        verbose_name_plural = "Históricos de Recurso"
        ordering = ['-data_alteracao']
    
    def __str__(self):
        return f"{self.acao} - {self.recurso.numero}"

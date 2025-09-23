from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import uuid


class CaixaEntrada(models.Model):
    """Caixa de entrada centralizada do sistema - similar ao SIGED"""
    
    TIPO_DOCUMENTO_CHOICES = [
        ('PETICAO', 'Petição'),
        ('RECURSO', 'Recurso'),
        ('DENUNCIA', 'Denúncia'),
        ('RECLAMACAO', 'Reclamação'),
        ('AUTO_INFRACAO', 'Auto de Infração'),
        ('MULTA', 'Multa'),
        ('PROTOCOLO', 'Protocolo'),
        ('DOCUMENTO_INTERNO', 'Documento Interno'),
        ('SOLICITACAO', 'Solicitação'),
        ('OUTROS', 'Outros'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]
    
    STATUS_CHOICES = [
        ('NAO_LIDO', 'Não Lido'),
        ('LIDO', 'Lido'),
        ('EM_ANALISE', 'Em Análise'),
        ('RESPONDIDO', 'Respondido'),
        ('ARQUIVADO', 'Arquivado'),
        ('ENCAMINHADO', 'Encaminhado'),
    ]
    
    # Identificação única
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_protocolo = models.CharField("Número de Protocolo", max_length=50, unique=True, blank=True)
    
    # Informações básicas
    tipo_documento = models.CharField("Tipo de Documento", max_length=20, choices=TIPO_DOCUMENTO_CHOICES)
    assunto = models.CharField("Assunto", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    prioridade = models.CharField("Prioridade", max_length=10, choices=PRIORIDADE_CHOICES, default='NORMAL')
    
    # Status e controle
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='NAO_LIDO')
    lido_em = models.DateTimeField("Lido em", null=True, blank=True)
    lido_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_lidos')
    
    # Dados do remetente/interessado
    remetente_nome = models.CharField("Nome do Remetente", max_length=200)
    remetente_documento = models.CharField("CPF/CNPJ", max_length=20, blank=True)
    remetente_email = models.EmailField("E-mail", blank=True)
    remetente_telefone = models.CharField("Telefone", max_length=20, blank=True)
    
    # Dados da empresa (se aplicável)
    empresa_nome = models.CharField("Nome da Empresa", max_length=200, blank=True)
    empresa_cnpj = models.CharField("CNPJ da Empresa", max_length=18, blank=True)
    
    # Setor responsável
    setor_destino = models.CharField("Setor Destino", max_length=100)
    responsavel_atual = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_responsavel')
    protocolo = models.ForeignKey(
        'protocolo_tramitacao.ProtocoloDocumento',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_caixa'
    )
    
    # === NOVOS CAMPOS PARA CAIXA PESSOAL E SETOR ===
    # Destinatário direto (para Caixa Pessoal)
    destinatario_direto = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='documentos_destinatario_direto',
        help_text="Usuário destinatário direto do documento"
    )
    
    # Setor de lotação do destinatário
    setor_lotacao = models.CharField("Setor de Lotação", max_length=100, blank=True)
    
    # Controle DTE
    notificado_dte = models.BooleanField("Notificado no DTE", default=False)
    data_notificacao_dte = models.DateTimeField("Data Notificação DTE", null=True, blank=True)
    
    # Relacionamento genérico com outros módulos
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    documento_relacionado = GenericForeignKey('content_type', 'object_id')
    
    # Metadados
    origem = models.CharField("Origem", max_length=50, default='PORTAL_CIDADAO')
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    user_agent = models.TextField("User Agent", blank=True)
    
    # Prazos
    prazo_resposta = models.DateTimeField("Prazo para Resposta", null=True, blank=True)
    data_entrada = models.DateTimeField("Data de Entrada", auto_now_add=True)
    data_atualizacao = models.DateTimeField("Data de Atualização", auto_now=True)
    
    # Controle de versão
    versao = models.PositiveIntegerField("Versão", default=1)
    documento_anterior = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versoes_posteriores')
    
    class Meta:
        verbose_name = "Documento na Caixa de Entrada"
        verbose_name_plural = "Documentos na Caixa de Entrada"
        ordering = ['-data_entrada']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['tipo_documento']),
            models.Index(fields=['setor_destino']),
            models.Index(fields=['prioridade']),
            models.Index(fields=['data_entrada']),
            models.Index(fields=['prazo_resposta']),
            models.Index(fields=['remetente_documento']),
            models.Index(fields=['empresa_cnpj']),
        ]
    
    def __str__(self):
        return f"{self.numero_protocolo} - {self.assunto}"
    
    def save(self, *args, **kwargs):
        # Gerar numero de protocolo se nao existir
        if not self.numero_protocolo:
            self.numero_protocolo = self._gerar_numero_protocolo()

        if getattr(self._state, 'adding', False):
            try:
                from .services import aplicar_roteamento_automatico  # import tardio para evitar ciclos
                aplicar_roteamento_automatico(self)
            except Exception:
                pass

        # Marcar como lido se status mudou
        if self.status == 'LIDO' and not self.lido_em:
            self.lido_em = timezone.now()
        
        super().save(*args, **kwargs)
    
    def _gerar_numero_protocolo(self):
        """Gera número único de protocolo"""
        from datetime import datetime
        ano = datetime.now().year
        sequencial = CaixaEntrada.objects.filter(
            data_entrada__year=ano
        ).count() + 1
        return f"PROT-{ano}-{sequencial:06d}"
    
    def marcar_como_lido(self, usuario):
        """Marca documento como lido"""
        self.status = 'LIDO'
        self.lido_por = usuario
        self.lido_em = timezone.now()
        self.save()
    
    def encaminhar_para_setor(self, setor_destino, responsavel, observacoes=""):
        """Encaminha documento para outro setor"""
        # Criar nova versão do documento
        nova_versao = CaixaEntrada.objects.create(
            tipo_documento=self.tipo_documento,
            protocolo=self.protocolo,
            assunto=self.assunto,
            descricao=self.descricao,
            prioridade=self.prioridade,
            remetente_nome=self.remetente_nome,
            remetente_documento=self.remetente_documento,
            remetente_email=self.remetente_email,
            empresa_nome=self.empresa_nome,
            empresa_cnpj=self.empresa_cnpj,
            setor_destino=setor_destino,
            responsavel_atual=responsavel,
            content_type=self.content_type,
            object_id=self.object_id,
            origem=self.origem,
            prazo_resposta=self.prazo_resposta,
            versao=self.versao + 1,
            documento_anterior=self
        )
        
        # Marcar documento atual como encaminhado
        self.status = 'ENCAMINHADO'
        self.save()
        
        return nova_versao
    
    def esta_atrasado(self):
        """Verifica se documento está atrasado"""
        if self.prazo_resposta:
            return timezone.now() > self.prazo_resposta
        return False
    
    def dias_para_vencimento(self):
        """Retorna dias para vencimento"""
        if self.prazo_resposta:
            delta = self.prazo_resposta - timezone.now()
            return delta.days
        return None


class AnexoCaixaEntrada(models.Model):
    """Anexos dos documentos na caixa de entrada"""
    
    documento = models.ForeignKey(CaixaEntrada, on_delete=models.CASCADE, related_name='anexos')
    arquivo = models.FileField("Arquivo", upload_to='caixa_entrada/anexos/%Y/%m/%d/')
    nome_original = models.CharField("Nome Original", max_length=255)
    tipo_mime = models.CharField("Tipo MIME", max_length=100)
    tamanho = models.PositiveIntegerField("Tamanho (bytes)")
    
    # Metadados
    descricao = models.CharField("Descrição", max_length=200, blank=True)
    upload_em = models.DateTimeField("Upload em", auto_now_add=True)
    upload_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = "Anexo da Caixa de Entrada"
        verbose_name_plural = "Anexos da Caixa de Entrada"
        ordering = ['-upload_em']
    
    def __str__(self):
        return f"{self.nome_original} - {self.documento.numero_protocolo}"


class HistoricoCaixaEntrada(models.Model):
    """Histórico de ações na caixa de entrada"""
    
    ACAO_CHOICES = [
        ('CRIADO', 'Documento Criado'),
        ('LIDO', 'Documento Lido'),
        ('ENCAMINHADO', 'Documento Encaminhado'),
        ('RESPONDIDO', 'Documento Respondido'),
        ('ARQUIVADO', 'Documento Arquivado'),
        ('STATUS_ALTERADO', 'Status Alterado'),
        ('PRIORIDADE_ALTERADA', 'Prioridade Alterada'),
        ('RESPONSAVEL_ALTERADO', 'Responsável Alterado'),
    ]
    
    documento = models.ForeignKey(CaixaEntrada, on_delete=models.CASCADE, related_name='historico')
    acao = models.CharField("Ação", max_length=20, choices=ACAO_CHOICES)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Detalhes da ação
    detalhes = models.TextField("Detalhes", blank=True)
    dados_anteriores = models.JSONField("Dados Anteriores", default=dict, blank=True)
    dados_novos = models.JSONField("Dados Novos", default=dict, blank=True)
    
    # Timestamp
    data_acao = models.DateTimeField("Data da Ação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Histórico da Caixa de Entrada"
        verbose_name_plural = "Histórico da Caixa de Entrada"
        ordering = ['-data_acao']
    
    def __str__(self):
        return f"{self.documento.numero_protocolo} - {self.get_acao_display()}"


class ConfiguracaoCaixaEntrada(models.Model):
    """Configurações gerais da Caixa de Entrada"""
    
    auto_distribuir = models.BooleanField("Distribuição Automática", default=True)
    notificar_novos = models.BooleanField("Notificar Novos Documentos", default=True)
    alerta_prazos = models.BooleanField("Alerta de Prazos", default=True)
    dias_alerta_prazo = models.PositiveIntegerField("Dias para Alerta de Prazo", default=3)
    
    formato_protocolo = models.CharField("Formato do Protocolo", max_length=50, default="PROT-{ANO}-{SEQUENCIAL:06d}")
    sequencial_por_ano = models.BooleanField("Sequencial por Ano", default=True)
    
    notificar_email = models.BooleanField("Notificar por Email", default=True)
    notificar_sms = models.BooleanField("Notificar por SMS", default=False)
    notificar_push = models.BooleanField("Notificar Push", default=False)
    
    dias_retencao = models.PositiveIntegerField("Dias de Retenção", default=365)
    auto_arquivar = models.BooleanField("Arquivamento Automático", default=True)
    
    class Meta:
        verbose_name = "Configuração da Caixa de Entrada"
        verbose_name_plural = "Configurações da Caixa de Entrada"
    
    def __str__(self):
        return "Configurações da Caixa de Entrada"
    
    def save(self, *args, **kwargs):
        # Garantir que existe apenas uma configuração
        if not self.pk and ConfiguracaoCaixaEntrada.objects.exists():
            raise ValueError("Já existe uma configuração da caixa de entrada")
        return super().save(*args, **kwargs)


class PermissaoSetorCaixaEntrada(models.Model):
    """Permissões de acesso por setor na Caixa de Entrada"""
    
    SETOR_CHOICES = [
        ('ATENDIMENTO', 'Atendimento/Protocolo'),
        ('FISCALIZACAO', 'Fiscalização'),
        ('JURIDICO', 'Jurídico'),
        ('DIRETORIA', 'Diretoria/Administração'),
        ('FINANCEIRO', 'Financeiro'),
        ('COBRANCA', 'Cobrança'),
        ('ADMINISTRATIVO', 'Administrativo'),
        ('GERAL', 'Acesso Geral'),
    ]
    
    setor = models.CharField("Setor", max_length=20, choices=SETOR_CHOICES, unique=True)
    usuarios = models.ManyToManyField(User, verbose_name="Usuários", related_name='permissoes_caixa_entrada')
    
    # Permissões específicas
    pode_visualizar = models.BooleanField("Pode Visualizar", default=True)
    pode_editar = models.BooleanField("Pode Editar", default=False)
    pode_encaminhar = models.BooleanField("Pode Encaminhar", default=True)
    pode_arquivar = models.BooleanField("Pode Arquivar", default=False)
    pode_excluir = models.BooleanField("Pode Excluir", default=False)
    pode_gerenciar_permissoes = models.BooleanField("Pode Gerenciar Permissões", default=False)
    
    # Setores que pode visualizar (para acesso cruzado)
    setores_permitidos = models.JSONField("Setores Permitidos", default=list, blank=True)
    
    # Documentos que pode visualizar independente do setor
    tipos_documento_permitidos = models.JSONField("Tipos de Documento Permitidos", default=list, blank=True)
    
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Permissão de Setor - Caixa de Entrada"
        verbose_name_plural = "Permissões de Setor - Caixa de Entrada"
        ordering = ['setor']
    
    def __str__(self):
        return f"Permissões - {self.get_setor_display()}"
    
    def pode_acessar_documento(self, documento):
        """Verifica se o setor pode acessar um documento específico"""
        # Se tem acesso geral, pode acessar tudo
        if self.setor == 'GERAL':
            return True
        
        # Se o documento é do próprio setor
        if documento.setor_destino == self.get_setor_display():
            return True
        
        # Se o setor está na lista de setores permitidos
        if documento.setor_destino in self.setores_permitidos:
            return True
        
        # Se o tipo de documento está na lista de tipos permitidos
        if documento.tipo_documento in self.tipos_documento_permitidos:
            return True
        
        return False


class AcessoEspecialCaixaEntrada(models.Model):
    """Acesso especial concedido pelo administrador"""
    
    MOTIVO_CHOICES = [
        ('ANALISE_ESPECIAL', 'Análise Especial'),
        ('COORDENACAO', 'Coordenação de Processo'),
        ('AUDITORIA', 'Auditoria'),
        ('SUPORTE', 'Suporte Técnico'),
        ('OUTROS', 'Outros'),
    ]
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Usuário")
    documento = models.ForeignKey(CaixaEntrada, on_delete=models.CASCADE, verbose_name="Documento")
    motivo = models.CharField("Motivo", max_length=20, choices=MOTIVO_CHOICES)
    observacoes = models.TextField("Observações", blank=True)
    
    # Permissões específicas
    pode_editar = models.BooleanField("Pode Editar", default=False)
    pode_encaminhar = models.BooleanField("Pode Encaminhar", default=True)
    pode_arquivar = models.BooleanField("Pode Arquivar", default=False)
    
    # Controle temporal
    data_inicio = models.DateTimeField("Data de Início", auto_now_add=True)
    data_fim = models.DateTimeField("Data de Fim", null=True, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    
    # Controle administrativo
    concedido_por = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        verbose_name="Concedido por",
        related_name='acessos_especiais_concedidos'
    )
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    
    class Meta:
        verbose_name = "Acesso Especial - Caixa de Entrada"
        verbose_name_plural = "Acessos Especiais - Caixa de Entrada"
        ordering = ['-criado_em']
        unique_together = ['usuario', 'documento', 'ativo']
    
    def __str__(self):
        return f"Acesso Especial - {self.usuario.username} - {self.documento.numero_protocolo}"
    
    def esta_valido(self):
        """Verifica se o acesso especial ainda é válido"""
        if not self.ativo:
            return False
        
        if self.data_fim and timezone.now() > self.data_fim:
            return False
        
        return True



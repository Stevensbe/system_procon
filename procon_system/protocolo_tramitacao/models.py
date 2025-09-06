from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class TipoDocumento(models.Model):
    """Tipos de documentos que podem ser protocolados"""
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    prazo_resposta_dias = models.IntegerField(default=30)
    requer_assinatura = models.BooleanField(default=False)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Tipo de Documento"
        verbose_name_plural = "Tipos de Documentos"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class Setor(models.Model):
    """Setores que participam da tramitação"""
    nome = models.CharField(max_length=100)
    sigla = models.CharField(max_length=10)
    responsavel = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    email = models.EmailField(blank=True)
    pode_protocolar = models.BooleanField(default=True)
    pode_tramitar = models.BooleanField(default=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Setor"
        verbose_name_plural = "Setores"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.sigla} - {self.nome}"


class ProtocoloDocumento(models.Model):
    """Protocolo principal do documento"""
    
    ORIGEM_CHOICES = [
        ('EXTERNO', 'Documento Externo'),
        ('FISCALIZACAO', 'Auto de Fiscalização'),
        ('INTERNO', 'Documento Interno'),
        ('PETICIONAMENTO', 'Peticionamento'),
        ('DIGITAL', 'Documento Digital'),
    ]
    
    STATUS_CHOICES = [
        ('PROTOCOLADO', 'Protocolado'),
        ('EM_TRAMITACAO', 'Em Tramitação'),
        ('AGUARDANDO_ANALISE', 'Aguardando Análise'),
        ('EM_ANALISE', 'Em Análise'),
        ('AGUARDANDO_DECISAO', 'Aguardando Decisão'),
        ('DECIDIDO', 'Decidido'),
        ('ARQUIVADO', 'Arquivado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]
    
    # Número único nacional de protocolo
    numero_protocolo = models.CharField(max_length=50, unique=True, db_index=True)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    # Informações básicas
    tipo_documento = models.ForeignKey(TipoDocumento, on_delete=models.PROTECT)
    origem = models.CharField(max_length=20, choices=ORIGEM_CHOICES)
    assunto = models.CharField(max_length=200)
    descricao = models.TextField()
    
    # Status e controle
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROTOCOLADO')
    prioridade = models.CharField(max_length=10, choices=PRIORIDADE_CHOICES, default='NORMAL')
    
    # Dados do remetente/interessado
    remetente_nome = models.CharField(max_length=200)
    remetente_documento = models.CharField(max_length=50, help_text="CPF/CNPJ")
    remetente_email = models.EmailField(blank=True)
    remetente_telefone = models.CharField(max_length=20, blank=True)
    remetente_endereco = models.TextField(blank=True)
    
    # Relações com módulos específicos
    processo_fiscalizacao = models.ForeignKey(
        'fiscalizacao.Processo', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Processo de fiscalização relacionado"
    )
    
    auto_infracao = models.ForeignKey(
        'fiscalizacao.AutoInfracao',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Auto de infração relacionado"
    )
    
    multa_relacionada = models.ForeignKey(
        'multas.Multa',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Multa relacionada ao protocolo"
    )
    
    # Setor atual
    setor_atual = models.ForeignKey(Setor, on_delete=models.PROTECT, related_name='documentos_no_setor')
    setor_origem = models.ForeignKey(Setor, on_delete=models.PROTECT, related_name='documentos_originados')
    
    # Prazos
    prazo_resposta = models.DateTimeField(help_text="Prazo para resposta/análise")
    data_protocolo = models.DateTimeField(auto_now_add=True)
    data_conclusao = models.DateTimeField(null=True, blank=True)
    
    # Controle de usuários
    protocolado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='documentos_protocolados')
    responsavel_atual = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Observações
    observacoes = models.TextField(blank=True)
    sigiloso = models.BooleanField(default=False)
    
    # Controle
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Protocolo de Documento"
        verbose_name_plural = "Protocolos de Documentos"
        ordering = ['-data_protocolo']
        indexes = [
            models.Index(fields=['numero_protocolo']),
            models.Index(fields=['status']),
            models.Index(fields=['setor_atual']),
            models.Index(fields=['data_protocolo']),
        ]
    
    def __str__(self):
        return f"Protocolo {self.numero_protocolo} - {self.assunto}"
    
    def save(self, *args, **kwargs):
        if not self.numero_protocolo:
            self.numero_protocolo = self.gerar_numero_protocolo()
        if not self.prazo_resposta:
            self.prazo_resposta = self.calcular_prazo_resposta()
        super().save(*args, **kwargs)
    
    def gerar_numero_protocolo(self):
        """Gera número único de protocolo no formato: YYYYMMDD-HHMMSS-XXX"""
        from datetime import datetime
        agora = datetime.now()
        data_str = agora.strftime('%Y%m%d')
        hora_str = agora.strftime('%H%M%S')
        
        # Sequencial do dia
        count = ProtocoloDocumento.objects.filter(
            data_protocolo__date=agora.date()
        ).count() + 1
        
        return f"{data_str}-{hora_str}-{count:03d}"
    
    def calcular_prazo_resposta(self):
        """Calcula prazo baseado no tipo de documento"""
        from datetime import timedelta
        prazo_dias = self.tipo_documento.prazo_resposta_dias
        return timezone.now() + timedelta(days=prazo_dias)
    
    @property
    def esta_no_prazo(self):
        """Verifica se o documento está dentro do prazo"""
        return timezone.now() <= self.prazo_resposta
    
    @property
    def dias_para_vencimento(self):
        """Calcula dias restantes para vencimento"""
        delta = self.prazo_resposta - timezone.now()
        return delta.days if delta.days >= 0 else 0
    
    @classmethod
    def criar_a_partir_de_auto_infracao(cls, auto_infracao, setor_destino, usuario):
        """Cria protocolo automaticamente a partir de um auto de infração"""
        # TipoDocumento and Setor are already in scope
        
        # Busca ou cria tipo de documento para auto de infração
        tipo_doc, created = TipoDocumento.objects.get_or_create(
            nome="Auto de Infração",
            defaults={
                'descricao': 'Auto de infração para tramitação',
                'prazo_resposta_dias': 15,
                'requer_assinatura': True
            }
        )
        
        # Busca setor de origem (Fiscalização)
        setor_origem = Setor.objects.filter(sigla__icontains='FISC').first()
        if not setor_origem:
            setor_origem = setor_destino
        
        # Cria o protocolo
        protocolo = cls.objects.create(
            tipo_documento=tipo_doc,
            origem='FISCALIZACAO',
            assunto=f"Auto de Infração {auto_infracao.numero} - {auto_infracao.razao_social}",
            descricao=f"Tramitação do Auto de Infração {auto_infracao.numero}",
            remetente_nome=auto_infracao.razao_social,
            remetente_documento=auto_infracao.cnpj,
            auto_infracao=auto_infracao,
            setor_atual=setor_destino,
            setor_origem=setor_origem,
            protocolado_por=usuario,
            responsavel_atual=setor_destino.responsavel
        )
        
        return protocolo
    
    @classmethod
    def criar_a_partir_de_multa(cls, multa, setor_destino, usuario):
        """Cria protocolo automaticamente a partir de uma multa"""
        # TipoDocumento and Setor are already in scope
        
        # Busca ou cria tipo de documento para multa
        tipo_doc, created = TipoDocumento.objects.get_or_create(
            nome="Cobrança de Multa",
            defaults={
                'descricao': 'Cobrança de multa administrativa',
                'prazo_resposta_dias': 30,
                'requer_assinatura': False
            }
        )
        
        # Busca setor de origem (Financeiro/Cobrança)
        setor_origem = Setor.objects.filter(sigla__icontains='FIN').first()
        if not setor_origem:
            setor_origem = setor_destino
        
        # Cria o protocolo
        protocolo = cls.objects.create(
            tipo_documento=tipo_doc,
            origem='INTERNO',
            assunto=f"Cobrança de Multa - {multa.empresa.razao_social}",
            descricao=f"Cobrança referente à multa no valor de R$ {multa.valor}",
            remetente_nome=multa.empresa.razao_social,
            remetente_documento=multa.empresa.cnpj,
            multa_relacionada=multa,
            setor_atual=setor_destino,
            setor_origem=setor_origem,
            protocolado_por=usuario
        )
        
        return protocolo
    
    def tramitar_para_setor(self, setor_destino, motivo, usuario, prazo_dias=None):
        """Tramita o protocolo para outro setor"""
        # Cria registro de tramitação
        tramitacao = TramitacaoDocumento.objects.create(
            protocolo=self,
            acao='ENCAMINHADO',
            setor_origem=self.setor_atual,
            setor_destino=setor_destino,
            motivo=motivo,
            prazo_dias=prazo_dias,
            usuario=usuario
        )
        
        # Atualiza protocolo
        self.setor_atual = setor_destino
        self.status = 'EM_TRAMITACAO'
        if setor_destino.responsavel:
            self.responsavel_atual = setor_destino.responsavel
        self.save()
        
        return tramitacao
    
    def finalizar_protocolo(self, observacoes="", usuario=None):
        """Finaliza o protocolo"""
        self.status = 'DECIDIDO'
        self.data_conclusao = timezone.now()
        if observacoes:
            self.observacoes = f"{self.observacoes}\n{observacoes}".strip()
        self.save()
        
        # Registra tramitação de finalização
        if usuario:
            TramitacaoDocumento.objects.create(
                protocolo=self,
                acao='DECISAO_TOMADA',
                setor_origem=self.setor_atual,
                setor_destino=self.setor_atual,
                motivo="Protocolo finalizado",
                observacoes=observacoes,
                usuario=usuario
            )


class AnexoProtocolo(models.Model):
    """Arquivos anexados ao protocolo"""
    
    protocolo = models.ForeignKey(ProtocoloDocumento, on_delete=models.CASCADE, related_name='anexos')
    nome_arquivo = models.CharField(max_length=255)
    arquivo = models.FileField(upload_to='protocolo/anexos/%Y/%m/%d/')
    tipo_mime = models.CharField(max_length=100)
    tamanho_bytes = models.BigIntegerField()
    hash_arquivo = models.CharField(max_length=64, help_text="SHA-256 do arquivo")
    
    # Metadados
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT)
    upload_em = models.DateTimeField(auto_now_add=True)
    descricao = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Anexo do Protocolo"
        verbose_name_plural = "Anexos dos Protocolos"
        ordering = ['-upload_em']
    
    def __str__(self):
        return f"{self.nome_arquivo} - {self.protocolo.numero_protocolo}"


class TramitacaoDocumento(models.Model):
    """Histórico de tramitação do documento"""
    
    ACAO_CHOICES = [
        ('PROTOCOLADO', 'Documento Protocolado'),
        ('ENCAMINHADO', 'Encaminhado para Setor'),
        ('RECEBIDO', 'Recebido pelo Setor'),
        ('EM_ANALISE', 'Colocado em Análise'),
        ('SOLICITACAO_INFO', 'Solicitação de Informações'),
        ('PARECER_EMITIDO', 'Parecer Emitido'),
        ('DECISAO_TOMADA', 'Decisão Tomada'),
        ('DEVOLVIDO', 'Devolvido ao Setor Anterior'),
        ('ARQUIVADO', 'Arquivado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    protocolo = models.ForeignKey(ProtocoloDocumento, on_delete=models.CASCADE, related_name='tramitacoes')
    
    # Movimentação
    acao = models.CharField(max_length=20, choices=ACAO_CHOICES)
    setor_origem = models.ForeignKey(Setor, on_delete=models.PROTECT, related_name='tramitacoes_enviadas')
    setor_destino = models.ForeignKey(Setor, on_delete=models.PROTECT, related_name='tramitacoes_recebidas')
    
    # Informações da tramitação
    motivo = models.TextField(help_text="Motivo da tramitação")
    observacoes = models.TextField(blank=True)
    prazo_dias = models.IntegerField(null=True, blank=True, help_text="Prazo em dias para retorno")
    
    # Controle
    usuario = models.ForeignKey(User, on_delete=models.PROTECT)
    data_tramitacao = models.DateTimeField(auto_now_add=True)
    data_recebimento = models.DateTimeField(null=True, blank=True)
    recebido_por = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='tramitacoes_recebidas'
    )
    
    # Assinatura digital da tramitação
    hash_tramitacao = models.CharField(max_length=64, blank=True)
    
    class Meta:
        verbose_name = "Tramitação de Documento"
        verbose_name_plural = "Tramitações de Documentos"
        ordering = ['-data_tramitacao']
        indexes = [
            models.Index(fields=['protocolo', 'data_tramitacao']),
            models.Index(fields=['setor_destino', 'data_recebimento']),
        ]
    
    def __str__(self):
        return f"{self.protocolo.numero_protocolo} - {self.acao} ({self.setor_origem} → {self.setor_destino})"
    
    def save(self, *args, **kwargs):
        if not self.hash_tramitacao:
            self.hash_tramitacao = self.gerar_hash_tramitacao()
        super().save(*args, **kwargs)
    
    def gerar_hash_tramitacao(self):
        """Gera hash para integridade da tramitação"""
        import hashlib
        data = f"{self.protocolo.numero_protocolo}{self.acao}{self.setor_origem.id}{self.setor_destino.id}{self.usuario.id}"
        return hashlib.sha256(data.encode()).hexdigest()


class ConfiguracaoProtocolo(models.Model):
    """Configurações do sistema de protocolo"""
    
    # Numeração
    formato_protocolo = models.CharField(max_length=50, default='YYYYMMDD-HHMMSS-XXX')
    prefixo_protocolo = models.CharField(max_length=10, blank=True)
    
    # Prazos padrão
    prazo_padrao_dias = models.IntegerField(default=30)
    prazo_urgente_dias = models.IntegerField(default=5)
    
    # Notificações
    notificar_vencimento_dias = models.IntegerField(default=3)
    notificar_responsavel = models.BooleanField(default=True)
    notificar_setor = models.BooleanField(default=True)
    
    # Configurações de arquivo
    tamanho_maximo_mb = models.IntegerField(default=10)
    tipos_arquivo_permitidos = models.TextField(
        default='pdf,doc,docx,jpg,jpeg,png,txt',
        help_text="Tipos separados por vírgula"
    )
    
    # Backup e arquivamento
    dias_backup_automatico = models.IntegerField(default=1)
    dias_arquivamento_automatico = models.IntegerField(default=365)
    
    class Meta:
        verbose_name = "Configuração do Protocolo"
        verbose_name_plural = "Configurações do Protocolo"
    
    def __str__(self):
        return "Configurações do Sistema de Protocolo"

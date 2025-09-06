from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import os
from datetime import datetime, timedelta


def anexo_upload_path(instance, filename):
    """Define o caminho de upload para anexos"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"peticionamento/anexos/{instance.peticao.numero_peticao}/{filename}"


class TipoPeticao(models.Model):
    """Tipos de petições disponíveis no sistema"""
    
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    categoria = models.CharField("Categoria", max_length=50, choices=[
        ('DEFESA', 'Defesa'),
        ('SOLICITACAO', 'Solicitação'),
        ('RECURSO', 'Recurso'),
        ('OUTROS', 'Outros'),
    ])
    
    # Configurações do tipo
    prazo_resposta_dias = models.IntegerField("Prazo de Resposta (dias)", default=30)
    requer_documentos = models.BooleanField("Requer Documentos", default=True)
    permite_anonimo = models.BooleanField("Permite Anônimo", default=False)
    notificar_email = models.BooleanField("Notificar por Email", default=True)
    notificar_sms = models.BooleanField("Notificar por SMS", default=False)
    
    # Campos para formulário dinâmico
    campos_obrigatorios = models.JSONField("Campos Obrigatórios", default=list, blank=True)
    campos_opcionais = models.JSONField("Campos Opcionais", default=list, blank=True)
    
    # Validação de documentos
    documentos_obrigatorios = models.JSONField("Documentos Obrigatórios", default=list, blank=True)
    documentos_opcionais = models.JSONField("Documentos Opcionais", default=list, blank=True)
    tamanho_maximo_mb = models.IntegerField("Tamanho Máximo por Arquivo (MB)", default=10)
    tipos_arquivo_permitidos = models.TextField("Tipos Permitidos", default="pdf,doc,docx,jpg,jpeg,png,txt")
    
    # Status e controle
    ativo = models.BooleanField("Ativo", default=True)
    ordem_exibicao = models.IntegerField("Ordem de Exibição", default=0)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Tipo de Petição"
        verbose_name_plural = "Tipos de Petições"
        ordering = ['ordem_exibicao', 'nome']
        indexes = [
            models.Index(fields=['categoria']),
            models.Index(fields=['ativo']),
            models.Index(fields=['ordem_exibicao']),
        ]
    
    def __str__(self):
        return f"{self.nome} ({self.get_categoria_display()})"
    
    def get_campos_formulario(self):
        """Retorna todos os campos do formulário dinâmico"""
        campos = {}
        
        # Campos obrigatórios
        for campo in self.campos_obrigatorios:
            campos[campo['nome']] = {
                'tipo': campo.get('tipo', 'text'),
                'label': campo.get('label', campo['nome']),
                'obrigatorio': True,
                'opcoes': campo.get('opcoes', []),
                'validacao': campo.get('validacao', {})
            }
        
        # Campos opcionais
        for campo in self.campos_opcionais:
            campos[campo['nome']] = {
                'tipo': campo.get('tipo', 'text'),
                'label': campo.get('label', campo['nome']),
                'obrigatorio': False,
                'opcoes': campo.get('opcoes', []),
                'validacao': campo.get('validacao', {})
            }
        
        return campos


class PeticaoEletronica(models.Model):
    """Petição eletrônica principal"""
    
    STATUS_CHOICES = [
        ('RASCUNHO', 'Rascunho'),
        ('ENVIADA', 'Enviada'),
        ('RECEBIDA', 'Recebida'),
        ('EM_ANALISE', 'Em Análise'),
        ('AGUARDANDO_INFO', 'Aguardando Informações'),
        ('RESPONDIDA', 'Respondida'),
        ('FINALIZADA', 'Finalizada'),
        ('CANCELADA', 'Cancelada'),
        ('REJEITADA', 'Rejeitada'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]
    
    ORIGEM_CHOICES = [
        ('PORTAL_CIDADAO', 'Portal do Cidadão'),
        ('SISTEMA_INTERNO', 'Sistema Interno'),
        ('API_EXTERNA', 'API Externa'),
        ('IMPORTACAO', 'Importação'),
    ]
    
    # Números e identificadores
    numero_peticao = models.CharField("Número da Petição", max_length=50, unique=True, blank=True)
    protocolo_numero = models.CharField("Número do Protocolo", max_length=50, blank=True)
    uuid = models.UUIDField("UUID", default=uuid.uuid4, editable=False, unique=True)
    
    # Informações básicas
    tipo_peticao = models.ForeignKey(TipoPeticao, on_delete=models.PROTECT, verbose_name="Tipo de Petição")
    assunto = models.CharField("Assunto", max_length=200)
    descricao = models.TextField("Descrição")
    
    # Status e controle
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='RASCUNHO')
    prioridade = models.CharField("Prioridade", max_length=10, choices=PRIORIDADE_CHOICES, default='NORMAL')
    origem = models.CharField("Origem", max_length=20, choices=ORIGEM_CHOICES, default='PORTAL_CIDADAO')
    
    # Dados do peticionário
    peticionario_nome = models.CharField("Nome do Peticionário", max_length=200)
    peticionario_documento = models.CharField("CPF/CNPJ", max_length=20)
    peticionario_email = models.EmailField("E-mail")
    peticionario_telefone = models.CharField("Telefone", max_length=20, blank=True)
    peticionario_endereco = models.TextField("Endereço", blank=True)
    peticionario_cep = models.CharField("CEP", max_length=10, blank=True)
    peticionario_cidade = models.CharField("Cidade", max_length=100, blank=True)
    peticionario_uf = models.CharField("UF", max_length=2, blank=True)
    
    # Dados da empresa (se aplicável)
    empresa_nome = models.CharField("Nome da Empresa", max_length=200, blank=True)
    empresa_cnpj = models.CharField("CNPJ da Empresa", max_length=20, blank=True)
    empresa_endereco = models.TextField("Endereço da Empresa", blank=True)
    empresa_telefone = models.CharField("Telefone da Empresa", max_length=20, blank=True)
    empresa_email = models.EmailField("E-mail da Empresa", blank=True)
    
    # Dados do processo
    valor_causa = models.DecimalField("Valor da Causa", max_digits=15, decimal_places=2, null=True, blank=True)
    data_fato = models.DateField("Data do Fato", null=True, blank=True)
    
    # Prazos
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    prazo_resposta = models.DateTimeField("Prazo para Resposta", null=True, blank=True)
    
    # Usuários
    usuario_criacao = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='peticoes_criadas',
        verbose_name="Criado por"
    )
    responsavel_atual = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='peticoes_responsavel',
        verbose_name="Responsável Atual"
    )
    
    # Configurações especiais
    anonima = models.BooleanField("Petição Anônima", default=False)
    confidencial = models.BooleanField("Confidencial", default=False)
    notificar_peticionario = models.BooleanField("Notificar Peticionário", default=True)
    
    # Campos dinâmicos (dados específicos do tipo de petição)
    dados_especificos = models.JSONField("Dados Específicos", default=dict, blank=True)
    
    # Validação
    validada = models.BooleanField("Validada", default=False)
    validada_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Validada por")
    data_validacao = models.DateTimeField("Data de Validação", null=True, blank=True)
    observacoes_validacao = models.TextField("Observações da Validação", blank=True)
    
    # Metadados
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    user_agent = models.TextField("User Agent", blank=True)
    
    # Controle de versão
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Petição Eletrônica"
        verbose_name_plural = "Petições Eletrônicas"
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['numero_peticao']),
            models.Index(fields=['protocolo_numero']),
            models.Index(fields=['status']),
            models.Index(fields=['tipo_peticao']),
            models.Index(fields=['peticionario_documento']),
            models.Index(fields=['empresa_cnpj']),
            models.Index(fields=['data_envio']),
            models.Index(fields=['prazo_resposta']),
            models.Index(fields=['prioridade']),
        ]
    
    def __str__(self):
        return f"Petição {self.numero_peticao} - {self.assunto}"
    
    def save(self, *args, **kwargs):
        """Override do save para gerar números automáticos"""
        if not self.numero_peticao:
            self.numero_peticao = self.gerar_numero_peticao()
        
        if not self.protocolo_numero:
            self.protocolo_numero = self.gerar_numero_protocolo()
        
        if not self.prazo_resposta and self.tipo_peticao:
            self.prazo_resposta = timezone.now() + timedelta(days=self.tipo_peticao.prazo_resposta_dias)
        
        super().save(*args, **kwargs)
    
    def gerar_numero_peticao(self):
        """Gera número único da petição"""
        ano_atual = datetime.now().year
        count = PeticaoEletronica.objects.filter(
            criado_em__year=ano_atual
        ).count() + 1
        return f"PET-{ano_atual}-{count:06d}"
    
    def gerar_numero_protocolo(self):
        """Gera número único do protocolo"""
        ano_atual = datetime.now().year
        count = PeticaoEletronica.objects.filter(
            criado_em__year=ano_atual
        ).count() + 1
        return f"PROT-{ano_atual}-{count:06d}"
    
    @property
    def esta_no_prazo(self):
        """Verifica se a petição está dentro do prazo"""
        if self.prazo_resposta:
            return timezone.now() <= self.prazo_resposta
        return True
    
    @property
    def dias_para_vencimento(self):
        """Calcula dias restantes para vencimento"""
        if self.prazo_resposta:
            delta = self.prazo_resposta - timezone.now()
            return delta.days if delta.days >= 0 else 0
        return None
    
    def validar_peticao(self, usuario, observacoes=""):
        """Valida a petição"""
        self.validada = True
        self.validada_por = usuario
        self.data_validacao = timezone.now()
        self.observacoes_validacao = observacoes
        self.save()
    
    def enviar_peticao(self):
        """Envia a petição"""
        self.status = 'ENVIADA'
        self.data_envio = timezone.now()
        self.save()
    
    def receber_peticao(self):
        """Recebe a petição"""
        self.status = 'RECEBIDA'
        self.save()


class AnexoPeticao(models.Model):
    """Anexos da petição"""
    
    TIPO_CHOICES = [
        ('DOCUMENTO', 'Documento'),
        ('COMPROVANTE', 'Comprovante'),
        ('FOTO', 'Foto'),
        ('VIDEO', 'Vídeo'),
        ('AUDIO', 'Áudio'),
        ('OUTROS', 'Outros'),
    ]
    
    peticao = models.ForeignKey(PeticaoEletronica, on_delete=models.CASCADE, related_name='anexos', verbose_name="Petição")
    tipo = models.CharField("Tipo", max_length=20, choices=TIPO_CHOICES, default='DOCUMENTO')
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    
    # Arquivo
    arquivo = models.FileField("Arquivo", upload_to=anexo_upload_path)
    nome_original = models.CharField("Nome Original", max_length=255)
    tamanho_bytes = models.BigIntegerField("Tamanho (bytes)")
    extensao = models.CharField("Extensão", max_length=10)
    
    # Validação
    validado = models.BooleanField("Validado", default=False)
    validado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Validado por", related_name='anexos_validados')
    data_validacao = models.DateTimeField("Data de Validação", null=True, blank=True)
    observacoes_validacao = models.TextField("Observações da Validação", blank=True)
    
    # OCR e processamento
    texto_extraido = models.TextField("Texto Extraído (OCR)", blank=True)
    processado = models.BooleanField("Processado", default=False)
    
    # Controle
    enviado_por = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name="Enviado por", related_name='anexos_enviados')
    data_upload = models.DateTimeField("Data de Upload", auto_now_add=True)
    
    class Meta:
        verbose_name = "Anexo da Petição"
        verbose_name_plural = "Anexos da Petição"
        ordering = ['-data_upload']
    
    def __str__(self):
        return f"{self.titulo} - {self.peticao.numero_peticao}"
    
    def save(self, *args, **kwargs):
        # Definir nome original e extensão
        if self.arquivo and not self.nome_original:
            self.nome_original = os.path.basename(self.arquivo.name)
            self.extensao = os.path.splitext(self.arquivo.name)[1][1:].upper()
        
        # Definir tamanho
        if self.arquivo and not self.tamanho_bytes:
            try:
                self.tamanho_bytes = self.arquivo.size
            except:
                pass
        
        super().save(*args, **kwargs)
    
    @property
    def tamanho_formatado(self):
        """Retorna o tamanho formatado"""
        if self.tamanho_bytes < 1024:
            return f"{self.tamanho_bytes} B"
        elif self.tamanho_bytes < 1024**2:
            return f"{self.tamanho_bytes/1024:.1f} KB"
        elif self.tamanho_bytes < 1024**3:
            return f"{self.tamanho_bytes/(1024**2):.1f} MB"
        else:
            return f"{self.tamanho_bytes/(1024**3):.1f} GB"
    
    def validar_anexo(self, usuario, observacoes=""):
        """Valida o anexo"""
        self.validado = True
        self.validado_por = usuario
        self.data_validacao = timezone.now()
        self.observacoes_validacao = observacoes
        self.save()


class InteracaoPeticao(models.Model):
    """Histórico de interações com a petição"""
    
    TIPO_INTERACAO_CHOICES = [
        ('CRIACAO', 'Criação'),
        ('ENVIO', 'Envio'),
        ('RECEBIMENTO', 'Recebimento'),
        ('ANALISE_INICIADA', 'Análise Iniciada'),
        ('SOLICITACAO_INFO', 'Solicitação de Informações'),
        ('INFO_COMPLEMENTAR', 'Informações Complementares'),
        ('PARECER', 'Parecer Técnico'),
        ('RESPOSTA', 'Resposta'),
        ('FINALIZACAO', 'Finalização'),
        ('CANCELAMENTO', 'Cancelamento'),
        ('REJEICAO', 'Rejeição'),
        ('ALTERACAO_STATUS', 'Alteração de Status'),
        ('ALTERACAO_RESPONSAVEL', 'Alteração de Responsável'),
        ('COMENTARIO', 'Comentário'),
    ]
    
    peticao = models.ForeignKey(PeticaoEletronica, on_delete=models.CASCADE, related_name='interacoes', verbose_name="Petição")
    tipo_interacao = models.CharField("Tipo", max_length=25, choices=TIPO_INTERACAO_CHOICES)
    
    # Dados da interação
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição")
    observacoes = models.TextField("Observações", blank=True)
    
    # Status anterior e novo (para mudanças de status)
    status_anterior = models.CharField("Status Anterior", max_length=20, blank=True)
    status_novo = models.CharField("Status Novo", max_length=20, blank=True)
    
    # Dados do usuário
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Usuário")
    nome_usuario = models.CharField("Nome do Usuário", max_length=200, blank=True)
    
    # Dados de sistema
    ip_origem = models.GenericIPAddressField("IP", null=True, blank=True)
    user_agent = models.TextField("User Agent", blank=True)
    
    # Anexos da interação
    arquivo_anexo = models.FileField("Arquivo Anexo", upload_to='peticionamento/interacoes/%Y/%m/%d/', blank=True)
    
    # Controle
    data_interacao = models.DateTimeField("Data da Interação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Interação da Petição"
        verbose_name_plural = "Interações da Petição"
        ordering = ['-data_interacao']
    
    def __str__(self):
        return f"{self.peticao.numero_peticao} - {self.get_tipo_interacao_display()}"


class RespostaPeticao(models.Model):
    """Resposta oficial à petição"""
    
    TIPO_RESPOSTA_CHOICES = [
        ('PROCEDENTE', 'Procedente'),
        ('IMPROCEDENTE', 'Improcedente'),
        ('PARCIALMENTE_PROCEDENTE', 'Parcialmente Procedente'),
        ('ORIENTACAO', 'Orientação'),
        ('ENCAMINHAMENTO', 'Encaminhamento'),
        ('ARQUIVAMENTO', 'Arquivamento'),
        ('OUTROS', 'Outros'),
    ]
    
    peticao = models.OneToOneField(PeticaoEletronica, on_delete=models.CASCADE, related_name='resposta', verbose_name="Petição")
    tipo_resposta = models.CharField("Tipo de Resposta", max_length=30, choices=TIPO_RESPOSTA_CHOICES)
    
    # Conteúdo da resposta
    titulo = models.CharField("Título", max_length=200)
    conteudo = models.TextField("Conteúdo da Resposta")
    fundamentacao = models.TextField("Fundamentação Legal", blank=True)
    orientacoes = models.TextField("Orientações", blank=True)
    
    # Dados do responsável
    responsavel = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name="Responsável")
    cargo_responsavel = models.CharField("Cargo", max_length=100, blank=True)
    
    # Controle de documento
    numero_documento = models.CharField("Número do Documento", max_length=50, blank=True)
    arquivo_resposta = models.FileField("Arquivo da Resposta", upload_to='peticionamento/respostas/%Y/%m/%d/', blank=True)
    
    # Datas
    data_elaboracao = models.DateTimeField("Data de Elaboração", auto_now_add=True)
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    
    # Notificação
    enviado_email = models.BooleanField("Enviado por E-mail", default=False)
    enviado_sms = models.BooleanField("Enviado por SMS", default=False)
    enviado_portal = models.BooleanField("Disponível no Portal", default=True)
    
    class Meta:
        verbose_name = "Resposta da Petição"
        verbose_name_plural = "Respostas da Petição"
    
    def __str__(self):
        return f"Resposta - {self.peticao.numero_peticao}"
    
    def enviar(self):
        """Envia a resposta"""
        self.data_envio = timezone.now()
        self.peticao.status = 'RESPONDIDA'
        self.peticao.save()
        self.save()


class ConfiguracaoPeticionamento(models.Model):
    """Configurações do sistema de peticionamento"""
    
    # Configurações gerais
    sistema_ativo = models.BooleanField("Sistema Ativo", default=True)
    manutencao = models.BooleanField("Em Manutenção", default=False)
    mensagem_manutencao = models.TextField("Mensagem de Manutenção", blank=True)
    
    # Prazos padrão
    prazo_padrao_resposta_dias = models.IntegerField("Prazo Padrão de Resposta (dias)", default=30)
    prazo_urgente_resposta_dias = models.IntegerField("Prazo Urgente de Resposta (dias)", default=5)
    prazo_notificacao_vencimento_dias = models.IntegerField("Notificar Vencimento (dias antes)", default=3)
    
    # Limites de arquivo
    tamanho_maximo_arquivo_mb = models.IntegerField("Tamanho Máximo por Arquivo (MB)", default=10)
    numero_maximo_anexos = models.IntegerField("Número Máximo de Anexos", default=5)
    tipos_arquivo_permitidos = models.TextField(
        "Tipos de Arquivo Permitidos",
        default="pdf,doc,docx,jpg,jpeg,png,txt",
        help_text="Separados por vírgula"
    )
    
    # Validação de documentos
    validacao_automatica = models.BooleanField("Validação Automática", default=True)
    validacao_manual_obrigatoria = models.BooleanField("Validação Manual Obrigatória", default=False)
    verificar_virus = models.BooleanField("Verificar Vírus", default=True)
    verificar_duplicatas = models.BooleanField("Verificar Duplicatas", default=True)
    
    # Notificações
    notificar_nova_peticao = models.BooleanField("Notificar Nova Petição", default=True)
    notificar_vencimento_prazo = models.BooleanField("Notificar Vencimento de Prazo", default=True)
    email_notificacao = models.EmailField("E-mail para Notificações", blank=True)
    
    # Templates de e-mail
    template_confirmacao_envio = models.TextField("Template Confirmação de Envio", blank=True)
    template_recebimento = models.TextField("Template Recebimento", blank=True)
    template_resposta = models.TextField("Template Resposta", blank=True)
    
    # Configurações de segurança
    exigir_captcha = models.BooleanField("Exigir CAPTCHA", default=True)
    limitar_ip = models.BooleanField("Limitar por IP", default=False)
    peticoes_por_ip_dia = models.IntegerField("Petições por IP/dia", default=10)
    
    # Configurações de backup
    backup_automatico = models.BooleanField("Backup Automático", default=True)
    dias_retencao_backup = models.IntegerField("Dias de Retenção do Backup", default=30)
    
    class Meta:
        verbose_name = "Configuração do Peticionamento"
        verbose_name_plural = "Configurações do Peticionamento"
    
    def __str__(self):
        return "Configurações do Sistema de Peticionamento"
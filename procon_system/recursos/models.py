from django.db import models
from django.utils import timezone
from datetime import timedelta


class TipoRecurso(models.Model):
    nome = models.CharField("Nome", max_length=100, unique=True)
    codigo = models.CharField("Código", max_length=20, unique=True)
    descricao = models.TextField("Descrição", blank=True)
    prazo_dias = models.IntegerField("Prazo em Dias")
    permite_segunda_instancia = models.BooleanField("Permite Segunda Instância", default=True)
    ativo = models.BooleanField("Ativo", default=True)
    ordem = models.IntegerField("Ordem", default=0)
    
    class Meta:
        verbose_name = "Tipo de Recurso"
        verbose_name_plural = "Tipos de Recurso"
        ordering = ['ordem', 'nome']
    
    def __str__(self):
        return self.nome


class Recurso(models.Model):
    STATUS_CHOICES = [
        ('protocolado', 'Protocolado'),
        ('em_analise', 'Em Análise'),
        ('com_parecer', 'Com Parecer'),
        ('deferido', 'Deferido'),
        ('indeferido', 'Indeferido'),
        ('parcialmente_deferido', 'Parcialmente Deferido'),
        ('anulado', 'Anulado'),
        ('arquivado', 'Arquivado'),
    ]
    
    INSTANCIA_CHOICES = [
        ('primeira', 'Primeira Instância'),
        ('segunda', 'Segunda Instância'),
        ('especial', 'Instância Especial'),
    ]
    
    # Identificação
    numero_protocolo = models.CharField("Número do Protocolo", max_length=50, unique=True)
    tipo_recurso = models.ForeignKey(TipoRecurso, on_delete=models.CASCADE, verbose_name="Tipo de Recurso")
    instancia = models.CharField("Instância", max_length=15, choices=INSTANCIA_CHOICES, default='primeira')
    
    # Processo relacionado
    numero_processo = models.CharField("Número do Processo", max_length=50)
    numero_auto = models.CharField("Número do Auto", max_length=50, blank=True)
    
    # Requerente
    requerente_nome = models.CharField("Nome do Requerente", max_length=255)
    requerente_tipo = models.CharField("Tipo", max_length=20, choices=[
        ('pessoa_fisica', 'Pessoa Física'),
        ('pessoa_juridica', 'Pessoa Jurídica'),
        ('representante', 'Representante Legal'),
    ], default='pessoa_juridica')
    requerente_documento = models.CharField("CPF/CNPJ", max_length=18)
    requerente_endereco = models.TextField("Endereço")
    requerente_telefone = models.CharField("Telefone", max_length=20, blank=True)
    requerente_email = models.EmailField("Email", blank=True)
    
    # Representação
    tem_advogado = models.BooleanField("Tem Advogado", default=False)
    advogado_nome = models.CharField("Nome do Advogado", max_length=255, blank=True)
    advogado_oab = models.CharField("OAB", max_length=20, blank=True)
    procuracao_anexada = models.BooleanField("Procuração Anexada", default=False)
    
    # Datas e prazos
    data_protocolo = models.DateTimeField("Data do Protocolo")
    data_limite_analise = models.DateField("Data Limite para Análise")
    data_julgamento = models.DateField("Data de Julgamento", null=True, blank=True)
    
    # Petição
    assunto = models.CharField("Assunto", max_length=255)
    fundamentacao = models.TextField("Fundamentação")
    pedido = models.TextField("Pedido")
    valor_causa = models.DecimalField("Valor da Causa", max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Documentos
    peticao_inicial = models.FileField("Petição Inicial", upload_to='recursos/peticoes/%Y/%m/')
    documentos_complementares = models.TextField("Documentos Complementares", blank=True, help_text="Lista de documentos anexados")
    
    # Status e decisão
    status = models.CharField("Status", max_length=25, choices=STATUS_CHOICES, default='protocolado')
    decisao = models.TextField("Decisão", blank=True)
    fundamentacao_decisao = models.TextField("Fundamentação da Decisão", blank=True)
    data_decisao = models.DateField("Data da Decisão", null=True, blank=True)
    
    # Responsável pela análise
    relator = models.CharField("Relator", max_length=255, blank=True)
    parecer_tecnico = models.TextField("Parecer Técnico", blank=True)
    data_parecer = models.DateField("Data do Parecer", null=True, blank=True)
    
    # Recursos desta decisão
    recurso_hierarquico = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='recursos_origem',
        verbose_name="Recurso Hierárquico"
    )
    
    # Notificações
    requerente_notificado = models.BooleanField("Requerente Notificado", default=False)
    data_notificacao = models.DateField("Data da Notificação", null=True, blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    criado_por = models.CharField("Criado por", max_length=100)
    
    class Meta:
        verbose_name = "Recurso"
        verbose_name_plural = "Recursos"
        ordering = ['-data_protocolo']
        indexes = [
            models.Index(fields=['numero_protocolo']),
            models.Index(fields=['numero_processo']),
            models.Index(fields=['status']),
            models.Index(fields=['data_limite_analise']),
        ]
    
    def __str__(self):
        return f"{self.numero_protocolo} - {self.requerente_nome}"
    
    @property
    def prazo_vencido(self):
        """Verifica se o prazo de análise está vencido"""
        return timezone.now().date() > self.data_limite_analise
    
    @property
    def dias_para_vencimento(self):
        """Calcula dias restantes para vencimento do prazo"""
        hoje = timezone.now().date()
        delta = self.data_limite_analise - hoje
        return delta.days
    
    def calcular_data_limite(self):
        """Calcula data limite baseada no tipo de recurso"""
        if self.tipo_recurso and self.data_protocolo:
            data_base = self.data_protocolo.date()
            self.data_limite_analise = data_base + timedelta(days=self.tipo_recurso.prazo_dias)
    
    def save(self, *args, **kwargs):
        if not self.data_limite_analise and self.tipo_recurso:
            self.calcular_data_limite()
        super().save(*args, **kwargs)
    
    def criar_recurso_hierarquico(self, dados_recurso):
        """Cria recurso hierárquico desta decisão"""
        if not self.tipo_recurso.permite_segunda_instancia:
            raise ValueError("Este tipo de recurso não permite segunda instância")
        
        recurso_hierarquico = Recurso.objects.create(
            numero_protocolo=dados_recurso['numero_protocolo'],
            tipo_recurso=self.tipo_recurso,
            instancia='segunda',
            numero_processo=self.numero_processo,
            numero_auto=self.numero_auto,
            requerente_nome=self.requerente_nome,
            requerente_tipo=self.requerente_tipo,
            requerente_documento=self.requerente_documento,
            requerente_endereco=self.requerente_endereco,
            requerente_telefone=self.requerente_telefone,
            requerente_email=self.requerente_email,
            data_protocolo=dados_recurso['data_protocolo'],
            assunto=dados_recurso['assunto'],
            fundamentacao=dados_recurso['fundamentacao'],
            pedido=dados_recurso['pedido'],
            peticao_inicial=dados_recurso['peticao_inicial'],
            recurso_hierarquico=self,
            criado_por=dados_recurso['criado_por'],
        )
        
        return recurso_hierarquico


class MovimentacaoRecurso(models.Model):
    TIPO_MOVIMENTACAO_CHOICES = [
        ('protocolo', 'Protocolo'),
        ('distribuicao', 'Distribuição'),
        ('parecer', 'Parecer Técnico'),
        ('julgamento', 'Julgamento'),
        ('decisao', 'Decisão'),
        ('notificacao', 'Notificação'),
        ('recurso_hierarquico', 'Recurso Hierárquico'),
        ('arquivamento', 'Arquivamento'),
        ('observacao', 'Observação'),
    ]
    
    recurso = models.ForeignKey(Recurso, on_delete=models.CASCADE, related_name='movimentacoes')
    tipo_movimentacao = models.CharField("Tipo", max_length=20, choices=TIPO_MOVIMENTACAO_CHOICES)
    descricao = models.TextField("Descrição")
    data_movimentacao = models.DateTimeField("Data/Hora", auto_now_add=True)
    responsavel = models.CharField("Responsável", max_length=255)
    documento_anexo = models.FileField("Documento", upload_to='recursos/movimentacoes/%Y/%m/', null=True, blank=True)
    
    class Meta:
        verbose_name = "Movimentação de Recurso"
        verbose_name_plural = "Movimentações de Recurso"
        ordering = ['-data_movimentacao']
    
    def __str__(self):
        return f"{self.recurso.numero_protocolo} - {self.get_tipo_movimentacao_display()}"


class ModeloDecisao(models.Model):
    nome = models.CharField("Nome do Modelo", max_length=100)
    tipo_recurso = models.ForeignKey(TipoRecurso, on_delete=models.CASCADE, verbose_name="Tipo de Recurso")
    tipo_decisao = models.CharField("Tipo de Decisão", max_length=25, choices=[
        ('deferido', 'Deferido'),
        ('indeferido', 'Indeferido'),
        ('parcialmente_deferido', 'Parcialmente Deferido'),
    ])
    
    # Template da decisão
    template_decisao = models.TextField("Template da Decisão")
    template_fundamentacao = models.TextField("Template da Fundamentação")
    
    # Variáveis disponíveis
    variaveis_disponiveis = models.TextField("Variáveis Disponíveis", help_text="Lista das variáveis que podem ser usadas")
    
    # Configuração
    ativo = models.BooleanField("Ativo", default=True)
    padrao = models.BooleanField("Padrão", default=False, help_text="Modelo padrão para este tipo")
    
    class Meta:
        verbose_name = "Modelo de Decisão"
        verbose_name_plural = "Modelos de Decisão"
        ordering = ['tipo_recurso', 'nome']
    
    def __str__(self):
        return f"{self.nome} - {self.tipo_recurso.nome}"
    
    def renderizar(self, contexto=None):
        """Renderiza o modelo com o contexto fornecido"""
        if not contexto:
            contexto = {}
        
        decisao = self.template_decisao
        fundamentacao = self.template_fundamentacao
        
        # Substituição simples de variáveis
        for chave, valor in contexto.items():
            placeholder = f"{{{{{chave}}}}}"
            decisao = decisao.replace(placeholder, str(valor))
            fundamentacao = fundamentacao.replace(placeholder, str(valor))
        
        return decisao, fundamentacao


class PrazoRecurso(models.Model):
    """Controle de prazos recursais"""
    recurso = models.OneToOneField(Recurso, on_delete=models.CASCADE, related_name='controle_prazo')
    
    # Prazos
    prazo_analise = models.IntegerField("Prazo para Análise (dias)")
    data_inicio_prazo = models.DateField("Início do Prazo")
    data_limite_prazo = models.DateField("Limite do Prazo")
    
    # Interrupções/Suspensões
    dias_suspensos = models.IntegerField("Dias Suspensos", default=0)
    motivo_suspensao = models.TextField("Motivo da Suspensão", blank=True)
    
    # Alertas
    alerta_5_dias = models.BooleanField("Alerta 5 Dias", default=False)
    alerta_1_dia = models.BooleanField("Alerta 1 Dia", default=False)
    alerta_vencido = models.BooleanField("Alerta Vencido", default=False)
    
    class Meta:
        verbose_name = "Controle de Prazo"
        verbose_name_plural = "Controle de Prazos"
    
    def __str__(self):
        return f"Prazo: {self.recurso.numero_protocolo}"
    
    @property
    def dias_restantes(self):
        """Calcula dias restantes considerando suspensões"""
        hoje = timezone.now().date()
        if hoje > self.data_limite_prazo:
            return 0
        
        delta = self.data_limite_prazo - hoje
        return max(0, delta.days - self.dias_suspensos)
    
    @property
    def situacao_prazo(self):
        """Retorna situação do prazo"""
        dias = self.dias_restantes
        if dias == 0:
            return 'vencido'
        elif dias <= 1:
            return 'urgente'
        elif dias <= 5:
            return 'atencao'
        else:
            return 'normal'
    
    def suspender_prazo(self, dias, motivo):
        """Suspende o prazo por X dias"""
        self.dias_suspensos += dias
        self.motivo_suspensao += f"\n{timezone.now().date()}: {motivo} ({dias} dias)"
        self.save()


class ComissaoJulgamento(models.Model):
    """Comissão responsável pelo julgamento de recursos"""
    nome = models.CharField("Nome", max_length=100)
    tipo_instancia = models.CharField("Instância", max_length=15, choices=Recurso.INSTANCIA_CHOICES)
    presidente = models.CharField("Presidente", max_length=255)
    membros = models.TextField("Membros", help_text="Um por linha")
    ativa = models.BooleanField("Ativa", default=True)
    
    class Meta:
        verbose_name = "Comissão de Julgamento"
        verbose_name_plural = "Comissões de Julgamento"
        ordering = ['tipo_instancia', 'nome']
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_instancia_display()})"


class SessaoJulgamento(models.Model):
    """Sessão de julgamento de recursos"""
    comissao = models.ForeignKey(ComissaoJulgamento, on_delete=models.CASCADE, verbose_name="Comissão")
    numero_sessao = models.CharField("Número da Sessão", max_length=20)
    data_sessao = models.DateField("Data da Sessão")
    hora_inicio = models.TimeField("Hora de Início")
    hora_fim = models.TimeField("Hora de Fim", null=True, blank=True)
    
    # Local
    local_sessao = models.CharField("Local", max_length=255)
    
    # Recursos julgados
    recursos = models.ManyToManyField(Recurso, through='RecursoJulgado', verbose_name="Recursos")
    
    # Ata
    ata_sessao = models.TextField("Ata da Sessão", blank=True)
    ata_arquivo = models.FileField("Arquivo da Ata", upload_to='recursos/atas/%Y/%m/', null=True, blank=True)
    
    # Status
    realizada = models.BooleanField("Realizada", default=False)
    publicada = models.BooleanField("Publicada", default=False)
    
    class Meta:
        verbose_name = "Sessão de Julgamento"
        verbose_name_plural = "Sessões de Julgamento"
        ordering = ['-data_sessao']
    
    def __str__(self):
        return f"Sessão {self.numero_sessao} - {self.data_sessao}"


class RecursoJulgado(models.Model):
    """Relação entre recurso e sessão de julgamento"""
    sessao = models.ForeignKey(SessaoJulgamento, on_delete=models.CASCADE)
    recurso = models.ForeignKey(Recurso, on_delete=models.CASCADE)
    ordem_julgamento = models.IntegerField("Ordem de Julgamento")
    
    # Resultado
    decisao = models.CharField("Decisão", max_length=25, choices=Recurso.STATUS_CHOICES[-4:])  # Apenas decisões finais
    relator = models.CharField("Relator", max_length=255)
    observacoes = models.TextField("Observações", blank=True)
    
    class Meta:
        verbose_name = "Recurso Julgado"
        verbose_name_plural = "Recursos Julgados"
        ordering = ['sessao', 'ordem_julgamento']
        unique_together = ['sessao', 'recurso']
    
    def __str__(self):
        return f"{self.recurso.numero_protocolo} - {self.sessao.numero_sessao}"
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import uuid


class BalcaoAtendimento(models.Model):
    """Balcões/guichês utilizados no atendimento presencial."""

    nome = models.CharField("Nome do Balcão", max_length=100)
    codigo = models.CharField("Código", max_length=20, unique=True)
    descricao = models.TextField("Descrição", blank=True)
    localizacao = models.CharField("Localização", max_length=150, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    ordem_prioridade = models.PositiveIntegerField("Ordem de Prioridade", default=1)
    capacidade_simultanea = models.PositiveIntegerField("Capacidade Simultânea", default=1)
    ultima_chamada_em = models.DateTimeField("Última chamada", null=True, blank=True)

    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Balcão de Atendimento"
        verbose_name_plural = "Balcões de Atendimento"
        ordering = ["ordem_prioridade", "nome"]

    def __str__(self):
        return f"{self.nome} ({self.codigo})"


class Atendimento(models.Model):
    """Modelo para controle de atendimentos no balcão"""

    numero_atendimento = models.CharField("Número do Atendimento", max_length=50, unique=True, blank=True)
    data_atendimento = models.DateTimeField("Data do Atendimento", auto_now_add=True)

    class Gravidade(models.TextChoices):
        BAIXA = "BAIXA", "Baixa"
        MEDIA = "MEDIA", "Média"
        ALTA = "ALTA", "Alta"

    # Dados do atendente
    atendente = models.ForeignKey(User, on_delete=models.PROTECT, related_name='atendimentos_realizados')
    distribuidor_responsavel = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='atendimentos_distribuidos',
        verbose_name="Responsável Distribuído",
    )

    # Dados do consumidor
    consumidor_nome = models.CharField("Nome do Consumidor", max_length=255)
    consumidor_cpf = models.CharField("CPF do Consumidor", max_length=14)
    consumidor_telefone = models.CharField("Telefone do Consumidor", max_length=20, blank=True)
    consumidor_email = models.EmailField("E-mail do Consumidor", blank=True)

    # Tipo de atendimento
    TIPO_ATENDIMENTO_CHOICES = [
        ('ORIENTACAO', 'Orientação'),
        ('RECLAMACAO', 'Reclamação'),
        ('DENUNCIA', 'Denúncia'),
        ('CONSULTA', 'Consulta'),
        ('OUTROS', 'Outros'),
    ]
    CANAL_ATENDIMENTO_CHOICES = [
        ('BALCAO', 'Balcao Presencial'),
        ('TELEFONE', 'Telefone'),
        ('ONLINE', 'Portal/Online'),
    ]
    tipo_atendimento = models.CharField("Tipo de Atendimento", max_length=20, choices=TIPO_ATENDIMENTO_CHOICES)
    canal_atendimento = models.CharField("Canal do Atendimento", max_length=20, choices=CANAL_ATENDIMENTO_CHOICES, default='BALCAO')

    # Status do atendimento
    STATUS_CHOICES = [
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('FINALIZADO', 'Finalizado'),
        ('ENCAMINHADO', 'Encaminhado'),
        ('CANCELADO', 'Cancelado'),
    ]
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='EM_ANDAMENTO')

    # Observações e resolução
    observacoes = models.TextField("Observações", blank=True)
    resolucao = models.TextField("Resolução", blank=True)
    reclamacao = models.OneToOneField('portal_cidadao.ReclamacaoDenuncia', on_delete=models.SET_NULL, null=True, blank=True, related_name='atendimento', verbose_name="Reclamacao/Denuncia")

    # Controle
    duracao_minutos = models.IntegerField("Duração (minutos)", null=True, blank=True)
    satisfacao_consumidor = models.IntegerField("Satisfação do Consumidor", choices=[
        (1, 'Muito Insatisfeito'),
        (2, 'Insatisfeito'),
        (3, 'Neutro'),
        (4, 'Satisfeito'),
        (5, 'Muito Satisfeito'),
    ], null=True, blank=True)
    gravidade = models.CharField("Gravidade", max_length=10, choices=Gravidade.choices, default=Gravidade.MEDIA)
    classificacao_automatica = models.JSONField("Classificação Automática", default=dict, blank=True)
    consentimento_lgpd = models.BooleanField("Consentimento LGPD", default=False)
    consentimento_registrado_em = models.DateTimeField("Consentimento Registrado em", null=True, blank=True)
    CONSENTIMENTO_ORIGEM_CHOICES = [
        ("TOTEM", "Totem de Autoatendimento"),
        ("PORTAL", "Portal Online"),
        ("GUICHE", "Guich� Presencial"),
        ("IMPORTACAO", "Importa��o de Dados"),
    ]
    consentimento_origem = models.CharField(
        "Origem do Consentimento",
        max_length=20,
        choices=CONSENTIMENTO_ORIGEM_CHOICES,
        default="GUICHE",
    )
    dados_remocao_solicitada_em = models.DateTimeField("Remo��o Solicitada em", null=True, blank=True)
    dados_removidos_em = models.DateTimeField("Dados Removidos em", null=True, blank=True)
    dados_remocao_observacoes = models.TextField("Observa��es Remo��o de Dados", blank=True)

    class Meta:
        verbose_name = "Atendimento"
        verbose_name_plural = "Atendimentos"
        ordering = ['-data_atendimento']

    def __str__(self):
        return f"Atendimento {self.numero_atendimento} - {self.consumidor_nome}"

    def registrar_consentimento(self, origem="GUICHE"):
        """Atualiza metadados de consentimento LGPD."""
        self.consentimento_lgpd = True
        self.consentimento_origem = origem
        self.consentimento_registrado_em = timezone.now()
        self.save(update_fields=['consentimento_lgpd', 'consentimento_origem', 'consentimento_registrado_em'])

    def solicitar_remocao_dados(self, observacoes=""):
        """Marca atendimento para remo��o de dados pessoais."""
        self.dados_remocao_solicitada_em = timezone.now()
        if observacoes:
            self.dados_remocao_observacoes = observacoes
        self.save(update_fields=['dados_remocao_solicitada_em', 'dados_remocao_observacoes'])

    def confirmar_remocao_dados(self):
        """Anonimiza informa��es e remove anexos sens�veis."""
        campos_pessoais = {
            'consumidor_nome': 'Consumidor Removido',
            'consumidor_cpf': 'REMOVIDO',
            'consumidor_telefone': '',
            'consumidor_email': '',
        }

        for campo, valor in campos_pessoais.items():
            setattr(self, campo, valor)

        self.dados_removidos_em = timezone.now()
        if self.status != 'FINALIZADO':
            self.status = 'FINALIZADO'
        update_fields = list(campos_pessoais.keys()) + ['dados_removidos_em', 'status']
        self.save(update_fields=update_fields)

        if self.reclamacao:
            self.reclamacao.consumidor_nome = 'Consumidor Removido'
            self.reclamacao.consumidor_cpf = 'REMOVIDO'
            self.reclamacao.consumidor_email = ''
            self.reclamacao.consumidor_telefone = ''
            self.reclamacao.save(update_fields=[
                'consumidor_nome',
                'consumidor_cpf',
                'consumidor_email',
                'consumidor_telefone',
            ])
            for anexo in self.reclamacao.anexos.all():
                anexo.limpar_conteudo()

    def save(self, *args, **kwargs):
        """Gera número automático do atendimento"""
        if not self.numero_atendimento:
            from datetime import datetime
            agora = datetime.now()
            ano = agora.year
            mes = agora.month
            dia = agora.day

            ultimo = Atendimento.objects.filter(
                data_atendimento__date=agora.date()
            ).order_by('-id').first()

            seq = 1
            if ultimo:
                try:
                    seq = int(ultimo.numero_atendimento.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    seq = 1

            self.numero_atendimento = f"ATD-{ano}{mes:02d}{dia:02d}-{seq:04d}"

        super().save(*args, **kwargs)


class FilaAtendimento(models.Model):
    """Filas por balcão para acompanhamento do atendimento presencial."""

    class Status(models.TextChoices):
        ATIVA = "ATIVA", "Ativa"
        ENCERRADA = "ENCERRADA", "Encerrada"

    balcao = models.ForeignKey(BalcaoAtendimento, on_delete=models.CASCADE, related_name='filas')
    data_referencia = models.DateField("Data de Referência", default=timezone.localdate)
    status = models.CharField("Status", max_length=10, choices=Status.choices, default=Status.ATIVA)
    quantidade_emitidas = models.PositiveIntegerField("Senhas Emitidas", default=0)
    quantidade_chamadas = models.PositiveIntegerField("Senhas Chamadas", default=0)
    quantidade_finalizadas = models.PositiveIntegerField("Senhas Finalizadas", default=0)
    ultima_senha_emitida = models.CharField("Última Senha Emitida", max_length=20, blank=True)
    ultima_senha_chamada = models.CharField("Última Senha Chamada", max_length=20, blank=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Fila de Atendimento"
        verbose_name_plural = "Filas de Atendimento"
        unique_together = [('balcao', 'data_referencia', 'status')]
        ordering = ['-criado_em']

    def __str__(self):
        return f"Fila {self.balcao.nome} - {self.data_referencia}"

    @classmethod
    def obter_fila_ativa(cls, balcao):
        fila, _ = cls.objects.get_or_create(
            balcao=balcao,
            data_referencia=timezone.localdate(),
            status=cls.Status.ATIVA,
        )
        return fila


class ConfiguracaoAtendimento(models.Model):
    """Configurações do módulo de atendimento"""
    
    # Configurações gerais
    nome_sistema = models.CharField("Nome do Sistema", max_length=100, default="Sistema PROCON")
    versao = models.CharField("Versão", max_length=20, default="1.0.0")
    
    # Configurações de protocolo
    prefixo_protocolo = models.CharField("Prefixo do Protocolo", max_length=10, default="REC")
    sequencia_ano = models.BooleanField("Sequência por Ano", default=True)
    
    # Configurações de prazos
    prazo_resposta_dias = models.IntegerField("Prazo para Resposta (dias)", default=10)
    prazo_conciliacao_dias = models.IntegerField("Prazo para Conciliação (dias)", default=30)
    prazo_decisao_dias = models.IntegerField("Prazo para Decisão (dias)", default=60)
    
    # Configurações de notificação
    notificar_consumidor = models.BooleanField("Notificar Consumidor", default=True)
    notificar_empresa = models.BooleanField("Notificar Empresa", default=True)
    notificar_atendente = models.BooleanField("Notificar Atendente", default=True)
    
    # Configurações de integração
    consultar_receita_federal = models.BooleanField("Consultar Receita Federal", default=True)
    validar_cnpj_automatico = models.BooleanField("Validar CNPJ Automaticamente", default=True)
    
    # Configurações de classificação
    classificacao_automatica = models.BooleanField("Classificação Automática", default=True)
    assuntos_predefinidos = models.JSONField("Assuntos Predefinidos", default=list, blank=True)
    
    # Controle
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Configuração do Atendimento"
        verbose_name_plural = "Configurações do Atendimento"
    
    def __str__(self):
        return f"Configuração - {self.nome_sistema}"
    
    @classmethod
    def get_config(cls):
        """Retorna a configuração ativa ou cria uma padrão"""
        config, created = cls.objects.get_or_create(
            ativo=True,
            defaults={
                'nome_sistema': 'Sistema PROCON',
                'versao': '1.0.0'
            }
        )
        return config


class RegraDistribuicaoAtendimento(models.Model):
    """Regras para distribuição automática de atendimentos e reclamações."""

    nome = models.CharField("Nome da Regra", max_length=120)
    prioridade = models.PositiveIntegerField("Prioridade", default=1)
    ativo = models.BooleanField("Ativo", default=True)

    gravidade = models.CharField(
        "Gravidade",
        max_length=10,
        choices=Atendimento.Gravidade.choices,
        blank=True,
    )
    assunto = models.CharField("Assunto Classificado", max_length=100, blank=True)
    tipo_classificacao = models.CharField("Tipo de Classificação", max_length=40, blank=True)

    responsavel = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='regras_distribuicao_atendimento',
    )

    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Regra de Distribuição"
        verbose_name_plural = "Regras de Distribuição"
        ordering = ['prioridade', 'nome']

    def __str__(self):
        return f"{self.nome} (prioridade {self.prioridade})"

    def save(self, *args, **kwargs):
        if self.assunto:
            self.assunto = self.assunto.upper()
        if self.tipo_classificacao:
            self.tipo_classificacao = self.tipo_classificacao.upper()
        super().save(*args, **kwargs)

    def combina(self, gravidade=None, assunto=None, tipo_classificacao=None) -> bool:
        if self.gravidade and (gravidade or '').upper() != self.gravidade:
            return False
        if self.assunto and (assunto or '').upper() != self.assunto:
            return False
        if self.tipo_classificacao and (tipo_classificacao or '').upper() != self.tipo_classificacao:
            return False
        return True


class SenhaAtendimento(models.Model):
    """Senhas emitidas para gerenciamento de fila presencial."""

    class Status(models.TextChoices):
        EM_ESPERA = "EM_ESPERA", "Em espera"
        CHAMADA = "CHAMADA", "Chamada"
        EM_ATENDIMENTO = "EM_ATENDIMENTO", "Em atendimento"
        FINALIZADA = "FINALIZADA", "Finalizada"
        CANCELADA = "CANCELADA", "Cancelada"

    class Prioridade(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        PRIORITARIA = "PRIORITARIA", "Prioritária"

    balcao = models.ForeignKey(BalcaoAtendimento, on_delete=models.PROTECT, related_name="senhas")
    sequencia_diaria = models.PositiveIntegerField()
    identificador = models.CharField("Identificador da senha", max_length=20)
    prioridade = models.CharField(
        "Prioridade", max_length=15, choices=Prioridade.choices, default=Prioridade.NORMAL
    )
    status = models.CharField("Status", max_length=15, choices=Status.choices, default=Status.EM_ESPERA)
    emitido_em = models.DateTimeField("Emitido em", auto_now_add=True)
    chamado_em = models.DateTimeField("Chamado em", null=True, blank=True)
    iniciado_em = models.DateTimeField("Iniciado em", null=True, blank=True)
    finalizado_em = models.DateTimeField("Finalizado em", null=True, blank=True)
    cancelado_em = models.DateTimeField("Cancelado em", null=True, blank=True)
    atendente_responsavel = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="senhas_atendidas"
    )
    observacoes = models.TextField("Observações", blank=True)

    class Meta:
        verbose_name = "Senha de Atendimento"
        verbose_name_plural = "Senhas de Atendimento"
        ordering = ["-emitido_em"]
        unique_together = ["balcao", "identificador"]

    def __str__(self):
        return f"{self.identificador} - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        """Gera identificador incremental por balcao/dia."""
        if not self.identificador:
            hoje = timezone.localdate()
            ultimo = (
                SenhaAtendimento.objects.filter(balcao=self.balcao, emitido_em__date=hoje)
                .order_by("-sequencia_diaria")
                .first()
            )
            sequencia = 1
            if ultimo:
                sequencia = ultimo.sequencia_diaria + 1
            self.sequencia_diaria = sequencia
            prefixo = self.balcao.codigo.upper()
            self.identificador = f"{prefixo}-{hoje.strftime('%d%m')}-{sequencia:03d}"
        super().save(*args, **kwargs)

    def marcar_chamada(self, atendente=None):
        self.status = self.Status.CHAMADA
        self.chamado_em = timezone.now()
        if atendente:
            self.atendente_responsavel = atendente
        self.save(update_fields=["status", "chamado_em", "atendente_responsavel"])

    def iniciar_atendimento(self, atendente=None):
        self.status = self.Status.EM_ATENDIMENTO
        agora = timezone.now()
        self.iniciado_em = agora
        self.chamado_em = self.chamado_em or agora
        if atendente:
            self.atendente_responsavel = atendente
        self.save(update_fields=["status", "iniciado_em", "chamado_em", "atendente_responsavel"])

    def finalizar(self, atendente=None):
        self.status = self.Status.FINALIZADA
        self.finalizado_em = timezone.now()
        if atendente:
            self.atendente_responsavel = atendente
        self.save(update_fields=["status", "finalizado_em", "atendente_responsavel"])

    def cancelar(self, motivo=""):
        self.status = self.Status.CANCELADA
        self.cancelado_em = timezone.now()
        if motivo:
            self.observacoes = f"{self.observacoes}\n{motivo}" if self.observacoes else motivo
        self.save(update_fields=["status", "cancelado_em", "observacoes"])

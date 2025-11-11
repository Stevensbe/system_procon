import os
from datetime import timedelta
from typing import Optional

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from portal_cidadao.models import DenunciaCidadao
from ppa.models import ProcedimentoPreAdministrativo


def triagem_anexo_upload_path(instance, filename):
    """Define o caminho de upload dos anexos da triagem."""
    base, ext = os.path.splitext(filename)
    base_slug = slugify(base) or "anexo"
    protocolo = slugify(instance.triagem.numero_protocolo or "triagem")
    return f"triagem/anexos/{protocolo}/{base_slug}{ext}"


class TriagemDemanda(models.Model):
    """Registro centralizado das denúncias e solicitações que passam pela triagem."""

    ORIGEM_CHOICES = [
        ("PORTAL", "Portal Cidadão"),
        ("TELEFONE", "Telefone"),
        ("PRESENCIAL", "Presencial"),
        ("EMAIL", "E-mail"),
        ("OFICIO", "Ofício/Parceiro"),
        ("ROTINA", "Planejamento / Fiscalização de Rotina"),
    ]

    PRIORIDADE_CHOICES = [
        ("baixa", "Baixa"),
        ("media", "Média"),
        ("alta", "Alta"),
        ("critica", "Crítica"),
    ]

    STATUS_CHOICES = [
        ("em_triagem", "Em triagem"),
        ("aguardando_complemento", "Aguardando complementação"),
        ("encaminhado_fiscalizacao", "Encaminhado para fiscalização"),
        ("encaminhado_juridico", "Encaminhado para análise jurídica"),
        ("convertido_ppa", "PPA criado/vinculado"),
        ("fora_competencia", "Fora da competencia"),
        ("arquivado", "Arquivado"),
    ]

    DECISAO_CHOICES = [
        ("pendente", "Pendente"),
        ("solicitar_complemento", "Solicitar complementação"),
        ("abrir_fiscalizacao", "Abrir fiscalização"),
        ("encaminhar_juridico", "Encaminhar para análise jurídica"),
        ("abrir_campanha", "Incluir em operação de rotina"),
        ("arquivar", "Arquivar"),
    ]

    numero_protocolo = models.CharField(
        "Número do Protocolo", max_length=30, unique=True, blank=True
    )
    origem = models.CharField(
        "Origem",
        max_length=20,
        choices=ORIGEM_CHOICES,
        default="PORTAL",
    )
    denuncia_portal = models.ForeignKey(
        DenunciaCidadao,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triagens",
        verbose_name="Denúncia do Portal",
    )
    ppa = models.ForeignKey(
        ProcedimentoPreAdministrativo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triagens",
        verbose_name="PPA vinculado",
    )

    assunto = models.CharField("Assunto / Tema Principal", max_length=255)
    descricao = models.TextField("Descrição detalhada", blank=True)
    empresa_alvo = models.CharField("Empresa / Estabelecimento alvo", max_length=255)
    cnpj_empresa = models.CharField("CNPJ da empresa", max_length=18, blank=True)
    endereco_empresa = models.TextField("Endereço do estabelecimento", blank=True)

    denunciante_nome = models.CharField("Nome do denunciante", max_length=255, blank=True)
    denunciante_contato = models.CharField("Contato do denunciante", max_length=255, blank=True)

    prioridade_sugerida = models.CharField(
        "Prioridade sugerida",
        max_length=10,
        choices=PRIORIDADE_CHOICES,
        default="media",
    )
    prioridade_definida = models.CharField(
        "Prioridade definida",
        max_length=10,
        choices=PRIORIDADE_CHOICES,
        blank=True,
    )
    prazo_atendimento = models.DateField("Prazo sugerido para atendimento", null=True, blank=True)
    prioridade_calculada = models.CharField(
        "Prioridade calculada",
        max_length=10,
        choices=PRIORIDADE_CHOICES,
        blank=True,
    )
    prazo_previsto_atendimento = models.DateField(
        "Prazo calculado para atendimento",
        null=True,
        blank=True,
    )

    status = models.CharField(
        "Status da triagem",
        max_length=40,
        choices=STATUS_CHOICES,
        default="em_triagem",
    )
    decisao = models.CharField(
        "Decisão principal",
        max_length=30,
        choices=DECISAO_CHOICES,
        default="pendente",
    )
    observacoes = models.TextField("Observações internas", blank=True)
    dados_extras = models.JSONField("Dados extras", null=True, blank=True)

    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triagens_criadas",
    )
    responsavel_triagem = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triagens_responsavel",
    )
    ultima_atualizacao_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triagens_atualizadas",
    )

    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Triagem de Demanda"
        verbose_name_plural = "Triagens de Demandas"
        ordering = ["-criado_em"]
        indexes = [
            models.Index(fields=["numero_protocolo"]),
            models.Index(fields=["origem"]),
            models.Index(fields=["status"]),
            models.Index(fields=["prioridade_sugerida"]),
            models.Index(fields=["prioridade_definida"]),
            models.Index(fields=["criado_em"]),
        ]

    def __str__(self) -> str:
        return f"{self.numero_protocolo} - {self.assunto}"

    def save(self, *args, **kwargs):
        if not self.numero_protocolo:
            self.numero_protocolo = self._gerar_numero()

        prioridade_calculada, prazo_calculado = self._calcular_prioridade_e_prazo()
        self.prioridade_calculada = prioridade_calculada

        if not self.prazo_previsto_atendimento:
            self.prazo_previsto_atendimento = prazo_calculado

        super().save(*args, **kwargs)

    def _gerar_numero(self) -> str:
        ano = timezone.now().year
        ultimo = (
            TriagemDemanda.objects.filter(numero_protocolo__endswith=f"/{ano}")
            .order_by("-id")
            .first()
        )
        sequencial = 1
        if ultimo and ultimo.numero_protocolo:
            try:
                sequencial = int(ultimo.numero_protocolo.split("/")[0].split("-")[1]) + 1
            except (IndexError, ValueError):
                sequencial = 1
        return f"TRI-{sequencial:05d}/{ano}"

    def registrar_evento(
        self,
        evento: str,
        descricao: str,
        usuario=None,
        dados=None,
        motivo: Optional[str] = None,
        observacao: Optional[str] = None,
    ):
        """Cria um registro de histórico relacionado a esta triagem."""
        TriagemHistorico.objects.create(
            triagem=self,
            evento=evento,
            descricao=descricao,
            usuario=usuario,
            dados_extras=dados or {},
            motivo=motivo or "",
            observacao=observacao or "",
        )

    def anexar_documento(self, arquivo, usuario=None, descricao: Optional[str] = None):
        """Anexa um documento à triagem, registrando histórico automaticamente."""
        anexo = TriagemAnexo.objects.create(
            triagem=self,
            arquivo=arquivo,
            nome_original=getattr(arquivo, "name", ""),
            tamanho=getattr(arquivo, "size", 0) or 0,
            enviado_por=usuario,
            descricao=descricao or "",
        )

        self.registrar_evento(
            evento="anexo",
            descricao=f"Documento anexado: {anexo.nome_original or anexo.arquivo.name}",
            usuario=usuario,
            dados={"anexo_id": anexo.id, "arquivo": anexo.nome_original or anexo.arquivo.name},
        )
        return anexo

    def _calcular_prioridade_e_prazo(self):
        """
        Regras simplificadas para estimar prioridade e prazo.
        """
        texto = f"{self.assunto} {self.descricao}".lower()
        palavras_criticas = {"urgente", "risco", "grave", "amea", "flagrante"}

        prioridade = "media"

        if any(palavra in texto for palavra in palavras_criticas):
            prioridade = "critica"
        elif self.origem in {"PRESENCIAL", "OFICIO"}:
            prioridade = "alta"
        elif self.origem == "ROTINA":
            prioridade = "baixa"

        prioridade_base = self.prioridade_definida or prioridade
        prazo_por_prioridade = {
            "critica": 1,
            "alta": 3,
            "media": 7,
            "baixa": 15,
        }
        dias = prazo_por_prioridade.get(prioridade_base, 7)
        prazo = timezone.now().date() + timedelta(days=dias)

        return prioridade, prazo

    def agendar_fiscalizacao(self, usuario=None):
        """
        Gera automaticamente um compromisso na agenda de fiscalização relacionado à triagem.
        """
        try:
            from agenda.models import EventoAgenda, Fiscal, TipoEvento
        except Exception:
            return None

        prioridade_base = (
            self.prioridade_definida
            or self.prioridade_calculada
            or self.prioridade_sugerida
            or "media"
        )
        agenda_prioridade_map = {
            "critica": ("urgente", 0),
            "alta": ("alta", 1),
            "media": ("normal", 3),
            "baixa": ("baixa", 7),
        }
        prioridade_agenda, dias_para_agendar = agenda_prioridade_map.get(
            prioridade_base, ("normal", 3)
        )

        data_base = timezone.localtime(timezone.now()) + timedelta(days=dias_para_agendar)
        data_inicio = data_base.replace(hour=9, minute=0, second=0, microsecond=0)
        data_fim = data_inicio + timedelta(hours=2)

        fiscal = None
        if self.responsavel_triagem:
            email = getattr(self.responsavel_triagem, "email", None)
            if email:
                fiscal = Fiscal.objects.filter(email__iexact=email, ativo=True).first()
            if not fiscal:
                nome = self.responsavel_triagem.get_full_name()
                if nome:
                    fiscal = Fiscal.objects.filter(nome__iexact=nome, ativo=True).first()

        if not fiscal:
            fiscal = Fiscal.objects.filter(ativo=True).order_by("id").first()
        if not fiscal:
            return None

        tipo_evento, _ = TipoEvento.objects.get_or_create(
            nome="Fiscalização de Denúncia",
            defaults={"cor": "#0d6efd", "icone": "fa-shield-check"},
        )

        titulo_evento = f"Fiscalização - {self.assunto[:70]}"
        descricao_evento = (self.observacoes or self.descricao or "")[:500]

        evento_existente = EventoAgenda.objects.filter(
            processo_relacionado=self.numero_protocolo
        ).first()

        if evento_existente:
            campos_atualizacao = {
                "titulo": titulo_evento,
                "descricao": descricao_evento,
                "tipo": tipo_evento,
                "data_inicio": data_inicio,
                "data_fim": data_fim,
                "fiscal_responsavel": fiscal,
                "local": self.endereco_empresa,
                "empresa_relacionada": self.cnpj_empresa or "",
                "prioridade": prioridade_agenda,
            }
            alterado = False
            for campo, valor in campos_atualizacao.items():
                if getattr(evento_existente, campo) != valor:
                    setattr(evento_existente, campo, valor)
                    alterado = True
            if alterado:
                evento_existente.save()
            return evento_existente

        criado_por = "Sistema"
        if usuario:
            nome_usuario = getattr(usuario, "get_full_name", lambda: "")()
            criado_por = nome_usuario or getattr(usuario, "username", "Sistema")

        return EventoAgenda.objects.create(
            titulo=titulo_evento,
            descricao=descricao_evento,
            tipo=tipo_evento,
            data_inicio=data_inicio,
            data_fim=data_fim,
            fiscal_responsavel=fiscal,
            local=self.endereco_empresa,
            empresa_relacionada=self.cnpj_empresa or "",
            processo_relacionado=self.numero_protocolo,
            prioridade=prioridade_agenda,
            criado_por=criado_por,
        )


class TriagemAnexo(models.Model):
    """Arquivos anexados à triagem de demandas."""

    triagem = models.ForeignKey(
        "TriagemDemanda",
        on_delete=models.CASCADE,
        related_name="anexos",
        verbose_name="Triagem",
    )
    arquivo = models.FileField("Arquivo", upload_to=triagem_anexo_upload_path)
    nome_original = models.CharField("Nome original", max_length=255, blank=True)
    descricao = models.CharField("Descrição", max_length=255, blank=True)
    tamanho = models.PositiveIntegerField("Tamanho (bytes)", default=0)
    enviado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triagem_anexos",
        verbose_name="Enviado por",
    )
    criado_em = models.DateTimeField("Enviado em", auto_now_add=True)

    class Meta:
        verbose_name = "Anexo de Triagem"
        verbose_name_plural = "Anexos de Triagem"
        ordering = ["-criado_em"]

    def __str__(self) -> str:
        nome = self.nome_original or os.path.basename(self.arquivo.name)
        return f"{self.triagem.numero_protocolo} - {nome}"

    def save(self, *args, **kwargs):
        if self.arquivo and not self.nome_original:
            self.nome_original = os.path.basename(self.arquivo.name)
        if self.arquivo:
            try:
                self.tamanho = self.arquivo.size
            except Exception:
                self.tamanho = self.tamanho or 0
        super().save(*args, **kwargs)

    @property
    def tamanho_legivel(self) -> str:
        tamanho = self.tamanho or 0
        if tamanho < 1024:
            return f"{tamanho} B"
        if tamanho < 1024**2:
            return f"{tamanho/1024:.1f} KB"
        if tamanho < 1024**3:
            return f"{tamanho/(1024**2):.1f} MB"
        return f"{tamanho/(1024**3):.1f} GB"


class TriagemHistorico(models.Model):
    """Histórico de eventos relevantes relacionados à triagem."""

    EVENTO_CHOICES = [
        ('criacao', 'Criação'),
        ('atualizacao', 'Atualização'),
        ('mudanca_status', 'Mudança de status'),
        ('mudanca_decisao', 'Mudança de decisão'),
        ('vinculo_ppa', 'Vinculação de PPA'),
        ('comentario', 'Comentário'),
        ('encaminhamento_fiscalizacao', 'Encaminhamento para fiscalização'),
        ('encaminhamento_juridico', 'Encaminhamento para análise jurídica'),
        ('solicitacao_complemento', 'Solicitação de complemento'),
        ('arquivamento', 'Arquivamento'),
        ('anexo', 'Anexo de documento'),
    ]
    triagem = models.ForeignKey(
        "TriagemDemanda",
        on_delete=models.CASCADE,
        related_name="historico",
        verbose_name="Triagem",
    )
    evento = models.CharField(
        "Evento",
        max_length=50,
        choices=EVENTO_CHOICES,
        default="comentario",
    )
    descricao = models.TextField("Descrição", blank=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="historico_triagem",
    )
    motivo = models.CharField("Motivo", max_length=255, blank=True)
    observacao = models.TextField("Observação", blank=True)
    dados_extras = models.JSONField("Dados extras", null=True, blank=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)

    class Meta:
        verbose_name = "Histórico de Triagem"
        verbose_name_plural = "Históricos de Triagem"
        ordering = ["-criado_em"]

    def __str__(self) -> str:
        return f"{self.get_evento_display()} - {self.triagem.numero_protocolo}"

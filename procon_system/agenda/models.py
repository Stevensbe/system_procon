from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta


class Fiscal(models.Model):
    nome = models.CharField("Nome Completo", max_length=255)
    matricula = models.CharField("Matrícula", max_length=20, unique=True)
    email = models.EmailField("Email", blank=True)
    telefone = models.CharField("Telefone", max_length=20, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Fiscal"
        verbose_name_plural = "Fiscais"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} ({self.matricula})"


class TipoEvento(models.Model):
    nome = models.CharField("Nome", max_length=100, unique=True)
    cor = models.CharField("Cor", max_length=7, default='#007bff', help_text="Cor hexadecimal")
    icone = models.CharField("Ícone", max_length=50, blank=True)
    descricao = models.TextField("Descrição", blank=True)
    duracao_padrao = models.IntegerField("Duração Padrão (min)", default=60)
    permite_conflito = models.BooleanField("Permite Conflito de Horário", default=False)
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Tipo de Evento"
        verbose_name_plural = "Tipos de Evento"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class EventoAgenda(models.Model):
    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('normal', 'Normal'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    STATUS_CHOICES = [
        ('agendado', 'Agendado'),
        ('confirmado', 'Confirmado'),
        ('em_andamento', 'Em Andamento'),
        ('concluido', 'Concluído'),
        ('cancelado', 'Cancelado'),
        ('adiado', 'Adiado'),
    ]
    
    # Identificação
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    tipo = models.ForeignKey(TipoEvento, on_delete=models.CASCADE, verbose_name="Tipo")
    
    # Data e hora
    data_inicio = models.DateTimeField("Data/Hora Início")
    data_fim = models.DateTimeField("Data/Hora Fim")
    dia_inteiro = models.BooleanField("Dia Inteiro", default=False)
    
    # Responsáveis
    fiscal_responsavel = models.ForeignKey(
        Fiscal, 
        on_delete=models.CASCADE, 
        related_name='eventos_responsavel',
        verbose_name="Fiscal Responsável"
    )
    fiscais_participantes = models.ManyToManyField(
        Fiscal, 
        through='ParticipacaoEvento',
        related_name='eventos_participantes',
        verbose_name="Fiscais Participantes",
        blank=True
    )
    
    # Localização
    local = models.CharField("Local", max_length=255, blank=True)
    endereco = models.TextField("Endereço Completo", blank=True)
    observacoes_local = models.TextField("Observações do Local", blank=True)
    
    # Configurações
    prioridade = models.CharField("Prioridade", max_length=10, choices=PRIORIDADE_CHOICES, default='normal')
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='agendado')
    
    # Lembretes
    lembrete_antecedencia = models.IntegerField("Lembrete (min antes)", default=30, help_text="0 = sem lembrete")
    lembrete_enviado = models.BooleanField("Lembrete Enviado", default=False)
    
    # Recorrência
    recorrente = models.BooleanField("Recorrente", default=False)
    tipo_recorrencia = models.CharField("Tipo de Recorrência", max_length=20, choices=[
        ('diaria', 'Diária'),
        ('semanal', 'Semanal'), 
        ('mensal', 'Mensal'),
        ('anual', 'Anual'),
    ], blank=True)
    intervalo_recorrencia = models.IntegerField("Intervalo", default=1, help_text="A cada X períodos")
    fim_recorrencia = models.DateField("Fim da Recorrência", null=True, blank=True)
    evento_pai = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, verbose_name="Evento Pai")
    
    # Relacionamentos com outros módulos
    empresa_relacionada = models.CharField("CNPJ Empresa", max_length=18, blank=True)
    processo_relacionado = models.CharField("Número Processo", max_length=50, blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    criado_por = models.CharField("Criado por", max_length=100)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Evento da Agenda"
        verbose_name_plural = "Eventos da Agenda"
        ordering = ['data_inicio']
        indexes = [
            models.Index(fields=['data_inicio', 'data_fim']),
            models.Index(fields=['fiscal_responsavel', 'data_inicio']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.data_inicio.strftime('%d/%m/%Y %H:%M')}"
    
    def clean(self):
        if self.data_fim <= self.data_inicio:
            raise ValidationError("Data/hora fim deve ser posterior ao início")
        
        if not self.tipo.permite_conflito:
            # Verifica conflitos de horário
            conflitos = self.verificar_conflitos()
            if conflitos:
                raise ValidationError(f"Conflito de horário detectado: {conflitos}")
    
    def verificar_conflitos(self):
        """Verifica conflitos de horário para os fiscais envolvidos"""
        fiscais = [self.fiscal_responsavel]
        
        conflitos = EventoAgenda.objects.filter(
            data_inicio__lt=self.data_fim,
            data_fim__gt=self.data_inicio,
            status__in=['agendado', 'confirmado', 'em_andamento'],
        ).filter(
            models.Q(fiscal_responsavel__in=fiscais) |
            models.Q(fiscais_participantes__in=fiscais)
        ).exclude(id=self.id if self.id else None)
        
        if conflitos.exists():
            return [f"{c.titulo} ({c.data_inicio.strftime('%H:%M')})" for c in conflitos[:3]]
        
        return []
    
    @property
    def duracao_minutos(self):
        """Retorna duração em minutos"""
        delta = self.data_fim - self.data_inicio
        return int(delta.total_seconds() / 60)
    
    @property
    def esta_vencido(self):
        """Verifica se o evento já passou"""
        return self.data_fim < timezone.now()
    
    def gerar_proxima_recorrencia(self):
        """Gera o próximo evento da recorrência"""
        if not self.recorrente or not self.tipo_recorrencia:
            return None
        
        if self.fim_recorrencia and self.data_inicio.date() >= self.fim_recorrencia:
            return None
        
        # Calcula próxima data
        if self.tipo_recorrencia == 'diaria':
            proxima_data = self.data_inicio + timedelta(days=self.intervalo_recorrencia)
        elif self.tipo_recorrencia == 'semanal':
            proxima_data = self.data_inicio + timedelta(weeks=self.intervalo_recorrencia)
        elif self.tipo_recorrencia == 'mensal':
            proxima_data = self.data_inicio + timedelta(days=30 * self.intervalo_recorrencia)
        elif self.tipo_recorrencia == 'anual':
            proxima_data = self.data_inicio.replace(year=self.data_inicio.year + self.intervalo_recorrencia)
        else:
            return None
        
        # Calcula duração
        duracao = self.data_fim - self.data_inicio
        
        # Cria novo evento
        novo_evento = EventoAgenda.objects.create(
            titulo=self.titulo,
            descricao=self.descricao,
            tipo=self.tipo,
            data_inicio=proxima_data,
            data_fim=proxima_data + duracao,
            fiscal_responsavel=self.fiscal_responsavel,
            local=self.local,
            endereco=self.endereco,
            prioridade=self.prioridade,
            recorrente=True,
            tipo_recorrencia=self.tipo_recorrencia,
            intervalo_recorrencia=self.intervalo_recorrencia,
            fim_recorrencia=self.fim_recorrencia,
            evento_pai=self.evento_pai or self,
            criado_por=self.criado_por,
        )
        
        return novo_evento


class ParticipacaoEvento(models.Model):
    STATUS_PARTICIPACAO_CHOICES = [
        ('convidado', 'Convidado'),
        ('confirmado', 'Confirmado'),
        ('rejeitado', 'Rejeitado'),
        ('presente', 'Presente'),
        ('ausente', 'Ausente'),
    ]
    
    evento = models.ForeignKey(EventoAgenda, on_delete=models.CASCADE)
    fiscal = models.ForeignKey(Fiscal, on_delete=models.CASCADE)
    status_participacao = models.CharField("Status", max_length=20, choices=STATUS_PARTICIPACAO_CHOICES, default='convidado')
    observacoes = models.TextField("Observações", blank=True)
    data_confirmacao = models.DateTimeField("Data de Confirmação", null=True, blank=True)
    
    class Meta:
        verbose_name = "Participação em Evento"
        verbose_name_plural = "Participações em Eventos"
        unique_together = ['evento', 'fiscal']
    
    def __str__(self):
        return f"{self.fiscal.nome} - {self.evento.titulo} ({self.get_status_participacao_display()})"


class LembreteEvento(models.Model):
    CANAL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('sistema', 'Sistema'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('enviado', 'Enviado'),
        ('falhado', 'Falhado'),
        ('cancelado', 'Cancelado'),
    ]
    
    evento = models.ForeignKey(EventoAgenda, on_delete=models.CASCADE, related_name='lembretes')
    fiscal = models.ForeignKey(Fiscal, on_delete=models.CASCADE)
    
    # Configuração
    canal = models.CharField("Canal", max_length=20, choices=CANAL_CHOICES, default='email')
    antecedencia_minutos = models.IntegerField("Antecedência (min)")
    
    # Agendamento
    data_agendada = models.DateTimeField("Data Agendada")
    data_envio = models.DateTimeField("Data de Envio", null=True, blank=True)
    
    # Status
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='pendente')
    erro_envio = models.TextField("Erro de Envio", blank=True)
    
    class Meta:
        verbose_name = "Lembrete de Evento"
        verbose_name_plural = "Lembretes de Eventos"
        ordering = ['data_agendada']
    
    def __str__(self):
        return f"Lembrete: {self.evento.titulo} - {self.fiscal.nome}"
    
    def enviar(self):
        """Envia o lembrete"""
        try:
            if self.canal == 'email':
                # Integração com módulo de notificações
                from notificacoes.models import Notificacao, TipoNotificacao
                
                tipo_lembrete, created = TipoNotificacao.objects.get_or_create(
                    codigo='lembrete_evento',
                    defaults={'nome': 'Lembrete de Evento'}
                )
                
                Notificacao.objects.create(
                    tipo=tipo_lembrete,
                    destinatario_nome=self.fiscal.nome,
                    destinatario_email=self.fiscal.email,
                    assunto=f"Lembrete: {self.evento.titulo}",
                    conteudo=f"Você tem um evento agendado: {self.evento.titulo}\n"
                             f"Data/Hora: {self.evento.data_inicio.strftime('%d/%m/%Y %H:%M')}\n"
                             f"Local: {self.evento.local}",
                    canal='email',
                    content_object=self.evento,
                )
            
            self.status = 'enviado'
            self.data_envio = timezone.now()
            self.save()
            return True
            
        except Exception as e:
            self.status = 'falhado'
            self.erro_envio = str(e)
            self.save()
            return False


class CalendarioFiscalizacao(models.Model):
    """Calendário específico para programação de fiscalizações"""
    TIPO_FISCALIZACAO_CHOICES = [
        ('rotina', 'Fiscalização de Rotina'),
        ('denuncia', 'Atendimento a Denúncia'),
        ('operacao', 'Operação Especial'),
        ('reincidencia', 'Verificação de Reincidência'),
        ('monitoramento', 'Monitoramento de Preços'),
    ]
    
    # Identificação
    nome = models.CharField("Nome da Fiscalização", max_length=200)
    tipo_fiscalizacao = models.CharField("Tipo", max_length=20, choices=TIPO_FISCALIZACAO_CHOICES)
    descricao = models.TextField("Descrição", blank=True)
    
    # Programação
    data_programada = models.DateField("Data Programada")
    hora_inicio = models.TimeField("Hora Início")
    hora_fim = models.TimeField("Hora Fim", null=True, blank=True)
    
    # Equipe
    fiscal_responsavel = models.ForeignKey(Fiscal, on_delete=models.CASCADE, related_name='fiscalizacoes_responsavel')
    fiscal_apoio = models.ForeignKey(Fiscal, on_delete=models.SET_NULL, null=True, blank=True, related_name='fiscalizacoes_apoio')
    
    # Estabelecimentos
    empresas_alvo = models.TextField("Empresas Alvo", help_text="CNPJs ou nomes, um por linha")
    setor_alvo = models.CharField("Setor Alvo", max_length=100, blank=True)
    regiao_alvo = models.CharField("Região", max_length=100, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('programada', 'Programada'),
        ('em_execucao', 'Em Execução'),
        ('concluida', 'Concluída'),
        ('cancelada', 'Cancelada'),
        ('adiada', 'Adiada'),
    ]
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='programada')
    
    # Resultados
    data_execucao = models.DateField("Data de Execução", null=True, blank=True)
    estabelecimentos_visitados = models.IntegerField("Estabelecimentos Visitados", default=0)
    autos_lavrados = models.IntegerField("Autos Lavrados", default=0)
    observacoes_resultado = models.TextField("Observações do Resultado", blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    criado_por = models.CharField("Criado por", max_length=100)
    
    class Meta:
        verbose_name = "Calendário de Fiscalização"
        verbose_name_plural = "Calendário de Fiscalizações"
        ordering = ['data_programada', 'hora_inicio']
    
    def __str__(self):
        return f"{self.nome} - {self.data_programada.strftime('%d/%m/%Y')}"
    
    def gerar_evento_agenda(self):
        """Gera evento correspondente na agenda geral"""
        data_inicio = datetime.combine(self.data_programada, self.hora_inicio)
        data_fim = datetime.combine(
            self.data_programada, 
            self.hora_fim or (datetime.combine(self.data_programada, self.hora_inicio) + timedelta(hours=4)).time()
        )
        
        tipo_evento, created = TipoEvento.objects.get_or_create(
            nome='Fiscalização',
            defaults={'cor': '#dc3545', 'icone': 'fa-search'}
        )
        
        evento = EventoAgenda.objects.create(
            titulo=self.nome,
            descricao=self.descricao,
            tipo=tipo_evento,
            data_inicio=data_inicio,
            data_fim=data_fim,
            fiscal_responsavel=self.fiscal_responsavel,
            local=self.regiao_alvo,
            empresa_relacionada=self.empresas_alvo.split('\n')[0] if self.empresas_alvo else '',
            criado_por=self.criado_por,
        )
        
        # Adiciona fiscal de apoio como participante
        if self.fiscal_apoio:
            ParticipacaoEvento.objects.create(
                evento=evento,
                fiscal=self.fiscal_apoio,
                status_participacao='confirmado'
            )
        
        return evento
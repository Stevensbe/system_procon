"""
Modelos para Exportações Automáticas Governamentais
Sistema Procon - Fase 5 - Portal Externo & Integradores
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.files.base import ContentFile
import uuid
import json


class TipoExportacao(models.Model):
    """Tipos de exportações governamentais disponíveis"""
    
    CODIGO_CHOICES = [
        ('REL_MENSAL_PROCON_SP', 'Relatório Mensal PROCON-SP'),
        ('REL_TRIMESTRAL_ACAS', 'Relatório Trimestral ANAC'),
        ('REL_ANUAL_JUDICIARIO', 'Relatório Anual para Judiciário'),
        ('REL_SEMANAL_MP', 'Relatório Semanal MP'),
        ('REL_METRICS_SERPRO', 'Tabelas de Métricas SERPRO'),
        ('REL_DECISOES_CODECON', 'Decisões para CODECON'),
        ('REL_ESADIC_ANATEL', 'Dados ESADIC para ANATEL'),
        ('REL_DADOS_OPEN_DATA', 'Relatório Open Data Governamental'),
    ]
    
    codigo = models.CharField(max_length=30, choices=CODIGO_CHOICES, unique=True)
    nome_exibicao = models.CharField(max_length=200)
    descricao = models.TextField()
    
    # Configurações de frequência
    frequencia_automatica = models.CharField(
        max_length=15,
        choices=[
            ('SEMANAL', 'Semanal'),
            ('BI_SEMANAL', 'Bi-semanal'),
            ('MENSAL', 'Mensal'),
            ('BIMESTRAL', 'Bimestral'),
            ('TRIMESTRAL', 'Trimestral'),
            ('SEMESTRAL', 'Semestral'),
            ('ANUAL', 'Anual'),
            ('MANUAL', 'Manual'),
        ],
        default='MENSAL'
    )
    
    # Configurações de conteúdo
    tipos_documentos_incluir = models.JSONField(default=list)  # ['reclamacoes', 'cips', 'audiencias']
    filtros_aplicar = models.JSONField(default=dict)
    campos_exportar = models.JSONField(default=list)
    
    # Destinação
    orgao_destino_nome = models.CharField(max_length=200)
    formato_arquivo = models.CharField(
        max_length=10,
        choices=[
            ('JSON', 'JSON'),
            ('XML', 'XML'),
            ('CSV', 'CSV'),
            ('XLSX', 'Excel'),
            ('PDF', 'PDF'),
            ('TXT', 'Texto'),
        ],
        default='JSON'
    )
    
    # Controle
    ativo = models.BooleanField(default=True)
    validação_obrigatoria = models.BooleanField(default=True)
    enviar_email_notificacao = models.BooleanField(default=True)
    
    # Metadados
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Tipo de Exportação"
        verbose_name_plural = "Tipos de Exportação"
        ordering = ['orgao_destino_nome', 'nome_exibicao']
    
    def __str__(self):
        return f"{self.nome_exibicao} - {self.orgao_destino_nome}"
    
    def configurar_periodo_next(self) -> timezone.datetime:
        """Calcula próxima execução baseada na frequência"""
        agora = timezone.now()
        
        if self.frequencia_automatica == 'SEMANAL':
            return agora + timezone.timedelta(days=7)
        elif self.frequencia_automatica == 'BI_SEMANAL':
            return agora + timezone.timedelta(days=14)
        elif self.frequencia_automatica == 'MENSAL':
            return agora + timezone.timedelta(days=30)
        elif self.frequencia_automatica == 'TRIMESTRAL':
            return agora + timezone.timedelta(days=90)
        elif self.frequencia_automatica == 'ANUAL':
            return agora + timezone.timedelta(days=365)
        else:
            return agora  # Manual não agenda automaticamente


class AgendamentoExportacao(models.Model):
    """Agendamentos específicos de exportações"""
    
    STATUS_CHOICES = [
        ('AGENDA', 'Agendada'),
        ('EXECUTING', 'Executando'),
        ('CONCLUIDA', 'Concluída'),
        ('ERRO', 'Erro'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    tipo_exportacao = models.ForeignKey(TipoExportacao, on_delete=models.CASCADE, related_name='agendamentos')
    
    # Período específico da exportação
    periodo_de = models.DateTimeField()
    periodo_ate = models.DateTimeField()
    
    # Controle de execução
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='AGENDA')
    data_agendamento = models.DateTimeField(auto_now_add=True)
    data_execucao_inicio = models.DateTimeField(null=True, blank=True)
    data_execucao_fim = models.DateTimeField(null=True, blank=True)
    
    # Configurações específicas desta execução (
    parametros_especificos = models.JSONField(default=dict)
    
    # Resultados
    arquivo_gerado = models.FileField(upload_to='exportacoes/', null=True, blank=True)
    tamanho_arquivo_mb = models.FloatField(null=True, blank=True)
    quantidade_registros = models.PositiveIntegerField(null=True, blank=True)
    
    # Metadados e auditoria
    executado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    log_execucao = models.TextField(blank=True)
    erros_processamento = models.JSONField(default=list)
    
    class Meta:
        verbose_name = "Agendamento de Exportação"
        verbose_name_plural = "Agendamentos de Exportação"
        ordering = ['-data_agendamento']
    
    def __str__(self):
        return f"{self.tipo_exportacao.nome_exibicao} - {self.periodo_de.date()} a {self.periodo_ate.date()}"


class ExecucaoExportacao(models.Model):
    """Detalhes de cada execução de exportação"""
    
    STATUS_CHOICES = [
        ('EM_EXECUCAO', 'Em Execução'),
        ('CONCLUIDA', 'Concluída'),
        ('ERRO', 'Erro'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    agendamento = models.ForeignKey(AgendamentoExportacao, on_delete=models.CASCADE, related_name='execucoes')
    
    # Status da execução
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='EM_EXECUCAO')
    data_inicio = models.DateTimeField(auto_now_add=True)
    data_fim = models.DateTimeField(null=True, blank=True)
    
    # Métricas de processo
    total_consulta_db = models.PositiveIntegerField(default=0)
    registros_processados = models.PositiveIntegerField(default=0)
    tamanho_dados_processados_mb = models.FloatField(default=0)
    
    # Outputs
    arquivos_gerados = models.JSONField(default=list)  # Lista de arquivos criados
    stats_processamento = models.JSONField(default=dict)  # Estatísticas detalhadas
    
    # Controle de erros
    erros_criticidade_alta = models.PositiveIntegerField(default=0)
    erros_criticidade_media = models.PositiveIntegerField(default=0)
    erros_criticidade_baixa = models.PositiveIntegerField(default=0)
    warnings_processamento = models.JSONField(default=list)
    
    # Feedback
    observacoes_execucao = models.TextField(blank=True)
    validações_realizadas = models.JSONField(default=list)
    
    class Meta:
        verbose_name = "Execução de Exportação"
        verbose_name_plural = "Execuções de Exportação"
        ordering = ['-data_inicio']
    
    def __str__(self):
        return f"Execução {self.id} - {self.agendamento.tipo_exportacao.nome_exibicao}"


class TemplateExportacao(models.Model):
    """Templates específicos para diferentes tipos de exportação"""
    
    tipo_exportacao = models.ForeignKey(TipoExportacao, on_delete=models.CASCADE, related_name='templates')
    
    nome_template = models.CharField(max_length=150)
    versao_template = models.CharField(max_length=10, default='1.0')
    
    # Template do cabeçalho do arquivo
    estrutura_cabecalho = models.TextField(blank=True)
    estrutura_rodape = models.TextField(blank=True)
    
    # Template para cada tipo de registro
    template_registro_reclamacao = models.TextField(blank=True)
    template_registro_cip = models.TextField(blank=True)
    template_registro_audiencia = models.TextField(blank=True)
    template_registro_decisions = models.TextField(blank=True)
    
    # Configurações de formatação
    separador_campos = models.CharField(max_length=5, default=',')
    encoding_arquivo = models.CharField(max_length=20, default='utf-8')
    include_bom = models.BooleanField(default=False)
    
    # Configurações de qualidade
    aplicar_validacoes = models.BooleanField(default=True)
    requer_assinatura_digital = models.BooleanField(default=False)
    
    # Controle
    ativo = models.BooleanField(default=True)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['tipo_exportacao', 'versao_template']
        verbose_name = "Template de Exportação"
        verbose_name_plural = "Templates de Exportação"
    
    def __str__(self):
        return f"{self.nome_template} v{self.versao_template} - {self.tipo_exportacao}"


class HistoricoExportacao(models.Model):
    """Histórico completo das exportações realizadas"""
    
    agendamento = models.ForeignKey(AgendamentoExportacao, on_delete=models.CASCADE, related_name='historico')
    
    # Evento do histórico
    evento_acao = models.CharField(
        max_length=30,
        choices=[
            ('CRIADO_AGENDAMENTO', 'Agendamento Criado'),
            ('INICIADA_EXECUCAO', 'Execução Iniciada'),
            ('DADOS_COLLECTED', 'Dados Coletados'),
            ('PROCESSADO_DADOS', 'Dados Processados'),
            ('GERADO_ARCHIVO', 'Arquivo Gerado'),
            ('VALIDADO_CONTEUDO', 'Conteúdo Validado'),
            ('ENVIADO_DESTINO', 'Enviado ao Destino'),
            ('CONCLUII_EXECUCAO', 'Execução Concluída'),
            ('ERRO_PROCESSAMENTO', 'Erro na Execução'),
            ('CANCELADO_EXTERNO', 'Cancelado Externamente'),
        ]
    )
    
    descricao_evento = models.TextField()
    dados_contextuais = models.JSONField(default=dict)
    
    # Timestamp
    data_evento = models.DateTimeField(auto_now_add=True)
    duracao_parte_segundos = models.FloatField(null=True, blank=True)
    
    # Usuário responsável (se aplicável)
    usuario_responsavel = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = "Histórico de Exportação"
        verbose_name_plural = "Históricos de Exportação"
        ordering = ['agendamento', 'data_evento']
    
    def __str__(self):
        return f"{self.get_evento_acao_display()} - {self.agendamento.tipo_exportacao.nome_exibicao}"


class DestinacaoExportacao(models.Model):
    """Configurações de destinatários para exportações"""
    
    nome_destinacao = models.CharField(max_length=200)
    
    # Destinatário específico
    destinatario_orgao = models.ForeignKey('apis_externas.OrgaoExterno', on_delete=models.CASCADE, null=True, blank=True)
    destinatario_email = models.EmailField(blank=True)
    destinatario_endpoint_api = models.URLField(blank=True)
    destinatario_friendly_name = models.CharField(max_length=150)  # Para identificação
    
    # Método
    METODO_ENVIO_CHOICES = [
        ('EMAIL', 'E-mail'),
        ('API_POST', 'API REST POST'),
        ('FTP', 'FTP/SFTP'),
        ('MESSAGE_QUEUE', 'Message Queue'),
        ('COPIAR_ARQUIVO_LOCAL', 'Copiar para Pasta Local'),
    ]
    
    metodo_envio = models.CharField(max_length=20, choices=METODO_ENVIO_CHOICES, default='EMAIL')
    
    # Configurações específicas
    configuracao_envio = models.JSONField(default=dict)
    
    # Autenticação
    credencial_envio = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Confirmação
    require_confirmacao_envio = models.BooleanField(default=True)
    template_confirmacao = models.TextField(blank=True)
    
    # Status
    ativo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Destinação de Exportação"
        verbose_name_plural = "Destinações de Exportação"
    
    def __str__(self):
        return f"{self.nome_destinacao} → {self.destinatario_friendly_name}"

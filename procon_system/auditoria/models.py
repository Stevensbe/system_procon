from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import json


class TipoEvento(models.Model):
    nome = models.CharField("Nome", max_length=100, unique=True)
    codigo = models.CharField("Código", max_length=50, unique=True)
    descricao = models.TextField("Descrição", blank=True)
    categoria = models.CharField("Categoria", max_length=50, choices=[
        ('sistema', 'Sistema'),
        ('usuario', 'Usuário'),
        ('processo', 'Processo'),
        ('financeiro', 'Financeiro'),
        ('fiscalizacao', 'Fiscalização'),
        ('seguranca', 'Segurança'),
    ], default='sistema')
    nivel_criticidade = models.CharField("Nível de Criticidade", max_length=10, choices=[
        ('baixo', 'Baixo'),
        ('medio', 'Médio'),
        ('alto', 'Alto'),
        ('critico', 'Crítico'),
    ], default='baixo')
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Tipo de Evento"
        verbose_name_plural = "Tipos de Evento"
        ordering = ['categoria', 'nome']
    
    def __str__(self):
        return f"{self.nome} ({self.categoria})"


class LogSistema(models.Model):
    NIVEL_CHOICES = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    # Identificação
    tipo_evento = models.ForeignKey(TipoEvento, on_delete=models.CASCADE, verbose_name="Tipo de Evento")
    nivel = models.CharField("Nível", max_length=10, choices=NIVEL_CHOICES, default='INFO')
    
    # Usuário (se aplicável)
    usuario = models.CharField("Usuário", max_length=100, blank=True)
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    user_agent = models.TextField("User Agent", blank=True)
    
    # Objeto relacionado (genérico)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Evento
    acao = models.CharField("Ação", max_length=100)
    descricao = models.TextField("Descrição")
    detalhes = models.TextField("Detalhes Técnicos", blank=True)
    
    # Dados antes e depois (para alterações)
    dados_anteriores = models.TextField("Dados Anteriores", blank=True, help_text="JSON")
    dados_posteriores = models.TextField("Dados Posteriores", blank=True, help_text="JSON")
    
    # Contexto adicional
    modulo = models.CharField("Módulo", max_length=50, blank=True)
    funcao = models.CharField("Função", max_length=100, blank=True)
    linha_codigo = models.IntegerField("Linha do Código", null=True, blank=True)
    
    # Sessão
    session_key = models.CharField("Chave da Sessão", max_length=40, blank=True)
    
    # Tempo
    timestamp = models.DateTimeField("Timestamp", auto_now_add=True)
    duracao_ms = models.IntegerField("Duração (ms)", null=True, blank=True)
    
    # Status
    sucesso = models.BooleanField("Sucesso", default=True)
    codigo_erro = models.CharField("Código do Erro", max_length=20, blank=True)
    mensagem_erro = models.TextField("Mensagem de Erro", blank=True)
    
    class Meta:
        verbose_name = "Log do Sistema"
        verbose_name_plural = "Logs do Sistema"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['usuario', 'timestamp']),
            models.Index(fields=['tipo_evento', 'timestamp']),
            models.Index(fields=['nivel']),
            models.Index(fields=['sucesso']),
        ]
    
    def __str__(self):
        return f"{self.nivel} - {self.acao} - {self.timestamp.strftime('%d/%m/%Y %H:%M:%S')}"
    
    @classmethod
    def log_evento(cls, tipo_evento_codigo, acao, descricao, usuario=None, objeto=None, **kwargs):
        """Método para registrar eventos de forma simplificada"""
        try:
            tipo_evento = TipoEvento.objects.get(codigo=tipo_evento_codigo, ativo=True)
        except TipoEvento.DoesNotExist:
            tipo_evento = TipoEvento.objects.create(
                nome=tipo_evento_codigo,
                codigo=tipo_evento_codigo,
                categoria='sistema'
            )
        
        log_data = {
            'tipo_evento': tipo_evento,
            'acao': acao,
            'descricao': descricao,
            'usuario': usuario or 'sistema',
            'sucesso': kwargs.get('sucesso', True),
            'nivel': kwargs.get('nivel', 'INFO'),
            'detalhes': kwargs.get('detalhes', ''),
            'modulo': kwargs.get('modulo', ''),
            'ip_origem': kwargs.get('ip_origem'),
            'user_agent': kwargs.get('user_agent', ''),
        }
        
        if objeto:
            log_data['content_object'] = objeto
        
        return cls.objects.create(**log_data)


class AuditoriaAlteracao(models.Model):
    """Auditoria específica para alterações de dados"""
    # Objeto alterado
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    object_repr = models.CharField("Representação do Objeto", max_length=255)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Alteração
    acao = models.CharField("Ação", max_length=20, choices=[
        ('CREATE', 'Criação'),
        ('UPDATE', 'Alteração'),
        ('DELETE', 'Exclusão'),
    ])
    
    # Campos alterados
    campos_alterados = models.TextField("Campos Alterados", help_text="JSON com campos e valores")
    valores_anteriores = models.TextField("Valores Anteriores", blank=True, help_text="JSON")
    valores_novos = models.TextField("Valores Novos", blank=True, help_text="JSON")
    
    # Responsável
    usuario = models.CharField("Usuário", max_length=100)
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    timestamp = models.DateTimeField("Timestamp", auto_now_add=True)
    
    # Contexto
    motivo = models.TextField("Motivo da Alteração", blank=True)
    observacoes = models.TextField("Observações", blank=True)
    
    class Meta:
        verbose_name = "Auditoria de Alteração"
        verbose_name_plural = "Auditoria de Alterações"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['usuario', 'timestamp']),
            models.Index(fields=['acao']),
        ]
    
    def __str__(self):
        return f"{self.get_acao_display()} - {self.object_repr} - {self.usuario}"
    
    def get_campos_alterados_dict(self):
        """Retorna campos alterados como dicionário"""
        try:
            return json.loads(self.campos_alterados) if self.campos_alterados else {}
        except json.JSONDecodeError:
            return {}
    
    def get_valores_anteriores_dict(self):
        """Retorna valores anteriores como dicionário"""
        try:
            return json.loads(self.valores_anteriores) if self.valores_anteriores else {}
        except json.JSONDecodeError:
            return {}
    
    def get_valores_novos_dict(self):
        """Retorna valores novos como dicionário"""
        try:
            return json.loads(self.valores_novos) if self.valores_novos else {}
        except json.JSONDecodeError:
            return {}


class SessaoUsuario(models.Model):
    """Log de sessões de usuários"""
    usuario = models.CharField("Usuário", max_length=100)
    session_key = models.CharField("Chave da Sessão", max_length=40, unique=True)
    
    # Login
    data_login = models.DateTimeField("Data do Login")
    ip_login = models.GenericIPAddressField("IP do Login")
    user_agent_login = models.TextField("User Agent Login")
    
    # Logout
    data_logout = models.DateTimeField("Data do Logout", null=True, blank=True)
    tipo_logout = models.CharField("Tipo de Logout", max_length=20, choices=[
        ('manual', 'Manual'),
        ('timeout', 'Timeout'),
        ('expiracao', 'Expiração'),
        ('forcado', 'Forçado'),
    ], blank=True)
    
    # Atividade
    ultima_atividade = models.DateTimeField("Última Atividade", auto_now=True)
    total_requisicoes = models.IntegerField("Total de Requisições", default=0)
    
    # Status
    ativa = models.BooleanField("Sessão Ativa", default=True)
    
    class Meta:
        verbose_name = "Sessão de Usuário"
        verbose_name_plural = "Sessões de Usuário"
        ordering = ['-data_login']
        indexes = [
            models.Index(fields=['usuario', 'data_login']),
            models.Index(fields=['ativa']),
        ]
    
    def __str__(self):
        return f"{self.usuario} - {self.data_login.strftime('%d/%m/%Y %H:%M')}"
    
    @property
    def duracao_sessao(self):
        """Calcula duração da sessão"""
        fim = self.data_logout or timezone.now()
        return fim - self.data_login
    
    def encerrar_sessao(self, tipo='manual'):
        """Encerra a sessão"""
        self.data_logout = timezone.now()
        self.tipo_logout = tipo
        self.ativa = False
        self.save()


class AcessoRecurso(models.Model):
    """Log de acesso a recursos específicos"""
    usuario = models.CharField("Usuário", max_length=100)
    recurso = models.CharField("Recurso", max_length=255)
    acao = models.CharField("Ação", max_length=50)
    
    # Detalhes do acesso
    parametros = models.TextField("Parâmetros", blank=True, help_text="JSON")
    metodo_http = models.CharField("Método HTTP", max_length=10)
    url_completa = models.TextField("URL Completa")
    
    # Resposta
    codigo_resposta = models.IntegerField("Código de Resposta")
    tempo_resposta = models.IntegerField("Tempo de Resposta (ms)")
    
    # Contexto
    ip_origem = models.GenericIPAddressField("IP de Origem")
    user_agent = models.TextField("User Agent", blank=True)
    timestamp = models.DateTimeField("Timestamp", auto_now_add=True)
    
    # Autorização
    autorizado = models.BooleanField("Autorizado", default=True)
    motivo_negacao = models.CharField("Motivo da Negação", max_length=255, blank=True)
    
    class Meta:
        verbose_name = "Acesso a Recurso"
        verbose_name_plural = "Acessos a Recursos"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['usuario', 'timestamp']),
            models.Index(fields=['recurso']),
            models.Index(fields=['codigo_resposta']),
            models.Index(fields=['autorizado']),
        ]
    
    def __str__(self):
        return f"{self.usuario} - {self.acao} - {self.recurso}"


class BackupLog(models.Model):
    """Log de backups realizados"""
    TIPO_BACKUP_CHOICES = [
        ('completo', 'Backup Completo'),
        ('incremental', 'Backup Incremental'),
        ('diferencial', 'Backup Diferencial'),
    ]
    
    STATUS_CHOICES = [
        ('iniciado', 'Iniciado'),
        ('em_progresso', 'Em Progresso'),
        ('concluido', 'Concluído'),
        ('falhado', 'Falhado'),
        ('cancelado', 'Cancelado'),
    ]
    
    # Identificação
    nome_backup = models.CharField("Nome do Backup", max_length=255)
    tipo_backup = models.CharField("Tipo", max_length=15, choices=TIPO_BACKUP_CHOICES)
    
    # Execução
    data_inicio = models.DateTimeField("Data de Início")
    data_fim = models.DateTimeField("Data de Fim", null=True, blank=True)
    duracao = models.DurationField("Duração", null=True, blank=True)
    
    # Dados
    tamanho_backup = models.BigIntegerField("Tamanho (bytes)", null=True, blank=True)
    quantidade_arquivos = models.IntegerField("Quantidade de Arquivos", null=True, blank=True)
    local_armazenamento = models.TextField("Local de Armazenamento")
    
    # Status
    status = models.CharField("Status", max_length=15, choices=STATUS_CHOICES, default='iniciado')
    progresso_percentual = models.IntegerField("Progresso %", default=0)
    
    # Resultado
    sucesso = models.BooleanField("Sucesso", default=False)
    erro_detalhes = models.TextField("Detalhes do Erro", blank=True)
    hash_verificacao = models.CharField("Hash de Verificação", max_length=64, blank=True)
    
    # Responsável
    executado_por = models.CharField("Executado por", max_length=100)
    automatico = models.BooleanField("Backup Automático", default=False)
    
    class Meta:
        verbose_name = "Log de Backup"
        verbose_name_plural = "Logs de Backup"
        ordering = ['-data_inicio']
        indexes = [
            models.Index(fields=['data_inicio']),
            models.Index(fields=['status']),
            models.Index(fields=['sucesso']),
        ]
    
    def __str__(self):
        return f"{self.nome_backup} - {self.data_inicio.strftime('%d/%m/%Y %H:%M')}"
    
    @property
    def tamanho_formatado(self):
        """Retorna tamanho formatado"""
        if not self.tamanho_backup:
            return "N/A"
        
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if self.tamanho_backup < 1024.0:
                return f"{self.tamanho_backup:.1f} {unit}"
            self.tamanho_backup /= 1024.0
        return f"{self.tamanho_backup:.1f} PB"


class LogSeguranca(models.Model):
    """Log específico para eventos de segurança"""
    TIPO_EVENTO_CHOICES = [
        ('login_sucesso', 'Login com Sucesso'),
        ('login_falha', 'Falha no Login'),
        ('logout', 'Logout'),
        ('tentativa_acesso_negado', 'Tentativa de Acesso Negado'),
        ('alteracao_senha', 'Alteração de Senha'),
        ('tentativa_brute_force', 'Tentativa de Brute Force'),
        ('sessao_expirada', 'Sessão Expirada'),
        ('acesso_privilegiado', 'Acesso Privilegiado'),
        ('violacao_integridade', 'Violação de Integridade'),
        ('tentativa_sql_injection', 'Tentativa de SQL Injection'),
        ('tentativa_xss', 'Tentativa de XSS'),
    ]
    
    NIVEL_SEVERIDADE_CHOICES = [
        ('info', 'Informativo'),
        ('baixo', 'Baixo'),
        ('medio', 'Médio'),
        ('alto', 'Alto'),
        ('critico', 'Crítico'),
    ]
    
    # Evento
    tipo_evento = models.CharField("Tipo de Evento", max_length=30, choices=TIPO_EVENTO_CHOICES)
    nivel_severidade = models.CharField("Severidade", max_length=10, choices=NIVEL_SEVERIDADE_CHOICES)
    descricao = models.TextField("Descrição")
    
    # Usuário/Sistema
    usuario = models.CharField("Usuário", max_length=100, blank=True)
    ip_origem = models.GenericIPAddressField("IP de Origem")
    user_agent = models.TextField("User Agent", blank=True)
    
    # Contexto
    recurso_acessado = models.CharField("Recurso Acessado", max_length=255, blank=True)
    detalhes_tecnicos = models.TextField("Detalhes Técnicos", blank=True)
    
    # Resposta do sistema
    acao_tomada = models.TextField("Ação Tomada", blank=True)
    bloqueado = models.BooleanField("Bloqueado", default=False)
    
    # Timestamp
    timestamp = models.DateTimeField("Timestamp", auto_now_add=True)
    
    # Investigação
    investigado = models.BooleanField("Investigado", default=False)
    falso_positivo = models.BooleanField("Falso Positivo", default=False)
    observacoes_investigacao = models.TextField("Observações da Investigação", blank=True)
    
    class Meta:
        verbose_name = "Log de Segurança"
        verbose_name_plural = "Logs de Segurança"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['tipo_evento', 'timestamp']),
            models.Index(fields=['nivel_severidade']),
            models.Index(fields=['usuario']),
            models.Index(fields=['ip_origem']),
            models.Index(fields=['investigado']),
        ]
    
    def __str__(self):
        return f"{self.get_tipo_evento_display()} - {self.ip_origem} - {self.timestamp.strftime('%d/%m/%Y %H:%M')}"
    
    @classmethod
    def log_evento_seguranca(cls, tipo_evento, ip_origem, descricao, usuario=None, **kwargs):
        """Método para registrar eventos de segurança"""
        return cls.objects.create(
            tipo_evento=tipo_evento,
            ip_origem=ip_origem,
            descricao=descricao,
            usuario=usuario or '',
            nivel_severidade=kwargs.get('nivel_severidade', 'info'),
            user_agent=kwargs.get('user_agent', ''),
            recurso_acessado=kwargs.get('recurso_acessado', ''),
            detalhes_tecnicos=kwargs.get('detalhes_tecnicos', ''),
            acao_tomada=kwargs.get('acao_tomada', ''),
            bloqueado=kwargs.get('bloqueado', False),
        )
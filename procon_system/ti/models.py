from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

class Modulo(models.Model):
    """Módulos do sistema"""
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True)
    icone = models.CharField(max_length=50, default='fa-cube')
    ordem = models.IntegerField(default=0)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['ordem', 'nome']
        verbose_name = 'Módulo'
        verbose_name_plural = 'Módulos'
    
    def __str__(self):
        return self.nome

class PermissaoModulo(models.Model):
    """Permissões específicas por módulo"""
    TIPOS_PERMISSAO = [
        ('visualizar', 'Visualizar'),
        ('criar', 'Criar'),
        ('editar', 'Editar'),
        ('excluir', 'Excluir'),
        ('aprovar', 'Aprovar'),
        ('rejeitar', 'Rejeitar'),
        ('exportar', 'Exportar'),
        ('imprimir', 'Imprimir'),
    ]
    
    nome = models.CharField(max_length=50, choices=TIPOS_PERMISSAO)
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name='permissoes')
    descricao = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['nome', 'modulo']
        verbose_name = 'Permissão de Módulo'
        verbose_name_plural = 'Permissões de Módulo'
    
    def __str__(self):
        return f"{self.modulo.nome} - {self.get_nome_display()}"

class PerfilUsuario(models.Model):
    """Perfil estendido do usuário"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    cpf = models.CharField(max_length=14, blank=True)
    matricula = models.CharField(max_length=20, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    cargo = models.CharField(max_length=100, blank=True)
    departamento = models.CharField(max_length=100, blank=True)
    setor = models.CharField(max_length=100, blank=True)
    data_admissao = models.DateField(null=True, blank=True)
    supervisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinados')
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Usuário'
        verbose_name_plural = 'Perfis de Usuários'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.cargo}"

class PermissaoUsuario(models.Model):
    """Permissões específicas do usuário"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissoes_usuario')
    permissao = models.ForeignKey(PermissaoModulo, on_delete=models.CASCADE)
    concedida = models.BooleanField(default=True)
    concedida_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='permissoes_concedidas')
    data_concessao = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['user', 'permissao']
        verbose_name = 'Permissão de Usuário'
        verbose_name_plural = 'Permissões de Usuários'
    
    def __str__(self):
        status = "Concedida" if self.concedida else "Negada"
        return f"{self.user.get_full_name()} - {self.permissao} ({status})"

class LogAuditoria(models.Model):
    """Log de auditoria do sistema"""
    TIPOS_ACAO = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('criar', 'Criar'),
        ('editar', 'Editar'),
        ('excluir', 'Excluir'),
        ('visualizar', 'Visualizar'),
        ('aprovar', 'Aprovar'),
        ('rejeitar', 'Rejeitar'),
        ('exportar', 'Exportar'),
        ('imprimir', 'Imprimir'),
        ('alterar_senha', 'Alterar Senha'),
        ('alterar_permissao', 'Alterar Permissão'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='logs_auditoria')
    acao = models.CharField(max_length=50, choices=TIPOS_ACAO)
    modulo = models.CharField(max_length=100, blank=True)
    objeto_id = models.PositiveIntegerField(null=True, blank=True)
    objeto_tipo = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    objeto = GenericForeignKey('objeto_tipo', 'objeto_id')
    detalhes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    sucesso = models.BooleanField(default=True)
    erro = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Log de Auditoria'
        verbose_name_plural = 'Logs de Auditoria'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['acao', 'timestamp']),
            models.Index(fields=['modulo', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.get_acao_display()} - {self.timestamp}"

class ConfiguracaoSistema(models.Model):
    """Configurações do sistema"""
    chave = models.CharField(max_length=100, unique=True)
    valor = models.TextField()
    descricao = models.TextField(blank=True)
    tipo = models.CharField(max_length=20, default='string', choices=[
        ('string', 'Texto'),
        ('number', 'Número'),
        ('boolean', 'Verdadeiro/Falso'),
        ('json', 'JSON'),
    ])
    categoria = models.CharField(max_length=50, default='geral')
    editavel = models.BooleanField(default=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Configuração do Sistema'
        verbose_name_plural = 'Configurações do Sistema'
    
    def __str__(self):
        return f"{self.chave} = {self.valor}"

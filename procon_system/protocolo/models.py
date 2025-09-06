from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
import os
from datetime import datetime, timedelta


def documento_upload_path(instance, filename):
    """Define o caminho de upload para documentos"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"protocolo/documentos/{instance.protocolo.numero}/{filename}"


class TipoProtocolo(models.Model):
    """Tipos de protocolo disponíveis no sistema"""
    TIPOS_CHOICES = [
        ('DENUNCIA', 'Denúncia'),
        ('RECLAMACAO', 'Reclamação'),
        ('CONSULTA', 'Consulta'),
        ('PETICAO', 'Petição'),
        ('RECURSO', 'Recurso'),
        ('OUTROS', 'Outros'),
    ]
    
    nome = models.CharField("Nome", max_length=100)
    tipo = models.CharField("Tipo", max_length=20, choices=TIPOS_CHOICES)
    descricao = models.TextField("Descrição", blank=True)
    prazo_padrao = models.IntegerField("Prazo Padrão (dias)", default=30)
    ativo = models.BooleanField("Ativo", default=True)
    data_criacao = models.DateTimeField("Data de Criação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Tipo de Protocolo"
        verbose_name_plural = "Tipos de Protocolo"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"


class StatusProtocolo(models.Model):
    """Status possíveis para um protocolo"""
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    cor = models.CharField("Cor (hex)", max_length=7, default="#007bff")
    ordem = models.IntegerField("Ordem", default=0)
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Status de Protocolo"
        verbose_name_plural = "Status de Protocolo"
        ordering = ['ordem']
    
    def __str__(self):
        return self.nome


class ConfiguracaoProtocolo(models.Model):
    """Configurações do sistema de protocolo"""
    
    # Numeração automática
    formato_numero = models.CharField("Formato do Número", max_length=50, default="PROT-{ANO}-{SEQUENCIAL}")
    prefixo_ano = models.CharField("Prefixo do Ano", max_length=10, default="")
    sequencial_ano = models.BooleanField("Sequencial por Ano", default=True)
    sequencial_geral = models.BooleanField("Sequencial Geral", default=False)
    
    # Workflow
    workflow_automatico = models.BooleanField("Workflow Automático", default=True)
    notificar_responsavel = models.BooleanField("Notificar Responsável", default=True)
    notificar_criador = models.BooleanField("Notificar Criador", default=True)
    
    # Upload de documentos
    tamanho_maximo_mb = models.IntegerField("Tamanho Máximo (MB)", default=10)
    tipos_permitidos = models.TextField("Tipos Permitidos", default="pdf,doc,docx,jpg,jpeg,png,txt")
    max_documentos = models.IntegerField("Máximo de Documentos", default=10)
    
    # Prazos
    prazo_padrao_dias = models.IntegerField("Prazo Padrão (dias)", default=30)
    alerta_vencimento_dias = models.IntegerField("Alerta Vencimento (dias)", default=3)
    
    class Meta:
        verbose_name = "Configuração do Protocolo"
        verbose_name_plural = "Configurações do Protocolo"
    
    def __str__(self):
        return "Configurações do Sistema de Protocolo"


class Protocolo(models.Model):
    """Modelo principal de protocolo com funcionalidades avançadas"""
    PRIORIDADES_CHOICES = [
        ('BAIXA', 'Baixa'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]
    
    # Informações básicas
    numero = models.CharField("Número do Protocolo", max_length=50, unique=True, blank=True)
    tipo_protocolo = models.ForeignKey(TipoProtocolo, on_delete=models.PROTECT, verbose_name="Tipo")
    assunto = models.CharField("Assunto", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    prioridade = models.CharField("Prioridade", max_length=10, choices=PRIORIDADES_CHOICES, default='NORMAL')
    
    # Status e workflow
    status = models.ForeignKey(StatusProtocolo, on_delete=models.PROTECT, verbose_name="Status")
    responsavel_atual = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Responsável Atual")
    
    # Prazos
    data_abertura = models.DateTimeField("Data de Abertura", auto_now_add=True)
    data_limite = models.DateTimeField("Data Limite", null=True, blank=True)
    data_conclusao = models.DateTimeField("Data de Conclusão", null=True, blank=True)
    
    # Controle
    criado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='protocolos_criados', verbose_name="Criado por")
    ativo = models.BooleanField("Ativo", default=True)
    
    # Metadados
    observacoes = models.TextField("Observações", blank=True)
    tags = models.JSONField("Tags", default=list, blank=True)
    
    class Meta:
        verbose_name = "Protocolo"
        verbose_name_plural = "Protocolos"
        ordering = ['-data_abertura']
    
    def __str__(self):
        return f"{self.numero} – {self.assunto}"
    
    def save(self, *args, **kwargs):
        # Gerar número automático se não existir
        if not self.numero:
            self.numero = self.gerar_numero_automatico()
        
        # Definir data limite se não foi definida
        if not self.data_limite:
            self.data_limite = timezone.now() + timedelta(days=self.tipo_protocolo.prazo_padrao)
        
        super().save(*args, **kwargs)
    
    def gerar_numero_automatico(self):
        """Gera número automático baseado na configuração"""
        try:
            config = ConfiguracaoProtocolo.objects.first()
            if not config:
                config = ConfiguracaoProtocolo.objects.create()
            
            ano_atual = datetime.now().year
            
            if config.sequencial_ano:
                # Sequencial por ano
                ultimo_protocolo = Protocolo.objects.filter(
                    numero__startswith=f"{config.prefixo_ano}{ano_atual}"
                ).order_by('-numero').first()
                
                if ultimo_protocolo:
                    try:
                        ultimo_numero = int(ultimo_protocolo.numero.split('-')[-1])
                        novo_numero = ultimo_numero + 1
                    except (ValueError, IndexError):
                        novo_numero = 1
                else:
                    novo_numero = 1
                
                return f"{config.prefixo_ano}{ano_atual}-{novo_numero:06d}"
            else:
                # Sequencial geral
                ultimo_protocolo = Protocolo.objects.order_by('-numero').first()
                if ultimo_protocolo:
                    try:
                        ultimo_numero = int(ultimo_protocolo.numero.split('-')[-1])
                        novo_numero = ultimo_numero + 1
                    except (ValueError, IndexError):
                        novo_numero = 1
                else:
                    novo_numero = 1
                
                return f"{config.prefixo_ano}{novo_numero:08d}"
                
        except Exception as e:
            # Fallback para UUID se houver erro
            return f"PROT-{uuid.uuid4().hex[:8].upper()}"
    
    @property
    def dias_restantes(self):
        """Calcula dias restantes para o prazo"""
        if self.data_limite:
            delta = self.data_limite - timezone.now()
            return max(0, delta.days)
        return None
    
    @property
    def esta_atrasado(self):
        """Verifica se o protocolo está atrasado"""
        if self.data_limite:
            return timezone.now() > self.data_limite
        return False
    
    def tramitar_para(self, novo_responsavel, observacao=""):
        """Tramita o protocolo para outro responsável"""
        from .models import TramitacaoProtocolo
        
        TramitacaoProtocolo.objects.create(
            protocolo=self,
            responsavel_anterior=self.responsavel_atual,
            responsavel_novo=novo_responsavel,
            observacao=observacao,
            tramitado_por=self.criado_por
        )
        
        self.responsavel_atual = novo_responsavel
        self.save()


class DocumentoProtocolo(models.Model):
    """Documentos anexados ao protocolo"""
    TIPOS_CHOICES = [
        ('PETICAO', 'Petição'),
        ('DOCUMENTO', 'Documento'),
        ('COMPROVANTE', 'Comprovante'),
        ('RESPOSTA', 'Resposta'),
        ('OUTROS', 'Outros'),
    ]
    
    protocolo = models.ForeignKey(Protocolo, on_delete=models.CASCADE, related_name='documentos', verbose_name="Protocolo")
    tipo = models.CharField("Tipo", max_length=20, choices=TIPOS_CHOICES, default='DOCUMENTO')
    titulo = models.CharField("Título", max_length=200)
    descricao = models.TextField("Descrição", blank=True)
    arquivo = models.FileField("Arquivo", upload_to=documento_upload_path)
    tamanho = models.BigIntegerField("Tamanho (bytes)", default=0)
    extensao = models.CharField("Extensão", max_length=10, blank=True)
    
    # OCR e indexação
    texto_extraido = models.TextField("Texto Extraído (OCR)", blank=True)
    indexado = models.BooleanField("Indexado", default=False)
    
    # Validação
    validado = models.BooleanField("Validado", default=False)
    validado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Validado por", related_name='documentos_validados')
    data_validacao = models.DateTimeField("Data de Validação", null=True, blank=True)
    observacoes_validacao = models.TextField("Observações da Validação", blank=True)
    
    # Controle
    enviado_por = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name="Enviado por", related_name='documentos_enviados')
    data_upload = models.DateTimeField("Data de Upload", auto_now_add=True)
    
    class Meta:
        verbose_name = "Documento do Protocolo"
        verbose_name_plural = "Documentos do Protocolo"
        ordering = ['-data_upload']
    
    def __str__(self):
        return f"{self.titulo} - {self.protocolo.numero}"
    
    def save(self, *args, **kwargs):
        # Definir extensão automaticamente
        if self.arquivo and not self.extensao:
            self.extensao = os.path.splitext(self.arquivo.name)[1][1:].upper()
        
        # Definir tamanho automaticamente
        if self.arquivo and not self.tamanho:
            try:
                self.tamanho = self.arquivo.size
            except:
                pass
        
        super().save(*args, **kwargs)
    
    def validar_documento(self, usuario, observacoes=""):
        """Valida o documento"""
        self.validado = True
        self.validado_por = usuario
        self.data_validacao = timezone.now()
        self.observacoes_validacao = observacoes
        self.save()


class TramitacaoProtocolo(models.Model):
    """Histórico de tramitação do protocolo"""
    protocolo = models.ForeignKey(Protocolo, on_delete=models.CASCADE, related_name='tramitacoes', verbose_name="Protocolo")
    
    # Responsáveis
    responsavel_anterior = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tramitacoes_anterior', verbose_name="Responsável Anterior")
    responsavel_novo = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tramitacoes_novo', verbose_name="Responsável Novo")
    
    # Dados da tramitação
    observacao = models.TextField("Observação", blank=True)
    tramitado_por = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name="Tramitado por")
    data_tramitacao = models.DateTimeField("Data da Tramitação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Tramitação de Protocolo"
        verbose_name_plural = "Tramitações de Protocolo"
        ordering = ['-data_tramitacao']
    
    def __str__(self):
        return f"{self.protocolo.numero} - {self.responsavel_anterior} → {self.responsavel_novo}"


class AlertaProtocolo(models.Model):
    """Alertas e notificações do protocolo"""
    TIPOS_CHOICES = [
        ('PRAZO', 'Prazo'),
        ('TRAMITACAO', 'Tramitação'),
        ('DOCUMENTO', 'Documento'),
        ('SISTEMA', 'Sistema'),
    ]
    
    protocolo = models.ForeignKey(Protocolo, on_delete=models.CASCADE, related_name='alertas', verbose_name="Protocolo")
    tipo = models.CharField("Tipo", max_length=20, choices=TIPOS_CHOICES)
    titulo = models.CharField("Título", max_length=200)
    mensagem = models.TextField("Mensagem")
    
    # Controle
    lido = models.BooleanField("Lido", default=False)
    lido_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Lido por")
    data_leitura = models.DateTimeField("Data de Leitura", null=True, blank=True)
    
    # Criação
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    
    class Meta:
        verbose_name = "Alerta de Protocolo"
        verbose_name_plural = "Alertas de Protocolo"
        ordering = ['-criado_em']
    
    def __str__(self):
        return f"{self.protocolo.numero} - {self.titulo}"
    
    def marcar_como_lido(self, usuario):
        """Marca o alerta como lido"""
        self.lido = True
        self.lido_por = usuario
        self.data_leitura = timezone.now()
        self.save()

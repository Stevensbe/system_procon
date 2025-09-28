from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class PerfilCidadao(models.Model):
    """Informações adicionais dos cidadãos cadastrados no portal"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil_cidadao')
    nome_completo = models.CharField("Nome completo", max_length=150)
    cpf = models.CharField("CPF", max_length=14, unique=True)
    telefone = models.CharField("Telefone", max_length=20, blank=True)
    cidade = models.CharField("Cidade", max_length=100, blank=True)
    estado = models.CharField("Estado", max_length=2, blank=True)
    endereco = models.CharField("Endereço", max_length=255, blank=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Perfil do Cidadão"
        verbose_name_plural = "Perfis dos Cidadãos"
        ordering = ['nome_completo']

    def __str__(self):
        return f"{self.nome_completo} ({self.cpf})"


class CategoriaConteudo(models.Model):
    """Categorias de conteúdo do portal"""
    
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    icone = models.CharField("Ícone", max_length=50, blank=True, help_text="Classe CSS do ícone")
    cor = models.CharField("Cor", max_length=7, default="#007bff", help_text="Código hexadecimal da cor")
    ordem = models.IntegerField("Ordem", default=0)
    ativo = models.BooleanField("Ativo", default=True)
    
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Categoria de Conteúdo"
        verbose_name_plural = "Categorias de Conteúdo"
        ordering = ['ordem', 'nome']
    
    def __str__(self):
        return self.nome


class ConteudoPortal(models.Model):
    """Conteúdo informativo do portal"""
    
    TIPO_CONTEUDO_CHOICES = [
        ('ARTIGO', 'Artigo'),
        ('FAQ', 'Pergunta Frequente'),
        ('TUTORIAL', 'Tutorial'),
        ('NOTICIA', 'Notícia'),
        ('LEGISLACAO', 'Legislação'),
        ('FORMULARIO', 'Formulário'),
        ('ORIENTACAO', 'Orientação'),
        ('ALERTA', 'Alerta'),
    ]
    
    categoria = models.ForeignKey(CategoriaConteudo, on_delete=models.CASCADE, related_name='conteudos')
    tipo = models.CharField("Tipo", max_length=15, choices=TIPO_CONTEUDO_CHOICES)
    
    titulo = models.CharField("Título", max_length=200)
    subtitulo = models.CharField("Subtítulo", max_length=300, blank=True)
    resumo = models.TextField("Resumo", help_text="Texto breve para exibição em listas")
    conteudo = models.TextField("Conteúdo")
    
    # SEO e metadata
    slug = models.SlugField("Slug", unique=True)
    palavras_chave = models.CharField("Palavras-chave", max_length=200, blank=True)
    meta_description = models.CharField("Meta Description", max_length=160, blank=True)
    
    # Mídia
    imagem_destaque = models.ImageField("Imagem de Destaque", upload_to='portal/conteudo/%Y/%m/', blank=True)
    arquivo_anexo = models.FileField("Arquivo Anexo", upload_to='portal/anexos/%Y/%m/', blank=True)
    
    # Configurações
    destaque = models.BooleanField("Destaque na Home", default=False)
    fixo = models.BooleanField("Conteúdo Fixo", default=False)
    ativo = models.BooleanField("Ativo", default=True)
    ordem = models.IntegerField("Ordem", default=0)
    
    # Datas
    data_publicacao = models.DateTimeField("Data de Publicação", default=timezone.now)
    data_validade = models.DateTimeField("Data de Validade", null=True, blank=True)
    
    # Autor
    autor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    autor_nome = models.CharField("Nome do Autor", max_length=100, blank=True)
    
    # Métricas
    visualizacoes = models.IntegerField("Visualizações", default=0)
    downloads = models.IntegerField("Downloads", default=0)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Conteúdo do Portal"
        verbose_name_plural = "Conteúdos do Portal"
        ordering = ['-destaque', '-fixo', 'ordem', '-data_publicacao']
        indexes = [
            models.Index(fields=['categoria', 'tipo']),
            models.Index(fields=['slug']),
            models.Index(fields=['destaque']),
            models.Index(fields=['ativo']),
            models.Index(fields=['data_publicacao']),
        ]
    
    def __str__(self):
        return self.titulo
    
    @property
    def esta_valido(self):
        """Verifica se o conteúdo ainda está válido"""
        if not self.data_validade:
            return True
        return timezone.now() <= self.data_validade
    
    def incrementar_visualizacao(self):
        """Incrementa o contador de visualizações"""
        self.visualizacoes += 1
        self.save(update_fields=['visualizacoes'])
    
    def incrementar_download(self):
        """Incrementa o contador de downloads"""
        self.downloads += 1
        self.save(update_fields=['downloads'])


class FormularioPublico(models.Model):
    """Formulários disponíveis para download pelo público"""
    
    CATEGORIA_CHOICES = [
        ('DENUNCIA', 'Denúncia'),
        ('RECLAMACAO', 'Reclamação'),
        ('SOLICITACAO', 'Solicitação'),
        ('ORIENTACAO', 'Orientação'),
        ('CADASTRO', 'Cadastro'),
        ('OUTROS', 'Outros'),
    ]
    
    nome = models.CharField("Nome", max_length=200)
    descricao = models.TextField("Descrição")
    categoria = models.CharField("Categoria", max_length=15, choices=CATEGORIA_CHOICES)
    
    arquivo = models.FileField("Arquivo", upload_to='portal/formularios/%Y/')
    versao = models.CharField("Versão", max_length=10, default="1.0")
    tamanho_bytes = models.BigIntegerField("Tamanho (bytes)", default=0)
    
    # Configurações
    destaque = models.BooleanField("Destaque", default=False)
    ativo = models.BooleanField("Ativo", default=True)
    ordem = models.IntegerField("Ordem", default=0)
    
    # Instrucoes
    instrucoes = models.TextField("Instruções de Preenchimento", blank=True)
    
    # Métricas
    downloads = models.IntegerField("Downloads", default=0)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Formulário Público"
        verbose_name_plural = "Formulários Públicos"
        ordering = ['-destaque', 'ordem', 'nome']
    
    def __str__(self):
        return f"{self.nome} (v{self.versao})"
    
    def incrementar_download(self):
        """Incrementa o contador de downloads"""
        self.downloads += 1
        self.save(update_fields=['downloads'])
    
    @property
    def tamanho_formatado(self):
        """Retorna tamanho formatado"""
        if self.tamanho_bytes < 1024:
            return f"{self.tamanho_bytes} B"
        elif self.tamanho_bytes < 1024**2:
            return f"{self.tamanho_bytes/1024:.1f} KB"
        elif self.tamanho_bytes < 1024**3:
            return f"{self.tamanho_bytes/(1024**2):.1f} MB"
        else:
            return f"{self.tamanho_bytes/(1024**3):.1f} GB"


class BannerPortal(models.Model):
    """Banners rotativos do portal"""
    
    titulo = models.CharField("Título", max_length=100)
    subtitulo = models.CharField("Subtítulo", max_length=200, blank=True)
    texto = models.TextField("Texto", blank=True)
    
    imagem = models.ImageField("Imagem", upload_to='portal/banners/%Y/')
    link = models.URLField("Link", blank=True)
    link_texto = models.CharField("Texto do Link", max_length=50, blank=True)
    
    # Configurações
    ativo = models.BooleanField("Ativo", default=True)
    ordem = models.IntegerField("Ordem", default=0)
    
    # Período de exibição
    data_inicio = models.DateTimeField("Data de Início", default=timezone.now)
    data_fim = models.DateTimeField("Data de Fim", null=True, blank=True)
    
    # Métricas
    visualizacoes = models.IntegerField("Visualizações", default=0)
    cliques = models.IntegerField("Cliques", default=0)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Banner do Portal"
        verbose_name_plural = "Banners do Portal"
        ordering = ['ordem', '-data_inicio']
    
    def __str__(self):
        return self.titulo
    
    @property
    def esta_ativo(self):
        """Verifica se o banner está no período ativo"""
        agora = timezone.now()
        if agora < self.data_inicio:
            return False
        if self.data_fim and agora > self.data_fim:
            return False
        return self.ativo
    
    def incrementar_visualizacao(self):
        """Incrementa o contador de visualizações"""
        self.visualizacoes += 1
        self.save(update_fields=['visualizacoes'])
    
    def incrementar_clique(self):
        """Incrementa o contador de cliques"""
        self.cliques += 1
        self.save(update_fields=['cliques'])


class ConsultaPublica(models.Model):
    """Sistema para consulta de petições e processos pelo público"""
    
    TIPO_CONSULTA_CHOICES = [
        ('PROTOCOLO', 'Protocolo'),
        ('PETICAO', 'Petição'),
        ('PROCESSO', 'Processo'),
        ('MULTA', 'Multa'),
        ('RECURSO', 'Recurso'),
    ]
    
    # Dados da consulta
    tipo_consulta = models.CharField("Tipo", max_length=15, choices=TIPO_CONSULTA_CHOICES)
    numero_protocolo = models.CharField("Número do Protocolo", max_length=50)
    documento_consulta = models.CharField("CPF/CNPJ", max_length=20)
    
    # Dados encontrados (JSON com informações do processo/petição)
    dados_encontrados = models.JSONField("Dados Encontrados", default=dict)
    
    # Controle de acesso
    ip_origem = models.GenericIPAddressField("IP de Origem")
    user_agent = models.TextField("User Agent", blank=True)
    
    # Métricas
    data_consulta = models.DateTimeField("Data da Consulta", auto_now_add=True)
    
    class Meta:
        verbose_name = "Consulta Pública"
        verbose_name_plural = "Consultas Públicas"
        ordering = ['-data_consulta']
        indexes = [
            models.Index(fields=['numero_protocolo']),
            models.Index(fields=['documento_consulta']),
            models.Index(fields=['data_consulta']),
        ]
    
    def __str__(self):
        return f"Consulta {self.numero_protocolo} - {self.get_tipo_consulta_display()}"


class AvaliacaoServico(models.Model):
    """Sistema de avaliação dos serviços do PROCON"""
    
    TIPO_SERVICO_CHOICES = [
        ('ATENDIMENTO', 'Atendimento'),
        ('PORTAL', 'Portal Online'),
        ('PROCESSO', 'Tramitação de Processo'),
        ('ORIENTACAO', 'Orientação Recebida'),
        ('RESOLUCAO', 'Resolução do Problema'),
        ('GERAL', 'Avaliação Geral'),
    ]
    
    tipo_servico = models.CharField("Tipo de Serviço", max_length=15, choices=TIPO_SERVICO_CHOICES)
    
    # Avaliação (1 a 5 estrelas)
    nota = models.IntegerField("Nota", validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    # Comentários
    comentario = models.TextField("Comentário", blank=True)
    sugestao = models.TextField("Sugestão de Melhoria", blank=True)
    
    # Dados opcionais do avaliador
    nome = models.CharField("Nome", max_length=200, blank=True)
    email = models.EmailField("E-mail", blank=True)
    
    # Contexto da avaliação
    numero_protocolo = models.CharField("Número do Protocolo", max_length=50, blank=True)
    
    # Controle
    ip_origem = models.GenericIPAddressField("IP de Origem")
    data_avaliacao = models.DateTimeField("Data da Avaliação", auto_now_add=True)
    
    class Meta:
        verbose_name = "Avaliação de Serviço"
        verbose_name_plural = "Avaliações de Serviços"
        ordering = ['-data_avaliacao']
        indexes = [
            models.Index(fields=['tipo_servico']),
            models.Index(fields=['nota']),
            models.Index(fields=['data_avaliacao']),
        ]
    
    def __str__(self):
        return f"Avaliação {self.get_tipo_servico_display()} - {self.nota} estrelas"


class ConfiguracaoPortal(models.Model):
    """Configurações gerais do portal do cidadão"""
    
    # Informações da instituição
    nome_instituicao = models.CharField("Nome da Instituição", max_length=200, default="PROCON")
    endereco = models.TextField("Endereço")
    telefone = models.CharField("Telefone", max_length=20)
    email = models.EmailField("E-mail")
    site = models.URLField("Site", blank=True)
    
    # Horário de funcionamento
    horario_funcionamento = models.TextField("Horário de Funcionamento")
    
    # Redes sociais
    facebook = models.URLField("Facebook", blank=True)
    instagram = models.URLField("Instagram", blank=True)
    twitter = models.URLField("Twitter", blank=True)
    youtube = models.URLField("YouTube", blank=True)
    
    # Configurações do portal
    manutencao = models.BooleanField("Portal em Manutenção", default=False)
    mensagem_manutencao = models.TextField("Mensagem de Manutenção", blank=True)
    
    # Texto sobre
    sobre_instituicao = models.TextField("Sobre a Instituição")
    missao = models.TextField("Missão", blank=True)
    visao = models.TextField("Visão", blank=True)
    valores = models.TextField("Valores", blank=True)
    
    # Configurações de consulta
    permitir_consulta_publica = models.BooleanField("Permitir Consulta Pública", default=True)
    exigir_captcha = models.BooleanField("Exigir CAPTCHA", default=True)
    
    # Configurações de avaliação
    permitir_avaliacao = models.BooleanField("Permitir Avaliação de Serviços", default=True)
    
    # Analytics
    google_analytics_id = models.CharField("Google Analytics ID", max_length=20, blank=True)
    
    class Meta:
        verbose_name = "Configuração do Portal"
        verbose_name_plural = "Configurações do Portal"
    
    def __str__(self):
        return f"Configurações do {self.nome_instituicao}"
    
    def save(self, *args, **kwargs):
        # Garantir que existe apenas uma configuração
        if not self.pk and ConfiguracaoPortal.objects.exists():
            raise ValueError("Já existe uma configuração do portal")
        return super().save(*args, **kwargs)


class EstatisticaPortal(models.Model):
    """Estatísticas de uso do portal"""
    
    data = models.DateField("Data")
    
    # Acessos
    visitas_unicas = models.IntegerField("Visitas Únicas", default=0)
    pageviews = models.IntegerField("Visualizações de Página", default=0)
    
    # Ações
    consultas_realizadas = models.IntegerField("Consultas Realizadas", default=0)
    formularios_baixados = models.IntegerField("Formulários Baixados", default=0)
    avaliacoes_recebidas = models.IntegerField("Avaliações Recebidas", default=0)
    
    # Tempo médio
    tempo_medio_sessao = models.IntegerField("Tempo Médio de Sessão (segundos)", default=0)
    
    class Meta:
        verbose_name = "Estatística do Portal"
        verbose_name_plural = "Estatísticas do Portal"
        ordering = ['-data']
        unique_together = ['data']
    
    def __str__(self):
        return f"Estatísticas {self.data.strftime('%d/%m/%Y')}"


class DenunciaCidadao(models.Model):
    """Modelo para armazenar denúncias recebidas via Portal do Cidadão"""
    
    # Número único da denúncia
    numero_denuncia = models.CharField("Número da Denúncia", max_length=20, unique=True, blank=True)
    
    # Dados da empresa denunciada
    empresa_denunciada = models.CharField("Empresa Denunciada", max_length=255)
    cnpj_empresa = models.CharField("CNPJ da Empresa", max_length=18, blank=True)
    endereco_empresa = models.CharField("Endereço da Empresa", max_length=500, blank=True)
    telefone_empresa = models.CharField("Telefone da Empresa", max_length=20, blank=True)
    email_empresa = models.EmailField("E-mail da Empresa", blank=True)
    
    # Dados da infração
    descricao_fatos = models.TextField("Descrição dos Fatos")
    data_ocorrencia = models.DateField("Data da Ocorrência", null=True, blank=True)
    tipo_infracao = models.CharField("Tipo de Infração", max_length=100, default='outros')
    
    # Dados do denunciante
    nome_denunciante = models.CharField("Nome do Denunciante", max_length=255, blank=True)
    cpf_cnpj = models.CharField("CPF/CNPJ do Denunciante", max_length=20, blank=True)
    email = models.EmailField("E-mail do Denunciante", blank=True)
    telefone = models.CharField("Telefone do Denunciante", max_length=20, blank=True)
    
    # Controle de anonimato
    denuncia_anonima = models.BooleanField("Denúncia Anônima", default=False)
    motivo_anonimato = models.TextField("Motivo do Anonimato", blank=True)
    
    # Status e origem
    STATUS_CHOICES = [
        ('denuncia_recebida', 'Denúncia Recebida'),
        ('em_analise', 'Em Análise'),
        ('encaminhada_fiscal', 'Encaminhada para Fiscal'),
        ('auto_criado', 'Auto de Infração Criado'),
        ('arquivada', 'Arquivada'),
    ]
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='denuncia_recebida')
    origem_denuncia = models.CharField("Origem da Denúncia", max_length=20, default='PORTAL_CIDADAO')
    
    # Metadados
    ip_origem = models.GenericIPAddressField("IP de Origem", null=True, blank=True)
    user_agent = models.TextField("User Agent", blank=True)
    
    # Relacionamento com Auto de Infração (se criado)
    auto_infracao = models.ForeignKey(
        'fiscalizacao.AutoInfracao', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='denuncias_cidadao'
    )
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Denúncia do Cidadão"
        verbose_name_plural = "Denúncias do Cidadão"
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['numero_denuncia']),
            models.Index(fields=['status']),
            models.Index(fields=['origem_denuncia']),
            models.Index(fields=['criado_em']),
        ]
    
    def __str__(self):
        return f"Denúncia {self.numero_denuncia} - {self.empresa_denunciada}"
    
    def save(self, *args, **kwargs):
        """Gera número automático da denúncia"""
        if not self.numero_denuncia:
            from datetime import datetime
            agora = datetime.now()
            ano = agora.year
            
            # Busca última denúncia do ano
            ultima = DenunciaCidadao.objects.filter(
                numero_denuncia__endswith=f'/{ano}'
            ).order_by('-id').first()
            
            seq = 1
            if ultima:
                try:
                    seq = int(ultima.numero_denuncia.split('/')[0].split('-')[1]) + 1
                except (ValueError, IndexError):
                    seq = 1
            
            self.numero_denuncia = f"DEN-{seq:06d}/{ano}"
        
        super().save(*args, **kwargs)

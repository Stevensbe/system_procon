from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
from django.urls import reverse


class PorteEmpresa(models.Model):
    nome = models.CharField("Nome do Porte", max_length=50, unique=True)
    descricao = models.TextField("Descrição", blank=True)
    faturamento_min = models.DecimalField("Faturamento Mínimo", max_digits=15, decimal_places=2, null=True, blank=True)
    faturamento_max = models.DecimalField("Faturamento Máximo", max_digits=15, decimal_places=2, null=True, blank=True)
    
    class Meta:
        verbose_name = "Porte de Empresa"
        verbose_name_plural = "Portes de Empresa"
        ordering = ['faturamento_min']
    
    def __str__(self):
        return self.nome


class SegmentoEconomico(models.Model):
    nome = models.CharField("Nome do Segmento", max_length=100, unique=True)
    codigo = models.CharField("Código", max_length=20, blank=True)
    descricao = models.TextField("Descrição", blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Segmento Econômico"
        verbose_name_plural = "Segmentos Econômicos"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class Empresa(models.Model):
    SITUACAO_CHOICES = [
        ('ativa', 'Ativa'),
        ('inativa', 'Inativa'),
        ('suspensa', 'Suspensa'),
        ('baixada', 'Baixada'),
    ]
    
    TIPO_CHOICES = [
        ('matriz', 'Matriz'),
        ('filial', 'Filial'),
    ]
    
    CLASSIFICACAO_RISCO_CHOICES = [
        ('baixo', 'Baixo Risco'),
        ('medio', 'Médio Risco'),
        ('alto', 'Alto Risco'),
        ('critico', 'Crítico'),
    ]
    
    # Dados básicos
    razao_social = models.CharField("Razão Social", max_length=255)
    nome_fantasia = models.CharField("Nome Fantasia", max_length=255, blank=True)
    cnpj = models.CharField(
        "CNPJ", 
        max_length=18, 
        unique=True,
        validators=[RegexValidator(r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$', 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX')]
    )
    inscricao_estadual = models.CharField("Inscrição Estadual", max_length=20, blank=True)
    inscricao_municipal = models.CharField("Inscrição Municipal", max_length=20, blank=True)
    
    # Tipo e situação
    tipo = models.CharField("Tipo", max_length=10, choices=TIPO_CHOICES, default='matriz')
    situacao = models.CharField("Situação", max_length=10, choices=SITUACAO_CHOICES, default='ativa')
    
    # Classificação
    porte = models.ForeignKey(PorteEmpresa, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Porte")
    segmento = models.ForeignKey(SegmentoEconomico, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Segmento")
    classificacao_risco = models.CharField("Classificação de Risco", max_length=10, choices=CLASSIFICACAO_RISCO_CHOICES, default='baixo')
    
    # Endereço
    endereco = models.CharField("Endereço", max_length=255)
    numero = models.CharField("Número", max_length=20)
    complemento = models.CharField("Complemento", max_length=100, blank=True)
    bairro = models.CharField("Bairro", max_length=100)
    cep = models.CharField("CEP", max_length=10)
    cidade = models.CharField("Cidade", max_length=100)
    estado = models.CharField("Estado", max_length=2, default='AM')
    
    # Contatos
    telefone = models.CharField("Telefone", max_length=20, blank=True)
    celular = models.CharField("Celular", max_length=20, blank=True)
    email = models.EmailField("E-mail", blank=True)
    site = models.URLField("Site", blank=True)
    
    # Datas importantes
    data_abertura = models.DateField("Data de Abertura", null=True, blank=True)
    data_cadastro = models.DateTimeField("Data de Cadastro", auto_now_add=True)
    data_atualizacao = models.DateTimeField("Última Atualização", auto_now=True)
    
    # Observações e notas
    observacoes = models.TextField("Observações", blank=True)
    
    # Controle
    ativo = models.BooleanField("Ativo", default=True)
    
    # Relacionamento com empresa matriz (para filiais)
    matriz = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, verbose_name="Empresa Matriz", related_name='filiais')
    
    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ['razao_social']
        indexes = [
            models.Index(fields=['cnpj']),
            models.Index(fields=['razao_social']),
            models.Index(fields=['classificacao_risco']),
            models.Index(fields=['situacao']),
        ]
    
    def __str__(self):
        return f"{self.razao_social} ({self.cnpj})"
    
    def get_absolute_url(self):
        return reverse('empresas:detail', kwargs={'pk': self.pk})
    
    @property
    def nome_completo(self):
        if self.nome_fantasia:
            return f"{self.razao_social} ({self.nome_fantasia})"
        return self.razao_social
    
    @property
    def endereco_completo(self):
        endereco = f"{self.endereco}, {self.numero}"
        if self.complemento:
            endereco += f", {self.complemento}"
        endereco += f" - {self.bairro}, {self.cidade}/{self.estado} - CEP: {self.cep}"
        return endereco
    
    @property
    def total_infracoes(self):
        """Retorna o total de infrações da empresa"""
        # Importação dinâmica para evitar import circular
        from fiscalizacao.models import AutoInfracao
        return AutoInfracao.objects.filter(cnpj=self.cnpj).count()
    
    @property
    def total_multas(self):
        """Retorna o total de multas da empresa"""
        # Importação dinâmica para evitar import circular
        from multas.models import Multa
        return Multa.objects.filter(empresa=self).count()
    
    @property
    def valor_total_multas(self):
        """Retorna o valor total das multas da empresa"""
        from multas.models import Multa
        from django.db.models import Sum
        result = Multa.objects.filter(empresa=self).aggregate(total=Sum('valor'))
        return result['total'] or 0
    
    @property
    def multas_pendentes(self):
        """Retorna o número de multas pendentes"""
        from multas.models import Multa
        return Multa.objects.filter(empresa=self, status='pendente').count()
    
    def atualizar_classificacao_risco(self):
        """Atualiza a classificação de risco baseada no histórico de infrações"""
        total_infracoes = self.total_infracoes
        multas_pendentes = self.multas_pendentes
        
        if total_infracoes >= 10 or multas_pendentes >= 3:
            self.classificacao_risco = 'critico'
        elif total_infracoes >= 5 or multas_pendentes >= 2:
            self.classificacao_risco = 'alto'
        elif total_infracoes >= 2 or multas_pendentes >= 1:
            self.classificacao_risco = 'medio'
        else:
            self.classificacao_risco = 'baixo'
        
        self.save(update_fields=['classificacao_risco'])


class ResponsavelLegal(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='responsaveis', verbose_name="Empresa")
    nome = models.CharField("Nome Completo", max_length=255)
    cpf = models.CharField("CPF", max_length=14, validators=[RegexValidator(r'^\d{3}\.\d{3}\.\d{3}-\d{2}$', 'CPF deve estar no formato XXX.XXX.XXX-XX')])
    rg = models.CharField("RG", max_length=20, blank=True)
    cargo = models.CharField("Cargo", max_length=100)
    telefone = models.CharField("Telefone", max_length=20, blank=True)
    email = models.EmailField("E-mail", blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    data_inicio = models.DateField("Data de Início", default=timezone.now)
    data_fim = models.DateField("Data de Fim", null=True, blank=True)
    
    class Meta:
        verbose_name = "Responsável Legal"
        verbose_name_plural = "Responsáveis Legais"
        ordering = ['-ativo', 'nome']
    
    def __str__(self):
        return f"{self.nome} - {self.cargo} ({self.empresa.razao_social})"


class HistoricoEmpresa(models.Model):
    TIPO_EVENTO_CHOICES = [
        ('cadastro', 'Cadastro'),
        ('atualizacao', 'Atualização de Dados'),
        ('infracao', 'Infração'),
        ('multa', 'Aplicação de Multa'),
        ('pagamento', 'Pagamento de Multa'),
        ('recurso', 'Interposição de Recurso'),
        ('suspensao', 'Suspensão'),
        ('reativacao', 'Reativação'),
        ('observacao', 'Observação Geral'),
    ]
    
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='historico', verbose_name="Empresa")
    tipo_evento = models.CharField("Tipo de Evento", max_length=20, choices=TIPO_EVENTO_CHOICES)
    descricao = models.TextField("Descrição")
    data_evento = models.DateTimeField("Data do Evento", auto_now_add=True)
    usuario = models.CharField("Usuário", max_length=100, blank=True)  # Idealmente seria ForeignKey para User
    
    class Meta:
        verbose_name = "Histórico da Empresa"
        verbose_name_plural = "Histórico das Empresas"
        ordering = ['-data_evento']
    
    def __str__(self):
        return f"{self.empresa.razao_social} - {self.get_tipo_evento_display()} - {self.data_evento.strftime('%d/%m/%Y %H:%M')}"


class EnderecoFilial(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='enderecos_adicionais', verbose_name="Empresa")
    nome = models.CharField("Nome/Identificação", max_length=100)
    endereco = models.CharField("Endereço", max_length=255)
    numero = models.CharField("Número", max_length=20)
    complemento = models.CharField("Complemento", max_length=100, blank=True)
    bairro = models.CharField("Bairro", max_length=100)
    cep = models.CharField("CEP", max_length=10)
    cidade = models.CharField("Cidade", max_length=100)
    estado = models.CharField("Estado", max_length=2, default='AM')
    telefone = models.CharField("Telefone", max_length=20, blank=True)
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Endereço Adicional"
        verbose_name_plural = "Endereços Adicionais"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} - {self.empresa.razao_social}"
    
    @property
    def endereco_completo(self):
        endereco = f"{self.endereco}, {self.numero}"
        if self.complemento:
            endereco += f", {self.complemento}"
        endereco += f" - {self.bairro}, {self.cidade}/{self.estado} - CEP: {self.cep}"
        return endereco
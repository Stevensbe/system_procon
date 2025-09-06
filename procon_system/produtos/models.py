from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class CategoriaProduto(models.Model):
    nome = models.CharField("Nome", max_length=100, unique=True)
    codigo = models.CharField("Código", max_length=20, unique=True)
    descricao = models.TextField("Descrição", blank=True)
    categoria_pai = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, verbose_name="Categoria Pai")
    ativo = models.BooleanField("Ativo", default=True)
    ordem = models.IntegerField("Ordem", default=0)
    
    # Específico para fiscalização
    requer_inspecao = models.BooleanField("Requer Inspeção", default=False)
    permite_inutilizacao = models.BooleanField("Permite Inutilização", default=False)
    prazo_validade_obrigatorio = models.BooleanField("Prazo de Validade Obrigatório", default=False)
    
    class Meta:
        verbose_name = "Categoria de Produto"
        verbose_name_plural = "Categorias de Produto"
        ordering = ['ordem', 'nome']
    
    def __str__(self):
        if self.categoria_pai:
            return f"{self.categoria_pai.nome} > {self.nome}"
        return self.nome
    
    @property
    def nivel(self):
        """Retorna o nível hierárquico da categoria"""
        if not self.categoria_pai:
            return 0
        return self.categoria_pai.nivel + 1


class Fabricante(models.Model):
    nome = models.CharField("Nome/Razão Social", max_length=255)
    cnpj = models.CharField("CNPJ", max_length=18, unique=True, blank=True)
    endereco = models.TextField("Endereço", blank=True)
    telefone = models.CharField("Telefone", max_length=20, blank=True)
    email = models.EmailField("Email", blank=True)
    site = models.URLField("Site", blank=True)
    pais_origem = models.CharField("País de Origem", max_length=100, default="Brasil")
    ativo = models.BooleanField("Ativo", default=True)
    
    class Meta:
        verbose_name = "Fabricante"
        verbose_name_plural = "Fabricantes"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class Produto(models.Model):
    UNIDADE_CHOICES = [
        ('un', 'Unidade'),
        ('kg', 'Quilograma'),
        ('g', 'Grama'),
        ('l', 'Litro'),
        ('ml', 'Mililitro'),
        ('m', 'Metro'),
        ('cm', 'Centímetro'),
        ('m2', 'Metro Quadrado'),
        ('m3', 'Metro Cúbico'),
        ('cx', 'Caixa'),
        ('pct', 'Pacote'),
        ('dz', 'Dúzia'),
        ('par', 'Par'),
    ]
    
    CLASSIFICACAO_RISCO_CHOICES = [
        ('baixo', 'Baixo Risco'),
        ('medio', 'Médio Risco'),
        ('alto', 'Alto Risco'),
        ('critico', 'Crítico'),
    ]
    
    # Identificação
    nome = models.CharField("Nome do Produto", max_length=255)
    codigo_interno = models.CharField("Código Interno", max_length=50, unique=True)
    codigo_barras = models.CharField("Código de Barras", max_length=20, blank=True)
    codigo_ncm = models.CharField("Código NCM", max_length=10, blank=True)
    
    # Classificação
    categoria = models.ForeignKey(CategoriaProduto, on_delete=models.CASCADE, verbose_name="Categoria")
    fabricante = models.ForeignKey(Fabricante, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Fabricante")
    
    # Características
    descricao = models.TextField("Descrição", blank=True)
    especificacoes = models.TextField("Especificações Técnicas", blank=True)
    unidade_medida = models.CharField("Unidade de Medida", max_length=10, choices=UNIDADE_CHOICES, default='un')
    peso_liquido = models.DecimalField("Peso Líquido", max_digits=10, decimal_places=3, null=True, blank=True)
    peso_bruto = models.DecimalField("Peso Bruto", max_digits=10, decimal_places=3, null=True, blank=True)
    dimensoes = models.CharField("Dimensões", max_length=100, blank=True, help_text="Ex: 10x20x30 cm")
    
    # Preços de referência
    preco_referencia = models.DecimalField("Preço de Referência", max_digits=10, decimal_places=2, null=True, blank=True)
    preco_minimo = models.DecimalField("Preço Mínimo", max_digits=10, decimal_places=2, null=True, blank=True)
    preco_maximo = models.DecimalField("Preço Máximo", max_digits=10, decimal_places=2, null=True, blank=True)
    data_atualizacao_preco = models.DateField("Data Atualização Preço", null=True, blank=True)
    
    # Validade e conservação
    tem_validade = models.BooleanField("Tem Validade", default=False)
    prazo_validade_dias = models.IntegerField("Prazo de Validade (dias)", null=True, blank=True)
    condicoes_armazenamento = models.TextField("Condições de Armazenamento", blank=True)
    temperatura_conservacao = models.CharField("Temperatura de Conservação", max_length=50, blank=True)
    
    # Classificação de risco para fiscalização
    classificacao_risco = models.CharField("Classificação de Risco", max_length=10, choices=CLASSIFICACAO_RISCO_CHOICES, default='baixo')
    requer_licenca = models.BooleanField("Requer Licença", default=False)
    controlado_anvisa = models.BooleanField("Controlado ANVISA", default=False)
    
    # Status
    ativo = models.BooleanField("Ativo", default=True)
    descontinuado = models.BooleanField("Descontinuado", default=False)
    data_descontinuacao = models.DateField("Data de Descontinuação", null=True, blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    criado_por = models.CharField("Criado por", max_length=100)
    
    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ['nome']
        indexes = [
            models.Index(fields=['codigo_barras']),
            models.Index(fields=['codigo_ncm']),
            models.Index(fields=['categoria']),
            models.Index(fields=['nome']),
        ]
    
    def __str__(self):
        return f"{self.nome} ({self.codigo_interno})"
    
    @property
    def nome_completo(self):
        """Nome completo com fabricante"""
        if self.fabricante:
            return f"{self.nome} - {self.fabricante.nome}"
        return self.nome
    
    @property
    def preco_medio(self):
        """Calcula preço médio baseado nos registros de preços"""
        registros = self.registros_preco.filter(ativo=True)
        if registros.exists():
            return registros.aggregate(media=models.Avg('preco'))['media']
        return self.preco_referencia


class RegistroPreco(models.Model):
    """Registro histórico de preços de produtos"""
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='registros_preco')
    estabelecimento = models.CharField("Estabelecimento", max_length=255)
    cnpj_estabelecimento = models.CharField("CNPJ", max_length=18, blank=True)
    endereco_estabelecimento = models.TextField("Endereço", blank=True)
    
    # Preço
    preco = models.DecimalField("Preço", max_digits=10, decimal_places=2)
    preco_promocional = models.DecimalField("Preço Promocional", max_digits=10, decimal_places=2, null=True, blank=True)
    unidade_venda = models.CharField("Unidade de Venda", max_length=20, default='un')
    
    # Data
    data_coleta = models.DateField("Data da Coleta")
    hora_coleta = models.TimeField("Hora da Coleta", null=True, blank=True)
    
    # Validade (se aplicável)
    data_validade = models.DateField("Data de Validade", null=True, blank=True)
    
    # Fiscalização
    coletado_por = models.CharField("Coletado por", max_length=100)
    fiscalizacao_relacionada = models.CharField("Número Fiscalização", max_length=50, blank=True)
    
    # Status
    ativo = models.BooleanField("Ativo", default=True)
    verificado = models.BooleanField("Verificado", default=False)
    observacoes = models.TextField("Observações", blank=True)
    
    class Meta:
        verbose_name = "Registro de Preço"
        verbose_name_plural = "Registros de Preços"
        ordering = ['-data_coleta']
        indexes = [
            models.Index(fields=['produto', 'data_coleta']),
            models.Index(fields=['cnpj_estabelecimento']),
        ]
    
    def __str__(self):
        return f"{self.produto.nome} - R$ {self.preco} - {self.estabelecimento} ({self.data_coleta})"


class ProdutoInutilizado(models.Model):
    """Registro de produtos inutilizados durante fiscalização"""
    MOTIVO_CHOICES = [
        ('vencido', 'Produto Vencido'),
        ('deteriorado', 'Produto Deteriorado'),
        ('sem_rotulo', 'Sem Rótulo/Identificação'),
        ('rotulo_irregular', 'Rótulo Irregular'),
        ('sem_registro', 'Sem Registro Sanitário'),
        ('falsificado', 'Produto Falsificado'),
        ('adulterado', 'Produto Adulterado'),
        ('condicoes_inadequadas', 'Condições Inadequadas de Armazenamento'),
        ('outros', 'Outros'),
    ]
    
    DESTINO_CHOICES = [
        ('incineracao', 'Incineração'),
        ('aterro', 'Aterro Sanitário'),
        ('reciclagem', 'Reciclagem'),
        ('devolucao_fabricante', 'Devolução ao Fabricante'),
        ('doacao', 'Doação (se adequado)'),
        ('outros', 'Outros'),
    ]
    
    # Identificação
    numero_auto = models.CharField("Número do Auto", max_length=50)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, verbose_name="Produto")
    
    # Estabelecimento
    estabelecimento_nome = models.CharField("Nome do Estabelecimento", max_length=255)
    estabelecimento_cnpj = models.CharField("CNPJ", max_length=18)
    estabelecimento_endereco = models.TextField("Endereço")
    
    # Detalhes da inutilização
    motivo = models.CharField("Motivo da Inutilização", max_length=30, choices=MOTIVO_CHOICES)
    descricao_motivo = models.TextField("Descrição Detalhada do Motivo")
    quantidade_inutilizada = models.DecimalField("Quantidade Inutilizada", max_digits=10, decimal_places=3)
    unidade = models.CharField("Unidade", max_length=20)
    valor_estimado = models.DecimalField("Valor Estimado", max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Dados do produto inutilizado
    lote = models.CharField("Lote", max_length=50, blank=True)
    data_validade = models.DateField("Data de Validade", null=True, blank=True)
    data_fabricacao = models.DateField("Data de Fabricação", null=True, blank=True)
    codigo_barras_produto = models.CharField("Código de Barras", max_length=20, blank=True)
    
    # Processo de inutilização
    data_inutilizacao = models.DateField("Data da Inutilização")
    hora_inutilizacao = models.TimeField("Hora da Inutilização")
    forma_inutilizacao = models.TextField("Forma de Inutilização", help_text="Como foi inutilizado")
    destino_produto = models.CharField("Destino do Produto", max_length=30, choices=DESTINO_CHOICES)
    destino_observacoes = models.TextField("Observações sobre Destino", blank=True)
    
    # Responsáveis
    fiscal_responsavel = models.CharField("Fiscal Responsável", max_length=255)
    responsavel_estabelecimento = models.CharField("Responsável do Estabelecimento", max_length=255)
    testemunhas = models.TextField("Testemunhas", blank=True, help_text="Uma por linha")
    
    # Documentação
    auto_inutilizacao_gerado = models.BooleanField("Auto de Inutilização Gerado", default=False)
    fotos_anexadas = models.BooleanField("Fotos Anexadas", default=False)
    termo_assinado = models.BooleanField("Termo Assinado", default=False)
    
    # Acompanhamento
    destino_confirmado = models.BooleanField("Destino Confirmado", default=False)
    data_confirmacao_destino = models.DateField("Data Confirmação Destino", null=True, blank=True)
    comprovante_destino = models.FileField("Comprovante de Destino", upload_to='comprovantes_destino/', null=True, blank=True)
    
    # Observações
    observacoes_gerais = models.TextField("Observações Gerais", blank=True)
    
    # Controle
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    criado_por = models.CharField("Criado por", max_length=100)
    
    class Meta:
        verbose_name = "Produto Inutilizado"
        verbose_name_plural = "Produtos Inutilizados"
        ordering = ['-data_inutilizacao']
        indexes = [
            models.Index(fields=['numero_auto']),
            models.Index(fields=['estabelecimento_cnpj']),
            models.Index(fields=['data_inutilizacao']),
        ]
    
    def __str__(self):
        return f"{self.produto.nome} - {self.estabelecimento_nome} - {self.data_inutilizacao}"
    
    @property
    def valor_total_inutilizado(self):
        """Calcula valor total baseado na quantidade e valor estimado"""
        if self.valor_estimado:
            return self.quantidade_inutilizada * self.valor_estimado
        return 0
    
    def gerar_auto_inutilizacao(self):
        """Gera documento do auto de inutilização"""
        # Aqui seria implementada a geração do documento
        # Por enquanto apenas marca como gerado
        self.auto_inutilizacao_gerado = True
        self.save()
        return True


class FotoProdutoInutilizado(models.Model):
    """Fotos dos produtos inutilizados"""
    produto_inutilizado = models.ForeignKey(ProdutoInutilizado, on_delete=models.CASCADE, related_name='fotos')
    foto = models.ImageField("Foto", upload_to='produtos_inutilizados/%Y/%m/%d/')
    descricao = models.CharField("Descrição", max_length=255, blank=True)
    ordem = models.IntegerField("Ordem", default=0)
    
    class Meta:
        verbose_name = "Foto de Produto Inutilizado"
        verbose_name_plural = "Fotos de Produtos Inutilizados"
        ordering = ['ordem']
    
    def __str__(self):
        return f"Foto {self.ordem} - {self.produto_inutilizado}"


class ControleEstoque(models.Model):
    """Controle de estoque para produtos fiscalizados"""
    estabelecimento_cnpj = models.CharField("CNPJ do Estabelecimento", max_length=18)
    estabelecimento_nome = models.CharField("Nome do Estabelecimento", max_length=255)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, verbose_name="Produto")
    
    # Estoque
    quantidade_estoque = models.DecimalField("Quantidade em Estoque", max_digits=10, decimal_places=3)
    quantidade_minima = models.DecimalField("Quantidade Mínima", max_digits=10, decimal_places=3, null=True, blank=True)
    quantidade_maxima = models.DecimalField("Quantidade Máxima", max_digits=10, decimal_places=3, null=True, blank=True)
    
    # Localização
    setor_armazenamento = models.CharField("Setor de Armazenamento", max_length=100, blank=True)
    condicoes_armazenamento = models.TextField("Condições de Armazenamento", blank=True)
    
    # Controle de validade
    produtos_proximos_vencimento = models.IntegerField("Produtos Próximos ao Vencimento", default=0)
    produtos_vencidos = models.IntegerField("Produtos Vencidos", default=0)
    
    # Dados da verificação
    data_verificacao = models.DateField("Data da Verificação")
    verificado_por = models.CharField("Verificado por", max_length=100)
    fiscalizacao_relacionada = models.CharField("Fiscalização", max_length=50, blank=True)
    
    # Observações
    observacoes = models.TextField("Observações", blank=True)
    irregularidades = models.TextField("Irregularidades Encontradas", blank=True)
    
    class Meta:
        verbose_name = "Controle de Estoque"
        verbose_name_plural = "Controle de Estoque"
        ordering = ['-data_verificacao']
        unique_together = ['estabelecimento_cnpj', 'produto', 'data_verificacao']
    
    def __str__(self):
        return f"{self.produto.nome} - {self.estabelecimento_nome} - {self.data_verificacao}"
    
    @property
    def situacao_estoque(self):
        """Retorna situação do estoque"""
        if self.produtos_vencidos > 0:
            return 'critica'
        elif self.produtos_proximos_vencimento > 0:
            return 'atencao'
        elif self.quantidade_minima and self.quantidade_estoque < self.quantidade_minima:
            return 'baixo'
        else:
            return 'normal'
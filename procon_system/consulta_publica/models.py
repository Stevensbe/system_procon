from django.db import models
from django.utils import timezone
from django.db.models import Count, Sum, Avg


class ConsultaPublica(models.Model):
    TIPO_CONSULTA_CHOICES = [
        ('empresa', 'Empresa'),
        ('processo', 'Processo'),
        ('ranking', 'Ranking'),
        ('precos', 'Preços'),
        ('restricoes', 'Restrições'),
    ]
    
    # Identificação
    ip_consultante = models.GenericIPAddressField("IP do Consultante")
    user_agent = models.TextField("User Agent", blank=True)
    
    # Consulta
    tipo_consulta = models.CharField("Tipo de Consulta", max_length=20, choices=TIPO_CONSULTA_CHOICES)
    termo_pesquisado = models.CharField("Termo Pesquisado", max_length=255)
    filtros_aplicados = models.TextField("Filtros Aplicados", blank=True, help_text="JSON com filtros")
    
    # Resultado
    resultados_encontrados = models.IntegerField("Resultados Encontrados", default=0)
    tempo_resposta = models.DecimalField("Tempo de Resposta (ms)", max_digits=10, decimal_places=3, null=True, blank=True)
    
    # Controle
    data_consulta = models.DateTimeField("Data da Consulta", auto_now_add=True)
    sucesso = models.BooleanField("Consulta com Sucesso", default=True)
    erro = models.TextField("Erro", blank=True)
    
    class Meta:
        verbose_name = "Consulta Pública"
        verbose_name_plural = "Consultas Públicas"
        ordering = ['-data_consulta']
        indexes = [
            models.Index(fields=['data_consulta']),
            models.Index(fields=['tipo_consulta']),
            models.Index(fields=['ip_consultante']),
        ]
    
    def __str__(self):
        return f"{self.get_tipo_consulta_display()}: {self.termo_pesquisado} - {self.data_consulta.strftime('%d/%m/%Y %H:%M')}"


class EmpresaPublica(models.Model):
    """Versão pública dos dados da empresa para consultas"""
    # Dados básicos (públicos)
    razao_social = models.CharField("Razão Social", max_length=255)
    nome_fantasia = models.CharField("Nome Fantasia", max_length=255, blank=True)
    cnpj = models.CharField("CNPJ", max_length=18, unique=True)
    
    # Endereço (público)
    endereco = models.CharField("Endereço", max_length=255)
    bairro = models.CharField("Bairro", max_length=100)
    cidade = models.CharField("Cidade", max_length=100)
    estado = models.CharField("Estado", max_length=2, default='AM')
    
    # Segmento
    segmento = models.CharField("Segmento", max_length=100, blank=True)
    porte = models.CharField("Porte", max_length=50, blank=True)
    
    # Status público
    ativo = models.BooleanField("Ativo", default=True)
    situacao_publica = models.CharField("Situação", max_length=20, choices=[
        ('regular', 'Regular'),
        ('com_restricoes', 'Com Restrições'),
        ('suspenso', 'Suspenso'),
        ('inativo', 'Inativo'),
    ], default='regular')
    
    # Estatísticas públicas
    total_processos = models.IntegerField("Total de Processos", default=0)
    total_multas = models.IntegerField("Total de Multas", default=0)
    valor_total_multas = models.DecimalField("Valor Total Multas", max_digits=12, decimal_places=2, default=0)
    data_ultima_infracao = models.DateField("Data da Última Infração", null=True, blank=True)
    
    # Controle
    data_atualizacao = models.DateTimeField("Última Atualização", auto_now=True)
    exibir_detalhes = models.BooleanField("Exibir Detalhes", default=True, help_text="Se falso, só mostra dados básicos")
    
    class Meta:
        verbose_name = "Empresa Pública"
        verbose_name_plural = "Empresas Públicas"
        ordering = ['razao_social']
        indexes = [
            models.Index(fields=['cnpj']),
            models.Index(fields=['razao_social']),
            models.Index(fields=['situacao_publica']),
        ]
    
    def __str__(self):
        return f"{self.razao_social} ({self.cnpj})"
    
    @property
    def situacao_descricao(self):
        """Descrição da situação para o público"""
        situacoes = {
            'regular': 'Situação regular perante o órgão',
            'com_restricoes': 'Possui restrições ou pendências',
            'suspenso': 'Suspenso temporariamente',
            'inativo': 'Inativo ou baixado',
        }
        return situacoes.get(self.situacao_publica, 'Situação não informada')
    
    @classmethod
    def atualizar_dados_publicos(cls):
        """Atualiza dados públicos baseado nos dados internos"""
        from empresas.models import Empresa
        from fiscalizacao.models import AutoInfracao
        from multas.models import Multa
        
        empresas_internas = Empresa.objects.filter(ativo=True)
        
        for empresa in empresas_internas:
            # Calcula estatísticas
            total_processos = AutoInfracao.objects.filter(cnpj=empresa.cnpj).count()
            total_multas = Multa.objects.filter(empresa=empresa).count()
            valor_total = Multa.objects.filter(empresa=empresa).aggregate(
                total=Sum('valor')
            )['total'] or 0
            
            ultima_infracao = AutoInfracao.objects.filter(
                cnpj=empresa.cnpj
            ).order_by('-data_fiscalizacao').first()
            
            # Define situação pública
            if empresa.classificacao_risco == 'critico':
                situacao = 'com_restricoes'
            elif empresa.situacao == 'suspensa':
                situacao = 'suspenso'
            elif empresa.situacao == 'inativa':
                situacao = 'inativo'
            else:
                situacao = 'regular'
            
            # Atualiza ou cria registro público
            EmpresaPublica.objects.update_or_create(
                cnpj=empresa.cnpj,
                defaults={
                    'razao_social': empresa.razao_social,
                    'nome_fantasia': empresa.nome_fantasia,
                    'endereco': empresa.endereco,
                    'bairro': empresa.bairro,
                    'cidade': empresa.cidade,
                    'estado': empresa.estado,
                    'segmento': empresa.segmento.nome if empresa.segmento else '',
                    'porte': empresa.porte.nome if empresa.porte else '',
                    'situacao_publica': situacao,
                    'total_processos': total_processos,
                    'total_multas': total_multas,
                    'valor_total_multas': valor_total,
                    'data_ultima_infracao': ultima_infracao.data_fiscalizacao if ultima_infracao else None,
                    'exibir_detalhes': empresa.classificacao_risco != 'critico',  # Oculta detalhes se crítico
                }
            )


class ProcessoPublico(models.Model):
    """Versão pública de processos para consulta"""
    numero_processo = models.CharField("Número do Processo", max_length=50, unique=True)
    empresa_cnpj = models.CharField("CNPJ da Empresa", max_length=18)
    empresa_nome = models.CharField("Nome da Empresa", max_length=255)
    
    # Dados básicos
    tipo_auto = models.CharField("Tipo de Auto", max_length=50)
    data_auto = models.DateField("Data do Auto")
    local_infracao = models.CharField("Local da Infração", max_length=255, blank=True)
    
    # Status público
    STATUS_PUBLICO_CHOICES = [
        ('em_andamento', 'Em Andamento'),
        ('finalizado', 'Finalizado'),
        ('arquivado', 'Arquivado'),
    ]
    status_publico = models.CharField("Status", max_length=20, choices=STATUS_PUBLICO_CHOICES)
    
    # Multa (se houver)
    tem_multa = models.BooleanField("Tem Multa", default=False)
    valor_multa = models.DecimalField("Valor da Multa", max_digits=12, decimal_places=2, null=True, blank=True)
    status_multa = models.CharField("Status da Multa", max_length=20, blank=True)
    
    # Controle
    visivel_publico = models.BooleanField("Visível ao Público", default=True)
    data_atualizacao = models.DateTimeField("Última Atualização", auto_now=True)
    
    class Meta:
        verbose_name = "Processo Público"
        verbose_name_plural = "Processos Públicos"
        ordering = ['-data_auto']
        indexes = [
            models.Index(fields=['numero_processo']),
            models.Index(fields=['empresa_cnpj']),
            models.Index(fields=['status_publico']),
        ]
    
    def __str__(self):
        return f"{self.numero_processo} - {self.empresa_nome}"


class RankingPublico(models.Model):
    """Rankings públicos de empresas"""
    TIPO_RANKING_CHOICES = [
        ('mais_infracoes', 'Empresas com Mais Infrações'),
        ('maior_valor_multas', 'Maiores Valores em Multas'),
        ('reincidentes', 'Empresas Reincidentes'),
        ('por_segmento', 'Ranking por Segmento'),
    ]
    
    PERIODO_CHOICES = [
        ('mensal', 'Mensal'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
    ]
    
    # Identificação
    tipo_ranking = models.CharField("Tipo de Ranking", max_length=30, choices=TIPO_RANKING_CHOICES)
    periodo = models.CharField("Período", max_length=15, choices=PERIODO_CHOICES)
    data_referencia = models.DateField("Data de Referência")
    
    # Dados do ranking (JSON)
    dados_ranking = models.TextField("Dados do Ranking", help_text="JSON com dados do ranking")
    total_empresas = models.IntegerField("Total de Empresas", default=0)
    
    # Configuração
    ativo = models.BooleanField("Ativo", default=True)
    exibir_valores = models.BooleanField("Exibir Valores", default=True)
    limite_posicoes = models.IntegerField("Limite de Posições", default=50)
    
    # Controle
    gerado_em = models.DateTimeField("Gerado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)
    
    class Meta:
        verbose_name = "Ranking Público"
        verbose_name_plural = "Rankings Públicos"
        ordering = ['-data_referencia']
        unique_together = ['tipo_ranking', 'periodo', 'data_referencia']
    
    def __str__(self):
        return f"{self.get_tipo_ranking_display()} - {self.get_periodo_display()} - {self.data_referencia.strftime('%m/%Y')}"


class MonitoramentoPrecos(models.Model):
    """Monitoramento público de preços"""
    CATEGORIA_CHOICES = [
        ('combustivel', 'Combustível'),
        ('supermercado', 'Supermercado'),
        ('farmacia', 'Farmácia'),
        ('restaurante', 'Restaurante'),
        ('construcao', 'Material de Construção'),
        ('outros', 'Outros'),
    ]
    
    # Produto/Serviço
    categoria = models.CharField("Categoria", max_length=20, choices=CATEGORIA_CHOICES)
    produto = models.CharField("Produto/Serviço", max_length=200)
    unidade = models.CharField("Unidade", max_length=20, default='un')
    especificacao = models.TextField("Especificação", blank=True)
    
    # Preços
    preco_minimo = models.DecimalField("Preço Mínimo", max_digits=10, decimal_places=2)
    preco_maximo = models.DecimalField("Preço Máximo", max_digits=10, decimal_places=2)
    preco_medio = models.DecimalField("Preço Médio", max_digits=10, decimal_places=2)
    
    # Localização
    regiao = models.CharField("Região", max_length=100)
    total_estabelecimentos = models.IntegerField("Total de Estabelecimentos Pesquisados")
    
    # Período
    data_pesquisa = models.DateField("Data da Pesquisa")
    periodo_referencia = models.CharField("Período de Referência", max_length=20)
    
    # Variação
    variacao_percentual = models.DecimalField("Variação %", max_digits=5, decimal_places=2, null=True, blank=True)
    preco_anterior = models.DecimalField("Preço Anterior", max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Controle
    ativo = models.BooleanField("Ativo", default=True)
    publicar = models.BooleanField("Publicar", default=True)
    
    class Meta:
        verbose_name = "Monitoramento de Preços"
        verbose_name_plural = "Monitoramento de Preços"
        ordering = ['-data_pesquisa', 'categoria', 'produto']
        indexes = [
            models.Index(fields=['categoria', 'data_pesquisa']),
            models.Index(fields=['produto']),
        ]
    
    def __str__(self):
        return f"{self.produto} - {self.regiao} - {self.data_pesquisa.strftime('%m/%Y')}"
    
    @property
    def variacao_formatada(self):
        if self.variacao_percentual is not None:
            sinal = '+' if self.variacao_percentual > 0 else ''
            return f"{sinal}{self.variacao_percentual:.1f}%"
        return "N/A"


class RestricaoEmpresa(models.Model):
    """Restrições públicas de empresas"""
    TIPO_RESTRICAO_CHOICES = [
        ('multa_pendente', 'Multa Pendente'),
        ('processo_andamento', 'Processo em Andamento'),
        ('reincidencia', 'Reincidência'),
        ('suspensao', 'Suspensão Temporária'),
        ('advertencia', 'Advertência'),
    ]
    
    # Empresa
    empresa_cnpj = models.CharField("CNPJ", max_length=18)
    empresa_nome = models.CharField("Nome da Empresa", max_length=255)
    
    # Restrição
    tipo_restricao = models.CharField("Tipo de Restrição", max_length=30, choices=TIPO_RESTRICAO_CHOICES)
    descricao = models.TextField("Descrição da Restrição")
    data_restricao = models.DateField("Data da Restrição")
    data_validade = models.DateField("Válida até", null=True, blank=True)
    
    # Status
    ativa = models.BooleanField("Restrição Ativa", default=True)
    nivel_severidade = models.CharField("Nível", max_length=10, choices=[
        ('baixo', 'Baixo'),
        ('medio', 'Médio'),
        ('alto', 'Alto'),
    ], default='medio')
    
    # Processo relacionado
    numero_processo = models.CharField("Número do Processo", max_length=50, blank=True)
    
    # Controle
    publicar = models.BooleanField("Publicar", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    
    class Meta:
        verbose_name = "Restrição de Empresa"
        verbose_name_plural = "Restrições de Empresas"
        ordering = ['-data_restricao']
        indexes = [
            models.Index(fields=['empresa_cnpj']),
            models.Index(fields=['tipo_restricao']),
            models.Index(fields=['ativa']),
        ]
    
    def __str__(self):
        return f"{self.empresa_nome} - {self.get_tipo_restricao_display()}"
    
    @property
    def esta_vencida(self):
        if self.data_validade:
            return timezone.now().date() > self.data_validade
        return False
from django import forms
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import (
    AutoBanco,
    AutoPosto,
    AutoSupermercado,
    AutoDiversos,
    AutoInfracao,
    AtendimentoCaixaBanco,
    NotaFiscalPosto,
    CupomFiscalPosto,
    AnexoAuto
)

def next_numero(model, prefix):
    """Gera o próximo número sequencial para um modelo específico"""
    ano = timezone.now().year
    ultimo = (
        model.objects
        .filter(numero__startswith=f"{prefix}-", numero__endswith=f"/{ano}")
        .order_by('-id')
        .first()
    )
    if ultimo and '-' in ultimo.numero:
        try:
            seq = int(ultimo.numero.split('-')[1].split('/')[0]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix}-{seq:04d}/{ano}"

# --- FORMS PARA AUTO BANCO ---
class AutoBancoForm(forms.ModelForm):
    numero = forms.CharField(
        label="Número do Auto",
        disabled=True,
        required=False,
        help_text="Gerado automaticamente"
    )

    class Meta:
        model = AutoBanco
        fields = [
            'numero', 'razao_social', 'nome_fantasia', 'porte', 'atuacao', 'atividade',
            'endereco', 'cep', 'municipio', 'estado', 'cnpj', 'telefone',
            'data_fiscalizacao', 'hora_fiscalizacao', 'origem', 'origem_outros',
            'nada_consta', 'sem_irregularidades', 'todos_caixas_funcionando',
            'distribuiu_senha', 'distribuiu_senha_fora_padrao', 
            'senha_sem_nome_estabelecimento', 'senha_sem_horarios', 'senha_sem_rubrica',
            'ausencia_cartaz_informativo', 'ausencia_profissional_libras',
            'observacoes', 'fiscal_nome_1', 'fiscal_nome_2', 
            'responsavel_nome', 'responsavel_cpf'
        ]
        widgets = {
            'data_fiscalizacao': forms.DateInput(attrs={'type': 'date'}),
            'hora_fiscalizacao': forms.TimeInput(attrs={'type': 'time'}),
            'observacoes': forms.Textarea(attrs={'rows': 4}),
            # Radio buttons para campos booleanos
            'todos_caixas_funcionando': forms.RadioSelect(choices=[(True, 'Sim'), (False, 'Não')]),
            'distribuiu_senha': forms.RadioSelect(choices=[(True, 'Sim'), (False, 'Não')]),
            'distribuiu_senha_fora_padrao': forms.RadioSelect(choices=[(True, 'Sim'), (False, 'Não')]),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            self.fields['numero'].initial = next_numero(AutoBanco, "BANCO")

class AtendimentoCaixaBancoForm(forms.ModelForm):
    class Meta:
        model = AtendimentoCaixaBanco
        fields = ['letra_senha', 'horario_chegada', 'horario_atendimento', 'tempo_decorrido']
        widgets = {
            'horario_chegada': forms.TimeInput(attrs={'type': 'time'}),
            'horario_atendimento': forms.TimeInput(attrs={'type': 'time'}),
        }

# Formset para atendimentos de caixa
AtendimentoCaixaBancoFormSet = forms.inlineformset_factory(
    AutoBanco, 
    AtendimentoCaixaBanco, 
    form=AtendimentoCaixaBancoForm,
    extra=1,
    can_delete=True
)

# --- FORMS PARA AUTO POSTO ---
class AutoPostoForm(forms.ModelForm):
    numero = forms.CharField(
        label="Número do Auto",
        disabled=True,
        required=False,
        help_text="Gerado automaticamente"
    )

    class Meta:
        model = AutoPosto
        fields = [
            'numero', 'razao_social', 'nome_fantasia', 'porte', 'atuacao', 'atividade',
            'endereco', 'cep', 'municipio', 'estado', 'cnpj', 'telefone',
            'data_fiscalizacao', 'hora_fiscalizacao', 'origem', 'origem_outros',
            'nada_consta', 'sem_irregularidades',
            'preco_gasolina_comum', 'preco_gasolina_aditivada', 'preco_etanol',
            'preco_diesel_comum', 'preco_diesel_s10', 'preco_gnv',
            'nao_vende_gas_comum', 'nao_vende_gas_aditivada', 'nao_vende_etanol',
            'nao_vende_diesel_comum', 'nao_vende_diesel_s10', 'nao_vende_gnv',
            'prazo_envio_documentos', 'info_adicionais', 'outras_irregularidades', 'dispositivos_legais',
            'fiscal_nome_1', 'fiscal_nome_2', 'responsavel_nome', 'responsavel_cpf'
        ]
        widgets = {
            'data_fiscalizacao': forms.DateInput(attrs={'type': 'date'}),
            'hora_fiscalizacao': forms.TimeInput(attrs={'type': 'time'}),
            'info_adicionais': forms.Textarea(attrs={'rows': 3}),
            'outras_irregularidades': forms.Textarea(attrs={'rows': 3}),
            'dispositivos_legais': forms.Textarea(attrs={'rows': 3}),
            # Campos de preço com step
            'preco_gasolina_comum': forms.NumberInput(attrs={'step': '0.001'}),
            'preco_gasolina_aditivada': forms.NumberInput(attrs={'step': '0.001'}),
            'preco_etanol': forms.NumberInput(attrs={'step': '0.001'}),
            'preco_diesel_comum': forms.NumberInput(attrs={'step': '0.001'}),
            'preco_diesel_s10': forms.NumberInput(attrs={'step': '0.001'}),
            'preco_gnv': forms.NumberInput(attrs={'step': '0.001'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            self.fields['numero'].initial = next_numero(AutoPosto, "POSTO")

class NotaFiscalPostoForm(forms.ModelForm):
    class Meta:
        model = NotaFiscalPosto
        fields = ['tipo_nota', 'produto', 'numero_nota', 'data', 'preco']
        widgets = {
            'data': forms.DateInput(attrs={'type': 'date'}),
            'preco': forms.NumberInput(attrs={'step': '0.001'}),
        }

class CupomFiscalPostoForm(forms.ModelForm):
    class Meta:
        model = CupomFiscalPosto
        fields = ['item_tabela', 'dia', 'numero_cupom', 'produto', 'valor', 'percentual_diferenca']
        widgets = {
            'dia': forms.DateInput(attrs={'type': 'date'}),
            'valor': forms.NumberInput(attrs={'step': '0.01'}),
            'percentual_diferenca': forms.NumberInput(attrs={'step': '0.01'}),
        }

# Formsets para posto
NotaFiscalPostoFormSet = forms.inlineformset_factory(
    AutoPosto, 
    NotaFiscalPosto, 
    form=NotaFiscalPostoForm,
    extra=1,
    can_delete=True
)

CupomFiscalPostoFormSet = forms.inlineformset_factory(
    AutoPosto, 
    CupomFiscalPosto, 
    form=CupomFiscalPostoForm,
    extra=1,
    can_delete=True
)

# --- FORMS PARA AUTO SUPERMERCADO ---
class AutoSupermercadoForm(forms.ModelForm):
    numero = forms.CharField(
        label="Número do Auto",
        disabled=True,
        required=False,
        help_text="Gerado automaticamente"
    )

    class Meta:
        model = AutoSupermercado
        fields = [
            'numero', 'razao_social', 'nome_fantasia', 'atividade',
            'endereco', 'cep', 'municipio', 'estado', 'cnpj', 'telefone',
            'data_fiscalizacao', 'hora_fiscalizacao', 'origem', 'origem_outros',
            'nada_consta',
            # Irregularidades específicas
            'comercializar_produtos_vencidos', 'comercializar_embalagem_violada',
            'comercializar_lata_amassada', 'comercializar_sem_validade',
            'comercializar_mal_armazenados', 'comercializar_descongelados',
            'publicidade_enganosa', 'obstrucao_monitor',
            'afixacao_precos_fora_padrao', 'ausencia_afixacao_precos',
            'afixacao_precos_fracionados_fora_padrao', 'ausencia_visibilidade_descontos',
            'ausencia_placas_promocao_vencimento',
            # Campos adicionais
            'prazo_cumprimento_dias', 'outras_irregularidades', 'narrativa_fatos',
            'possui_anexo', 'auto_apreensao', 'auto_apreensao_numero', 'necessita_pericia',
            'receita_bruta_notificada',
            'fiscal_nome_1', 'fiscal_nome_2', 'responsavel_nome', 'responsavel_cpf'
        ]
        widgets = {
            'data_fiscalizacao': forms.DateInput(attrs={'type': 'date'}),
            'hora_fiscalizacao': forms.TimeInput(attrs={'type': 'time'}),
            'outras_irregularidades': forms.Textarea(attrs={'rows': 4}),
            'narrativa_fatos': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            self.fields['numero'].initial = next_numero(AutoSupermercado, "SUPER")

# --- FORMS PARA AUTO DIVERSOS ---
class AutoDiversosForm(forms.ModelForm):
    numero = forms.CharField(
        label="Número do Auto",
        disabled=True,
        required=False,
        help_text="Gerado automaticamente"
    )

    class Meta:
        model = AutoDiversos
        fields = [
            'numero', 'razao_social', 'nome_fantasia', 'porte', 'atuacao', 'atividade',
            'endereco', 'cep', 'municipio', 'estado', 'cnpj', 'telefone',
            'data_fiscalizacao', 'hora_fiscalizacao', 'origem', 'origem_outros',
            # Irregularidades específicas
            'publicidade_enganosa', 'afixacao_precos_fora_padrao', 'ausencia_afixacao_precos',
            'afixacao_precos_eletronico_fora_padrao', 'ausencia_afixacao_precos_eletronico',
            'afixacao_precos_fracionados_fora_padrao', 'ausencia_visibilidade_descontos',
            'ausencia_exemplar_cdc', 'substituicao_troco',
            # Campos adicionais
            'advertencia', 'outras_irregularidades', 'narrativa_fatos', 'receita_bruta_notificada',
            'fiscal_nome_1', 'fiscal_nome_2', 'responsavel_nome', 'responsavel_cpf'
        ]
        widgets = {
            'data_fiscalizacao': forms.DateInput(attrs={'type': 'date'}),
            'hora_fiscalizacao': forms.TimeInput(attrs={'type': 'time'}),
            'outras_irregularidades': forms.Textarea(attrs={'rows': 3}),
            'narrativa_fatos': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            self.fields['numero'].initial = next_numero(AutoDiversos, "DIV")

# --- FORMS PARA AUTO INFRAÇÃO ---
class AutoInfracaoForm(forms.ModelForm):
    numero = forms.CharField(
        label="Número da Infração",
        disabled=True,
        required=False,
        help_text="Gerado automaticamente"
    )

    class Meta:
        model = AutoInfracao
        fields = [
            'numero', 'content_type', 'object_id', 'data_fiscalizacao', 'hora_fiscalizacao',
            'tipo_infracao', 'gravidade', 'descricao_infracao', 'base_legal', 'valor_multa',
            'relatorio', 'responsavel_nome', 'responsavel_cpf', 'responsavel_funcao',
            'prazo_defesa', 'prazo_recurso', 'instancia_recurso', 'status',
            'fiscal_responsavel', 'fiscal_apoio', 'observacoes'
        ]
        widgets = {
            'data_fiscalizacao': forms.DateInput(attrs={'type': 'date'}),
            'hora_fiscalizacao': forms.TimeInput(attrs={'type': 'time'}),
            'descricao_infracao': forms.Textarea(attrs={'rows': 3}),
            'base_legal': forms.Textarea(attrs={'rows': 3}),
            'relatorio': forms.Textarea(attrs={'rows': 6}),
            'observacoes': forms.Textarea(attrs={'rows': 3}),
            'valor_multa': forms.NumberInput(attrs={'step': '0.01'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            self.fields['numero'].initial = next_numero(AutoInfracao, "INF")
        
        # Limita os content_types apenas aos tipos de auto válidos
        self.fields['content_type'].queryset = ContentType.objects.filter(
            model__in=['autobanco', 'autoposto', 'autosupermercado', 'autodiversos']
        )

class CriarInfracaoDeAutoForm(forms.Form):
    """Form para criar uma infração a partir de um auto existente"""
    
    TIPO_AUTO_CHOICES = [
        ('', 'Selecione o tipo de auto...'),
        ('autobanco', 'Auto de Banco'),
        ('autoposto', 'Auto de Posto'),
        ('autosupermercado', 'Auto de Supermercado'),
        ('autodiversos', 'Auto Diversos'),
    ]
    
    auto_tipo = forms.ChoiceField(
        choices=TIPO_AUTO_CHOICES,
        label="Tipo de Auto"
    )
    
    auto_id = forms.IntegerField(
        label="ID do Auto",
        help_text="Número identificador do auto que gerou a infração"
    )
    
    # Dados principais da infração
    tipo_infracao = forms.ChoiceField(
        choices=AutoInfracao._meta.get_field('tipo_infracao').choices,
        label="Tipo de Infração"
    )
    
    gravidade = forms.ChoiceField(
        choices=AutoInfracao._meta.get_field('gravidade').choices,
        label="Gravidade"
    )
    
    descricao_infracao = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3}),
        label="Descrição da Infração"
    )
    
    base_legal = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 2}),
        label="Base Legal",
        help_text="Artigos de lei que fundamentam a infração"
    )
    
    relatorio = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 6}),
        label="Relatório Detalhado"
    )
    
    valor_multa = forms.DecimalField(
        required=False,
        decimal_places=2,
        max_digits=10,
        widget=forms.NumberInput(attrs={'step': '0.01'}),
        label="Valor da Multa (R$)"
    )
    
    # Data específica da infração (opcional)
    data_fiscalizacao_override = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data da Fiscalização",
        help_text="Se não preenchido, usará a data do auto original"
    )
    
    # Dados do responsável específico da infração
    responsavel_nome = forms.CharField(
        required=False,
        max_length=255,
        label="Nome do Responsável"
    )
    
    responsavel_cpf = forms.CharField(
        required=False,
        max_length=14,
        label="CPF do Responsável"
    )
    
    responsavel_funcao = forms.CharField(
        required=False,
        max_length=100,
        label="Função do Responsável"
    )
    
    # Fiscais
    fiscal_responsavel = forms.CharField(
        required=False,
        max_length=255,
        label="Fiscal Responsável"
    )
    
    fiscal_apoio = forms.CharField(
        required=False,
        max_length=255,
        label="Fiscal de Apoio"
    )
    
    observacoes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3}),
        label="Observações"
    )

    def clean(self):
        cleaned_data = super().clean()
        auto_tipo = cleaned_data.get('auto_tipo')
        auto_id = cleaned_data.get('auto_id')
        
        if auto_tipo and auto_id:
            # Mapeia os tipos para os models
            model_mapping = {
                'autobanco': AutoBanco,
                'autoposto': AutoPosto,
                'autosupermercado': AutoSupermercado,
                'autodiversos': AutoDiversos,
            }
            
            if auto_tipo in model_mapping:
                model_class = model_mapping[auto_tipo]
                try:
                    auto_obj = model_class.objects.get(pk=auto_id)
                    # Adiciona o objeto aos dados limpos para uso posterior
                    cleaned_data['auto_objeto'] = auto_obj
                except model_class.DoesNotExist:
                    raise forms.ValidationError(f"Auto {auto_tipo} com ID {auto_id} não encontrado.")
        
        return cleaned_data

class BuscarAutoForm(forms.Form):
    """Form para buscar autos que podem gerar infrações"""
    
    TIPO_AUTO_CHOICES = [
        ('', 'Todos os tipos'),
        ('autobanco', 'Auto de Banco'),
        ('autoposto', 'Auto de Posto'),
        ('autosupermercado', 'Auto de Supermercado'),
        ('autodiversos', 'Auto Diversos'),
    ]
    
    tipo_auto = forms.ChoiceField(
        required=False,
        choices=TIPO_AUTO_CHOICES,
        label="Tipo de Auto"
    )
    
    razao_social = forms.CharField(
        required=False,
        max_length=255,
        widget=forms.TextInput(attrs={'placeholder': 'Nome da empresa'}),
        label="Razão Social"
    )
    
    numero = forms.CharField(
        required=False,
        max_length=20,
        widget=forms.TextInput(attrs={'placeholder': 'Número do auto'}),
        label="Número do Auto"
    )
    
    cnpj = forms.CharField(
        required=False,
        max_length=18,
        widget=forms.TextInput(attrs={'placeholder': 'CNPJ da empresa'}),
        label="CNPJ"
    )
    
    municipio = forms.CharField(
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={'placeholder': 'Município'}),
        label="Município"
    )
    
    data_inicio = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data Início"
    )
    
    data_fim = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data Fim"
    )
    
    apenas_com_irregularidades = forms.BooleanField(
        required=False,
        initial=True,
        label="Apenas autos com irregularidades"
    )

class AtualizarStatusInfracaoForm(forms.Form):
    """Form para atualizar o status de uma infração"""
    
    novo_status = forms.ChoiceField(
        choices=AutoInfracao._meta.get_field('status').choices,
        label="Novo Status"
    )
    
    observacoes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3}),
        label="Observações sobre a mudança"
    )
    
    # Campos específicos para alguns status
    data_notificacao = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data de Notificação"
    )
    
    forma_notificacao = forms.ChoiceField(
        required=False,
        choices=[('', 'Não especificado')] + AutoInfracao._meta.get_field('forma_notificacao').choices,
        label="Forma de Notificação"
    )
    
    def clean(self):
        cleaned_data = super().clean()
        novo_status = cleaned_data.get('novo_status')
        
        # Validações específicas por status
        if novo_status == 'notificado':
            if not cleaned_data.get('data_notificacao'):
                self.add_error('data_notificacao', 'Data de notificação é obrigatória para status "Notificado"')
            if not cleaned_data.get('forma_notificacao'):
                self.add_error('forma_notificacao', 'Forma de notificação é obrigatória para status "Notificado"')
        
        return cleaned_data

# --- FORM PARA RELATÓRIO DE INFRAÇÕES ---
class RelatorioInfracoesForm(forms.Form):
    """Form para gerar relatórios de infrações"""
    
    PERIODO_CHOICES = [
        ('30d', 'Últimos 30 dias'),
        ('3m', 'Últimos 3 meses'),
        ('6m', 'Últimos 6 meses'),
        ('1a', 'Último ano'),
        ('personalizado', 'Período personalizado'),
    ]
    
    periodo = forms.ChoiceField(
        choices=PERIODO_CHOICES,
        initial='30d',
        label="Período"
    )
    
    data_inicio = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data Início"
    )
    
    data_fim = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data Fim"
    )
    
    tipo_infracao = forms.ChoiceField(
        required=False,
        choices=[('', 'Todos os tipos')] + AutoInfracao._meta.get_field('tipo_infracao').choices,
        label="Tipo de Infração"
    )
    
    gravidade = forms.ChoiceField(
        required=False,
        choices=[('', 'Todas as gravidades')] + AutoInfracao._meta.get_field('gravidade').choices,
        label="Gravidade"
    )
    
    status = forms.ChoiceField(
        required=False,
        choices=[('', 'Todos os status')] + AutoInfracao._meta.get_field('status').choices,
        label="Status"
    )
    
    municipio = forms.CharField(
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={'placeholder': 'Município'}),
        label="Município"
    )
    
    incluir_historico = forms.BooleanField(
        required=False,
        initial=False,
        label="Incluir histórico de mudanças de status"
    )
    
    incluir_detalhes_auto = forms.BooleanField(
        required=False,
        initial=True,
        label="Incluir detalhes do auto relacionado"
    )

    def clean(self):
        cleaned_data = super().clean()
        periodo = cleaned_data.get('periodo')
        
        if periodo == 'personalizado':
            data_inicio = cleaned_data.get('data_inicio')
            data_fim = cleaned_data.get('data_fim')
            
            if not data_inicio or not data_fim:
                raise forms.ValidationError(
                    "Para período personalizado, é necessário informar data início e fim."
                )
            
            if data_inicio > data_fim:
                raise forms.ValidationError(
                    "Data início deve ser anterior à data fim."
                )
        
        return cleaned_data
    
# --- FORM PARA ANEXOS ---
class AnexoAutoForm(forms.ModelForm):
    class Meta:
        model = AnexoAuto
        fields = ['arquivo', 'descricao']
        widgets = {
            'descricao': forms.TextInput(attrs={'placeholder': 'Descrição do anexo (opcional)'}),
        }

# --- FORMS DE BUSCA E FILTROS ---
class FiltroAutoForm(forms.Form):
    """Form para filtrar autos de constatação"""
    data_inicio = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data Início"
    )
    data_fim = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data Fim"
    )
    origem = forms.ChoiceField(
        required=False,
        choices=[('', 'Todas')] + [
            ('acao', 'Ação Fiscalizatória'),
            ('denuncia', 'Denúncia'),
            ('forca_tarefa', 'Força Tarefa'),
            ('outros', 'Outros'),
        ],
        label="Origem"
    )
    municipio = forms.CharField(
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={'placeholder': 'Nome do município'}),
        label="Município"
    )
    razao_social = forms.CharField(
        required=False,
        max_length=255,
        widget=forms.TextInput(attrs={'placeholder': 'Nome da empresa'}),
        label="Razão Social"
    )

class RelatorioForm(forms.Form):
    """Form para gerar relatórios"""
    TIPO_RELATORIO_CHOICES = [
        ('mensal', 'Relatório Mensal'),
        ('anual', 'Relatório Anual'),
        ('personalizado', 'Período Personalizado'),
    ]
    
    TIPO_AUTO_CHOICES = [
        ('todos', 'Todos os Tipos'),
        ('banco', 'Bancos'),
        ('posto', 'Postos'),
        ('supermercado', 'Supermercados'),
        ('diversos', 'Diversos'),
    ]
    
    tipo_relatorio = forms.ChoiceField(
        choices=TIPO_RELATORIO_CHOICES,
        label="Tipo de Relatório"
    )
    
    tipo_auto = forms.ChoiceField(
        choices=TIPO_AUTO_CHOICES,
        label="Tipo de Auto"
    )
    
    ano = forms.IntegerField(
        min_value=2020,
        max_value=2030,
        initial=timezone.now().year,
        label="Ano"
    )
    
    mes = forms.IntegerField(
        min_value=1,
        max_value=12,
        required=False,
        initial=timezone.now().month,
        label="Mês"
    )
    
    data_inicio = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data Início"
    )
    
    data_fim = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label="Data Fim"
    )
    
    incluir_anexos = forms.BooleanField(
        required=False,
        initial=False,
        label="Incluir informações de anexos"
    )
    
    incluir_infracoes = forms.BooleanField(
        required=False,
        initial=True,
        label="Incluir infrações relacionadas"
    )

    def clean(self):
        cleaned_data = super().clean()
        tipo_relatorio = cleaned_data.get('tipo_relatorio')
        
        if tipo_relatorio == 'personalizado':
            data_inicio = cleaned_data.get('data_inicio')
            data_fim = cleaned_data.get('data_fim')
            
            if not data_inicio or not data_fim:
                raise forms.ValidationError(
                    "Para relatório personalizado, é necessário informar data início e fim."
                )
            
            if data_inicio > data_fim:
                raise forms.ValidationError(
                    "Data início deve ser anterior à data fim."
                )
        
        return cleaned_data

# --- FORM PARA ASSINATURAS DIGITAIS ---
class AssinaturaForm(forms.Form):
    """Form para capturar assinaturas digitais"""
    assinatura_fiscal_1 = forms.CharField(
        required=False,
        widget=forms.HiddenInput(),
        label="Assinatura Fiscal 1"
    )
    
    assinatura_fiscal_2 = forms.CharField(
        required=False,
        widget=forms.HiddenInput(),
        label="Assinatura Fiscal 2"
    )
    
    assinatura_representante = forms.CharField(
        required=False,
        widget=forms.HiddenInput(),
        label="Assinatura Representante"
    )

# --- FORM PARA CONFIGURAÇÕES ---
class ConfiguracaoForm(forms.Form):
    """Form para configurações do sistema"""
    
    MUNICIPIOS_CHOICES = [
        ('Manaus', 'Manaus'),
        ('Parintins', 'Parintins'),
        ('Itacoatiara', 'Itacoatiara'),
        ('Manacapuru', 'Manacapuru'),
        ('Coari', 'Coari'),
        ('Tefé', 'Tefé'),
        ('Tabatinga', 'Tabatinga'),
        ('Maués', 'Maués'),
        ('Humaitá', 'Humaitá'),
        ('Lábrea', 'Lábrea'),
    ]
    
    municipio_padrao = forms.ChoiceField(
        choices=MUNICIPIOS_CHOICES,
        initial='Manaus',
        label="Município Padrão"
    )
    
    estado_padrao = forms.CharField(
        initial='AM',
        max_length=2,
        label="Estado Padrão"
    )
    
    prazo_padrao_receita_bruta = forms.IntegerField(
        initial=5,
        min_value=1,
        max_value=30,
        label="Prazo padrão para receita bruta (dias)"
    )
    
    auto_numerar = forms.BooleanField(
        initial=True,
        required=False,
        label="Numeração automática de autos"
    )
    
    backup_automatico = forms.BooleanField(
        initial=False,
        required=False,
        label="Backup automático"
    )
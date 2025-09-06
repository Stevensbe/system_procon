from django import forms
from .models import Empresa, Departamento, Multa, Cobranca, Peticao, Recurso, Analise

class EmpresaForm(forms.ModelForm):
    class Meta:
        model = Empresa
        fields = '__all__'

class DepartamentoForm(forms.ModelForm):
    class Meta:
        model = Departamento
        fields = '__all__'

class MultaForm(forms.ModelForm):
    class Meta:
        model = Multa
        fields = ['processo','empresa','valor']

class CobrancaForm(forms.ModelForm):
    class Meta:
        model = Cobranca
        fields = ['multa','data_vencimento','boleto','remessa']

class PeticaoForm(forms.ModelForm):
    class Meta:
        model = Peticao
        fields = ['processo','tipo','texto','documento']

class RecursoForm(forms.ModelForm):
    class Meta:
        model = Recurso
        fields = ['processo','tipo','texto','documento']

class AnaliseForm(forms.ModelForm):
    class Meta:
        model = Analise
        fields = ['recurso','tipo','parecer','decisao']

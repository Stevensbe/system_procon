from django import forms
from django.forms.models import inlineformset_factory
from .models import Lei, Artigo

class LeiForm(forms.ModelForm):
    class Meta:
        model = Lei
        fields = ['numero', 'titulo', 'publicada_em', 'link', 'observacoes']
        widgets = {
            'publicada_em': forms.DateInput(attrs={'type': 'date'}),
        }

class ArtigoForm(forms.ModelForm):
    class Meta:
        model = Artigo
        fields = ['numero_artigo', 'texto']

ArtigoFormSet = inlineformset_factory(
    Lei, Artigo,
    form=ArtigoForm,
    extra=1, can_delete=True
)

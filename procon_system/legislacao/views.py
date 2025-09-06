from django.urls import reverse_lazy
from django.views import generic
from .models import Lei, Artigo

class LeiList(generic.ListView):
    model = Lei

class LeiCreate(generic.CreateView):
    model = Lei
    fields = ['numero','titulo','publicada_em','link','observacoes']
    success_url = reverse_lazy('legislacao:lei_list')

class LeiUpdate(generic.UpdateView):
    model = Lei
    fields = ['numero','titulo','publicada_em','link','observacoes']
    success_url = reverse_lazy('legislacao:lei_list')

class LeiDelete(generic.DeleteView):
    model = Lei
    success_url = reverse_lazy('legislacao:lei_list')

class ArtigoList(generic.ListView):
    model = Artigo

class ArtigoCreate(generic.CreateView):
    model = Artigo
    fields = ['lei','numero_artigo','texto']
    success_url = reverse_lazy('legislacao:artigo_list')

# etc. para update/delete de Artigo...

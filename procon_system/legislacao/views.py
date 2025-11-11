from django.urls import reverse_lazy
from django.views import generic
from rest_framework import viewsets, filters

from .models import Lei, Artigo
from .serializers import LeiSerializer, ArtigoSerializer

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


class LeiViewSet(viewsets.ModelViewSet):
    """
    API para gerenciamento de leis publicadas
    """

    queryset = Lei.objects.prefetch_related("artigos").all()
    serializer_class = LeiSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["numero", "titulo", "artigos__numero_artigo"]
    ordering_fields = ["publicada_em", "numero"]
    ordering = ["-publicada_em"]


class ArtigoViewSet(viewsets.ModelViewSet):
    """
    API para artigos vinculados às leis
    """

    queryset = Artigo.objects.select_related("lei").all()
    serializer_class = ArtigoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["numero_artigo", "texto", "lei__numero", "lei__titulo"]
    ordering_fields = ["numero_artigo"]
    ordering = ["numero_artigo"]

"""
Views para Autos de Constatação - System Procon

Este módulo contém as views relacionadas aos diferentes tipos de Auto de Constatação:
- AutoBanco
- AutoPosto  
- AutoSupermercado
- AutoDiversos

Inclui também views para modelos relacionados como AtendimentoCaixaBanco, NotaFiscalPosto, etc.
"""

from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Sum, Avg
from django.utils import timezone
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from datetime import datetime, timedelta

from ..models import (
    AutoBanco,
    AutoPosto,
    AutoSupermercado,
    AutoDiversos,
    AtendimentoCaixaBanco,
    NotaFiscalPosto,
    CupomFiscalPosto,
    AnexoAuto,
)

from ..serializers import (
    AutoBancoSerializer,
    AutoPostoSerializer,
    AutoSupermercadoSerializer,
    AutoDiversosSerializer,
    AtendimentoCaixaBancoSerializer,
    NotaFiscalPostoSerializer,
    CupomFiscalPostoSerializer,
    AnexoAutoSerializer,
)


# ========================================
# CLASSES BASE
# ========================================

class BaseAutoAPIView(generics.GenericAPIView):
    """Classe base para adicionar filtros comuns de busca e ordenação."""
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero', 'razao_social', 'cnpj', 'nome_fantasia']
    ordering_fields = ['data_fiscalizacao', 'numero', 'razao_social']
    ordering = ['-data_fiscalizacao']


# ========================================
# VIEWS DE API - AUTO BANCO
# ========================================

class AutoBancoListCreateAPIView(BaseAutoAPIView, generics.ListCreateAPIView):
    queryset = AutoBanco.objects.all()
    serializer_class = AutoBancoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros adicionais
        origem = self.request.query_params.get('origem')
        municipio = self.request.query_params.get('municipio')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        tem_irregularidades = self.request.query_params.get('tem_irregularidades')
        
        if origem:
            queryset = queryset.filter(origem=origem)
        if municipio:
            queryset = queryset.filter(municipio__icontains=municipio)
        if data_inicio:
            queryset = queryset.filter(data_fiscalizacao__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_fiscalizacao__lte=data_fim)
        if tem_irregularidades is not None:
            if tem_irregularidades.lower() == 'true':
                queryset = queryset.exclude(Q(nada_consta=True) | Q(sem_irregularidades=True))
            else:
                queryset = queryset.filter(Q(nada_consta=True) | Q(sem_irregularidades=True))
        
        return queryset


class AutoBancoRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AutoBanco.objects.all()
    serializer_class = AutoBancoSerializer


# ========================================
# VIEWS DE API - AUTO POSTO
# ========================================

class AutoPostoListCreateAPIView(BaseAutoAPIView, generics.ListCreateAPIView):
    queryset = AutoPosto.objects.all()
    serializer_class = AutoPostoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros específicos para postos
        origem = self.request.query_params.get('origem')
        municipio = self.request.query_params.get('municipio')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        tem_irregularidades = self.request.query_params.get('tem_irregularidades')
        
        if origem:
            queryset = queryset.filter(origem=origem)
        if municipio:
            queryset = queryset.filter(municipio__icontains=municipio)
        if data_inicio:
            queryset = queryset.filter(data_fiscalizacao__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_fiscalizacao__lte=data_fim)
        if tem_irregularidades is not None:
            if tem_irregularidades.lower() == 'true':
                queryset = queryset.exclude(Q(nada_consta=True) | Q(sem_irregularidades=True))
            else:
                queryset = queryset.filter(Q(nada_consta=True) | Q(sem_irregularidades=True))
        
        return queryset


class AutoPostoRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AutoPosto.objects.all()
    serializer_class = AutoPostoSerializer


# ========================================
# VIEWS DE API - AUTO SUPERMERCADO
# ========================================

class AutoSupermercadoListCreateAPIView(BaseAutoAPIView, generics.ListCreateAPIView):
    queryset = AutoSupermercado.objects.all()
    serializer_class = AutoSupermercadoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros específicos para supermercados
        origem = self.request.query_params.get('origem')
        municipio = self.request.query_params.get('municipio')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        tem_irregularidades = self.request.query_params.get('tem_irregularidades')
        
        if origem:
            queryset = queryset.filter(origem=origem)
        if municipio:
            queryset = queryset.filter(municipio__icontains=municipio)
        if data_inicio:
            queryset = queryset.filter(data_fiscalizacao__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_fiscalizacao__lte=data_fim)
        if tem_irregularidades is not None:
            if tem_irregularidades.lower() == 'true':
                queryset = queryset.exclude(nada_consta=True)
            else:
                queryset = queryset.filter(nada_consta=True)
        
        return queryset


class AutoSupermercadoRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AutoSupermercado.objects.all()
    serializer_class = AutoSupermercadoSerializer


# ========================================
# VIEWS DE API - AUTO DIVERSOS
# ========================================

class AutoDiversosListCreateAPIView(BaseAutoAPIView, generics.ListCreateAPIView):
    queryset = AutoDiversos.objects.all()
    serializer_class = AutoDiversosSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros específicos para diversos
        origem = self.request.query_params.get('origem')
        municipio = self.request.query_params.get('municipio')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        advertencia = self.request.query_params.get('advertencia')
        
        if origem:
            queryset = queryset.filter(origem=origem)
        if municipio:
            queryset = queryset.filter(municipio__icontains=municipio)
        if data_inicio:
            queryset = queryset.filter(data_fiscalizacao__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_fiscalizacao__lte=data_fim)
        if advertencia is not None:
            queryset = queryset.filter(advertencia=advertencia.lower() == 'true')
        
        return queryset


class AutoDiversosRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AutoDiversos.objects.all()
    serializer_class = AutoDiversosSerializer


# ========================================
# VIEWS PARA MODELOS RELACIONADOS
# ========================================

class AtendimentoCaixaBancoListAPIView(generics.ListCreateAPIView):
    serializer_class = AtendimentoCaixaBancoSerializer
    
    def get_queryset(self):
        auto_banco_id = self.kwargs['auto_banco_id']
        return AtendimentoCaixaBanco.objects.filter(auto_banco_id=auto_banco_id)
    
    def perform_create(self, serializer):
        auto_banco_id = self.kwargs['auto_banco_id']
        auto_banco = get_object_or_404(AutoBanco, id=auto_banco_id)
        serializer.save(auto_banco=auto_banco)


class NotaFiscalPostoListAPIView(generics.ListCreateAPIView):
    serializer_class = NotaFiscalPostoSerializer
    
    def get_queryset(self):
        auto_posto_id = self.kwargs['auto_posto_id']
        return NotaFiscalPosto.objects.filter(auto_posto_id=auto_posto_id)
    
    def perform_create(self, serializer):
        auto_posto_id = self.kwargs['auto_posto_id']
        auto_posto = get_object_or_404(AutoPosto, id=auto_posto_id)
        serializer.save(auto_posto=auto_posto)


class CupomFiscalPostoListAPIView(generics.ListCreateAPIView):
    serializer_class = CupomFiscalPostoSerializer
    
    def get_queryset(self):
        auto_posto_id = self.kwargs['auto_posto_id']
        return CupomFiscalPosto.objects.filter(auto_posto_id=auto_posto_id)
    
    def perform_create(self, serializer):
        auto_posto_id = self.kwargs['auto_posto_id']
        auto_posto = get_object_or_404(AutoPosto, id=auto_posto_id)
        serializer.save(auto_posto=auto_posto)


class AnexoAutoListAPIView(generics.ListCreateAPIView):
    queryset = AnexoAuto.objects.all()
    serializer_class = AnexoAutoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros opcionais
        content_type_id = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        
        if content_type_id:
            queryset = queryset.filter(content_type_id=content_type_id)
        if object_id:
            queryset = queryset.filter(object_id=object_id)
        
        return queryset

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from .models import AutoApreensaoInutilizacao, ItemApreensaoInutilizacao, AutoSupermercado
from .serializers import (
    AutoApreensaoInutilizacaoSerializer, 
    ItemApreensaoInutilizacaoSerializer,
    AutoSupermercadoListSerializer
)


class AutoApreensaoInutilizacaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Auto de Apreensão/Inutilização
    Baseado no formulário oficial do PROCON-AM
    """
    queryset = AutoApreensaoInutilizacao.objects.all()
    serializer_class = AutoApreensaoInutilizacaoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtra por tipo de documento se especificado"""
        queryset = super().get_queryset()
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo_documento=tipo)
        return queryset
    
    @action(detail=True, methods=['post'])
    def adicionar_item(self, request, pk=None):
        """Adiciona um item ao auto de apreensão/inutilização"""
        auto = self.get_object()
        serializer = ItemApreensaoInutilizacaoSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(auto=auto)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def gerar_pdf(self, request, pk=None):
        """Gera PDF do auto de apreensão/inutilização"""
        auto = self.get_object()
        
        # Aqui você implementaria a geração do PDF
        # baseado no formulário oficial do PROCON-AM
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="auto_apreensao_{auto.numero_documento}.pdf"'
        
        # Implementar geração do PDF
        # pdf = gerar_pdf_auto_apreensao(auto)
        # response.write(pdf)
        
        return response
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Retorna estatísticas dos autos de apreensão/inutilização"""
        total_apreensoes = AutoApreensaoInutilizacao.objects.filter(
            tipo_documento='apreensao'
        ).count()
        
        total_inutilizacoes = AutoApreensaoInutilizacao.objects.filter(
            tipo_documento='inutilizacao'
        ).count()
        
        total_itens = ItemApreensaoInutilizacao.objects.count()
        
        return Response({
            'total_apreensoes': total_apreensoes,
            'total_inutilizacoes': total_inutilizacoes,
            'total_itens': total_itens,
        })
    
    @action(detail=False, methods=['get'])
    def autos_supermercado_disponiveis(self, request):
        """Retorna autos de supermercado disponíveis para vincular"""
        # Busca autos de supermercado que não têm auto de apreensão vinculado
        autos_supermercado = AutoSupermercado.objects.filter(
            auto_apreensao_inutilizacao__isnull=True
        ).order_by('-data_fiscalizacao')
        
        serializer = AutoSupermercadoListSerializer(autos_supermercado, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def proximo_numero(self, request):
        """Retorna o próximo número que será gerado"""
        from .utils import obter_proximo_numero_apreensao_preview
        proximo_numero = obter_proximo_numero_apreensao_preview()
        
        return Response({
            'proximo_numero': proximo_numero
        })


class ItemApreensaoInutilizacaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para itens de apreensão/inutilização
    """
    queryset = ItemApreensaoInutilizacao.objects.all()
    serializer_class = ItemApreensaoInutilizacaoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtra por auto se especificado"""
        queryset = super().get_queryset()
        auto_id = self.request.query_params.get('auto_id', None)
        if auto_id:
            queryset = queryset.filter(auto_id=auto_id)
        return queryset

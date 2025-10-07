from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime
from django.db import models

from .models import (
    Multa, Empresa, Cobranca, Peticao, Recurso, 
    Analise, ConfigBancaria, ConfigSistema, Departamento
)
from .serializers import (
    MultaSerializer, EmpresaSerializer, CobrancaSerializer,
    PeticaoSerializer, RecursoSerializer, AnaliseSerializer,
    ConfigBancariaSerializer, ConfigSistemaSerializer, DepartamentoSerializer
)

class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome']

class EmpresaViewSet(viewsets.ModelViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativo']
    search_fields = ['razao_social', 'nome_fantasia', 'cnpj']
    ordering_fields = ['razao_social', 'nome_fantasia']

class MultaViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        if 'processo' in data and data['processo']:
            return super().create(request, *args, **kwargs)

        numero_processo = data.pop('numero_processo', '') or data.pop('processo_numero', '')
        empresa_nome = data.pop('empresa', '') or data.pop('empresa_nome', '') or 'Empresa não informada'
        cnpj = data.pop('cnpj', '') or data.pop('empresa_cnpj', '') or '00.000.000/0000-00'
        endereco = data.pop('endereco', '') or 'Endereço não informado'
        telefone = data.pop('telefone', '')
        valor_informado = data.get('valor') or data.get('valor_multa') or data.pop('valor_multa', None) or data.pop('valor', None)
        valor_decimal = Decimal(str(valor_informado)) if valor_informado not in (None, '',) else Decimal('0')
        status_param = data.get('status') or 'pendente'
        motivo = data.pop('motivo', '') or 'Multa registrada via API'

        empresa, _ = Empresa.objects.get_or_create(
            cnpj=cnpj,
            defaults={
                'razao_social': empresa_nome,
                'nome_fantasia': empresa_nome,
                'endereco': endereco,
                'telefone': telefone,
            }
        )

        if not empresa.endereco:
            empresa.endereco = endereco
            if telefone and not empresa.telefone:
                empresa.telefone = telefone
            empresa.save(update_fields=['endereco', 'telefone'])

        try:
            data_fiscalizacao = datetime.fromisoformat(data.pop('data_fiscalizacao', '')).date()
        except (TypeError, ValueError):
            data_fiscalizacao = timezone.now().date()

        numero = numero_processo
        if numero and AutoInfracao.objects.filter(numero=numero).exists():
            numero = ''

        auto = AutoInfracao.objects.create(
            numero=numero,
            data_fiscalizacao=data_fiscalizacao,
            hora_fiscalizacao=timezone.now().time(),
            razao_social=empresa_nome,
            nome_fantasia=empresa_nome,
            endereco=endereco,
            cnpj=cnpj,
            relatorio=motivo,
            base_legal_cdc='Art. 55 do CDC',
            valor_multa=valor_decimal,
            responsavel_nome=data.pop('responsavel', 'Responsável automático'),
            responsavel_cpf=data.pop('responsavel_cpf', '000.000.000-00'),
            fiscal_nome=data.pop('fiscal', 'Fiscal API'),
            status='autuado',
        )

        data['processo'] = auto.pk
        data['empresa'] = empresa.pk
        data['valor'] = str(valor_decimal)
        if 'status' in data:
            status_param = data['status']
        if status_param not in dict(Multa.STATUS_CHOICES):
            data['status'] = 'pendente'
        if 'data_vencimento' not in data:
            data['data_vencimento'] = None

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    queryset = Multa.objects.select_related('processo', 'empresa').all()
    serializer_class = MultaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'pago', 'empresa']
    search_fields = ['processo__numero', 'empresa__razao_social']
    ordering_fields = ['data_emissao', 'valor']

    @action(detail=True, methods=['post'])
    def marcar_como_paga(self, request, pk=None):
        """Marca uma multa como paga e permite upload do comprovante"""
        multa = self.get_object()
        
        # Upload do comprovante se fornecido
        comprovante = request.FILES.get('comprovante')
        observacao = request.data.get('observacao', 'Multa marcada como paga via sistema')
        
        # Usa o método do modelo para marcar como paga
        multa.marcar_como_paga(comprovante=comprovante, observacao=observacao)
        
        serializer = self.get_serializer(multa)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela uma multa"""
        multa = self.get_object()
        motivo = request.data.get('motivo', 'Multa cancelada via sistema')
        
        # Usa o método do modelo para cancelar
        multa.cancelar(motivo=motivo)
        
        serializer = self.get_serializer(multa)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Retorna estatísticas das multas usando novos campos"""
        try:
            # Estatísticas por status
            total_multas = Multa.objects.count()
            multas_pendentes = Multa.objects.filter(status='pendente').count()
            multas_pagas = Multa.objects.filter(status='paga').count()
            multas_vencidas = Multa.objects.filter(status='vencida').count()
            multas_canceladas = Multa.objects.filter(status='cancelada').count()
            
            # Valores financeiros por status
            valor_total = Multa.objects.aggregate(
                total=models.Sum('valor')
            )['total'] or 0
            
            valor_pago = Multa.objects.filter(status='paga').aggregate(
                total=models.Sum('valor')
            )['total'] or 0
            
            valor_pendente = Multa.objects.filter(
                status__in=['pendente', 'vencida']
            ).aggregate(
                total=models.Sum('valor')
            )['total'] or 0
            
            valor_cancelado = Multa.objects.filter(status='cancelada').aggregate(
                total=models.Sum('valor')
            )['total'] or 0

            # Estatísticas por empresa (top 5)
            empresas_mais_multadas = Multa.objects.values(
                'empresa__razao_social'
            ).annotate(
                total_multas=models.Count('id'),
                valor_total=models.Sum('valor')
            ).order_by('-total_multas')[:5]

            return Response({
                'resumo': {
                    'total_multas': total_multas,
                    'multas_pendentes': multas_pendentes,
                    'multas_pagas': multas_pagas,
                    'multas_vencidas': multas_vencidas,
                    'multas_canceladas': multas_canceladas,
                },
                'valores': {
                    'valor_total': float(valor_total),
                    'valor_pago': float(valor_pago),
                    'valor_pendente': float(valor_pendente),
                    'valor_cancelado': float(valor_cancelado),
                },
                'por_status': {
                    'pendente': multas_pendentes,
                    'paga': multas_pagas,
                    'vencida': multas_vencidas,
                    'cancelada': multas_canceladas,
                },
                'empresas_mais_multadas': list(empresas_mais_multadas)
            })
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Erro ao carregar estatísticas'
            }, status=500)

    @action(detail=False, methods=['get'])
    def estatisticas_simples(self, request):
        """Endpoint de estatísticas simplificado para teste"""
        return Response({
            'message': 'Endpoint de estatísticas funcionando!',
            'total_multas': 0,
            'multas_pagas': 0,
            'multas_pendentes': 0
        })

    @action(detail=False, methods=['get'])
    def teste(self, request):
        """Endpoint de teste simples"""
        return Response({
            'message': 'Endpoint de teste funcionando!',
            'status': 'success'
        })

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Lista multas vencidas usando novo campo status"""
        # Atualiza status das multas antes de consultar
        hoje = timezone.now().date()
        Multa.objects.filter(
            status='pendente',
            data_vencimento__lt=hoje
        ).update(status='vencida')
        
        # Retorna multas vencidas
        multas_vencidas = self.queryset.filter(status='vencida')
        serializer = self.get_serializer(multas_vencidas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def atualizar_status_vencimento(self, request):
        """Atualiza automaticamente o status de multas vencidas"""
        hoje = timezone.now().date()
        updated = Multa.objects.filter(
            status='pendente',
            data_vencimento__lt=hoje
        ).update(status='vencida')
        
        return Response({
            'message': f'{updated} multas foram marcadas como vencidas',
            'updated_count': updated
        })
    
    @action(detail=True, methods=['post'])
    def alterar_status(self, request, pk=None):
        """Permite alterar o status de uma multa manualmente"""
        multa = self.get_object()
        novo_status = request.data.get('status')
        observacao = request.data.get('observacao', '')
        
        if novo_status not in dict(Multa.STATUS_CHOICES):
            return Response({
                'error': 'Status inválido',
                'choices': dict(Multa.STATUS_CHOICES)
            }, status=400)
        
        status_anterior = multa.status
        multa.status = novo_status
        
        if observacao:
            multa.observacoes = f"{multa.observacoes}\nStatus alterado de '{status_anterior}' para '{novo_status}': {observacao}".strip()
        
        multa.save()
        serializer = self.get_serializer(multa)
        return Response(serializer.data)

class MultaViewSetTeste(viewsets.ModelViewSet):
    """ViewSet de teste para verificar se o problema é com o ViewSet"""
    queryset = Multa.objects.all()
    serializer_class = MultaSerializer
    
    @action(detail=False, methods=['get'])
    def estatisticas_teste(self, request):
        """Endpoint de estatísticas de teste"""
        return Response({
            'message': 'ViewSet funcionando!',
            'total_multas': 0,
            'multas_pagas': 0,
            'multas_pendentes': 0
        })

class CobrancaViewSet(viewsets.ModelViewSet):
    queryset = Cobranca.objects.select_related('multa').all()
    serializer_class = CobrancaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['multa__status', 'data_pagamento']
    ordering_fields = ['data_vencimento', 'data_pagamento']

class PeticaoViewSet(viewsets.ModelViewSet):
    queryset = Peticao.objects.select_related('processo').all()
    serializer_class = PeticaoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'processo']
    search_fields = ['texto', 'processo__numero']
    ordering_fields = ['data', 'tipo']

class RecursoViewSet(viewsets.ModelViewSet):
    queryset = Recurso.objects.select_related('processo').all()
    serializer_class = RecursoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'processo']
    search_fields = ['texto', 'processo__numero']
    ordering_fields = ['data', 'tipo']

class AnaliseViewSet(viewsets.ModelViewSet):
    queryset = Analise.objects.select_related('recurso').all()
    serializer_class = AnaliseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'decisao', 'recurso']
    search_fields = ['parecer']
    ordering_fields = ['data', 'decisao']

class ConfigBancariaViewSet(viewsets.ModelViewSet):
    queryset = ConfigBancaria.objects.all()
    serializer_class = ConfigBancariaSerializer

class ConfigSistemaViewSet(viewsets.ModelViewSet):
    queryset = ConfigSistema.objects.all()
    serializer_class = ConfigSistemaSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['chave']





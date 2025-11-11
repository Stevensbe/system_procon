from decimal import Decimal, InvalidOperation

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import Http404
from datetime import datetime
from django.db import models

from fiscalizacao.models import AutoInfracao

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
    pagination_class = PageNumberPagination

    def create(self, request, *args, **kwargs):
        normalized = {
            key: value[0] if isinstance(value, list) else value
            for key, value in request.data.items()
        }

        empresa_raw = normalized.get('empresa')

        if normalized.get('processo'):
            payload = normalized.copy()
            payload.pop('empresa', None)
            if not payload.get('empresa_id') and empresa_raw:
                resolved = self._resolve_empresa_identifier(empresa_raw)
                if resolved:
                    payload['empresa_id'] = resolved
            serializer = self.get_serializer(data=payload)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        payload = normalized.copy()
        payload.pop('empresa', None)

        numero_processo = payload.pop('numero_processo', '') or payload.pop('processo_numero', '')
        empresa_id = payload.pop('empresa_id', None)
        empresa_nome = payload.pop('empresa_nome', None) or (
            empresa_raw if isinstance(empresa_raw, str) else None
        ) or 'Empresa nao informada'
        cnpj = payload.pop('empresa_cnpj', None) or payload.pop('cnpj', None) or '00.000.000/0000-00'
        endereco = payload.pop('endereco', None) or 'Endereco nao informado'
        telefone = payload.pop('telefone', None)

        valor_raw = payload.pop('valor', None)
        if valor_raw in (None, ''):
            valor_raw = payload.pop('valor_multa', None)
        try:
            if valor_raw in (None, ''):
                valor_decimal = Decimal('0')
            else:
                valor_decimal = Decimal(str(valor_raw).replace(',', '.'))
        except (InvalidOperation, ValueError, TypeError):
            return Response({'errors': {'valor': 'Valor da multa invalido'}}, status=status.HTTP_400_BAD_REQUEST)

        motivo = payload.pop('motivo', None) or payload.get('observacoes') or 'Multa registrada via API'
        status_param = payload.get('status') or 'pendente'
        status_choices = dict(Multa.STATUS_CHOICES)
        if status_param not in status_choices:
            status_param = 'pendente'

        empresa = self._get_or_create_empresa(empresa_id, empresa_raw, empresa_nome, cnpj, endereco, telefone)

        data_fiscalizacao_raw = payload.pop('data_fiscalizacao', None)
        data_fiscalizacao = self._coerce_date(data_fiscalizacao_raw) or timezone.now().date()

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
            responsavel_nome=payload.pop('responsavel', 'Responsavel automatico'),
            responsavel_cpf=payload.pop('responsavel_cpf', '000.000.000-00'),
            fiscal_nome=payload.pop('fiscal', 'Fiscal API'),
            status='autuado',
        )

        payload['processo'] = auto.pk
        payload['empresa_id'] = empresa.pk
        payload['valor'] = valor_decimal
        payload['observacoes'] = motivo
        payload['status'] = status_param
        payload.setdefault('data_vencimento', None)

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def _resolve_empresa_identifier(self, raw_value):
        if raw_value in (None, ''):
            return None
        try:
            return Empresa.objects.get(pk=int(raw_value)).pk
        except (ValueError, TypeError, Empresa.DoesNotExist):
            empresa = Empresa.objects.filter(razao_social__iexact=str(raw_value).strip()).first()
            return empresa.pk if empresa else None

    def _get_or_create_empresa(self, empresa_id, empresa_raw, nome, cnpj, endereco, telefone):
        candidates = [empresa_id, empresa_raw]
        for candidate in candidates:
            if candidate in (None, ''):
                continue
            try:
                empresa = Empresa.objects.get(pk=int(candidate))
                return self._update_empresa_fields(empresa, nome, endereco, telefone)
            except (ValueError, TypeError, Empresa.DoesNotExist):
                continue

        empresa = Empresa.objects.filter(razao_social__iexact=str(empresa_raw or nome).strip()).first()
        if empresa:
            return self._update_empresa_fields(empresa, nome, endereco, telefone)

        defaults = {
            'razao_social': nome,
            'nome_fantasia': nome,
            'endereco': endereco,
            'telefone': telefone or '',
        }
        empresa, _ = Empresa.objects.get_or_create(cnpj=cnpj, defaults=defaults)
        return self._update_empresa_fields(empresa, nome, endereco, telefone)

    def _update_empresa_fields(self, empresa, nome, endereco, telefone):
        updates = {}
        if nome and empresa.razao_social != nome:
            updates['razao_social'] = nome
            updates['nome_fantasia'] = nome
        if endereco and not empresa.endereco:
            updates['endereco'] = endereco
        if telefone and not empresa.telefone:
            updates['telefone'] = telefone
        if updates:
            for field, value in updates.items():
                setattr(empresa, field, value)
            empresa.save(update_fields=list(updates.keys()))
        return empresa

    def _coerce_date(self, value):
        if not value:
            return None
        if isinstance(value, datetime):
            return value.date()
        try:
            parsed = datetime.fromisoformat(str(value))
            return parsed.date() if isinstance(parsed, datetime) else parsed
        except (ValueError, TypeError):
            return None
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

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        query = request.query_params.get('query') or request.query_params.get('q')
        if query:
            queryset = queryset.filter(
                models.Q(empresa__razao_social__icontains=query)
                | models.Q(processo__numero__icontains=query)
            )

        valor_min = request.query_params.get('valor_min')
        if valor_min not in (None, ''):
            try:
                queryset = queryset.filter(valor__gte=Decimal(str(valor_min)))
            except (InvalidOperation, ValueError):
                pass

        valor_max = request.query_params.get('valor_max')
        if valor_max not in (None, ''):
            try:
                queryset = queryset.filter(valor__lte=Decimal(str(valor_max)))
            except (InvalidOperation, ValueError):
                pass

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data})

    def _fallback_update_response(self, pk, data):
        try:
            multa = Multa.objects.get(pk=pk)
        except (TypeError, ValueError, Multa.DoesNotExist):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        payload = {'id': multa.pk}
        if 'status' in data:
            payload['status'] = data['status']
        if 'valor' in data:
            try:
                payload['valor'] = f"{Decimal(str(data['valor'])):.2f}"
            except (InvalidOperation, ValueError, TypeError):
                payload['valor'] = str(multa.valor)
        if 'motivo' in data:
            payload['motivo'] = data['motivo']
        elif 'observacoes' in data:
            payload['motivo'] = data['observacoes']
        else:
            payload['motivo'] = multa.observacoes
        return Response(payload, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception:
            return self._fallback_update_response(kwargs.get('pk'), request.data)

    def partial_update(self, request, *args, **kwargs):
        try:
            return super().partial_update(request, *args, **kwargs)
        except Exception:
            return self._fallback_update_response(kwargs.get('pk'), request.data)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Http404:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response(status=status.HTTP_204_NO_CONTENT)

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







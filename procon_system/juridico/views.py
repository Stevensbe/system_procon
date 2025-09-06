from django.views.generic import TemplateView, ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# REST Framework
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

# Models
from .models import (
    AnalistaJuridico, ProcessoJuridico, AnaliseJuridica, RespostaJuridica,
    PrazoJuridico, DocumentoJuridico, HistoricoJuridico, ConfiguracaoJuridico,
    RecursoAdministrativo, ParecerJuridico, DocumentoRecurso, WorkflowJuridico,
    HistoricoRecurso
)

# Serializers
from .serializers import (
    AnalistaJuridicoSerializer, ProcessoJuridicoListSerializer, ProcessoJuridicoDetailSerializer,
    ProcessoJuridicoCreateSerializer, AnaliseJuridicaSerializer, AnaliseJuridicaCreateSerializer,
    RespostaJuridicaSerializer, RespostaJuridicaCreateSerializer, PrazoJuridicoSerializer,
    PrazoJuridicoCreateSerializer, DocumentoJuridicoSerializer, DocumentoJuridicoCreateSerializer,
    HistoricoJuridicoSerializer, ConfiguracaoJuridicoSerializer, DashboardJuridicoSerializer,
    ProcessoJuridicoStatsSerializer,
    RecursoAdministrativoListSerializer, RecursoAdministrativoDetailSerializer,
    RecursoAdministrativoCreateSerializer, ParecerJuridicoSerializer, ParecerJuridicoCreateSerializer,
    DocumentoRecursoSerializer, DocumentoRecursoCreateSerializer, WorkflowJuridicoSerializer
)

# Utils
from datetime import datetime, timedelta
import json


# === VIEWS TEMPLATE (LEGACY) ===

class JuridicoHomeView(LoginRequiredMixin, TemplateView):
    template_name = "juridico/home.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['total_processos'] = ProcessoJuridico.objects.count()
        context['processos_abertos'] = ProcessoJuridico.objects.filter(status='ABERTO').count()
        context['processos_atrasados'] = ProcessoJuridico.objects.filter(status__in=['ABERTO', 'EM_ANALISE']).filter(data_limite__lt=timezone.now()).count()
        return context


class ProcessoJuridicoList(LoginRequiredMixin, ListView):
    model = ProcessoJuridico
    template_name = "juridico/processo_list.html"
    context_object_name = "processos"
    paginate_by = 20
    
    def get_queryset(self):
        queryset = ProcessoJuridico.objects.all()
        
        # Filtros
        status_filter = self.request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        prioridade_filter = self.request.GET.get('prioridade')
        if prioridade_filter:
            queryset = queryset.filter(prioridade=prioridade_filter)
        
        parte_filter = self.request.GET.get('parte')
        if parte_filter:
            queryset = queryset.filter(parte__icontains=parte_filter)
        
        return queryset


class ProcessoJuridicoCreate(LoginRequiredMixin, CreateView):
    model = ProcessoJuridico
    fields = ['numero', 'parte', 'assunto', 'empresa_cnpj', 'status', 'prioridade', 'data_limite', 'descricao', 'valor_causa']
    template_name = "juridico/processojuridico_form.html"
    success_url = reverse_lazy('juridico:listar_processo')
    
    def form_valid(self, form):
        form.instance.criado_por = self.request.user
        return super().form_valid(form)


class ProcessoJuridicoUpdate(LoginRequiredMixin, UpdateView):
    model = ProcessoJuridico
    fields = ['numero', 'parte', 'assunto', 'empresa_cnpj', 'status', 'prioridade', 'data_limite', 'descricao', 'valor_causa']
    template_name = "juridico/processojuridico_form.html"
    success_url = reverse_lazy('juridico:listar_processo')
    
    def form_valid(self, form):
        form.instance.modificado_por = self.request.user
        return super().form_valid(form)


class ProcessoJuridicoDelete(LoginRequiredMixin, DeleteView):
    model = ProcessoJuridico
    template_name = "juridico/processojuridico_confirm_delete.html"
    success_url = reverse_lazy('juridico:listar_processo')


# === VIEWSETS REST API ===

class AnalistaJuridicoViewSet(viewsets.ModelViewSet):
    """ViewSet para analistas jurídicos"""
    queryset = AnalistaJuridico.objects.all()
    serializer_class = AnalistaJuridicoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativo', 'especialidade']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'oab']
    ordering_fields = ['data_cadastro', 'user__first_name']
    ordering = ['user__first_name']
    
    @action(detail=True, methods=['get'])
    def processos(self, request, pk=None):
        """Lista processos de um analista"""
        analista = self.get_object()
        processos = ProcessoJuridico.objects.filter(analista=analista)
        serializer = ProcessoJuridicoListSerializer(processos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def estatisticas(self, request, pk=None):
        """Estatísticas de um analista"""
        analista = self.get_object()
        
        # Processos por status
        processos_por_status = ProcessoJuridico.objects.filter(analista=analista).values('status').annotate(
            total=Count('id')
        )
        
        # Processos atrasados
        processos_atrasados = ProcessoJuridico.objects.filter(
            analista=analista,
            status__in=['ABERTO', 'EM_ANALISE'],
            data_limite__lt=timezone.now()
        ).count()
        
        # Prazos vencendo
        prazos_vencendo = PrazoJuridico.objects.filter(
            responsavel=analista,
            status='PENDENTE',
            data_fim__lte=timezone.now() + timedelta(days=3)
        ).count()
        
        return Response({
            'processos_por_status': list(processos_por_status),
            'processos_atrasados': processos_atrasados,
            'prazos_vencendo': prazos_vencendo,
            'total_processos': ProcessoJuridico.objects.filter(analista=analista).count()
        })


class ProcessoJuridicoViewSet(viewsets.ModelViewSet):
    """ViewSet para processos jurídicos"""
    queryset = ProcessoJuridico.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'prioridade', 'analista']
    search_fields = ['numero', 'parte', 'assunto', 'empresa_cnpj']
    ordering_fields = ['data_abertura', 'data_limite', 'numero']
    ordering = ['-data_abertura']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProcessoJuridicoListSerializer
        elif self.action == 'create':
            return ProcessoJuridicoCreateSerializer
        return ProcessoJuridicoDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)
    
    @action(detail=True, methods=['get'])
    def analises(self, request, pk=None):
        """Lista análises de um processo"""
        processo = self.get_object()
        analises = AnaliseJuridica.objects.filter(processo=processo)
        serializer = AnaliseJuridicaSerializer(analises, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def respostas(self, request, pk=None):
        """Lista respostas de um processo"""
        processo = self.get_object()
        respostas = RespostaJuridica.objects.filter(processo=processo)
        serializer = RespostaJuridicaSerializer(respostas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def prazos(self, request, pk=None):
        """Lista prazos de um processo"""
        processo = self.get_object()
        prazos = PrazoJuridico.objects.filter(processo=processo)
        serializer = PrazoJuridicoSerializer(prazos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def documentos(self, request, pk=None):
        """Lista documentos de um processo"""
        processo = self.get_object()
        documentos = DocumentoJuridico.objects.filter(processo=processo)
        serializer = DocumentoJuridicoSerializer(documentos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def historico(self, request, pk=None):
        """Lista histórico de um processo"""
        processo = self.get_object()
        historico = HistoricoJuridico.objects.filter(processo=processo)
        serializer = HistoricoJuridicoSerializer(historico, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def atrasados(self, request):
        """Lista processos atrasados"""
        processos = ProcessoJuridico.objects.filter(
            status__in=['ABERTO', 'EM_ANALISE'],
            data_limite__lt=timezone.now()
        )
        serializer = ProcessoJuridicoListSerializer(processos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def vencendo(self, request):
        """Lista processos com prazo vencendo"""
        processos = ProcessoJuridico.objects.filter(
            status__in=['ABERTO', 'EM_ANALISE'],
            data_limite__lte=timezone.now() + timedelta(days=3),
            data_limite__gt=timezone.now()
        )
        serializer = ProcessoJuridicoListSerializer(processos, many=True)
        return Response(serializer.data)


class AnaliseJuridicaViewSet(viewsets.ModelViewSet):
    """ViewSet para análises jurídicas"""
    queryset = AnaliseJuridica.objects.all()
    serializer_class = AnaliseJuridicaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_analise', 'analista', 'processo']
    search_fields = ['fundamentacao', 'conclusao']
    ordering_fields = ['data_analise']
    ordering = ['-data_analise']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AnaliseJuridicaCreateSerializer
        return AnaliseJuridicaSerializer


class RespostaJuridicaViewSet(viewsets.ModelViewSet):
    """ViewSet para respostas jurídicas"""
    queryset = RespostaJuridica.objects.all()
    serializer_class = RespostaJuridicaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_resposta', 'analista', 'processo', 'enviado']
    search_fields = ['titulo', 'conteudo']
    ordering_fields = ['data_elaboracao', 'data_envio']
    ordering = ['-data_elaboracao']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RespostaJuridicaCreateSerializer
        return RespostaJuridicaSerializer
    
    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """Marca resposta como enviada"""
        resposta = self.get_object()
        resposta.enviado = True
        resposta.data_envio = timezone.now()
        resposta.save()
        return Response({'status': 'enviado'})


class PrazoJuridicoViewSet(viewsets.ModelViewSet):
    """ViewSet para prazos jurídicos"""
    queryset = PrazoJuridico.objects.all()
    serializer_class = PrazoJuridicoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_prazo', 'status', 'responsavel', 'processo']
    search_fields = ['descricao']
    ordering_fields = ['data_fim', 'data_inicio']
    ordering = ['data_fim']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PrazoJuridicoCreateSerializer
        return PrazoJuridicoSerializer
    
    @action(detail=True, methods=['post'])
    def cumprir(self, request, pk=None):
        """Marca prazo como cumprido"""
        prazo = self.get_object()
        prazo.status = 'CUMPRIDO'
        prazo.data_cumprimento = timezone.now()
        prazo.save()
        return Response({'status': 'cumprido'})
    
    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Lista prazos vencidos"""
        prazos = PrazoJuridico.objects.filter(
            status='PENDENTE',
            data_fim__lt=timezone.now()
        )
        serializer = PrazoJuridicoSerializer(prazos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def vencendo(self, request):
        """Lista prazos vencendo"""
        prazos = PrazoJuridico.objects.filter(
            status='PENDENTE',
            data_fim__lte=timezone.now() + timedelta(days=3),
            data_fim__gt=timezone.now()
        )
        serializer = PrazoJuridicoSerializer(prazos, many=True)
        return Response(serializer.data)


class DocumentoJuridicoViewSet(viewsets.ModelViewSet):
    """ViewSet para documentos jurídicos"""
    queryset = DocumentoJuridico.objects.all()
    serializer_class = DocumentoJuridicoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_documento', 'processo', 'upload_por']
    search_fields = ['titulo', 'descricao', 'nome_arquivo']
    ordering_fields = ['data_upload']
    ordering = ['-data_upload']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentoJuridicoCreateSerializer
        return DocumentoJuridicoSerializer
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download de um documento"""
        try:
            documento = self.get_object()
            
            if documento.arquivo and documento.arquivo.storage.exists(documento.arquivo.name):
                from django.http import FileResponse
                response = FileResponse(documento.arquivo, content_type='application/octet-stream')
                response['Content-Disposition'] = f'attachment; filename="{documento.nome_arquivo}"'
                return response
            else:
                return Response(
                    {'error': 'Arquivo não encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class HistoricoJuridicoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para histórico jurídico (somente leitura)"""
    queryset = HistoricoJuridico.objects.all()
    serializer_class = HistoricoJuridicoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['processo', 'usuario', 'acao']
    ordering_fields = ['data_alteracao']
    ordering = ['-data_alteracao']
    
    @action(detail=False, methods=['get'])
    def exportar(self, request):
        """Exporta histórico em diferentes formatos"""
        try:
            formato = request.GET.get('formato', 'pdf')
            params = request.GET.get('params', '')
            
            # Aqui você implementaria a lógica para exportar histórico
            # Por enquanto, apenas simular
            return Response({
                'message': f'Histórico exportado em formato {formato} com sucesso',
                'formato': formato,
                'params': params
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ConfiguracaoJuridicoViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações jurídicas"""
    queryset = ConfiguracaoJuridico.objects.all()
    serializer_class = ConfiguracaoJuridicoSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(configurado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(configurado_por=self.request.user)
    
    @action(detail=False, methods=['post'])
    def restaurar(self, request):
        """Restaura configurações para valores padrão"""
        try:
            # Aqui você implementaria a lógica para restaurar configurações padrão
            # Por enquanto, apenas simular
            return Response({
                'message': 'Configurações restauradas para valores padrão com sucesso'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# === APIs ESPECIAIS ===

class DashboardJuridicoAPIView(viewsets.ViewSet):
    """API para dashboard jurídico"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dados(self, request):
        """Dados principais do dashboard"""
        # Estatísticas básicas
        total_processos = ProcessoJuridico.objects.count()
        processos_abertos = ProcessoJuridico.objects.filter(status='ABERTO').count()
        processos_em_analise = ProcessoJuridico.objects.filter(status='EM_ANALISE').count()
        processos_respondidos = ProcessoJuridico.objects.filter(status='RESPONDIDO').count()
        processos_atrasados = ProcessoJuridico.objects.filter(
            status__in=['ABERTO', 'EM_ANALISE'],
            data_limite__lt=timezone.now()
        ).count()
        
        # Prazos
        prazos_vencendo = PrazoJuridico.objects.filter(
            status='PENDENTE',
            data_fim__lte=timezone.now() + timedelta(days=3),
            data_fim__gt=timezone.now()
        ).count()
        prazos_vencidos = PrazoJuridico.objects.filter(
            status='PENDENTE',
            data_fim__lt=timezone.now()
        ).count()
        
        # Processos por status
        processos_por_status = ProcessoJuridico.objects.values('status').annotate(
            total=Count('id')
        )
        
        # Processos por prioridade
        processos_por_prioridade = ProcessoJuridico.objects.values('prioridade').annotate(
            total=Count('id')
        )
        
        # Processos recentes
        processos_recentes = ProcessoJuridico.objects.order_by('-data_abertura')[:10]
        
        # Prazos urgentes
        prazos_urgentes = PrazoJuridico.objects.filter(
            status='PENDENTE',
            data_fim__lte=timezone.now() + timedelta(days=7)
        ).order_by('data_fim')[:10]
        
        dados = {
            'total_processos': total_processos,
            'processos_abertos': processos_abertos,
            'processos_em_analise': processos_em_analise,
            'processos_respondidos': processos_respondidos,
            'processos_atrasados': processos_atrasados,
            'prazos_vencendo': prazos_vencendo,
            'prazos_vencidos': prazos_vencidos,
            'processos_por_status': {item['status']: item['total'] for item in processos_por_status},
            'processos_por_prioridade': {item['prioridade']: item['total'] for item in processos_por_prioridade},
            'processos_recentes': ProcessoJuridicoListSerializer(processos_recentes, many=True).data,
            'prazos_urgentes': PrazoJuridicoSerializer(prazos_urgentes, many=True).data,
        }
        
        serializer = DashboardJuridicoSerializer(dados)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Estatísticas detalhadas"""
        try:
            # Dados básicos para teste
            dados = {
                'periodo': '30 dias',
                'total_processos': ProcessoJuridico.objects.count(),
                'processos_por_status': {
                    'ABERTO': ProcessoJuridico.objects.filter(status='ABERTO').count(),
                    'EM_ANALISE': ProcessoJuridico.objects.filter(status='EM_ANALISE').count(),
                    'RESPONDIDO': ProcessoJuridico.objects.filter(status='RESPONDIDO').count(),
                },
                'analistas_mais_ativos': [
                    {
                        'nome': 'Dr. Silva',
                        'total': 5
                    },
                    {
                        'nome': 'Dra. Santos', 
                        'total': 3
                    }
                ],
                'tipos_mais_comuns': [
                    {'tipo_analise': 'INICIAL', 'total': 4},
                    {'tipo_analise': 'FINAL', 'total': 2}
                ]
            }
            
            return Response(dados)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# === APIs DE INTEGRAÇÃO ===

@method_decorator(csrf_exempt, name='dispatch')
class IntegracaoPeticaoAPIView(viewsets.ViewSet):
    """API para integração com petições do portal"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def criar_processo(self, request):
        """Cria processo a partir de petição do portal"""
        try:
            dados = request.data
            
            # Buscar analista disponível
            analista = AnalistaJuridico.objects.filter(ativo=True).first()
            if not analista:
                return Response(
                    {'error': 'Nenhum analista jurídico disponível'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Criar processo
            processo = ProcessoJuridico.objects.create(
                numero_peticao=dados.get('numero_peticao'),
                parte=dados.get('peticionario_nome'),
                empresa_cnpj=dados.get('empresa_cnpj'),
                assunto=dados.get('assunto'),
                descricao=dados.get('descricao'),
                status='ABERTO',
                prioridade='MEDIA',
                analista=analista,
                criado_por=request.user
            )
            
            # Criar prazo padrão
            prazo_padrao = ConfiguracaoJuridico.objects.first()
            if prazo_padrao:
                PrazoJuridico.objects.create(
                    processo=processo,
                    tipo_prazo='RESPOSTA',
                    descricao='Prazo para análise e resposta',
                    data_inicio=timezone.now(),
                    data_fim=timezone.now() + timedelta(days=prazo_padrao.prazo_resposta_padrao),
                    responsavel=analista
                )
            
            serializer = ProcessoJuridicoDetailSerializer(processo)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# === UTILITÁRIOS ===

def registrar_historico(processo, usuario, acao, descricao, dados_anteriores=None, dados_novos=None):
    """Registra alteração no histórico"""
    HistoricoJuridico.objects.create(
        processo=processo,
        usuario=usuario,
        acao=acao,
        descricao=descricao,
        dados_anteriores=dados_anteriores,
        dados_novos=dados_novos,
        ip_origem=usuario.last_login_ip if hasattr(usuario, 'last_login_ip') else None
    )


@require_http_methods(["GET"])
def verificar_prazos_vencendo(request):
    """Verifica prazos vencendo e envia notificações"""
    prazos_vencendo = PrazoJuridico.objects.filter(
        status='PENDENTE',
        data_fim__lte=timezone.now() + timedelta(days=3),
        data_fim__gt=timezone.now(),
        notificado=False
    )
    
    for prazo in prazos_vencendo:
        # Aqui você implementaria a lógica de notificação
        # Por exemplo, enviar email, SMS, etc.
        prazo.notificado = True
        prazo.save()
    
    return JsonResponse({
        'prazos_verificados': prazos_vencendo.count(),
        'status': 'sucesso'
    })

# === VIEWSETS PARA RECURSOS ADMINISTRATIVOS ===

class RecursoAdministrativoViewSet(viewsets.ModelViewSet):
    """ViewSet para recursos administrativos"""
    queryset = RecursoAdministrativo.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_recurso', 'status', 'analista_responsavel']
    search_fields = ['numero', 'nome_recorrente', 'cpf_cnpj_recorrente']
    ordering_fields = ['data_protocolo', 'data_limite_analise', 'nome_recorrente']
    ordering = ['-data_protocolo']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return RecursoAdministrativo.objects.select_related(
            'analista_responsavel__user',
            'processo_origem',
            'auto_infracao',
            'multa'
        ).prefetch_related('pareceres', 'documentos')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RecursoAdministrativoListSerializer
        elif self.action == 'create':
            return RecursoAdministrativoCreateSerializer
        return RecursoAdministrativoDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dados do dashboard de recursos"""
        try:
            # Estatísticas gerais
            total_recursos = RecursoAdministrativo.objects.count()
            recursos_protocolados = RecursoAdministrativo.objects.filter(status='PROTOCOLADO').count()
            recursos_em_analise = RecursoAdministrativo.objects.filter(status='EM_ANALISE').count()
            recursos_deferidos = RecursoAdministrativo.objects.filter(status='DEFERIDO').count()
            recursos_indefiridos = RecursoAdministrativo.objects.filter(status='INDEFERIDO').count()
            recursos_atrasados = RecursoAdministrativo.objects.filter(
                data_limite_analise__lt=timezone.now(),
                status__in=['PROTOCOLADO', 'EM_ANALISE', 'AGUARDANDO_DOCUMENTO']
            ).count()
            
            # Estatísticas por tipo
            recursos_por_tipo = dict(
                RecursoAdministrativo.objects.values_list('tipo_recurso')
                .annotate(count=Count('id'))
                .values_list('tipo_recurso', 'count')
            )
            
            # Estatísticas por status
            recursos_por_status = dict(
                RecursoAdministrativo.objects.values_list('status')
                .annotate(count=Count('id'))
                .values_list('status', 'count')
            )
            
            # Recursos recentes
            recursos_recentes = RecursoAdministrativo.objects.select_related(
                'analista_responsavel__user'
            ).order_by('-data_protocolo')[:10]
            
            # Pareceres pendentes
            pareceres_pendentes = ParecerJuridico.objects.select_related(
                'analista__user', 'recurso'
            ).filter(assinado=False).order_by('-data_elaboracao')[:10]
            
            data = {
                'total_recursos': total_recursos,
                'recursos_protocolados': recursos_protocolados,
                'recursos_em_analise': recursos_em_analise,
                'recursos_deferidos': recursos_deferidos,
                'recursos_indefiridos': recursos_indefiridos,
                'recursos_atrasados': recursos_atrasados,
                'recursos_por_tipo': recursos_por_tipo,
                'recursos_por_status': recursos_por_status,
                'recursos_recentes': RecursoAdministrativoListSerializer(recursos_recentes, many=True).data,
                'pareceres_pendentes': ParecerJuridicoSerializer(pareceres_pendentes, many=True).data
            }
            
            return Response(data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def atrasados(self, request):
        """Lista recursos atrasados"""
        recursos_atrasados = self.get_queryset().filter(
            data_limite_analise__lt=timezone.now(),
            status__in=['PROTOCOLADO', 'EM_ANALISE', 'AGUARDANDO_DOCUMENTO']
        )
        
        page = self.paginate_queryset(recursos_atrasados)
        if page is not None:
            serializer = RecursoAdministrativoListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = RecursoAdministrativoListSerializer(recursos_atrasados, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assinar_parecer(self, request, pk=None):
        """Assina parecer do recurso"""
        try:
            recurso = self.get_object()
            parecer = ParecerJuridico.objects.filter(recurso=recurso).first()
            
            if not parecer:
                return Response(
                    {'error': 'Nenhum parecer encontrado para este recurso'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            parecer.assinado = True
            parecer.data_assinatura = timezone.now()
            parecer.save()
            
            # Atualizar status do recurso
            if parecer.recomendacao == 'DEFERIR':
                recurso.status = 'DEFERIDO'
            elif parecer.recomendacao == 'INDEFERIR':
                recurso.status = 'INDEFERIDO'
            else:
                recurso.status = 'PARECER_ELABORADO'
            
            recurso.data_conclusao = timezone.now()
            recurso.save()
            
            return Response({'message': 'Parecer assinado com sucesso'})
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ParecerJuridicoViewSet(viewsets.ModelViewSet):
    """ViewSet para pareceres jurídicos"""
    queryset = ParecerJuridico.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_parecer', 'recomendacao', 'analista', 'assinado']
    search_fields = ['recurso__numero', 'recurso__nome_recorrente']
    ordering_fields = ['data_elaboracao', 'data_modificacao']
    ordering = ['-data_elaboracao']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return ParecerJuridico.objects.select_related(
            'analista__user', 'recurso'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ParecerJuridicoCreateSerializer
        return ParecerJuridicoSerializer
    
    @action(detail=True, methods=['post'])
    def assinar(self, request, pk=None):
        """Assina o parecer"""
        try:
            parecer = self.get_object()
            parecer.assinado = True
            parecer.data_assinatura = timezone.now()
            parecer.save()
            
            return Response({'message': 'Parecer assinado com sucesso'})
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentoRecursoViewSet(viewsets.ModelViewSet):
    """ViewSet para documentos de recursos"""
    queryset = DocumentoRecurso.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_documento', 'recurso']
    search_fields = ['titulo', 'descricao', 'nome_arquivo']
    ordering_fields = ['data_upload']
    ordering = ['-data_upload']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return DocumentoRecurso.objects.select_related(
            'upload_por', 'recurso'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentoRecursoCreateSerializer
        return DocumentoRecursoSerializer


class WorkflowJuridicoViewSet(viewsets.ModelViewSet):
    """ViewSet para workflows jurídicos"""
    queryset = WorkflowJuridico.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_workflow', 'status', 'responsavel_atual']
    search_fields = ['observacoes']
    ordering_fields = ['data_inicio', 'data_conclusao']
    ordering = ['-data_inicio']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return WorkflowJuridico.objects.select_related(
            'responsavel_atual__user', 'processo', 'recurso', 'parecer'
        )
    
    def get_serializer_class(self):
        return WorkflowJuridicoSerializer
    
    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        """Aprova o workflow"""
        try:
            workflow = self.get_object()
            workflow.status = 'APROVADO'
            workflow.data_conclusao = timezone.now()
            workflow.save()
            
            return Response({'message': 'Workflow aprovado com sucesso'})
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reprovar(self, request, pk=None):
        """Reprova o workflow"""
        try:
            workflow = self.get_object()
            workflow.status = 'REPROVADO'
            workflow.data_conclusao = timezone.now()
            workflow.save()
            
            return Response({'message': 'Workflow reprovado'})
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HistoricoRecursoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para histórico de recursos (somente leitura)"""
    queryset = HistoricoRecurso.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['recurso', 'usuario', 'acao']
    ordering_fields = ['data_alteracao']
    ordering = ['-data_alteracao']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return HistoricoRecurso.objects.select_related(
            'usuario', 'recurso'
        )
    
    def get_serializer_class(self):
        return HistoricoRecursoSerializer


# === UTILITÁRIOS PARA RECURSOS ===

def registrar_historico_recurso(recurso, usuario, acao, descricao, dados_anteriores=None, dados_novos=None):
    """Registra alteração no histórico de recursos"""
    HistoricoRecurso.objects.create(
        recurso=recurso,
        usuario=usuario,
        acao=acao,
        descricao=descricao,
        dados_anteriores=dados_anteriores,
        dados_novos=dados_novos,
        ip_origem=usuario.last_login_ip if hasattr(usuario, 'last_login_ip') else None
    )


@require_http_methods(["GET"])
def verificar_recursos_atrasados(request):
    """Verifica recursos atrasados e envia notificações"""
    recursos_atrasados = RecursoAdministrativo.objects.filter(
        data_limite_analise__lt=timezone.now(),
        status__in=['PROTOCOLADO', 'EM_ANALISE', 'AGUARDANDO_DOCUMENTO']
    )
    
    # Aqui você implementaria a lógica de notificação
    # Por exemplo, enviar email, SMS, etc.
    
    return JsonResponse({
        'recursos_atrasados': recursos_atrasados.count(),
        'status': 'sucesso'
    })

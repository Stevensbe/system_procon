from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.utils import timezone

from .models import (
    TipoFiscalizacao, EvidenciaFiscalizacao, AutoInfracaoAvancado,
    HistoricoAutoInfracao, TemplateAutoInfracao, NotificacaoEletronica,
    ConfiguracaoFiscalizacao, AutoInfracao
)
from .serializers import (
    TipoFiscalizacaoSerializer, EvidenciaFiscalizacaoSerializer,
    EvidenciaFiscalizacaoCreateSerializer, AutoInfracaoAvancadoSerializer,
    AutoInfracaoAvancadoCreateSerializer, HistoricoAutoInfracaoSerializer,
    TemplateAutoInfracaoSerializer, TemplateAutoInfracaoCreateSerializer,
    NotificacaoEletronicaSerializer, NotificacaoEletronicaCreateSerializer,
    ConfiguracaoFiscalizacaoSerializer, DashboardFiscalizacaoAvancadoSerializer,
    AutoInfracaoSerializer, GerarAutoAutomaticoSerializer, AssinarAutoSerializer,
    NotificarAutoSerializer, UploadEvidenciaSerializer
)


class TipoFiscalizacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de fiscalização"""
    queryset = TipoFiscalizacao.objects.all()
    serializer_class = TipoFiscalizacaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'ativo']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
    ordering = ['nome']
    pagination_class = PageNumberPagination


class EvidenciaFiscalizacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para evidências de fiscalização"""
    queryset = EvidenciaFiscalizacao.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'auto_infracao', 'upload_por']
    search_fields = ['titulo', 'descricao']
    ordering_fields = ['data_upload', 'titulo']
    ordering = ['-data_upload']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return EvidenciaFiscalizacao.objects.select_related(
            'auto_infracao', 'upload_por'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EvidenciaFiscalizacaoCreateSerializer
        return EvidenciaFiscalizacaoSerializer
    
    def perform_create(self, serializer):
        serializer.save(upload_por=self.request.user)


class AutoInfracaoAvancadoViewSet(viewsets.ModelViewSet):
    """ViewSet para autos de infração avançados"""
    queryset = AutoInfracaoAvancado.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status_workflow', 'gerado_automaticamente', 'assinatura_digital', 'notificacao_eletronica']
    search_fields = ['auto_infracao__numero', 'template_utilizado']
    ordering_fields = ['data_modificacao', 'data_geracao']
    ordering = ['-data_modificacao']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return AutoInfracaoAvancado.objects.select_related(
            'auto_infracao', 'gerado_por', 'assinado_por', 'modificado_por'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AutoInfracaoAvancadoCreateSerializer
        return AutoInfracaoAvancadoSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            gerado_por=self.request.user,
            modificado_por=self.request.user
        )
    
    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assinar(self, request, pk=None):
        """Assinar auto de infração digitalmente"""
        auto_avancado = self.get_object()
        
        serializer = AssinarAutoSerializer(data=request.data)
        if serializer.is_valid():
            # Simular assinatura digital
            auto_avancado.assinatura_digital = True
            auto_avancado.certificado_assinatura = serializer.validated_data.get('certificado', 'Certificado Padrão')
            auto_avancado.data_assinatura = timezone.now()
            auto_avancado.assinado_por = request.user
            auto_avancado.status_workflow = 'ASSINADO'
            auto_avancado.save()
            
            # Registrar no histórico
            HistoricoAutoInfracao.objects.create(
                auto_infracao=auto_avancado.auto_infracao,
                usuario=request.user,
                acao='ASSINATURA_DIGITAL',
                descricao=f'Auto assinado digitalmente por {request.user.get_full_name()}',
                ip_origem=request.META.get('REMOTE_ADDR', '')
            )
            
            return Response({'message': 'Auto assinado com sucesso'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def notificar(self, request, pk=None):
        """Notificar auto de infração"""
        auto_avancado = self.get_object()
        
        serializer = NotificarAutoSerializer(data=request.data)
        if serializer.is_valid():
            # Criar notificação
            notificacao = NotificacaoEletronica.objects.create(
                auto_infracao=auto_avancado.auto_infracao,
                tipo=serializer.validated_data['tipo_notificacao'],
                destinatario=serializer.validated_data['destinatario'],
                assunto=serializer.validated_data['assunto'],
                mensagem=serializer.validated_data.get('mensagem', ''),
                enviado_por=request.user
            )
            
            # Atualizar auto avançado
            auto_avancado.notificacao_eletronica = True
            auto_avancado.email_notificacao = serializer.validated_data['destinatario']
            auto_avancado.data_notificacao = timezone.now()
            auto_avancado.status_workflow = 'NOTIFICADO'
            auto_avancado.calcular_prazos()
            auto_avancado.save()
            
            # Registrar no histórico
            HistoricoAutoInfracao.objects.create(
                auto_infracao=auto_avancado.auto_infracao,
                usuario=request.user,
                acao='NOTIFICACAO_ELETRONICA',
                descricao=f'Auto notificado eletronicamente via {serializer.validated_data["tipo_notificacao"]}',
                ip_origem=request.META.get('REMOTE_ADDR', '')
            )
            
            return Response({
                'message': 'Auto notificado com sucesso',
                'notificacao_id': notificacao.id
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def atrasados(self, request):
        """Listar autos atrasados"""
        autos_atrasados = AutoInfracaoAvancado.objects.filter(
            Q(esta_atrasado_defesa=True) | Q(esta_atrasado_pagamento=True)
        ).select_related('auto_infracao')
        
        serializer = self.get_serializer(autos_atrasados, many=True)
        return Response(serializer.data)


class HistoricoAutoInfracaoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para histórico de autos de infração"""
    queryset = HistoricoAutoInfracao.objects.all()
    serializer_class = HistoricoAutoInfracaoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['auto_infracao', 'usuario', 'acao']
    search_fields = ['acao', 'descricao']
    ordering_fields = ['data_acao']
    ordering = ['-data_acao']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return HistoricoAutoInfracao.objects.select_related(
            'auto_infracao', 'usuario'
        )


class TemplateAutoInfracaoViewSet(viewsets.ModelViewSet):
    """ViewSet para templates de autos de infração"""
    queryset = TemplateAutoInfracao.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_fiscalizacao', 'ativo', 'padrao']
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'data_criacao']
    ordering = ['nome']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return TemplateAutoInfracao.objects.select_related(
            'tipo_fiscalizacao', 'criado_por'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TemplateAutoInfracaoCreateSerializer
        return TemplateAutoInfracaoSerializer
    
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def definir_padrao(self, request, pk=None):
        """Definir template como padrão"""
        template = self.get_object()
        template.padrao = True
        template.save()
        return Response({'message': 'Template definido como padrão'})


class NotificacaoEletronicaViewSet(viewsets.ModelViewSet):
    """ViewSet para notificações eletrônicas"""
    queryset = NotificacaoEletronica.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'status', 'auto_infracao', 'enviado_por']
    search_fields = ['destinatario', 'assunto']
    ordering_fields = ['data_criacao', 'data_envio']
    ordering = ['-data_criacao']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        return NotificacaoEletronica.objects.select_related(
            'auto_infracao', 'enviado_por'
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificacaoEletronicaCreateSerializer
        return NotificacaoEletronicaSerializer
    
    def perform_create(self, serializer):
        serializer.save(enviado_por=self.request.user)
    
    @action(detail=True, methods=['post'])
    def reenviar(self, request, pk=None):
        """Reenviar notificação"""
        notificacao = self.get_object()
        
        # Simular reenvio
        notificacao.gerar_protocolo()
        notificacao.marcar_enviada()
        
        return Response({'message': 'Notificação reenviada com sucesso'})


class ConfiguracaoFiscalizacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações de fiscalização"""
    queryset = ConfiguracaoFiscalizacao.objects.all()
    serializer_class = ConfiguracaoFiscalizacaoSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(configurado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(configurado_por=self.request.user)


# === VIEWS PARA DASHBOARD AVANÇADO ===

class DashboardFiscalizacaoAvancadoAPIView(APIView):
    """API para dashboard avançado de fiscalização"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Estatísticas gerais
        total_autos = AutoInfracao.objects.count()
        autos_pendentes = AutoInfracao.objects.filter(status='autuado').count()
        autos_notificados = AutoInfracao.objects.filter(status='notificado').count()
        autos_em_defesa = AutoInfracao.objects.filter(status='em_defesa').count()
        autos_pagos = AutoInfracao.objects.filter(status='pago').count()
        
        # Autos atrasados
        autos_atrasados = AutoInfracaoAvancado.objects.filter(
            Q(esta_atrasado_defesa=True) | Q(esta_atrasado_pagamento=True)
        ).count()
        
        # Estatísticas por tipo (simulado)
        autos_por_tipo = {
            'Fiscalização Presencial': 45,
            'Fiscalização Remota': 23,
            'Denúncia': 12,
            'Ação Preventiva': 8,
        }
        
        # Estatísticas por status
        autos_por_status = {}
        for status, _ in AutoInfracao.STATUS_CHOICES:
            count = AutoInfracao.objects.filter(status=status).count()
            if count > 0:
                autos_por_status[status] = count
        
        # Autos recentes
        autos_recentes = AutoInfracao.objects.select_related(
            'fiscal_nome'
        ).order_by('-data_fiscalizacao')[:10]
        
        # Autos atrasados
        autos_atrasados_lista = AutoInfracaoAvancado.objects.filter(
            Q(esta_atrasado_defesa=True) | Q(esta_atrasado_pagamento=True)
        ).select_related('auto_infracao')[:5]
        
        # Evidências recentes
        evidencias_recentes = EvidenciaFiscalizacao.objects.select_related(
            'auto_infracao', 'upload_por'
        ).order_by('-data_upload')[:5]
        
        # Notificações pendentes
        notificacoes_pendentes = NotificacaoEletronica.objects.filter(
            status='PENDENTE'
        ).select_related('auto_infracao', 'enviado_por')[:5]
        
        data = {
            'total_autos': total_autos,
            'autos_pendentes': autos_pendentes,
            'autos_notificados': autos_notificados,
            'autos_em_defesa': autos_em_defesa,
            'autos_pagos': autos_pagos,
            'autos_atrasados': autos_atrasados,
            'autos_por_tipo': autos_por_tipo,
            'autos_por_status': autos_por_status,
            'autos_recentes': AutoInfracaoSerializer(autos_recentes, many=True).data,
            'autos_atrasados_lista': AutoInfracaoAvancadoSerializer(autos_atrasados_lista, many=True).data,
            'evidencias_recentes': EvidenciaFiscalizacaoSerializer(evidencias_recentes, many=True).data,
            'notificacoes_pendentes': NotificacaoEletronicaSerializer(notificacoes_pendentes, many=True).data,
        }
        
        serializer = DashboardFiscalizacaoAvancadoSerializer(data)
        return Response(serializer.data)


# === VIEWS PARA AÇÕES ESPECÍFICAS ===

class GerarAutoAutomaticoAPIView(APIView):
    """API para geração automática de autos de infração"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = GerarAutoAutomaticoSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Obter template
                template = TemplateAutoInfracao.objects.get(
                    id=serializer.validated_data['template_id']
                )
                
                # Criar auto de infração
                dados = serializer.validated_data['dados_estabelecimento']
                auto = AutoInfracao.objects.create(
                    razao_social=dados.get('razao_social', ''),
                    nome_fantasia=dados.get('nome_fantasia', ''),
                    atividade=dados.get('atividade', ''),
                    endereco=dados.get('endereco', ''),
                    cnpj=dados.get('cnpj', ''),
                    telefone=dados.get('telefone', ''),
                    data_fiscalizacao=dados.get('data_fiscalizacao', timezone.now().date()),
                    hora_fiscalizacao=dados.get('hora_fiscalizacao', timezone.now().time()),
                    municipio=dados.get('municipio', 'MANAUS'),
                    estado=dados.get('estado', 'AM'),
                    relatorio=serializer.validated_data.get('observacoes', ''),
                    base_legal_cdc=template.base_legal_padrao,
                    fundamentacao_tecnica=template.fundamentacao_padrao,
                    valor_multa=serializer.validated_data['valor_multa'],
                    responsavel_nome=dados.get('responsavel_nome', ''),
                    responsavel_cpf=dados.get('responsavel_cpf', ''),
                    fiscal_nome=request.user.get_full_name(),
                    fiscal_cargo='Agente de Fiscalização',
                    status='autuado'
                )
                
                # Criar auto avançado
                auto_avancado = AutoInfracaoAvancado.objects.create(
                    auto_infracao=auto,
                    gerado_automaticamente=True,
                    template_utilizado=template.nome,
                    gerado_por=request.user,
                    modificado_por=request.user,
                    status_workflow='RASCUNHO'
                )
                
                # Registrar no histórico
                HistoricoAutoInfracao.objects.create(
                    auto_infracao=auto,
                    usuario=request.user,
                    acao='GERACAO_AUTOMATICA',
                    descricao=f'Auto gerado automaticamente usando template: {template.nome}',
                    ip_origem=request.META.get('REMOTE_ADDR', '')
                )
                
                return Response({
                    'message': 'Auto gerado automaticamente com sucesso',
                    'auto_id': auto.id,
                    'auto_avancado_id': auto_avancado.id
                })
                
            except TemplateAutoInfracao.DoesNotExist:
                return Response(
                    {'error': 'Template não encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {'error': f'Erro ao gerar auto: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UploadEvidenciaAPIView(APIView):
    """API para upload de evidências"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = UploadEvidenciaSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Verificar se o auto existe
                auto = AutoInfracao.objects.get(
                    id=serializer.validated_data['auto_infracao']
                )
                
                # Criar evidência
                evidencia = EvidenciaFiscalizacao.objects.create(
                    auto_infracao=auto,
                    tipo=serializer.validated_data['tipo'],
                    titulo=serializer.validated_data['titulo'],
                    descricao=serializer.validated_data.get('descricao', ''),
                    arquivo=serializer.validated_data['arquivo'],
                    upload_por=request.user
                )
                
                return Response({
                    'message': 'Evidência enviada com sucesso',
                    'evidencia_id': evidencia.id
                })
                
            except AutoInfracao.DoesNotExist:
                return Response(
                    {'error': 'Auto de infração não encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {'error': f'Erro ao enviar evidência: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# === FUNÇÕES UTILITÁRIAS ===

def registrar_historico_auto(auto_infracao, usuario, acao, descricao, dados_anteriores=None, dados_novos=None, ip_origem=None):
    """Registra ação no histórico do auto de infração"""
    HistoricoAutoInfracao.objects.create(
        auto_infracao=auto_infracao,
        usuario=usuario,
        acao=acao,
        descricao=descricao,
        dados_anteriores=dados_anteriores,
        dados_novos=dados_novos,
        ip_origem=ip_origem
    )


def verificar_autos_atrasados():
    """Verifica autos atrasados e envia notificações"""
    autos_atrasados = AutoInfracaoAvancado.objects.filter(
        Q(esta_atrasado_defesa=True) | Q(esta_atrasado_pagamento=True)
    )
    
    for auto_avancado in autos_atrasados:
        # Criar notificação de atraso
        NotificacaoEletronica.objects.create(
            auto_infracao=auto_avancado.auto_infracao,
            tipo='EMAIL',
            destinatario=auto_avancado.email_notificacao or 'admin@procon.am.gov.br',
            assunto=f'Auto {auto_avancado.auto_infracao.numero} - Prazo Vencido',
            mensagem=f'O auto {auto_avancado.auto_infracao.numero} está com prazo vencido.',
            status='PENDENTE'
        )

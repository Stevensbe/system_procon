from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import (
    EvidenciaFotografica,
    AssinaturaDigital,
    NotificacaoEletronica,
    ControlePrazos,
    ConfiguracaoFiscalizacao,
    AutoBanco,
    AutoPosto,
    AutoSupermercado,
    AutoDiversos,
)
from .serializers import (
    EvidenciaFotograficaSerializer,
    AssinaturaDigitalSerializer,
    NotificacaoEletronicaSerializer,
    ControlePrazosSerializer,
    ConfiguracaoFiscalizacaoSerializer,
    DashboardFiscalizacaoAvancadoSerializer,
)


# --- VIEWS PARA EVIDÊNCIAS FOTOGRÁFICAS ---
class EvidenciaFotograficaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar evidências fotográficas de fiscalização
    """
    queryset = EvidenciaFotografica.objects.all()
    serializer_class = EvidenciaFotograficaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = EvidenciaFotografica.objects.all()
        
        # Filtros
        auto_id = self.request.query_params.get('auto_id')
        tipo_evidencia = self.request.query_params.get('tipo_evidencia')
        fiscal_id = self.request.query_params.get('fiscal_id')
        
        if auto_id:
            queryset = queryset.filter(
                Q(auto_id=auto_id) | 
                Q(auto_posto_id=auto_id) | 
                Q(auto_supermercado_id=auto_id) | 
                Q(auto_diversos_id=auto_id)
            )
        
        if tipo_evidencia:
            queryset = queryset.filter(tipo_evidencia=tipo_evidencia)
        
        if fiscal_id:
            queryset = queryset.filter(fiscal_upload_id=fiscal_id)
        
        return queryset.select_related('fiscal_upload')
    
    def perform_create(self, serializer):
        serializer.save(fiscal_upload=self.request.user)
    
    @action(detail=False, methods=['get'])
    def por_auto(self, request):
        """Lista evidências por auto de infração"""
        auto_id = request.query_params.get('auto_id')
        if not auto_id:
            return Response({'error': 'auto_id é obrigatório'}, status=400)
        
        evidencias = self.get_queryset().filter(
            Q(auto_id=auto_id) | 
            Q(auto_posto_id=auto_id) | 
            Q(auto_supermercado_id=auto_id) | 
            Q(auto_diversos_id=auto_id)
        )
        
        serializer = self.get_serializer(evidencias, many=True)
        return Response(serializer.data)


# --- VIEWS PARA ASSINATURA DIGITAL ---
class AssinaturaDigitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar assinaturas digitais
    """
    queryset = AssinaturaDigital.objects.all()
    serializer_class = AssinaturaDigitalSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = AssinaturaDigital.objects.all()
        
        # Filtros
        auto_id = self.request.query_params.get('auto_id')
        tipo_assinatura = self.request.query_params.get('tipo_assinatura')
        status = self.request.query_params.get('status')
        
        if auto_id:
            queryset = queryset.filter(
                Q(auto_id=auto_id) | 
                Q(auto_posto_id=auto_id) | 
                Q(auto_supermercado_id=auto_id) | 
                Q(auto_diversos_id=auto_id)
            )
        
        if tipo_assinatura:
            queryset = queryset.filter(tipo_assinatura=tipo_assinatura)
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def assinar(self, request, pk=None):
        """Realiza a assinatura digital"""
        assinatura = self.get_object()
        
        # Verifica se não está expirada
        if assinatura.is_expired():
            return Response({'error': 'Assinatura expirada'}, status=400)
        
        # Verifica se já não foi assinada
        if assinatura.status == 'assinado':
            return Response({'error': 'Assinatura já realizada'}, status=400)
        
        # Processa a assinatura
        assinatura.status = 'assinado'
        assinatura.data_assinatura = timezone.now()
        assinatura.ip_assinatura = self.get_client_ip(request)
        assinatura.user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Gera hash da assinatura (simulado)
        assinatura.hash_assinatura = f"hash_{assinatura.id}_{int(timezone.now().timestamp())}"
        
        assinatura.save()
        
        serializer = self.get_serializer(assinatura)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """Lista assinaturas pendentes"""
        assinaturas = self.get_queryset().filter(status='pendente')
        serializer = self.get_serializer(assinaturas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Lista assinaturas vencidas"""
        assinaturas = [a for a in self.get_queryset() if a.is_expired()]
        serializer = self.get_serializer(assinaturas, many=True)
        return Response(serializer.data)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# --- VIEWS PARA NOTIFICAÇÃO ELETRÔNICA ---
class NotificacaoEletronicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar notificações eletrônicas
    """
    queryset = NotificacaoEletronica.objects.all()
    serializer_class = NotificacaoEletronicaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = NotificacaoEletronica.objects.all()
        
        # Filtros
        auto_id = self.request.query_params.get('auto_id')
        tipo_notificacao = self.request.query_params.get('tipo_notificacao')
        status = self.request.query_params.get('status')
        
        if auto_id:
            queryset = queryset.filter(
                Q(auto_id=auto_id) | 
                Q(auto_posto_id=auto_id) | 
                Q(auto_supermercado_id=auto_id) | 
                Q(auto_diversos_id=auto_id)
            )
        
        if tipo_notificacao:
            queryset = queryset.filter(tipo_notificacao=tipo_notificacao)
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        """Envia a notificação eletrônica"""
        notificacao = self.get_object()
        
        # Verifica se já foi enviada
        if notificacao.status in ['enviada', 'entregue', 'lida']:
            return Response({'error': 'Notificação já enviada'}, status=400)
        
        # Verifica tentativas
        if notificacao.tentativas_envio >= notificacao.max_tentativas:
            notificacao.status = 'erro'
            notificacao.save()
            return Response({'error': 'Máximo de tentativas excedido'}, status=400)
        
        try:
            # Simula envio de email
            self.enviar_email(notificacao)
            
            notificacao.status = 'enviada'
            notificacao.data_envio = timezone.now()
            notificacao.tentativas_envio += 1
            notificacao.logs_envio.append({
                'data': timezone.now().isoformat(),
                'acao': 'enviada',
                'status': 'sucesso'
            })
            notificacao.save()
            
            serializer = self.get_serializer(notificacao)
            return Response(serializer.data)
            
        except Exception as e:
            notificacao.tentativas_envio += 1
            notificacao.proxima_tentativa = timezone.now() + timedelta(hours=1)
            notificacao.logs_envio.append({
                'data': timezone.now().isoformat(),
                'acao': 'erro',
                'erro': str(e)
            })
            notificacao.save()
            
            return Response({'error': f'Erro ao enviar: {str(e)}'}, status=500)
    
    def enviar_email(self, notificacao):
        """Simula envio de email"""
        # Aqui você implementaria a integração real com serviço de email
        # Por exemplo: SendGrid, AWS SES, etc.
        pass
    
    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """Lista notificações pendentes"""
        notificacoes = self.get_queryset().filter(status='pendente')
        serializer = self.get_serializer(notificacoes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Estatísticas de notificações"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'pendentes': queryset.filter(status='pendente').count(),
            'enviadas': queryset.filter(status='enviada').count(),
            'entregues': queryset.filter(status='entregue').count(),
            'lidas': queryset.filter(status='lida').count(),
            'erros': queryset.filter(status='erro').count(),
        }
        
        return Response(stats)


# --- VIEWS PARA CONTROLE DE PRAZOS ---
class ControlePrazosViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar controle de prazos
    """
    queryset = ControlePrazos.objects.all()
    serializer_class = ControlePrazosSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ControlePrazos.objects.all()
        
        # Filtros
        auto_id = self.request.query_params.get('auto_id')
        tipo_prazo = self.request.query_params.get('tipo_prazo')
        status = self.request.query_params.get('status')
        
        if auto_id:
            queryset = queryset.filter(
                Q(auto_id=auto_id) | 
                Q(auto_posto_id=auto_id) | 
                Q(auto_supermercado_id=auto_id) | 
                Q(auto_diversos_id=auto_id)
            )
        
        if tipo_prazo:
            queryset = queryset.filter(tipo_prazo=tipo_prazo)
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.select_related('responsavel')
    
    @action(detail=True, methods=['post'])
    def prorrogar(self, request, pk=None):
        """Prorroga um prazo"""
        prazo = self.get_object()
        nova_data = request.data.get('nova_data')
        
        if not nova_data:
            return Response({'error': 'nova_data é obrigatória'}, status=400)
        
        try:
            nova_data = timezone.datetime.fromisoformat(nova_data.replace('Z', '+00:00'))
        except ValueError:
            return Response({'error': 'Formato de data inválido'}, status=400)
        
        # Atualiza o prazo
        prazo.data_prorrogacao = nova_data
        prazo.status = 'prorrogado'
        prazo.historico_alteracoes.append({
            'data': timezone.now().isoformat(),
            'acao': 'prorrogado',
            'data_anterior': prazo.data_fim.isoformat(),
            'data_nova': nova_data.isoformat(),
            'usuario': request.user.username
        })
        prazo.save()
        
        serializer = self.get_serializer(prazo)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def vencendo(self, request):
        """Lista prazos vencendo (5 dias ou menos)"""
        prazos = [p for p in self.get_queryset() if p.is_vencendo()]
        serializer = self.get_serializer(prazos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Lista prazos vencidos"""
        prazos = [p for p in self.get_queryset() if p.is_vencido()]
        serializer = self.get_serializer(prazos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def alertas(self, request):
        """Lista alertas de prazos"""
        alertas = []
        prazos = self.get_queryset()
        
        for prazo in prazos:
            dias_restantes = prazo.calcular_dias_restantes()
            if dias_restantes is not None:
                if dias_restantes <= 0:
                    alertas.append({
                        'tipo': 'vencido',
                        'prazo': prazo,
                        'dias': abs(dias_restantes)
                    })
                elif dias_restantes <= 5:
                    alertas.append({
                        'tipo': 'vencendo',
                        'prazo': prazo,
                        'dias': dias_restantes
                    })
        
        serializer = self.get_serializer([a['prazo'] for a in alertas], many=True)
        return Response({
            'alertas': alertas,
            'prazos': serializer.data
        })


# --- VIEWS PARA CONFIGURAÇÕES ---
class ConfiguracaoFiscalizacaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar configurações de fiscalização
    """
    queryset = ConfiguracaoFiscalizacao.objects.all()
    serializer_class = ConfiguracaoFiscalizacaoSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_object(self):
        """Sempre retorna a configuração padrão"""
        return ConfiguracaoFiscalizacao.get_config()
    
    def list(self, request, *args, **kwargs):
        """Retorna a configuração atual"""
        config = self.get_object()
        serializer = self.get_serializer(config)
        return Response(serializer.data)


# --- VIEWS PARA DASHBOARD AVANÇADO ---
class DashboardFiscalizacaoAvancadoViewSet(viewsets.ViewSet):
    """
    ViewSet para dashboard avançado de fiscalização
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Estatísticas completas do dashboard"""
        # Estatísticas gerais
        total_autos = AutoBanco.objects.count() + AutoPosto.objects.count() + AutoSupermercado.objects.count() + AutoDiversos.objects.count()
        autos_este_mes = AutoBanco.objects.filter(data_fiscalizacao__month=timezone.now().month).count()
        autos_pendentes = AutoBanco.objects.filter(status='pendente').count()
        autos_vencidos = AutoBanco.objects.filter(status='vencido').count()
        
        # Evidências
        total_evidencias = EvidenciaFotografica.objects.count()
        evidencias_este_mes = EvidenciaFotografica.objects.filter(data_upload__month=timezone.now().month).count()
        
        # Assinaturas
        assinaturas_pendentes = AssinaturaDigital.objects.filter(status='pendente').count()
        assinaturas_vencidas = AssinaturaDigital.objects.filter(status='expirado').count()
        
        # Notificações
        notificacoes_pendentes = NotificacaoEletronica.objects.filter(status='pendente').count()
        notificacoes_enviadas = NotificacaoEletronica.objects.filter(status='enviada').count()
        notificacoes_entregues = NotificacaoEletronica.objects.filter(status='entregue').count()
        
        # Prazos
        prazos_vencendo = ControlePrazos.objects.filter(status='vencendo').count()
        prazos_vencidos = ControlePrazos.objects.filter(status='vencido').count()
        
        # Gráficos
        autos_por_tipo = {
            'Banco': AutoBanco.objects.count(),
            'Posto': AutoPosto.objects.count(),
            'Supermercado': AutoSupermercado.objects.count(),
            'Diversos': AutoDiversos.objects.count(),
        }
        
        # Alertas
        alertas_criticos = []
        alertas_importantes = []
        
        # Prazos vencidos
        prazos_vencidos_list = [p for p in ControlePrazos.objects.all() if p.is_vencido()]
        for prazo in prazos_vencidos_list:
            alertas_criticos.append({
                'tipo': 'prazo_vencido',
                'titulo': f'Prazo vencido: {prazo.descricao}',
                'descricao': f'Prazo vencido há {abs(prazo.calcular_dias_restantes())} dias',
                'data': prazo.data_fim
            })
        
        # Assinaturas vencidas
        assinaturas_vencidas_list = [a for a in AssinaturaDigital.objects.all() if a.is_expired()]
        for assinatura in assinaturas_vencidas_list:
            alertas_importantes.append({
                'tipo': 'assinatura_vencida',
                'titulo': f'Assinatura vencida: {assinatura.nome_assinante}',
                'descricao': f'Assinatura vencida em {assinatura.data_expiracao.strftime("%d/%m/%Y")}',
                'data': assinatura.data_expiracao
            })
        
        data = {
            'total_autos': total_autos,
            'autos_este_mes': autos_este_mes,
            'autos_pendentes': autos_pendentes,
            'autos_vencidos': autos_vencidos,
            'total_evidencias': total_evidencias,
            'evidencias_este_mes': evidencias_este_mes,
            'assinaturas_pendentes': assinaturas_pendentes,
            'assinaturas_vencidas': assinaturas_vencidas,
            'notificacoes_pendentes': notificacoes_pendentes,
            'notificacoes_enviadas': notificacoes_enviadas,
            'notificacoes_entregues': notificacoes_entregues,
            'prazos_vencendo': prazos_vencendo,
            'prazos_vencidos': prazos_vencidos,
            'autos_por_tipo': autos_por_tipo,
            'alertas_criticos': alertas_criticos,
            'alertas_importantes': alertas_importantes,
        }
        
        serializer = DashboardFiscalizacaoAvancadoSerializer(data)
        return Response(serializer.data)

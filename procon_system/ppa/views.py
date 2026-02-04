from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone

from .models import (
    ProcedimentoPreAdministrativo,
    MovimentacaoPPA,
    AnexoPPA,
    ParecerPPA
)
from .serializers import (
    ProcedimentoPreAdministrativoListSerializer,
    ProcedimentoPreAdministrativoDetailSerializer,
    ProcedimentoPreAdministrativoCreateSerializer,
    ProcedimentoPreAdministrativoUpdateSerializer,
    MovimentacaoPPASerializer,
    AnexoPPASerializer,
    ParecerPPASerializer,
)
from .integrations import (
    criar_ppa_de_ac,
    vincular_ac_ao_ppa,
    criar_ai_de_ppa,
    vincular_ai_ao_ppa
)
from .reports import gerar_pdf_ppa, gerar_docx_ppa
from django.http import HttpResponse


class ProcedimentoPreAdministrativoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar PPAs
    
    list: Lista todos os PPAs
    retrieve: Detalhes de um PPA específico
    create: Cria novo PPA
    update: Atualiza PPA
    partial_update: Atualiza parcialmente PPA
    destroy: Remove PPA
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'decisao_final', 'sigla', 'analista_responsavel', 'supervisor']
    search_fields = ['numero', 'interessado', 'cnpj_interessado', 'assunto']
    ordering_fields = ['criado_em', 'numero', 'prazo_analise', 'interessado']
    ordering = ['-criado_em']
    
    def get_queryset(self):
        """Retorna queryset otimizado"""
        queryset = ProcedimentoPreAdministrativo.objects.select_related(
            'analista_responsavel',
            'supervisor',
            'criado_por'
        ).prefetch_related(
            'movimentacoes',
            'anexos',
            'pareceres'
        )
        
        # Filtro por meus PPAs
        if self.request.query_params.get('meus'):
            queryset = queryset.filter(analista_responsavel=self.request.user)
        
        # Filtro por supervisionados
        if self.request.query_params.get('supervisionados'):
            queryset = queryset.filter(supervisor=self.request.user)
        
        # Filtro por prazo vencido
        if self.request.query_params.get('vencidos'):
            queryset = queryset.filter(
                prazo_analise__lt=timezone.now().date(),
                status__in=['criado', 'em_analise', 'notificado', 'aguardando_resposta']
            )
        
        # Filtro por sem prazo
        if self.request.query_params.get('sem_prazo'):
            queryset = queryset.filter(prazo_analise__isnull=True)
        
        return queryset
    
    def get_serializer_class(self):
        """Retorna serializer apropriado para cada ação"""
        if self.action == 'list':
            return ProcedimentoPreAdministrativoListSerializer
        elif self.action == 'retrieve':
            return ProcedimentoPreAdministrativoDetailSerializer
        elif self.action == 'create':
            return ProcedimentoPreAdministrativoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProcedimentoPreAdministrativoUpdateSerializer
        return ProcedimentoPreAdministrativoDetailSerializer
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Retorna estatísticas dos PPAs"""
        queryset = self.get_queryset()
        
        total = queryset.count()
        por_status = queryset.values('status').annotate(total=Count('id'))
        por_decisao = queryset.values('decisao_final').annotate(total=Count('id'))
        por_sigla = queryset.values('sigla').annotate(total=Count('id'))
        
        # PPAs vencidos
        vencidos = queryset.filter(
            prazo_analise__lt=timezone.now().date(),
            status__in=['criado', 'em_analise', 'notificado', 'aguardando_resposta']
        ).count()
        
        # PPAs próximos do prazo (5 dias)
        prazo_5_dias = timezone.now().date() + timezone.timedelta(days=5)
        proximos_vencimento = queryset.filter(
            prazo_analise__lte=prazo_5_dias,
            prazo_analise__gte=timezone.now().date(),
            status__in=['criado', 'em_analise', 'notificado', 'aguardando_resposta']
        ).count()
        
        # Meus PPAs
        meus_ppas = queryset.filter(analista_responsavel=request.user).count()
        
        return Response({
            'total': total,
            'vencidos': vencidos,
            'proximos_vencimento': proximos_vencimento,
            'meus_ppas': meus_ppas,
            'por_status': list(por_status),
            'por_decisao': list(por_decisao),
            'por_sigla': list(por_sigla),
        })
    
    @action(detail=True, methods=['post'])
    def adicionar_movimentacao(self, request, pk=None):
        """Adiciona uma movimentação ao PPA"""
        ppa = self.get_object()
        
        data = request.data.copy()
        data['ppa'] = ppa.pk
        if 'descricao' in data and not data.get('atendimento'):
            data['atendimento'] = data.pop('descricao')

        serializer = MovimentacaoPPASerializer(data=data)
        if serializer.is_valid():
            serializer.save(
                ppa=ppa,
                usuario=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def adicionar_anexo(self, request, pk=None):
        """Adiciona um anexo ao PPA"""
        ppa = self.get_object()
        
        serializer = AnexoPPASerializer(data=request.data)
        if serializer.is_valid():
            anexo = serializer.save(
                ppa=ppa,
                anexado_por=request.user
            )
            
            # Registra movimentação
            tipo_doc = anexo.get_tipo_documento_display()
            numero_doc = anexo.numero_documento or ''
            MovimentacaoPPA.objects.create(
                ppa=ppa,
                tipo_movimentacao=f'anexo_{anexo.tipo_documento.lower()}',
                atendimento=f"Anexo adicionado: {tipo_doc} {numero_doc}",
                usuario=request.user
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def adicionar_parecer(self, request, pk=None):
        """Adiciona um parecer ao PPA"""
        ppa = self.get_object()
        
        serializer = ParecerPPASerializer(data=request.data)
        if serializer.is_valid():
            parecer = serializer.save(
                ppa=ppa,
                elaborado_por=request.user
            )
            
            # Atualiza status do PPA
            ppa.status = 'parecer_elaborado'
            ppa.save()
            
            # Registra movimentação
            MovimentacaoPPA.objects.create(
                ppa=ppa,
                tipo_movimentacao='anexo_parecer',
                atendimento=f"Parecer {parecer.numero_parecer} elaborado",
                usuario=request.user
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        """Conclui o PPA com uma decisão final"""
        ppa = self.get_object()
        
        decisao = request.data.get('decisao_final')
        fundamentacao = request.data.get('fundamentacao_decisao', '')
        
        if not decisao:
            return Response(
                {'erro': 'Decisão final é obrigatória'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ppa.decisao_final = decisao
        ppa.fundamentacao_decisao = fundamentacao
        ppa.status = 'concluido'
        ppa.data_conclusao = timezone.now()
        ppa.save()
        
        # Registra movimentação
        MovimentacaoPPA.objects.create(
            ppa=ppa,
            tipo_movimentacao='decisao',
            atendimento=f"PPA concluído: {ppa.get_decisao_final_display()}",
            usuario=request.user
        )
        
        serializer = self.get_serializer(ppa)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def arquivar(self, request, pk=None):
        """Arquiva o PPA"""
        ppa = self.get_object()
        
        motivo = request.data.get('motivo', '')
        
        ppa.status = 'arquivado'
        ppa.decisao_final = 'arquivado'
        ppa.data_conclusao = timezone.now()
        ppa.fundamentacao_decisao = motivo
        ppa.save()
        
        # Registra movimentação
        MovimentacaoPPA.objects.create(
            ppa=ppa,
            tipo_movimentacao='decisao',
            atendimento=f"PPA arquivado: {motivo}",
            usuario=request.user
        )
        
        serializer = self.get_serializer(ppa)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """Lista PPAs pendentes de análise"""
        queryset = self.get_queryset().filter(
            status__in=['criado', 'em_analise', 'notificado', 'aguardando_resposta']
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    # ========== INTEGRAÇÕES ==========
    
    @action(detail=False, methods=['post'])
    def criar_de_ac(self, request):
        """
        Cria um PPA a partir de um Auto de Constatação
        
        Body: {
            "ac_id": 123,
            "dados_adicionais": {
                "sigla": "BANCO",
                "observacoes": "..."
            }
        }
        """
        ac_id = request.data.get('ac_id')
        dados_adicionais = request.data.get('dados_adicionais', {})
        
        if not ac_id:
            return Response(
                {'erro': 'ac_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ppa = criar_ppa_de_ac(ac_id, request.user, dados_adicionais)
            serializer = self.get_serializer(ppa)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def vincular_ac(self, request, pk=None):
        """
        Vincula um AC existente ao PPA
        
        Body: {
            "ac_id": 123
        }
        """
        ppa = self.get_object()
        ac_id = request.data.get('ac_id')
        
        if not ac_id:
            return Response(
                {'erro': 'ac_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            movimentacao = vincular_ac_ao_ppa(ac_id, ppa.id, request.user)
            return Response({
                'sucesso': True,
                'mensagem': f'Auto de Constatação vinculado ao PPA {ppa.numero}',
                'movimentacao': MovimentacaoPPASerializer(movimentacao).data
            })
        except ValueError as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def criar_ai(self, request, pk=None):
        """
        Cria um Auto de Infração a partir do PPA
        
        Body: {
            "fundamentacao_legal": "Art. 39...",
            "descricao_infracao": "...",
            "valor_multa": 1000.00
        }
        """
        ppa = self.get_object()
        dados_ai = request.data
        
        if not dados_ai.get('fundamentacao_legal'):
            return Response(
                {'erro': 'fundamentacao_legal é obrigatória'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ai = criar_ai_de_ppa(ppa.id, request.user, dados_ai)
            return Response({
                'sucesso': True,
                'mensagem': f'Auto de Infração {ai.numero} criado a partir do PPA {ppa.numero}',
                'auto_infracao': {
                    'id': ai.id,
                    'numero': ai.numero,
                    'empresa_autuada': ai.empresa_autuada
                }
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def vincular_ai(self, request, pk=None):
        """
        Vincula um AI existente ao PPA
        
        Body: {
            "ai_id": 456
        }
        """
        ppa = self.get_object()
        ai_id = request.data.get('ai_id')
        
        if not ai_id:
            return Response(
                {'erro': 'ai_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            movimentacao = vincular_ai_ao_ppa(ai_id, ppa.id, request.user)
            return Response({
                'sucesso': True,
                'mensagem': f'Auto de Infração vinculado ao PPA {ppa.numero}',
                'movimentacao': MovimentacaoPPASerializer(movimentacao).data
            })
        except ValueError as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # ========== RELATÓRIOS ==========
    
    @action(detail=True, methods=['get'])
    def gerar_pdf(self, request, pk=None):
        """
        Gera PDF do PPA (capa simplificada)
        
        Returns:
            Arquivo PDF para download
        """
        try:
            ppa = self.get_object()
            pdf_buffer = gerar_pdf_ppa(ppa.id)
            
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="PPA_{ppa.numero.replace("/", "-")}.pdf"'
            
            return response
        except Exception as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def gerar_docx(self, request, pk=None):
        """
        Gera DOCX de capa do PPA

        Returns:
            Arquivo DOCX para download
        """
        try:
            ppa = self.get_object()
            docx_bytes = gerar_docx_ppa(ppa.id)

            response = HttpResponse(
                docx_bytes,
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            response['Content-Disposition'] = f'attachment; filename="PPA_{ppa.numero.replace("/", "-")}.docx"'
            return response
        except Exception as e:
            return Response(
                {'erro': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MovimentacaoPPAViewSet(viewsets.ModelViewSet):
    """ViewSet para movimentações do PPA"""
    permission_classes = [IsAuthenticated]
    serializer_class = MovimentacaoPPASerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ppa', 'tipo_movimentacao', 'data', 'usuario']
    ordering_fields = ['data', 'hora', 'criado_em']
    ordering = ['data', 'hora']
    
    def get_queryset(self):
        """Retorna queryset otimizado"""
        return MovimentacaoPPA.objects.select_related(
            'ppa',
            'usuario'
        )
    
    def perform_create(self, serializer):
        """Define usuário automaticamente"""
        serializer.save(usuario=self.request.user)


class AnexoPPAViewSet(viewsets.ModelViewSet):
    """ViewSet para anexos do PPA"""
    permission_classes = [IsAuthenticated]
    serializer_class = AnexoPPASerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ppa', 'tipo_documento', 'anexado_por']
    ordering_fields = ['data_anexacao']
    ordering = ['-data_anexacao']
    
    def get_queryset(self):
        """Retorna queryset otimizado"""
        return AnexoPPA.objects.select_related(
            'ppa',
            'anexado_por',
            'content_type'
        )
    
    def perform_create(self, serializer):
        """Define usuário automaticamente e registra movimentação"""
        anexo = serializer.save(anexado_por=self.request.user)
        
        # Registra movimentação
        tipo_doc = anexo.get_tipo_documento_display()
        numero_doc = anexo.numero_documento or ''
        MovimentacaoPPA.objects.create(
            ppa=anexo.ppa,
            tipo_movimentacao=f'anexo_{anexo.tipo_documento.lower()}',
            atendimento=f"Anexo adicionado: {tipo_doc} {numero_doc}",
            usuario=self.request.user
        )


class ParecerPPAViewSet(viewsets.ModelViewSet):
    """ViewSet para pareceres do PPA"""
    permission_classes = [IsAuthenticated]
    serializer_class = ParecerPPASerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ppa', 'conclusao', 'elaborado_por', 'aprovado_por']
    ordering_fields = ['criado_em', 'data_aprovacao']
    ordering = ['-criado_em']
    
    def get_queryset(self):
        """Retorna queryset otimizado"""
        return ParecerPPA.objects.select_related(
            'ppa',
            'elaborado_por',
            'aprovado_por'
        )
    
    def perform_create(self, serializer):
        """Define elaborador automaticamente e atualiza status do PPA"""
        parecer = serializer.save(elaborado_por=self.request.user)
        
        # Atualiza status do PPA
        ppa = parecer.ppa
        ppa.status = 'parecer_elaborado'
        ppa.save()
        
        # Registra movimentação
        MovimentacaoPPA.objects.create(
            ppa=ppa,
            tipo_movimentacao='anexo_parecer',
            atendimento=f"Parecer {parecer.numero_parecer} elaborado",
            usuario=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        """Aprova o parecer"""
        parecer = self.get_object()
        
        parecer.aprovado_por = request.user
        parecer.data_aprovacao = timezone.now()
        parecer.save()
        
        # Registra movimentação
        MovimentacaoPPA.objects.create(
            ppa=parecer.ppa,
            tipo_movimentacao='observacao',
            atendimento=f"Parecer {parecer.numero_parecer} aprovado",
            usuario=request.user
        )
        
        serializer = self.get_serializer(parecer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def gerar_documento(self, request, pk=None):
        """Gera documento Word do parecer no formato institucional"""
        from django.http import HttpResponse
        from django.conf import settings
        import os
        import tempfile
        
        parecer = self.get_object()
        
        try:
            # Gerar documento Word
            doc = parecer.gerar_documento_word()
            
            # Salvar em arquivo temporário
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.docx')
            doc.save(temp_file.name)
            temp_file.close()
            
            # Ler arquivo
            with open(temp_file.name, 'rb') as f:
                response = HttpResponse(
                    f.read(),
                    content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                )
                response['Content-Disposition'] = f'attachment; filename="Parecer_{parecer.numero_parecer.replace("/", "_")}.docx"'
            
            # Remover arquivo temporário
            os.unlink(temp_file.name)
            
            return response
            
        except ImportError:
            return Response(
                {'erro': 'python-docx não está instalado. Instale com: pip install python-docx'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'erro': f'Erro ao gerar documento: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

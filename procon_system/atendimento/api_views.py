from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone

from .models import BalcaoAtendimento, SenhaAtendimento, FilaAtendimento
from .serializers import (
    BalcaoAtendimentoSerializer,
    SenhaAtendimentoSerializer,
    FilaAtendimentoSerializer,
)
from .services import FilaAtendimentoService


class BalcaoAtendimentoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BalcaoAtendimento.objects.filter(ativo=True).order_by('ordem_prioridade', 'nome')
    serializer_class = BalcaoAtendimentoSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.setdefault('request', self.request)
        return context

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        balcao = self.get_object()
        fila = FilaAtendimento.obter_fila_ativa(balcao)

        senhas_espera = SenhaAtendimento.objects.filter(
            balcao=balcao,
            status=SenhaAtendimento.Status.EM_ESPERA
        ).order_by('emitido_em')

        senhas_em_atendimento = SenhaAtendimento.objects.filter(
            balcao=balcao,
            status__in=[
                SenhaAtendimento.Status.CHAMADA,
                SenhaAtendimento.Status.EM_ATENDIMENTO,
            ]
        ).order_by('-chamado_em')

        senhas_finalizadas = SenhaAtendimento.objects.filter(
            balcao=balcao,
            status=SenhaAtendimento.Status.FINALIZADA
        ).order_by('-finalizado_em')[:10]

        data = {
            'balcao': BalcaoAtendimentoSerializer(balcao, context=self.get_serializer_context()).data,
            'fila': FilaAtendimentoSerializer(fila, context=self.get_serializer_context()).data if fila else None,
            'senhas': {
                'em_espera': SenhaAtendimentoSerializer(senhas_espera, many=True, context=self.get_serializer_context()).data,
                'em_atendimento': SenhaAtendimentoSerializer(senhas_em_atendimento, many=True, context=self.get_serializer_context()).data,
                'finalizadas': SenhaAtendimentoSerializer(senhas_finalizadas, many=True, context=self.get_serializer_context()).data,
            },
        }
        return Response(data)

    @action(detail=True, methods=['post'], url_path='emitir-senha')
    def emitir_senha(self, request, pk=None):
        balcao = self.get_object()
        prioridade = request.data.get('prioridade', SenhaAtendimento.Prioridade.NORMAL)
        observacoes = request.data.get('observacoes', '')

        prioridades_validas = {choice[0] for choice in SenhaAtendimento.Prioridade.choices}
        if prioridade not in prioridades_validas:
            return Response({'detail': 'Prioridade inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        senha, fila = FilaAtendimentoService.emitir_senha(
            balcao=balcao,
            prioridade=prioridade,
            observacoes=observacoes,
        )
        return Response(
            {
                'senha': SenhaAtendimentoSerializer(senha, context=self.get_serializer_context()).data,
                'fila': FilaAtendimentoSerializer(fila, context=self.get_serializer_context()).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='chamar-proxima')
    def chamar_proxima(self, request, pk=None):
        balcao = self.get_object()
        senha, fila = FilaAtendimentoService.chamar_proxima(balcao=balcao, atendente=request.user)
        return Response(
            {
                'senha': SenhaAtendimentoSerializer(senha, context=self.get_serializer_context()).data,
                'fila': FilaAtendimentoSerializer(fila, context=self.get_serializer_context()).data,
            }
        )


class SenhaAtendimentoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SenhaAtendimento.objects.select_related('balcao').all().order_by('-emitido_em')
    serializer_class = SenhaAtendimentoSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.setdefault('request', self.request)
        return context

    @action(detail=True, methods=['post'], url_path='iniciar')
    def iniciar(self, request, pk=None):
        senha = self.get_object()
        senha, fila = FilaAtendimentoService.iniciar_senha(senha=senha, atendente=request.user)
        return Response(
            {
                'senha': SenhaAtendimentoSerializer(senha, context=self.get_serializer_context()).data,
                'fila': FilaAtendimentoSerializer(fila, context=self.get_serializer_context()).data,
            }
        )

    @action(detail=True, methods=['post'], url_path='finalizar')
    def finalizar(self, request, pk=None):
        senha = self.get_object()
        senha, fila = FilaAtendimentoService.finalizar_senha(senha=senha, atendente=request.user)
        return Response(
            {
                'senha': SenhaAtendimentoSerializer(senha, context=self.get_serializer_context()).data,
                'fila': FilaAtendimentoSerializer(fila, context=self.get_serializer_context()).data,
            }
        )

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        senha = self.get_object()
        motivo = request.data.get('motivo', '')
        senha = FilaAtendimentoService.cancelar_senha(senha=senha, motivo=motivo)
        return Response(
            {
                'senha': SenhaAtendimentoSerializer(senha, context=self.get_serializer_context()).data,
            }
        )


class AutoAtendimentoViewSet(viewsets.ViewSet):
    """Endpoints públicos para totem/autoatendimento retirar senhas."""

    permission_classes = [AllowAny]

    def list(self, request):
        balcoes = BalcaoAtendimento.objects.filter(ativo=True).order_by('ordem_prioridade', 'nome')
        data = [self._balcao_payload(balcao) for balcao in balcoes]
        return Response(data)

    def retrieve(self, request, pk=None):
        balcao = get_object_or_404(BalcaoAtendimento, pk=pk, ativo=True)
        return Response(self._balcao_payload(balcao, incluir_detalhes=True))

    @action(detail=True, methods=['post'], url_path='retirar')
    def retirar(self, request, pk=None):
        balcao = get_object_or_404(BalcaoAtendimento, pk=pk, ativo=True)
        prioridade = request.data.get('prioridade', SenhaAtendimento.Prioridade.NORMAL)
        observacoes = request.data.get('observacoes', '') or ''

        prioridades_validas = {choice[0] for choice in SenhaAtendimento.Prioridade.choices}
        if prioridade not in prioridades_validas:
            return Response({'detail': 'Prioridade inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        # Limita prioridades especiais apenas se balcao permitir (capacidade > 0)
        if prioridade == SenhaAtendimento.Prioridade.PRIORITARIA and not balcao.ativo:
            return Response({'detail': 'Balção indisponível para prioridade escolhida.'}, status=status.HTTP_400_BAD_REQUEST)

        observacoes_registradas = observacoes.strip()
        if observacoes_registradas:
            observacoes_registradas = f"AUTOATENDIMENTO: {observacoes_registradas}"
        else:
            observacoes_registradas = "AUTOATENDIMENTO"

        senha, fila = FilaAtendimentoService.emitir_senha(
            balcao=balcao,
            prioridade=prioridade,
            observacoes=observacoes_registradas,
        )

        posicao = (
            SenhaAtendimento.objects.filter(
                balcao=balcao,
                status=SenhaAtendimento.Status.EM_ESPERA,
                emitido_em__lte=senha.emitido_em,
            ).count()
        )

        tempo_estimado = self._tempo_estimado(posicao, balcao.capacidade_simultanea)

        return Response(
            {
                'mensagem': 'Senha emitida com sucesso.',
                'senha': {
                    'identificador': senha.identificador,
                    'prioridade': senha.prioridade,
                    'posicao': posicao,
                    'tempo_estimado_minutos': tempo_estimado,
                    'observacoes': senha.observacoes,
                },
                'balcao': self._balcao_payload(balcao),
                'atualizado_em': timezone.now(),
            },
            status=status.HTTP_201_CREATED,
        )

    def _balcao_payload(self, balcao, incluir_detalhes: bool = False):
        fila = FilaAtendimento.obter_fila_ativa(balcao)
        senhas_espera = SenhaAtendimento.objects.filter(
            balcao=balcao,
            status=SenhaAtendimento.Status.EM_ESPERA,
        ).order_by('emitido_em')
        em_espera = senhas_espera.count()
        tempo_estimado = self._tempo_estimado(em_espera, balcao.capacidade_simultanea)
        proxima_senha = senhas_espera.first()

        payload = {
            'id': balcao.id,
            'nome': balcao.nome,
            'codigo': balcao.codigo,
            'localizacao': balcao.localizacao,
            'capacidade_simultanea': balcao.capacidade_simultanea,
            'senhas_em_espera': em_espera,
            'tempo_estimado_minutos': tempo_estimado,
            'alerta_fila_vazia': em_espera == 0,
            'proxima_senha': proxima_senha.identificador if proxima_senha else None,
            'mensagem_aguarde': "Fila vazia. Aguarde novas senhas." if em_espera == 0 else "Aguarde a chamada da pr�xima senha.",
        }

        if incluir_detalhes:
            payload['fila'] = (
                FilaAtendimentoSerializer(fila).data if fila else None
            )
            payload['senhas_em_atendimento'] = SenhaAtendimentoSerializer(
                SenhaAtendimento.objects.filter(
                    balcao=balcao,
                    status__in=[
                        SenhaAtendimento.Status.CHAMADA,
                        SenhaAtendimento.Status.EM_ATENDIMENTO,
                    ],
                ).order_by('-chamado_em'),
                many=True,
            ).data

        return payload

    @staticmethod
    def _tempo_estimado(posicao: int, capacidade: int) -> int:
        capacidade = max(capacidade or 1, 1)
        filas_a_frente = max(posicao - capacidade, 0)
        # Aproximação: 5 minutos por atendimento
        return filas_a_frente * 5

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='painel-resumo')
    def painel_resumo(self, request):
        """Resumo consolidado para exibicao em paineis publicos."""
        balcoes = BalcaoAtendimento.objects.filter(ativo=True).order_by('ordem_prioridade', 'nome')
        dados = [self._balcao_payload(balcao, incluir_detalhes=True) for balcao in balcoes]
        return Response({
            'atualizado_em': timezone.now(),
            'balcoes': dados,
        })
    @action(detail=True, methods=['post'], url_path='pular')
    def pular(self, request, pk=None):
        senha = self.get_object()
        justificativa = request.data.get('motivo', 'Senha pulada pelo atendente.')
        senha = FilaAtendimentoService.pular_senha(senha=senha, justificativa=justificativa)
        return Response(
            {
                'senha': SenhaAtendimentoSerializer(senha, context=self.get_serializer_context()).data,
            }
        )

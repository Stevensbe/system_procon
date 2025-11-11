"""API mobile para operações de fiscalização."""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple, Type

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db import IntegrityError, transaction
from django.http import FileResponse, Http404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from agenda.models import EventoAgenda
from empresas.models import Empresa
from logging_config import LoggedOperation

from . import models, serializers_mobile
from .services import numero_documento_service

logger = logging.getLogger(__name__)


REQUIRED_HEADERS = ("X-Device-Id",)


def ensure_headers(request) -> str:
    missing = [header for header in REQUIRED_HEADERS if header not in request.headers]
    if missing:
        raise ValidationError(
            {"headers": f"Headers obrigatórios ausentes: {', '.join(missing)}"}
        )
    return request.headers["X-Device-Id"]


def resolve_auto_constatacao_by_uuid(uuid) -> Optional[models.AutoConstatacaoBase]:
    for model in (
        models.AutoBanco,
        models.AutoPosto,
        models.AutoSupermercado,
        models.AutoDiversos,
    ):
        try:
            return model.objects.get(uuid_local=uuid)
        except model.DoesNotExist:
            continue
    return None


def resolve_auto_constatacao_by_id(pk: int) -> Optional[models.AutoConstatacaoBase]:
    for model in (
        models.AutoBanco,
        models.AutoPosto,
        models.AutoSupermercado,
        models.AutoDiversos,
    ):
        try:
            return model.objects.get(id=pk)
        except model.DoesNotExist:
            continue
    return None


def get_default_checklists() -> List[Dict[str, str]]:
    return [
        {
            "tipo": "BANCO",
            "itens": [
                "Tempo de fila dentro do limite legal?",
                "Cartazes obrigatórios visíveis?",
                "Atendimento prioritário sinalizado?",
            ],
        },
        {
            "tipo": "POSTO",
            "itens": [
                "Precificação visível e atualizada?",
                "Bombas lacradas e aferidas?",
                "Publicidade conforme ANP?",
            ],
        },
        {
            "tipo": "SUPERMERCADO",
            "itens": [
                "Produtos com validade exposta?",
                "Precificador funcionando?",
                "Área de frios com temperatura adequada?",
            ],
        },
        {
            "tipo": "DIVERSOS",
            "itens": [
                "Documento de autorização disponível?",
                "Livro de reclamações acessível?",
            ],
        },
    ]


class BootstrapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        device_id = ensure_headers(request)
        with LoggedOperation(
            "mobile_bootstrap_sync",
            {"usuario": request.user.id, "device_id": device_id},
        ):
            last_sync_param = request.query_params.get("last_sync")
            last_sync_dt = parse_datetime(last_sync_param) if last_sync_param else None

            empresas_qs = Empresa.objects.all()
            if last_sync_dt:
                empresas_qs = empresas_qs.filter(data_atualizacao__gte=last_sync_dt)

            empresas_serializer = serializers_mobile.EmpresaMobileSerializer(
                empresas_qs[:200], many=True
            )

            agendamentos_qs = EventoAgenda.objects.filter(
                data_inicio__gte=timezone.now() - timezone.timedelta(days=1)
            ).select_related("fiscal_responsavel")[:50]
            agendamentos_serializer = serializers_mobile.AgendamentoMobileSerializer(
                agendamentos_qs, many=True
            )

            autos_pendentes = []
            for auto in models.AutoInfracao.objects.filter(
                criado_no_mobile=True, status__in=["autuado", "em_defesa"]
            )[:50]:
                autos_pendentes.append(
                    {
                        "id": auto.id,
                        "numero": auto.numero,
                        "status": auto.status,
                        "razao_social": auto.razao_social,
                        "valor_multa": str(auto.valor_multa),
                    }
                )

            response_payload = {
                "timestamp": timezone.now().isoformat(),
                "empresas": empresas_serializer.data,
                "agendamentos": agendamentos_serializer.data,
                "checklists": get_default_checklists(),
                "autos_pendentes": autos_pendentes,
                "config": {
                    "timezone": "America/Manaus",
                    "assinatura_obrigatoria": True,
                    "impressao_termica": {"enabled": True, "rows": 42},
                },
            }

            return Response(response_payload, status=status.HTTP_200_OK)


class SyncPushView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device_id = ensure_headers(request)
        payload = request.data
        confirmados = {"autos": [], "notificacoes": [], "empresas": []}
        pendentes: List[Dict[str, str]] = []
        erros: List[Dict[str, str]] = []

        autos = payload.get("autos", [])
        for auto_payload in autos:
            uuid_value = auto_payload.get("uuid")
            if not uuid_value:
                erros.append(
                    {
                        "uuid": "",
                        "codigo": "VALIDACAO_FALHOU",
                        "mensagem": "Campo uuid é obrigatório",
                    }
                )
                continue
            existente = resolve_auto_constatacao_by_uuid(uuid_value)
            if existente:
                confirmados["autos"].append(
                    {"uuid": uuid_value, "id": existente.id, "numero": existente.numero}
                )
                continue
            serializer = serializers_mobile.AutoConstatacaoCreateSerializer(
                data={
                    "uuid": uuid_value,
                    "empresa_id": auto_payload.get("empresa_id"),
                    "tipo": auto_payload.get("tipo"),
                    "descricao": auto_payload.get("descricao", ""),
                    "observacoes": auto_payload.get("observacoes", ""),
                    "origem": auto_payload.get("origem", ""),
                    "emitido_em": auto_payload.get("emitido_em"),
                },
                context={"request": request},
            )
            if serializer.is_valid():
                try:
                    with LoggedOperation(
                        "mobile_sync_push_auto",
                        {"uuid": str(uuid_value), "device_id": device_id},
                    ):
                        instance = serializer.save()
                except Exception as exc:  # pragma: no cover - log e segue
                    logger.exception("Falha ao salvar auto no sync push: %s", exc)
                    erros.append(
                        {
                            "uuid": uuid_value,
                            "codigo": "ERRO_INTERNO",
                            "mensagem": "Falha ao persistir auto",
                        }
                    )
                    continue
                confirmados["autos"].append(
                    {"uuid": uuid_value, "id": instance.id, "numero": instance.numero}
                )
            else:
                erros.append(
                    {
                        "uuid": uuid_value,
                        "codigo": "VALIDACAO_FALHOU",
                        "mensagem": serializer.errors,
                    }
                )

        response_payload = {
            "confirmados": confirmados,
            "pendentes": pendentes,
            "erros": erros,
            "timestamp": timezone.now().isoformat(),
        }
        return Response(response_payload, status=status.HTTP_200_OK)


class AutoConstatacaoCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device_id = ensure_headers(request)
        serializer = serializers_mobile.AutoConstatacaoCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        uuid_value = serializer.validated_data["uuid"]
        existente = resolve_auto_constatacao_by_uuid(uuid_value)
        if existente:
            return Response(
                {
                    "id": existente.id,
                    "numero": existente.numero,
                    "sync_status": "CONFIRMADO",
                },
                status=status.HTTP_200_OK,
            )

        with transaction.atomic(), LoggedOperation(
            "mobile_auto_constatacao_create",
            {"uuid": str(uuid_value), "device_id": device_id, "usuario": request.user.id},
        ):
            instance = serializer.save()

        return Response(
            {
                "id": instance.id,
                "numero": instance.numero,
                "sync_status": "CONFIRMADO",
                "proximo": {"auto_infracao": {"permissao": True}},
            },
            status=status.HTTP_201_CREATED,
        )


class AutoInfracaoCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device_id = ensure_headers(request)
        serializer = serializers_mobile.AutoInfracaoCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        uuid_value = serializer.validated_data["uuid"]

        try:
            existente = models.AutoInfracao.objects.get(uuid_local=uuid_value)
            return Response(
                {
                    "id": existente.id,
                    "numero": existente.numero,
                    "sync_status": "CONFIRMADO",
                    "notificacao_pendente": True,
                },
                status=status.HTTP_200_OK,
            )
        except models.AutoInfracao.DoesNotExist:
            pass

        with transaction.atomic(), LoggedOperation(
            "mobile_auto_infracao_create",
            {"uuid": str(uuid_value), "device_id": device_id, "usuario": request.user.id},
        ):
            instance = serializer.save()

        return Response(
            {
                "id": instance.id,
                "numero": instance.numero,
                "sync_status": "CONFIRMADO",
                "notificacao_pendente": True,
            },
            status=status.HTTP_201_CREATED,
        )


class PedidoNotificacaoCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device_id = ensure_headers(request)
        auto_id = request.data.get("auto_id")
        tipo = request.data.get("tipo")
        canal = request.data.get("canal_preferencial")
        observacoes = request.data.get("observacoes", "")
        anexos = request.data.get("anexos", [])
        uuid_local = request.data.get("uuid") or request.data.get("uuid_local")

        if not auto_id or not tipo or not canal:
            raise ValidationError(
                {"detalhes": "Campos auto_id, tipo e canal_preferencial são obrigatórios"}
            )

        auto_infracao = None
        auto_constatacao = resolve_auto_constatacao_by_id(auto_id)
        if not auto_constatacao:
            try:
                auto_infracao = models.AutoInfracao.objects.get(id=auto_id)
            except models.AutoInfracao.DoesNotExist:
                raise ValidationError({"auto_id": "Auto informado não existe"})

        defaults = {
            "solicitado_por": request.user,
            "tipo": tipo,
            "canal_preferencial": canal,
            "observacoes": observacoes,
            "anexos": anexos,
            "criado_no_mobile": True,
            "device_id": device_id,
            "offline_em": timezone.now(),
            "sincronizado_em": timezone.now(),
        }

        lookup = {}
        if uuid_local:
            lookup["uuid_local"] = uuid_local
        else:
            lookup = {
                "solicitado_por": request.user,
                "auto_infracao": auto_infracao,
                "auto_constatacao": auto_constatacao,
                "tipo": tipo,
            }

        pedido, created = models.PedidoNotificacaoMobile.objects.get_or_create(
            defaults=defaults,
            auto_infracao=auto_infracao,
            auto_constatacao=auto_constatacao,
            **lookup,
        )

        serializer = serializers_mobile.PedidoNotificacaoMobileSerializer(pedido)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


class AgendamentosListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ensure_headers(request)
        agendamentos_qs = EventoAgenda.objects.filter(
            data_fim__gte=timezone.now() - timezone.timedelta(days=1)
        ).select_related("fiscal_responsavel")[:50]
        serializer = serializers_mobile.AgendamentoMobileSerializer(
            agendamentos_qs, many=True
        )
        return Response(serializer.data)


class AgendamentoCheckinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, agendamento_id: int):
        device_id = ensure_headers(request)
        geo = request.data.get("geo")
        realizado_em = request.data.get("realizado_em") or timezone.now().isoformat()

        try:
            agendamento = EventoAgenda.objects.get(id=agendamento_id)
        except EventoAgenda.DoesNotExist as exc:
            raise ValidationError({"agendamento": "Agendamento não encontrado"}) from exc

        # Registrar check-in simples como log
        logger.info(
            "Check-in mobile no agendamento %s por %s (%s) geo=%s realizado_em=%s",
            agendamento.id,
            request.user.id,
            device_id,
            geo,
            realizado_em,
        )

        agendamento.status = "em_andamento"
        agendamento.save(update_fields=["status"])

        return Response(
            {"status": "EM_ANDAMENTO", "realizado_em": realizado_em},
            status=status.HTTP_200_OK,
        )


class MobileUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device_id = ensure_headers(request)
        payload = request.data
        arquivo_base64 = payload.get("arquivo")
        nome = payload.get("nome") or "upload-mobile"
        mime = payload.get("mime_type") or "application/octet-stream"

        if not arquivo_base64:
            raise ValidationError({"arquivo": "Campo obrigatório"})

        try:
            arquivo_bytes = base64.b64decode(arquivo_base64)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"arquivo": "Conteúdo inválido"}) from exc

        content = ContentFile(arquivo_bytes, name=nome)
        upload = models.MobileUpload.objects.create(
            usuario=request.user,
            arquivo=content,
            mime_type=mime,
            tamanho=len(arquivo_bytes),
            device_id=device_id,
        )

        return Response(
            {"token": str(upload.token), "url_temp": upload.arquivo.url},
            status=status.HTTP_201_CREATED,
        )


class MobileNumeracaoTesteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ensure_headers(request)
        proximo_constatacao = numero_documento_service.prever_numero_constatacao()
        proximo_apreensao = numero_documento_service.prever_numero_apreensao()
        return Response(
            {
                "constatacao": proximo_constatacao,
                "apreensao": proximo_apreensao,
            }
        )


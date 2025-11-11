"""Serializers específicos para a API mobile de fiscalização."""

from __future__ import annotations

from typing import Any, Dict, Optional, Type

from django.utils import timezone
from rest_framework import serializers

from empresas.models import Empresa
from agenda.models import EventoAgenda

from . import models


class GeoSerializer(serializers.Serializer):
    lat = serializers.FloatField(required=True)
    lng = serializers.FloatField(required=True)
    precision = serializers.FloatField(required=False)


class EmpresaMobileSerializer(serializers.ModelSerializer):
    historico = serializers.SerializerMethodField()

    class Meta:
        model = Empresa
        fields = [
            "id",
            "uuid_local",
            "razao_social",
            "nome_fantasia",
            "cnpj",
            "endereco",
            "numero",
            "bairro",
            "cidade",
            "estado",
            "cep",
            "telefone",
            "email",
            "historico",
        ]

    def get_historico(self, obj: Empresa) -> list[dict[str, Any]]:
        cutoff = timezone.now().date().replace(year=timezone.now().date().year - 1)
        historico: list[dict[str, Any]] = []

        autos_constatacao = models.AutoSupermercado.objects.filter(
            cnpj=obj.cnpj, data_fiscalizacao__gte=cutoff
        ).order_by("-data_fiscalizacao")[:5]
        autos_infracao = models.AutoInfracao.objects.filter(
            cnpj=obj.cnpj, data_fiscalizacao__gte=cutoff
        ).order_by("-data_fiscalizacao")[:5]

        for auto in autos_constatacao:
            historico.append(
                {
                    "tipo": "AUTO_CONST",
                    "numero": auto.numero,
                    "data": auto.data_fiscalizacao,
                    "observacoes": getattr(auto, "observacoes", ""),
                }
            )

        for auto in autos_infracao:
            historico.append(
                {
                    "tipo": "AUTO_INFRACAO",
                    "numero": auto.numero,
                    "data": auto.data_fiscalizacao,
                    "status": auto.status,
                    "valor_multa": auto.valor_multa,
                }
            )

        return sorted(historico, key=lambda item: item["data"], reverse=True)


class AutoConstatacaoBaseSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    numero = serializers.CharField(read_only=True)
    tipo = serializers.CharField(read_only=True)
    data_fiscalizacao = serializers.DateField(read_only=True)
    hora_fiscalizacao = serializers.TimeField(read_only=True)
    razao_social = serializers.CharField(read_only=True)
    cnpj = serializers.CharField(read_only=True)
    criado_no_mobile = serializers.BooleanField(read_only=True)


class AutoConstatacaoCreateSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    empresa_id = serializers.IntegerField(required=False, allow_null=True)
    tipo = serializers.ChoiceField(
        choices=["BANCO", "POSTO", "SUPERMERCADO", "DIVERSOS"]
    )
    descricao = serializers.CharField()
    observacoes = serializers.CharField(required=False, allow_blank=True)
    origem = serializers.CharField(required=False, allow_blank=True)
    geo = GeoSerializer(required=False)
    emitido_em = serializers.DateTimeField(required=False)

    def validate_empresa_id(self, value: Optional[int]) -> Optional[Empresa]:
        if value is None:
            return None
        try:
            return Empresa.objects.get(id=value)
        except Empresa.DoesNotExist as exc:  # pragma: no cover - erro explicitado
            raise serializers.ValidationError("Empresa não encontrada") from exc

    def create(self, validated_data: Dict[str, Any]) -> models.AutoConstatacaoBase:
        request = self.context["request"]
        empresa = validated_data.get("empresa_id")
        tipo = validated_data["tipo"]
        descricao = validated_data["descricao"]
        observacoes = validated_data.get("observacoes", "")
        origem = validated_data.get("origem") or "acao"
        emitido_em = validated_data.get("emitido_em") or timezone.now()

        model_map: Dict[str, Type[models.AutoConstatacaoBase]] = {
            "BANCO": models.AutoBanco,
            "POSTO": models.AutoPosto,
            "SUPERMERCADO": models.AutoSupermercado,
            "DIVERSOS": models.AutoDiversos,
        }

        model_class = model_map[tipo]

        model_field_names = {
            field.name
            for field in model_class._meta.get_fields()
            if hasattr(field, "name") and not field.many_to_many and not field.one_to_many
        }

        kwargs: Dict[str, Any] = {
            "uuid_local": validated_data["uuid"],
            "criado_no_mobile": True,
            "device_id": request.headers.get("X-Device-Id"),
            "offline_em": emitido_em,
            "sincronizado_em": timezone.now(),
            "data_fiscalizacao": emitido_em.date(),
            "hora_fiscalizacao": emitido_em.time(),
            "origem": origem.lower(),
        }

        if "descricao" in model_field_names:
            kwargs["descricao"] = descricao
        if "observacoes" in model_field_names:
            kwargs["observacoes"] = observacoes or descricao

        if empresa:
            kwargs.update(
                {
                    "razao_social": empresa.razao_social,
                    "nome_fantasia": empresa.nome_fantasia,
                    "atividade": empresa.segmento.nome if empresa.segmento else "",
                    "endereco": empresa.endereco,
                    "cep": empresa.cep,
                    "municipio": empresa.cidade,
                    "estado": empresa.estado,
                    "cnpj": empresa.cnpj,
                    "telefone": empresa.telefone,
                }
            )
        else:
            kwargs.setdefault("razao_social", "Nao informada")
            kwargs.setdefault("atividade", "Nao informada")
            kwargs.setdefault("endereco", "Nao informado")
            kwargs.setdefault("cep", "")
            kwargs.setdefault("municipio", "MANAUS")
            kwargs.setdefault("estado", "AM")
            kwargs.setdefault("cnpj", "")

        instance = model_class.objects.create(**kwargs)
        return instance


class AutoInfracaoCreateSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    auto_constatacao_id = serializers.IntegerField()
    fundamentacao = serializers.CharField()
    dispositivos_legais = serializers.ListField(
        child=serializers.CharField(), allow_empty=False
    )
    valor_multa_estimado = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    finalizar_no_orgao = serializers.BooleanField(required=False)
    emitido_em = serializers.DateTimeField(required=False)

    def validate_auto_constatacao_id(self, value: int) -> models.AutoConstatacaoBase:
        for model in (
            models.AutoBanco,
            models.AutoPosto,
            models.AutoSupermercado,
            models.AutoDiversos,
        ):
            try:
                return model.objects.get(id=value)
            except model.DoesNotExist:
                continue
        raise serializers.ValidationError("Auto de constatação informado não existe")

    def create(self, validated_data: Dict[str, Any]) -> models.AutoInfracao:
        request = self.context["request"]
        auto_constatacao = validated_data["auto_constatacao_id"]
        emitido_em = validated_data.get("emitido_em") or timezone.now()

        auto_infracao = models.AutoInfracao.objects.create(
            uuid_local=validated_data["uuid"],
            criado_no_mobile=True,
            device_id=request.headers.get("X-Device-Id"),
            offline_em=emitido_em,
            sincronizado_em=timezone.now(),
            data_fiscalizacao=emitido_em.date(),
            hora_fiscalizacao=emitido_em.time(),
            emitido_em=emitido_em,
            municipio=getattr(auto_constatacao, "municipio", "MANAUS"),
            estado=getattr(auto_constatacao, "estado", "AM"),
            razao_social=getattr(auto_constatacao, "razao_social", ""),
            nome_fantasia=getattr(auto_constatacao, "nome_fantasia", ""),
            atividade=getattr(auto_constatacao, "atividade", ""),
            endereco=getattr(auto_constatacao, "endereco", ""),
            cnpj=getattr(auto_constatacao, "cnpj", ""),
            relatorio=validated_data["fundamentacao"],
            base_legal_cdc="\n".join(validated_data["dispositivos_legais"]),
            valor_multa=validated_data.get("valor_multa_estimado") or 0,
            responsavel_nome=getattr(auto_constatacao, "responsavel_nome", ""),
            responsavel_cpf=getattr(auto_constatacao, "responsavel_cpf", ""),
            fiscal_nome=request.user.get_full_name() or request.user.username,
        )

        return auto_infracao


class PedidoNotificacaoMobileSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PedidoNotificacaoMobile
        fields = [
            "id",
            "uuid_local",
            "status",
            "notificacao_numero",
        ]


class AgendamentoMobileSerializer(serializers.ModelSerializer):
    empresa = serializers.SerializerMethodField()

    class Meta:
        model = EventoAgenda
        fields = [
            "id",
            "data_inicio",
            "data_fim",
            "local",
            "status",
            "descricao",
            "empresa",
        ]

    def get_empresa(self, obj: EventoAgenda) -> Optional[Dict[str, Any]]:
        if not obj.empresa_relacionada:
            return None
        try:
            empresa = Empresa.objects.get(cnpj=obj.empresa_relacionada)
        except Empresa.DoesNotExist:
            return None
        return {
            "id": empresa.id,
            "razao_social": empresa.razao_social,
            "cnpj": empresa.cnpj,
        }


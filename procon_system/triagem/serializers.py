from rest_framework import serializers

from .models import TriagemAnexo, TriagemDemanda, TriagemHistorico
from .notifications import (
    enviar_aviso_agendamento,
    enviar_confirmacao_triagem,
    enviar_pedido_complemento,
)
from .services import criar_ppa_para_triagem


class TriagemHistoricoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source="usuario.get_full_name", read_only=True)

    class Meta:
        model = TriagemHistorico
        fields = [
            "id",
            "evento",
            "descricao",
            "usuario",
            "usuario_nome",
            "motivo",
            "observacao",
            "dados_extras",
            "criado_em",
        ]
        read_only_fields = ["id", "criado_em", "usuario_nome", "motivo", "observacao"]


class TriagemAnexoSerializer(serializers.ModelSerializer):
    enviado_por_nome = serializers.CharField(
        source="enviado_por.get_full_name", read_only=True
    )
    arquivo_url = serializers.FileField(source="arquivo", read_only=True)
    tamanho_legivel = serializers.CharField(read_only=True)

    class Meta:
        model = TriagemAnexo
        fields = [
            "id",
            "nome_original",
            "descricao",
            "arquivo_url",
            "tamanho",
            "tamanho_legivel",
            "enviado_por",
            "enviado_por_nome",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "arquivo_url",
            "tamanho",
            "tamanho_legivel",
            "enviado_por",
            "enviado_por_nome",
            "criado_em",
        ]


class TriagemDemandaSerializer(serializers.ModelSerializer):
    historico = TriagemHistoricoSerializer(many=True, read_only=True)
    anexos = TriagemAnexoSerializer(many=True, read_only=True)
    denuncia_portal_numero = serializers.CharField(
        source="denuncia_portal.numero_denuncia", read_only=True
    )
    ppa_numero = serializers.CharField(source="ppa.numero", read_only=True)
    criado_por_nome = serializers.CharField(source="criado_por.get_full_name", read_only=True)
    responsavel_nome = serializers.CharField(
        source="responsavel_triagem.get_full_name", read_only=True
    )

    class Meta:
        model = TriagemDemanda
        fields = [
            "id",
            "numero_protocolo",
            "origem",
            "denuncia_portal",
            "denuncia_portal_numero",
            "ppa",
            "ppa_numero",
            "assunto",
            "descricao",
            "empresa_alvo",
            "cnpj_empresa",
            "endereco_empresa",
            "denunciante_nome",
            "denunciante_contato",
            "prioridade_sugerida",
            "prioridade_calculada",
            "prioridade_definida",
            "prazo_atendimento",
            "prazo_previsto_atendimento",
            "status",
            "decisao",
            "observacoes",
            "dados_extras",
            "criado_por",
            "criado_por_nome",
            "responsavel_triagem",
            "responsavel_nome",
            "ultima_atualizacao_por",
            "criado_em",
            "atualizado_em",
            "historico",
            "anexos",
        ]
        read_only_fields = [
            "id",
            "numero_protocolo",
            "prioridade_sugerida",
            "prioridade_calculada",
            "criado_por",
            "criado_por_nome",
            "ultima_atualizacao_por",
            "criado_em",
            "atualizado_em",
            "historico",
            "anexos",
            "denuncia_portal_numero",
            "ppa_numero",
            "responsavel_nome",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user and user.is_authenticated:
            validated_data.setdefault("criado_por", user)
            validated_data.setdefault("responsavel_triagem", user)

        triagem = TriagemDemanda.objects.create(**validated_data)
        triagem.registrar_evento(
            evento="criacao",
            descricao="Triagem criada no sistema.",
            usuario=user if user and user.is_authenticated else None,
        )
        criar_ppa_para_triagem(triagem, triagem.denuncia_portal)
        self._processar_anexos(triagem, request, user)
        enviar_confirmacao_triagem(triagem)
        return triagem

    def update(self, instance, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        usuario = user if user and user.is_authenticated else None
        request_data = getattr(request, "data", {}) if request else {}

        status_antigo = instance.status
        decisao_antiga = instance.decisao
        ppa_antigo = instance.ppa_id
        novo_status = validated_data.get("status", instance.status)

        motivo = (request_data.get("motivo") or "").strip()
        observacao_extra = (request_data.get("observacao_extra") or "").strip()

        if novo_status in {"aguardando_complemento", "arquivado", "fora_competencia"} and novo_status != status_antigo:
            if not motivo:
                raise serializers.ValidationError({"motivo": "Informe o motivo para essa movimentação."})
            if not observacao_extra:
                raise serializers.ValidationError(
                    {"observacao_extra": "Descreva a observação detalhada para essa movimentação."}
                )

        instance = super().update(instance, validated_data)

        if usuario:
            instance.ultima_atualizacao_por = usuario
            if "responsavel_triagem" not in validated_data and not instance.responsavel_triagem:
                instance.responsavel_triagem = usuario
            instance.save(update_fields=["ultima_atualizacao_por", "responsavel_triagem"])

        if instance.status != status_antigo:
            instance.registrar_evento(
                evento="mudanca_status",
                descricao=f"Status alterado de {status_antigo} para {instance.status}.",
                usuario=usuario,
            )
            if instance.status == "aguardando_complemento":
                instance.registrar_evento(
                    evento="solicitacao_complemento",
                    descricao=f"Solicitado complemento: {motivo}",
                    usuario=usuario,
                    dados={"motivo": motivo, "observacao": observacao_extra},
                    motivo=motivo,
                    observacao=observacao_extra,
                )
                enviar_pedido_complemento(instance, motivo, observacao_extra)
            if instance.status in {"arquivado", "fora_competencia"}:
                etiqueta = "Arquivamento" if instance.status == "arquivado" else "Fora da competencia"
                instance.registrar_evento(
                    evento="arquivamento",
                    descricao=f"{etiqueta} registrado: {motivo}",
                    usuario=usuario,
                    dados={"motivo": motivo, "observacao": observacao_extra},
                    motivo=motivo,
                    observacao=observacao_extra,
                )
            if instance.status == "encaminhado_fiscalizacao":
                evento_agenda = instance.agendar_fiscalizacao(usuario=usuario or instance.responsavel_triagem)
                dados_evento = {}
                descricao_evento = "Triagem encaminhada para fiscalização."
                if evento_agenda:
                    dados_evento["agenda_evento_id"] = evento_agenda.id
                    descricao_evento = (
                        "Triagem encaminhada para fiscalização com compromisso registrado na agenda."
                    )
                    enviar_aviso_agendamento(instance, evento_agenda)
                else:
                    descricao_evento = (
                        "Triagem encaminhada para fiscalização (não foi possível gerar compromisso automático)."
                    )
                instance.registrar_evento(
                    evento="encaminhamento_fiscalizacao",
                    descricao=descricao_evento,
                    usuario=usuario,
                    dados=dados_evento,
                )

        if instance.decisao != decisao_antiga:
            instance.registrar_evento(
                evento="mudanca_decisao",
                descricao=f"Decisão alterada de {decisao_antiga} para {instance.decisao}.",
                usuario=usuario,
            )

        if instance.ppa_id and instance.ppa_id != ppa_antigo:
            instance.registrar_evento(
                evento="vinculo_ppa",
                descricao=f"PPA {instance.ppa.numero} vinculado à triagem.",
                usuario=usuario,
            )

        self._processar_anexos(instance, request, user)
        instance.registrar_evento(
            evento="atualizacao",
            descricao="Triagem atualizada.",
            usuario=usuario,
        )
        return instance

    def _processar_anexos(self, triagem, request, user):
        if not request:
            return
        arquivos = request.FILES.getlist("anexos")
        if not arquivos:
            return

        usuario = user if user and user.is_authenticated else None
        for arquivo in arquivos:
            triagem.anexar_documento(arquivo, usuario=usuario)

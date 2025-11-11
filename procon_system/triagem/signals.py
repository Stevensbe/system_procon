from django.db.models.signals import post_save
from django.dispatch import receiver

from portal_cidadao.models import DenunciaCidadao

from .models import TriagemDemanda
from .services import criar_ppa_para_triagem


@receiver(post_save, sender=DenunciaCidadao)
def criar_triagem_para_denuncia_portal(sender, instance, created, **kwargs):
    """
    Sempre que uma denúncia for registrada pelo Portal do Cidadão,
    criamos automaticamente um registro na fila de triagem.
    """
    if not created:
        return

    # Evita duplicidade caso a denúncia já tenha sido sincronizada manualmente.
    if TriagemDemanda.objects.filter(denuncia_portal=instance).exists():
        return

    assunto = instance.tipo_infracao or "Denúncia via Portal"
    descricao = instance.descricao_fatos

    triagem = TriagemDemanda.objects.create(
        origem="PORTAL",
        denuncia_portal=instance,
        assunto=assunto[:255],
        descricao=descricao,
        empresa_alvo=instance.empresa_denunciada,
        cnpj_empresa=instance.cnpj_empresa,
        endereco_empresa=instance.endereco_empresa,
        denunciante_nome=instance.nome_denunciante,
        denunciante_contato=instance.email or instance.telefone,
        prioridade_sugerida="alta" if instance.tipo_infracao in ["saude", "seguranca"] else "media",
        dados_extras={
            "canal": "portal_cidadao",
            "ip": instance.ip_origem,
            "user_agent": instance.user_agent,
        },
    )

    triagem.registrar_evento(
        evento="criacao",
        descricao="Triagem criada automaticamente a partir de denúncia do Portal do Cidadão.",
    )

    criar_ppa_para_triagem(triagem, denuncia=instance)

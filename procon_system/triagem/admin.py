from django.contrib import admin

from .models import TriagemAnexo, TriagemDemanda, TriagemHistorico


@admin.register(TriagemDemanda)
class TriagemDemandaAdmin(admin.ModelAdmin):
    list_display = (
        "numero_protocolo",
        "origem",
        "empresa_alvo",
        "prioridade_sugerida",
        "status",
        "decisao",
        "criado_em",
    )
    list_filter = ("origem", "status", "decisao", "prioridade_sugerida", "prioridade_definida")
    search_fields = ("numero_protocolo", "empresa_alvo", "cnpj_empresa", "assunto")
    autocomplete_fields = ("denuncia_portal", "ppa", "criado_por", "responsavel_triagem")
    readonly_fields = ("numero_protocolo", "criado_em", "atualizado_em")


@admin.register(TriagemHistorico)
class TriagemHistoricoAdmin(admin.ModelAdmin):
    list_display = ("triagem", "evento", "motivo", "usuario", "criado_em")
    list_filter = ("evento", "criado_em")
    search_fields = ("triagem__numero_protocolo", "descricao", "motivo", "observacao")
    autocomplete_fields = ("triagem", "usuario")


@admin.register(TriagemAnexo)
class TriagemAnexoAdmin(admin.ModelAdmin):
    list_display = ("triagem", "nome_original", "enviado_por", "tamanho_legivel", "criado_em")
    search_fields = ("triagem__numero_protocolo", "triagem__assunto", "nome_original", "descricao")
    list_filter = ("criado_em",)
    autocomplete_fields = ("triagem", "enviado_por")

    @admin.display(description="Tamanho")
    def tamanho_legivel(self, obj):
        return obj.tamanho_legivel

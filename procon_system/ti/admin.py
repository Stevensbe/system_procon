from django.contrib import admin

from .models import ConfiguracaoSistema


@admin.register(ConfiguracaoSistema)
class ConfiguracaoSistemaAdmin(admin.ModelAdmin):
    list_display = ("chave", "valor", "tipo", "categoria", "editavel", "data_atualizacao")
    list_filter = ("categoria", "tipo", "editavel")
    search_fields = ("chave", "descricao")
    readonly_fields = ("data_atualizacao",)

    def get_queryset(self, request):
        ConfiguracaoSistema.ensure_defaults()
        return super().get_queryset(request)

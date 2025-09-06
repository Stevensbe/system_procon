from django.contrib import admin
from .models import (
    Departamento, Empresa, Multa, Cobranca,
    Peticao, Recurso, Analise,
    ConfigBancaria, ConfigSistema
)

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'descricao')
    search_fields = ('nome',)

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('razao_social', 'cnpj', 'ativo')
    search_fields = ('razao_social', 'cnpj')
    list_filter = ('ativo',)

@admin.register(Multa)
class MultaAdmin(admin.ModelAdmin):
    list_display = ('id','empresa','valor','data_emissao','pago')
    search_fields = ('empresa__razao_social',)
    list_filter = ('pago',)

@admin.register(Cobranca)
class CobrancaAdmin(admin.ModelAdmin):
    list_display = ('id','multa','data_vencimento','data_pagamento')
    list_filter = ('data_vencimento','data_pagamento')
    raw_id_fields = ('multa',)

@admin.register(Peticao)
class PeticaoAdmin(admin.ModelAdmin):
    list_display = ('id','processo','tipo','data')
    list_filter = ('tipo','data')
    raw_id_fields = ('processo',)

@admin.register(Recurso)
class RecursoAdmin(admin.ModelAdmin):
    list_display = ('id','processo','tipo','data')
    list_filter = ('tipo','data')
    raw_id_fields = ('processo',)

@admin.register(Analise)
class AnaliseAdmin(admin.ModelAdmin):
    list_display = ('id','recurso','tipo','decisao','data')
    list_filter = ('tipo','decisao')
    raw_id_fields = ('recurso',)

@admin.register(ConfigBancaria)
class ConfigBancariaAdmin(admin.ModelAdmin):
    list_display = ('banco','agencia','conta','convenio')

@admin.register(ConfigSistema)
class ConfigSistemaAdmin(admin.ModelAdmin):
    list_display = ('chave','valor')

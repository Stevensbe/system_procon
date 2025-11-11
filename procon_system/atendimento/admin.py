from django.contrib import admin

from .models import Atendimento, ConfiguracaoAtendimento, RegraDistribuicaoAtendimento


@admin.register(Atendimento)
class AtendimentoAdmin(admin.ModelAdmin):
    list_display = ('numero_atendimento', 'consumidor_nome', 'tipo_atendimento', 'status', 'data_atendimento')
    search_fields = ('numero_atendimento', 'consumidor_nome', 'consumidor_cpf')
    list_filter = ('tipo_atendimento', 'status', 'canal_atendimento')
    date_hierarchy = 'data_atendimento'


@admin.register(ConfiguracaoAtendimento)
class ConfiguracaoAtendimentoAdmin(admin.ModelAdmin):
    list_display = ('nome_sistema', 'versao', 'ativo', 'atualizado_em')
    search_fields = ('nome_sistema',)
    list_filter = ('ativo', 'consultar_receita_federal', 'validar_cnpj_automatico')
    readonly_fields = ('criado_em', 'atualizado_em')


@admin.register(RegraDistribuicaoAtendimento)
class RegraDistribuicaoAtendimentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'prioridade', 'gravidade', 'assunto', 'tipo_classificacao', 'responsavel', 'ativo')
    list_filter = ('ativo', 'gravidade', 'tipo_classificacao')
    search_fields = ('nome', 'assunto', 'responsavel__username', 'responsavel__first_name', 'responsavel__last_name')
    ordering = ('prioridade', 'nome')

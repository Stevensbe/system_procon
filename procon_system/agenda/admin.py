from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Fiscal, TipoEvento, EventoAgenda, ParticipacaoEvento, 
    LembreteEvento, CalendarioFiscalizacao
)


@admin.register(Fiscal)
class FiscalAdmin(admin.ModelAdmin):
    list_display = ['nome', 'matricula', 'email', 'telefone', 'ativo']
    list_filter = ['ativo']
    search_fields = ['nome', 'matricula', 'email']
    ordering = ['nome']


@admin.register(TipoEvento)
class TipoEventoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cor_visual', 'duracao_padrao', 'permite_conflito', 'ativo']
    list_filter = ['permite_conflito', 'ativo']
    search_fields = ['nome']
    ordering = ['nome']
    
    def cor_visual(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border-radius: 3px;"></div>',
            obj.cor
        )
    cor_visual.short_description = 'Cor'


class ParticipacaoEventoInline(admin.TabularInline):
    model = ParticipacaoEvento
    extra = 1
    fields = ['fiscal', 'status_participacao', 'observacoes']


class LembreteEventoInline(admin.TabularInline):
    model = LembreteEvento
    extra = 0
    readonly_fields = ['data_agendada', 'status', 'data_envio']
    fields = ['fiscal', 'canal', 'antecedencia_minutos', 'data_agendada', 'status']


@admin.register(EventoAgenda)
class EventoAgendaAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'tipo', 'fiscal_responsavel', 'data_inicio', 
        'data_fim', 'status', 'prioridade'
    ]
    list_filter = [
        'tipo', 'status', 'prioridade', 'data_inicio', 
        'fiscal_responsavel', 'recorrente'
    ]
    search_fields = ['titulo', 'descricao', 'local']
    readonly_fields = ['criado_em', 'atualizado_em']
    date_hierarchy = 'data_inicio'
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                ('titulo', 'tipo'),
                'descricao',
                ('status', 'prioridade')
            )
        }),
        ('Data e Hora', {
            'fields': (
                ('data_inicio', 'data_fim'),
                'dia_inteiro'
            )
        }),
        ('Responsáveis', {
            'fields': (
                'fiscal_responsavel',
            )
        }),
        ('Local', {
            'fields': (
                'local',
                'endereco',
                'observacoes_local'
            ),
            'classes': ('collapse',)
        }),
        ('Lembretes', {
            'fields': (
                ('lembrete_antecedencia', 'lembrete_enviado'),
            ),
            'classes': ('collapse',)
        }),
        ('Recorrência', {
            'fields': (
                'recorrente',
                ('tipo_recorrencia', 'intervalo_recorrencia'),
                'fim_recorrencia',
                'evento_pai'
            ),
            'classes': ('collapse',)
        }),
        ('Relacionamentos', {
            'fields': (
                'empresa_relacionada',
                'processo_relacionado'
            ),
            'classes': ('collapse',)
        }),
        ('Controle', {
            'fields': (
                ('criado_por', 'criado_em', 'atualizado_em'),
            ),
            'classes': ('collapse',)
        })
    )
    
    inlines = [ParticipacaoEventoInline, LembreteEventoInline]
    
    actions = ['marcar_como_concluido', 'marcar_como_cancelado', 'enviar_lembretes']
    
    def marcar_como_concluido(self, request, queryset):
        queryset.update(status='concluido')
        self.message_user(request, f"{queryset.count()} eventos marcados como concluídos.")
    marcar_como_concluido.short_description = "Marcar como concluído"
    
    def marcar_como_cancelado(self, request, queryset):
        queryset.update(status='cancelado')
        self.message_user(request, f"{queryset.count()} eventos cancelados.")
    marcar_como_cancelado.short_description = "Cancelar eventos"
    
    def enviar_lembretes(self, request, queryset):
        total_enviados = 0
        for evento in queryset:
            lembretes = evento.lembretes.filter(status='pendente')
            for lembrete in lembretes:
                if lembrete.enviar():
                    total_enviados += 1
        
        self.message_user(request, f"{total_enviados} lembretes enviados.")
    enviar_lembretes.short_description = "Enviar lembretes pendentes"


@admin.register(ParticipacaoEvento)
class ParticipacaoEventoAdmin(admin.ModelAdmin):
    list_display = ['evento', 'fiscal', 'status_participacao', 'data_confirmacao']
    list_filter = ['status_participacao', 'data_confirmacao']
    search_fields = ['evento__titulo', 'fiscal__nome']
    ordering = ['-evento__data_inicio']


@admin.register(LembreteEvento)
class LembreteEventoAdmin(admin.ModelAdmin):
    list_display = [
        'evento', 'fiscal', 'canal', 'antecedencia_minutos', 
        'data_agendada', 'status', 'data_envio'
    ]
    list_filter = ['canal', 'status', 'data_agendada']
    search_fields = ['evento__titulo', 'fiscal__nome']
    readonly_fields = ['data_envio']
    ordering = ['data_agendada']
    
    actions = ['enviar_lembretes_selecionados']
    
    def enviar_lembretes_selecionados(self, request, queryset):
        enviados = 0
        for lembrete in queryset.filter(status='pendente'):
            if lembrete.enviar():
                enviados += 1
        
        self.message_user(request, f"{enviados} lembretes enviados com sucesso.")
    enviar_lembretes_selecionados.short_description = "Enviar lembretes selecionados"


@admin.register(CalendarioFiscalizacao)
class CalendarioFiscalizacaoAdmin(admin.ModelAdmin):
    list_display = [
        'nome', 'tipo_fiscalizacao', 'data_programada', 
        'fiscal_responsavel', 'status', 'autos_lavrados'
    ]
    list_filter = [
        'tipo_fiscalizacao', 'status', 'data_programada', 
        'fiscal_responsavel'
    ]
    search_fields = ['nome', 'empresas_alvo', 'regiao_alvo']
    readonly_fields = ['criado_em']
    date_hierarchy = 'data_programada'
    
    fieldsets = (
        ('Identificação', {
            'fields': (
                ('nome', 'tipo_fiscalizacao'),
                'descricao'
            )
        }),
        ('Programação', {
            'fields': (
                ('data_programada', 'hora_inicio', 'hora_fim'),
                ('fiscal_responsavel', 'fiscal_apoio')
            )
        }),
        ('Alvos', {
            'fields': (
                'empresas_alvo',
                ('setor_alvo', 'regiao_alvo')
            )
        }),
        ('Status e Resultados', {
            'fields': (
                ('status', 'data_execucao'),
                ('estabelecimentos_visitados', 'autos_lavrados'),
                'observacoes_resultado'
            )
        }),
        ('Controle', {
            'fields': (
                ('criado_por', 'criado_em'),
            ),
            'classes': ('collapse',)
        })
    )
    
    actions = [
        'gerar_eventos_agenda', 'marcar_como_concluida', 
        'marcar_como_em_execucao'
    ]
    
    def gerar_eventos_agenda(self, request, queryset):
        eventos_criados = 0
        for fiscalizacao in queryset:
            evento = fiscalizacao.gerar_evento_agenda()
            if evento:
                eventos_criados += 1
        
        self.message_user(
            request, 
            f"{eventos_criados} eventos criados na agenda geral."
        )
    gerar_eventos_agenda.short_description = "Gerar eventos na agenda"
    
    def marcar_como_concluida(self, request, queryset):
        queryset.update(status='concluida')
        self.message_user(request, f"{queryset.count()} fiscalizações marcadas como concluídas.")
    marcar_como_concluida.short_description = "Marcar como concluída"
    
    def marcar_como_em_execucao(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='em_execucao', data_execucao=timezone.now().date())
        self.message_user(request, f"{queryset.count()} fiscalizações marcadas como em execução.")
    marcar_como_em_execucao.short_description = "Marcar como em execução"
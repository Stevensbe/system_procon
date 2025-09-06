from django.contrib import admin
from .models import Lei, Artigo

class ArtigoInline(admin.TabularInline):
    model = Artigo
    extra = 1

@admin.register(Lei)
class LeiAdmin(admin.ModelAdmin):
    list_display = ('numero', 'titulo', 'publicada_em')
    search_fields = ('numero', 'titulo')
    inlines = [ArtigoInline]

@admin.register(Artigo)
class ArtigoAdmin(admin.ModelAdmin):
    list_display = ('lei', 'numero_artigo')
    search_fields = ('lei__numero', 'numero_artigo', 'texto')

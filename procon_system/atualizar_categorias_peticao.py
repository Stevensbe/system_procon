#!/usr/bin/env python
"""
Script para atualizar as categorias dos tipos de petição existentes
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from peticionamento.models import TipoPeticao

def atualizar_categorias():
    """Atualiza as categorias dos tipos de petição existentes"""
    
    # Mapeamento de categorias antigas para novas
    mapeamento = {
        'DENUNCIA': 'DEFESA',
        'RECLAMACAO': 'DEFESA',
        'SOLICITACAO': 'SOLICITACAO',
        'RECURSO': 'RECURSO',
        'OUTROS': 'OUTROS'
    }
    
    print("Atualizando categorias dos tipos de petição...")
    
    tipos = TipoPeticao.objects.all()
    for tipo in tipos:
        if tipo.categoria in mapeamento:
            categoria_antiga = tipo.categoria
            tipo.categoria = mapeamento[tipo.categoria]
            tipo.save()
            print(f"✅ {tipo.nome}: {categoria_antiga} → {tipo.categoria}")
        else:
            print(f"⚠️  {tipo.nome}: categoria '{tipo.categoria}' não mapeada")
    
    print(f"\nTotal de tipos atualizados: {tipos.count()}")
    print("Categorias atualizadas com sucesso!")

if __name__ == '__main__':
    atualizar_categorias()

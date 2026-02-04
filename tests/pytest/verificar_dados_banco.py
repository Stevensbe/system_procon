#!/usr/bin/env python3
"""
Script para verificar dados no banco e identificar problemas com filtros
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from caixa_entrada.models import CaixaEntrada

def verificar_dados():
    """Verifica os dados no banco"""
    
    print("🔍 VERIFICANDO DADOS NO BANCO")
    print("=" * 50)
    
    # Total de documentos
    total = CaixaEntrada.objects.count()
    print(f"📊 Total de documentos: {total}")
    
    # Verificar setores únicos
    setores = CaixaEntrada.objects.values_list('setor_destino', flat=True).distinct()
    print(f"🏢 Setores únicos: {list(setores)}")
    
    # Verificar tipos de documento únicos
    tipos = CaixaEntrada.objects.values_list('tipo_documento', flat=True).distinct()
    print(f"📄 Tipos de documento únicos: {list(tipos)}")
    
    # Verificar status únicos
    status = CaixaEntrada.objects.values_list('status', flat=True).distinct()
    print(f"📋 Status únicos: {list(status)}")
    
    # Contar por setor
    print("\n📊 CONTAGEM POR SETOR:")
    for setor in setores:
        count = CaixaEntrada.objects.filter(setor_destino=setor).count()
        print(f"   {setor}: {count}")
    
    # Contar por tipo
    print("\n📊 CONTAGEM POR TIPO:")
    for tipo in tipos:
        count = CaixaEntrada.objects.filter(tipo_documento=tipo).count()
        print(f"   {tipo}: {count}")
    
    # Testar filtros específicos
    print("\n🧪 TESTANDO FILTROS ESPECÍFICOS:")
    
    # Testar filtro de setor
    fiscalizacao = CaixaEntrada.objects.filter(setor_destino__icontains='FISCALIZACAO').count()
    print(f"   setor_destino__icontains='FISCALIZACAO': {fiscalizacao}")
    
    # Testar filtro de tipo
    denuncias = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').count()
    print(f"   tipo_documento='DENUNCIA': {denuncias}")
    
    peticoes = CaixaEntrada.objects.filter(tipo_documento='PETICAO').count()
    print(f"   tipo_documento='PETICAO': {peticoes}")
    
    # Mostrar alguns exemplos
    print("\n📋 EXEMPLOS DE DOCUMENTOS:")
    documentos = CaixaEntrada.objects.all()[:5]
    for doc in documentos:
        print(f"   {doc.numero_protocolo} - {doc.tipo_documento} - {doc.setor_destino}")

if __name__ == "__main__":
    verificar_dados()

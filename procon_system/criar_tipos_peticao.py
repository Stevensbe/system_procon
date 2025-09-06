#!/usr/bin/env python
"""
Script para criar os tipos de petição corretos no sistema PROCON
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from peticionamento.models import TipoPeticao

def criar_tipos_peticao():
    """Cria os tipos de petição específicos do sistema jurídico"""
    
    tipos = [
        {
            'nome': 'Apresentação de Defesa Processual',
            'descricao': 'Apresentação formal de defesa em processo administrativo',
            'categoria': 'DEFESA',
            'prazo_resposta_dias': 30,
            'requer_documentos': True,
            'permite_anonimo': False,
            'ordem_exibicao': 1
        },
        {
            'nome': 'Inserir Anexo de Defesa Processual Jurídico 1ª Instância',
            'descricao': 'Anexação de documentos complementares à defesa processual na 1ª instância',
            'categoria': 'DEFESA',
            'prazo_resposta_dias': 15,
            'requer_documentos': True,
            'permite_anonimo': False,
            'ordem_exibicao': 2
        },
        {
            'nome': 'Inserir Anexo de Defesa Processual Jurídico 2ª Instância',
            'descricao': 'Anexação de documentos complementares à defesa processual na 2ª instância',
            'categoria': 'DEFESA',
            'prazo_resposta_dias': 15,
            'requer_documentos': True,
            'permite_anonimo': False,
            'ordem_exibicao': 3
        },
        {
            'nome': 'Solicitação de Carga (Cópia ou Acesso aos Autos) de Processo da 1ª Instância',
            'descricao': 'Solicitação de cópia ou acesso aos autos de processo na 1ª instância',
            'categoria': 'SOLICITACAO',
            'prazo_resposta_dias': 10,
            'requer_documentos': False,
            'permite_anonimo': False,
            'ordem_exibicao': 4
        },
        {
            'nome': 'Solicitação de Carga (Cópia ou Acesso aos Autos) de Processo da 2ª Instância',
            'descricao': 'Solicitação de cópia ou acesso aos autos de processo na 2ª instância',
            'categoria': 'SOLICITACAO',
            'prazo_resposta_dias': 10,
            'requer_documentos': False,
            'permite_anonimo': False,
            'ordem_exibicao': 5
        },
        {
            'nome': 'Solicitação de Guia para Recolhimento de Multa-GRM. Processos em 1ª Instância',
            'descricao': 'Solicitação de guia para recolhimento de multa em processos da 1ª instância',
            'categoria': 'SOLICITACAO',
            'prazo_resposta_dias': 5,
            'requer_documentos': False,
            'permite_anonimo': False,
            'ordem_exibicao': 6
        }
    ]
    
    print("Criando tipos de petição...")
    
    for tipo_data in tipos:
        tipo, created = TipoPeticao.objects.get_or_create(
            nome=tipo_data['nome'],
            defaults=tipo_data
        )
        
        if created:
            print(f"✅ Criado: {tipo.nome}")
        else:
            print(f"⚠️  Já existe: {tipo.nome}")
    
    print(f"\nTotal de tipos de petição: {TipoPeticao.objects.count()}")
    print("\nTipos criados com sucesso!")

if __name__ == '__main__':
    criar_tipos_peticao()

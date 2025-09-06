#!/usr/bin/env python
"""
Script para debugar o erro na API de denúncia
"""

import os
import sys
import django
from datetime import datetime

# Configurar Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'procon_system'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from portal_cidadao.views import DenunciaCidadaoAPIView
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
import json

def debug_api_denuncia():
    """Debugar API de denúncia diretamente"""
    
    print("=== DEBUG API DENUNCIA ===")
    
    # Criar factory de request
    factory = APIRequestFactory()
    
    # Dados de teste
    dados_teste = {
        "empresa_denunciada": "Empresa Debug Teste",
        "cnpj_empresa": "12.345.678/0001-90",
        "endereco_empresa": "Rua Debug, 123",
        "telefone_empresa": "(92) 3234-5678",
        "email_empresa": "debug@teste.com.br",
        "descricao_fatos": "Teste de debug para identificar erro 500 na API de denúncia do sistema.",
        "tipo_infracao": "cobranca_indevida",
        "nome_denunciante": "Debug Tester",
        "cpf_cnpj": "123.456.789-00",
        "email": "debug@email.com",
        "telefone": "(92) 9 9999-9999",
        "denuncia_anonima": False
    }
    
    print("Dados:", json.dumps(dados_teste, indent=2))
    
    # Criar request
    request = factory.post(
        '/api/portal/api/denuncia/',
        data=dados_teste,
        format='json'
    )
    
    # Criar view
    view = DenunciaCidadaoAPIView()
    
    try:
        print("Executando view...")
        response = view.post(request)
        print("SUCESSO!")
        print("Status:", response.status_code)
        print("Data:", response.data)
        
    except Exception as e:
        print("ERRO CAPTURADO:")
        print(f"Tipo: {type(e).__name__}")
        print(f"Mensagem: {e}")
        
        # Mostrar traceback detalhado
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_api_denuncia()
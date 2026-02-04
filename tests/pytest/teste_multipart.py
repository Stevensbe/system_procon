import requests

# Simular envio como o frontend faz (multipart/form-data)
url = "http://localhost:8000/api/portal/api/denuncia/"

# Dados como FormData (multipart)
dados_multipart = {
    'empresa_denunciada': 'Empresa Multipart Teste',
    'cnpj_empresa': '12.345.678/0001-90',
    'endereco_empresa': 'Rua Multipart, 123',
    'telefone_empresa': '(92) 3234-5678',
    'email_empresa': 'multipart@teste.com.br',
    'descricao_fatos': 'Teste de integracao com multipart/form-data como o frontend envia',
    'tipo_infracao': 'cobranca_indevida',
    'nome_denunciante': 'Frontend Tester',
    'cpf_cnpj': '987.654.321-00',
    'email': 'frontend@email.com',
    'telefone': '(92) 9 8888-8888',
    'denuncia_anonima': 'false'  # Como string, igual o frontend
}

print("Testando com multipart/form-data (como o frontend)...")
print(f"URL: {url}")

try:
    # Enviar como multipart/form-data (sem files por enquanto)
    response = requests.post(url, data=dados_multipart, timeout=10)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        print("SUCESSO!")
        print("Resposta:", response.json())
    else:
        print("ERRO!")
        print("Resposta:", response.text[:500])
        
except Exception as e:
    print(f"ERRO: {e}")
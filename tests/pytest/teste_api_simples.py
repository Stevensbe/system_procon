import requests
import json

# URL do endpoint
url = "http://localhost:8000/api/portal/api/denuncia/"

# Dados de teste
dados = {
    "empresa_denunciada": "Empresa Teste API",
    "cnpj_empresa": "12.345.678/0001-90",
    "descricao_fatos": "Teste de integracao via API",
    "tipo_infracao": "cobranca_indevida",
    "nome_denunciante": "Maria da Silva",
    "cpf_cnpj": "987.654.321-00",
    "email": "maria@email.com",
    "telefone": "(92) 9 8888-8888",
    "denuncia_anonima": False
}

print("Testando API de denuncia...")
print(f"URL: {url}")

try:
    response = requests.post(url, json=dados, timeout=10)
    print(f"Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        print("SUCESSO!")
        print("Resposta:", response.json())
    else:
        print("ERRO!")
        print("Resposta:", response.text)
        
except requests.exceptions.ConnectionError:
    print("ERRO: Nao foi possivel conectar ao servidor")
except Exception as e:
    print(f"ERRO: {e}")
import os
import sys
import django
from datetime import datetime

# Configurar Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'procon_system'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from portal_cidadao.models import DenunciaCidadao
from caixa_entrada.models import CaixaEntrada

# Contar antes
count_before = CaixaEntrada.objects.count()
print(f"Documentos na caixa antes: {count_before}")

# Criar denúncia
denuncia = DenunciaCidadao.objects.create(
    empresa_denunciada='Empresa Teste',
    descricao_fatos='Teste de integração',
    nome_denunciante='João Silva',
    cpf_cnpj='123.456.789-00'
)

print(f"Denúncia criada: {denuncia.numero_denuncia}")

# Aguardar
import time
time.sleep(3)

# Contar depois
count_after = CaixaEntrada.objects.count()
print(f"Documentos na caixa depois: {count_after}")

if count_after > count_before:
    doc = CaixaEntrada.objects.filter(tipo_documento='DENUNCIA').order_by('-data_entrada').first()
    print(f"SUCESSO! Documento criado: {doc.numero_protocolo}")
    print(f"Setor: {doc.setor_destino}")
else:
    print("ERRO: Nenhum documento foi criado!")
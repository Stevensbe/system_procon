#!/usr/bin/env python
"""
Script para criar dados de exemplo no sistema
"""
import os
import sys
import django
from datetime import date, time

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings_temp')
django.setup()

from fiscalizacao.models import AutoBanco, AutoPosto, AutoSupermercado, AutoDiversos

def criar_dados_exemplo():
    print("🏗️ Criando dados de exemplo...")
    
    # Limpar dados existentes
    AutoBanco.objects.all().delete()
    AutoPosto.objects.all().delete()
    AutoSupermercado.objects.all().delete()
    AutoDiversos.objects.all().delete()
    
    # Criar Auto de Banco
    banco1 = AutoBanco.objects.create(
        numero="001/2025",
        razao_social="Banco do Brasil S.A.",
        nome_fantasia="Banco do Brasil",
        atividade="Atividades bancárias",
        endereco="Av. Paulista, 1000",
        cep="01310-100",
        municipio="São Paulo",
        estado="SP",
        cnpj="00.000.000/0001-91",
        telefone="(11) 3000-0000",
        data_fiscalizacao=date.today(),
        hora_fiscalizacao=time(14, 30),
        origem="acao",
        porte="grande",
        atuacao="Nacional",
        nada_consta=False,
        sem_irregularidades=False,
        todos_caixas_funcionando=False,
        distribuiu_senha=True,
        ausencia_cartaz_informativo=True,
        observacoes="Encontradas irregularidades na lei das filas"
    )
    
    # Criar Auto de Posto
    posto1 = AutoPosto.objects.create(
        numero="002/2025",
        razao_social="Posto ABC Ltda",
        nome_fantasia="Posto ABC",
        atividade="Comércio de combustíveis",
        endereco="Rua das Flores, 500",
        cep="01234-567",
        municipio="Rio de Janeiro",
        estado="RJ",
        cnpj="11.111.111/0001-11",
        telefone="(21) 2000-0000",
        data_fiscalizacao=date.today(),
        hora_fiscalizacao=time(10, 15),
        origem="denuncia",
        porte="medio",
        atuacao="Regional",
        nada_consta=False,
        sem_irregularidades=False,
        preco_gasolina_comum=5.899,
        preco_etanol=3.999,
        preco_diesel_comum=4.799,
        matricula_fiscal_1="12345"
    )
    
    # Criar Auto de Supermercado
    super1 = AutoSupermercado.objects.create(
        numero="003/2025",
        razao_social="Supermercado XYZ S.A.",
        nome_fantasia="Super XYZ",
        atividade="Comércio varejista de produtos alimentícios",
        endereco="Av. Central, 2000",
        cep="12345-678",
        municipio="Belo Horizonte",
        estado="MG",
        cnpj="22.222.222/0001-22",
        telefone="(31) 3000-1111",
        data_fiscalizacao=date.today(),
        hora_fiscalizacao=time(16, 45),
        origem="acao",
        nada_consta=False,
        comercializar_produtos_vencidos=True,
        comercializar_embalagem_violada=True,
        afixacao_precos_fora_padrao=True,
        outras_irregularidades="Produtos com validade vencida encontrados na gôndola"
    )
    
    # Criar Auto Diversos
    diversos1 = AutoDiversos.objects.create(
        numero="004/2025",
        razao_social="Loja de Roupas Fashion Ltda",
        nome_fantasia="Fashion Store",
        atividade="Comércio varejista de vestuário",
        endereco="Rua da Moda, 100",
        cep="87654-321",
        municipio="Porto Alegre",
        estado="RS",
        cnpj="33.333.333/0001-33",
        telefone="(51) 3200-0000",
        data_fiscalizacao=date.today(),
        hora_fiscalizacao=time(11, 20),
        origem="forca_tarefa",
        porte="pequeno",
        atuacao="Local",
        publicidade_enganosa=True,
        ausencia_afixacao_precos=True,
        advertencia=True,
        outras_irregularidades="Publicidade enganosa em promoções"
    )
    
    print("✅ Dados criados com sucesso!")
    print(f"📊 Criados:")
    print(f"  • {AutoBanco.objects.count()} Autos de Banco")
    print(f"  • {AutoPosto.objects.count()} Autos de Posto") 
    print(f"  • {AutoSupermercado.objects.count()} Autos de Supermercado")
    print(f"  • {AutoDiversos.objects.count()} Autos Diversos")
    
    print(f"\n🔗 Teste as URLs:")
    print(f"  • http://localhost:8000/api/bancos/")
    print(f"  • http://localhost:8000/api/postos/")
    print(f"  • http://localhost:8000/api/supermercados/")
    print(f"  • http://localhost:8000/api/diversos/")

if __name__ == '__main__':
    criar_dados_exemplo()

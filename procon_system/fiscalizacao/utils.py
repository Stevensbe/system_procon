# fiscalizacao/utils.py
from django.db import transaction
from django.utils import timezone

@transaction.atomic
def gerar_proximo_numero_auto():
    """
    Gera o próximo número sequencial para um auto de constatação de forma segura.
    
    IMPORTANTE: Esta função gera uma sequência ÚNICA para TODOS os tipos de auto:
    - Auto Banco: 001/2025
    - Auto Posto: 002/2025  
    - Auto Supermercado: 003/2025
    - Auto Diversos: 004/2025
    - etc.
    
    Usa 'select_for_update' para evitar race conditions quando múltiplos autos
    são criados simultaneamente.
    
    Returns:
        str: Número no formato "001/2025", "002/2025", etc.
    """
    from .models import SequenciaAutos  # Import local para evitar imports circulares
    
    ano_atual = timezone.now().year
    
    # Pega ou cria a sequência para o ano atual, travando a linha no banco de dados
    # para garantir que nenhuma outra requisição possa usá-la ao mesmo tempo.
    sequencia, created = SequenciaAutos.objects.select_for_update().get_or_create(
        ano=ano_atual,
        defaults={'ultimo_numero': 0}
    )
    
    # Incrementa o número
    sequencia.ultimo_numero += 1
    sequencia.save()
    
    # Formata o número no formato desejado: 001/2025, 002/2025, etc.
    return f"{sequencia.ultimo_numero:03d}/{ano_atual}"

# Funções auxiliares para validação
def validar_cnpj(cnpj):
    """Validação básica de CNPJ"""
    if not cnpj:
        return False
    cnpj_limpo = cnpj.replace('.', '').replace('/', '').replace('-', '')
    return len(cnpj_limpo) == 14 and cnpj_limpo.isdigit()

def validar_cpf(cpf):
    """Validação básica de CPF"""
    if not cpf:
        return False
    cpf_limpo = cpf.replace('.', '').replace('-', '')
    return len(cpf_limpo) == 11 and cpf_limpo.isdigit()

def obter_proximo_numero_preview():
    """
    Retorna uma prévia do próximo número que será gerado (sem salvar).
    Útil para mostrar ao usuário qual será o próximo número.
    """
    from .models import SequenciaAutos
    
    ano_atual = timezone.now().year
    
    try:
        sequencia = SequenciaAutos.objects.get(ano=ano_atual)
        proximo_numero = sequencia.ultimo_numero + 1
    except SequenciaAutos.DoesNotExist:
        proximo_numero = 1
    
    return f"{proximo_numero:03d}/{ano_atual}"

@transaction.atomic
def gerar_proximo_numero_auto_apreensao():
    """
    Gera o próximo número sequencial para um auto de apreensão/inutilização.
    
    Returns:
        str: Número no formato "001/2025", "002/2025", etc.
    """
    from .models import SequenciaAutosApreensao  # Import local para evitar imports circulares
    
    ano_atual = timezone.now().year
    
    # Pega ou cria a sequência para o ano atual, travando a linha no banco de dados
    sequencia, created = SequenciaAutosApreensao.objects.select_for_update().get_or_create(
        ano=ano_atual,
        defaults={'ultimo_numero': 0}
    )
    
    # Incrementa o número
    sequencia.ultimo_numero += 1
    sequencia.save()
    
    # Formata o número no formato desejado: 001/2025, 002/2025, etc.
    return f"{sequencia.ultimo_numero:03d}/{ano_atual}"

def obter_proximo_numero_apreensao_preview():
    """
    Retorna uma prévia do próximo número de apreensão que será gerado (sem salvar).
    """
    from .models import SequenciaAutosApreensao
    
    ano_atual = timezone.now().year
    
    try:
        sequencia = SequenciaAutosApreensao.objects.get(ano=ano_atual)
        proximo_numero = sequencia.ultimo_numero + 1
    except SequenciaAutosApreensao.DoesNotExist:
        proximo_numero = 1
    
    return f"{proximo_numero:03d}/{ano_atual}"
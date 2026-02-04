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


@transaction.atomic
def gerar_proximo_numero_notificacao_fiscalizacao():
    """
    Gera o pr¢ximo n£mero sequencial para notificacoes da fiscalizacao.
    """
    from .models import SequenciaNotificacaoFiscalizacao

    ano_atual = timezone.now().year
    sequencia, created = SequenciaNotificacaoFiscalizacao.objects.select_for_update().get_or_create(
        ano=ano_atual,
        defaults={'ultimo_numero': 0}
    )

    sequencia.ultimo_numero += 1
    sequencia.save()

    return f"{sequencia.ultimo_numero:03d}/{ano_atual}"

@transaction.atomic
def gerar_proximo_numero_processo_sei():
    """
    Gera o próximo número sequencial para um processo administrativo no padrão SEI.
    
    Formato SEI: 00001.012345/2025-49
    - 00001: número sequencial da unidade no ano (5 dígitos)
    - 012345: número sequencial principal do órgão (6 dígitos)
    - 2025: ano
    - 49: dígito verificador
    
    Usa 'select_for_update' para evitar race conditions quando múltiplos processos
    são criados simultaneamente.
    
    Returns:
        str: Número no formato "00001.012345/2025-49"
    """
    from .models import SequenciaProcesso  # Import local para evitar imports circulares
    
    ano_atual = timezone.now().year
    
    # Pega ou cria a sequência para o ano atual, travando a linha no banco de dados
    sequencia, created = SequenciaProcesso.objects.select_for_update().get_or_create(
        ano=ano_atual,
        defaults={
            'ultimo_sequencial_unidade': 0,
            'ultimo_sequencial_orgao': 0
        }
    )
    
    # Incrementa ambos os números sequenciais
    sequencia.ultimo_sequencial_unidade += 1
    sequencia.ultimo_sequencial_orgao += 1
    sequencia.save()
    
    dv = _calcular_dv_processo_sei(
        sequencia.ultimo_sequencial_unidade,
        sequencia.ultimo_sequencial_orgao,
        ano_atual,
    )
    
    # Formata o número no padrão SEI: 00001.012345/2025-49
    return (
        f"{sequencia.ultimo_sequencial_unidade:05d}."
        f"{sequencia.ultimo_sequencial_orgao:06d}/{ano_atual}-{dv}"
    )


def obter_proximo_numero_processo_sei_preview():
    """
    Retorna uma prévia do próximo número de processo que será gerado (sem salvar).
    Útil para mostrar ao usuário qual será o próximo número.
    
    Returns:
        str: Número no formato "00001.012345/2025-49"
    """
    from .models import SequenciaProcesso
    
    ano_atual = timezone.now().year
    
    try:
        sequencia = SequenciaProcesso.objects.get(ano=ano_atual)
        proximo_unidade = sequencia.ultimo_sequencial_unidade + 1
        proximo_orgao = sequencia.ultimo_sequencial_orgao + 1
    except SequenciaProcesso.DoesNotExist:
        proximo_unidade = 1
        proximo_orgao = 1
    
    dv = _calcular_dv_processo_sei(proximo_unidade, proximo_orgao, ano_atual)
    return f"{proximo_unidade:05d}.{proximo_orgao:06d}/{ano_atual}-{dv}"


def _calcular_dv_processo_sei(sequencial_unidade: int, sequencial_orgao: int, ano: int) -> str:
    """
    Calcula o dígito verificador (2 dígitos) para o número SEI.
    Usa módulo 97 sobre a concatenação dos campos numéricos.
    """
    base = f"{sequencial_unidade:05d}{sequencial_orgao:06d}{ano:04d}"
    resto = int(base) % 97
    dv = 98 - resto
    return f"{dv:02d}"

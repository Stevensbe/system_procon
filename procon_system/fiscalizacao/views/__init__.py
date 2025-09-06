"""
Views modulares para o app de fiscalização - System Procon

Este módulo organiza as views em arquivos separados para melhor manutenibilidade:

- auto_views.py: Views para Auto de Constatação (Banco, Posto, Supermercado, Diversos)
- infracao_views.py: Views para Auto de Infração
- processo_views.py: Views para Processos Administrativos
- dashboard_views.py: Views para Dashboard e Estatísticas
- utils_views.py: Views utilitárias (validações, uploads, etc.)
"""

# Importa todas as views dos módulos para manter compatibilidade
from .auto_views import *
from .infracao_views import *
from .processo_views import *
from .dashboard_views import *
from .utils_views import *

# Mantém compatibilidade com imports diretos
__all__ = [
    # Auto Views
    'AutoBancoListCreateAPIView',
    'AutoBancoRetrieveUpdateDestroyAPIView',
    'AutoPostoListCreateAPIView', 
    'AutoPostoRetrieveUpdateDestroyAPIView',
    'AutoSupermercadoListCreateAPIView',
    'AutoSupermercadoRetrieveUpdateDestroyAPIView',
    'AutoDiversosListCreateAPIView',
    'AutoDiversosRetrieveUpdateDestroyAPIView',
    
    # Infração Views
    'AutoInfracaoListCreateAPIView',
    'AutoInfracaoRetrieveUpdateDestroyAPIView',
    'criar_infracao_de_auto',
    'infrações_por_auto',
    'autos_com_potencial_infracao',
    'atualizar_status_infracao',
    
    # Processo Views
    'ProcessoListCreateAPIView',
    'ProcessoDetailAPIView',
    'atualizar_status_processo',
    'historico_processo',
    'processos_dashboard',
    'relatorio_mensal_processos',
    'buscar_processos',
    'opcoes_filtros',
    'validar_numero_processo',
    'sugerir_numero_processo',
    'exportar_processos',
    'estatisticas_avancadas',
    'operacoes_lote',
    'DocumentoProcessoListCreateAPIView',
    'upload_documento_processo',
    'buscar_processo_unificado',
    'listar_todos_processos',
    'processos_dashboard_cached',
    'busca_avancada_processos',
    'teste_performance_busca',
    
    # Dashboard Views
    'dashboard_stats',
    'estatisticas_gerais',
    
    # Utils Views
    'buscar_autos',
    'validar_cnpj',
    'proximos_numeros',
    'upload_anexo',
    'relatorio_consolidado',
    'gerar_documento_banco',
    'gerar_documento_posto',
    'gerar_documento_supermercado',
    'gerar_documento_diversos',
    
    # Related Models Views
    'AtendimentoCaixaBancoListAPIView',
    'NotaFiscalPostoListAPIView',
    'CupomFiscalPostoListAPIView',
    'AnexoAutoListAPIView',
]

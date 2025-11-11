# fiscalizacao/urls.py
# VERSÃO MODULAR - USANDO NOVA ESTRUTURA DE VIEWS

from django.urls import path
from .views import (
    # Auto Views
    AutoBancoListCreateAPIView,
    AutoBancoRetrieveUpdateDestroyAPIView,
    AutoPostoListCreateAPIView,
    AutoPostoRetrieveUpdateDestroyAPIView,
    AutoSupermercadoListCreateAPIView,
    AutoSupermercadoRetrieveUpdateDestroyAPIView,
    AutoDiversosListCreateAPIView,
    AutoDiversosRetrieveUpdateDestroyAPIView,
    
    # Infração Views
    AutoInfracaoListCreateAPIView,
    AutoInfracaoRetrieveUpdateDestroyAPIView,
    gerar_documento_infracao_docx,
    criar_infracao_de_auto,
    infrações_por_auto,
    autos_com_potencial_infracao,
    atualizar_status_infracao,
    
    # Processo Views
    ProcessoListCreateAPIView,
    ProcessoDetailAPIView,
    atualizar_status_processo,
    historico_processo,
    processos_dashboard,
    relatorio_mensal_processos,
    buscar_processos,
    opcoes_filtros,
    validar_numero_processo,
    sugerir_numero_processo,
    exportar_processos,
    estatisticas_avancadas,
    operacoes_lote,
    DocumentoProcessoListCreateAPIView,
    upload_documento_processo,
    buscar_processo_unificado,
    listar_todos_processos,
    processos_dashboard_cached,
    busca_avancada_processos,
    teste_performance_busca,
    
    # Dashboard Views
    dashboard_stats,
    estatisticas_gerais,
    
    # Utils Views
    buscar_autos,
    autos_constatacao_disponiveis,
    validar_cnpj,
    proximos_numeros,
    upload_anexo,
    relatorio_consolidado,
    gerar_documento_banco,
    gerar_documento_posto,
    gerar_documento_supermercado,
    gerar_documento_diversos,
    
    # Related Models Views
    AtendimentoCaixaBancoListAPIView,
    NotaFiscalPostoListAPIView,
    CupomFiscalPostoListAPIView,
    AnexoAutoListAPIView,
)

from .api_mobile import (
    BootstrapView,
    SyncPushView,
    AutoConstatacaoCreateView,
    AutoInfracaoCreateView,
    PedidoNotificacaoCreateView,
    AgendamentosListView,
    AgendamentoCheckinView,
    MobileUploadView,
    MobileNumeracaoTesteView,
)

from .views_apreensao import AutoApreensaoInutilizacaoViewSet, ItemApreensaoInutilizacaoViewSet
from .views_avancadas import (
    EvidenciaFotograficaViewSet,
    AssinaturaDigitalViewSet,
    NotificacaoEletronicaViewSet,
    ControlePrazosViewSet,
    ConfiguracaoFiscalizacaoViewSet,
    DashboardFiscalizacaoAvancadoViewSet,
)

app_name = 'fiscalizacao'

urlpatterns = [
    # === ENDPOINTS PARA AUTO DE BANCO ===
    path('bancos/', AutoBancoListCreateAPIView.as_view(), name='banco_list_create'),
    path('bancos/<int:pk>/', AutoBancoRetrieveUpdateDestroyAPIView.as_view(), name='banco_detail'),
    path('bancos/<int:pk>/gerar-documento/', gerar_documento_banco, name='gerar_documento_banco'),
    
    # === ENDPOINTS PARA AUTO DE POSTO ===
    path('postos/', AutoPostoListCreateAPIView.as_view(), name='posto_list_create'),
    path('postos/<int:pk>/', AutoPostoRetrieveUpdateDestroyAPIView.as_view(), name='posto_detail'),
    path('postos/<int:pk>/gerar-documento/', gerar_documento_posto, name='gerar_documento_posto'),
    
    # === ENDPOINTS PARA AUTO DE SUPERMERCADO ===
    path('supermercados/', AutoSupermercadoListCreateAPIView.as_view(), name='supermercado_list_create'),
    path('supermercados/<int:pk>/', AutoSupermercadoRetrieveUpdateDestroyAPIView.as_view(), name='supermercado_detail'),
    path('supermercados/<int:pk>/gerar-documento/', gerar_documento_supermercado, name='gerar_documento_supermercado'),
    
    # === ENDPOINTS PARA AUTO DIVERSOS ===
    path('diversos/', AutoDiversosListCreateAPIView.as_view(), name='diversos_list_create'),
    path('diversos/<int:pk>/', AutoDiversosRetrieveUpdateDestroyAPIView.as_view(), name='diversos_detail'),
    path('diversos/<int:pk>/gerar-documento/', gerar_documento_diversos, name='gerar_documento_diversos'),
    
    # === ENDPOINTS PARA AUTO DE INFRAÇÃO ===
    path('infracoes/', AutoInfracaoListCreateAPIView.as_view(), name='infracao_list_create'),
    path('infracoes/<int:pk>/', AutoInfracaoRetrieveUpdateDestroyAPIView.as_view(), name='infracao_detail'),
    path('infracoes/<int:pk>/documento/', gerar_documento_infracao_docx, name='gerar_documento_infracao'),
    path('infracoes/criar-de-auto/', criar_infracao_de_auto, name='criar_infracao_de_auto'),
    path('infracoes/por-auto/<str:auto_tipo>/<int:auto_id>/', infrações_por_auto, name='infracoes_por_auto'),
    path('infracoes/autos-com-irregularidades/', autos_com_potencial_infracao, name='autos_com_potencial_infracao'),
    path('infracoes/<int:pk>/atualizar-status/', atualizar_status_infracao, name='atualizar_status_infracao'),
    
    # === ENDPOINTS DE ESTATÍSTICAS E UTILITÁRIOS ===
    path('dashboard-stats/', dashboard_stats, name='dashboard_stats'),
    path('estatisticas-gerais/', estatisticas_gerais, name='estatisticas_gerais'),
    path('buscar-autos/', buscar_autos, name='buscar_autos'),
    path('fiscalizacao/autos-constatacao/', autos_constatacao_disponiveis, name='autos_constatacao_disponiveis'),
    path('validar-cnpj/', validar_cnpj, name='validar_cnpj'),
    path('proximos-numeros/', proximos_numeros, name='proximos_numeros'),
    path('upload-anexo/', upload_anexo, name='upload_anexo'),
    path('relatorio-consolidado/', relatorio_consolidado, name='relatorio_consolidado'),
    
    # === ENDPOINTS DE MODELOS RELACIONADOS ===
    path('bancos/<int:auto_banco_id>/atendimentos/', AtendimentoCaixaBancoListAPIView.as_view(), name='atendimentos_banco'),
    path('postos/<int:auto_posto_id>/notas-fiscais/', NotaFiscalPostoListAPIView.as_view(), name='notas_fiscais_posto'),
    path('postos/<int:auto_posto_id>/cupons-fiscais/', CupomFiscalPostoListAPIView.as_view(), name='cupons_fiscais_posto'),
    path('anexos/', AnexoAutoListAPIView.as_view(), name='anexos_list'),
    
    # === ENDPOINTS PARA PROCESSOS ADMINISTRATIVOS ===
    
    # Listagem e criação de processos
    path('processos/', ProcessoListCreateAPIView.as_view(), name='processo_list_create'),
    
    # Detalhes, atualização e exclusão de processo específico
    path('processos/<int:pk>/', ProcessoDetailAPIView.as_view(), name='processo_detail'),
    
    # Ações específicas em processos
    path('processos/<int:pk>/atualizar-status/', atualizar_status_processo, name='atualizar_status_processo'),
    path('processos/<int:pk>/historico/', historico_processo, name='historico_processo'),
    
    # Dashboard e relatórios de processos
    path('processos/dashboard/', processos_dashboard, name='processos_dashboard'),
    path('processos/relatorio-mensal/', relatorio_mensal_processos, name='relatorio_mensal_processos'),
    # ❌ LINHA REMOVIDA: path('processos/alertas/', processos_alertas, name='processos_alertas'),
    
    # Busca e filtros de processos
    path('processos/buscar/', buscar_processos, name='buscar_processos'),
    path('processos/opcoes-filtros/', opcoes_filtros, name='opcoes_filtros'),
    
    # Validações e utilitários
    path('processos/validar-numero/', validar_numero_processo, name='validar_numero_processo'),
    path('processos/sugerir-numero/', sugerir_numero_processo, name='sugerir_numero_processo'),
    path('processos/exportar/', exportar_processos, name='exportar_processos'),
    path('processos/estatisticas-avancadas/', estatisticas_avancadas, name='estatisticas_avancadas'),
    path('processos/operacoes-lote/', operacoes_lote, name='operacoes_lote'),
    
    # === ENDPOINTS PARA DOCUMENTOS DO PROCESSO ===
    
    # Listar e criar documentos de um processo
    path('processos/<int:processo_id>/documentos/', DocumentoProcessoListCreateAPIView.as_view(), name='documentos_processo'),
    
    # === ENDPOINTS PARA AUTO DE APREENSÃO/INUTILIZAÇÃO ===
    path('fiscalizacao/apreensao-inutilizacao/', AutoApreensaoInutilizacaoViewSet.as_view({'get': 'list', 'post': 'create'}), name='apreensao_inutilizacao_list'),
    path('fiscalizacao/apreensao-inutilizacao/<int:pk>/', AutoApreensaoInutilizacaoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='apreensao_inutilizacao_detail'),
    path('fiscalizacao/apreensao-inutilizacao/<int:pk>/adicionar-item/', AutoApreensaoInutilizacaoViewSet.as_view({'post': 'adicionar_item'}), name='apreensao_inutilizacao_adicionar_item'),
    path('fiscalizacao/apreensao-inutilizacao/<int:pk>/gerar-pdf/', AutoApreensaoInutilizacaoViewSet.as_view({'get': 'gerar_pdf'}), name='apreensao_inutilizacao_gerar_pdf'),
    path('fiscalizacao/apreensao-inutilizacao/estatisticas/', AutoApreensaoInutilizacaoViewSet.as_view({'get': 'estatisticas'}), name='apreensao_inutilizacao_estatisticas'),
    path('fiscalizacao/apreensao-inutilizacao/autos_supermercado_disponiveis/', AutoApreensaoInutilizacaoViewSet.as_view({'get': 'autos_supermercado_disponiveis'}), name='apreensao_inutilizacao_autos_supermercado_disponiveis'),
    path('fiscalizacao/apreensao-inutilizacao/proximo_numero/', AutoApreensaoInutilizacaoViewSet.as_view({'get': 'proximo_numero'}), name='apreensao_inutilizacao_proximo_numero'),
    
    # === ENDPOINTS PARA ITENS DE APREENSÃO/INUTILIZAÇÃO ===
    path('fiscalizacao/itens-apreensao/', ItemApreensaoInutilizacaoViewSet.as_view({'get': 'list', 'post': 'create'}), name='itens_apreensao_list'),
    path('fiscalizacao/itens-apreensao/<int:pk>/', ItemApreensaoInutilizacaoViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='itens_apreensao_detail'),
    
    # Upload de documentos
    path('processos/<int:processo_id>/documentos/upload/', upload_documento_processo, name='upload_documento_processo'),
    # 🎯 ENDPOINTS UNIFICADOS (SOLUÇÃO PRINCIPAL)
    path('processo/<int:processo_id>/', buscar_processo_unificado, name='buscar_processo_unificado'),
    path('processos/unificado/', listar_todos_processos, name='listar_todos_processos'),
    
    # 🚀 PERFORMANCE
    path('dashboard/cached/', processos_dashboard_cached, name='dashboard_cached'),
    
    # 🔍 BUSCA AVANÇADA
    path('busca/', busca_avancada_processos, name='busca_avancada'),
    
    # 🧪 TESTE E DEBUG
    path('teste-performance/<int:processo_id>/', teste_performance_busca, name='teste_performance'),
    
    # === ENDPOINTS PARA API MOBILE ===
    path('mobile/sync/bootstrap/', BootstrapView.as_view(), name='mobile_sync_bootstrap'),
    path('mobile/sync/push/', SyncPushView.as_view(), name='mobile_sync_push'),
    path('mobile/autos/constatacao/', AutoConstatacaoCreateView.as_view(), name='mobile_auto_constatacao'),
    path('mobile/autos/infracao/', AutoInfracaoCreateView.as_view(), name='mobile_auto_infracao'),
    path('mobile/notificacoes/pedidos/', PedidoNotificacaoCreateView.as_view(), name='mobile_pedido_notificacao'),
    path('mobile/agendamentos/', AgendamentosListView.as_view(), name='mobile_agendamentos'),
    path('mobile/agendamentos/<int:agendamento_id>/checkin/', AgendamentoCheckinView.as_view(), name='mobile_agendamento_checkin'),
    path('mobile/uploads/', MobileUploadView.as_view(), name='mobile_uploads'),
    path('mobile/numeracao/teste/', MobileNumeracaoTesteView.as_view(), name='mobile_numeracao_teste'),

    # === ENDPOINTS PARA FUNCIONALIDADES AVANÇADAS ===
    
    # Evidências Fotográficas
    path('evidencias/', EvidenciaFotograficaViewSet.as_view({'get': 'list', 'post': 'create'}), name='evidencias_list'),
    path('evidencias/<int:pk>/', EvidenciaFotograficaViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='evidencias_detail'),
    path('evidencias/por-auto/', EvidenciaFotograficaViewSet.as_view({'get': 'por_auto'}), name='evidencias_por_auto'),
    
    # Assinaturas Digitais
    path('assinaturas-digitais/', AssinaturaDigitalViewSet.as_view({'get': 'list', 'post': 'create'}), name='assinaturas_list'),
    path('assinaturas-digitais/<int:pk>/', AssinaturaDigitalViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='assinaturas_detail'),
    path('assinaturas-digitais/<int:pk>/assinar/', AssinaturaDigitalViewSet.as_view({'post': 'assinar'}), name='assinaturas_assinar'),
    path('assinaturas-digitais/pendentes/', AssinaturaDigitalViewSet.as_view({'get': 'pendentes'}), name='assinaturas_pendentes'),
    path('assinaturas-digitais/vencidas/', AssinaturaDigitalViewSet.as_view({'get': 'vencidas'}), name='assinaturas_vencidas'),
    
    # Notificações Eletrônicas
    path('notificacoes-eletronicas/', NotificacaoEletronicaViewSet.as_view({'get': 'list', 'post': 'create'}), name='notificacoes_list'),
    path('notificacoes-eletronicas/<int:pk>/', NotificacaoEletronicaViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='notificacoes_detail'),
    path('notificacoes-eletronicas/<int:pk>/enviar/', NotificacaoEletronicaViewSet.as_view({'post': 'enviar'}), name='notificacoes_enviar'),
    path('notificacoes-eletronicas/pendentes/', NotificacaoEletronicaViewSet.as_view({'get': 'pendentes'}), name='notificacoes_pendentes'),
    path('notificacoes-eletronicas/estatisticas/', NotificacaoEletronicaViewSet.as_view({'get': 'estatisticas'}), name='notificacoes_estatisticas'),
    
    # Controle de Prazos
    path('controle-prazos/', ControlePrazosViewSet.as_view({'get': 'list', 'post': 'create'}), name='prazos_list'),
    path('controle-prazos/<int:pk>/', ControlePrazosViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='prazos_detail'),
    path('controle-prazos/<int:pk>/prorrogar/', ControlePrazosViewSet.as_view({'post': 'prorrogar'}), name='prazos_prorrogar'),
    path('controle-prazos/vencendo/', ControlePrazosViewSet.as_view({'get': 'vencendo'}), name='prazos_vencendo'),
    path('controle-prazos/vencidos/', ControlePrazosViewSet.as_view({'get': 'vencidos'}), name='prazos_vencidos'),
    path('controle-prazos/alertas/', ControlePrazosViewSet.as_view({'get': 'alertas'}), name='prazos_alertas'),
    
    # Configurações
    path('configuracoes/', ConfiguracaoFiscalizacaoViewSet.as_view({'get': 'list', 'put': 'update', 'patch': 'partial_update'}), name='configuracoes'),
    
    # Dashboard Avançado
    path('dashboard-avancado/estatisticas/', DashboardFiscalizacaoAvancadoViewSet.as_view({'get': 'estatisticas'}), name='dashboard_avancado_estatisticas'),
]

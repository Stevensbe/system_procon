# Configurações específicas para os novos módulos da Fase 4
# Sistema Procon - Fluxo Completo do Atendimento

# ==============================================================================
# APPS PARA MODULES DA FASE 4
# ==============================================================================

FASE4_APPS = [
    'cip_automatica',
    'audiencia_calendario', 
    'resposta_empresa',
    'fluxo_atendimento',
]

# ==============================================================================
# CONFIGURAÇÕES DE CIP AUTOMÁTICA
# ==============================================================================

# Configurações para geração de CIP
CIP_AUTOMATIC_SETTINGS = {
    'VALOR_MINIMO_CIP': 500.00,  # Valor mínimo em reais para gerar CIP
    'PRAZO_RESPOSTA_PADRAO': 10,  # Dias para resposta da empresa
    'PRAZO_ACORDO_PADRAO': 15,   # Dias para acordo de pagamento
    
    # Templates de documentos
    'TEMPLATE_CIP_BASIC': 'cip/documentos/template_basic.html',
    'TEMPLATE_CIP_DETALHADO': 'cip/documentos/template_detalhado.html',
    
    # Multas automáticas
    'CALCULO_MULTA_BASICO': 0.1,  # 10% sobre valor indenização
    'MULTA_MINIMA': 100.00,
    'MULTA_MAXIMA': 5000.00,
    
    # Setores por tipo de CIP
    'SETORES_POR_TIPO': {
        'COMPRAS_VENDAS': 'Fiscalização',
        'PRESTACAO_SERVICOS': 'Jurídico',
        'CARTAO_PAGAMENTO': 'Financeiro',
        'TELEFONIA_INTERNET': 'Tecnologia',
        'EDUCACAO': 'Educacional',
        'SAUDE_MEDICAMENTOS': 'Saúde',
        'VEICULOS_AUTOMOTIVOS': 'Tecnologia',
        'IMOVEIS_CONSTRUCAO': 'Diretoria',
        'GENERICO': 'Jurídico',
    },
}

# ==============================================================================
# CONFIGURAÇÕES DE CALENDÁRIO DE AUDIÊNCIAS
# ==============================================================================

AUDIENCIA_SETTINGS = {
    # Horários de funcionamento
    'HORARIO_INICIO': '08:00',
    'HORARIO_FIM': '18:00',
    'INTERVALOS_AUDIENCIA': [30, 60, 90, 120],  # Minutos
    
    # Configurações de mediadores
    'MEDIADOR_SETTINGS': {
        'ESPECIALIZACOES_REQUERIDAS': True,
        'NUMERO_MINIMO_REGISTRO': 7,
        'TREINAMENTO_REQUERIDO': True,
    },
    
    # Configurações de locais
    'LOCAL_SETTINGS': {
        'CAPACIDADE_MAXIMA_DEFAULT': 10,
        'EQUIPAMENTOS_OBRIGATORIOS': ['camera', 'microfone', 'projetor'],
        'ACESSIBILIDADE_OBRIGATORIA': True,
    },
    
    # Templates de documentos
    'TEMPLATES_AUDIENCIA': {
        'CONVITE_CONSUMIDOR': 'audiencia/emails/convite_consumidor.html',
        'CONVITE_EMPRESA': 'audiencia/emails/convite_empresa.html',
        'ATA_BASICA': 'audiencia/documentos/ata_basica.html',
        'ACORDO_TEMPLATE': 'audiencia/documentos/acordo_template.html',
    },
    
    # Configurações de reagendamento
    'REAGENDAMENTO_SETTINGS': {
        'DIAS_MINIMOS_ANTECEDENCIA': 2,
        'MAXIMOS_REAGENDAMENTOS': 3,
        'MOTIVOS_ACEITAVEIS': [
            'CONFLITO_MEDIADOR',
            'EMERGENCIA',
            'DOENTE_PARTICIPANTE',
            'PROBLEMA_TECNICO',
        ],
    },
}

# ==============================================================================
# CONFIGURAÇÕES DE ANÁLISE DE RESPOSTAS
# ==============================================================================

RESPOSTA_ANALYSIS_SETTINGS = {
    # Configurações de IA/NLP
    'IA_SETTINGS': {
        'CONFIANCA_MINIMA_ANALISE': 50,
        'REQUIREMENT_MANUAL_AUDIT': 85,
        'PALAVRAS_CHAVE_IMPORTANTES': [
            'contrato', 'garantia', 'termo', 'responsabilidade',
            'reparo', 'devolução', 'compensação', 'indenização',
        ],
    },
    
    # Padrões de classificação automática
    'PADROES_CLASSIFICACAO': {
        'ACEITE_TOTAL_CONFIANCA': 0.8,
        'ACEITE_PARCIAL_CONFIANCA': 0.6,
        'MEDIACAO_CONFIANCA': 0.7,
        'RECUSA_CONFIANCA': 0.75,
    },
    
    # Configurações de prazos
    'PRAZOS_ANALISE': {
        'ANALISE_INICIAL_HORAS': 24,
        'DECISAO_FINAL_DIAS': 5,
        'APPEAL_DIAS': 7,
        'FOLLOW_UP_DIAS': 15,
    },
    
    # Alertas automáticos
    'ALERTAS_AUTOMATICOS': {
        'RESPOSTA_ATRASADA_HORAS': 48,
        'FOLLOW_UP_AUTOMATICO': True,
        'ESCALATION_APOS_DIAS': 10,
    },
}

# ==============================================================================
# CONFIGURAÇÕES DE WORKFLOW COMPLETO
# ==============================================================================

WORKFLOW_SETTINGS = {
    # Configurações de fluxo end-to-end
    'FLUXO_SETTINGS': {
        'AUTOMATIZACAO_NIVEL': 'ALTO',  # ALTO, MEDIO, BAIXO
        'REQUIREMENT_MANUAL_APROVACAO': ['CIP_ACIMA_10000', 'AUDIENCI_COLETAIVA'],
        'ESCALATION_TRIGGERS': ['VALOR_ALTO', 'EMPRESA_CONHECIDA', 'SITUACAO_COMPLEXA'],
    },
    
    # Configurações de monitoramento
    'MONITORAMENTO_SETTINGS': {
        'TEMPO_RESPOSTA_META_MINUTOS': 30,
        'SLA_CONVERSAO_CIP': 85,  # % reclamações -> CIP
        'SLA_SUCESSO_AUDIENCIA': 70,  # % audiências -> acodo
        'SLA_SATISFACAO_GLOBAL': 80,  # % satisfação estimada
    },
    
    # Configurações de relatórios automáticos
    'RELATORIOS_SETTINGS': {
        'FREQUENCIA_RELATORIO_DIARIO': True,
        'FREQUENCIA_RELATORIO_SEMANAL': True,
        'FREQUENCIA_RELATORIO_MENSAL': True,
        'ALERTAS_TEMPO_REAL': True,
    },
}

# ==============================================================================
# CONFIGURAÇÕES DE INTEGRAÇÃO ENTRE MÓDULOS
# ==============================================================================

INTEGRATION_SETTINGS = {
    # Integração entre CIP e Audiência
    'CIP_TO_AUDIENCIA': {
        'DISPARO_AUTOMATICO_NEGADA': True,
        'DISPARO_AUTOMATICO_PARCIAL': True,
        'TEMPO_ESPERA_ANTES_DISPARO_DIAS': 7,
    },
    
    # Integração entre Audiência e Resposta
    'AUDIENCIA_TO_RESPOSTA': {
        'GERAR_ATA_AUTOMATICA': True,
        'CALCULAR_ACORDEOS_AUTOMATICOS': True,
        'VALIDAR_DOCUMENTOS_AUTOMATICAMENTE': True,
    },
    
    # Integração entre Resposta e CIP
    'RESPOSTA_TO_CIP': {
        'ATUALIZAR_STATUS_AUTOMATICAMENTE': True,
        'CALCULAR_INDENIZACAO_FINAL': True,
        'GERAR_DOCUMENTOS_FINALI': True,
    },
}

# ==============================================================================
# CONFIGURAÇÕES DE PERFORMANCE E MÉTRICAS
# ==============================================================================

PERFORMANCE_SETTINGS = {
    # Métricas de tempo de resposta
    'TEMPO_RESPOSTA_SETTINGS': {
        'RELAMACAO_TO_PRIMEIRA_ACAO_MINUTOS': 60,
        'CIP_TO_ENVIO_HORAS': 4,
        'RESPOSTA_TO_ANALISE_HORAS': 24,
        'AUDIENCIA_TO_ACORDO_DIAS': 7,
    },
    
    # SLAs por tipo de caso
    'SLA_POR_TIPO': {
        'COMPRAS_VENDAS': {'minutos_meta': 45, 'porcetagem_sucesso': 85},
        'PRESTACAO_SERVICOS': {'minutos_meta': 60, 'percentual_sucesso': 80},
        'CARTAO_PAGAMENTO': {'minutos_meta': 30, 'percentual_sucesso': 90},
        'EDUCACAO': {'minutos_meta': 90, 'percentual_sucesso': 75},
        'GENERICO': {'minutos_meta': 120, 'porcenagem_sucesso': 70},
    },
    
    # Auditoria e logs
    'AUDITORIA_SETTINGS': {
        'LOG_TODAS_OPERACOES': True,
        'RETENCAO_LOGS_DIAS': 365,
        'BACKUP_AUTOMATICO_HORARI': 6,
        'VERIFICACAO_CONCISTENCIA_DIARIA': True,
    },
}

# ==============================================================================
# CONFIGURAÇÕES DE SEGURANÇA E PERMISSÕES
# ==============================================================================

SECURITY_SETTINGS = {
    # Permissões por módulo
    'PERMISSOES_MODULOS': {
        'cip_automatica': [
            'view_cip',
            'create_cip',
            'edit_cip',
            'send_cip',
            'analyze_cip_response',
        ],
        'audiencia_calendario': [
            'view_audiencia',
            'create_audiencia',
            'edit_audiencia',
            'cancel_audiencia',
            'reschedule_audiencia',
            'manage_mediator',
        ],
        'resposta_empresa': [
            'view_resposta',
            'analyze_resposta',
            'edit_response_status',
            'generate_reports',
        ],
        'fluxo_atendimento': [
            'view_workflow',
            'create_workflow',
            'manage_workflow',
            'access_dashboard',
        ],
    },
    
    # Configurações de autenticação
    'AUTH_SETTINGS': {
        'REQUIREMENT_LOGIN_TODAS_FUNCIONALIDADES': True,
        'SESSION_TIMEOUT_HOURS': 8,
        'MULTI_FACTOR_AUTH_ADMIN': True,
        'AUDIT_LOG_ACCESS': True,
    },
}

# ==============================================================================
# CONFIGURAÇÕES DE NOTIFICAÇÕES E COMUNICAÇÕES
# ==============================================================================

NOTIFICATION_SETTINGS = {
    # Configurações de email
    'EMAIL_SETTINGS': {
        'ENABLED_AUTO_EMAILS': True,
        'TEMPLATE_DEFAULT_LANG': 'pt-BR',
        'SENDER_DEFAULT': 'noreply@procon.local',
        'BCC_ADMIN_EMAILS': True,
    },
    
    # Configurações de SMS
    'SMS_SETTINGS': {
        'ENABLED_AUTO_SMS': False,  # Requer integração com gateway SMS
        'PROVIDER': 'twilio',  # ou outro
        'PRIORITY_ONLY': True,  # Apenas para urgentes
    },
    
    # Configurações de push notifications
    'PUSH_SETTINGS': {
        'ENABLED_PUSH': True,
        'WEBSOCKET_ENABLED': True,
        'UPDATE_INTERVAL_SECONDS': 30,
    },
    
    # Templates de comunicação
    'COMMUNICATION_TEMPLATES': {
        'CIP_GENERATED_CONSUMER': 'cip/emails/cip_generated_consumer.html',
        'CIP_SENT_COMPANY': 'cip/emails/cip_sent_company.html',
        'AUDIENCE_INVITATION': 'audiencia/emails/audience_invitation.html',
        'AGREEMENT_NOTIFICATION': 'audiencia/emails/agreement_notification.html',
        'DEADLINE_REMINDER': 'common/emails/deadline_reminder.html',
    },
}

# ==============================================================================
# CONFIGURAÇÕES DE BACKUP E RECUPERAÇÃO
# ==============================================================================

BACKUP_SETTINGS = {
    'BACKUP_DATABASE_DIARIO': True,
    'BACKUP_MEDIA_FILES_SEMANAL': True,
    'RETENCAO_BACKUP_DIAS': 30,
    'LOCAL_BACKUP_PATH': '/backups/procon_fase4/',
    'CLOUD_BACKUP_ENABLED': False,
    'BACKUP_ENCRYPTION': True,
}

# ==============================================================================
# CONFIGURAÇÕES DE DEBUGGING E DESENVOLVIMENTO
# ==============================================================================

DEBUG_SETTINGS = {
    'ENABLED_DETAILED_LOGGING': True,
    'LOG_PERFORMANCE_METRICS': True,
    'DEBUG_WORKFLOW_STEPS': True,
    'SIMULATION_MODE': False,
    'FAST_TEST_PROCESSING': False,
}

# Exportar configurações principais para uso nos módulos
MAIN_FASE4_CONFIGS = {
    'cip': CIP_AUTOMATIC_SETTINGS,
    'audiencia': AUDIENCIA_SETTINGS,
    'resposta': RESPOSTA_ANALYSIS_SETTINGS,
    'workflow': WORKFLOW_SETTINGS,
    'integration': INTEGRATION_SETTINGS,
    'performance': PERFORMANCE_SETTINGS,
    'security': SECURITY_SETTINGS,
    'notification': NOTIFICATION_SETTINGS,
    'backup': BACKUP_SETTINGS,
    'debug': DEBUG_SETTINGS,
}

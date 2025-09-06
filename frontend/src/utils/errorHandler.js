// =========================================================================
// === SISTEMA CENTRALIZADO DE TRATAMENTO DE ERROS ===
// =========================================================================

import monitoringService from '../services/monitoringService';

// ✅ Tipos de erro padronizados
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'FORBIDDEN_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// ✅ Níveis de severidade
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// ✅ Classe principal de tratamento de erros
class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 100;
    this.isProcessing = false;
  }

  // ✅ Processar erro da API
  async handleApiError(error, context = {}) {
    const errorInfo = this.parseApiError(error);
    
    // Adicionar contexto
    errorInfo.context = {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Classificar erro
    this.classifyError(errorInfo);

    // Log do erro
    this.logError(errorInfo);

    // Enviar para monitoramento
    await this.sendToMonitoring(errorInfo);

    // Retornar erro padronizado
    return this.formatErrorForUser(errorInfo);
  }

  // ✅ Parsear erro da API
  parseApiError(error) {
    const errorInfo = {
      type: ERROR_TYPES.UNKNOWN,
      severity: SEVERITY_LEVELS.MEDIUM,
      message: 'Erro desconhecido',
      details: {},
      statusCode: null,
      originalError: error
    };

    if (error.response) {
      // Erro de resposta da API
      const { status, data } = error.response;
      errorInfo.statusCode = status;
      errorInfo.details = data;

      switch (status) {
        case 400:
          errorInfo.type = ERROR_TYPES.VALIDATION;
          errorInfo.message = data?.message || 'Dados inválidos';
          errorInfo.severity = SEVERITY_LEVELS.LOW;
          break;
        case 401:
          errorInfo.type = ERROR_TYPES.AUTHENTICATION;
          errorInfo.message = 'Sessão expirada. Faça login novamente.';
          errorInfo.severity = SEVERITY_LEVELS.MEDIUM;
          break;
        case 403:
          errorInfo.type = ERROR_TYPES.AUTHORIZATION;
          errorInfo.message = 'Acesso negado';
          errorInfo.severity = SEVERITY_LEVELS.MEDIUM;
          break;
        case 404:
          errorInfo.type = ERROR_TYPES.CLIENT;
          errorInfo.message = 'Recurso não encontrado';
          errorInfo.severity = SEVERITY_LEVELS.LOW;
          break;
        case 500:
          errorInfo.type = ERROR_TYPES.SERVER;
          errorInfo.message = 'Erro interno do servidor';
          errorInfo.severity = SEVERITY_LEVELS.HIGH;
          break;
        default:
          errorInfo.type = ERROR_TYPES.SERVER;
          errorInfo.message = `Erro ${status}: ${data?.message || 'Erro do servidor'}`;
          errorInfo.severity = SEVERITY_LEVELS.MEDIUM;
      }
    } else if (error.request) {
      // Erro de rede
      errorInfo.type = ERROR_TYPES.NETWORK;
      errorInfo.message = 'Erro de conexão. Verifique sua internet.';
      errorInfo.severity = SEVERITY_LEVELS.HIGH;
    } else {
      // Erro de configuração ou outro
      errorInfo.message = error.message || 'Erro inesperado';
      errorInfo.severity = SEVERITY_LEVELS.MEDIUM;
    }

    return errorInfo;
  }

  // ✅ Classificar erro por contexto
  classifyError(errorInfo) {
    const { type, context } = errorInfo;

    // Ajustar severidade baseado no contexto
    if (context?.critical) {
      errorInfo.severity = SEVERITY_LEVELS.CRITICAL;
    }

    // Ajustar baseado na URL
    if (context?.url) {
      if (context.url.includes('/auth/')) {
        errorInfo.severity = Math.max(errorInfo.severity, SEVERITY_LEVELS.MEDIUM);
      }
      if (context.url.includes('/dashboard/')) {
        errorInfo.severity = Math.max(errorInfo.severity, SEVERITY_LEVELS.HIGH);
      }
    }

    return errorInfo;
  }

  // ✅ Log do erro
  logError(errorInfo) {
    const { type, severity, message, details, context } = errorInfo;
    
    const logMessage = `[${type}] [${severity.toUpperCase()}] ${message}`;
    
    switch (severity) {
      case SEVERITY_LEVELS.CRITICAL:
        console.error(logMessage, { details, context });
        break;
      case SEVERITY_LEVELS.HIGH:
        console.error(logMessage, { details });
        break;
      case SEVERITY_LEVELS.MEDIUM:
        console.warn(logMessage, { details });
        break;
      case SEVERITY_LEVELS.LOW:
        console.info(logMessage);
        break;
    }

    // Adicionar à fila para processamento em lote
    this.addToQueue(errorInfo);
  }

  // ✅ Adicionar à fila de processamento
  addToQueue(errorInfo) {
    this.errorQueue.push(errorInfo);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove o mais antigo
    }

    // Processar fila se não estiver processando
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // ✅ Processar fila de erros
  async processQueue() {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const errorsToProcess = [...this.errorQueue];
      this.errorQueue = [];

      // Enviar erros em lote para monitoramento
      if (errorsToProcess.length > 0) {
        await this.sendBatchToMonitoring(errorsToProcess);
      }
    } catch (error) {
      console.error('Erro ao processar fila de erros:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // ✅ Enviar erro para monitoramento
  async sendToMonitoring(errorInfo) {
    try {
      await monitoringService.logError({
        type: errorInfo.type,
        severity: errorInfo.severity,
        message: errorInfo.message,
        details: errorInfo.details,
        context: errorInfo.context,
        statusCode: errorInfo.statusCode
      });
    } catch (error) {
      console.error('Erro ao enviar para monitoramento:', error);
    }
  }

  // ✅ Enviar lote de erros para monitoramento
  async sendBatchToMonitoring(errors) {
    try {
      await monitoringService.logBatchErrors(errors);
    } catch (error) {
      console.error('Erro ao enviar lote para monitoramento:', error);
    }
  }

  // ✅ Formatar erro para usuário
  formatErrorForUser(errorInfo) {
    const { type, message, severity } = errorInfo;

    // Ações específicas por tipo de erro
    switch (type) {
      case ERROR_TYPES.AUTHENTICATION:
        // Redirecionar para login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        break;
      
      case ERROR_TYPES.NETWORK:
        // Mostrar modal de reconexão
        this.showReconnectionModal();
        break;
      
      case ERROR_TYPES.SERVER:
        // Mostrar modal de erro crítico
        this.showCriticalErrorModal(message);
        break;
    }

    return {
      type,
      message,
      severity,
      showToUser: severity !== SEVERITY_LEVELS.LOW,
      autoRetry: type === ERROR_TYPES.NETWORK
    };
  }

  // ✅ Mostrar modal de reconexão
  showReconnectionModal() {
    // Implementar modal de reconexão
    if (typeof window !== 'undefined' && window.showReconnectionModal) {
      window.showReconnectionModal();
    }
  }

  // ✅ Mostrar modal de erro crítico
  showCriticalErrorModal(message) {
    // Implementar modal de erro crítico
    if (typeof window !== 'undefined' && window.showCriticalErrorModal) {
      window.showCriticalErrorModal(message);
    }
  }

  // ✅ Tratamento de erro global
  handleGlobalError(error, errorInfo) {
    console.error('Erro global capturado:', error, errorInfo);
    
    // Enviar para monitoramento
    this.sendToMonitoring({
      type: ERROR_TYPES.UNKNOWN,
      severity: SEVERITY_LEVELS.CRITICAL,
      message: 'Erro global não tratado',
      details: { error: error.toString(), errorInfo },
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    });
  }

  // ✅ Limpar fila de erros
  clearQueue() {
    this.errorQueue = [];
  }

  // ✅ Obter estatísticas de erros
  getErrorStats() {
    const stats = {
      total: this.errorQueue.length,
      byType: {},
      bySeverity: {}
    };

    this.errorQueue.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// ✅ Instância singleton
const errorHandler = new ErrorHandler();

// ✅ Configurar tratamento global de erros
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handleGlobalError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleGlobalError(event.reason, {
      type: 'unhandledrejection'
    });
  });
}

export default errorHandler;

// ✅ Hooks para React
export const useErrorHandler = () => {
  return {
    handleError: (error, context) => errorHandler.handleApiError(error, context),
    handleGlobalError: (error, errorInfo) => errorHandler.handleGlobalError(error, errorInfo),
    getErrorStats: () => errorHandler.getErrorStats(),
    clearQueue: () => errorHandler.clearQueue()
  };
};

// ✅ Decorator para componentes
export const withErrorHandler = (Component) => {
  return (props) => {
    const errorHandlerHook = useErrorHandler();
    
    return (
      <Component 
        {...props} 
        errorHandler={errorHandlerHook}
      />
    );
  };
};

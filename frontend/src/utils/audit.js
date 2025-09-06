// Sistema de Auditoria e Logs Avançados - MODO OTIMIZADO
export class AuditSystem {
  constructor() {
    this.logs = [];
    this.maxLogs = 10; // Reduzido drasticamente para evitar problemas de memória
    this.isEnabled = false; // Desabilitado por padrão para economizar memória
    this.sensitiveFields = ['password', 'token', 'secret', 'key'];
    this.auditLevels = {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      CRITICAL: 'critical',
      SECURITY: 'security'
    };
    
    // Inicializar apenas se explicitamente habilitado
    this.initMinimal();
  }

  // Verificar disponibilidade de memória
  checkMemoryAvailability() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      return usage < 70; // Retornar true se uso < 70%
    }
    return true; // Fallback para dispositivos sem API de memória
  }

  // Inicializar sistema de auditoria minimalista
  initMinimal() {
    // Apenas configurar interceptadores básicos
    this.setupBasicInterceptors();
    console.log('Sistema de Auditoria inicializado (Modo Minimalista)');
  }

  // Inicializar sistema completo (apenas quando necessário)
  init() {
    if (!this.checkMemoryAvailability()) {
      console.warn('AuditSystem: Memória insuficiente, mantendo modo básico');
      return;
    }
    
    this.isEnabled = true;
    this.loadLogs();
    this.setupInterceptors();
    this.setupRouteMonitoring();
    console.log('Sistema de Auditoria inicializado (Modo Completo)');
  }

  // Configurar interceptadores básicos (modo minimalista)
  setupBasicInterceptors() {
    // Apenas interceptar erros críticos
    window.addEventListener('error', (event) => {
      this.logCriticalError(event.error, 'window_error');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.logCriticalError(new Error(event.reason), 'unhandled_promise');
    });
  }

  // Configurar interceptadores completos
  setupInterceptors() {
    // Interceptar requisições HTTP
    this.interceptHTTPRequests();
    
    // Interceptar mudanças de estado
    this.interceptStateChanges();
    
    // Interceptar ações do usuário
    this.interceptUserActions();
  }

  // Interceptar requisições HTTP
  interceptHTTPRequests() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const [url, options = {}] = args;
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        
        this.logHTTPRequest({
          url,
          method: options.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          success: response.ok
        });
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        
        this.logHTTPRequest({
          url,
          method: options.method || 'GET',
          status: 0,
          duration: endTime - startTime,
          success: false,
          error: error.message
        });
        
        throw error;
      }
    };
  }

  // Interceptar mudanças de estado
  interceptStateChanges() {
    // Monitorar mudanças no localStorage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      this.logStateChange('localStorage', 'set', key, this.sanitizeValue(value));
      return originalSetItem.call(localStorage, key, value);
    };
    
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = (key) => {
      this.logStateChange('localStorage', 'remove', key);
      return originalRemoveItem.call(localStorage, key);
    };
  }

  // Interceptar ações do usuário
  interceptUserActions() {
    // Monitorar cliques em elementos importantes
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      if (target.matches('button, a, [role="button"]')) {
        this.logUserAction('click', {
          element: target.tagName,
          text: target.textContent?.trim(),
          id: target.id,
          className: target.className,
          href: target.href
        });
      }
    });
    
    // Monitorar submissões de formulário
    document.addEventListener('submit', (event) => {
      this.logUserAction('form_submit', {
        formId: event.target.id,
        formAction: event.target.action,
        formMethod: event.target.method
      });
    });
  }

  // Configurar monitoramento de rotas
  setupRouteMonitoring() {
    // Monitorar mudanças de URL
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        this.logRouteChange(currentUrl, window.location.href);
        currentUrl = window.location.href;
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Log de requisição HTTP
  logHTTPRequest(data) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'http_request',
      level: data.success ? this.auditLevels.INFO : this.auditLevels.ERROR,
      data: {
        url: data.url,
        method: data.method,
        status: data.status,
        duration: data.duration,
        success: data.success,
        error: data.error
      },
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
    
    this.addLog(log);
  }

  // Log de mudança de estado
  logStateChange(storage, action, key, value = null) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'state_change',
      level: this.auditLevels.INFO,
      data: {
        storage,
        action,
        key,
        value: this.sanitizeValue(value)
      },
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
    
    this.addLog(log);
  }

  // Log de ação do usuário
  logUserAction(action, data) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'user_action',
      level: this.auditLevels.INFO,
      data: {
        action,
        ...data
      },
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
    
    this.addLog(log);
  }

  // Log de mudança de rota
  logRouteChange(fromUrl, toUrl) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'route_change',
      level: this.auditLevels.INFO,
      data: {
        from: fromUrl,
        to: toUrl
      },
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
    
    this.addLog(log);
  }

  // Log de segurança
  logSecurityEvent(event, details) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'security',
      level: this.auditLevels.SECURITY,
      data: {
        event,
        details: this.sanitizeValue(details)
      },
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
    
    this.addLog(log);
  }

  // Log de erro crítico
  logCriticalError(error, context) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'critical_error',
      level: this.auditLevels.CRITICAL,
      data: {
        error: error.message,
        stack: error.stack,
        context
      },
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
    
    this.addLog(log);
  }

  // Adicionar log com verificação de memória
  addLog(log) {
    if (!this.isEnabled) return;
    
    // Verificar memória antes de adicionar
    if (!this.checkMemoryAvailability()) {
      console.warn('Memória insuficiente, pulando adição de log');
      return;
    }
    
    // Simplificar log para economizar memória
    const simplifiedLog = {
      timestamp: log.timestamp,
      type: log.type,
      level: log.level,
      data: typeof log.data === 'object' ? 
        Object.keys(log.data).reduce((acc, key) => {
          acc[key] = typeof log.data[key] === 'string' && log.data[key].length > 50 ? 
            log.data[key].substring(0, 50) + '...' : log.data[key];
          return acc;
        }, {}) : log.data,
      userId: log.userId,
      sessionId: log.sessionId
    };
    
    this.logs.unshift(simplifiedLog);
    
    // Limitar número de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Salvar logs apenas a cada 5 logs para reduzir I/O
    if (this.logs.length % 5 === 0) {
      this.saveLogs();
    }
    
    // Enviar para servidor apenas logs críticos
    if (log.level === this.auditLevels.CRITICAL || log.level === this.auditLevels.SECURITY) {
      this.sendToServer(log);
    }
  }

  // Sanitizar valores sensíveis
  sanitizeValue(value) {
    if (typeof value === 'string') {
      // Remover valores sensíveis
      let sanitized = value;
      this.sensitiveFields.forEach(field => {
        const regex = new RegExp(`"${field}":\\s*"[^"]*"`, 'gi');
        sanitized = sanitized.replace(regex, `"${field}": "***"`);
      });
      return sanitized;
    }
    return value;
  }

  // Obter ID do usuário atual
  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  // Obter ID da sessão
  getSessionId() {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  // Salvar logs no localStorage com limite de tamanho
  saveLogs() {
    try {
      // Verificar se há memória suficiente
      if (!this.checkMemoryAvailability()) {
        console.warn('Memória insuficiente, pulando salvamento de logs');
        return;
      }
      
      // Limitar logs antes de salvar
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }
      
      // Tentar salvar com fallback
      const logsString = JSON.stringify(this.logs);
      
      // Verificar tamanho dos dados
      if (logsString.length > 1000000) { // 1MB limite
        console.warn('Logs muito grandes, limpando logs antigos');
        this.logs = this.logs.slice(0, Math.floor(this.maxLogs / 2));
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erro ao salvar logs:', error);
      
      // Em caso de erro, limpar logs para liberar memória
      this.logs = [];
      this.isEnabled = false;
      console.warn('Sistema de auditoria desabilitado devido a erro de memória');
    }
  }

  // Carregar logs do localStorage
  loadLogs() {
    try {
      const savedLogs = localStorage.getItem('audit_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  }

  // Enviar log para servidor
  async sendToServer(log) {
    try {
      // Enviar apenas logs críticos e de segurança
      if (log.level === this.auditLevels.CRITICAL || log.level === this.auditLevels.SECURITY) {
        await fetch('/api/audit/logs/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log)
        });
      }
    } catch (error) {
      console.error('Erro ao enviar log para servidor:', error);
    }
  }

  // Obter logs filtrados
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];
    
    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }
    
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }
    
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }
    
    return filteredLogs;
  }

  // Exportar logs
  exportLogs(format = 'json') {
    const logs = this.getLogs();
    
    if (format === 'csv') {
      return this.convertToCSV(logs);
    }
    
    return JSON.stringify(logs, null, 2);
  }

  // Converter para CSV
  convertToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = ['timestamp', 'type', 'level', 'userId', 'sessionId', 'data'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = [
        log.timestamp,
        log.type,
        log.level,
        log.userId,
        log.sessionId,
        JSON.stringify(log.data).replace(/"/g, '""')
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  // Limpar logs antigos
  clearOldLogs(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
    this.saveLogs();
  }

  // Habilitar/desabilitar auditoria
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('audit_enabled', enabled);
  }

  // Obter estatísticas
  getStats() {
    const stats = {
      total: this.logs.length,
      byType: {},
      byLevel: {},
      byUser: {},
      recent: this.logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return logDate > oneHourAgo;
      }).length
    };
    
    this.logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
    });
    
    return stats;
  }
}

// Instância global do sistema de auditoria
export const auditSystem = new AuditSystem();

// Hook para auditoria
export const useAudit = () => {
  const logSecurityEvent = (event, details) => {
    auditSystem.logSecurityEvent(event, details);
  };

  const logCriticalError = (error, context) => {
    auditSystem.logCriticalError(error, context);
  };

  const getLogs = (filters) => {
    return auditSystem.getLogs(filters);
  };

  const exportLogs = (format) => {
    return auditSystem.exportLogs(format);
  };

  const getStats = () => {
    return auditSystem.getStats();
  };

  return {
    logSecurityEvent,
    logCriticalError,
    getLogs,
    exportLogs,
    getStats
  };
};

export default AuditSystem;

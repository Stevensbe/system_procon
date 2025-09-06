import api from './api';

class MonitoringService {
  constructor() {
    this.metrics = {
      pageViews: 0,
      apiCalls: 0,
      errors: 0,
      loadTimes: [],
      userActions: []
    };
    
    this.startTime = Date.now();
    this.isOnline = navigator.onLine;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Monitorar mudanças de conectividade
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.trackEvent('connectivity', 'online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackEvent('connectivity', 'offline');
    });

    // Monitorar erros JavaScript
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      });
    });

    // Monitorar performance de carregamento
    window.addEventListener('load', () => {
      const loadTime = Date.now() - this.startTime;
      this.trackLoadTime(loadTime);
    });
  }

  // Rastrear visualizações de página
  trackPageView(page) {
    this.metrics.pageViews++;
    this.trackEvent('pageview', page, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  // Rastrear chamadas de API
  trackApiCall(endpoint, method, duration, status) {
    this.metrics.apiCalls++;
    this.trackEvent('api_call', endpoint, {
      method,
      duration,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Rastrear erros
  trackError(errorData) {
    this.metrics.errors++;
    this.trackEvent('error', 'javascript_error', errorData);
  }

  // Rastrear tempo de carregamento
  trackLoadTime(duration) {
    this.metrics.loadTimes.push(duration);
    this.trackEvent('performance', 'load_time', {
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // Rastrear ações do usuário
  trackUserAction(action, details = {}) {
    this.metrics.userActions.push({
      action,
      details,
      timestamp: new Date().toISOString()
    });
    
    this.trackEvent('user_action', action, details);
  }

  // Método genérico para rastrear eventos
  trackEvent(category, action, details = {}) {
    const event = {
      category,
      action,
      details,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    // Enviar para backend se online
    if (this.isOnline) {
      this.sendToBackend(event);
    } else {
      // Armazenar localmente se offline
      this.storeLocally(event);
    }
  }

  // Obter métricas de performance do navegador
  getPerformanceMetrics() {
    if (!performance || !performance.getEntriesByType) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0];
    const paintMetrics = performance.getEntriesByType('paint');

    return {
      // Métricas de navegação
      dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
      tcp: navigation?.connectEnd - navigation?.connectStart,
      ssl: navigation?.connectEnd - navigation?.secureConnectionStart,
      ttfb: navigation?.responseStart - navigation?.requestStart,
      download: navigation?.responseEnd - navigation?.responseStart,
      domLoad: navigation?.domContentLoadedEventEnd - navigation?.navigationStart,
      windowLoad: navigation?.loadEventEnd - navigation?.navigationStart,

      // Métricas de pintura
      fcp: paintMetrics.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      lcp: this.getLargestContentfulPaint(),

      // Métricas customizadas
      totalApiCalls: this.metrics.apiCalls,
      totalErrors: this.metrics.errors,
      sessionDuration: Date.now() - this.startTime
    };
  }

  // Obter Largest Contentful Paint
  getLargestContentfulPaint() {
    return new Promise((resolve) => {
      if (!window.PerformanceObserver) {
        resolve(null);
        return;
      }

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry?.startTime);
        observer.disconnect();
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Timeout após 10 segundos
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 10000);
    });
  }

  // Verificar status do sistema
  async checkSystemHealth() {
    try {
      const response = await api.get('/health/');
      return {
        status: 'online',
        data: response.data,
        responseTime: response.duration || null
      };
    } catch (error) {
      return {
        status: 'offline',
        error: error.message,
        responseTime: null
      };
    }
  }

  // Obter métricas do backend
  async getBackendMetrics() {
    try {
      const response = await api.get('/metrics/json/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter métricas do backend:', error);
      return null;
    }
  }

  // Enviar evento para o backend
  async sendToBackend(event) {
    try {
      // Temporariamente desabilitado para evitar erros 404
      // await api.post('/monitoring/events/', event);
      console.log('Evento de monitoramento (desabilitado):', event);
    } catch (error) {
      console.error('Erro ao enviar evento de monitoramento:', error);
      this.storeLocally(event);
    }
  }

  // Armazenar evento localmente
  storeLocally(event) {
    try {
      const stored = JSON.parse(localStorage.getItem('monitoring_events') || '[]');
      stored.push(event);
      
      // Limitar a 100 eventos locais
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100);
      }
      
      localStorage.setItem('monitoring_events', JSON.stringify(stored));
    } catch (error) {
      console.error('Erro ao armazenar evento localmente:', error);
    }
  }

  // Sincronizar eventos armazenados localmente
  async syncStoredEvents() {
    try {
      const stored = JSON.parse(localStorage.getItem('monitoring_events') || '[]');
      
      if (stored.length > 0 && this.isOnline) {
        // Temporariamente desabilitado para evitar erros 404
        // await api.post('/monitoring/events/bulk/', { events: stored });
        console.log('Sincronização de eventos (desabilitada):', stored.length, 'eventos');
        localStorage.removeItem('monitoring_events');
      }
    } catch (error) {
      console.error('Erro ao sincronizar eventos:', error);
    }
  }

  // Obter ID da sessão
  getSessionId() {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  // Obter ID do usuário (se logado)
  getUserId() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.user_id || null;
      }
    } catch (error) {
      // Token inválido ou não existe
    }
    return null;
  }

  // Obter resumo das métricas
  getMetricsSummary() {
    return {
      ...this.metrics,
      sessionDuration: Date.now() - this.startTime,
      isOnline: this.isOnline,
      performance: this.getPerformanceMetrics()
    };
  }

  // Limpar métricas
  clearMetrics() {
    this.metrics = {
      pageViews: 0,
      apiCalls: 0,
      errors: 0,
      loadTimes: [],
      userActions: []
    };
    this.startTime = Date.now();
  }
}

// Instância singleton
const monitoringService = new MonitoringService();

export default monitoringService;
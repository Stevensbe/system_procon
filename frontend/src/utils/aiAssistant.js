// Sistema de Inteligência Artificial e Automação
export class AIAssistant {
  constructor() {
    this.isEnabled = true;
    this.context = [];
    this.maxContextLength = 10;
    this.suggestions = [];
    this.automationRules = [];
    this.learningData = {};
    
    this.init();
  }

  // Inicializar sistema de IA
  init() {
    this.loadLearningData();
    this.setupEventListeners();
    this.initializeAutomationRules();
    console.log('Sistema de IA inicializado');
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    // Monitorar navegação do usuário
    this.monitorUserNavigation();
    
    // Monitorar padrões de uso
    this.monitorUsagePatterns();
    
    // Monitorar formulários
    this.monitorFormInteractions();
    
    // Monitorar erros
    this.monitorErrors();
  }

  // Monitorar navegação do usuário
  monitorUserNavigation() {
    let currentPath = window.location.pathname;
    
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        this.recordNavigation(currentPath, window.location.pathname);
        currentPath = window.location.pathname;
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Monitorar padrões de uso
  monitorUsagePatterns() {
    // Monitorar tempo gasto em cada página
    let pageStartTime = Date.now();
    
    const recordPageTime = () => {
      const timeSpent = Date.now() - pageStartTime;
      this.recordPageTime(window.location.pathname, timeSpent);
      pageStartTime = Date.now();
    };

    // Registrar tempo quando mudar de página
    window.addEventListener('beforeunload', recordPageTime);
    
    // Monitorar cliques e interações
    document.addEventListener('click', (event) => {
      this.recordInteraction('click', {
        element: event.target.tagName,
        text: event.target.textContent?.trim(),
        path: window.location.pathname
      });
    });
  }

  // Monitorar interações com formulários
  monitorFormInteractions() {
    document.addEventListener('input', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        this.recordFormInteraction(event.target);
      }
    });
  }

  // Monitorar erros
  monitorErrors() {
    window.addEventListener('error', (event) => {
      this.recordError(event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(event.reason);
    });
  }

  // Registrar navegação
  recordNavigation(fromPath, toPath) {
    this.addToContext({
      type: 'navigation',
      from: fromPath,
      to: toPath,
      timestamp: Date.now()
    });
    
    this.updateLearningData('navigation', { from: fromPath, to: toPath });
  }

  // Registrar tempo em página
  recordPageTime(path, timeSpent) {
    this.updateLearningData('pageTime', { path, timeSpent });
  }

  // Registrar interação
  recordInteraction(type, data) {
    this.addToContext({
      type: 'interaction',
      interactionType: type,
      data,
      timestamp: Date.now()
    });
    
    this.updateLearningData('interactions', { type, data });
  }

  // Registrar interação com formulário
  recordFormInteraction(element) {
    const formData = {
      field: element.name || element.id,
      type: element.type,
      value: element.value,
      path: window.location.pathname
    };
    
    this.updateLearningData('formInteractions', formData);
  }

  // Registrar erro
  recordError(error) {
    this.addToContext({
      type: 'error',
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
    
    this.updateLearningData('errors', { message: error.message, stack: error.stack });
  }

  // Adicionar ao contexto
  addToContext(item) {
    this.context.unshift(item);
    
    if (this.context.length > this.maxContextLength) {
      this.context = this.context.slice(0, this.maxContextLength);
    }
  }

  // Atualizar dados de aprendizado
  updateLearningData(category, data) {
    if (!this.learningData[category]) {
      this.learningData[category] = [];
    }
    
    this.learningData[category].push({
      ...data,
      timestamp: Date.now()
    });
    
    // Manter apenas os últimos 100 registros
    if (this.learningData[category].length > 100) {
      this.learningData[category] = this.learningData[category].slice(-100);
    }
    
    this.saveLearningData();
  }

  // Salvar dados de aprendizado
  saveLearningData() {
    try {
      localStorage.setItem('ai_learning_data', JSON.stringify(this.learningData));
    } catch (error) {
      console.error('Erro ao salvar dados de aprendizado:', error);
    }
  }

  // Carregar dados de aprendizado
  loadLearningData() {
    try {
      const savedData = localStorage.getItem('ai_learning_data');
      if (savedData) {
        this.learningData = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de aprendizado:', error);
    }
  }

  // Inicializar regras de automação
  initializeAutomationRules() {
    this.automationRules = [
      {
        id: 'form_validation',
        name: 'Validação Inteligente de Formulários',
        description: 'Sugere melhorias em formulários baseado no histórico',
        enabled: true,
        trigger: 'form_interaction',
        action: 'suggest_improvements'
      },
      {
        id: 'navigation_suggestions',
        name: 'Sugestões de Navegação',
        description: 'Sugere próximas páginas baseado no padrão de uso',
        enabled: true,
        trigger: 'navigation',
        action: 'suggest_navigation'
      },
      {
        id: 'error_prevention',
        name: 'Prevenção de Erros',
        description: 'Prevê e previne erros comuns',
        enabled: true,
        trigger: 'error',
        action: 'prevent_errors'
      },
      {
        id: 'performance_optimization',
        name: 'Otimização de Performance',
        description: 'Sugere otimizações baseado no uso',
        enabled: true,
        trigger: 'performance',
        action: 'optimize_performance'
      }
    ];
  }

  // Gerar sugestões inteligentes
  generateSuggestions(context = null) {
    const currentContext = context || this.context;
    const suggestions = [];

    // Analisar contexto atual
    const recentActions = currentContext.slice(0, 5);
    const userPatterns = this.analyzeUserPatterns();
    const commonErrors = this.analyzeCommonErrors();

    // Sugestões baseadas em navegação
    if (this.isOnFormPage()) {
      suggestions.push({
        type: 'form_help',
        title: 'Precisa de ajuda com o formulário?',
        description: 'Posso sugerir preenchimentos automáticos baseado no histórico',
        action: 'show_form_help',
        priority: 'high'
      });
    }

    // Sugestões baseadas em erros comuns
    if (commonErrors.length > 0) {
      suggestions.push({
        type: 'error_prevention',
        title: 'Dica de Prevenção',
        description: `Evite erros comuns: ${commonErrors[0].message}`,
        action: 'show_error_tips',
        priority: 'medium'
      });
    }

    // Sugestões baseadas em padrões de uso
    if (userPatterns.frequentPages.length > 0) {
      suggestions.push({
        type: 'navigation',
        title: 'Acesso Rápido',
        description: `Páginas mais acessadas: ${userPatterns.frequentPages.slice(0, 3).join(', ')}`,
        action: 'show_quick_access',
        priority: 'low'
      });
    }

    // Sugestões baseadas em performance
    if (userPatterns.slowPages.length > 0) {
      suggestions.push({
        type: 'performance',
        title: 'Otimização',
        description: 'Algumas páginas podem ser otimizadas para carregamento mais rápido',
        action: 'show_performance_tips',
        priority: 'medium'
      });
    }

    this.suggestions = suggestions;
    return suggestions;
  }

  // Analisar padrões do usuário
  analyzeUserPatterns() {
    const patterns = {
      frequentPages: [],
      slowPages: [],
      commonActions: [],
      timeOfDay: {}
    };

    // Analisar navegação
    if (this.learningData.navigation) {
      const pageCounts = {};
      this.learningData.navigation.forEach(nav => {
        pageCounts[nav.to] = (pageCounts[nav.to] || 0) + 1;
      });
      
      patterns.frequentPages = Object.entries(pageCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([page]) => page);
    }

    // Analisar tempo em páginas
    if (this.learningData.pageTime) {
      const pageTimes = {};
      this.learningData.pageTime.forEach(time => {
        if (!pageTimes[time.path]) {
          pageTimes[time.path] = [];
        }
        pageTimes[time.path].push(time.timeSpent);
      });
      
      patterns.slowPages = Object.entries(pageTimes)
        .map(([page, times]) => ({
          page,
          avgTime: times.reduce((a, b) => a + b, 0) / times.length
        }))
        .filter(item => item.avgTime > 5000) // Mais de 5 segundos
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 3)
        .map(item => item.page);
    }

    return patterns;
  }

  // Analisar erros comuns
  analyzeCommonErrors() {
    if (!this.learningData.errors) return [];
    
    const errorCounts = {};
    this.learningData.errors.forEach(error => {
      const key = error.message;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  // Verificar se está em página de formulário
  isOnFormPage() {
    const currentPath = window.location.pathname;
    return currentPath.includes('form') || 
           currentPath.includes('create') || 
           currentPath.includes('edit') ||
           document.querySelector('form') !== null;
  }

  // Preencher formulário automaticamente
  autoFillForm(formData) {
    const form = document.querySelector('form');
    if (!form) return false;

    Object.entries(formData).forEach(([field, value]) => {
      const element = form.querySelector(`[name="${field}"], [id="${field}"]`);
      if (element) {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    return true;
  }

  // Sugerir preenchimento baseado no histórico
  suggestFormFill() {
    if (!this.learningData.formInteractions) return {};

    const suggestions = {};
    const recentForms = this.learningData.formInteractions
      .filter(interaction => interaction.path === window.location.pathname)
      .slice(-10);

    recentForms.forEach(form => {
      if (form.value && form.value.length > 0) {
        suggestions[form.field] = form.value;
      }
    });

    return suggestions;
  }

  // Otimizar performance baseado no uso
  optimizePerformance() {
    const optimizations = [];

    // Verificar se há muitas requisições
    if (this.learningData.interactions) {
      const apiCalls = this.learningData.interactions.filter(i => 
        i.data && i.data.path && i.data.path.includes('/api/')
      );
      
      if (apiCalls.length > 50) {
        optimizations.push({
          type: 'cache',
          message: 'Considere implementar cache para reduzir chamadas à API',
          priority: 'high'
        });
      }
    }

    // Verificar páginas lentas
    const patterns = this.analyzeUserPatterns();
    if (patterns.slowPages.length > 0) {
      optimizations.push({
        type: 'lazy_loading',
        message: `Páginas lentas detectadas: ${patterns.slowPages.join(', ')}`,
        priority: 'medium'
      });
    }

    return optimizations;
  }

  // Prever próximas ações do usuário
  predictNextActions() {
    const predictions = [];
    const patterns = this.analyzeUserPatterns();

    // Prever navegação baseada no histórico
    if (this.learningData.navigation) {
      const currentPath = window.location.pathname;
      const nextPages = this.learningData.navigation
        .filter(nav => nav.from === currentPath)
        .map(nav => nav.to);
      
      const pageCounts = {};
      nextPages.forEach(page => {
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      });
      
      const mostLikely = Object.entries(pageCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      mostLikely.forEach(([page, count]) => {
        predictions.push({
          type: 'navigation',
          action: `Ir para ${page}`,
          confidence: count / nextPages.length,
          data: { page }
        });
      });
    }

    return predictions;
  }

  // Executar automação
  executeAutomation(ruleId, data) {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (!rule || !rule.enabled) return false;

    switch (rule.action) {
      case 'suggest_improvements':
        return this.suggestFormImprovements(data);
      case 'suggest_navigation':
        return this.suggestNavigation(data);
      case 'prevent_errors':
        return this.preventErrors(data);
      case 'optimize_performance':
        return this.optimizePerformance();
      default:
        return false;
    }
  }

  // Sugerir melhorias em formulários
  suggestFormImprovements(formData) {
    const suggestions = [];
    
    // Verificar campos obrigatórios
    if (formData.requiredFields) {
      suggestions.push({
        type: 'validation',
        message: 'Adicione validação em tempo real para campos obrigatórios',
        priority: 'high'
      });
    }

    // Verificar campos com erros frequentes
    if (this.learningData.errors) {
      const formErrors = this.learningData.errors.filter(error => 
        error.message.includes('form') || error.message.includes('validation')
      );
      
      if (formErrors.length > 5) {
        suggestions.push({
          type: 'user_experience',
          message: 'Considere adicionar dicas de preenchimento',
          priority: 'medium'
        });
      }
    }

    return suggestions;
  }

  // Sugerir navegação
  suggestNavigation(data) {
    const predictions = this.predictNextActions();
    return predictions.filter(p => p.type === 'navigation');
  }

  // Prevenir erros
  preventErrors(data) {
    const preventions = [];
    const commonErrors = this.analyzeCommonErrors();

    commonErrors.forEach(error => {
      preventions.push({
        type: 'prevention',
        message: `Para evitar: "${error.message}"`,
        suggestion: this.getErrorPreventionSuggestion(error.message)
      });
    });

    return preventions;
  }

  // Obter sugestão de prevenção de erro
  getErrorPreventionSuggestion(errorMessage) {
    const suggestions = {
      'Network Error': 'Verifique sua conexão com a internet',
      'Validation Error': 'Preencha todos os campos obrigatórios',
      'Permission Denied': 'Verifique suas permissões de acesso',
      'Timeout': 'A requisição demorou muito, tente novamente'
    };

    for (const [error, suggestion] of Object.entries(suggestions)) {
      if (errorMessage.includes(error)) {
        return suggestion;
      }
    }

    return 'Verifique os dados inseridos e tente novamente';
  }

  // Obter estatísticas de IA
  getAIStats() {
    return {
      totalInteractions: this.learningData.interactions?.length || 0,
      totalErrors: this.learningData.errors?.length || 0,
      totalFormInteractions: this.learningData.formInteractions?.length || 0,
      totalNavigations: this.learningData.navigation?.length || 0,
      suggestionsGenerated: this.suggestions.length,
      automationRules: this.automationRules.length,
      enabledRules: this.automationRules.filter(r => r.enabled).length
    };
  }

  // Habilitar/desabilitar IA
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('ai_enabled', enabled);
  }

  // Limpar dados de aprendizado
  clearLearningData() {
    this.learningData = {};
    this.context = [];
    this.suggestions = [];
    localStorage.removeItem('ai_learning_data');
  }
}

// Instância global do assistente de IA
export const aiAssistant = new AIAssistant();

// Hook para IA
export const useAI = () => {
  const generateSuggestions = (context) => {
    return aiAssistant.generateSuggestions(context);
  };

  const getPredictions = () => {
    return aiAssistant.predictNextActions();
  };

  const autoFillForm = (formData) => {
    return aiAssistant.autoFillForm(formData);
  };

  const getFormSuggestions = () => {
    return aiAssistant.suggestFormFill();
  };

  const getOptimizations = () => {
    return aiAssistant.optimizePerformance();
  };

  const getStats = () => {
    return aiAssistant.getAIStats();
  };

  const executeAutomation = (ruleId, data) => {
    return aiAssistant.executeAutomation(ruleId, data);
  };

  return {
    generateSuggestions,
    getPredictions,
    autoFillForm,
    getFormSuggestions,
    getOptimizations,
    getStats,
    executeAutomation
  };
};

export default AIAssistant;

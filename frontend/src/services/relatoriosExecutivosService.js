import api from './api';

class RelatoriosExecutivosService {
  constructor() {
    this.baseURL = '/api/relatorios-executivos/';
  }

  // ===== ESTATÍSTICAS E DASHBOARD =====
  
  /**
   * Obter estatísticas gerais do dashboard
   */
  async obterEstatisticas() {
    try {
      const response = await api.get(`${this.baseURL}estatisticas/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Obter relatórios recentes
   */
  async obterRelatoriosRecentes(limit = 10) {
    try {
      const response = await api.get(`${this.baseURL}relatorios-recentes/`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter relatórios recentes:', error);
      throw error;
    }
  }

  /**
   * Obter top usuários
   */
  async obterUsuariosTop(limit = 10) {
    try {
      const response = await api.get(`${this.baseURL}usuarios-top/`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter usuários top:', error);
      throw error;
    }
  }

  /**
   * Obter relatórios por tipo para gráficos
   */
  async obterRelatoriosPorTipo() {
    try {
      const response = await api.get(`${this.baseURL}relatorios-por-tipo/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter relatórios por tipo:', error);
      throw error;
    }
  }

  /**
   * Obter relatórios por status para gráficos
   */
  async obterRelatoriosPorStatus() {
    try {
      const response = await api.get(`${this.baseURL}relatorios-por-status/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter relatórios por status:', error);
      throw error;
    }
  }

  /**
   * Obter tendência mensal
   */
  async obterTendenciaMensal() {
    try {
      const response = await api.get(`${this.baseURL}tendencia-mensal/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter tendência mensal:', error);
      throw error;
    }
  }

  // ===== CRUD DE RELATÓRIOS =====

  /**
   * Listar todos os relatórios com paginação
   */
  async listarRelatorios(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}relatorios/`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar relatórios:', error);
      throw error;
    }
  }

  /**
   * Obter relatório específico por ID
   */
  async obterRelatorio(id) {
    try {
      const response = await api.get(`${this.baseURL}relatorios/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter relatório:', error);
      throw error;
    }
  }

  /**
   * Criar novo relatório
   */
  async criarRelatorio(dados) {
    try {
      const response = await api.post(`${this.baseURL}relatorios/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      throw error;
    }
  }

  /**
   * Atualizar relatório existente
   */
  async atualizarRelatorio(id, dados) {
    try {
      const response = await api.put(`${this.baseURL}relatorios/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      throw error;
    }
  }

  /**
   * Deletar relatório
   */
  async deletarRelatorio(id) {
    try {
      await api.delete(`${this.baseURL}relatorios/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      throw error;
    }
  }

  // ===== FILTROS E BUSCA =====

  /**
   * Filtrar relatórios com critérios avançados
   */
  async filtrarRelatorios(filtros) {
    try {
      const response = await api.get(`${this.baseURL}filtrar/`, { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Erro ao filtrar relatórios:', error);
      throw error;
    }
  }

  /**
   * Buscar relatórios por termo
   */
  async buscarRelatorios(termo) {
    try {
      const response = await api.get(`${this.baseURL}buscar/`, {
        params: { q: termo }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      throw error;
    }
  }

  // ===== TEMPLATES =====

  /**
   * Listar templates disponíveis
   */
  async listarTemplates() {
    try {
      const response = await api.get(`${this.baseURL}templates/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar templates:', error);
      throw error;
    }
  }

  /**
   * Obter template específico
   */
  async obterTemplate(id) {
    try {
      const response = await api.get(`${this.baseURL}templates/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter template:', error);
      throw error;
    }
  }

  /**
   * Criar novo template
   */
  async criarTemplate(dados) {
    try {
      const response = await api.post(`${this.baseURL}templates/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar template:', error);
      throw error;
    }
  }

  /**
   * Atualizar template
   */
  async atualizarTemplate(id, dados) {
    try {
      const response = await api.put(`${this.baseURL}templates/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      throw error;
    }
  }

  /**
   * Deletar template
   */
  async deletarTemplate(id) {
    try {
      await api.delete(`${this.baseURL}templates/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      throw error;
    }
  }

  // ===== GERAÇÃO DE RELATÓRIOS =====

  /**
   * Gerar relatório a partir de template
   */
  async gerarRelatorio(templateId, parametros = {}) {
    try {
      const response = await api.post(`${this.baseURL}gerar/`, {
        template_id: templateId,
        parametros: parametros
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Agendar geração de relatório
   */
  async agendarRelatorio(dados) {
    try {
      const response = await api.post(`${this.baseURL}agendar/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao agendar relatório:', error);
      throw error;
    }
  }

  /**
   * Cancelar agendamento
   */
  async cancelarAgendamento(id) {
    try {
      await api.delete(`${this.baseURL}agendamentos/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      throw error;
    }
  }

  // ===== DOWNLOAD E EXPORTAÇÃO =====

  /**
   * Download do relatório
   */
  async downloadRelatorio(id, formato = 'pdf') {
    try {
      const response = await api.get(`${this.baseURL}relatorios/${id}/download/`, {
        params: { formato },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer download do relatório:', error);
      throw error;
    }
  }

  /**
   * Exportar relatório em diferentes formatos
   */
  async exportarRelatorio(id, formato) {
    try {
      const response = await api.get(`${this.baseURL}relatorios/${id}/exportar/`, {
        params: { formato },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      throw error;
    }
  }

  // ===== CONFIGURAÇÕES =====

  /**
   * Obter configurações do sistema
   */
  async obterConfiguracoes() {
    try {
      const response = await api.get(`${this.baseURL}configuracoes/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações
   */
  async atualizarConfiguracoes(dados) {
    try {
      const response = await api.put(`${this.baseURL}configuracoes/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  // ===== RELATÓRIOS =====

  /**
   * Gerar relatório de uso
   */
  async gerarRelatorioUso(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}relatorio-uso/`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de uso:', error);
      throw error;
    }
  }

  /**
   * Exportar dados para análise
   */
  async exportarDados(formato = 'excel', filtros = {}) {
    try {
      const response = await api.get(`${this.baseURL}exportar-dados/`, {
        params: { formato, ...filtros },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  }

  // ===== NOTIFICAÇÕES =====

  /**
   * Enviar notificação sobre relatório
   */
  async enviarNotificacao(relatorioId, tipo, destinatarios) {
    try {
      const response = await api.post(`${this.baseURL}relatorios/${relatorioId}/notificar/`, {
        tipo: tipo,
        destinatarios: destinatarios
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  // ===== UTILITÁRIOS =====

  /**
   * Validar dados do relatório
   */
  validarDadosRelatorio(dados) {
    const erros = [];
    
    if (!dados.nome || dados.nome.trim().length < 3) {
      erros.push('Nome deve ter pelo menos 3 caracteres');
    }
    
    if (!dados.tipo) {
      erros.push('Tipo de relatório é obrigatório');
    }
    
    if (!dados.template_id) {
      erros.push('Template é obrigatório');
    }
    
    return erros;
  }

  /**
   * Formatar status para exibição
   */
  formatarStatus(status) {
    const statusMap = {
      'PENDENTE': 'Pendente',
      'EM_GERACAO': 'Em Geração',
      'CONCLUIDO': 'Concluído',
      'ERRO': 'Erro'
    };
    return statusMap[status] || status;
  }

  /**
   * Formatar tipo para exibição
   */
  formatarTipo(tipo) {
    const tipoMap = {
      'FINANCEIRO': 'Financeiro',
      'OPERACIONAL': 'Operacional',
      'ESTRATEGICO': 'Estratégico',
      'COMPLIANCE': 'Compliance',
      'PERFORMANCE': 'Performance'
    };
    return tipoMap[tipo] || tipo;
  }

  /**
   * Obter cor do status
   */
  getStatusColor(status) {
    const colorMap = {
      'PENDENTE': '#f59e0b',
      'EM_GERACAO': '#3b82f6',
      'CONCLUIDO': '#10b981',
      'ERRO': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  }

  /**
   * Obter cor do tipo
   */
  getTipoColor(tipo) {
    const colorMap = {
      'FINANCEIRO': '#3b82f6',
      'OPERACIONAL': '#059669',
      'ESTRATEGICO': '#d97706',
      'COMPLIANCE': '#7c3aed',
      'PERFORMANCE': '#dc2626'
    };
    return colorMap[tipo] || '#6b7280';
  }

  /**
   * Formatar data
   */
  formatarData(data) {
    if (!data) return 'N/A';
    return new Date(data).toLocaleString('pt-BR');
  }

  /**
   * Formatar tempo em minutos
   */
  formatarTempo(minutos) {
    if (!minutos) return 'N/A';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas}h ${mins}min`;
    }
    return `${mins}min`;
  }

  /**
   * Formatar tamanho de arquivo
   */
  formatarTamanho(bytes) {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Verificar se relatório está pronto
   */
  async verificarStatus(id) {
    try {
      const response = await api.get(`${this.baseURL}relatorios/${id}/status/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  }

  /**
   * Reprocessar relatório com erro
   */
  async reprocessarRelatorio(id) {
    try {
      const response = await api.post(`${this.baseURL}relatorios/${id}/reprocessar/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao reprocessar relatório:', error);
      throw error;
    }
  }
}

export default new RelatoriosExecutivosService();

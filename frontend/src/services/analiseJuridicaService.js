import api from './api';

class AnaliseJuridicaService {
  constructor() {
    this.baseURL = '/api/analise-juridica/';
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
   * Obter análises recentes
   */
  async obterAnalisesRecentes(limit = 10) {
    try {
      const response = await api.get(`${this.baseURL}analises-recentes/`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter análises recentes:', error);
      throw error;
    }
  }

  /**
   * Obter top analistas
   */
  async obterAnalistasTop(limit = 10) {
    try {
      const response = await api.get(`${this.baseURL}analistas-top/`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter analistas top:', error);
      throw error;
    }
  }

  /**
   * Obter análises por tipo para gráficos
   */
  async obterAnalisesPorTipo() {
    try {
      const response = await api.get(`${this.baseURL}analises-por-tipo/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter análises por tipo:', error);
      throw error;
    }
  }

  /**
   * Obter análises por status para gráficos
   */
  async obterAnalisesPorStatus() {
    try {
      const response = await api.get(`${this.baseURL}analises-por-status/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter análises por status:', error);
      throw error;
    }
  }

  // ===== CRUD DE ANÁLISES =====

  /**
   * Listar todas as análises com paginação
   */
  async listarAnalises(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}analises/`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar análises:', error);
      throw error;
    }
  }

  /**
   * Obter análise específica por ID
   */
  async obterAnalise(id) {
    try {
      const response = await api.get(`${this.baseURL}analises/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter análise:', error);
      throw error;
    }
  }

  /**
   * Criar nova análise
   */
  async criarAnalise(dados) {
    try {
      const response = await api.post(`${this.baseURL}analises/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar análise:', error);
      throw error;
    }
  }

  /**
   * Atualizar análise existente
   */
  async atualizarAnalise(id, dados) {
    try {
      const response = await api.put(`${this.baseURL}analises/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar análise:', error);
      throw error;
    }
  }

  /**
   * Deletar análise
   */
  async deletarAnalise(id) {
    try {
      await api.delete(`${this.baseURL}analises/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar análise:', error);
      throw error;
    }
  }

  // ===== FILTROS E BUSCA =====

  /**
   * Filtrar análises com critérios avançados
   */
  async filtrarAnalises(filtros) {
    try {
      const response = await api.get(`${this.baseURL}filtrar/`, { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Erro ao filtrar análises:', error);
      throw error;
    }
  }

  /**
   * Buscar análises por termo
   */
  async buscarAnalises(termo) {
    try {
      const response = await api.get(`${this.baseURL}buscar/`, {
        params: { q: termo }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar análises:', error);
      throw error;
    }
  }

  // ===== ANALISTAS =====

  /**
   * Listar todos os analistas
   */
  async listarAnalistas() {
    try {
      const response = await api.get(`${this.baseURL}analistas/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar analistas:', error);
      throw error;
    }
  }

  /**
   * Obter analista específico
   */
  async obterAnalista(id) {
    try {
      const response = await api.get(`${this.baseURL}analistas/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter analista:', error);
      throw error;
    }
  }

  /**
   * Criar novo analista
   */
  async criarAnalista(dados) {
    try {
      const response = await api.post(`${this.baseURL}analistas/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar analista:', error);
      throw error;
    }
  }

  /**
   * Atualizar analista
   */
  async atualizarAnalista(id, dados) {
    try {
      const response = await api.put(`${this.baseURL}analistas/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar analista:', error);
      throw error;
    }
  }

  /**
   * Deletar analista
   */
  async deletarAnalista(id) {
    try {
      await api.delete(`${this.baseURL}analistas/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar analista:', error);
      throw error;
    }
  }

  // ===== DOCUMENTOS E ANEXOS =====

  /**
   * Upload de documento para análise
   */
  async uploadDocumento(analiseId, arquivo) {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      
      const response = await api.post(`${this.baseURL}analises/${analiseId}/documentos/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      throw error;
    }
  }

  /**
   * Listar documentos de uma análise
   */
  async listarDocumentos(analiseId) {
    try {
      const response = await api.get(`${this.baseURL}analises/${analiseId}/documentos/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  /**
   * Deletar documento
   */
  async deletarDocumento(analiseId, documentoId) {
    try {
      await api.delete(`${this.baseURL}analises/${analiseId}/documentos/${documentoId}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw error;
    }
  }

  // ===== PARECERES E CONCLUSÕES =====

  /**
   * Criar parecer para análise
   */
  async criarParecer(analiseId, dados) {
    try {
      const response = await api.post(`${this.baseURL}analises/${analiseId}/pareceres/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar parecer:', error);
      throw error;
    }
  }

  /**
   * Atualizar parecer
   */
  async atualizarParecer(analiseId, parecerId, dados) {
    try {
      const response = await api.put(`${this.baseURL}analises/${analiseId}/pareceres/${parecerId}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar parecer:', error);
      throw error;
    }
  }

  /**
   * Listar pareceres de uma análise
   */
  async listarPareceres(analiseId) {
    try {
      const response = await api.get(`${this.baseURL}analises/${analiseId}/pareceres/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar pareceres:', error);
      throw error;
    }
  }

  // ===== WORKFLOW E STATUS =====

  /**
   * Atribuir análise a um analista
   */
  async atribuirAnalista(analiseId, analistaId) {
    try {
      const response = await api.post(`${this.baseURL}analises/${analiseId}/atribuir/`, {
        analista_id: analistaId
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atribuir analista:', error);
      throw error;
    }
  }

  /**
   * Alterar status da análise
   */
  async alterarStatus(analiseId, status) {
    try {
      const response = await api.post(`${this.baseURL}analises/${analiseId}/status/`, {
        status: status
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      throw error;
    }
  }

  /**
   * Definir prioridade da análise
   */
  async definirPrioridade(analiseId, prioridade) {
    try {
      const response = await api.post(`${this.baseURL}analises/${analiseId}/prioridade/`, {
        prioridade: prioridade
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao definir prioridade:', error);
      throw error;
    }
  }

  // ===== RELATÓRIOS =====

  /**
   * Gerar relatório de análises
   */
  async gerarRelatorio(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}relatorios/`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Exportar análises
   */
  async exportarAnalises(formato = 'excel', filtros = {}) {
    try {
      const response = await api.get(`${this.baseURL}exportar/`, {
        params: { formato, ...filtros },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar análises:', error);
      throw error;
    }
  }

  // ===== NOTIFICAÇÕES =====

  /**
   * Enviar notificação sobre análise
   */
  async enviarNotificacao(analiseId, tipo, destinatarios) {
    try {
      const response = await api.post(`${this.baseURL}analises/${analiseId}/notificar/`, {
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
   * Validar dados da análise
   */
  validarDadosAnalise(dados) {
    const erros = [];
    
    if (!dados.titulo || dados.titulo.trim().length < 3) {
      erros.push('Título deve ter pelo menos 3 caracteres');
    }
    
    if (!dados.descricao || dados.descricao.trim().length < 10) {
      erros.push('Descrição deve ter pelo menos 10 caracteres');
    }
    
    if (!dados.tipo) {
      erros.push('Tipo de análise é obrigatório');
    }
    
    if (!dados.prioridade) {
      erros.push('Prioridade é obrigatória');
    }
    
    return erros;
  }

  /**
   * Formatar status para exibição
   */
  formatarStatus(status) {
    const statusMap = {
      'PENDENTE': 'Pendente',
      'EM_ANALISE': 'Em Análise',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  /**
   * Formatar tipo para exibição
   */
  formatarTipo(tipo) {
    const tipoMap = {
      'CONTRATO': 'Contrato',
      'PROCESSO': 'Processo',
      'PARECER': 'Parecer',
      'RECURSO': 'Recurso',
      'LEGISLACAO': 'Legislação'
    };
    return tipoMap[tipo] || tipo;
  }

  /**
   * Formatar prioridade para exibição
   */
  formatarPrioridade(prioridade) {
    const prioridadeMap = {
      'ALTA': 'Alta',
      'MEDIA': 'Média',
      'BAIXA': 'Baixa'
    };
    return prioridadeMap[prioridade] || prioridade;
  }

  /**
   * Obter cor do status
   */
  getStatusColor(status) {
    const colorMap = {
      'PENDENTE': '#f59e0b',
      'EM_ANALISE': '#3b82f6',
      'CONCLUIDA': '#10b981',
      'CANCELADA': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  }

  /**
   * Obter cor do tipo
   */
  getTipoColor(tipo) {
    const colorMap = {
      'CONTRATO': '#3b82f6',
      'PROCESSO': '#059669',
      'PARECER': '#d97706',
      'RECURSO': '#7c3aed',
      'LEGISLACAO': '#dc2626'
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

  // ===== MÉTODOS AUXILIARES PARA FORMULÁRIOS =====

  /**
   * Listar processos disponíveis
   */
  async listarProcessos() {
    try {
      const response = await api.get('/api/processos/');
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Erro ao listar processos:', error);
      return [];
    }
  }
}

export default new AnaliseJuridicaService();
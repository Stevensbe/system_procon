import api from './api';

class RecursosDefesasService {
  constructor() {
    this.baseURL = '/api/recursos-defesas/';
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
   * Obter recursos recentes
   */
  async obterRecursosRecentes(limit = 10) {
    try {
      const response = await api.get(`${this.baseURL}recursos-recentes/`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter recursos recentes:', error);
      throw error;
    }
  }

  /**
   * Obter top advogados
   */
  async obterAdvogadosTop(limit = 10) {
    try {
      const response = await api.get(`${this.baseURL}advogados-top/`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter advogados top:', error);
      throw error;
    }
  }

  /**
   * Obter recursos por tipo para gráficos
   */
  async obterRecursosPorTipo() {
    try {
      const response = await api.get(`${this.baseURL}recursos-por-tipo/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter recursos por tipo:', error);
      throw error;
    }
  }

  /**
   * Obter recursos por status para gráficos
   */
  async obterRecursosPorStatus() {
    try {
      const response = await api.get(`${this.baseURL}recursos-por-status/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter recursos por status:', error);
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

  // ===== CRUD DE RECURSOS =====

  /**
   * Listar todos os recursos com paginação
   */
  async listarRecursos(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}recursos/`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar recursos:', error);
      throw error;
    }
  }

  /**
   * Obter recurso específico por ID
   */
  async obterRecurso(id) {
    try {
      const response = await api.get(`${this.baseURL}recursos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter recurso:', error);
      throw error;
    }
  }

  /**
   * Criar novo recurso
   */
  async criarRecurso(dados) {
    try {
      const response = await api.post(`${this.baseURL}recursos/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar recurso:', error);
      throw error;
    }
  }

  /**
   * Atualizar recurso existente
   */
  async atualizarRecurso(id, dados) {
    try {
      const response = await api.put(`${this.baseURL}recursos/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar recurso:', error);
      throw error;
    }
  }

  /**
   * Deletar recurso
   */
  async deletarRecurso(id) {
    try {
      await api.delete(`${this.baseURL}recursos/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar recurso:', error);
      throw error;
    }
  }

  // ===== FILTROS E BUSCA =====

  /**
   * Filtrar recursos com critérios avançados
   */
  async filtrarRecursos(filtros) {
    try {
      const response = await api.get(`${this.baseURL}filtrar/`, { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Erro ao filtrar recursos:', error);
      throw error;
    }
  }

  /**
   * Buscar recursos por termo
   */
  async buscarRecursos(termo) {
    try {
      const response = await api.get(`${this.baseURL}buscar/`, {
        params: { q: termo }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos:', error);
      throw error;
    }
  }

  // ===== ADVOGADOS =====

  /**
   * Listar todos os advogados
   */
  async listarAdvogados() {
    try {
      const response = await api.get(`${this.baseURL}advogados/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar advogados:', error);
      throw error;
    }
  }

  /**
   * Obter advogado específico
   */
  async obterAdvogado(id) {
    try {
      const response = await api.get(`${this.baseURL}advogados/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter advogado:', error);
      throw error;
    }
  }

  /**
   * Criar novo advogado
   */
  async criarAdvogado(dados) {
    try {
      const response = await api.post(`${this.baseURL}advogados/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar advogado:', error);
      throw error;
    }
  }

  /**
   * Atualizar advogado
   */
  async atualizarAdvogado(id, dados) {
    try {
      const response = await api.put(`${this.baseURL}advogados/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar advogado:', error);
      throw error;
    }
  }

  /**
   * Deletar advogado
   */
  async deletarAdvogado(id) {
    try {
      await api.delete(`${this.baseURL}advogados/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar advogado:', error);
      throw error;
    }
  }

  // ===== DEFESAS =====

  /**
   * Listar defesas de um recurso
   */
  async listarDefesas(recursoId) {
    try {
      const response = await api.get(`${this.baseURL}recursos/${recursoId}/defesas/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar defesas:', error);
      throw error;
    }
  }

  /**
   * Criar defesa para um recurso
   */
  async criarDefesa(recursoId, dados) {
    try {
      const response = await api.post(`${this.baseURL}recursos/${recursoId}/defesas/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar defesa:', error);
      throw error;
    }
  }

  /**
   * Atualizar defesa
   */
  async atualizarDefesa(recursoId, defesaId, dados) {
    try {
      const response = await api.put(`${this.baseURL}recursos/${recursoId}/defesas/${defesaId}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar defesa:', error);
      throw error;
    }
  }

  /**
   * Deletar defesa
   */
  async deletarDefesa(recursoId, defesaId) {
    try {
      await api.delete(`${this.baseURL}recursos/${recursoId}/defesas/${defesaId}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar defesa:', error);
      throw error;
    }
  }

  // ===== ANEXOS E DOCUMENTOS =====

  /**
   * Upload de documento para recurso
   */
  async uploadDocumento(recursoId, arquivo, tipo = 'DEFESA') {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('tipo', tipo);
      
      const response = await api.post(`${this.baseURL}recursos/${recursoId}/documentos/`, formData, {
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
   * Listar documentos de um recurso
   */
  async listarDocumentos(recursoId) {
    try {
      const response = await api.get(`${this.baseURL}recursos/${recursoId}/documentos/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  /**
   * Deletar documento
   */
  async deletarDocumento(recursoId, documentoId) {
    try {
      await api.delete(`${this.baseURL}recursos/${recursoId}/documentos/${documentoId}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw error;
    }
  }

  // ===== TRAMITAÇÃO =====

  /**
   * Iniciar tramitação do recurso
   */
  async iniciarTramitacao(recursoId, dados) {
    try {
      const response = await api.post(`${this.baseURL}recursos/${recursoId}/tramitar/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar tramitação:', error);
      throw error;
    }
  }

  /**
   * Alterar status do recurso
   */
  async alterarStatus(recursoId, status, observacoes = '') {
    try {
      const response = await api.post(`${this.baseURL}recursos/${recursoId}/status/`, {
        status: status,
        observacoes: observacoes
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      throw error;
    }
  }

  /**
   * Emitir parecer sobre recurso
   */
  async emitirParecer(recursoId, dados) {
    try {
      const response = await api.post(`${this.baseURL}recursos/${recursoId}/parecer/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao emitir parecer:', error);
      throw error;
    }
  }

  // ===== RELATÓRIOS =====

  /**
   * Gerar relatório de recursos
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
   * Exportar recursos
   */
  async exportarRecursos(formato = 'excel', filtros = {}) {
    try {
      const response = await api.get(`${this.baseURL}exportar/`, {
        params: { formato, ...filtros },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar recursos:', error);
      throw error;
    }
  }

  // ===== NOTIFICAÇÕES =====

  /**
   * Enviar notificação sobre recurso
   */
  async enviarNotificacao(recursoId, tipo, destinatarios) {
    try {
      const response = await api.post(`${this.baseURL}recursos/${recursoId}/notificar/`, {
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
   * Validar dados do recurso
   */
  validarDadosRecurso(dados) {
    const erros = [];
    
    if (!dados.numero_processo_origem) {
      erros.push('Número do processo de origem é obrigatório');
    }
    
    if (!dados.requerente_nome) {
      erros.push('Nome do requerente é obrigatório');
    }
    
    if (!dados.requerente_documento) {
      erros.push('Documento do requerente é obrigatório');
    }
    
    if (!dados.fundamentacao) {
      erros.push('Fundamentação do recurso é obrigatória');
    }
    
    if (!dados.pedidos) {
      erros.push('Pedidos do recurso são obrigatórios');
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
      'DEFERIDO': 'Deferido',
      'INDEFERIDO': 'Indeferido',
      'PARCIALMENTE_DEFERIDO': 'Parcialmente Deferido'
    };
    return statusMap[status] || status;
  }

  /**
   * Formatar tipo para exibição
   */
  formatarTipo(tipo) {
    const tipoMap = {
      'MULTA': 'Multa',
      'AUTO_INFRACAO': 'Auto de Infração',
      'DECISAO_ADMINISTRATIVA': 'Decisão Administrativa',
      'OUTROS': 'Outros'
    };
    return tipoMap[tipo] || tipo;
  }

  /**
   * Obter cor do status
   */
  getStatusColor(status) {
    const colorMap = {
      'PENDENTE': '#f59e0b',
      'EM_ANALISE': '#3b82f6',
      'DEFERIDO': '#10b981',
      'INDEFERIDO': '#ef4444',
      'PARCIALMENTE_DEFERIDO': '#d97706'
    };
    return colorMap[status] || '#6b7280';
  }

  /**
   * Obter cor do tipo
   */
  getTipoColor(tipo) {
    const colorMap = {
      'MULTA': '#ef4444',
      'AUTO_INFRACAO': '#f59e0b',
      'DECISAO_ADMINISTRATIVA': '#3b82f6',
      'OUTROS': '#6b7280'
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
   * Formatar valor monetário
   */
  formatarValor(valor) {
    if (!valor) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Formatar número do recurso
   */
  formatarNumeroRecurso(numero) {
    if (!numero) return '';
    
    // Padrão: REC-AAAA-NNNNNNN (REC-Ano-Sequencial)
    const str = numero.toString().replace(/[^\d]/g, '');
    if (str.length >= 7) {
      const ano = str.substring(0, 4);
      const sequencial = str.substring(4);
      return `REC-${ano}-${sequencial.padStart(7, '0')}`;
    }
    return numero;
  }

  /**
   * Calcular dias desde a abertura
   */
  calcularDiasRecurso(dataAbertura) {
    if (!dataAbertura) return 0;
    const abertura = new Date(dataAbertura);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - abertura);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Verificar se recurso está em atraso
   */
  verificarAtraso(dataAbertura, prazoDias) {
    if (!dataAbertura || !prazoDias) return false;
    const diasRecurso = this.calcularDiasRecurso(dataAbertura);
    return diasRecurso > prazoDias;
  }

  /**
   * Calcular prazo restante
   */
  calcularPrazoRestante(dataAbertura, prazoDias) {
    if (!dataAbertura || !prazoDias) return 0;
    const diasDecorridos = this.calcularDiasRecurso(dataAbertura);
    return Math.max(0, prazoDias - diasDecorridos);
  }

  /**
   * Formatar prazo com cores
   */
  formatarPrazo(prazoRestante) {
    if (prazoRestante <= 0) {
      return { label: 'Em atraso', color: 'red', icon: '🚨' };
    } else if (prazoRestante <= 5) {
      return { label: `${prazoRestante} dias`, color: 'orange', icon: '⚠️' };
    } else if (prazoRestante <= 15) {
      return { label: `${prazoRestante} dias`, color: 'yellow', icon: '⏰' };
    } else {
      return { label: `${prazoRestante} dias`, color: 'green', icon: '✅' };
    }
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

  /**
   * Listar advogados disponíveis
   */
  async listarAdvogados() {
    try {
      const response = await api.get('/api/advogados/');
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Erro ao listar advogados:', error);
      return [];
    }
  }
}

export default new RecursosDefesasService();

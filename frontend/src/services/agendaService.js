import api from './api';

class AgendaService {
  // =========================================================================
  // === CONSULTAS E LISTAGENS ===
  // =========================================================================

  /**
   * Obter estatísticas gerais da agenda
   */
  async obterEstatisticas() {
    try {
      const response = await api.get('/agenda/dashboard/');
      return response.data.stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas da agenda:', error);
      throw error;
    }
  }

  /**
   * Listar eventos da agenda com filtros
   */
  async listarEventos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.fiscal) params.append('fiscal', filtros.fiscal);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.prioridade) params.append('prioridade', filtros.prioridade);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/agenda/eventos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      throw error;
    }
  }

  /**
   * Obter evento específico por ID
   */
  async obterEvento(id) {
    try {
      const response = await api.get(`/agenda/eventos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter evento:', error);
      throw error;
    }
  }

  /**
   * Obter eventos recentes
   */
  async obterEventosRecentes() {
    try {
      const response = await api.get('/agenda/eventos-recentes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter eventos recentes:', error);
      throw error;
    }
  }

  /**
   * Obter eventos próximos
   */
  async obterEventosProximos() {
    try {
      const response = await api.get('/agenda/eventos-proximos/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter eventos próximos:', error);
      throw error;
    }
  }

  /**
   * Filtrar eventos com parâmetros específicos
   */
  async filtrarEventos(filtros) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/agenda/filtrar/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao filtrar eventos:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CRUD DE EVENTOS ===
  // =========================================================================

  /**
   * Criar novo evento
   */
  async criarEvento(dados) {
    try {
      const response = await api.post('/agenda/eventos/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  /**
   * Atualizar evento
   */
  async atualizarEvento(id, dados) {
    try {
      const response = await api.put(`/agenda/eventos/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  /**
   * Excluir evento
   */
  async excluirEvento(id) {
    try {
      await api.delete(`/agenda/eventos/${id}/`);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      throw error;
    }
  }

  // =========================================================================
  // === FISCAIS ===
  // =========================================================================

  /**
   * Listar fiscais
   */
  async listarFiscais() {
    try {
      const response = await api.get('/agenda/fiscais/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar fiscais:', error);
      throw error;
    }
  }

  /**
   * Obter fiscal por ID
   */
  async obterFiscal(id) {
    try {
      const response = await api.get(`/agenda/fiscais/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter fiscal:', error);
      throw error;
    }
  }

  /**
   * Criar novo fiscal
   */
  async criarFiscal(dados) {
    try {
      const response = await api.post('/agenda/fiscais/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar fiscal:', error);
      throw error;
    }
  }

  /**
   * Atualizar fiscal
   */
  async atualizarFiscal(id, dados) {
    try {
      const response = await api.put(`/agenda/fiscais/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar fiscal:', error);
      throw error;
    }
  }

  /**
   * Excluir fiscal
   */
  async excluirFiscal(id) {
    try {
      await api.delete(`/agenda/fiscais/${id}/`);
    } catch (error) {
      console.error('Erro ao excluir fiscal:', error);
      throw error;
    }
  }

  // =========================================================================
  // === TIPOS DE EVENTO ===
  // =========================================================================

  /**
   * Listar tipos de evento
   */
  async listarTiposEvento() {
    try {
      const response = await api.get('/agenda/tipos-evento/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tipos de evento:', error);
      throw error;
    }
  }

  /**
   * Obter tipo de evento por ID
   */
  async obterTipoEvento(id) {
    try {
      const response = await api.get(`/agenda/tipos-evento/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter tipo de evento:', error);
      throw error;
    }
  }

  /**
   * Criar novo tipo de evento
   */
  async criarTipoEvento(dados) {
    try {
      const response = await api.post('/agenda/tipos-evento/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar tipo de evento:', error);
      throw error;
    }
  }

  /**
   * Atualizar tipo de evento
   */
  async atualizarTipoEvento(id, dados) {
    try {
      const response = await api.put(`/agenda/tipos-evento/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar tipo de evento:', error);
      throw error;
    }
  }

  /**
   * Excluir tipo de evento
   */
  async excluirTipoEvento(id) {
    try {
      await api.delete(`/agenda/tipos-evento/${id}/`);
    } catch (error) {
      console.error('Erro ao excluir tipo de evento:', error);
      throw error;
    }
  }

  // =========================================================================
  // === PARTICIPAÇÃO EM EVENTOS ===
  // =========================================================================

  /**
   * Adicionar participante a evento
   */
  async adicionarParticipante(eventoId, fiscalId, dados = {}) {
    try {
      const response = await api.post(`/agenda/eventos/${eventoId}/participantes/`, {
        fiscal: fiscalId,
        ...dados
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      throw error;
    }
  }

  /**
   * Remover participante de evento
   */
  async removerParticipante(eventoId, participacaoId) {
    try {
      await api.delete(`/agenda/eventos/${eventoId}/participantes/${participacaoId}/`);
    } catch (error) {
      console.error('Erro ao remover participante:', error);
      throw error;
    }
  }

  /**
   * Listar participantes de evento
   */
  async listarParticipantes(eventoId) {
    try {
      const response = await api.get(`/agenda/eventos/${eventoId}/participantes/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar participantes:', error);
      throw error;
    }
  }

  // =========================================================================
  // === LEMBRETES ===
  // =========================================================================

  /**
   * Enviar lembretes para evento
   */
  async enviarLembretes(eventoId) {
    try {
      const response = await api.post(`/agenda/eventos/${eventoId}/lembretes/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar lembretes:', error);
      throw error;
    }
  }

  /**
   * Configurar lembretes para evento
   */
  async configurarLembretes(eventoId, dados) {
    try {
      const response = await api.put(`/agenda/eventos/${eventoId}/lembretes/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao configurar lembretes:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONFLITOS DE HORÁRIO ===
  // =========================================================================

  /**
   * Verificar conflitos de horário
   */
  async verificarConflitos(dados) {
    try {
      const response = await api.post('/agenda/verificar-conflitos/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      throw error;
    }
  }

  /**
   * Obter eventos conflitantes
   */
  async obterEventosConflitantes(eventoId) {
    try {
      const response = await api.get(`/agenda/eventos/${eventoId}/conflitos/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter eventos conflitantes:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS ===
  // =========================================================================

  /**
   * Gerar relatório de agenda
   */
  async gerarRelatorio(dados) {
    try {
      const response = await api.post('/agenda/relatorios/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Exportar eventos
   */
  async exportarEventos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/agenda/exportar/?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `agenda_eventos_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar eventos:', error);
      throw error;
    }
  }

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  /**
   * Validar dados de evento
   */
  validarDadosEvento(dados) {
    const erros = [];

    if (!dados.titulo) {
      erros.push('Título é obrigatório');
    }

    if (!dados.data_inicio) {
      erros.push('Data de início é obrigatória');
    }

    if (!dados.data_fim) {
      erros.push('Data de fim é obrigatória');
    }

    if (dados.data_inicio && dados.data_fim) {
      const inicio = new Date(dados.data_inicio);
      const fim = new Date(dados.data_fim);
      
      if (inicio >= fim) {
        erros.push('Data de fim deve ser posterior à data de início');
      }
    }

    if (!dados.fiscal_responsavel) {
      erros.push('Fiscal responsável é obrigatório');
    }

    return erros;
  }

  /**
   * Formatar status do evento
   */
  formatarStatus(status) {
    const statusMap = {
      'agendado': 'Agendado',
      'confirmado': 'Confirmado',
      'em_andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado',
      'adiado': 'Adiado'
    };
    return statusMap[status] || status;
  }

  /**
   * Formatar prioridade
   */
  formatarPrioridade(prioridade) {
    const prioridadeMap = {
      'baixa': 'Baixa',
      'normal': 'Normal',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return prioridadeMap[prioridade] || prioridade;
  }

  /**
   * Formatar data/hora
   */
  formatarDataHora(data) {
    return new Date(data).toLocaleString('pt-BR');
  }

  /**
   * Formatar duração
   */
  formatarDuracao(inicio, fim) {
    const duracao = new Date(fim) - new Date(inicio);
    const horas = Math.floor(duracao / (1000 * 60 * 60));
    const minutos = Math.floor((duracao % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    return `${minutos}min`;
  }

  /**
   * Verificar se evento é hoje
   */
  isEventoHoje(data) {
    const hoje = new Date().toDateString();
    const dataEvento = new Date(data).toDateString();
    return hoje === dataEvento;
  }

  /**
   * Verificar se evento é esta semana
   */
  isEventoEstaSemana(data) {
    const hoje = new Date();
    const dataEvento = new Date(data);
    const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
    const fimSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + 6));
    
    return dataEvento >= inicioSemana && dataEvento <= fimSemana;
  }

  /**
   * Obter cor do status
   */
  getStatusColor(status) {
    const cores = {
      'agendado': '#3b82f6',
      'confirmado': '#059669',
      'em_andamento': '#d97706',
      'concluido': '#6b7280',
      'cancelado': '#dc2626',
      'adiado': '#ea580c'
    };
    return cores[status] || '#6b7280';
  }

  /**
   * Obter cor da prioridade
   */
  getPrioridadeColor(prioridade) {
    const cores = {
      'baixa': '#059669',
      'normal': '#3b82f6',
      'alta': '#d97706',
      'urgente': '#dc2626'
    };
    return cores[prioridade] || '#6b7280';
  }
}

export default new AgendaService();

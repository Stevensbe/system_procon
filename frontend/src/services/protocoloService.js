import api from './api';

class ProtocoloService {
  // =========================================================================
  // === CONSULTAS E LISTAGENS ===
  // =========================================================================

  /**
   * Obter estatísticas gerais de protocolo
   */
  async obterEstatisticas() {
    try {
      const response = await api.get('/protocolo/estatisticas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de protocolo:', error);
      throw error;
    }
  }

  /**
   * Listar protocolos com filtros e paginação
   */
  async listarProtocolos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/protocolo/protocolos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar protocolos:', error);
      throw error;
    }
  }

  /**
   * Listar protocolos pendentes
   */
  async listarProtocolosPendentes() {
    try {
      const response = await api.get('/protocolo/protocolos/pendentes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar protocolos pendentes:', error);
      throw error;
    }
  }

  /**
   * Listar protocolos recentes
   */
  async listarProtocolosRecentes(limite = 10) {
    try {
      const response = await api.get(`/protocolo/protocolos/recentes/?limite=${limite}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar protocolos recentes:', error);
      throw error;
    }
  }

  /**
   * Listar protocolos por tipo
   */
  async listarProtocolosPorTipo(tipo) {
    try {
      const response = await api.get(`/protocolo/protocolos/?tipo=${tipo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar protocolos por tipo:', error);
      throw error;
    }
  }

  /**
   * Listar protocolos por status
   */
  async listarProtocolosPorStatus(status) {
    try {
      const response = await api.get(`/protocolo/protocolos/?status=${status}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar protocolos por status:', error);
      throw error;
    }
  }

  /**
   * Listar protocolos atrasados
   */
  async listarProtocolosAtrasados() {
    try {
      const response = await api.get('/protocolo/protocolos/atrasados/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar protocolos atrasados:', error);
      throw error;
    }
  }

  // =========================================================================
  // === DETALHES E CONSULTAS ESPECÍFICAS ===
  // =========================================================================

  /**
   * Obter detalhes de um protocolo específico
   */
  async obterProtocolo(id) {
    try {
      const response = await api.get(`/protocolo/protocolos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter protocolo:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de um protocolo
   */
  async obterHistoricoProtocolo(id) {
    try {
      const response = await api.get(`/protocolo/protocolos/${id}/historico/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico do protocolo:', error);
      throw error;
    }
  }

  /**
   * Obter documentos de um protocolo
   */
  async obterDocumentosProtocolo(id) {
    try {
      const response = await api.get(`/protocolo/protocolos/${id}/documentos/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter documentos do protocolo:', error);
      throw error;
    }
  }

  /**
   * Obter tramitações de um protocolo
   */
  async obterTramitacoesProtocolo(id) {
    try {
      const response = await api.get(`/protocolo/protocolos/${id}/tramitacoes/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter tramitações do protocolo:', error);
      throw error;
    }
  }

  /**
   * Buscar protocolo por número
   */
  async buscarPorNumero(numero) {
    try {
      const response = await api.get(`/protocolo/protocolos/buscar/?numero=${numero}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar protocolo por número:', error);
      throw error;
    }
  }

  /**
   * Buscar protocolo por interessado
   */
  async buscarPorInteressado(interessado) {
    try {
      const response = await api.get(`/protocolo/protocolos/buscar/?interessado=${interessado}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar protocolo por interessado:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CRIAÇÃO E EDIÇÃO ===
  // =========================================================================

  /**
   * Criar novo protocolo
   */
  async criarProtocolo(dados) {
    try {
      const response = await api.post('/protocolo/protocolos/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar protocolo:', error);
      throw error;
    }
  }

  /**
   * Atualizar protocolo existente
   */
  async atualizarProtocolo(id, dados) {
    try {
      const response = await api.put(`/protocolo/protocolos/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar protocolo:', error);
      throw error;
    }
  }

  /**
   * Atualizar parcialmente protocolo
   */
  async atualizarProtocoloParcial(id, dados) {
    try {
      const response = await api.patch(`/protocolo/protocolos/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar protocolo parcialmente:', error);
      throw error;
    }
  }

  /**
   * Excluir protocolo
   */
  async excluirProtocolo(id) {
    try {
      const response = await api.delete(`/protocolo/protocolos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir protocolo:', error);
      throw error;
    }
  }

  // =========================================================================
  // === AÇÕES ESPECÍFICAS ===
  // =========================================================================

  /**
   * Tramitar protocolo
   */
  async tramitarProtocolo(id, dados) {
    try {
      const response = await api.post(`/protocolo/protocolos/${id}/tramitar/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao tramitar protocolo:', error);
      throw error;
    }
  }

  /**
   * Concluir protocolo
   */
  async concluirProtocolo(id, dados = {}) {
    try {
      const response = await api.post(`/protocolo/protocolos/${id}/concluir/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao concluir protocolo:', error);
      throw error;
    }
  }

  /**
   * Arquivar protocolo
   */
  async arquivarProtocolo(id, motivo) {
    try {
      const response = await api.post(`/protocolo/protocolos/${id}/arquivar/`, { motivo });
      return response.data;
    } catch (error) {
      console.error('Erro ao arquivar protocolo:', error);
      throw error;
    }
  }

  /**
   * Reativar protocolo
   */
  async reativarProtocolo(id) {
    try {
      const response = await api.post(`/protocolo/protocolos/${id}/reativar/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao reativar protocolo:', error);
      throw error;
    }
  }

  /**
   * Marcar como urgente
   */
  async marcarUrgente(id) {
    try {
      const response = await api.post(`/protocolo/protocolos/${id}/urgente/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar como urgente:', error);
      throw error;
    }
  }

  /**
   * Definir prazo para protocolo
   */
  async definirPrazo(id, prazo) {
    try {
      const response = await api.post(`/protocolo/protocolos/${id}/prazo/`, { prazo });
      return response.data;
    } catch (error) {
      console.error('Erro ao definir prazo:', error);
      throw error;
    }
  }

  // =========================================================================
  // === DOCUMENTOS ===
  // =========================================================================

  /**
   * Upload de documento para protocolo
   */
  async uploadDocumento(protocoloId, arquivo, descricao = '') {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('descricao', descricao);

      const response = await api.post(`/protocolo/protocolos/${protocoloId}/documentos/`, formData, {
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
   * Remover documento de protocolo
   */
  async removerDocumento(protocoloId, documentoId) {
    try {
      const response = await api.delete(`/protocolo/protocolos/${protocoloId}/documentos/${documentoId}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      throw error;
    }
  }

  /**
   * Download de documento
   */
  async downloadDocumento(protocoloId, documentoId) {
    try {
      const response = await api.get(`/protocolo/protocolos/${protocoloId}/documentos/${documentoId}/download/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer download do documento:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS E ESTATÍSTICAS ===
  // =========================================================================

  /**
   * Gerar relatório de protocolos
   */
  async gerarRelatorio(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await api.get(`/protocolo/relatorio/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de protocolos:', error);
      throw error;
    }
  }

  /**
   * Exportar protocolos
   */
  async exportarProtocolos(filtros = {}, formato = 'xlsx') {
    try {
      const params = new URLSearchParams({ ...filtros, formato });
      const response = await api.get(`/protocolo/exportar/?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar protocolos:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas por período
   */
  async obterEstatisticasPorPeriodo(dataInicio, dataFim) {
    try {
      const response = await api.get('/protocolo/estatisticas/periodo/', {
        params: { data_inicio: dataInicio, data_fim: dataFim }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas por período:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas por tipo
   */
  async obterEstatisticasPorTipo() {
    try {
      const response = await api.get('/protocolo/estatisticas/tipo/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas por tipo:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas por status
   */
  async obterEstatisticasPorStatus() {
    try {
      const response = await api.get('/protocolo/estatisticas/status/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas por status:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONFIGURAÇÕES E DADOS AUXILIARES ===
  // =========================================================================

  /**
   * Listar tipos de protocolo
   */
  async listarTipos() {
    try {
      const response = await api.get('/protocolo/tipos/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tipos de protocolo:', error);
      throw error;
    }
  }

  /**
   * Listar status de protocolo
   */
  async listarStatus() {
    try {
      const response = await api.get('/protocolo/status/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar status de protocolo:', error);
      throw error;
    }
  }

  /**
   * Listar responsáveis
   */
  async listarResponsaveis() {
    try {
      const response = await api.get('/protocolo/responsaveis/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar responsáveis:', error);
      throw error;
    }
  }

  /**
   * Obter configurações de protocolo
   */
  async obterConfiguracoes() {
    try {
      const response = await api.get('/protocolo/configuracoes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações de protocolo:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações de protocolo
   */
  async atualizarConfiguracoes(configuracoes) {
    try {
      const response = await api.put('/protocolo/configuracoes/', configuracoes);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configurações de protocolo:', error);
      throw error;
    }
  }

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  /**
   * Gerar número de protocolo
   */
  async gerarNumeroProtocolo() {
    try {
      const response = await api.get('/protocolo/gerar-numero/');
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar número de protocolo:', error);
      throw error;
    }
  }

  /**
   * Validar dados de protocolo
   */
  validarProtocolo(dados) {
    const erros = [];

    if (!dados.interessado) {
      erros.push('Interessado é obrigatório');
    }

    if (!dados.assunto) {
      erros.push('Assunto é obrigatório');
    }

    if (!dados.tipo) {
      erros.push('Tipo é obrigatório');
    }

    if (!dados.responsavel) {
      erros.push('Responsável é obrigatório');
    }

    return erros;
  }

  /**
   * Formatar número de protocolo
   */
  formatarNumeroProtocolo(numero) {
    if (!numero) return 'N/A';
    return numero.toString().padStart(8, '0');
  }

  /**
   * Formatar status de protocolo
   */
  formatarStatus(status) {
    const statusMap = {
      'PENDENTE': { label: 'Pendente', color: 'yellow' },
      'EM_ANALISE': { label: 'Em Análise', color: 'blue' },
      'TRAMITADO': { label: 'Tramitado', color: 'green' },
      'CONCLUIDO': { label: 'Concluído', color: 'green' },
      'ARQUIVADO': { label: 'Arquivado', color: 'gray' },
      'CANCELADO': { label: 'Cancelado', color: 'red' }
    };

    return statusMap[status] || { label: status, color: 'gray' };
  }

  /**
   * Calcular dias de atraso
   */
  calcularDiasAtraso(dataLimite) {
    if (!dataLimite) return 0;
    const hoje = new Date();
    const limite = new Date(dataLimite);
    const diffTime = hoje - limite;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Verificar se protocolo está atrasado
   */
  verificarAtraso(protocolo) {
    if (!protocolo.prazo_limite) return false;
    return this.calcularDiasAtraso(protocolo.prazo_limite) > 0;
  }
}

export default new ProtocoloService();

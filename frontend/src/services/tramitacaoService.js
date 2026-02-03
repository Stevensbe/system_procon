import api from './api';

class TramitacaoService {
  constructor() {
    this.baseURL = 'protocolo-tramitacao/';
  }

  async obterEstatisticas() {
    try {
      const response = await api.get(`${this.baseURL}estatisticas/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatisticas de tramitacao:', error);
      return {
        total_protocolos: 0,
        protocolos_hoje: 0,
        protocolos_vencidos: 0,
        protocolos_prox_vencimento: 0,
        tramitacoes_pendentes: 0
      };
    }
  }

  async listarProtocolos(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}protocolos/`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar protocolos:', error);
      return { results: [], count: 0 };
    }
  }

  async listarSetores() {
    try {
      const response = await api.get(`${this.baseURL}setores/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar setores:', error);
      return { results: [], count: 0 };
    }
  }

  async listarTramitacoes(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}tramitacoes/`, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tramitacoes:', error);
      return { results: [], count: 0 };
    }
  }

  async listarPendentes() {
    try {
      const response = await api.get(`${this.baseURL}tramitacoes-pendentes/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tramitacoes pendentes:', error);
      return [];
    }
  }

  async tramitarProtocolo(protocoloId, payload) {
    try {
      const response = await api.post(`${this.baseURL}protocolos/${protocoloId}/tramitar/`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao tramitar protocolo:', error);
      throw error;
    }
  }

  async receberTramitacao(tramitacaoId, observacoes = '') {
    try {
      const response = await api.post(`${this.baseURL}tramitacoes/${tramitacaoId}/receber/`, {
        observacoes
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao receber tramitacao:', error);
      throw error;
    }
  }

  formatarDataHora(valor) {
    if (!valor) return 'N/A';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return valor;
    return data.toLocaleString('pt-BR');
  }
}

export default new TramitacaoService();

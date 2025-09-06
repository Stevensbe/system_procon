import api from './api';

// URLs base para as diferentes entidades
const MULTAS_URL = 'multas/multas';
const BASE_URL = 'multas';

export const multasService = {
  // Multas
  async getMultas(params = {}) {
    const response = await api.get(`${MULTAS_URL}/`, { params });
    return response.data;
  },

  async getMulta(id) {
    const response = await api.get(`${MULTAS_URL}/${id}/`);
    return response.data;
  },

  async createMulta(data) {
    const response = await api.post(`${MULTAS_URL}/`, data);
    return response.data;
  },

  async updateMulta(id, data) {
    const response = await api.put(`${MULTAS_URL}/${id}/`, data);
    return response.data;
  },

  async deleteMulta(id) {
    const response = await api.delete(`${MULTAS_URL}/${id}/`);
    return response.data;
  },

  async marcarComoPaga(id, comprovante = null, observacao = '') {
    const formData = new FormData();
    if (comprovante) {
      formData.append('comprovante', comprovante);
    }
    if (observacao) {
      formData.append('observacao', observacao);
    }
    const response = await api.post(`${MULTAS_URL}/${id}/marcar_como_paga/`, formData);
    return response.data;
  },

  async cancelarMulta(id, motivo = '') {
    const response = await api.post(`${MULTAS_URL}/${id}/cancelar/`, { motivo });
    return response.data;
  },

  async alterarStatus(id, status, observacao = '') {
    const response = await api.post(`${MULTAS_URL}/${id}/alterar_status/`, { 
      status, 
      observacao 
    });
    return response.data;
  },

  async atualizarStatusVencimento() {
    const response = await api.post(`${MULTAS_URL}/atualizar_status_vencimento/`);
    return response.data;
  },

  async getEstatisticas() {
    const response = await api.get(`${MULTAS_URL}/estatisticas/`);
    return response.data;
  },

  async getEstatisticasTeste() {
    const response = await api.get(`${MULTAS_URL}/estatisticas_simples/`);
    return response.data;
  },

  async getMultasVencidas() {
    const response = await api.get(`${MULTAS_URL}/vencidas/`);
    return response.data;
  },

  // Empresas
  async getEmpresas(params = {}) {
    const response = await api.get(`${BASE_URL}/empresas/`, { params });
    return response.data;
  },

  async getEmpresa(id) {
    const response = await api.get(`${BASE_URL}/empresas/${id}/`);
    return response.data;
  },

  async createEmpresa(data) {
    const response = await api.post(`${BASE_URL}/empresas/`, data);
    return response.data;
  },

  async updateEmpresa(id, data) {
    const response = await api.put(`${BASE_URL}/empresas/${id}/`, data);
    return response.data;
  },

  async deleteEmpresa(id) {
    const response = await api.delete(`${BASE_URL}/empresas/${id}/`);
    return response.data;
  },

  // Cobranças
  async getCobrancas(params = {}) {
    const response = await api.get(`${BASE_URL}/cobrancas/`, { params });
    return response.data;
  },

  async getCobranca(id) {
    const response = await api.get(`${BASE_URL}/cobrancas/${id}/`);
    return response.data;
  },

  async createCobranca(data) {
    const response = await api.post(`${BASE_URL}/cobrancas/`, data);
    return response.data;
  },

  async updateCobranca(id, data) {
    const response = await api.put(`${BASE_URL}/cobrancas/${id}/`, data);
    return response.data;
  },

  async deleteCobranca(id) {
    const response = await api.delete(`${BASE_URL}/cobrancas/${id}/`);
    return response.data;
  },

  // Petições
  async getPeticoes(params = {}) {
    const response = await api.get(`${BASE_URL}/peticoes/`, { params });
    return response.data;
  },

  async createPeticao(data) {
    const response = await api.post(`${BASE_URL}/peticoes/`, data);
    return response.data;
  },

  async updatePeticao(id, data) {
    const response = await api.put(`${BASE_URL}/peticoes/${id}/`, data);
    return response.data;
  },

  async deletePeticao(id) {
    const response = await api.delete(`${BASE_URL}/peticoes/${id}/`);
    return response.data;
  },

  // Recursos
  async getRecursos(params = {}) {
    const response = await api.get(`${BASE_URL}/recursos/`, { params });
    return response.data;
  },

  async createRecurso(data) {
    const response = await api.post(`${BASE_URL}/recursos/`, data);
    return response.data;
  },

  async updateRecurso(id, data) {
    const response = await api.put(`${BASE_URL}/recursos/${id}/`, data);
    return response.data;
  },

  async deleteRecurso(id) {
    const response = await api.delete(`${BASE_URL}/recursos/${id}/`);
    return response.data;
  },

  // Análises
  async getAnalises(params = {}) {
    const response = await api.get(`${BASE_URL}/analises/`, { params });
    return response.data;
  },

  async createAnalise(data) {
    const response = await api.post(`${BASE_URL}/analises/`, data);
    return response.data;
  },

  async updateAnalise(id, data) {
    const response = await api.put(`${BASE_URL}/analises/${id}/`, data);
    return response.data;
  },

  async deleteAnalise(id) {
    const response = await api.delete(`${BASE_URL}/analises/${id}/`);
    return response.data;
  },
};
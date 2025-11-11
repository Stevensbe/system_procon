import api from './api';

const BASE_URL = '/triagem/triagens/';

const triagemService = {
  async listarTriagens(params = {}) {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  async obterTriagem(id) {
    const response = await api.get(`${BASE_URL}${id}/`);
    return response.data;
  },

  async criarTriagem(data) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    const response = await api.post(BASE_URL, data, config);
    return response.data;
  },

  async atualizarTriagem(id, data) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    const response = await api.patch(`${BASE_URL}${id}/`, data, config);
    return response.data;
  },
};

export default triagemService;

import api from './api';

const API_URL = '/ppa';

const ppaService = {
  // ========== PPAs ==========
  
  // Lista todos os PPAs
  listarPPAs: async (params = {}) => {
    const response = await api.get(`${API_URL}/ppas/`, { params });
    return response.data;
  },

  // Detalhes de um PPA
  detalhesPPA: async (id) => {
    const response = await api.get(`${API_URL}/ppas/${id}/`);
    return response.data;
  },

  // Criar PPA
  criarPPA: async (data) => {
    const response = await api.post(`${API_URL}/ppas/`, data);
    return response.data;
  },

  // Atualizar PPA
  atualizarPPA: async (id, data) => {
    const response = await api.patch(`${API_URL}/ppas/${id}/`, data);
    return response.data;
  },

  // Deletar PPA
  deletarPPA: async (id) => {
    const response = await api.delete(`${API_URL}/ppas/${id}/`);
    return response.data;
  },

  // Estatísticas
  estatisticas: async () => {
    const response = await api.get(`${API_URL}/ppas/estatisticas/`);
    return response.data;
  },

  // PPAs pendentes
  ppasPendentes: async () => {
    const response = await api.get(`${API_URL}/ppas/pendentes/`);
    return response.data;
  },

  // Meus PPAs
  meusPPAs: async () => {
    const response = await api.get(`${API_URL}/ppas/`, { params: { meus: true } });
    return response.data;
  },

  // PPAs vencidos
  ppasVencidos: async () => {
    const response = await api.get(`${API_URL}/ppas/`, { params: { vencidos: true } });
    return response.data;
  },

  // ========== Ações do PPA ==========

  // Adicionar movimentação
  adicionarMovimentacao: async (id, data) => {
    const response = await api.post(
      `${API_URL}/ppas/${id}/adicionar_movimentacao/`,
      data
    );
    return response.data;
  },

  // Adicionar anexo
  adicionarAnexo: async (id, formData) => {
    const response = await api.post(
      `${API_URL}/ppas/${id}/adicionar_anexo/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Adicionar parecer
  adicionarParecer: async (id, data) => {
    const response = await api.post(
      `${API_URL}/ppas/${id}/adicionar_parecer/`,
      data
    );
    return response.data;
  },

  // Concluir PPA
  concluirPPA: async (id, data) => {
    const response = await api.post(
      `${API_URL}/ppas/${id}/concluir/`,
      data
    );
    return response.data;
  },

  // Arquivar PPA
  arquivarPPA: async (id, motivo) => {
    const response = await api.post(
      `${API_URL}/ppas/${id}/arquivar/`,
      { motivo }
    );
    return response.data;
  },

  // ========== Movimentações ==========

  listarMovimentacoes: async (ppaId) => {
    const response = await api.get(`${API_URL}/movimentacoes/`, {
      params: { ppa: ppaId }
    });
    return response.data;
  },

  criarMovimentacao: async (data) => {
    const response = await api.post(`${API_URL}/movimentacoes/`, data);
    return response.data;
  },

  // ========== Anexos ==========

  listarAnexos: async (ppaId) => {
    const response = await api.get(`${API_URL}/anexos/`, {
      params: { ppa: ppaId }
    });
    return response.data;
  },

  criarAnexo: async (formData) => {
    const response = await api.post(`${API_URL}/anexos/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deletarAnexo: async (id) => {
    const response = await api.delete(`${API_URL}/anexos/${id}/`);
    return response.data;
  },

  // ========== Pareceres ==========

  listarPareceres: async (ppaId) => {
    const response = await api.get(`${API_URL}/pareceres/`, {
      params: { ppa: ppaId }
    });
    return response.data;
  },

  criarParecer: async (data) => {
    const response = await api.post(`${API_URL}/pareceres/`, data);
    return response.data;
  },

  aprovarParecer: async (id) => {
    const response = await api.post(
      `${API_URL}/pareceres/${id}/aprovar/`,
      {}
    );
    return response.data;
  },

  // ========== INTEGRAÇÕES COM AC E AI ==========

  // Criar PPA a partir de AC
  criarPPAdeAC: async (acId, dadosAdicionais = {}) => {
    const response = await api.post(
      `${API_URL}/ppas/criar_de_ac/`,
      {
        ac_id: acId,
        dados_adicionais: dadosAdicionais
      }
    );
    return response.data;
  },

  // Vincular AC ao PPA
  vincularAC: async (ppaId, acId) => {
    const response = await api.post(
      `${API_URL}/ppas/${ppaId}/vincular_ac/`,
      { ac_id: acId }
    );
    return response.data;
  },

  // Criar AI a partir do PPA
  criarAI: async (ppaId, dadosAI) => {
    const response = await api.post(
      `${API_URL}/ppas/${ppaId}/criar_ai/`,
      dadosAI
    );
    return response.data;
  },

  // Vincular AI ao PPA
  vincularAI: async (ppaId, aiId) => {
    const response = await api.post(
      `${API_URL}/ppas/${ppaId}/vincular_ai/`,
      { ai_id: aiId }
    );
    return response.data;
  }
};

export default ppaService;

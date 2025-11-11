import api from './api';

class AtendimentoService {
  async registrarPresencial(dados) {
    const formData = new FormData();
    const anexos = dados?.anexos || [];
    const payload = {
      ...dados,
      tipo_atendimento: dados?.tipo_atendimento || 'RECLAMACAO',
      canal_atendimento: dados?.canal_atendimento || 'BALCAO',
      consentimento_origem: dados?.consentimento_origem || 'GUICHE',
    };

    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'anexos') {
        return;
      }
      if (value === undefined || value === null) {
        return;
      }
      if (key === 'valor_envolvido' && value !== '') {
        const numericValue = String(value).replace(/\./g, '').replace(',', '.');
        formData.append(key, numericValue);
        return;
      }
      formData.append(key, value);
    });

    anexos.forEach((file, index) => {
      if (file) {
        formData.append(`anexo_${index}`, file);
      }
    });

    const response = await api.post('/atendimento/registros-presenciais/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async solicitarRemocaoDados(atendimentoId, observacoes = '') {
    const response = await api.post(
      `/atendimento/atendimentos/${atendimentoId}/remocao/solicitar/`,
      { observacoes }
    );
    return response.data;
  }

  async confirmarRemocaoDados(atendimentoId) {
    const response = await api.post(
      `/atendimento/atendimentos/${atendimentoId}/remocao/confirmar/`
    );
    return response.data;
  }

  async obterConfiguracao() {
    const { data } = await api.get('/atendimento/configuracoes/');
    return data;
  }

  async atualizarConfiguracao(payload = {}) {
    const { data } = await api.put('/atendimento/configuracoes/', payload);
    return data;
  }

  async listarRegrasDistribuicao() {
    const { data } = await api.get('/atendimento/distribuicao/regras/');
    return data;
  }

  async criarRegraDistribuicao(payload) {
    const { data } = await api.post('/atendimento/distribuicao/regras/', payload);
    return data;
  }

  async atualizarRegraDistribuicao(id, payload) {
    const { data } = await api.put(`/atendimento/distribuicao/regras/${id}/`, payload);
    return data;
  }

  async removerRegraDistribuicao(id) {
    await api.delete(`/atendimento/distribuicao/regras/${id}/`);
  }
}

export default new AtendimentoService();

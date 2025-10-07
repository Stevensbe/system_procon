import api from './api';

class AtendimentoService {
  async registrarPresencial(dados) {
    const formData = new FormData();
    const anexos = dados?.anexos || [];
    const payload = {
      ...dados,
      tipo_atendimento: dados?.tipo_atendimento || 'RECLAMACAO',
      canal_atendimento: dados?.canal_atendimento || 'BALCAO',
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
}

export default new AtendimentoService();

import api from './api';

const normalizeParams = (params = {}) => {
  const normalizados = {};
  Object.entries(params).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null) {
      return;
    }

    if (typeof valor === 'string' && valor.trim() === '') {
      return;
    }

    if (chave === 'setor') {
      normalizados['setor_destino'] = valor;
      return;
    }

    normalizados[chave] = valor;
  });
  return normalizados;
};

class CaixaEntradaService {
  // Buscar documentos da caixa pessoal
  async getDocumentosPessoal(filtros = {}) {
    try {
      const params = normalizeParams({
        ...filtros,
        destinatario_direto: filtros.destinatario_direto ?? 'me',
        apenas_pessoal: true
      });
      const response = await api.get('/caixa-entrada/api/documentos/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documentos da caixa pessoal:', error);
      throw error;
    }
  }

  // Buscar documentos da caixa setor
  async getDocumentosSetor(filtros = {}) {
    try {
      const response = await api.get('/caixa-entrada/api/documentos/', {
        params: normalizeParams(filtros)
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documentos da caixa setor:', error);
      throw error;
    }
  }

  // Buscar documentos notificados no DTE
  async getDocumentosNotificados(filtros = {}) {
    try {
      const response = await api.get('/caixa-entrada/api/documentos/', {
        params: normalizeParams(filtros)
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documentos notificados:', error);
      throw error;
    }
  }

  // Buscar estatísticas das caixas
  async getEstatisticas(filtros = {}) {
    try {
      const response = await api.get('/caixa-entrada/api/estatisticas/', {
        params: normalizeParams(filtros)
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Visualizar documento
  async visualizarDocumento(documentoId) {
    try {
      const response = await api.get(`/caixa-entrada/api/documentos/${documentoId}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      throw error;
    }
  }

  // Marcar documento como lido
  async marcarComoLido(documentoId) {
    try {
      const response = await api.post(`/caixa-entrada/api/documentos/${documentoId}/marcar_lido/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar documento como lido:', error);
      throw error;
    }
  }

  async listarDestinatarios(filtros = {}) {
    try {
      const response = await api.get('/caixa-entrada/api/destinatarios/', { params: normalizeParams(filtros) });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar destinatarios:', error);
      throw error;
    }
  }

  // Encaminhar documento
  async encaminharDocumento(documentoId, dados) {
    try {
      const response = await api.post(`/caixa-entrada/api/documentos/${documentoId}/encaminhar/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao encaminhar documento:', error);
      throw error;
    }
  }

  // Arquivar documento
  async arquivarDocumento(documentoId) {
    try {
      const response = await api.post(`/caixa-entrada/api/documentos/${documentoId}/arquivar/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao arquivar documento:', error);
      throw error;
    }
  }

  // Buscar histórico do documento
  async getHistoricoDocumento(documentoId) {
    try {
      const response = await api.get('/caixa-entrada/api/historico/', {
        params: { documento: documentoId }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico do documento:', error);
      throw error;
    }
  }

  // Buscar anexos do documento
  async getAnexosDocumento(documentoId) {
    try {
      const response = await api.get(`/caixa-entrada/documento/${documentoId}/anexos`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar anexos do documento:', error);
      throw error;
    }
  }

  // Fazer download de anexo
  async downloadAnexo(anexoId) {
    try {
      const response = await api.get(`/caixa-entrada/anexo/${anexoId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer download do anexo:', error);
      throw error;
    }
  }

  // Buscar configurações da caixa de entrada
  async getConfiguracoes() {
    try {
      const response = await api.get('/caixa-entrada/configuracoes');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw error;
    }
  }

  // Atualizar configurações da caixa de entrada
  async atualizarConfiguracoes(configuracoes) {
    try {
      const response = await api.put('/caixa-entrada/configuracoes', configuracoes);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  // Buscar permissões do usuário
  async getPermissoesUsuario() {
    try {
      const response = await api.get('/caixa-entrada/permissoes');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      throw error;
    }
  }

  // Buscar acessos especiais do usuário
  async getAcessosEspeciais() {
    try {
      const response = await api.get('/caixa-entrada/acessos-especiais');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar acessos especiais:', error);
      throw error;
    }
  }

  // Criar documento na caixa de entrada
  async criarDocumento(dados) {
    try {
      const response = await api.post('/caixa-entrada/criar-documento', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      throw error;
    }
  }

  // Consultar documento por protocolo
  async consultarDocumento(numeroProtocolo) {
    try {
      const response = await api.get(`/caixa-entrada/consultar-documento/${numeroProtocolo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar documento:', error);
      throw error;
    }
  }

  // Notificar documento no DTE
  async notificarDTE(documentoId) {
    try {
      const response = await api.post(`/caixa-entrada/documento/${documentoId}/notificar-dte`);
      return response.data;
    } catch (error) {
      console.error('Erro ao notificar documento no DTE:', error);
      throw error;
    }
  }

  // Buscar relatórios da caixa de entrada
  async getRelatorios(tipo, periodo) {
    try {
      const response = await api.get('/caixa-entrada/relatorios', {
        params: normalizeParams({ tipo, periodo })
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      throw error;
    }
  }

  // Exportar dados da caixa de entrada
  async exportarDados(filtros, formato = 'excel') {
    try {
      const response = await api.get('/caixa-entrada/exportar', {
        params: { ...normalizeParams(filtros), formato },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  }
}

export default new CaixaEntradaService();

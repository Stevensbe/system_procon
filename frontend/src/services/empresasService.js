import api from './api';

class EmpresasService {
  // =========================================================================
  // === EMPRESAS ===
  // =========================================================================

  async listarEmpresas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.situacao) params.append('situacao', filtros.situacao);
      if (filtros.porte) params.append('porte', filtros.porte);
      if (filtros.segmento) params.append('segmento', filtros.segmento);
      if (filtros.cidade) params.append('cidade', filtros.cidade);
      if (filtros.classificacao_risco) params.append('classificacao_risco', filtros.classificacao_risco);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/empresas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      throw error;
    }
  }

  async obterEmpresa(id) {
    try {
      const response = await api.get(`/empresas/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter empresa:', error);
      throw error;
    }
  }

  async criarEmpresa(dados) {
    try {
      const response = await api.post('/empresas/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      throw error;
    }
  }

  async atualizarEmpresa(id, dados) {
    try {
      const response = await api.put(`/empresas/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      throw error;
    }
  }

  async excluirEmpresa(id) {
    try {
      await api.delete(`/empresas/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RESPONSÁVEIS LEGAIS ===
  // =========================================================================

  async listarResponsaveis(empresaId) {
    try {
      const response = await api.get(`/empresas/${empresaId}/responsaveis/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar responsáveis:', error);
      throw error;
    }
  }

  async adicionarResponsavel(empresaId, dados) {
    try {
      const response = await api.post(`/empresas/${empresaId}/responsaveis/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar responsável:', error);
      throw error;
    }
  }

  async atualizarResponsavel(empresaId, responsavelId, dados) {
    try {
      const response = await api.put(`/empresas/${empresaId}/responsaveis/${responsavelId}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      throw error;
    }
  }

  async removerResponsavel(empresaId, responsavelId) {
    try {
      await api.delete(`/empresas/${empresaId}/responsaveis/${responsavelId}/`);
      return true;
    } catch (error) {
      console.error('Erro ao remover responsável:', error);
      throw error;
    }
  }

  // =========================================================================
  // === DOCUMENTOS ===
  // =========================================================================

  async listarDocumentos(empresaId) {
    try {
      const response = await api.get(`/empresas/${empresaId}/documentos/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  async uploadDocumento(empresaId, arquivo, tipo) {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('tipo', tipo);

      const response = await api.post(`/empresas/${empresaId}/documentos/`, formData, {
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

  async downloadDocumento(empresaId, documentoId) {
    try {
      const response = await api.get(`/empresas/${empresaId}/documentos/${documentoId}/download/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      throw error;
    }
  }

  async excluirDocumento(empresaId, documentoId) {
    try {
      await api.delete(`/empresas/${empresaId}/documentos/${documentoId}/`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      throw error;
    }
  }

  // =========================================================================
  // === HISTÓRICO ===
  // =========================================================================

  async obterHistorico(empresaId) {
    try {
      const response = await api.get(`/empresas/${empresaId}/historico/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      throw error;
    }
  }

  // =========================================================================
  // === ESTATÍSTICAS ===
  // =========================================================================

  async obterEstatisticas(empresaId) {
    try {
      const response = await api.get(`/empresas/${empresaId}/estatisticas/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONSULTAS PÚBLICAS ===
  // =========================================================================

  async consultarEmpresaPublica(cnpj) {
    try {
      const response = await api.get(`/consulta-publica/empresas/${cnpj}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar empresa pública:', error);
      throw error;
    }
  }

  async buscarEmpresasPublicas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.situacao) params.append('situacao', filtros.situacao);
      if (filtros.cidade) params.append('cidade', filtros.cidade);
      if (filtros.segmento) params.append('segmento', filtros.segmento);

      const response = await api.get(`/consulta-publica/empresas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empresas públicas:', error);
      throw error;
    }
  }

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  async obterPortes() {
    try {
      const response = await api.get('/empresas/portes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter portes:', error);
      throw error;
    }
  }

  async obterSegmentos() {
    try {
      const response = await api.get('/empresas/segmentos/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter segmentos:', error);
      throw error;
    }
  }

  async obterCidades() {
    try {
      const response = await api.get('/empresas/cidades/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter cidades:', error);
      throw error;
    }
  }

  async validarCNPJ(cnpj) {
    try {
      const response = await api.post('/empresas/validar-cnpj/', { cnpj });
      return response.data;
    } catch (error) {
      console.error('Erro ao validar CNPJ:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS ===
  // =========================================================================

  async gerarRelatorioEmpresas(filtros = {}) {
    try {
      const response = await api.post('/empresas/relatorio/', filtros);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de empresas:', error);
      throw error;
    }
  }

  async exportarEmpresas(formato = 'xlsx', filtros = {}) {
    try {
      const params = new URLSearchParams();
      params.append('formato', formato);
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) params.append(key, filtros[key]);
      });

      const response = await api.get(`/empresas/exportar/?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar empresas:', error);
      throw error;
    }
  }
}

export default new EmpresasService();

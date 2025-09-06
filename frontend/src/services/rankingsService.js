import api from './api';

class RankingsService {
  // =========================================================================
  // === CONSULTAS E LISTAGENS ===
  // =========================================================================

  /**
   * Obter estatísticas gerais de rankings
   */
  async obterEstatisticas() {
    try {
      const response = await api.get('/rankings/estatisticas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de rankings:', error);
      throw error;
    }
  }

  /**
   * Listar ranking de empresas
   */
  async listarRankingEmpresas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/rankings/empresas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar ranking de empresas:', error);
      throw error;
    }
  }

  /**
   * Listar ranking de fiscais
   */
  async listarRankingFiscais(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/rankings/fiscais/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar ranking de fiscais:', error);
      throw error;
    }
  }

  /**
   * Listar ranking de processos
   */
  async listarRankingProcessos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/rankings/processos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar ranking de processos:', error);
      throw error;
    }
  }

  /**
   * Listar ranking de multas
   */
  async listarRankingMultas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/rankings/multas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar ranking de multas:', error);
      throw error;
    }
  }

  /**
   * Listar ranking de autos
   */
  async listarRankingAutos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/rankings/autos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar ranking de autos:', error);
      throw error;
    }
  }

  /**
   * Listar ranking de petições
   */
  async listarRankingPeticoes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/rankings/peticoes/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar ranking de petições:', error);
      throw error;
    }
  }

  // =========================================================================
  // === DETALHES E CONSULTAS ESPECÍFICAS ===
  // =========================================================================

  /**
   * Obter detalhes de uma empresa no ranking
   */
  async obterDetalhesEmpresa(id) {
    try {
      const response = await api.get(`/rankings/empresas/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes da empresa:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de um fiscal no ranking
   */
  async obterDetalhesFiscal(id) {
    try {
      const response = await api.get(`/rankings/fiscais/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes do fiscal:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de uma empresa no ranking
   */
  async obterHistoricoEmpresa(id, periodo = '12meses') {
    try {
      const response = await api.get(`/rankings/empresas/${id}/historico/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico da empresa:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de um fiscal no ranking
   */
  async obterHistoricoFiscal(id, periodo = '12meses') {
    try {
      const response = await api.get(`/rankings/fiscais/${id}/historico/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico do fiscal:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS E ESTATÍSTICAS ===
  // =========================================================================

  /**
   * Gerar relatório de rankings
   */
  async gerarRelatorio(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await api.get(`/rankings/relatorio/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de rankings:', error);
      throw error;
    }
  }

  /**
   * Exportar rankings
   */
  async exportarRankings(filtros = {}, formato = 'xlsx') {
    try {
      const params = new URLSearchParams({ ...filtros, formato });
      const response = await api.get(`/rankings/exportar/?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar rankings:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas por período
   */
  async obterEstatisticasPorPeriodo(dataInicio, dataFim) {
    try {
      const response = await api.get('/rankings/estatisticas/periodo/', {
        params: { data_inicio: dataInicio, data_fim: dataFim }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas por período:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas por categoria
   */
  async obterEstatisticasPorCategoria() {
    try {
      const response = await api.get('/rankings/estatisticas/categoria/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas por categoria:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONFIGURAÇÕES E DADOS AUXILIARES ===
  // =========================================================================

  /**
   * Obter configurações de rankings
   */
  async obterConfiguracoes() {
    try {
      const response = await api.get('/rankings/configuracoes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações de rankings:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações de rankings
   */
  async atualizarConfiguracoes(configuracoes) {
    try {
      const response = await api.put('/rankings/configuracoes/', configuracoes);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configurações de rankings:', error);
      throw error;
    }
  }

  /**
   * Listar categorias disponíveis
   */
  async listarCategorias() {
    try {
      const response = await api.get('/rankings/categorias/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      throw error;
    }
  }

  /**
   * Listar períodos disponíveis
   */
  async listarPeriodos() {
    try {
      const response = await api.get('/rankings/periodos/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar períodos:', error);
      throw error;
    }
  }

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  /**
   * Calcular score de uma empresa
   */
  calcularScoreEmpresa(dados) {
    let score = 100;
    
    // Penalizar por multas
    if (dados.multas > 0) {
      score -= (dados.multas * 5);
    }
    
    // Penalizar por infrações
    if (dados.infracoes > 0) {
      score -= (dados.infracoes * 3);
    }
    
    // Bonificar por conformidade
    if (dados.fiscalizacoes > 0 && dados.multas === 0) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcular score de um fiscal
   */
  calcularScoreFiscal(dados) {
    let score = 100;
    
    // Bonificar por produtividade
    if (dados.fiscalizacoes > 0) {
      score += Math.min(20, dados.fiscalizacoes * 2);
    }
    
    // Bonificar por eficiência
    if (dados.autos > 0 && dados.fiscalizacoes > 0) {
      const eficiencia = (dados.autos / dados.fiscalizacoes) * 100;
      score += Math.min(15, eficiencia * 0.15);
    }
    
    // Penalizar por erros
    if (dados.erros > 0) {
      score -= (dados.erros * 5);
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Formatar posição no ranking
   */
  formatarPosicao(posicao) {
    if (posicao === 1) return '🥇 1º';
    if (posicao === 2) return '🥈 2º';
    if (posicao === 3) return '🥉 3º';
    return `${posicao}º`;
  }

  /**
   * Formatar score
   */
  formatarScore(score) {
    if (score >= 90) return { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { label: 'Bom', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 70) return { label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 60) return { label: 'Ruim', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Muito Ruim', color: 'text-red-600', bg: 'bg-red-100' };
  }

  /**
   * Validar filtros de ranking
   */
  validarFiltros(filtros) {
    const erros = [];

    if (filtros.data_inicio && filtros.data_fim) {
      const inicio = new Date(filtros.data_inicio);
      const fim = new Date(filtros.data_fim);
      
      if (inicio > fim) {
        erros.push('Data de início não pode ser maior que data de fim');
      }
    }

    if (filtros.limite && (filtros.limite < 1 || filtros.limite > 1000)) {
      erros.push('Limite deve estar entre 1 e 1000');
    }

    return erros;
  }
}

export default new RankingsService();


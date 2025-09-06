import api from './api';

class FinanceiroService {
  // =========================================================================
  // === CONSULTAS E LISTAGENS ===
  // =========================================================================

  /**
   * Obter estatísticas financeiras gerais
   */
  async obterEstatisticas() {
    try {
      const response = await api.get('/financeiro/estatisticas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas financeiras:', error);
      throw error;
    }
  }

  /**
   * Listar transações financeiras
   */
  async listarTransacoes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/financeiro/transacoes/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      throw error;
    }
  }

  /**
   * Listar receitas
   */
  async listarReceitas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/financeiro/receitas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar receitas:', error);
      throw error;
    }
  }

  /**
   * Listar despesas
   */
  async listarDespesas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/financeiro/despesas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar despesas:', error);
      throw error;
    }
  }

  /**
   * Listar multas aplicadas
   */
  async listarMultasAplicadas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/financeiro/multas-aplicadas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar multas aplicadas:', error);
      throw error;
    }
  }

  /**
   * Listar multas pagas
   */
  async listarMultasPagas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/financeiro/multas-pagas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar multas pagas:', error);
      throw error;
    }
  }

  /**
   * Listar multas pendentes
   */
  async listarMultasPendentes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/financeiro/multas-pendentes/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar multas pendentes:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CRIAÇÃO E EDIÇÃO ===
  // =========================================================================

  /**
   * Criar nova transação
   */
  async criarTransacao(dados) {
    try {
      const response = await api.post('/financeiro/transacoes/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  /**
   * Atualizar transação
   */
  async atualizarTransacao(id, dados) {
    try {
      const response = await api.put(`/financeiro/transacoes/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  }

  /**
   * Excluir transação
   */
  async excluirTransacao(id) {
    try {
      const response = await api.delete(`/financeiro/transacoes/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  }

  /**
   * Registrar pagamento de multa
   */
  async registrarPagamentoMulta(multaId, dados) {
    try {
      const response = await api.post(`/financeiro/multas/${multaId}/pagar/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar pagamento de multa:', error);
      throw error;
    }
  }

  /**
   * Registrar recebimento
   */
  async registrarRecebimento(dados) {
    try {
      const response = await api.post('/financeiro/recebimentos/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar recebimento:', error);
      throw error;
    }
  }

  /**
   * Registrar despesa
   */
  async registrarDespesa(dados) {
    try {
      const response = await api.post('/financeiro/despesas/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar despesa:', error);
      throw error;
    }
  }

  // =========================================================================
  // === DETALHES E CONSULTAS ESPECÍFICAS ===
  // =========================================================================

  /**
   * Obter detalhes de uma transação
   */
  async obterTransacao(id) {
    try {
      const response = await api.get(`/financeiro/transacoes/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter transação:', error);
      throw error;
    }
  }

  /**
   * Obter fluxo de caixa
   */
  async obterFluxoCaixa(periodo = 'mes') {
    try {
      const response = await api.get(`/financeiro/fluxo-caixa/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter fluxo de caixa:', error);
      throw error;
    }
  }

  /**
   * Obter balanço
   */
  async obterBalanco(dataInicio, dataFim) {
    try {
      const response = await api.get('/financeiro/balanco/', {
        params: { data_inicio: dataInicio, data_fim: dataFim }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter balanço:', error);
      throw error;
    }
  }

  /**
   * Obter DRE (Demonstração do Resultado do Exercício)
   */
  async obterDRE(periodo = 'ano') {
    try {
      const response = await api.get(`/financeiro/dre/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter DRE:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS E ESTATÍSTICAS ===
  // =========================================================================

  /**
   * Gerar relatório financeiro
   */
  async gerarRelatorio(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await api.get(`/financeiro/relatorio/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório financeiro:', error);
      throw error;
    }
  }

  /**
   * Exportar dados financeiros
   */
  async exportarDados(filtros = {}, formato = 'xlsx') {
    try {
      const params = new URLSearchParams({ ...filtros, formato });
      const response = await api.get(`/financeiro/exportar/?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar dados financeiros:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas por período
   */
  async obterEstatisticasPorPeriodo(dataInicio, dataFim) {
    try {
      const response = await api.get('/financeiro/estatisticas/periodo/', {
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
      const response = await api.get('/financeiro/estatisticas/categoria/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas por categoria:', error);
      throw error;
    }
  }

  /**
   * Obter projeções financeiras
   */
  async obterProjecoes(periodos = 12) {
    try {
      const response = await api.get(`/financeiro/projecoes/?periodos=${periodos}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter projeções financeiras:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONFIGURAÇÕES E DADOS AUXILIARES ===
  // =========================================================================

  /**
   * Obter configurações financeiras
   */
  async obterConfiguracoes() {
    try {
      const response = await api.get('/financeiro/configuracoes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações financeiras:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações financeiras
   */
  async atualizarConfiguracoes(configuracoes) {
    try {
      const response = await api.put('/financeiro/configuracoes/', configuracoes);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configurações financeiras:', error);
      throw error;
    }
  }

  /**
   * Listar categorias financeiras
   */
  async listarCategorias() {
    try {
      const response = await api.get('/financeiro/categorias/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar categorias financeiras:', error);
      throw error;
    }
  }

  /**
   * Listar formas de pagamento
   */
  async listarFormasPagamento() {
    try {
      const response = await api.get('/financeiro/formas-pagamento/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar formas de pagamento:', error);
      throw error;
    }
  }

  /**
   * Listar contas bancárias
   */
  async listarContasBancarias() {
    try {
      const response = await api.get('/financeiro/contas-bancarias/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar contas bancárias:', error);
      throw error;
    }
  }

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  /**
   * Calcular lucro
   */
  calcularLucro(receita, despesa) {
    return receita - despesa;
  }

  /**
   * Calcular margem de lucro
   */
  calcularMargemLucro(receita, despesa) {
    if (receita === 0) return 0;
    return ((receita - despesa) / receita) * 100;
  }

  /**
   * Calcular taxa de inadimplência
   */
  calcularTaxaInadimplencia(multasAplicadas, multasPagas) {
    if (multasAplicadas === 0) return 0;
    return ((multasAplicadas - multasPagas) / multasAplicadas) * 100;
  }

  /**
   * Formatar valor monetário
   */
  formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Formatar percentual
   */
  formatarPercentual(valor) {
    return `${valor.toFixed(2)}%`;
  }

  /**
   * Formatar data
   */
  formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  /**
   * Validar dados de transação
   */
  validarTransacao(dados) {
    const erros = [];

    if (!dados.descricao) {
      erros.push('Descrição é obrigatória');
    }

    if (!dados.valor || dados.valor <= 0) {
      erros.push('Valor deve ser maior que zero');
    }

    if (!dados.tipo) {
      erros.push('Tipo é obrigatório');
    }

    if (!dados.data) {
      erros.push('Data é obrigatória');
    }

    return erros;
  }

  /**
   * Validar dados de pagamento
   */
  validarPagamento(dados) {
    const erros = [];

    if (!dados.valor || dados.valor <= 0) {
      erros.push('Valor deve ser maior que zero');
    }

    if (!dados.forma_pagamento) {
      erros.push('Forma de pagamento é obrigatória');
    }

    if (!dados.data_pagamento) {
      erros.push('Data de pagamento é obrigatória');
    }

    return erros;
  }
}

export default new FinanceiroService();
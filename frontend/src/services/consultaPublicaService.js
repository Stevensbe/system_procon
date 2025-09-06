import api from './api';

class ConsultaPublicaService {
  // =========================================================================
  // === CONSULTAS E LISTAGENS ===
  // =========================================================================

  /**
   * Obter estatísticas gerais de consultas públicas
   */
  async obterEstatisticas() {
    try {
      const response = await api.get('/consulta-publica/dashboard/');
      return response.data.stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de consulta pública:', error);
      throw error;
    }
  }

  /**
   * Listar consultas públicas com filtros
   */
  async listarConsultas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.termo) params.append('termo', filtros.termo);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      if (filtros.ip) params.append('ip', filtros.ip);
      if (filtros.sucesso) params.append('sucesso', filtros.sucesso);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/consulta-publica/consultas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar consultas:', error);
      throw error;
    }
  }

  /**
   * Obter consulta específica por ID
   */
  async obterConsulta(id) {
    try {
      const response = await api.get(`/consulta-publica/consultas/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter consulta:', error);
      throw error;
    }
  }

  /**
   * Obter consultas recentes
   */
  async obterConsultasRecentes() {
    try {
      const response = await api.get('/consulta-publica/consultas-recentes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter consultas recentes:', error);
      throw error;
    }
  }

  /**
   * Obter empresas mais consultadas
   */
  async obterEmpresasPopulares() {
    try {
      const response = await api.get('/consulta-publica/empresas-populares/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter empresas populares:', error);
      throw error;
    }
  }

  /**
   * Obter consultas por tipo
   */
  async obterConsultasPorTipo() {
    try {
      const response = await api.get('/consulta-publica/consultas-por-tipo/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter consultas por tipo:', error);
      throw error;
    }
  }

  /**
   * Obter consultas por hora
   */
  async obterConsultasPorHora() {
    try {
      const response = await api.get('/consulta-publica/consultas-por-hora/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter consultas por hora:', error);
      throw error;
    }
  }

  /**
   * Filtrar consultas com parâmetros específicos
   */
  async filtrarConsultas(filtros) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/consulta-publica/filtrar/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao filtrar consultas:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONSULTAS DE EMPRESAS ===
  // =========================================================================

  /**
   * Consultar empresa por CNPJ
   */
  async consultarEmpresa(cnpj) {
    try {
      const response = await api.get(`/consulta-publica/empresa/${cnpj}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar empresa:', error);
      throw error;
    }
  }

  /**
   * Listar empresas públicas
   */
  async listarEmpresas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.razao_social) params.append('razao_social', filtros.razao_social);
      if (filtros.cnpj) params.append('cnpj', filtros.cnpj);
      if (filtros.situacao) params.append('situacao', filtros.situacao);
      if (filtros.segmento) params.append('segmento', filtros.segmento);
      if (filtros.cidade) params.append('cidade', filtros.cidade);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/consulta-publica/empresas/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de empresa pública
   */
  async obterEmpresaPublica(id) {
    try {
      const response = await api.get(`/consulta-publica/empresas/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter empresa pública:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONSULTAS DE PROCESSOS ===
  // =========================================================================

  /**
   * Consultar processo por número
   */
  async consultarProcesso(numero) {
    try {
      const response = await api.get(`/consulta-publica/processo/${numero}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar processo:', error);
      throw error;
    }
  }

  /**
   * Listar processos públicos
   */
  async listarProcessos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.numero) params.append('numero', filtros.numero);
      if (filtros.assunto) params.append('assunto', filtros.assunto);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.empresa) params.append('empresa', filtros.empresa);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/consulta-publica/processos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar processos:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONSULTAS DE RANKINGS ===
  // =========================================================================

  /**
   * Obter ranking de empresas
   */
  async obterRankingEmpresas(tipo = 'multas', periodo = 'ano') {
    try {
      const response = await api.get(`/consulta-publica/ranking/empresas/?tipo=${tipo}&periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter ranking de empresas:', error);
      throw error;
    }
  }

  /**
   * Obter ranking de produtos
   */
  async obterRankingProdutos(tipo = 'reclamacoes', periodo = 'ano') {
    try {
      const response = await api.get(`/consulta-publica/ranking/produtos/?tipo=${tipo}&periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter ranking de produtos:', error);
      throw error;
    }
  }

  /**
   * Obter ranking de setores
   */
  async obterRankingSetores(tipo = 'multas', periodo = 'ano') {
    try {
      const response = await api.get(`/consulta-publica/ranking/setores/?tipo=${tipo}&periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter ranking de setores:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONSULTAS DE PREÇOS ===
  // =========================================================================

  /**
   * Consultar preços de produtos
   */
  async consultarPrecos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.produto) params.append('produto', filtros.produto);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.empresa) params.append('empresa', filtros.empresa);
      if (filtros.cidade) params.append('cidade', filtros.cidade);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.preco_min) params.append('preco_min', filtros.preco_min);
      if (filtros.preco_max) params.append('preco_max', filtros.preco_max);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/consulta-publica/precos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar preços:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de preços
   */
  async obterHistoricoPrecos(produto_id, periodo = 'mes') {
    try {
      const response = await api.get(`/consulta-publica/precos/${produto_id}/historico/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico de preços:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONSULTAS DE RESTRIÇÕES ===
  // =========================================================================

  /**
   * Consultar restrições de empresa
   */
  async consultarRestricoes(cnpj) {
    try {
      const response = await api.get(`/consulta-publica/restricoes/${cnpj}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar restrições:', error);
      throw error;
    }
  }

  /**
   * Listar empresas com restrições
   */
  async listarEmpresasRestricoes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.tipo_restricao) params.append('tipo_restricao', filtros.tipo_restricao);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/consulta-publica/restricoes/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar empresas com restrições:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS ===
  // =========================================================================

  /**
   * Gerar relatório de consultas
   */
  async gerarRelatorio(dados) {
    try {
      const response = await api.post('/consulta-publica/relatorios/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Exportar dados de consulta
   */
  async exportarConsultas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/consulta-publica/exportar/?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `consulta_publica_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar consultas:', error);
      throw error;
    }
  }

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  /**
   * Validar CNPJ
   */
  validarCNPJ(cnpj) {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    let peso = 2;
    
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    let digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    
    if (parseInt(cnpj.charAt(12)) !== digito) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    
    return parseInt(cnpj.charAt(13)) === digito;
  }

  /**
   * Formatar CNPJ
   */
  formatarCNPJ(cnpj) {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    // Aplica a máscara
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  /**
   * Formatar data/hora
   */
  formatarDataHora(data) {
    return new Date(data).toLocaleString('pt-BR');
  }

  /**
   * Formatar tempo de resposta
   */
  formatarTempoResposta(ms) {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Obter cor do tipo de consulta
   */
  getTipoColor(tipo) {
    const cores = {
      'empresa': '#3b82f6',
      'processo': '#059669',
      'ranking': '#d97706',
      'precos': '#7c3aed',
      'restricoes': '#dc2626'
    };
    return cores[tipo] || '#6b7280';
  }

  /**
   * Obter descrição do tipo de consulta
   */
  getTipoDescricao(tipo) {
    const descricoes = {
      'empresa': 'Empresa',
      'processo': 'Processo',
      'ranking': 'Ranking',
      'precos': 'Preços',
      'restricoes': 'Restrições'
    };
    return descricoes[tipo] || tipo;
  }

  /**
   * Obter descrição da situação da empresa
   */
  getSituacaoDescricao(situacao) {
    const situacoes = {
      'regular': 'Regular',
      'com_restricoes': 'Com Restrições',
      'suspenso': 'Suspenso',
      'inativo': 'Inativo'
    };
    return situacoes[situacao] || situacao;
  }

  /**
   * Obter cor da situação da empresa
   */
  getSituacaoColor(situacao) {
    const cores = {
      'regular': '#059669',
      'com_restricoes': '#d97706',
      'suspenso': '#dc2626',
      'inativo': '#6b7280'
    };
    return cores[situacao] || '#6b7280';
  }
}

export default new ConsultaPublicaService();

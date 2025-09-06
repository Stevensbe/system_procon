class CobrancaService {
  constructor() {
    this.baseURL = '/api/cobranca';
    this.updateToken();
  }

  updateToken() {
    this.token = localStorage.getItem('procon-auth-token');
  }

  getHeaders(isFormData = false) {
    // Sempre pegar o token mais atual do localStorage
    this.updateToken();
    
    const headers = {
      'Accept': 'application/json'
    };
    
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async makeRequest(url, options = {}) {
    const isFormData = options.body instanceof FormData;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expirado, tentar renovar
        await this.refreshToken();
        // Reenviar requisição com novo token
        config.headers = {
          ...this.getHeaders(isFormData),
          ...options.headers
        };
        return await fetch(url, config);
      }
      
      return response;
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('procon-refresh-token');
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await fetch('/auth/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.access;
        localStorage.setItem('procon-auth-token', data.access);
        return true;
      } else {
        // Limpar tokens mas não redirecionar automaticamente
        localStorage.removeItem('procon-auth-token');
        localStorage.removeItem('procon-refresh-token');
        this.token = null;
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      localStorage.removeItem('procon-auth-token');
      localStorage.removeItem('procon-refresh-token');
      this.token = null;
      throw error;
    }
  }

  // ===== DASHBOARD =====
  async getEstatisticas() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/geral/estatisticas/`);
      if (!response.ok) throw new Error('Erro ao carregar estatisticas');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error);
      return this.getMockEstatisticas();
    }
  }

  async getBoletosRecentes() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/boletos/boletos-recentes/`);
      if (!response.ok) throw new Error('Erro ao carregar boletos recentes');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar boletos recentes:', error);
      return this.getMockBoletosRecentes();
    }
  }

  async getPagamentosRecentes() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/pagamentos/pagamentos-recentes/`);
      if (!response.ok) throw new Error('Erro ao carregar pagamentos recentes');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar pagamentos recentes:', error);
      return this.getMockPagamentosRecentes();
    }
  }

  async getRemessasRecentes() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/cobrancas/cobrancas-recentes/`);
      if (!response.ok) throw new Error('Erro ao carregar cobranças recentes');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar cobranças recentes:', error);
      return this.getMockRemessasRecentes();
    }
  }

  async getBoletosVencidos() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/boletos/boletos-vencidos/`);
      if (!response.ok) throw new Error('Erro ao carregar boletos vencidos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar boletos vencidos:', error);
      return this.getMockBoletosVencidos();
    }
  }

  async getBoletosPorStatus() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/boletos/boletos-por-status/`);
      if (!response.ok) throw new Error('Erro ao carregar boletos por status');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar boletos por status:', error);
      return this.getMockBoletosPorStatus();
    }
  }

  async getPagamentosPorMes() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/pagamentos/pagamentos-por-mes/`);
      if (!response.ok) throw new Error('Erro ao carregar pagamentos por mes');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar pagamentos por mes:', error);
      return this.getMockPagamentosPorMes();
    }
  }

  async getRemessasPorStatus() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/cobrancas/cobrancas-por-status/`);
      if (!response.ok) throw new Error('Erro ao carregar cobranças por status');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar cobranças por status:', error);
      return this.getMockRemessasPorStatus();
    }
  }

  // ===== BOLETOS =====
  async getBoletos(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.search) queryParams.append('search', params.search);
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          if (params.filters[key]) queryParams.append(key, params.filters[key]);
        });
      }
      if (params.sorting) {
        queryParams.append('sort_by', params.sorting.field);
        queryParams.append('sort_direction', params.sorting.direction);
      }

      const response = await this.makeRequest(`${this.baseURL}/boletos/?${queryParams}`);
      if (!response.ok) throw new Error('Erro ao carregar boletos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar boletos:', error);
      return this.getMockBoletos(params);
    }
  }

  async getBoleto(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/boletos/${id}/`);
      if (!response.ok) throw new Error('Erro ao carregar boleto');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar boleto:', error);
      return this.getMockBoleto(id);
    }
  }

  async createBoleto(formData) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/boletos/`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Erro ao criar boleto');
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar boleto:', error);
      throw error;
    }
  }

  async updateBoleto(id, formData) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/boletos/${id}/`, {
        method: 'PUT',
        body: formData
      });
      if (!response.ok) throw new Error('Erro ao atualizar boleto');
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar boleto:', error);
      throw error;
    }
  }

  async deleteBoleto(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/boletos/${id}/`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao excluir boleto');
      return true;
    } catch (error) {
      console.error('Erro ao excluir boleto:', error);
      throw error;
    }
  }

  async updateBoletoStatus(id, status) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/boletos/${id}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Erro ao atualizar status');
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  // ===== PAGAMENTOS =====
  async getPagamentos(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.search) queryParams.append('search', params.search);
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          if (params.filters[key]) queryParams.append(key, params.filters[key]);
        });
      }

      const response = await this.makeRequest(`${this.baseURL}/pagamentos/?${queryParams}`);
      if (!response.ok) throw new Error('Erro ao carregar pagamentos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      return this.getMockPagamentos(params);
    }
  }

  async getPagamento(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/pagamentos/${id}/`);
      if (!response.ok) throw new Error('Erro ao carregar pagamento');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar pagamento:', error);
      return this.getMockPagamento(id);
    }
  }

  async processarPagamento(pagamentoData) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/pagamentos/processar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pagamentoData)
      });
      if (!response.ok) throw new Error('Erro ao processar pagamento');
      return await response.json();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw error;
    }
  }

  // ===== REMESSAS =====
  async getRemessas(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.search) queryParams.append('search', params.search);
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          if (params.filters[key]) queryParams.append(key, params.filters[key]);
        });
      }

      const response = await this.makeRequest(`${this.baseURL}/cobrancas/?${queryParams}`);
      if (!response.ok) throw new Error('Erro ao carregar cobranças');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar cobranças:', error);
      return this.getMockRemessas(params);
    }
  }

  async getRemessa(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/cobrancas/${id}/`);
      if (!response.ok) throw new Error('Erro ao carregar cobrança');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar cobrança:', error);
      return this.getMockRemessa(id);
    }
  }

  async gerarRemessa(boletosIds) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/cobrancas/gerar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ boletos: boletosIds })
      });
      if (!response.ok) throw new Error('Erro ao gerar cobrança');
      return await response.json();
    } catch (error) {
      console.error('Erro ao gerar cobrança:', error);
      throw error;
    }
  }

  async processarRetorno(arquivo) {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);

      const response = await this.makeRequest(`${this.baseURL}/cobrancas/retorno/`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Erro ao processar retorno');
      return await response.json();
    } catch (error) {
      console.error('Erro ao processar retorno:', error);
      throw error;
    }
  }

  // ===== DADOS AUXILIARES =====
  async getTiposBoleto() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/configuracoes/`);
      if (!response.ok) throw new Error('Erro ao carregar configurações');
      const data = await response.json();
      // Handle different response formats
      if (Array.isArray(data)) return data;
      if (data.results && Array.isArray(data.results)) return data.results;
      if (data.data && Array.isArray(data.data)) return data.data;
      return this.getMockTiposBoleto();
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return this.getMockTiposBoleto();
    }
  }

  async getBancos() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/templates/`);
      if (!response.ok) throw new Error('Erro ao carregar templates');
      const data = await response.json();
      console.log('[getBancos] API response:', data);
      // Handle different response formats
      if (Array.isArray(data)) return data;
      if (data.results && Array.isArray(data.results)) return data.results;
      if (data.data && Array.isArray(data.data)) return data.data;
      console.warn('[getBancos] Unexpected data format, using mock data');
      return this.getMockBancos();
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      return this.getMockBancos();
    }
  }

  async getProcessos() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/geral/processos/`);
      if (!response.ok) throw new Error('Erro ao carregar processos');
      const data = await response.json();
      // Handle different response formats
      if (Array.isArray(data)) return data;
      if (data.results && Array.isArray(data.results)) return data.results;
      if (data.data && Array.isArray(data.data)) return data.data;
      return this.getMockProcessos();
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
      return this.getMockProcessos();
    }
  }

  // ===== RELATORIOS =====
  async gerarRelatorio(params) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/relatorios/gerar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Erro ao gerar relatorio');
      return await response.json();
    } catch (error) {
      console.error('Erro ao gerar relatorio:', error);
      throw error;
    }
  }

  async exportarBoletos(params) {
    try {
      const queryParams = new URLSearchParams();
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          if (params.filters[key]) queryParams.append(key, params.filters[key]);
        });
      }

      const response = await this.makeRequest(`${this.baseURL}/boletos/exportar/?${queryParams}`);
      if (!response.ok) throw new Error('Erro ao exportar boletos');
      return await response.blob();
    } catch (error) {
      console.error('Erro ao exportar boletos:', error);
      throw error;
    }
  }

  // ===== MOCK DATA =====
  getMockEstatisticas() {
    return {
      totalEmAberto: 125000.50,
      recebidoHoje: 15000.00,
      boletosVencidos: 45,
      taxaPagamento: 78.5,
      variacaoEmAberto: 5.2,
      variacaoRecebido: -2.1,
      variacaoVencidos: 3.0,
      variacaoTaxa: 1.5
    };
  }

  getMockBoletosRecentes() {
    return [
      {
        id: 1,
        numero: 'BOL001/2024',
        devedor: 'Empresa ABC Ltda',
        valor: 2500.00,
        status: 'pendente',
        vencimento: '2024-02-15'
      },
      {
        id: 2,
        numero: 'BOL002/2024',
        devedor: 'Joao Silva',
        valor: 1500.00,
        status: 'pago',
        vencimento: '2024-02-10'
      },
      {
        id: 3,
        numero: 'BOL003/2024',
        devedor: 'Maria Santos',
        valor: 3200.00,
        status: 'vencido',
        vencimento: '2024-02-05'
      }
    ];
  }

  getMockPagamentosRecentes() {
    return [
      {
        id: 1,
        numeroBoleto: 'BOL002/2024',
        formaPagamento: 'PIX',
        valor: 1500.00,
        dataPagamento: '2024-02-10'
      },
      {
        id: 2,
        numeroBoleto: 'BOL004/2024',
        formaPagamento: 'Cartao',
        valor: 2800.00,
        dataPagamento: '2024-02-09'
      }
    ];
  }

  getMockRemessasRecentes() {
    return [
      {
        id: 1,
        numero: 'REM001/2024',
        banco: 'Banco do Brasil',
        quantidadeBoletos: 25,
        status: 'processado'
      },
      {
        id: 2,
        numero: 'REM002/2024',
        banco: 'Caixa Economica',
        quantidadeBoletos: 18,
        status: 'pendente'
      }
    ];
  }

  getMockBoletosVencidos() {
    return [
      {
        id: 3,
        numero: 'BOL003/2024',
        devedor: 'Maria Santos',
        documento: '123.456.789-00',
        valor: 3200.00,
        vencimento: '2024-02-05',
        diasVencido: 5,
        tipo: 'multa'
      },
      {
        id: 4,
        numero: 'BOL005/2024',
        devedor: 'Empresa XYZ',
        documento: '12.345.678/0001-90',
        valor: 4500.00,
        vencimento: '2024-02-03',
        diasVencido: 7,
        tipo: 'taxa'
      }
    ];
  }

  getMockBoletosPorStatus() {
    return [
      { status: 'pendente', quantidade: 150, percentual: 45 },
      { status: 'pago', quantidade: 120, percentual: 36 },
      { status: 'vencido', quantidade: 45, percentual: 13 },
      { status: 'cancelado', quantidade: 20, percentual: 6 }
    ];
  }

  getMockPagamentosPorMes() {
    return [
      { mes: 'Janeiro', valor: 45000.00, quantidade: 45 },
      { mes: 'Fevereiro', valor: 52000.00, quantidade: 52 },
      { mes: 'Marco', valor: 38000.00, quantidade: 38 }
    ];
  }

  getMockRemessasPorStatus() {
    return [
      { status: 'processado', quantidade: 8, percentual: 67 },
      { status: 'pendente', quantidade: 3, percentual: 25 },
      { status: 'erro', quantidade: 1, percentual: 8 }
    ];
  }

  getMockBoletos(params = {}) {
    const boletos = [
      {
        id: 1,
        numero: 'BOL001/2024',
        devedor: 'Empresa ABC Ltda',
        documento: '12.345.678/0001-90',
        valor: 2500.00,
        valorOriginal: 2500.00,
        vencimento: '2024-02-15',
        status: 'pendente',
        tipo: 'multa',
        banco: 'Banco do Brasil',
        diasVencido: 0
      },
      {
        id: 2,
        numero: 'BOL002/2024',
        devedor: 'Joao Silva',
        documento: '123.456.789-00',
        valor: 1500.00,
        valorOriginal: 1500.00,
        vencimento: '2024-02-10',
        status: 'pago',
        tipo: 'taxa',
        banco: 'Caixa Economica',
        diasVencido: 0
      },
      {
        id: 3,
        numero: 'BOL003/2024',
        devedor: 'Maria Santos',
        documento: '987.654.321-00',
        valor: 3200.00,
        valorOriginal: 3200.00,
        vencimento: '2024-02-05',
        status: 'vencido',
        tipo: 'multa',
        banco: 'Itau',
        diasVencido: 5
      }
    ];

    return {
      data: boletos,
      totalPages: 1,
      totalItems: boletos.length
    };
  }

  getMockBoleto(id) {
    return {
      id: parseInt(id),
      numero: `BOL${id.toString().padStart(3, '0')}/2024`,
      tipo: 'multa',
      status: 'pendente',
      valor: 2500.00,
      valorOriginal: 2500.00,
      vencimento: '2024-02-15',
      emissao: '2024-01-15',
      devedor: 'Empresa ABC Ltda',
      documento: '12.345.678/0001-90',
      tipoDocumento: 'cnpj',
      endereco: 'Rua das Flores, 123',
      cidade: 'Manaus',
      estado: 'AM',
      cep: '69000-000',
      telefone: '(92) 99999-9999',
      email: 'contato@empresaabc.com.br',
      banco: '001',
      agencia: '1234',
      conta: '12345-6',
      carteira: '17',
      nossoNumero: '12345678901',
      codigoBarras: '00193373700000001000500940144816060680935031',
      linhaDigitavel: '00190.00009 04448.160606 06809.350314 3 37370000000100',
      descricao: 'Multa por infracao administrativa',
      observacoes: 'Processo administrativo 001/2024',
      processo: '1',
      autoInfracao: 'AI001/2024',
      multaAtraso: '2.00',
      jurosMora: '1.00',
      desconto: '0.00',
      descontoAte: '',
      documentos: []
    };
  }

  getMockPagamentos(params = {}) {
    const pagamentos = [
      {
        id: 1,
        numeroBoleto: 'BOL002/2024',
        formaPagamento: 'PIX',
        valor: 1500.00,
        dataPagamento: '2024-02-10',
        status: 'confirmado'
      },
      {
        id: 2,
        numeroBoleto: 'BOL004/2024',
        formaPagamento: 'Cartao',
        valor: 2800.00,
        dataPagamento: '2024-02-09',
        status: 'confirmado'
      }
    ];

    return {
      data: pagamentos,
      totalPages: 1,
      totalItems: pagamentos.length
    };
  }

  getMockPagamento(id) {
    return {
      id: parseInt(id),
      numeroBoleto: `BOL${id.toString().padStart(3, '0')}/2024`,
      formaPagamento: 'PIX',
      valor: 1500.00,
      dataPagamento: '2024-02-10',
      status: 'confirmado',
      comprovante: 'comprovante.pdf'
    };
  }

  getMockRemessas(params = {}) {
    const remessas = [
      {
        id: 1,
        numero: 'REM001/2024',
        banco: 'Banco do Brasil',
        quantidadeBoletos: 25,
        status: 'processado',
        dataGeracao: '2024-02-10'
      },
      {
        id: 2,
        numero: 'REM002/2024',
        banco: 'Caixa Economica',
        quantidadeBoletos: 18,
        status: 'pendente',
        dataGeracao: '2024-02-09'
      }
    ];

    return {
      data: remessas,
      totalPages: 1,
      totalItems: remessas.length
    };
  }

  getMockRemessa(id) {
    return {
      id: parseInt(id),
      numero: `REM${id.toString().padStart(3, '0')}/2024`,
      banco: 'Banco do Brasil',
      quantidadeBoletos: 25,
      status: 'processado',
      dataGeracao: '2024-02-10',
      arquivo: 'remessa.txt'
    };
  }

  getMockTiposBoleto() {
    return [
      { id: 'multa', nome: 'Multa' },
      { id: 'taxa', nome: 'Taxa' },
      { id: 'juros', nome: 'Juros' },
      { id: 'correcao', nome: 'Correcao' }
    ];
  }

  getMockBancos() {
    return [
      { codigo: '001', nome: 'Banco do Brasil' },
      { codigo: '104', nome: 'Caixa Economica Federal' },
      { codigo: '033', nome: 'Santander' },
      { codigo: '341', nome: 'Itau Unibanco' },
      { codigo: '237', nome: 'Bradesco' },
      { codigo: '756', nome: 'Sicoob' },
      { codigo: '748', nome: 'Sicredi' }
    ];
  }

  getMockProcessos() {
    return [
      { id: 1, numero: '001/2024', empresa: 'Empresa ABC Ltda' },
      { id: 2, numero: '002/2024', empresa: 'Empresa XYZ' },
      { id: 3, numero: '003/2024', empresa: 'Joao Silva' }
    ];
  }

  // ===== MÉTODOS AUXILIARES PARA FORMULÁRIOS =====

  /**
   * Listar processos disponíveis
   */
  async listarProcessos() {
    try {
      const response = await this.makeRequest('/api/processos/');
      if (!response.ok) throw new Error('Erro ao listar processos');
      const data = await response.json();
      return data.results || data || [];
    } catch (error) {
      console.error('Erro ao listar processos:', error);
      return this.getMockProcessos();
    }
  }

  /**
   * Listar multas disponíveis
   */
  async listarMultas() {
    try {
      const response = await this.makeRequest('/api/multas/');
      if (!response.ok) throw new Error('Erro ao listar multas');
      const data = await response.json();
      return data.results || data || [];
    } catch (error) {
      console.error('Erro ao listar multas:', error);
      return [];
    }
  }

  /**
   * Obter cobrança específica por ID
   */
  async obterCobranca(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/cobrancas/${id}/`);
      if (!response.ok) throw new Error('Erro ao obter cobrança');
      return await response.json();
    } catch (error) {
      console.error('Erro ao obter cobrança:', error);
      throw error;
    }
  }

  /**
   * Criar nova cobrança
   */
  async criarCobranca(dados) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/cobrancas/`, {
        method: 'POST',
        body: JSON.stringify(dados)
      });
      if (!response.ok) throw new Error('Erro ao criar cobrança');
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      throw error;
    }
  }

  /**
   * Atualizar cobrança existente
   */
  async atualizarCobranca(id, dados) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/cobrancas/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
      if (!response.ok) throw new Error('Erro ao atualizar cobrança');
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar cobrança:', error);
      throw error;
    }
  }

  // ===== REMESSAS =====

  /**
   * Listar remessas
   */
  async getRemessas(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.search) queryParams.append('search', params.search);
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          if (params.filters[key]) queryParams.append(key, params.filters[key]);
        });
      }
      if (params.sorting) {
        queryParams.append('sort_by', params.sorting.field);
        queryParams.append('sort_direction', params.sorting.direction);
      }

      const response = await this.makeRequest(`${this.baseURL}/remessas/?${queryParams}`);
      if (!response.ok) throw new Error('Erro ao carregar remessas');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar remessas:', error);
      return this.getMockRemessas(params);
    }
  }

  /**
   * Obter remessa específica
   */
  async getRemessa(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/remessas/${id}/`);
      if (!response.ok) throw new Error('Erro ao carregar remessa');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar remessa:', error);
      return this.getMockRemessa(id);
    }
  }

  /**
   * Criar nova remessa
   */
  async createRemessa(formData) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/remessas/`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Erro ao criar remessa');
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar remessa:', error);
      throw error;
    }
  }

  /**
   * Atualizar remessa existente
   */
  async updateRemessa(id, formData) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/remessas/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Erro ao atualizar remessa');
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar remessa:', error);
      throw error;
    }
  }

  /**
   * Deletar remessa
   */
  async deleteRemessa(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/remessas/${id}/`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar remessa');
      return true;
    } catch (error) {
      console.error('Erro ao deletar remessa:', error);
      throw error;
    }
  }

  /**
   * Gerar arquivo de remessa
   */
  async gerarRemessa(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/remessas/${id}/gerar/`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erro ao gerar remessa');
      return await response.json();
    } catch (error) {
      console.error('Erro ao gerar remessa:', error);
      throw error;
    }
  }

  /**
   * Processar arquivo de retorno
   */
  async processarRetorno(id) {
    try {
      const response = await this.makeRequest(`${this.baseURL}/remessas/${id}/processar-retorno/`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Erro ao processar retorno');
      return await response.json();
    } catch (error) {
      console.error('Erro ao processar retorno:', error);
      throw error;
    }
  }

  /**
   * Listar bancos disponíveis
   */
  async getBancos() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/bancos/`);
      if (!response.ok) throw new Error('Erro ao carregar bancos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar bancos:', error);
      return this.getMockBancos();
    }
  }
}

export const cobrancaService = new CobrancaService();

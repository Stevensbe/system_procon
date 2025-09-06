import api from './api';

class DashboardService {
  // ===== DADOS PRINCIPAIS DO DASHBOARD =====
  
  /**
   * Carrega todos os dados principais do dashboard
   */
  async getDashboardData(periodo = 'mes') {
    try {
      const response = await api.get(`/api/dashboard/cached/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Retorna dados simulados em caso de erro
      return this.getMockDashboardData(periodo);
    }
  }

  /**
   * Carrega estatísticas principais
   */
  async getEstatisticasPrincipais(periodo = 'mes') {
    try {
      const response = await api.get(`/dashboard-stats/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      return this.getMockStats(periodo);
    }
  }

  /**
   * Carrega dados para gráficos
   */
  async getDadosGraficos(periodo = 'mes') {
    try {
      const response = await api.get(`/dashboard/graficos/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
      return this.getMockChartData();
    }
  }

  /**
   * Carrega alertas do sistema
   */
  async getAlertas() {
    try {
      const response = await api.get('/dashboard/alertas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      return this.getMockAlertas();
    }
  }

  /**
   * Carrega atividades recentes
   */
  async getAtividadesRecentes(limite = 10) {
    try {
      const response = await api.get(`/dashboard/atividades/?limite=${limite}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      return this.getMockAtividades();
    }
  }

  // ===== DADOS ESPECÍFICOS POR MÓDULO =====

  /**
   * Estatísticas de processos
   */
  async getEstatisticasProcessos(periodo = 'mes') {
    try {
      const response = await api.get(`/api/processos/dashboard/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar estatísticas de processos:', error);
      return this.getMockProcessosStats(periodo);
    }
  }

  /**
   * Estatísticas de multas
   */
  async getEstatisticasMultas(periodo = 'mes') {
    try {
      const response = await api.get(`/api/multas/estatisticas/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar estatísticas de multas:', error);
      return this.getMockMultasStats(periodo);
    }
  }

  /**
   * Estatísticas de fiscalização
   */
  async getEstatisticasFiscalizacao(periodo = 'mes') {
    try {
      const response = await api.get(`/api/fiscalizacao/estatisticas/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar estatísticas de fiscalização:', error);
      return this.getMockFiscalizacaoStats(periodo);
    }
  }

  /**
   * Estatísticas financeiras
   */
  async getEstatisticasFinanceiras(periodo = 'mes') {
    try {
      const response = await api.get(`/api/financeiro/dashboard/?periodo=${periodo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar estatísticas financeiras:', error);
      return this.getMockFinanceirasStats(periodo);
    }
  }

  // ===== RELATÓRIOS E EXPORTAÇÃO =====

  /**
   * Gera relatório do dashboard
   */
  async gerarRelatorioDashboard(params) {
    try {
      const response = await api.post('/api/dashboard/relatorio/', params);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Exporta dados do dashboard
   */
  async exportarDadosDashboard(formato = 'pdf', params = {}) {
    try {
      const response = await api.post(`/api/dashboard/exportar/${formato}/`, params, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  }

  // ===== CONFIGURAÇÕES DO DASHBOARD =====

  /**
   * Salva configurações do dashboard
   */
  async salvarConfiguracoes(configuracoes) {
    try {
      const response = await api.post('/api/dashboard/configuracoes/', configuracoes);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }

  /**
   * Carrega configurações do dashboard
   */
  async getConfiguracoes() {
    try {
      const response = await api.get('/dashboard/configuracoes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return this.getMockConfiguracoes();
    }
  }

  // ===== DADOS MOCK PARA DESENVOLVIMENTO =====

  getMockDashboardData(periodo = 'mes') {
    const multiplicador = periodo === 'ano' ? 12 : periodo === 'trimestre' ? 3 : 1;
    
    return {
      estatisticas: this.getMockStats(periodo),
      graficos: this.getMockChartData(),
      alertas: this.getMockAlertas(),
      atividades: this.getMockAtividades()
    };
  }

  getMockStats(periodo = 'mes') {
    const multiplicador = periodo === 'ano' ? 12 : periodo === 'trimestre' ? 3 : 1;
    
    return {
      totalProcessos: 1247 * multiplicador,
      processosEmAndamento: 892 * multiplicador,
      processosConcluidos: 355 * multiplicador,
      processosPendentes: 234 * multiplicador,
      totalMultas: 567 * multiplicador,
      multasPagas: 423 * multiplicador,
      multasPendentes: 144 * multiplicador,
      multasVencidas: 45 * multiplicador,
      arrecadacaoMes: 1250000 * multiplicador,
      arrecadacaoAno: 15800000 * multiplicador,
      denunciasRecebidas: 234 * multiplicador,
      fiscalizacoesRealizadas: 89 * multiplicador,
      usuariosAtivos: 45,
      taxaResolucao: 78.5,
      tempoMedioResolucao: 12.3
    };
  }

  getMockChartData() {
    return {
      arrecadacaoMensal: [
        { mes: 'Jan', valor: 1200000, meta: 1000000 },
        { mes: 'Fev', valor: 1350000, meta: 1000000 },
        { mes: 'Mar', valor: 1100000, meta: 1000000 },
        { mes: 'Abr', valor: 1400000, meta: 1000000 },
        { mes: 'Mai', valor: 1250000, meta: 1000000 },
        { mes: 'Jun', valor: 1300000, meta: 1000000 }
      ],
      processosPorStatus: [
        { status: 'Em Andamento', quantidade: 892, cor: '#3B82F6', percentual: 71.5 },
        { status: 'Concluído', quantidade: 355, cor: '#10B981', percentual: 28.5 },
        { status: 'Pendente', quantidade: 234, cor: '#F59E0B', percentual: 18.8 },
        { status: 'Cancelado', quantidade: 45, cor: '#EF4444', percentual: 3.6 }
      ],
      multasPorTipo: [
        { tipo: 'Bancos', quantidade: 156, valor: 4500000, cor: '#3B82F6' },
        { tipo: 'Supermercados', quantidade: 234, valor: 3200000, cor: '#10B981' },
        { tipo: 'Postos', quantidade: 89, valor: 1800000, cor: '#F59E0B' },
        { tipo: 'Telefonia', quantidade: 67, valor: 1200000, cor: '#8B5CF6' },
        { tipo: 'Outros', quantidade: 21, valor: 400000, cor: '#EF4444' }
      ],
      denunciasPorMes: [
        { mes: 'Jan', quantidade: 45, resolvidas: 38 },
        { mes: 'Fev', quantidade: 52, resolvidas: 45 },
        { mes: 'Mar', quantidade: 38, resolvidas: 32 },
        { mes: 'Abr', quantidade: 61, resolvidas: 52 },
        { mes: 'Mai', quantidade: 48, resolvidas: 41 },
        { mes: 'Jun', quantidade: 55, resolvidas: 47 }
      ],
      performanceMensal: [
        { mes: 'Jan', processos: 120, multas: 45, fiscalizacoes: 15 },
        { mes: 'Fev', processos: 135, multas: 52, fiscalizacoes: 18 },
        { mes: 'Mar', processos: 110, multas: 38, fiscalizacoes: 12 },
        { mes: 'Abr', processos: 140, multas: 61, fiscalizacoes: 20 },
        { mes: 'Mai', processos: 125, multas: 48, fiscalizacoes: 16 },
        { mes: 'Jun', processos: 130, multas: 55, fiscalizacoes: 19 }
      ],
      fiscalizacoesPorMes: [
        { mes: 'Jan', planejadas: 20, realizadas: 15, eficiencia: 75 },
        { mes: 'Fev', planejadas: 22, realizadas: 18, eficiencia: 82 },
        { mes: 'Mar', planejadas: 18, realizadas: 12, eficiencia: 67 },
        { mes: 'Abr', planejadas: 25, realizadas: 20, eficiencia: 80 },
        { mes: 'Mai', planejadas: 20, realizadas: 16, eficiencia: 80 },
        { mes: 'Jun', planejadas: 23, realizadas: 19, eficiencia: 83 }
      ]
    };
  }

  getMockAlertas() {
    return [
      {
        id: 1,
        tipo: 'warning',
        titulo: 'Multas vencendo',
        mensagem: '15 multas vencem nos próximos 7 dias',
        acao: 'Ver detalhes',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        tipo: 'info',
        titulo: 'Novos processos',
        mensagem: '23 novos processos foram protocolados hoje',
        acao: 'Revisar',
        timestamp: new Date().toISOString()
      },
      {
        id: 3,
        tipo: 'success',
        titulo: 'Meta atingida',
        mensagem: 'Meta mensal de arrecadação foi superada em 15%',
        acao: 'Ver relatório',
        timestamp: new Date().toISOString()
      }
    ];
  }

  getMockAtividades() {
    return [
      {
        id: 1,
        tipo: 'processo',
        titulo: 'Processo #2025-001234 protocolado',
        descricao: 'Denúncia contra Loja XYZ',
        tempo: '2 min atrás',
        usuario: 'Maria Silva',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        tipo: 'multa',
        titulo: 'Multa #M2025-000567 paga',
        descricao: 'Valor: R$ 15.000,00',
        tempo: '15 min atrás',
        usuario: 'Sistema',
        timestamp: new Date().toISOString()
      },
      {
        id: 3,
        tipo: 'fiscalizacao',
        titulo: 'Fiscalização agendada',
        descricao: 'Posto de combustível - Centro',
        tempo: '1 hora atrás',
        usuario: 'João Santos',
        timestamp: new Date().toISOString()
      },
      {
        id: 4,
        tipo: 'relatorio',
        titulo: 'Relatório mensal gerado',
        descricao: 'Janeiro 2025 - Estatísticas completas',
        tempo: '2 horas atrás',
        usuario: 'Sistema',
        timestamp: new Date().toISOString()
      }
    ];
  }

  getMockProcessosStats(periodo = 'mes') {
    const multiplicador = periodo === 'ano' ? 12 : periodo === 'trimestre' ? 3 : 1;
    
    return {
      total: 1247 * multiplicador,
      emAndamento: 892 * multiplicador,
      concluidos: 355 * multiplicador,
      pendentes: 234 * multiplicador,
      cancelados: 45 * multiplicador,
      taxaConclusao: 78.5,
      tempoMedio: 12.3
    };
  }

  getMockMultasStats(periodo = 'mes') {
    const multiplicador = periodo === 'ano' ? 12 : periodo === 'trimestre' ? 3 : 1;
    
    return {
      total: 567 * multiplicador,
      pagas: 423 * multiplicador,
      pendentes: 144 * multiplicador,
      vencidas: 45 * multiplicador,
      valorTotal: 8500000 * multiplicador,
      valorPago: 6500000 * multiplicador,
      valorPendente: 2000000 * multiplicador
    };
  }

  getMockFiscalizacaoStats(periodo = 'mes') {
    const multiplicador = periodo === 'ano' ? 12 : periodo === 'trimestre' ? 3 : 1;
    
    return {
      total: 89 * multiplicador,
      planejadas: 120 * multiplicador,
      realizadas: 89 * multiplicador,
      eficiencia: 74.2,
      tipos: {
        bancos: 25 * multiplicador,
        supermercados: 30 * multiplicador,
        postos: 20 * multiplicador,
        outros: 14 * multiplicador
      }
    };
  }

  getMockFinanceirasStats(periodo = 'mes') {
    const multiplicador = periodo === 'ano' ? 12 : periodo === 'trimestre' ? 3 : 1;
    
    return {
      arrecadacaoMes: 1250000 * multiplicador,
      arrecadacaoAno: 15800000 * multiplicador,
      metaMensal: 1000000 * multiplicador,
      metaAnual: 12000000 * multiplicador,
      percentualMeta: 125,
      projecaoAnual: 15000000 * multiplicador
    };
  }

  getMockConfiguracoes() {
    return {
      tema: 'claro',
      atualizacaoAutomatica: true,
      intervaloAtualizacao: 300, // 5 minutos
      alertasAtivos: true,
      notificacoesEmail: true,
      relatoriosAutomaticos: true,
      widgetsAtivos: [
        'kpis',
        'graficos',
        'alertas',
        'atividades'
      ]
    };
  }
}

export default new DashboardService();

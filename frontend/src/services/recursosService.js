import api from './api';

class RecursosService {
  // =========================================================================
  // === OPERAÇÕES CRUD BÁSICAS ===
  // =========================================================================

  async getRecursos(params = {}) {
    try {
      const response = await api.get('/recursos/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos:', error);
      throw error;
    }
  }

  async getRecurso(id) {
    try {
      const response = await api.get(`/recursos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recurso:', error);
      throw error;
    }
  }

  async createRecurso(formData) {
    try {
      const response = await api.post('/recursos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar recurso:', error);
      throw error;
    }
  }

  async updateRecurso(id, formData) {
    try {
      const response = await api.put(`/recursos/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar recurso:', error);
      throw error;
    }
  }

  async deleteRecurso(id) {
    try {
      const response = await api.delete(`/recursos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir recurso:', error);
      throw error;
    }
  }

  // =========================================================================
  // === DADOS PARA DASHBOARD ===
  // =========================================================================

  async getEstatisticas() {
    try {
      const response = await api.get('/recursos/estatisticas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Retornar dados mock em caso de erro
      return this.getEstatisticasMock();
    }
  }

  async getRecursosRecentes(limit = 10) {
    try {
      const response = await api.get('/recursos/recentes/', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos recentes:', error);
      return this.getRecursosRecentesMock();
    }
  }

  async getRecursosPrazo() {
    try {
      const response = await api.get('/recursos/prazo/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos com prazo:', error);
      return this.getRecursosPrazoMock();
    }
  }

  async getRecursosPorInstancia() {
    try {
      const response = await api.get('/recursos/por-instancia/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos por instância:', error);
      return this.getRecursosPorInstanciaMock();
    }
  }

  async getRecursosPorStatus() {
    try {
      const response = await api.get('/recursos/por-status/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos por status:', error);
      return this.getRecursosPorStatusMock();
    }
  }

  async getRecursosPorTipo() {
    try {
      const response = await api.get('/recursos/por-tipo/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos por tipo:', error);
      return this.getRecursosPorTipoMock();
    }
  }

  async getRecursosPorMes() {
    try {
      const response = await api.get('/recursos/por-mes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos por mês:', error);
      return this.getRecursosPorMesMock();
    }
  }

  // =========================================================================
  // === DADOS PARA FORMULÁRIOS ===
  // =========================================================================

  async getTiposRecurso() {
    try {
      const response = await api.get('/recursos/tipos/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipos de recurso:', error);
      return this.getTiposRecursoMock();
    }
  }

  async getRecursosHierarquicos() {
    try {
      const response = await api.get('/recursos/hierarquicos/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recursos hierárquicos:', error);
      return this.getRecursosHierarquicosMock();
    }
  }

  // =========================================================================
  // === OPERAÇÕES ESPECÍFICAS ===
  // =========================================================================

  async protocolarRecurso(dados) {
    try {
      const response = await api.post('/recursos/protocolar/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao protocolar recurso:', error);
      throw error;
    }
  }

  async analisarRecurso(id, parecer) {
    try {
      const response = await api.post(`/recursos/${id}/analisar/`, parecer);
      return response.data;
    } catch (error) {
      console.error('Erro ao analisar recurso:', error);
      throw error;
    }
  }

  async julgarRecurso(id, decisao) {
    try {
      const response = await api.post(`/recursos/${id}/julgar/`, decisao);
      return response.data;
    } catch (error) {
      console.error('Erro ao julgar recurso:', error);
      throw error;
    }
  }

  async notificarRequerente(id, dadosNotificacao) {
    try {
      const response = await api.post(`/recursos/${id}/notificar/`, dadosNotificacao);
      return response.data;
    } catch (error) {
      console.error('Erro ao notificar requerente:', error);
      throw error;
    }
  }

  async criarRecursoHierarquico(id, dadosRecurso) {
    try {
      const response = await api.post(`/recursos/${id}/hierarquico/`, dadosRecurso);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar recurso hierárquico:', error);
      throw error;
    }
  }

  async getMovimentacoes(id) {
    try {
      const response = await api.get(`/recursos/${id}/movimentacoes/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      return this.getMovimentacoesMock(id);
    }
  }

  async adicionarMovimentacao(id, movimentacao) {
    try {
      const response = await api.post(`/recursos/${id}/movimentacoes/`, movimentacao);
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS ===
  // =========================================================================

  async gerarRelatorio(filtros) {
    try {
      const response = await api.post('/recursos/relatorio/', filtros, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  async exportarRecursos(filtros, formato = 'excel') {
    try {
      const response = await api.post('/recursos/exportar/', filtros, {
        params: { formato },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar recursos:', error);
      throw error;
    }
  }

  // =========================================================================
  // === DADOS MOCK PARA DESENVOLVIMENTO ===
  // =========================================================================

  getEstatisticasMock() {
    return {
      total_recursos: 156,
      recursos_pendentes: 23,
      recursos_em_analise: 45,
      recursos_julgados: 88,
      recursos_vencidos: 12,
      recursos_segunda_instancia: 34,
      recursos_terceira_instancia: 8,
      valor_total_causas: 2450000.00
    };
  }

  getRecursosRecentesMock() {
    return [
      {
        id: 1,
        numero_protocolo: 'REC-00123/2025',
        requerente_nome: 'Empresa ABC Ltda',
        tipo_recurso: 'Recurso Ordinário',
        instancia: 'primeira',
        status: 'protocolado',
        data_protocolo: '2025-01-15',
        valor_causa: 150000.00
      },
      {
        id: 2,
        numero_protocolo: 'REC-00122/2025',
        requerente_nome: 'João Silva',
        tipo_recurso: 'Recurso Extraordinário',
        instancia: 'segunda',
        status: 'em_analise',
        data_protocolo: '2025-01-14',
        valor_causa: 75000.00
      },
      {
        id: 3,
        numero_protocolo: 'REC-00121/2025',
        requerente_nome: 'Maria Santos',
        tipo_recurso: 'Pedido de Revisão',
        instancia: 'primeira',
        status: 'julgado',
        data_protocolo: '2025-01-13',
        valor_causa: 25000.00
      }
    ];
  }

  getRecursosPrazoMock() {
    return [
      {
        id: 4,
        numero_protocolo: 'REC-00120/2025',
        requerente_nome: 'Empresa XYZ Ltda',
        data_limite_analise: '2025-01-20',
        dias_restantes: 2,
        prioridade: 'alta'
      },
      {
        id: 5,
        numero_protocolo: 'REC-00119/2025',
        requerente_nome: 'Pedro Oliveira',
        data_limite_analise: '2025-01-22',
        dias_restantes: 4,
        prioridade: 'normal'
      }
    ];
  }

  getRecursosPorInstanciaMock() {
    return [
      { instancia: 'Primeira Instância', quantidade: 98, percentual: 62.8 },
      { instancia: 'Segunda Instância', quantidade: 45, percentual: 28.8 },
      { instancia: 'Terceira Instância', quantidade: 13, percentual: 8.4 }
    ];
  }

  getRecursosPorStatusMock() {
    return [
      { status: 'Protocolado', quantidade: 23, percentual: 14.7 },
      { status: 'Em Análise', quantidade: 45, percentual: 28.8 },
      { status: 'Com Parecer', quantidade: 18, percentual: 11.5 },
      { status: 'Deferido', quantidade: 35, percentual: 22.4 },
      { status: 'Indeferido', quantidade: 25, percentual: 16.0 },
      { status: 'Arquivado', quantidade: 10, percentual: 6.4 }
    ];
  }

  getRecursosPorTipoMock() {
    return [
      { tipo: 'Recurso Ordinário', quantidade: 67, percentual: 42.9 },
      { tipo: 'Recurso Extraordinário', quantidade: 45, percentual: 28.8 },
      { tipo: 'Pedido de Revisão', quantidade: 28, percentual: 17.9 },
      { tipo: 'Pedido de Reconsideração', quantidade: 16, percentual: 10.3 }
    ];
  }

  getRecursosPorMesMock() {
    return [
      { mes: 'Jan/2025', quantidade: 15 },
      { mes: 'Dez/2024', quantidade: 12 },
      { mes: 'Nov/2024', quantidade: 18 },
      { mes: 'Out/2024', quantidade: 14 },
      { mes: 'Set/2024', quantidade: 16 },
      { mes: 'Ago/2024', quantidade: 13 }
    ];
  }

  getTiposRecursoMock() {
    return [
      { id: 1, nome: 'Recurso Ordinário', codigo: 'REC_ORD', prazo_dias: 30 },
      { id: 2, nome: 'Recurso Extraordinário', codigo: 'REC_EXT', prazo_dias: 60 },
      { id: 3, nome: 'Pedido de Revisão', codigo: 'PED_REV', prazo_dias: 45 },
      { id: 4, nome: 'Pedido de Reconsideração', codigo: 'PED_REC', prazo_dias: 15 }
    ];
  }

  getRecursosHierarquicosMock() {
    return [
      { id: 1, numero_protocolo: 'REC-00100/2024', assunto: 'Recurso contra multa' },
      { id: 2, numero_protocolo: 'REC-00101/2024', assunto: 'Recurso contra decisão' },
      { id: 3, numero_protocolo: 'REC-00102/2024', assunto: 'Revisão de processo' }
    ];
  }

  getMovimentacoesMock(id) {
    return [
      {
        id: 1,
        tipo_movimentacao: 'protocolado',
        data_movimentacao: '2025-01-15T10:30:00Z',
        descricao: 'Recurso protocolado',
        usuario: 'Dr. João Silva',
        observacoes: 'Protocolo realizado com sucesso'
      },
      {
        id: 2,
        tipo_movimentacao: 'em_analise',
        data_movimentacao: '2025-01-16T14:20:00Z',
        descricao: 'Recurso em análise',
        usuario: 'Dra. Maria Santos',
        observacoes: 'Iniciada análise técnica'
      },
      {
        id: 3,
        tipo_movimentacao: 'com_parecer',
        data_movimentacao: '2025-01-18T09:15:00Z',
        descricao: 'Parecer técnico emitido',
        usuario: 'Dr. Carlos Lima',
        observacoes: 'Parecer favorável ao recurso'
      }
    ];
  }
}

export default new RecursosService();

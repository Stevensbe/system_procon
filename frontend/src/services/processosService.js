import api from './api.js';

class ProcessosService {
  // ============================================================================
  // PROCESSOS ADMINISTRATIVOS (usando APIs da fiscalização)
  // ============================================================================

  // Listar todos os processos
  async listarProcessos(filtros = {}, page = 1) {
    try {
      const params = new URLSearchParams();
      
      // Adicionar filtros aos parâmetros
      Object.keys(filtros).forEach(key => {
        if (filtros[key] && filtros[key] !== '') {
          params.append(key, filtros[key]);
        }
      });
      
      // Adicionar página
      if (page > 1) {
        params.append('page', page);
      }
      
      const queryString = params.toString();
      const url = `processos/${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar processos:', error);
      // Retorna dados vazios em caso de erro para não quebrar a aplicação
      return {
        results: [],
        count: 0,
        next: null,
        previous: null
      };
    }
  }

  // Obter detalhes completos de um processo (dossiê digital)
  async obterProcesso(id) {
    try {
      const response = await api.get(`processos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter processo:', error);
      throw error;
    }
  }

  // Atualizar processo
  async atualizarProcesso(id, dados) {
    try {
      const response = await api.patch(`processos/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
      throw error;
    }
  }

  // Alterar status do processo
  async alterarStatus(id, status, observacao = '') {
    try {
      const response = await api.post(`processos/${id}/atualizar-status/`, {
        status,
        observacao
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARD E ESTATÍSTICAS
  // ============================================================================

  // Obter dados do dashboard
  async obterDashboard() {
    try {
      const response = await api.get('processos/dashboard/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter dashboard:', error);
      // Retorna dados vazios em caso de erro para não quebrar a aplicação
      return {
        resumo: {
          total_processos: 0,
          processos_abertos: 0,
          processos_vencidos: 0,
          processos_proximos_vencimento: 0,
          valor_total_tramitacao: 0,
          tempo_medio_tramitacao: 0
        }
      };
    }
  }

  // Obter alertas (busca por processos com alertas)
  async obterAlertas() {
    try {
      // Como não há endpoint específico de alertas, vamos buscar processos com filtros
      const hoje = new Date().toISOString().split('T')[0];
      const response = await api.get('busca/', {
        params: {
          q: 'vencido', // Termo de busca válido
          limit: 10
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter alertas:', error);
      // Retorna dados vazios em caso de erro para não quebrar a aplicação
      return {
        resultados: [],
        total_encontrados: 0
      };
    }
  }

  // Obter estatísticas avançadas
  async estatisticasAvancadas() {
    try {
      const response = await api.get('processos/estatisticas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas avançadas:', error);
      // Retorna dados vazios em caso de erro para não quebrar a aplicação
      return {
        por_status: {},
        por_prioridade: {},
        prazos_vencidos: 0,
        valor_total_multas: 0,
        processos_recentes: [],
        alertas: []
      };
    }
  }

  // ============================================================================
  // DOCUMENTOS DO PROCESSO
  // ============================================================================

  // Listar documentos de um processo
  async listarDocumentos(processoId) {
    try {
      const response = await api.get(`/api/processos/${processoId}/documentos/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  // Upload de documento para o processo
  async uploadDocumento(processoId, dadosDocumento) {
    try {
      const formData = new FormData();
      
      // Adicionar campos do documento
      Object.keys(dadosDocumento).forEach(key => {
        if (dadosDocumento[key] !== null && dadosDocumento[key] !== undefined) {
          formData.append(key, dadosDocumento[key]);
        }
      });
      
      const response = await api.post(
        `/api/processos/${processoId}/documentos/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      throw error;
    }
  }

  // Remover documento (método genérico - pode precisar de ajuste)
  async removerDocumento(documentoId) {
    try {
      // Como não há endpoint específico, tentamos o genérico
      const response = await api.delete(`/api/documentos/${documentoId}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      throw error;
    }
  }

  // ============================================================================
  // HISTÓRICO DO PROCESSO
  // ============================================================================

  // Obter histórico de um processo
  async obterHistorico(processoId) {
    try {
      const response = await api.get(`/api/processos/${processoId}/historico/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS UTILITÁRIOS
  // ============================================================================

  // Formatar valores monetários
  formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // Formatar datas
  formatarData(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  // Formatar data e hora
  formatarDataHora(dateString) {
    return new Date(dateString).toLocaleString('pt-BR');
  }

  // Obter cor do badge baseado no status (atualizado para modelo da fiscalização)
  getCorStatus(status) {
    const cores = {
      'aguardando_defesa': 'warning',
      'defesa_apresentada': 'info',
      'em_analise': 'info',
      'aguardando_recurso': 'warning',
      'recurso_apresentado': 'info',
      'julgamento': 'primary',
      'finalizado_procedente': 'success',
      'finalizado_improcedente': 'secondary',
      'arquivado': 'secondary',
      'prescrito': 'dark'
    };
    return cores[status] || 'secondary';
  }

  // Obter cor do badge baseado na prioridade
  getCorPrioridade(prioridade) {
    const cores = {
      'baixa': 'success',
      'normal': 'info',
      'alta': 'warning',
      'urgente': 'danger'
    };
    return cores[prioridade] || 'info';
  }

  // Verificar se o prazo está vencido (usando campo correto do modelo)
  isPrazoVencido(dataPrazo, status) {
    if (status !== 'aguardando_defesa') return false;
    
    const hoje = new Date();
    const prazo = new Date(dataPrazo);
    return prazo < hoje;
  }

  // Calcular dias restantes para o prazo
  calcularDiasRestantes(dataPrazo) {
    const hoje = new Date();
    const prazo = new Date(dataPrazo);
    const diffTime = prazo - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // ============================================================================
  // MÉTODOS LEGACY (COMPATIBILIDADE)
  // ============================================================================

  // Compatibilidade com código existente
  async dashboardProcessos() {
    return this.obterDashboard();
  }

  async atualizarStatusProcesso(id, novoStatus, observacoes = '') {
    return this.alterarStatus(id, novoStatus, observacoes);
  }

  async obterHistoricoProcesso(id) {
    return this.obterHistorico(id);
  }

  async uploadDocumentoProcesso(processoId, formData) {
    return this.uploadDocumento(processoId, formData);
  }

  async listarDocumentosProcesso(processoId) {
    return this.listarDocumentos(processoId);
  }
}

const processosService = new ProcessosService();

// Exportar tanto a instância quanto os métodos individuais para compatibilidade
export const {
  listarProcessos,
  obterProcesso,
  atualizarProcesso,
  alterarStatus,
  atribuirAnalista,
  obterDashboard,
  obterAlertas,
  estatisticasAvancadas,
  listarDocumentos,
  uploadDocumento,
  removerDocumento,
  obterHistorico,
  formatarValor,
  formatarData,
  formatarDataHora,
  getCorStatus,
  getCorPrioridade,
  isPrazoVencido,
  calcularDiasRestantes,
  // Métodos legacy
  dashboardProcessos,
  atualizarStatusProcesso,
  obterHistoricoProcesso,
  uploadDocumentoProcesso,
  listarDocumentosProcesso
} = processosService;

export default processosService;

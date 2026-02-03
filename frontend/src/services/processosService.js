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

  _normalizarNumeroProcesso(numero) {
    return (numero || '').replace(/\D/g, '');
  }

  async buscarProcessoPorNumero(numeroProcesso) {
    const termo = (numeroProcesso || '').trim();
    if (!termo) {
      return null;
    }

    try {
      const response = await api.get('processos/buscar/', {
        params: {
          termo,
          limite: 20,
        },
      });

      const resultados = response?.data?.results || [];
      if (resultados.length === 0) {
        return null;
      }

      const alvoNormalizado = this._normalizarNumeroProcesso(termo);
      const matchExato =
        resultados.find(
          (item) =>
            this._normalizarNumeroProcesso(item?.numero_processo) === alvoNormalizado
        ) || resultados[0];

      if (!matchExato?.id) {
        return null;
      }

      // Carrega o processo completo para termos os valores atualizados.
      return await this.obterProcesso(matchExato.id);
    } catch (error) {
      console.error('Erro ao buscar processo por numero:', error);
      return null;
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

  // Tramitar processo para outro setor (padrão: Jurídico 2 - Recursos)
  async tramitarProcesso(id, payload = {}) {
    try {
      const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
      const response = await api.post(`processos/${id}/tramitar/`, payload, config);
      return response.data;
    } catch (error) {
      console.error('Erro ao tramitar processo:', error);
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
      const response = await api.get(`processos/${processoId}/documentos/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  // Upload de documento para o processo
  async uploadDocumento(processoId, dadosDocumento) {
    try {
      const formData = dadosDocumento instanceof FormData
        ? dadosDocumento
        : (() => {
            const data = new FormData();
            Object.keys(dadosDocumento || {}).forEach((key) => {
              if (dadosDocumento[key] !== null && dadosDocumento[key] !== undefined) {
                data.append(key, dadosDocumento[key]);
              }
            });
            return data;
          })();

      const response = await api.post(
        `processos/${processoId}/documentos/upload/`,
        formData,
        formData instanceof FormData ? {} : {
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
  // PARECER TÉCNICO DO PROCESSO
  // ============================================================================

  async listarPareceres(processoId) {
    try {
      const response = await api.get(`processos/${processoId}/pareceres/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar pareceres:', error);
      throw error;
    }
  }

  // Importar dosimetria a partir do Excel (individual/coletiva)
  async registrarDosimetriaExcel(processoId, arquivo) {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);

      const response = await api.post(
        `processos/${processoId}/dosimetria-excel/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao importar dosimetria:', error);
      throw error;
    }
  }

  // Despacho manual ao DAF (gera protocolo, caixa e documento anexado)
  async despacharParaDaf(processoId, dados = {}) {
    try {
      const temArquivo = dados.arquivo instanceof File;
      const payload = temArquivo
        ? (() => {
            const formData = new FormData();
            formData.append('observacao', dados.observacao || '');
            formData.append('prazo_dias', dados.prazo_dias ?? 15);
            formData.append('arquivo', dados.arquivo);
            return formData;
          })()
        : {
            observacao: dados.observacao || '',
            prazo_dias: dados.prazo_dias ?? 15,
          };

      const response = await api.post(
        `processos/${processoId}/despachar-daf/`,
        payload,
        temArquivo
          ? {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          : {}
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao despachar para o DAF:', error);
      throw error;
    }
  }

  async criarParecer(processoId, dados) {
    try {
      const response = await api.post(`processos/${processoId}/pareceres/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar parecer:', error);
      throw error;
    }
  }

  async atualizarParecer(parecerId, dados) {
    try {
      const response = await api.patch(`processos/pareceres/${parecerId}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar parecer:', error);
      throw error;
    }
  }

  async excluirParecer(parecerId) {
    try {
      const response = await api.delete(`processos/pareceres/${parecerId}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir parecer:', error);
      throw error;
    }
  }

  async baixarParecerDocx(parecerId) {
    try {
      const response = await api.get(`processos/pareceres/${parecerId}/docx/`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Erro ao baixar parecer DOCX:', error);
      throw error;
    }
  }

  async baixarParecerPdf(parecerId) {
    try {
      const response = await api.get(`processos/pareceres/${parecerId}/pdf/`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Erro ao baixar parecer PDF:', error);
      throw error;
    }
  }

  // ============================================================================
  // HISTÓRICO DO PROCESSO
  // ============================================================================

  // Obter histórico de um processo
  async obterHistorico(processoId) {
    try {
      const response = await api.get(`processos/${processoId}/historico/`);
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

// Exportar tanto a instância quanto wrappers para manter o contexto (this)
export const listarProcessos = (...args) => processosService.listarProcessos(...args);
export const obterProcesso = (...args) => processosService.obterProcesso(...args);
export const atualizarProcesso = (...args) => processosService.atualizarProcesso(...args);
export const alterarStatus = (...args) => processosService.alterarStatus(...args);
export const atribuirAnalista = (...args) => processosService.atribuirAnalista(...args);
export const obterDashboard = (...args) => processosService.obterDashboard(...args);
export const obterAlertas = (...args) => processosService.obterAlertas(...args);
export const estatisticasAvancadas = (...args) => processosService.estatisticasAvancadas(...args);
export const listarDocumentos = (...args) => processosService.listarDocumentos(...args);
export const uploadDocumento = (...args) => processosService.uploadDocumento(...args);
export const removerDocumento = (...args) => processosService.removerDocumento(...args);
export const obterHistorico = (...args) => processosService.obterHistorico(...args);
export const formatarValor = (...args) => processosService.formatarValor(...args);
export const formatarData = (...args) => processosService.formatarData(...args);
export const formatarDataHora = (...args) => processosService.formatarDataHora(...args);
export const getCorStatus = (...args) => processosService.getCorStatus(...args);
export const getCorPrioridade = (...args) => processosService.getCorPrioridade(...args);
export const isPrazoVencido = (...args) => processosService.isPrazoVencido(...args);
export const calcularDiasRestantes = (...args) => processosService.calcularDiasRestantes(...args);
// Metodos legacy
export const dashboardProcessos = (...args) => processosService.dashboardProcessos(...args);
export const atualizarStatusProcesso = (...args) => processosService.atualizarStatusProcesso(...args);
export const obterHistoricoProcesso = (...args) => processosService.obterHistoricoProcesso(...args);
export const uploadDocumentoProcesso = (...args) => processosService.uploadDocumentoProcesso(...args);
export const listarDocumentosProcesso = (...args) => processosService.listarDocumentosProcesso(...args);

export default processosService;

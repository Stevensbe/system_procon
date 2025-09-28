import api from './api';

class TramitacaoService {
  // =========================================================================
  // === CONSULTAS E LISTAGENS ===
  // =========================================================================

  /**
   * Obter estatísticas gerais de tramitação
   */
  async obterEstatisticas() {
    try {
      const response = await api.get('/protocolo-tramitacao/estatisticas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Listar todas as tramitações com filtros e paginação
   */
  async listarTramitacoes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      // Adicionar filtros aos parâmetros
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/protocolo-tramitacao/tramitacoes/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tramitações:', error);
      throw error;
    }
  }

  /**
   * Listar tramitações pendentes
   */
  async listarTramitacoesPendentes() {
    try {
      const response = await api.get('/protocolo-tramitacao/tramitacoes-pendentes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tramitações pendentes:', error);
      throw error;
    }
  }

  /**
   * Listar tramitações recentes
   */
  async listarTramitacoesRecentes(limite = 10) {
    try {
      const response = await api.get(`/protocolo-tramitacao/tramitacoes/?limite=${limite}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tramitações recentes:', error);
      throw error;
    }
  }

  /**
   * Listar tramitações por protocolo
   */
  async listarTramitacoesPorProtocolo(protocoloId) {
    try {
      const response = await api.get(`/protocolo-tramitacao/tramitacoes/?protocolo=${protocoloId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tramitações do protocolo:', error);
      throw error;
    }
  }

  /**
   * Listar tramitações por setor
   */
  async listarTramitacoesPorSetor(setorId, tipo = 'destino') {
    try {
      const response = await api.get(`/protocolo-tramitacao/tramitacoes/?setor=${setorId}&tipo=${tipo}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tramitações do setor:', error);
      throw error;
    }
  }

  /**
   * Listar tramitações atrasadas
   */
  async listarTramitacoesAtrasadas() {
    try {
      const response = await api.get('/protocolo-tramitacao/tramitacoes/?atrasadas=true');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tramitações atrasadas:', error);
      throw error;
    }
  }

  // =========================================================================
  // === DETALHES E CONSULTAS ESPECÍFICAS ===
  // =========================================================================

  /**
   * Obter detalhes de uma tramitação específica
   */
  async obterTramitacao(id) {
    try {
      const response = await api.get(`/protocolo-tramitacao/tramitacoes/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter tramitação:', error);
      throw error;
    }
  }

  /**
   * Obter histórico completo de uma tramitação
   */
  async obterHistoricoTramitacao(id) {
    try {
      const response = await api.get(`/protocolo-tramitacao/tramitacoes/${id}/historico/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico da tramitação:', error);
      throw error;
    }
  }

  /**
   * Obter anexos de uma tramitação
   */
  async obterAnexosTramitacao(id) {
    try {
      const response = await api.get(`/protocolo-tramitacao/tramitacoes/${id}/anexos/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter anexos da tramitação:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CRIAÇÃO E EDIÇÃO ===
  // =========================================================================

  /**
   * Criar nova tramitação
   */
  async criarTramitacao(dados) {
    try {
      const response = await api.post('/protocolo-tramitacao/tramitacoes/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar tramitação:', error);
      throw error;
    }
  }

  /**
   * Atualizar tramitação existente
   */
  async atualizarTramitacao(id, dados) {
    try {
      const response = await api.put(`/tramitacao/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar tramitação:', error);
      throw error;
    }
  }

  /**
   * Atualizar parcialmente tramitação
   */
  async atualizarTramitacaoParcial(id, dados) {
    try {
      const response = await api.patch(`/protocolo-tramitacao/tramitacoes/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar tramitação parcialmente:', error);
      throw error;
    }
  }

  // =========================================================================
  // === AÇÕES ESPECÍFICAS ===
  // =========================================================================

  /**
   * Enviar tramitação
   */
  async enviarTramitacao(id, dados = {}) {
    try {
      const response = await api.post(`/protocolo-tramitacao/tramitacoes/${id}/enviar/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar tramitação:', error);
      throw error;
    }
  }

  /**
   * Receber tramitação
   */
  async receberTramitacao(id, dados = {}) {
    try {
      const response = await api.post(`/protocolo-tramitacao/tramitacoes/${id}/receber/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao receber tramitação:', error);
      throw error;
    }
  }

  /**
   * Cancelar tramitação
   */
  async cancelarTramitacao(id, motivo) {
    try {
      const response = await api.post(`/protocolo-tramitacao/tramitacoes/${id}/cancelar/`, { motivo });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar tramitação:', error);
      throw error;
    }
  }

  /**
   * Reenviar tramitação
   */
  async reenviarTramitacao(id, dados = {}) {
    try {
      const response = await api.post(`/protocolo-tramitacao/tramitacoes/${id}/reenviar/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao reenviar tramitação:', error);
      throw error;
    }
  }

  /**
   * Marcar como urgente
   */
  async marcarUrgente(id) {
    try {
      const response = await api.post(`/protocolo-tramitacao/tramitacoes/${id}/urgente/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar como urgente:', error);
      throw error;
    }
  }

  /**
   * Definir prazo para tramitação
   */
  async definirPrazo(id, prazo) {
    try {
      const response = await api.post(`/protocolo-tramitacao/tramitacoes/${id}/prazo/`, { prazo });
      return response.data;
    } catch (error) {
      console.error('Erro ao definir prazo:', error);
      throw error;
    }
  }

  // =========================================================================
  // === ANEXOS ===
  // =========================================================================

  /**
   * Upload de anexo para tramitação
   */
  async uploadAnexo(tramitacaoId, arquivo, descricao = '') {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('descricao', descricao);

      const response = await api.post(`/protocolo-tramitacao/tramitacoes/${tramitacaoId}/anexos/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload do anexo:', error);
      throw error;
    }
  }

  /**
   * Remover anexo de tramitação
   */
  async removerAnexo(tramitacaoId, anexoId) {
    try {
      const response = await api.delete(`/protocolo-tramitacao/tramitacoes/${tramitacaoId}/anexos/${anexoId}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS E ESTATÍSTICAS ===
  // =========================================================================

  /**
   * Gerar relatório de tramitações
   */
  async gerarRelatorio(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await api.get(`/protocolo-tramitacao/relatorio/?${params.toString()}`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Exportar tramitações
   */
  async exportarTramitacoes(filtros = {}, formato = 'xlsx') {
    try {
      const params = new URLSearchParams({ ...filtros, formato });
      const response = await api.get(`/protocolo-tramitacao/exportar/?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar tramitações:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas por período
   */
  async obterEstatisticasPorPeriodo(dataInicio, dataFim) {
    try {
      const response = await api.get('/protocolo-tramitacao/estatisticas/periodo/', {
        params: { data_inicio: dataInicio, data_fim: dataFim }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas por período:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas por setor
   */
  async obterEstatisticasPorSetor() {
    try {
      const response = await api.get('/protocolo-tramitacao/estatisticas/setores/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas por setor:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONFIGURAÇÕES E DADOS AUXILIARES ===
  // =========================================================================

  /**
   * Listar setores disponíveis
   */
  async listarSetores() {
    try {
      const response = await api.get('/protocolo-tramitacao/setores/');
      const data = response.data;
      return data?.results ?? data?.setores ?? data;
    } catch (error) {
      console.error('Erro ao listar setores:', error);
      throw error;
    }
  }

  /**
   * Listar tipos de documento
   */
  async listarTiposDocumento() {
    try {
      const response = await api.get('/protocolo-tramitacao/tipos-documento/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tipos de documento:', error);
      throw error;
    }
  }

  /**
   * Listar usuários disponíveis
   */
  async listarUsuarios() {
    try {
      const response = await api.get('/protocolo-tramitacao/usuarios/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  }

  /**
   * Obter configurações de tramitação
   */
  async obterConfiguracoes() {
    try {
      const response = await api.get('/protocolo-tramitacao/configuracoes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      throw error;
    }
  }

  // =========================================================================
  // === NOTIFICAÇÕES ===
  // =========================================================================

  /**
   * Enviar notificação sobre tramitação
   */
  async enviarNotificacao(tramitacaoId, tipo, destinatarios = []) {
    try {
      const response = await api.post(`/protocolo-tramitacao/tramitacoes/${tramitacaoId}/notificar/`, {
        tipo,
        destinatarios
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  /**
   * Obter notificações de tramitação
   */
  async obterNotificacoes(tramitacaoId) {
    try {
      const response = await api.get(`/protocolo-tramitacao/tramitacoes/${tramitacaoId}/notificacoes/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      throw error;
    }
  }

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  /**
   * Validar dados de tramitação
   */
  validarDadosTramitacao(dados) {
    const erros = [];

    if (!dados.protocolo) {
      erros.push('Protocolo é obrigatório');
    }

    if (!dados.setor_destino) {
      erros.push('Setor de destino é obrigatório');
    }

    if (!dados.data_tramitacao) {
      erros.push('Data de tramitação é obrigatória');
    }

    return erros;
  }

  /**
   * Formatar número de protocolo
   */
  formatarNumeroProtocolo(numero) {
    if (!numero) return 'N/A';
    return numero.toString().padStart(8, '0');
  }

  /**
   * Formatar status de tramitação
   */
  formatarStatus(status) {
    const statusMap = {
      'PENDENTE': { label: 'Pendente', color: 'yellow' },
      'ENVIADA': { label: 'Enviada', color: 'blue' },
      'RECEBIDA': { label: 'Recebida', color: 'green' },
      'ATRASADA': { label: 'Atrasada', color: 'red' },
      'CANCELADA': { label: 'Cancelada', color: 'gray' }
    };

    return statusMap[status] || { label: status, color: 'gray' };
  }

  /**
   * Calcular dias de atraso
   */
  calcularDiasAtraso(dataLimite) {
    if (!dataLimite) return 0;
    const hoje = new Date();
    const limite = new Date(dataLimite);
    const diffTime = hoje - limite;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Verificar se tramitação está atrasada
   */
  verificarAtraso(tramitacao) {
    if (!tramitacao.prazo_limite) return false;
    return this.calcularDiasAtraso(tramitacao.prazo_limite) > 0;
  }
}

export default new TramitacaoService();

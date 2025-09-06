import api from './api';

class AuditoriaService {
  // =========================================================================
  // === CONSULTAS E LISTAGENS ===
  // =========================================================================

  /**
   * Obter estatísticas gerais de auditoria
   */
  async obterEstatisticas() {
    try {
      const response = await api.get('/auditoria/dashboard/');
      return response.data.stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de auditoria:', error);
      throw error;
    }
  }

  /**
   * Listar logs do sistema com filtros
   */
  async listarLogs(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.nivel) params.append('nivel', filtros.nivel);
      if (filtros.tipo_evento) params.append('tipo_evento', filtros.tipo_evento);
      if (filtros.usuario) params.append('usuario', filtros.usuario);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      if (filtros.modulo) params.append('modulo', filtros.modulo);
      if (filtros.sucesso !== undefined) params.append('sucesso', filtros.sucesso);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/auditoria/logs/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar logs:', error);
      throw error;
    }
  }

  /**
   * Obter log específico por ID
   */
  async obterLog(id) {
    try {
      const response = await api.get(`/auditoria/logs/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter log:', error);
      throw error;
    }
  }

  /**
   * Obter logs por nível (últimos 30 dias)
   */
  async obterLogsPorNivel() {
    try {
      const response = await api.get('/auditoria/logs-por-nivel/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter logs por nível:', error);
      throw error;
    }
  }

  /**
   * Obter eventos mais frequentes
   */
  async obterEventosFrequentes() {
    try {
      const response = await api.get('/auditoria/eventos-frequentes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter eventos frequentes:', error);
      throw error;
    }
  }

  /**
   * Obter logs críticos recentes
   */
  async obterLogsCriticos() {
    try {
      const response = await api.get('/auditoria/logs-criticos/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter logs críticos:', error);
      throw error;
    }
  }

  /**
   * Obter logs recentes
   */
  async obterLogsRecentes() {
    try {
      const response = await api.get('/auditoria/logs-recentes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter logs recentes:', error);
      throw error;
    }
  }

  /**
   * Filtrar logs com parâmetros específicos
   */
  async filtrarLogs(filtros) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/auditoria/filtrar/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao filtrar logs:', error);
      throw error;
    }
  }

  // =========================================================================
  // === TIPOS DE EVENTO ===
  // =========================================================================

  /**
   * Listar tipos de evento
   */
  async listarTiposEvento() {
    try {
      const response = await api.get('/auditoria/tipos-evento/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tipos de evento:', error);
      throw error;
    }
  }

  /**
   * Obter tipo de evento por ID
   */
  async obterTipoEvento(id) {
    try {
      const response = await api.get(`/auditoria/tipos-evento/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter tipo de evento:', error);
      throw error;
    }
  }

  /**
   * Criar novo tipo de evento
   */
  async criarTipoEvento(dados) {
    try {
      const response = await api.post('/auditoria/tipos-evento/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar tipo de evento:', error);
      throw error;
    }
  }

  /**
   * Atualizar tipo de evento
   */
  async atualizarTipoEvento(id, dados) {
    try {
      const response = await api.put(`/auditoria/tipos-evento/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar tipo de evento:', error);
      throw error;
    }
  }

  /**
   * Excluir tipo de evento
   */
  async excluirTipoEvento(id) {
    try {
      await api.delete(`/auditoria/tipos-evento/${id}/`);
    } catch (error) {
      console.error('Erro ao excluir tipo de evento:', error);
      throw error;
    }
  }

  // =========================================================================
  // === RELATÓRIOS E EXPORTAÇÃO ===
  // =========================================================================

  /**
   * Exportar logs
   */
  async exportarLogs(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/auditoria/exportar/?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `auditoria_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      throw error;
    }
  }

  /**
   * Gerar relatório de auditoria
   */
  async gerarRelatorio(dados) {
    try {
      const response = await api.post('/auditoria/relatorios/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Obter relatórios disponíveis
   */
  async obterRelatorios() {
    try {
      const response = await api.get('/auditoria/relatorios/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter relatórios:', error);
      throw error;
    }
  }

  // =========================================================================
  // === CONFIGURAÇÕES ===
  // =========================================================================

  /**
   * Obter configurações de auditoria
   */
  async obterConfiguracoes() {
    try {
      const response = await api.get('/auditoria/configuracoes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações de auditoria
   */
  async atualizarConfiguracoes(dados) {
    try {
      const response = await api.put('/auditoria/configuracoes/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  // =========================================================================
  // === LOGS DE SEGURANÇA ===
  // =========================================================================

  /**
   * Listar logs de segurança
   */
  async listarLogsSeguranca(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/auditoria/logs-seguranca/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar logs de segurança:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de segurança
   */
  async obterEstatisticasSeguranca() {
    try {
      const response = await api.get('/auditoria/estatisticas-seguranca/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de segurança:', error);
      throw error;
    }
  }

  // =========================================================================
  // === SESSÕES DE USUÁRIO ===
  // =========================================================================

  /**
   * Listar sessões de usuário
   */
  async listarSessoesUsuario(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/auditoria/sessoes-usuario/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar sessões de usuário:', error);
      throw error;
    }
  }

  /**
   * Encerrar sessão de usuário
   */
  async encerrarSessao(sessionKey) {
    try {
      await api.post(`/auditoria/sessoes-usuario/${sessionKey}/encerrar/`);
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      throw error;
    }
  }

  // =========================================================================
  // === BACKUP E RESTAURAÇÃO ===
  // =========================================================================

  /**
   * Listar logs de backup
   */
  async listarLogsBackup() {
    try {
      const response = await api.get('/auditoria/logs-backup/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar logs de backup:', error);
      throw error;
    }
  }

  /**
   * Iniciar backup
   */
  async iniciarBackup(dados) {
    try {
      const response = await api.post('/auditoria/backup/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar backup:', error);
      throw error;
    }
  }

  /**
   * Restaurar backup
   */
  async restaurarBackup(backupId) {
    try {
      const response = await api.post(`/auditoria/backup/${backupId}/restaurar/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  /**
   * Limpar logs antigos
   */
  async limparLogsAntigos(dias = 90) {
    try {
      const response = await api.post('/auditoria/limpar-logs/', { dias });
      return response.data;
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      throw error;
    }
  }

  /**
   * Validar dados de log
   */
  validarDadosLog(dados) {
    const erros = [];

    if (!dados.acao) {
      erros.push('Ação é obrigatória');
    }

    if (!dados.descricao) {
      erros.push('Descrição é obrigatória');
    }

    if (!dados.nivel) {
      erros.push('Nível é obrigatório');
    }

    return erros;
  }

  /**
   * Formatar nível de log
   */
  formatarNivel(nivel) {
    const niveis = {
      'CRITICAL': 'Crítico',
      'ERROR': 'Erro',
      'WARNING': 'Aviso',
      'INFO': 'Informação',
      'DEBUG': 'Debug'
    };
    return niveis[nivel] || nivel;
  }

  /**
   * Formatar categoria de evento
   */
  formatarCategoria(categoria) {
    const categorias = {
      'sistema': 'Sistema',
      'usuario': 'Usuário',
      'processo': 'Processo',
      'financeiro': 'Financeiro',
      'fiscalizacao': 'Fiscalização',
      'seguranca': 'Segurança'
    };
    return categorias[categoria] || categoria;
  }

  /**
   * Formatar data/hora
   */
  formatarDataHora(data) {
    return new Date(data).toLocaleString('pt-BR');
  }

  /**
   * Formatar duração
   */
  formatarDuracao(ms) {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Verificar se log é crítico
   */
  isLogCritico(log) {
    return log.nivel === 'CRITICAL' || log.nivel === 'ERROR';
  }

  /**
   * Verificar se log é de segurança
   */
  isLogSeguranca(log) {
    return log.tipo_evento?.categoria === 'seguranca';
  }

  /**
   * Obter cor do nível
   */
  getNivelColor(nivel) {
    const cores = {
      'CRITICAL': '#dc2626',
      'ERROR': '#ea580c',
      'WARNING': '#d97706',
      'INFO': '#059669',
      'DEBUG': '#3b82f6'
    };
    return cores[nivel] || '#6b7280';
  }
}

export default new AuditoriaService();

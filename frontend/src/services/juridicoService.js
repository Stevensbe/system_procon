import api from './api';

const juridicoService = {
  // =========================================================================
  // === CONFIGURAÇÕES JURÍDICAS ===
  // =========================================================================
  
  getConfiguracoes: async () => {
    try {
      const response = await api.get('/juridico/configuracoes/');
      return response;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw error;
    }
  },

  salvarConfiguracoes: async (configuracoes) => {
    try {
      const response = await api.post('/juridico/configuracoes/', configuracoes);
      return response;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  },

  restaurarConfiguracoesPadrao: async () => {
    try {
      const response = await api.post('/juridico/configuracoes/restaurar/');
      return response;
    } catch (error) {
      console.error('Erro ao restaurar configurações:', error);
      throw error;
    }
  },

  // =========================================================================
  // === DOCUMENTOS JURÍDICOS ===
  // =========================================================================

  listarDocumentos: async (params = '') => {
    try {
      const response = await api.get(`/juridico/documentos/?${params}`);
      return response;
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  },

  getDocumento: async (id) => {
    try {
      const response = await api.get(`/juridico/documentos/${id}/`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      throw error;
    }
  },

  criarDocumento: async (documento) => {
    try {
      const formData = new FormData();
      
      // Adicionar campos básicos
      Object.keys(documento).forEach(key => {
        if (key !== 'arquivo') {
          formData.append(key, documento[key]);
        }
      });
      
      // Adicionar arquivo se existir
      if (documento.arquivo) {
        formData.append('arquivo', documento.arquivo);
      }
      
      const response = await api.post('/juridico/documentos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      throw error;
    }
  },

  atualizarDocumento: async (id, documento) => {
    try {
      const formData = new FormData();
      
      // Adicionar campos básicos
      Object.keys(documento).forEach(key => {
        if (key !== 'arquivo') {
          formData.append(key, documento[key]);
        }
      });
      
      // Adicionar arquivo se existir
      if (documento.arquivo) {
        formData.append('arquivo', documento.arquivo);
      }
      
      const response = await api.put(`/juridico/documentos/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      throw error;
    }
  },

  excluirDocumento: async (id) => {
    try {
      const response = await api.delete(`/juridico/documentos/${id}/`);
      return response;
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      throw error;
    }
  },

  baixarDocumento: async (id) => {
    try {
      const response = await api.get(`/juridico/documentos/${id}/download/`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      throw error;
    }
  },

  // =========================================================================
  // === HISTÓRICOS JURÍDICOS ===
  // =========================================================================

  listarHistoricos: async (params = '') => {
    try {
      const response = await api.get(`/juridico/historico/?${params}`);
      return response;
    } catch (error) {
      console.error('Erro ao listar históricos:', error);
      throw error;
    }
  },

  getHistoricoDetalhado: async (id) => {
    try {
      const response = await api.get(`/juridico/historico/${id}/`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar histórico detalhado:', error);
      throw error;
    }
  },

  exportarHistorico: async (params = '', formato = 'pdf') => {
    try {
      const response = await api.get(`/juridico/historico/exportar/?${params}&formato=${formato}`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Erro ao exportar histórico:', error);
      throw error;
    }
  },

  // =========================================================================
  // === PROCESSOS JURÍDICOS ===
  // =========================================================================

  listarProcessos: async (params = '') => {
    try {
      const response = await api.get(`/juridico/processos/?${params}`);
      return response;
    } catch (error) {
      console.error('Erro ao listar processos:', error);
      throw error;
    }
  },

  getProcesso: async (id) => {
    try {
      const response = await api.get(`/juridico/processos/${id}/`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar processo:', error);
      throw error;
    }
  },

  criarProcesso: async (processo) => {
    try {
      const response = await api.post(`/juridico/processos/`, processo);
      return response;
    } catch (error) {
      console.error('Erro ao criar processo:', error);
      throw error;
    }
  },

  atualizarProcesso: async (id, processo) => {
    try {
      const response = await api.put(`/juridico/processos/${id}/`, processo);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
      throw error;
    }
  },

  excluirProcesso: async (id) => {
    try {
      const response = await api.delete(`/juridico/processos/${id}/`);
      return response;
    } catch (error) {
      console.error('Erro ao excluir processo:', error);
      throw error;
    }
  },

  // =========================================================================
  // === ANÁLISES JURÍDICAS ===
  // =========================================================================

  listarAnalises: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/juridico/analises/?${queryString}`);
      return response;
    } catch (error) {
      console.error('Erro ao listar análises:', error);
      throw error;
    }
  },

  getAnalise: async (id) => {
    try {
      const response = await api.get(`/juridico/analises/${id}/`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      throw error;
    }
  },

  criarAnalise: async (analise) => {
    try {
      const response = await api.post(`/juridico/analises/`, analise);
      return response;
    } catch (error) {
      console.error('Erro ao criar análise:', error);
      throw error;
    }
  },

  atualizarAnalise: async (id, analise) => {
    try {
      const response = await api.put(`/juridico/analises/${id}/`, analise);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar análise:', error);
      throw error;
    }
  },

  excluirAnalise: async (id) => {
    try {
      const response = await api.delete(`/juridico/analises/${id}/`);
      return response;
    } catch (error) {
      console.error('Erro ao excluir análise:', error);
      throw error;
    }
  },

  // =========================================================================
  // === DASHBOARD E ESTATÍSTICAS ===
  // =========================================================================

  getDashboardData: async () => {
    try {
      const response = await api.get(`/juridico/dashboard/`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  },

  getEstatisticas: async () => {
    try {
      const response = await api.get(`/juridico/estatisticas/`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  // =========================================================================
  // === RELATÓRIOS ===
  // =========================================================================

  gerarRelatorio: async (tipo, params = {}) => {
    try {
      const response = await api.post(`/juridico/relatorios/${tipo}/`, params, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  },

  // =========================================================================
  // === UTILITÁRIOS ===
  // =========================================================================

  // Simular dados para desenvolvimento
  getMockData: () => {
    return {
      configuracoes: {
        prazo_analise_inicial: 15,
        prazo_analise_complementar: 10,
        prazo_resposta_empresa: 30,
        prazo_recurso: 10,
        prazo_apelacao: 15,
        numeracao_automatica: true,
        prefixo_processo: 'PROC',
        ano_atual: new Date().getFullYear(),
        sequencial_inicial: 1,
        alerta_prazo_vencendo: 5,
        alerta_prazo_vencido: 1,
        notificar_analista: true,
        notificar_coordenador: true,
        notificar_email: true,
        notificar_sistema: true,
        template_parecer_padrao: 'Template padrão para pareceres jurídicos...',
        template_resposta_padrao: 'Template padrão para respostas...',
        assinatura_digital_obrigatoria: true,
        revisao_obrigatoria: true,
        permissao_criar_processo: ['analista', 'coordenador', 'admin'],
        permissao_editar_processo: ['analista', 'coordenador', 'admin'],
        permissao_excluir_processo: ['coordenador', 'admin'],
        permissao_visualizar_todos: ['coordenador', 'admin'],
        relatorio_automatico: true,
        frequencia_relatorio: 'semanal',
        incluir_estatisticas: true,
        incluir_graficos: true
      },
      documentos: [
        {
          id: 1,
          titulo: 'Parecer sobre Processo 2024/001',
          descricao: 'Análise jurídica sobre irregularidades encontradas',
          tipo_documento: 'PARECER',
          status: 'APROVADO',
          processo: { id: 1, numero: '2024/001' },
          analista: { id: 1, nome: 'Dr. João Silva' },
          data_criacao: '2024-01-15T10:30:00Z',
          tags: 'parecer, análise, irregularidade'
        },
        {
          id: 2,
          titulo: 'Resposta à Empresa ABC Ltda',
          descricao: 'Resposta oficial sobre questionamentos da empresa',
          tipo_documento: 'RESPOSTA',
          status: 'PUBLICADO',
          processo: { id: 2, numero: '2024/002' },
          analista: { id: 2, nome: 'Dra. Maria Santos' },
          data_criacao: '2024-01-20T14:15:00Z',
          tags: 'resposta, empresa, questionamento'
        }
      ],
      historicos: [
        {
          id: 1,
          titulo: 'Processo criado',
          descricao: 'Novo processo jurídico foi criado no sistema',
          tipo_acao: 'CRIACAO',
          severidade: 'INFO',
          modulo: 'PROCESSO',
          entidade: 'ProcessoJuridico',
          entidade_id: 1,
          data_hora: '2024-01-15T10:30:00Z',
          usuario: { id: 1, nome: 'Dr. João Silva', email: 'joao.silva@procon.am.gov.br', perfil: 'Analista' },
          ip_address: '192.168.1.100',
          session_id: 'sess_123456',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          duracao: 1500,
          dados_anteriores: null,
          dados_novos: { numero: '2024/001', parte: 'Empresa ABC Ltda', assunto: 'Irregularidade comercial' }
        },
        {
          id: 2,
          titulo: 'Documento editado',
          descricao: 'Parecer jurídico foi modificado',
          tipo_acao: 'EDICAO',
          severidade: 'MEDIA',
          modulo: 'DOCUMENTO',
          entidade: 'DocumentoJuridico',
          entidade_id: 1,
          data_hora: '2024-01-16T09:45:00Z',
          usuario: { id: 1, nome: 'Dr. João Silva', email: 'joao.silva@procon.am.gov.br', perfil: 'Analista' },
          ip_address: '192.168.1.100',
          session_id: 'sess_123456',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          duracao: 2300,
          dados_anteriores: { status: 'RASCUNHO', conteudo: 'Conteúdo anterior...' },
          dados_novos: { status: 'EM_REVISAO', conteudo: 'Conteúdo atualizado...' }
        }
      ]
    };
  }
};

export default juridicoService;

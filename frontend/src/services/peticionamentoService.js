import api from './api';

class PeticionamentoService {
  // === PETIÇÕES ===
  
  /**
   * Lista petições com filtros
   */
  async listarPeticoes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });

      const response = await api.get(`/peticionamento/peticoes/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar petições:', error);
      throw error;
    }
  }
  
  /**
   * Busca petição por ID
   */
  async obterPeticao(id) {
    try {
      const response = await api.get(`/peticionamento/peticoes/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter petição:', error);
      throw error;
    }
  }
  
  /**
   * Cria nova petição
   */
  async criarPeticao(dados) {
    try {
      const response = await api.post('/peticionamento/peticoes/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar petição:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza petição
   */
  async atualizarPeticao(id, dados) {
    const response = await api.patch(`/peticionamento/api/peticoes/${id}/`, dados);
    return response.data;
  }
  
  /**
   * Nova petição via portal do cidadão
   */
  async novaPeticaoPortal(dados, anexos = []) {
    const formData = new FormData();
    
    // Adicionar dados da petição
    Object.keys(dados).forEach(key => {
      if (dados[key] !== null && dados[key] !== undefined) {
        formData.append(key, dados[key]);
      }
    });
    
    // Adicionar anexos
    anexos.forEach((arquivo, index) => {
      formData.append(`anexos[${index}]`, arquivo);
    });
    
    const response = await api.post('/peticionamento/api/portal/nova-peticao/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  
  /**
   * Consulta petição no portal
   */
  async consultarPeticaoPortal(numeroPeticao, documento) {
    const response = await api.post('/peticionamento/api/portal/consultar/', {
      numero_peticao: numeroPeticao,
      documento: documento
    });
    return response.data;
  }
  
  /**
   * Detalhe da petição no portal
   */
  async detalhePeticaoPortal(numeroPeticao) {
    const response = await api.get(`/peticionamento/api/portal/peticao/${numeroPeticao}/`);
    return response.data;
  }
  
  // === TIPOS DE PETIÇÃO ===
  
  /**
   * Lista tipos de petição
   */
  async listarTiposPeticao(ativo = true) {
    const params = ativo ? '?ativo=true' : '';
    const response = await api.get(`/peticionamento/api/tipos-peticao/${params}`);
    return response.data;
  }
  
  /**
   * Cria tipo de petição
   */
  async criarTipoPeticao(dados) {
    const response = await api.post('/peticionamento/api/tipos-peticao/', dados);
    return response.data;
  }
  
  /**
   * Atualiza tipo de petição
   */
  async atualizarTipoPeticao(id, dados) {
    const response = await api.patch(`/peticionamento/api/tipos-peticao/${id}/`, dados);
    return response.data;
  }
  
  // === ANEXOS ===
  
  /**
   * Lista anexos de uma petição
   */
  async listarAnexos(peticaoId) {
    const response = await api.get(`/peticionamento/api/anexos/?peticao=${peticaoId}`);
    return response.data;
  }
  
  /**
   * Upload de anexo
   */
  async uploadAnexo(peticaoId, arquivo, tipoAnexo = 'DOCUMENTO', descricao = '') {
    const formData = new FormData();
    formData.append('peticao', peticaoId);
    formData.append('arquivo', arquivo);
    formData.append('tipo_anexo', tipoAnexo);
    formData.append('descricao', descricao);
    formData.append('nome_arquivo', arquivo.name);
    formData.append('tipo_mime', arquivo.type);
    formData.append('tamanho_bytes', arquivo.size);
    
    const response = await api.post('/peticionamento/api/upload-anexo/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  
  /**
   * Remove anexo
   */
  async removerAnexo(anexoId) {
    const response = await api.delete(`/peticionamento/api/anexos/${anexoId}/`);
    return response.data;
  }
  
  // === INTERAÇÕES E RESPOSTAS ===
  
  /**
   * Lista interações de uma petição
   */
  async listarInteracoes(peticaoId) {
    const response = await api.get(`/peticionamento/api/interacoes/?peticao=${peticaoId}`);
    return response.data;
  }
  
  /**
   * Adiciona interação
   */
  async adicionarInteracao(dados) {
    const response = await api.post('/peticionamento/api/interacoes/', dados);
    return response.data;
  }
  
  /**
   * Lista respostas de uma petição
   */
  async listarRespostas(peticaoId) {
    const response = await api.get(`/peticionamento/api/respostas/?peticao=${peticaoId}`);
    return response.data;
  }
  
  /**
   * Cria resposta à petição
   */
  async criarResposta(dados) {
    const response = await api.post('/peticionamento/api/respostas/', dados);
    return response.data;
  }
  
  // === GESTÃO INTERNA ===
  
  /**
   * Recebe petição para análise
   */
  async receberPeticao(peticaoId, observacoes = '') {
    const response = await api.post(`/peticionamento/gestao/peticao/${peticaoId}/receber/`, {
      observacoes
    });
    return response.data;
  }
  
  /**
   * Responde petição
   */
  async responderPeticao(peticaoId, dados) {
    const response = await api.post(`/peticionamento/gestao/peticao/${peticaoId}/responder/`, dados);
    return response.data;
  }
  
  // === ESTATÍSTICAS E RELATÓRIOS ===
  
  /**
   * Obtém estatísticas do dashboard
   */
  async obterEstatisticas() {
    const response = await api.get('/peticionamento/api/estatisticas/');
    return response.data;
  }
  
  /**
   * Dados do dashboard
   */
  async obterDadosDashboard() {
    const response = await api.get('/peticionamento/api/dashboard-dados/');
    return response.data;
  }
  
  /**
   * Lista petições pendentes
   */
  async listarPeticoesPendentes() {
    const response = await api.get('/peticionamento/api/peticoes-pendentes/');
    return response.data;
  }
  
  // === NOTIFICAÇÕES ===
  
  /**
   * Lista notificações
   */
  async listarNotificacoes() {
    const response = await api.get('/peticionamento/api/notificacoes/');
    return response.data;
  }
  
  /**
   * Marca notificação como lida
   */
  async marcarNotificacaoLida(notificacaoId) {
    const response = await api.post(`/peticionamento/api/marcar-notificacao-lida/${notificacaoId}/`);
    return response.data;
  }
  
  // === VALIDAÇÕES ===
  
  /**
   * Valida documento (CPF/CNPJ)
   */
  async validarDocumento(documento) {
    const response = await api.post('/peticionamento/api/validar-documento/', {
      documento
    });
    return response.data;
  }
  
  // === UTILIDADES ===
  
  /**
   * Formata número da petição
   */
  formatarNumeroPeticao(numero) {
    if (!numero) return '';
    
    // Padrão: PET-AAAA-NNNNNNN (PET-Ano-Sequencial)
    const str = numero.toString().replace(/[^\d]/g, '');
    if (str.length >= 7) {
      const ano = str.substring(0, 4);
      const sequencial = str.substring(4);
      return `PET-${ano}-${sequencial.padStart(7, '0')}`;
    }
    return numero;
  }
  
  /**
   * Calcula dias desde a criação
   */
  calcularDiasPeticao(dataCriacao) {
    if (!dataCriacao) return 0;
    const criacao = new Date(dataCriacao);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - criacao);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  /**
   * Verifica se petição está em atraso
   */
  verificarAtraso(dataCriacao, prazoDias) {
    if (!dataCriacao || !prazoDias) return false;
    const diasPeticao = this.calcularDiasPeticao(dataCriacao);
    return diasPeticao > prazoDias;
  }
  
  /**
   * Formata status da petição
   */
  formatarStatus(status) {
    const statusMap = {
      'RASCUNHO': { label: 'Rascunho', color: 'gray', icon: '📝' },
      'ENVIADA': { label: 'Enviada', color: 'blue', icon: '📤' },
      'RECEBIDA': { label: 'Recebida', color: 'green', icon: '📥' },
      'EM_ANALISE': { label: 'Em Análise', color: 'yellow', icon: '🔍' },
      'PENDENTE_DOCUMENTACAO': { label: 'Pendente Documentação', color: 'orange', icon: '📋' },
      'RESPONDIDA': { label: 'Respondida', color: 'purple', icon: '✉️' },
      'FINALIZADA': { label: 'Finalizada', color: 'green', icon: '✅' },
      'ARQUIVADA': { label: 'Arquivada', color: 'gray', icon: '📁' },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
  }
  
  /**
   * Formata categoria da petição
   */
  formatarCategoria(categoria) {
    const categoriaMap = {
      'DENUNCIA': { label: 'Denúncia', color: 'red', icon: '⚠️' },
      'RECLAMACAO': { label: 'Reclamação', color: 'orange', icon: '😠' },
      'SOLICITACAO': { label: 'Solicitação', color: 'blue', icon: '📝' },
      'RECURSO': { label: 'Recurso', color: 'purple', icon: '⚖️' },
      'OUTROS': { label: 'Outros', color: 'gray', icon: '📄' },
    };
    
    return categoriaMap[categoria] || { label: categoria, color: 'gray', icon: '❓' };
  }
  
  /**
   * Valida CPF
   */
  validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    cpf = cpf.split('').map(el => +el);
    const rest = (count) => {
      return (cpf.slice(0, count-12).reduce((soma, el, index) => (soma + el * (count-index)), 0) * 10) % 11 % 10;
    };
    return rest(10) === cpf[9] && rest(11) === cpf[10];
  }
  
  /**
   * Valida CNPJ
   */
  validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14) return false;
    if (!!cnpj.match(/(\d)\1{13}/)) return false;
    cnpj = cnpj.split('').map(el => +el);
    const rest = (count) => {
      return (cnpj.slice(0, count-7).reduce((soma, el, index) => (soma + el * ((count-index) >= 2 ? (count-index) : (count-index+8))), 0) * 10) % 11 % 10;
    };
    return rest(12) === cnpj[12] && rest(13) === cnpj[13];
  }
  
  /**
   * Formata CPF/CNPJ
   */
  formatarCPFCNPJ(valor) {
    valor = valor.replace(/[^\d]/g, '');
    if (valor.length <= 11) {
      return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  }
  
  /**
   * Formata telefone
   */
  formatarTelefone(valor) {
    valor = valor.replace(/[^\d]/g, '');
    if (valor.length <= 10) {
      return valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  }
}

export default new PeticionamentoService();
import api from './api';

class ProtocoloTramitacaoService {
  // === PROTOCOLOS ===
  
  /**
   * Lista protocolos com filtros
   */
  async listarProtocolos(filtros = {}) {
    const params = new URLSearchParams(filtros);
    const response = await api.get(`/protocolo-tramitacao/protocolos/?${params}`);
    return response.data;
  }
  
  /**
   * Busca protocolo por ID
   */
  async obterProtocolo(id) {
    const response = await api.get(`/protocolo-tramitacao/protocolos/${id}/`);
    return response.data;
  }
  
  /**
   * Cria novo protocolo
   */
  async criarProtocolo(dados) {
    const response = await api.post('/protocolo-tramitacao/protocolos/', dados);
    return response.data;
  }
  
  /**
   * Atualiza protocolo
   */
  async atualizarProtocolo(id, dados) {
    const response = await api.patch(`/protocolo-tramitacao/protocolos/${id}/`, dados);
    return response.data;
  }
  
  /**
   * Consulta protocolo por número
   */
  async consultarPorNumero(numeroProtocolo) {
    const response = await api.get(`/protocolo-tramitacao/protocolos/?numero_protocolo=${numeroProtocolo}`);
    return response.data;
  }
  
  // === TRAMITAÇÕES ===
  
  /**
   * Lista tramitações de um protocolo
   */
  async listarTramitacoes(protocoloId) {
    const response = await api.get(`/protocolo-tramitacao/tramitacoes/?protocolo=${protocoloId}`);
    return response.data;
  }
  
  /**
   * Cria nova tramitação
   */
  async criarTramitacao(dados) {
    const response = await api.post('/protocolo-tramitacao/tramitacoes/', dados);
    return response.data;
  }
  
  /**
   * Recebe tramitação
   */
  async receberTramitacao(tramitacaoId, observacoes = '') {
    const response = await api.post(`/protocolo-tramitacao/receber/${tramitacaoId}/`, {
      observacoes
    });
    return response.data;
  }
  
  /**
   * Tramita documento para outro setor
   */
  async tramitarDocumento(protocoloId, dados) {
    const response = await api.post(`/protocolo-tramitacao/tramitar/${protocoloId}/`, dados);
    return response.data;
  }
  
  // === TIPOS DE DOCUMENTO ===
  
  /**
   * Lista tipos de documento
   */
  async listarTiposDocumento() {
    const response = await api.get('/protocolo-tramitacao/tipos-documento/');
    return response.data;
  }
  
  /**
   * Cria tipo de documento
   */
  async criarTipoDocumento(dados) {
    const response = await api.post('/protocolo-tramitacao/tipos-documento/', dados);
    return response.data;
  }
  
  // === SETORES ===
  
  /**
   * Lista setores
   */
  async listarSetores() {
    const response = await api.get('/protocolo-tramitacao/setores/');
    return response.data;
  }
  
  /**
   * Cria setor
   */
  async criarSetor(dados) {
    const response = await api.post('/protocolo-tramitacao/setores/', dados);
    return response.data;
  }
  
  // === ANEXOS ===
  
  /**
   * Lista anexos de um protocolo
   */
  async listarAnexos(protocoloId) {
    const response = await api.get(`/protocolo-tramitacao/anexos/?protocolo=${protocoloId}`);
    return response.data;
  }
  
  /**
   * Upload de anexo
   */
  async uploadAnexo(protocoloId, arquivo, descricao = '') {
    const formData = new FormData();
    formData.append('protocolo', protocoloId);
    formData.append('arquivo', arquivo);
    formData.append('descricao', descricao);
    formData.append('nome_arquivo', arquivo.name);
    formData.append('tipo_mime', arquivo.type);
    formData.append('tamanho_bytes', arquivo.size);
    
    const response = await api.post('/protocolo-tramitacao/anexos/', formData, {
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
    const response = await api.delete(`/protocolo-tramitacao/anexos/${anexoId}/`);
    return response.data;
  }
  
  // === ESTATÍSTICAS E RELATÓRIOS ===
  
  /**
   * Obtém estatísticas do dashboard
   */
  async obterEstatisticas() {
    const response = await api.get('/protocolo-tramitacao/estatisticas/');
    return response.data;
  }
  
  /**
   * Lista pendências
   */
  async listarPendencias() {
    const response = await api.get('/protocolo-tramitacao/pendencias/');
    return response.data;
  }
  
  /**
   * Lista tramitações pendentes
   */
  async listarTramitacoesPendentes() {
    const response = await api.get('/protocolo-tramitacao/tramitacoes-pendentes/');
    return response.data;
  }
  
  /**
   * Relatório por setor
   */
  async relatorioPorSetor(filtros = {}) {
    const params = new URLSearchParams(filtros);
    const response = await api.get(`/protocolo-tramitacao/relatorio/por-setor/?${params}`);
    return response.data;
  }
  
  /**
   * Relatório por status
   */
  async relatorioPorStatus(filtros = {}) {
    const params = new URLSearchParams(filtros);
    const response = await api.get(`/protocolo-tramitacao/relatorio/por-status/?${params}`);
    return response.data;
  }
  
  /**
   * Relatório por prazo
   */
  async relatorioPorPrazo(filtros = {}) {
    const params = new URLSearchParams(filtros);
    const response = await api.get(`/protocolo-tramitacao/relatorio/por-prazo/?${params}`);
    return response.data;
  }
  
  // === UTILIDADES ===
  
  /**
   * Formata número do protocolo
   */
  formatarNumeroProtocolo(numero) {
    if (!numero) return '';
    
    // Padrão: AAAA-NNNNNNN (Ano-Sequencial)
    const str = numero.toString();
    if (str.length >= 7) {
      const ano = str.substring(0, 4);
      const sequencial = str.substring(4);
      return `${ano}-${sequencial.padStart(7, '0')}`;
    }
    return str;
  }
  
  /**
   * Calcula dias em tramitação
   */
  calcularDiasEmTramitacao(dataInicio) {
    if (!dataInicio) return 0;
    const inicio = new Date(dataInicio);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  /**
   * Verifica se protocolo está em atraso
   */
  verificarAtraso(dataInicio, prazoDias) {
    if (!dataInicio || !prazoDias) return false;
    const diasTramitacao = this.calcularDiasEmTramitacao(dataInicio);
    return diasTramitacao > prazoDias;
  }
  
  /**
   * Formata status do protocolo
   */
  formatarStatus(status) {
    const statusMap = {
      'PROTOCOLADO': { label: 'Protocolado', color: 'blue', icon: '📄' },
      'EM_TRAMITACAO': { label: 'Em Tramitação', color: 'yellow', icon: '🔄' },
      'PENDENTE': { label: 'Pendente', color: 'red', icon: '⏰' },
      'FINALIZADO': { label: 'Finalizado', color: 'green', icon: '✅' },
      'ARQUIVADO': { label: 'Arquivado', color: 'gray', icon: '📁' },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
  }
  
  /**
   * Formata prioridade
   */
  formatarPrioridade(prioridade) {
    const prioridadeMap = {
      'BAIXA': { label: 'Baixa', color: 'green', icon: '🟢' },
      'NORMAL': { label: 'Normal', color: 'blue', icon: '🔵' },
      'ALTA': { label: 'Alta', color: 'orange', icon: '🟠' },
      'URGENTE': { label: 'Urgente', color: 'red', icon: '🔴' },
    };
    
    return prioridadeMap[prioridade] || { label: prioridade, color: 'gray', icon: '⚪' };
  }
}

export default new ProtocoloTramitacaoService();
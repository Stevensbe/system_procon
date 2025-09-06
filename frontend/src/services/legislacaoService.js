import api from './api';

class LegislacaoService {
  // === LEIS E NORMAS ===
  
  /**
   * Lista leis com filtros
   */
  async listarLeis(filtros = {}) {
    const params = new URLSearchParams(filtros);
    const response = await api.get(`/legislacao/api/leis/?${params}`);
    return response.data;
  }
  
  /**
   * Busca lei por ID
   */
  async obterLei(id) {
    const response = await api.get(`/legislacao/api/leis/${id}/`);
    return response.data;
  }
  
  /**
   * Busca lei por slug
   */
  async obterLeiPorSlug(slug) {
    const response = await api.get(`/legislacao/api/leis/slug/${slug}/`);
    return response.data;
  }
  
  /**
   * Cria nova lei
   */
  async criarLei(dados) {
    const response = await api.post('/legislacao/api/leis/', dados);
    return response.data;
  }
  
  /**
   * Atualiza lei
   */
  async atualizarLei(id, dados) {
    const response = await api.patch(`/legislacao/api/leis/${id}/`, dados);
    return response.data;
  }
  
  // === TIPOS DE LEGISLAÇÃO ===
  
  /**
   * Lista tipos de legislação
   */
  async listarTiposLegislacao() {
    const response = await api.get('/legislacao/api/tipos/');
    return response.data;
  }
  
  // === CATEGORIAS ===
  
  /**
   * Lista categorias de legislação
   */
  async listarCategorias() {
    const response = await api.get('/legislacao/api/categorias/');
    return response.data;
  }
  
  // === CONSULTAS E BUSCAS ===
  
  /**
   * Busca no texto das leis
   */
  async buscarTexto(query, filtros = {}) {
    const params = new URLSearchParams({
      q: query,
      ...filtros
    });
    const response = await api.get(`/legislacao/api/buscar/?${params}`);
    return response.data;
  }
  
  /**
   * Busca por número da lei
   */
  async buscarPorNumero(numero, ano = null) {
    const params = new URLSearchParams({ numero });
    if (ano) params.append('ano', ano);
    
    const response = await api.get(`/legislacao/api/buscar-numero/?${params}`);
    return response.data;
  }
  
  /**
   * Lista leis mais acessadas
   */
  async listarMaisAcessadas(limite = 10) {
    const response = await api.get(`/legislacao/api/mais-acessadas/?limite=${limite}`);
    return response.data;
  }
  
  /**
   * Lista leis recentes
   */
  async listarRecentes(limite = 10) {
    const response = await api.get(`/legislacao/api/recentes/?limite=${limite}`);
    return response.data;
  }
  
  // === ESTATÍSTICAS ===
  
  /**
   * Obtém estatísticas do dashboard
   */
  async obterEstatisticas() {
    const response = await api.get('/legislacao/api/estatisticas/');
    return response.data;
  }
  
  /**
   * Registra visualização de lei
   */
  async registrarVisualizacao(leiId) {
    try {
      const response = await api.post(`/legislacao/api/leis/${leiId}/visualizar/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  }
  
  // === RELATÓRIOS ===
  
  /**
   * Relatório consolidado
   */
  async relatorioConsolidado(filtros = {}) {
    const params = new URLSearchParams(filtros);
    const response = await api.get(`/legislacao/relatorio-consolidado/?${params}`);
    return response.data;
  }
  
  // === UTILIDADES ===
  
  /**
   * Formata número da lei
   */
  formatarNumeroLei(numero, ano, tipo = 'LEI') {
    if (!numero) return '';
    
    return `${tipo} nº ${numero}/${ano}`;
  }
  
  /**
   * Formata data de publicação
   */
  formatarDataPublicacao(data) {
    if (!data) return '';
    
    return new Date(data).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Formata status da lei
   */
  formatarStatusLei(status) {
    const statusMap = {
      'VIGENTE': { label: 'Vigente', color: 'green', icon: '✅' },
      'REVOGADA': { label: 'Revogada', color: 'red', icon: '❌' },
      'ALTERADA': { label: 'Alterada', color: 'yellow', icon: '⚠️' },
      'SUSPENSA': { label: 'Suspensa', color: 'orange', icon: '⏸️' },
      'EM_TRAMITACAO': { label: 'Em Tramitação', color: 'blue', icon: '🔄' },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
  }
  
  /**
   * Formata tipo de legislação
   */
  formatarTipoLegislacao(tipo) {
    const tipoMap = {
      'LEI': { label: 'Lei', color: 'blue', icon: '📜' },
      'DECRETO': { label: 'Decreto', color: 'purple', icon: '📋' },
      'PORTARIA': { label: 'Portaria', color: 'green', icon: '📄' },
      'RESOLUCAO': { label: 'Resolução', color: 'orange', icon: '⚖️' },
      'INSTRUCAO_NORMATIVA': { label: 'Instrução Normativa', color: 'cyan', icon: '📝' },
      'MEDIDA_PROVISORIA': { label: 'Medida Provisória', color: 'red', icon: '⚡' },
    };
    
    return tipoMap[tipo] || { label: tipo, color: 'gray', icon: '❓' };
  }
  
  /**
   * Formata categoria
   */
  formatarCategoria(categoria) {
    const categoriaMap = {
      'DIREITO_CONSUMIDOR': { label: 'Direito do Consumidor', color: 'blue', icon: '🛡️' },
      'DEFESA_CONCORRENCIA': { label: 'Defesa da Concorrência', color: 'purple', icon: '⚖️' },
      'REGULACAO_MERCADO': { label: 'Regulação de Mercado', color: 'green', icon: '📊' },
      'PROCEDIMENTOS_ADMINISTRATIVOS': { label: 'Procedimentos Administrativos', color: 'orange', icon: '📋' },
      'PENALIDADES': { label: 'Penalidades', color: 'red', icon: '🚫' },
      'OUTROS': { label: 'Outros', color: 'gray', icon: '📄' },
    };
    
    return categoriaMap[categoria] || { label: categoria, color: 'gray', icon: '❓' };
  }
  
  /**
   * Gera resumo da lei
   */
  gerarResumo(textoCompleto, maxCaracteres = 200) {
    if (!textoCompleto || textoCompleto.length <= maxCaracteres) {
      return textoCompleto || '';
    }
    
    const resumo = textoCompleto.substring(0, maxCaracteres);
    const ultimoEspaco = resumo.lastIndexOf(' ');
    
    if (ultimoEspaco > 0) {
      return resumo.substring(0, ultimoEspaco) + '...';
    }
    
    return resumo + '...';
  }
  
  /**
   * Destaca termos de busca no texto
   */
  destacarTermosBusca(texto, termoBusca) {
    if (!texto || !termoBusca) return texto;
    
    const regex = new RegExp(`(${termoBusca})`, 'gi');
    return texto.replace(regex, '<mark>$1</mark>');
  }
  
  /**
   * Calcula relevância da lei
   */
  calcularRelevancia(lei, termoBusca) {
    if (!termoBusca) return 0;
    
    let pontuacao = 0;
    const termo = termoBusca.toLowerCase();
    
    // Pontuação por título
    if (lei.titulo?.toLowerCase().includes(termo)) {
      pontuacao += 10;
    }
    
    // Pontuação por ementa
    if (lei.ementa?.toLowerCase().includes(termo)) {
      pontuacao += 5;
    }
    
    // Pontuação por texto
    if (lei.texto_completo?.toLowerCase().includes(termo)) {
      pontuacao += 2;
    }
    
    // Bonificação por lei vigente
    if (lei.status === 'VIGENTE') {
      pontuacao += 3;
    }
    
    // Bonificação por lei recente (menos de 5 anos)
    const anoAtual = new Date().getFullYear();
    if (lei.ano && (anoAtual - lei.ano) < 5) {
      pontuacao += 1;
    }
    
    return pontuacao;
  }
  
  /**
   * Valida dados da lei
   */
  validarDadosLei(dados) {
    const erros = [];
    
    if (!dados.titulo) {
      erros.push('Título é obrigatório');
    }
    
    if (!dados.numero) {
      erros.push('Número da lei é obrigatório');
    }
    
    if (!dados.ano) {
      erros.push('Ano da lei é obrigatório');
    }
    
    if (!dados.tipo) {
      erros.push('Tipo de legislação é obrigatório');
    }
    
    if (!dados.data_publicacao) {
      erros.push('Data de publicação é obrigatória');
    }
    
    if (!dados.ementa) {
      erros.push('Ementa é obrigatória');
    }
    
    if (!dados.texto_completo) {
      erros.push('Texto completo é obrigatório');
    }
    
    // Validar formato do número
    if (dados.numero && !/^\d+$/.test(dados.numero.toString())) {
      erros.push('Número da lei deve conter apenas dígitos');
    }
    
    // Validar ano
    const anoAtual = new Date().getFullYear();
    if (dados.ano && (dados.ano < 1800 || dados.ano > anoAtual + 1)) {
      erros.push(`Ano deve estar entre 1800 e ${anoAtual + 1}`);
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  }
  
  /**
   * Gera slug para a lei
   */
  gerarSlug(titulo, numero, ano) {
    if (!titulo) return '';
    
    let slug = titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplos
      .trim();
    
    if (numero && ano) {
      slug = `lei-${numero}-${ano}-${slug}`;
    }
    
    return slug;
  }
  
  /**
   * Extrai artigos da lei
   */
  extrairArtigos(textoCompleto) {
    if (!textoCompleto) return [];
    
    // Regex para encontrar artigos (Art. 1º, Art. 2°, etc.)
    const regexArtigo = /Art\.?\s*(\d+[º°]?)[.\s-]+(.*?)(?=(?:Art\.?\s*\d+[º°]?)|$)/gi;
    const artigos = [];
    let match;
    
    while ((match = regexArtigo.exec(textoCompleto)) !== null) {
      artigos.push({
        numero: match[1],
        texto: match[2].trim()
      });
    }
    
    return artigos;
  }
  
  /**
   * Busca em artigos específicos
   */
  buscarEmArtigos(lei, termoBusca) {
    const artigos = this.extrairArtigos(lei.texto_completo);
    const artigosEncontrados = [];
    
    if (!termoBusca) return artigosEncontrados;
    
    const termo = termoBusca.toLowerCase();
    
    artigos.forEach(artigo => {
      if (artigo.texto.toLowerCase().includes(termo)) {
        artigosEncontrados.push({
          ...artigo,
          texto: this.destacarTermosBusca(artigo.texto, termoBusca)
        });
      }
    });
    
    return artigosEncontrados;
  }
}

export default new LegislacaoService();
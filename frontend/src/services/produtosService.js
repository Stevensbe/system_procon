import api from './api';

class ProdutosService {
  async listarProdutos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.fabricante) params.append('fabricante', filtros.fabricante);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.page_size) params.append('page_size', filtros.page_size);

      const response = await api.get(`/produtos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      throw error;
    }
  }

  async obterProduto(id) {
    try {
      const response = await api.get(`/produtos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter produto:', error);
      throw error;
    }
  }

  async criarProduto(dados) {
    try {
      const response = await api.post('/produtos/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  async atualizarProduto(id, dados) {
    try {
      const response = await api.put(`/produtos/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  }

  async excluirProduto(id) {
    try {
      await api.delete(`/produtos/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      throw error;
    }
  }

  async listarCategorias() {
    try {
      const response = await api.get('/produtos/categorias/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      throw error;
    }
  }

  async listarFabricantes() {
    try {
      const response = await api.get('/produtos/fabricantes/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar fabricantes:', error);
      throw error;
    }
  }

  async marcarComoInutilizado(id, dados) {
    try {
      const response = await api.post(`/produtos/${id}/inutilizar/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar produto como inutilizado:', error);
      throw error;
    }
  }

  async obterEstatisticas() {
    try {
      const response = await api.get('/produtos/estatisticas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  async buscarPorCodigoBarras(codigoBarras) {
    try {
      const response = await api.get(`/api/barcode/${codigoBarras}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produto por código de barras:', error);
      throw error;
    }
  }

  async buscarProdutoExterno(codigoBarras) {
    try {
      // Buscar em APIs externas de produtos (ex: Open Food Facts, etc.)
      const response = await api.get(`/produtos/buscar-externo/${codigoBarras}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produto externo:', error);
      throw error;
    }
  }

  async criarProdutoAPIScanner(dadosProduto) {
    try {
      const response = await api.post('/api/produtos/criar/', dadosProduto);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar produto via API Scanner:', error);
      throw error;
    }
  }
}

export default new ProdutosService();

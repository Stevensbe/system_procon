import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

const ProdutosPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [filtros, setFiltros] = useState({
    search: '',
    categoria: '',
    status: '',
    preco_min: '',
    preco_max: ''
  });
  const [estatisticas, setEstatisticas] = useState({
    totalProdutos: 1250,
    produtosAtivos: 1180,
    produtosMonitorados: 89,
    alertasPreco: 15,
    categorias: 23,
    fornecedores: 156
  });

  // Dados mock para demonstração
  const produtosMock = [
    {
      id: 1,
      codigo: 'PROD-001',
      nome: 'Smartphone Galaxy S24',
      categoria: 'Eletrônicos',
      marca: 'Samsung',
      preco_medio: 2899.99,
      preco_minimo: 2650.00,
      preco_maximo: 3199.99,
      variacao_preco: '+5.2%',
      status: 'Ativo',
      monitorado: true,
      estabelecimentos_cadastrados: 24,
      ultima_atualizacao: '2024-03-29'
    },
    {
      id: 2,
      codigo: 'PROD-002',
      nome: 'Notebook Dell Inspiron 15',
      categoria: 'Informática',
      marca: 'Dell',
      preco_medio: 2299.99,
      preco_minimo: 2100.00,
      preco_maximo: 2499.99,
      variacao_preco: '-2.1%',
      status: 'Ativo',
      monitorado: true,
      estabelecimentos_cadastrados: 18,
      ultima_atualizacao: '2024-03-29'
    },
    {
      id: 3,
      codigo: 'PROD-003',
      nome: 'Geladeira Brastemp 400L',
      categoria: 'Eletrodomésticos',
      marca: 'Brastemp',
      preco_medio: 1899.99,
      preco_minimo: 1750.00,
      preco_maximo: 2050.00,
      variacao_preco: '+1.8%',
      status: 'Ativo',
      monitorado: false,
      estabelecimentos_cadastrados: 12,
      ultima_atualizacao: '2024-03-28'
    },
    {
      id: 4,
      codigo: 'PROD-004',
      nome: 'Tênis Nike Air Max',
      categoria: 'Calçados',
      marca: 'Nike',
      preco_medio: 459.99,
      preco_minimo: 399.99,
      preco_maximo: 529.99,
      variacao_preco: '+8.5%',
      status: 'Alerta',
      monitorado: true,
      estabelecimentos_cadastrados: 31,
      ultima_atualizacao: '2024-03-29'
    },
    {
      id: 5,
      codigo: 'PROD-005',
      nome: 'Smart TV LG 55 4K',
      categoria: 'Eletrônicos',
      marca: 'LG',
      preco_medio: 2199.99,
      preco_minimo: 1999.99,
      preco_maximo: 2399.99,
      variacao_preco: '-1.2%',
      status: 'Ativo',
      monitorado: true,
      estabelecimentos_cadastrados: 27,
      ultima_atualizacao: '2024-03-29'
    }
  ];

  const categorias = [
    'Eletrônicos',
    'Informática',
    'Eletrodomésticos',
    'Calçados',
    'Roupas',
    'Casa e Jardim',
    'Alimentação',
    'Saúde e Beleza',
    'Automóveis',
    'Livros'
  ];

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    setLoading(true);
    // Simular carregamento
    setTimeout(() => {
      setProdutos(produtosMock);
      setLoading(false);
    }, 1000);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = () => {
    let produtosFiltrados = produtosMock;
    
    if (filtros.search) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.nome.toLowerCase().includes(filtros.search.toLowerCase()) ||
        produto.codigo.toLowerCase().includes(filtros.search.toLowerCase()) ||
        produto.marca.toLowerCase().includes(filtros.search.toLowerCase())
      );
    }
    
    if (filtros.categoria) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.categoria === filtros.categoria
      );
    }
    
    if (filtros.status) {
      produtosFiltrados = produtosFiltrados.filter(produto =>
        produto.status.toLowerCase() === filtros.status.toLowerCase()
      );
    }

    setProdutos(produtosFiltrados);
  };

  const limparFiltros = () => {
    setFiltros({
      search: '',
      categoria: '',
      status: '',
      preco_min: '',
      preco_max: ''
    });
    setProdutos(produtosMock);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'alerta': return 'bg-red-100 text-red-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVariacaoColor = (variacao) => {
    if (variacao.startsWith('+')) return 'text-red-600';
    if (variacao.startsWith('-')) return 'text-green-600';
    return 'text-gray-600';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Produtos
          </h1>
          <p className="text-gray-600 mt-2">Cadastro e monitoramento de produtos do mercado</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => navigate('/produtos/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Produtos</p>
                <p className="text-xl font-bold text-gray-900">{estatisticas.totalProdutos.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Produtos Ativos</p>
                <p className="text-xl font-bold text-gray-900">{estatisticas.produtosAtivos.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monitorados</p>
                <p className="text-xl font-bold text-gray-900">{estatisticas.produtosMonitorados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alertas Preço</p>
                <p className="text-xl font-bold text-gray-900">{estatisticas.alertasPreco}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Tag className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categorias</p>
                <p className="text-xl font-bold text-gray-900">{estatisticas.categorias}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fornecedores</p>
                <p className="text-xl font-bold text-gray-900">{estatisticas.fornecedores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                placeholder="Nome, código, marca..."
                value={filtros.search}
                onChange={(e) => handleFiltroChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={filtros.categoria} onValueChange={(value) => handleFiltroChange('categoria', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filtros.status} onValueChange={(value) => handleFiltroChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="alerta">Alerta</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            <div className="flex items-end">
              <Button onClick={limparFiltros} variant="outline" className="w-full">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Médio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estabelecimentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                          <div className="text-sm text-gray-500">{produto.codigo} • {produto.marca}</div>
                          {produto.monitorado && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <BarChart3 className="w-3 h-3 mr-1" />
                              Monitorado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(produto.preco_medio)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(produto.preco_minimo)} - {formatCurrency(produto.preco_maximo)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getVariacaoColor(produto.variacao_preco)}`}>
                          {produto.variacao_preco}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(produto.status)}`}>
                          {produto.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.estabelecimentos_cadastrados}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdutosPage;

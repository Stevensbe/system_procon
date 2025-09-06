import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  BookOpenIcon,
  ScaleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const Legislacao = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
  const [statusSelecionado, setStatusSelecionado] = useState('todas');
  const [legislacoes, setLegislacoes] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    carregarDados();
  }, [categoriaSelecionada, statusSelecionado]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Simular dados da API
      const mockLegislacoes = [
        {
          id: 1,
          titulo: 'Lei de Defesa do Consumidor',
          numero: '8.078/1990',
          categoria: 'Federal',
          tipo: 'Lei',
          status: 'Vigente',
          dataPublicacao: '1990-09-11',
          dataVigencia: '1990-09-12',
          autor: 'Congresso Nacional',
          descricao: 'Dispõe sobre a proteção do consumidor e dá outras providências.',
          tags: ['consumidor', 'proteção', 'direitos'],
          arquivo: 'lei_8078_1990.pdf',
          visualizacoes: 1250,
          downloads: 890
        },
        {
          id: 2,
          titulo: 'Código de Defesa do Consumidor',
          numero: 'Decreto 2.181/1997',
          categoria: 'Federal',
          tipo: 'Decreto',
          status: 'Vigente',
          dataPublicacao: '1997-03-20',
          dataVigencia: '1997-03-21',
          autor: 'Presidência da República',
          descricao: 'Regulamenta o Sistema Nacional de Defesa do Consumidor.',
          tags: ['consumidor', 'sistema nacional', 'regulamentação'],
          arquivo: 'decreto_2181_1997.pdf',
          visualizacoes: 980,
          downloads: 650
        },
        {
          id: 3,
          titulo: 'Resolução sobre Práticas Abusivas',
          numero: 'Resolução 1/2020',
          categoria: 'Federal',
          tipo: 'Resolução',
          status: 'Vigente',
          dataPublicacao: '2020-01-15',
          dataVigencia: '2020-01-16',
          autor: 'Conselho Nacional de Defesa do Consumidor',
          descricao: 'Define práticas abusivas no comércio eletrônico.',
          tags: ['e-commerce', 'práticas abusivas', 'comércio eletrônico'],
          arquivo: 'resolucao_1_2020.pdf',
          visualizacoes: 750,
          downloads: 420
        },
        {
          id: 4,
          titulo: 'Lei Estadual de Proteção ao Consumidor',
          numero: 'Lei 15.123/2018',
          categoria: 'Estadual',
          tipo: 'Lei',
          status: 'Vigente',
          dataPublicacao: '2018-06-10',
          dataVigencia: '2018-06-11',
          autor: 'Assembleia Legislativa',
          descricao: 'Estabelece normas de proteção ao consumidor no estado.',
          tags: ['estadual', 'proteção', 'normas'],
          arquivo: 'lei_15123_2018.pdf',
          visualizacoes: 620,
          downloads: 380
        },
        {
          id: 5,
          titulo: 'Portaria sobre Fiscalização',
          numero: 'Portaria 123/2023',
          categoria: 'Municipal',
          tipo: 'Portaria',
          status: 'Vigente',
          dataPublicacao: '2023-03-05',
          dataVigencia: '2023-03-06',
          autor: 'Prefeitura Municipal',
          descricao: 'Estabelece procedimentos de fiscalização do PROCON.',
          tags: ['fiscalização', 'procedimentos', 'municipal'],
          arquivo: 'portaria_123_2023.pdf',
          visualizacoes: 450,
          downloads: 280
        },
        {
          id: 6,
          titulo: 'Lei de Responsabilidade Civil',
          numero: '10.406/2002',
          categoria: 'Federal',
          tipo: 'Lei',
          status: 'Vigente',
          dataPublicacao: '2002-01-10',
          dataVigencia: '2003-01-11',
          autor: 'Congresso Nacional',
          descricao: 'Institui o Código Civil.',
          tags: ['código civil', 'responsabilidade', 'direito civil'],
          arquivo: 'lei_10406_2002.pdf',
          visualizacoes: 1100,
          downloads: 720
        }
      ];

      const mockEstatisticas = {
        totalLegislacoes: 156,
        legislacoesVigentes: 142,
        legislacoesRevogadas: 14,
        legislacoesFederais: 89,
        legislacoesEstaduais: 45,
        legislacoesMunicipais: 22,
        totalVisualizacoes: 12500,
        totalDownloads: 8900,
        categorias: 8,
        tipos: 6
      };

      const mockCategorias = [
        { id: 1, nome: 'Federal', quantidade: 89, cor: '#3B82F6' },
        { id: 2, nome: 'Estadual', quantidade: 45, cor: '#10B981' },
        { id: 3, nome: 'Municipal', quantidade: 22, cor: '#F59E0B' }
      ];

      setLegislacoes(mockLegislacoes);
      setEstatisticas(mockEstatisticas);
      setCategorias(mockCategorias);
    } catch (error) {
      console.error('Erro ao carregar dados da legislação:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'vigente': return 'text-green-600 bg-green-100';
      case 'revogada': return 'text-red-600 bg-red-100';
      case 'suspensa': return 'text-yellow-600 bg-yellow-100';
      case 'em análise': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoriaColor = (categoria) => {
    switch (categoria?.toLowerCase()) {
      case 'federal': return 'text-blue-600 bg-blue-100';
      case 'estadual': return 'text-green-600 bg-green-100';
      case 'municipal': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'lei': return 'text-purple-600 bg-purple-100';
      case 'decreto': return 'text-indigo-600 bg-indigo-100';
      case 'resolução': return 'text-pink-600 bg-pink-100';
      case 'portaria': return 'text-orange-600 bg-orange-100';
      case 'medida provisória': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const filteredLegislacoes = legislacoes.filter(legislacao => {
    const matchesSearch = legislacao.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         legislacao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         legislacao.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = categoriaSelecionada === 'todas' || legislacao.categoria.toLowerCase() === categoriaSelecionada;
    const matchesStatus = statusSelecionado === 'todas' || legislacao.status.toLowerCase() === statusSelecionado;
    
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando legislação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Legislação</h1>
              <p className="mt-1 text-sm text-gray-500">
                Base legal e normativa do sistema PROCON
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Legislação
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Legislações</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalLegislacoes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vigentes</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.legislacoesVigentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Visualizações</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalVisualizacoes.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentDuplicateIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalDownloads.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, número ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                value={categoriaSelecionada}
                onChange={(e) => setCategoriaSelecionada(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todas as Categorias</option>
                <option value="federal">Federal</option>
                <option value="estadual">Estadual</option>
                <option value="municipal">Municipal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todos os Status</option>
                <option value="vigente">Vigente</option>
                <option value="revogada">Revogada</option>
                <option value="suspensa">Suspensa</option>
                <option value="em análise">Em Análise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Legislações */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Legislações</h3>
            <p className="text-sm text-gray-500">
              {filteredLegislacoes.length} legislação{filteredLegislacoes.length !== 1 ? 'ões' : ''} encontrada{filteredLegislacoes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Legislação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Publicação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visualizações</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLegislacoes.map((legislacao) => (
                  <tr key={legislacao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{legislacao.titulo}</div>
                        <div className="text-sm text-gray-500">{legislacao.numero}</div>
                        <div className="text-xs text-gray-400 mt-1">{legislacao.descricao.substring(0, 80)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(legislacao.categoria)}`}>
                        {legislacao.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(legislacao.tipo)}`}>
                        {legislacao.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(legislacao.status)}`}>
                        {legislacao.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(legislacao.dataPublicacao)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {legislacao.visualizacoes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-900">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categorias */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Distribuição por Categoria</h3>
            <p className="text-sm text-gray-500">Quantidade de legislações por categoria</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categorias.map((categoria) => (
                <div key={categoria.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{categoria.nome}</h4>
                      <p className="text-sm text-gray-500">{categoria.quantidade} legislações</p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: categoria.cor + '20' }}
                    >
                      <DocumentTextIcon 
                        className="h-6 w-6" 
                        style={{ color: categoria.cor }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legislacao;

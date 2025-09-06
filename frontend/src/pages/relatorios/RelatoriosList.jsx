import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const RelatoriosList = () => {
  const [loading, setLoading] = useState(true);
  const [relatorios, setRelatorios] = useState([]);
  const [filteredRelatorios, setFilteredRelatorios] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    modulo: '',
    tipo: '',
    status: '',
    dataInicio: '',
    dataFim: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'dataGeracao',
    direction: 'desc'
  });

  useEffect(() => {
    loadRelatorios();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [relatorios, filters, sortConfig]);

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      // Simular dados da API
      const mockRelatorios = [
        {
          id: 1,
          titulo: 'Relatório de Fiscalização - Junho 2024',
          modulo: 'Fiscalização',
          tipo: 'Mensal',
          status: 'concluido',
          dataGeracao: '2024-06-15T10:30:00',
          dataConclusao: '2024-06-15T10:35:00',
          downloads: 45,
          tamanho: '2.3 MB',
          formato: 'PDF',
          geradoPor: 'João Silva',
          descricao: 'Relatório mensal de atividades de fiscalização'
        },
        {
          id: 2,
          titulo: 'Análise de Processos Jurídicos - Q2 2024',
          modulo: 'Jurídico',
          tipo: 'Trimestral',
          status: 'concluido',
          dataGeracao: '2024-06-14T14:20:00',
          dataConclusao: '2024-06-14T14:25:00',
          downloads: 23,
          tamanho: '1.8 MB',
          formato: 'PDF',
          geradoPor: 'Maria Santos',
          descricao: 'Análise trimestral de processos jurídicos'
        },
        {
          id: 3,
          titulo: 'Relatório de Usuários Ativos - Semana 24',
          modulo: 'Usuários',
          tipo: 'Semanal',
          status: 'pendente',
          dataGeracao: '2024-06-13T09:15:00',
          dataConclusao: null,
          downloads: 0,
          tamanho: null,
          formato: null,
          geradoPor: 'Pedro Costa',
          descricao: 'Relatório semanal de usuários ativos no sistema'
        },
        {
          id: 4,
          titulo: 'Análise Financeira - Q2 2024',
          modulo: 'Financeiro',
          tipo: 'Trimestral',
          status: 'concluido',
          dataGeracao: '2024-06-12T16:45:00',
          dataConclusao: '2024-06-12T16:50:00',
          downloads: 34,
          tamanho: '3.1 MB',
          formato: 'PDF',
          geradoPor: 'Ana Oliveira',
          descricao: 'Análise financeira do segundo trimestre'
        },
        {
          id: 5,
          titulo: 'Relatório de Autos de Infração - Maio 2024',
          modulo: 'Fiscalização',
          tipo: 'Mensal',
          status: 'concluido',
          dataGeracao: '2024-06-10T11:20:00',
          dataConclusao: '2024-06-10T11:25:00',
          downloads: 67,
          tamanho: '4.2 MB',
          formato: 'PDF',
          geradoPor: 'Carlos Lima',
          descricao: 'Relatório de autos de infração do mês de maio'
        },
        {
          id: 6,
          titulo: 'Análise de Performance de Usuários',
          modulo: 'Usuários',
          tipo: 'Mensal',
          status: 'erro',
          dataGeracao: '2024-06-09T15:30:00',
          dataConclusao: null,
          downloads: 0,
          tamanho: null,
          formato: null,
          geradoPor: 'Lucia Ferreira',
          descricao: 'Análise de performance dos usuários do sistema'
        },
        {
          id: 7,
          titulo: 'Relatório de Multas e Cobranças - Q2 2024',
          modulo: 'Financeiro',
          tipo: 'Trimestral',
          status: 'concluido',
          dataGeracao: '2024-06-08T13:45:00',
          dataConclusao: '2024-06-08T13:50:00',
          downloads: 89,
          tamanho: '2.7 MB',
          formato: 'PDF',
          geradoPor: 'Roberto Alves',
          descricao: 'Relatório de multas e cobranças do segundo trimestre'
        },
        {
          id: 8,
          titulo: 'Análise de Processos por Status',
          modulo: 'Jurídico',
          tipo: 'Mensal',
          status: 'concluido',
          dataGeracao: '2024-06-07T10:15:00',
          dataConclusao: '2024-06-07T10:20:00',
          downloads: 56,
          tamanho: '1.9 MB',
          formato: 'PDF',
          geradoPor: 'Fernanda Silva',
          descricao: 'Análise de processos jurídicos por status'
        }
      ];

      setRelatorios(mockRelatorios);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...relatorios];

    // Filtro de busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(relatorio =>
        relatorio.titulo.toLowerCase().includes(searchTerm) ||
        relatorio.descricao.toLowerCase().includes(searchTerm) ||
        relatorio.geradoPor.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por módulo
    if (filters.modulo) {
      filtered = filtered.filter(relatorio => relatorio.modulo === filters.modulo);
    }

    // Filtro por tipo
    if (filters.tipo) {
      filtered = filtered.filter(relatorio => relatorio.tipo === filters.tipo);
    }

    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(relatorio => relatorio.status === filters.status);
    }

    // Filtro por data
    if (filters.dataInicio) {
      filtered = filtered.filter(relatorio => 
        new Date(relatorio.dataGeracao) >= new Date(filters.dataInicio)
      );
    }

    if (filters.dataFim) {
      filtered = filtered.filter(relatorio => 
        new Date(relatorio.dataGeracao) <= new Date(filters.dataFim)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredRelatorios(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'erro':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'concluido':
        return CheckCircleIcon;
      case 'pendente':
        return ClockIcon;
      case 'erro':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const getModuloIcon = (modulo) => {
    switch (modulo) {
      case 'Fiscalização':
        return BuildingOfficeIcon;
      case 'Jurídico':
        return ScaleIcon;
      case 'Usuários':
        return UserGroupIcon;
      case 'Financeiro':
        return CurrencyDollarIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getModuloColor = (modulo) => {
    switch (modulo) {
      case 'Fiscalização':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Jurídico':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Usuários':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Financeiro':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const handleDownload = (relatorio) => {
    // Simular download
    console.log(`Downloading: ${relatorio.titulo}`);
    // Aqui seria implementada a lógica real de download
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este relatório?')) {
      setRelatorios(prev => prev.filter(relatorio => relatorio.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Gerencie e visualize todos os relatórios do sistema
            </p>
          </div>
          <Link
            to="/relatorios/gerar"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Busca */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar relatórios..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Módulo */}
          <select
            value={filters.modulo}
            onChange={(e) => handleFilterChange('modulo', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Todos os módulos</option>
            <option value="Fiscalização">Fiscalização</option>
            <option value="Jurídico">Jurídico</option>
            <option value="Usuários">Usuários</option>
            <option value="Financeiro">Financeiro</option>
          </select>

          {/* Tipo */}
          <select
            value={filters.tipo}
            onChange={(e) => handleFilterChange('tipo', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="Mensal">Mensal</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Semanal">Semanal</option>
            <option value="Anual">Anual</option>
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Todos os status</option>
            <option value="concluido">Concluído</option>
            <option value="pendente">Pendente</option>
            <option value="erro">Erro</option>
          </select>

          {/* Data Início */}
          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />

          {/* Data Fim */}
          <input
            type="date"
            value={filters.dataFim}
            onChange={(e) => handleFilterChange('dataFim', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredRelatorios.length} relatório(s) encontrado(s)
          </p>
          <button
            onClick={() => setFilters({
              search: '',
              modulo: '',
              tipo: '',
              status: '',
              dataInicio: '',
              dataFim: ''
            })}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('titulo')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Relatório
                    {sortConfig.key === 'titulo' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('modulo')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Módulo
                    {sortConfig.key === 'modulo' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('tipo')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Tipo
                    {sortConfig.key === 'tipo' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Status
                    {sortConfig.key === 'status' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('dataGeracao')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Data Geração
                    {sortConfig.key === 'dataGeracao' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('downloads')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Downloads
                    {sortConfig.key === 'downloads' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRelatorios.map((relatorio) => (
                <tr key={relatorio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <DocumentTextIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {relatorio.titulo}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {relatorio.descricao}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Gerado por: {relatorio.geradoPor}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModuloColor(relatorio.modulo)}`}>
                      {React.createElement(getModuloIcon(relatorio.modulo), { className: "h-3 w-3 mr-1" })}
                      {relatorio.modulo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {relatorio.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(relatorio.status)}`}>
                      {React.createElement(getStatusIcon(relatorio.status), { className: "h-3 w-3 mr-1" })}
                      {relatorio.status === 'concluido' ? 'Concluído' : 
                       relatorio.status === 'pendente' ? 'Pendente' : 'Erro'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(relatorio.dataGeracao)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatNumber(relatorio.downloads)}</span>
                      {relatorio.tamanho && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {relatorio.tamanho} • {relatorio.formato}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {relatorio.status === 'concluido' && (
                        <button
                          onClick={() => handleDownload(relatorio)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                      )}
                      <Link
                        to={`/relatorios/${relatorio.id}`}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        title="Visualizar"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(relatorio.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title="Excluir"
                      >
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
    </div>
  );
};

export default RelatoriosList;

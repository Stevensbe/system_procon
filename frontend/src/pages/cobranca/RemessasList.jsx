import React, { useState, useEffect } from 'react';
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cobrancaService } from '../../services/cobrancaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

const RemessasList = () => {
  const [remessas, setRemessas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    banco: '',
    dataInicio: '',
    dataFim: ''
  });
  const [sorting, setSorting] = useState({
    field: 'data_geracao',
    direction: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    carregarRemessas();
  }, [pagination.page, pagination.pageSize, sorting, filters]);

  const carregarRemessas = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm,
        filters: filters,
        sorting: sorting
      };

      const response = await cobrancaService.getRemessas(params);
      
      if (response && response.data) {
        setRemessas(Array.isArray(response.data) ? response.data : []);
        setPagination(prev => ({
          ...prev,
          totalPages: response.totalPages || 1,
          totalItems: response.totalItems || 0
        }));
      } else {
        setRemessas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar remessas:', error);
      toast.error('Erro ao carregar remessas');
      setRemessas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    carregarRemessas();
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'text-yellow-600 bg-yellow-100';
      case 'gerado': return 'text-blue-600 bg-blue-100';
      case 'enviado': return 'text-purple-600 bg-purple-100';
      case 'processado': return 'text-green-600 bg-green-100';
      case 'erro': return 'text-red-600 bg-red-100';
      case 'cancelado': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return <ClockIcon className="w-4 h-4" />;
      case 'gerado': return <DocumentArrowDownIcon className="w-4 h-4" />;
      case 'enviado': return <DocumentArrowUpIcon className="w-4 h-4" />;
      case 'processado': return <CheckCircleIcon className="w-4 h-4" />;
      case 'erro': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'cancelado': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const handleGerarRemessa = async (id) => {
    try {
      await cobrancaService.gerarRemessa(id);
      toast.success('Remessa gerada com sucesso!');
      carregarRemessas();
    } catch (error) {
      console.error('Erro ao gerar remessa:', error);
      toast.error('Erro ao gerar remessa');
    }
  };

  const handleProcessarRetorno = async (id) => {
    try {
      await cobrancaService.processarRetorno(id);
      toast.success('Retorno processado com sucesso!');
      carregarRemessas();
    } catch (error) {
      console.error('Erro ao processar retorno:', error);
      toast.error('Erro ao processar retorno');
    }
  };

  if (loading && remessas.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remessas Bancárias</h1>
          <p className="text-gray-600">Gestão de arquivos de remessa e retorno CNAB</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nova Remessa
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar remessas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="gerado">Gerado</option>
              <option value="enviado">Enviado</option>
              <option value="processado">Processado</option>
              <option value="erro">Erro</option>
              <option value="cancelado">Cancelado</option>
            </select>

            {/* Data Início */}
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Data Fim */}
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => handleFilterChange('dataFim', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="btn-primary"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filtrar
            </button>

            <div className="text-sm text-gray-600">
              {pagination.totalItems} remessas encontradas
            </div>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('numero')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Número</span>
                    {sorting.field === 'numero' && (
                      sorting.direction === 'asc' ? 
                        <ArrowUpIcon className="w-4 h-4" /> : 
                        <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Banco
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('quantidade_boletos')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Boletos</span>
                    {sorting.field === 'quantidade_boletos' && (
                      sorting.direction === 'asc' ? 
                        <ArrowUpIcon className="w-4 h-4" /> : 
                        <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('valor_total')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Valor Total</span>
                    {sorting.field === 'valor_total' && (
                      sorting.direction === 'asc' ? 
                        <ArrowUpIcon className="w-4 h-4" /> : 
                        <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('data_geracao')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Data Geração</span>
                    {sorting.field === 'data_geracao' && (
                      sorting.direction === 'asc' ? 
                        <ArrowUpIcon className="w-4 h-4" /> : 
                        <ArrowDownIcon className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(remessas) && remessas.map((remessa) => (
                <tr key={remessa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{remessa.numero}</div>
                    <div className="text-sm text-gray-500">{remessa.tipo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{remessa.banco?.nome || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{remessa.banco?.codigo || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {remessa.quantidade_boletos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(remessa.valor_total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(remessa.data_geracao)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(remessa.status)}`}>
                      {getStatusIcon(remessa.status)}
                      <span className="ml-1">{remessa.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Visualizar"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      
                      {remessa.status === 'pendente' && (
                        <button 
                          onClick={() => handleGerarRemessa(remessa.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Gerar Remessa"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      {remessa.status === 'enviado' && (
                        <button 
                          onClick={() => handleProcessarRetorno(remessa.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Processar Retorno"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
                    </span>{' '}
                    de <span className="font-medium">{pagination.totalItems}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado vazio */}
      {!loading && remessas.length === 0 && (
        <div className="text-center py-12">
          <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma remessa encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando uma nova remessa para gerenciar os arquivos CNAB.
          </p>
          <div className="mt-6">
            <button className="btn-primary">
              <PlusIcon className="w-4 h-4 mr-2" />
              Nova Remessa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemessasList;

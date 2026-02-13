import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import fiscalizacaoService from '../../services/fiscalizacaoService';

const AutoList = () => {
  const [loading, setLoading] = useState(true);
  const [autos, setAutos] = useState([]);
  const [filteredAutos, setFilteredAutos] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    tipo: '',
    status: '',
    dataInicio: '',
    dataFim: ''
  });

  const loadAutos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Carregar autos do Supabase
      const resultado = await fiscalizacaoService.listarAutos({
        tipo: filters.tipo || undefined,
        status: filters.status || undefined,
        data_inicio: filters.dataInicio || undefined,
        data_fim: filters.dataFim || undefined,
        search: filters.search || undefined,
      });

      // Mapear para formato esperado pelo componente
      const autosFormatados = (resultado || []).map(auto => ({
        id: auto.id,
        numero: auto.numero || `${new Date(auto.data_fiscalizacao).getFullYear()}/${auto.id?.slice(0, 6) || '000000'}`,
        tipo: auto.tipo?.toLowerCase() || 'diversos',
        tipoLabel: getTipoLabel(auto.tipo),
        dataFiscalizacao: auto.data_fiscalizacao,
        empresa: auto.razao_social || auto.nome_fantasia || 'Não informado',
        cnpj: auto.cnpj,
        fiscal: auto.fiscal_1_nome || 'Não informado',
        status: mapStatus(auto.status),
        statusLabel: getStatusLabel(auto.status),
        irregularidades: auto.nada_consta ? 0 : (auto.sem_irregularidades ? 0 : 1),
        observacoes: auto.observacoes,
      }));

      setAutos(autosFormatados);
    } catch (err) {
      console.error('Erro ao carregar autos:', err);
      setError('Não foi possível carregar os autos. Tente novamente.');
      setAutos([]);
    } finally {
      setLoading(false);
    }
  }, [filters.tipo, filters.status, filters.dataInicio, filters.dataFim, filters.search]);

  useEffect(() => {
    loadAutos();
  }, [loadAutos]);

  useEffect(() => {
    applyLocalFilters();
  }, [autos, filters.search]);

  const getTipoLabel = (tipo) => {
    const tipos = {
      'BANCO': 'Banco',
      'POSTO': 'Posto de Combustível',
      'SUPERMERCADO': 'Supermercado',
      'DIVERSOS': 'Diversos',
    };
    return tipos[tipo?.toUpperCase()] || 'Diversos';
  };

  const mapStatus = (status) => {
    const statusMap = {
      'ABERTO': 'pendente',
      'EM_ANDAMENTO': 'em_andamento',
      'CONCLUIDO': 'concluido',
      'CANCELADO': 'cancelado',
      'ARQUIVADO': 'arquivado',
    };
    return statusMap[status?.toUpperCase()] || 'pendente';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'ABERTO': 'Pendente',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDO': 'Concluído',
      'CANCELADO': 'Cancelado',
      'ARQUIVADO': 'Arquivado',
    };
    return labels[status?.toUpperCase()] || 'Pendente';
  };

  const applyLocalFilters = () => {
    let filtered = [...autos];

    // Filtro de busca local (apenas texto)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(auto =>
        auto.numero?.toLowerCase().includes(searchLower) ||
        auto.empresa?.toLowerCase().includes(searchLower) ||
        auto.fiscal?.toLowerCase().includes(searchLower) ||
        auto.cnpj?.includes(filters.search)
      );
    }

    setFilteredAutos(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este auto?')) {
      return;
    }

    try {
      await fiscalizacaoService.excluirAuto(id);
      setAutos(prev => prev.filter(auto => auto.id !== id));
    } catch (err) {
      console.error('Erro ao excluir auto:', err);
      setError('Não foi possível excluir o auto.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'concluido':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'arquivado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'em_andamento':
        return ClockIcon;
      case 'concluido':
        return CheckCircleIcon;
      case 'pendente':
        return ExclamationTriangleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Autos de Constatação</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Gerenciamento de autos de constatação do sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAutos}
              disabled={loading}
              className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <Link
              to="/fiscalizacao/selecao-auto"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Auto
            </Link>
          </div>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Número, empresa, fiscal..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={filters.tipo}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="BANCO">Banco</option>
              <option value="POSTO">Posto de Combustível</option>
              <option value="SUPERMERCADO">Supermercado</option>
              <option value="DIVERSOS">Diversos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="ABERTO">Pendente</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="ARQUIVADO">Arquivado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => handleFilterChange('dataFim', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Lista de Autos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Autos de Constatação ({filteredAutos.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fiscal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAutos.map((auto) => {
                    const StatusIcon = getStatusIcon(auto.status);
                    return (
                      <tr key={auto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {auto.numero}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {auto.tipoLabel}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {auto.empresa}
                          </div>
                          {auto.cnpj && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {auto.cnpj}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(auto.dataFiscalizacao)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {auto.fiscal}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(auto.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {auto.statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/fiscalizacao/${auto.tipo}/${auto.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Visualizar"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/fiscalizacao/${auto.tipo}/${auto.id}/editar`}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(auto.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Excluir"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredAutos.length === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Nenhum auto encontrado
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Tente ajustar os filtros ou criar um novo auto.
                </p>
                <div className="mt-6">
                  <Link
                    to="/fiscalizacao/selecao-auto"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Novo Auto
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AutoList;

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  // GavelIcon, // Removido pois não existe no Heroicons
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import recursosService from '../../services/recursosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

const RecursosList = () => {
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    status: '',
    instancia: '',
    tipo_recurso: '',
    relator: '',
    data_inicio: '',
    data_fim: '',
    valor_minimo: '',
    valor_maximo: ''
  });
  const [ordenacao, setOrdenacao] = useState('-data_protocolo');
  const [paginacao, setPaginacao] = useState({
    pagina_atual: 1,
    total_paginas: 1,
    total_items: 0,
    items_por_pagina: 15
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecurso, setSelectedRecurso] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    carregarRecursos();
  }, [filtros, ordenacao, paginacao.pagina_atual]);

  const carregarRecursos = async () => {
    setLoading(true);
    try {
      const params = {
        ...filtros,
        search: searchTerm,
        ordering: ordenacao,
        page: paginacao.pagina_atual
      };

      const response = await recursosService.getRecursos(params);
      setRecursos(response.results || response);
      setPaginacao({
        pagina_atual: response.page || 1,
        total_paginas: response.total_pages || 1,
        total_items: response.count || response.length || 0,
        items_por_pagina: 15
      });
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      // Usar dados mock em caso de erro
      carregarDadosMock();
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosMock = () => {
    const mockData = [
      {
        id: 1,
        numero_protocolo: 'REC-00123/2025',
        requerente_nome: 'Empresa ABC Ltda',
        requerente_documento: '12.345.678/0001-90',
        tipo_recurso: 'Recurso Ordinário',
        instancia: 'primeira',
        status: 'protocolado',
        data_protocolo: '2025-01-15',
        data_limite_analise: '2025-02-15',
        valor_causa: 150000.00,
        relator: 'Dr. João Silva',
        assunto: 'Recurso contra multa aplicada'
      },
      {
        id: 2,
        numero_protocolo: 'REC-00122/2025',
        requerente_nome: 'João Silva',
        requerente_documento: '123.456.789-00',
        tipo_recurso: 'Recurso Extraordinário',
        instancia: 'segunda',
        status: 'em_analise',
        data_protocolo: '2025-01-14',
        data_limite_analise: '2025-02-14',
        valor_causa: 75000.00,
        relator: 'Dra. Maria Santos',
        assunto: 'Recurso contra decisão administrativa'
      },
      {
        id: 3,
        numero_protocolo: 'REC-00121/2025',
        requerente_nome: 'Maria Santos',
        requerente_documento: '987.654.321-00',
        tipo_recurso: 'Pedido de Revisão',
        instancia: 'primeira',
        status: 'julgado',
        data_protocolo: '2025-01-13',
        data_limite_analise: '2025-02-13',
        valor_causa: 25000.00,
        relator: 'Dr. Pedro Oliveira',
        assunto: 'Revisão de processo administrativo'
      },
      {
        id: 4,
        numero_protocolo: 'REC-00120/2025',
        requerente_nome: 'Empresa XYZ Ltda',
        requerente_documento: '98.765.432/0001-10',
        tipo_recurso: 'Recurso Ordinário',
        instancia: 'primeira',
        status: 'com_parecer',
        data_protocolo: '2025-01-12',
        data_limite_analise: '2025-02-12',
        valor_causa: 300000.00,
        relator: 'Dra. Ana Costa',
        assunto: 'Recurso contra auto de infração'
      },
      {
        id: 5,
        numero_protocolo: 'REC-00119/2025',
        requerente_nome: 'Pedro Oliveira',
        requerente_documento: '456.789.123-00',
        tipo_recurso: 'Recurso Extraordinário',
        instancia: 'terceira',
        status: 'deferido',
        data_protocolo: '2025-01-11',
        data_limite_analise: '2025-02-11',
        valor_causa: 50000.00,
        relator: 'Dr. Carlos Lima',
        assunto: 'Recurso contra decisão final'
      }
    ];

    setRecursos(mockData);
    setPaginacao({
      pagina_atual: 1,
      total_paginas: 1,
      total_items: mockData.length,
      items_por_pagina: 15
    });
  };

  const handleSearch = () => {
    setPaginacao(prev => ({ ...prev, pagina_atual: 1 }));
    carregarRecursos();
  };

  const handleFilterChange = (field, value) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
    setPaginacao(prev => ({ ...prev, pagina_atual: 1 }));
  };

  const clearFilters = () => {
    setFiltros({
      status: '',
      instancia: '',
      tipo_recurso: '',
      relator: '',
      data_inicio: '',
      data_fim: '',
      valor_minimo: '',
      valor_maximo: ''
    });
    setSearchTerm('');
    setPaginacao(prev => ({ ...prev, pagina_atual: 1 }));
  };

  const handlePageChange = (page) => {
    setPaginacao(prev => ({ ...prev, pagina_atual: page }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'protocolado': 'bg-blue-100 text-blue-800',
      'em_analise': 'bg-yellow-100 text-yellow-800',
      'com_parecer': 'bg-purple-100 text-purple-800',
      'deferido': 'bg-green-100 text-green-800',
      'indeferido': 'bg-red-100 text-red-800',
      'parcialmente_deferido': 'bg-orange-100 text-orange-800',
      'anulado': 'bg-gray-100 text-gray-800',
      'arquivado': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getInstanciaColor = (instancia) => {
    const colors = {
      'primeira': 'bg-blue-100 text-blue-800',
      'segunda': 'bg-green-100 text-green-800',
      'terceira': 'bg-purple-100 text-purple-800'
    };
    return colors[instancia] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (recurso) => {
    setSelectedRecurso(recurso);
    setShowDetailsModal(true);
  };

  const handleEdit = (recurso) => {
    // Implementar navegação para edição
    console.log('Editar recurso:', recurso);
  };

  const handleDelete = async (recurso) => {
    if (window.confirm(`Tem certeza que deseja excluir o recurso ${recurso.numero_protocolo}?`)) {
      try {
        await recursosService.deleteRecurso(recurso.id);
        carregarRecursos();
      } catch (error) {
        console.error('Erro ao excluir recurso:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Recursos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestão de recursos administrativos e judiciais
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => carregarRecursos()}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Atualizar
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Recurso
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Filtros e Busca
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </button>
          </div>

          {/* Busca Rápida */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por protocolo, requerente, processo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </div>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filtros.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todos</option>
                  <option value="protocolado">Protocolado</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="com_parecer">Com Parecer</option>
                  <option value="deferido">Deferido</option>
                  <option value="indeferido">Indeferido</option>
                  <option value="parcialmente_deferido">Parcialmente Deferido</option>
                  <option value="anulado">Anulado</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instância
                </label>
                <select
                  value={filtros.instancia}
                  onChange={(e) => handleFilterChange('instancia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todas</option>
                  <option value="primeira">Primeira Instância</option>
                  <option value="segunda">Segunda Instância</option>
                  <option value="terceira">Terceira Instância</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Recurso
                </label>
                <select
                  value={filtros.tipo_recurso}
                  onChange={(e) => handleFilterChange('tipo_recurso', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todos</option>
                  <option value="Recurso Ordinário">Recurso Ordinário</option>
                  <option value="Recurso Extraordinário">Recurso Extraordinário</option>
                  <option value="Pedido de Revisão">Pedido de Revisão</option>
                  <option value="Pedido de Reconsideração">Pedido de Reconsideração</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relator
                </label>
                <input
                  type="text"
                  value={filtros.relator}
                  onChange={(e) => handleFilterChange('relator', e.target.value)}
                  placeholder="Nome do relator"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Mínimo
                </label>
                <input
                  type="number"
                  value={filtros.valor_minimo}
                  onChange={(e) => handleFilterChange('valor_minimo', e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Máximo
                </label>
                <input
                  type="number"
                  value={filtros.valor_maximo}
                  onChange={(e) => handleFilterChange('valor_maximo', e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {/* Botões de Ação dos Filtros */}
          {showFilters && (
            <div className="mt-4 flex items-center space-x-3">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Limpar Filtros
              </button>
              <button
                onClick={carregarRecursos}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Recursos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Lista de Recursos ({paginacao.total_items})
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="-data_protocolo">Mais Recentes</option>
                <option value="data_protocolo">Mais Antigos</option>
                <option value="requerente_nome">Requerente A-Z</option>
                <option value="-valor_causa">Maior Valor</option>
                <option value="valor_causa">Menor Valor</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Protocolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Requerente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo/Instância
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data Protocolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor Causa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Relator
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recursos.map((recurso) => (
                  <tr key={recurso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {recurso.numero_protocolo}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {recurso.assunto}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {recurso.requerente_nome}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {recurso.requerente_documento}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {recurso.tipo_recurso}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getInstanciaColor(recurso.instancia)}`}>
                        {recurso.instancia === 'primeira' ? '1ª' : recurso.instancia === 'segunda' ? '2ª' : '3ª'} Instância
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(recurso.status)}`}>
                        {recurso.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(recurso.data_protocolo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(recurso.valor_causa)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {recurso.relator || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(recurso)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Ver detalhes"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(recurso)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(recurso)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
        )}

        {/* Paginação */}
        {paginacao.total_paginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {((paginacao.pagina_atual - 1) * paginacao.items_por_pagina) + 1} a{' '}
                {Math.min(paginacao.pagina_atual * paginacao.items_por_pagina, paginacao.total_items)} de{' '}
                {paginacao.total_items} recursos
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(paginacao.pagina_atual - 1)}
                  disabled={paginacao.pagina_atual === 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Anterior
                </button>
                <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Página {paginacao.pagina_atual} de {paginacao.total_paginas}
                </span>
                <button
                  onClick={() => handlePageChange(paginacao.pagina_atual + 1)}
                  disabled={paginacao.pagina_atual === paginacao.total_paginas}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedRecurso && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Detalhes do Recurso
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Informações Básicas</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Número do Protocolo</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedRecurso.numero_protocolo}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Requerente</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedRecurso.requerente_nome}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Documento</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedRecurso.requerente_documento}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Recurso</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedRecurso.tipo_recurso}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Instância</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedRecurso.instancia === 'primeira' ? '1ª' : selectedRecurso.instancia === 'segunda' ? '2ª' : '3ª'} Instância
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Status e Prazos</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(selectedRecurso.status)}`}>
                            {selectedRecurso.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Protocolo</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedRecurso.data_protocolo)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Prazo para Análise</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedRecurso.data_limite_analise)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor da Causa</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(selectedRecurso.valor_causa)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Relator</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedRecurso.relator || '-'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Assunto</h4>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedRecurso.assunto}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEdit(selectedRecurso);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar Recurso
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecursosList;

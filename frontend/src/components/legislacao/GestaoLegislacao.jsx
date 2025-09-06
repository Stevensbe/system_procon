import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  TagIcon,
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  ScaleIcon,
  BuildingOfficeIcon,
  UserIcon,
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';

const GestaoLegislacao = ({ onViewDetails, onEditLei, onDeleteLei }) => {
  const [loading, setLoading] = useState(true);
  const [leis, setLeis] = useState([]);
  const [filteredLeis, setFilteredLeis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    categoria: '',
    ano: '',
    orgao: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'data_publicacao',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedLeis, setSelectedLeis] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);

  const tiposLegislacao = [
    { value: 'LEI', label: 'Lei', icon: '📜', color: 'blue' },
    { value: 'DECRETO', label: 'Decreto', icon: '📋', color: 'green' },
    { value: 'PORTARIA', label: 'Portaria', icon: '📄', color: 'yellow' },
    { value: 'RESOLUCAO', label: 'Resolução', icon: '⚖️', color: 'purple' },
    { value: 'INSTRUCAO_NORMATIVA', label: 'Instrução Normativa', icon: '📓', color: 'indigo' },
    { value: 'MEDIDA_PROVISORIA', label: 'Medida Provisória', icon: '⚡', color: 'red' }
  ];

  const statusOptions = [
    { value: 'VIGENTE', label: 'Vigente', color: 'green', icon: CheckCircleIcon },
    { value: 'REVOGADA', label: 'Revogada', color: 'red', icon: XCircleIcon },
    { value: 'SUSPENSA', label: 'Suspensa', color: 'yellow', icon: ExclamationTriangleIcon },
    { value: 'EM_TRAMITACAO', label: 'Em Tramitação', color: 'blue', icon: ClockIcon }
  ];

  const categorias = [
    { value: 'DIREITO_CONSUMIDOR', label: 'Direito do Consumidor' },
    { value: 'DEFESA_CONCORRENCIA', label: 'Defesa da Concorrência' },
    { value: 'REGULACAO_MERCADO', label: 'Regulação de Mercado' },
    { value: 'TELECOMUNICACOES', label: 'Telecomunicações' },
    { value: 'ENERGIA', label: 'Energia' },
    { value: 'TRANSPORTE', label: 'Transporte' },
    { value: 'SAUDE', label: 'Saúde' },
    { value: 'EDUCACAO', label: 'Educação' },
    { value: 'MEIO_AMBIENTE', label: 'Meio Ambiente' }
  ];

  useEffect(() => {
    carregarLeis();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [leis, searchTerm, filters, sortConfig]);

  const carregarLeis = async () => {
    setLoading(true);
    try {
      // Simular API call - substituir pela chamada real
      const dadosSimulados = [
        {
          id: 1,
          tipo: 'LEI',
          numero: '8078',
          ano: 1990,
          titulo: 'Código de Defesa do Consumidor',
          ementa: 'Dispõe sobre a proteção do consumidor e dá outras providências.',
          status: 'VIGENTE',
          categoria: 'DIREITO_CONSUMIDOR',
          data_publicacao: '1990-09-11',
          orgao_publicador: 'Congresso Nacional',
          autor: 'Executivo Federal',
          visualizacoes: 15420,
          downloads: 5234,
          favoritos: 892,
          ultima_atualizacao: '2024-01-15',
          tags: ['consumidor', 'proteção', 'direitos']
        },
        {
          id: 2,
          tipo: 'LEI',
          numero: '13709',
          ano: 2018,
          titulo: 'Lei Geral de Proteção de Dados',
          ementa: 'Lei Geral de Proteção de Dados Pessoais (LGPD).',
          status: 'VIGENTE',
          categoria: 'DIREITO_CONSUMIDOR',
          data_publicacao: '2018-08-14',
          orgao_publicador: 'Congresso Nacional',
          autor: 'Poder Legislativo',
          visualizacoes: 12350,
          downloads: 3456,
          favoritos: 634,
          ultima_atualizacao: '2023-12-20',
          tags: ['dados', 'privacidade', 'lgpd']
        },
        {
          id: 3,
          tipo: 'DECRETO',
          numero: '8771',
          ano: 2025,
          titulo: 'Decreto sobre Marco Civil da Internet',
          ementa: 'Regulamenta a Lei do Marco Civil da Internet.',
          status: 'VIGENTE',
          categoria: 'REGULACAO_MERCADO',
          data_publicacao: '2025-08-10',
          orgao_publicador: 'Presidência da República',
          autor: 'Executivo Federal',
          visualizacoes: 3421,
          downloads: 876,
          favoritos: 123,
          ultima_atualizacao: '2025-08-10',
          tags: ['internet', 'marco civil', 'telecomunicações']
        },
        {
          id: 4,
          tipo: 'PORTARIA',
          numero: '456',
          ano: 2024,
          titulo: 'Portaria sobre Fiscalização de Estabelecimentos',
          ementa: 'Estabelece procedimentos para fiscalização de estabelecimentos comerciais.',
          status: 'VIGENTE',
          categoria: 'REGULACAO_MERCADO',
          data_publicacao: '2024-03-15',
          orgao_publicador: 'PROCON Nacional',
          autor: 'SENACON',
          visualizacoes: 2156,
          downloads: 543,
          favoritos: 89,
          ultima_atualizacao: '2024-05-20',
          tags: ['fiscalização', 'procedimentos', 'estabelecimentos']
        },
        {
          id: 5,
          tipo: 'LEI',
          numero: '12529',
          ano: 2011,
          titulo: 'Sistema Nacional de Defesa do Consumidor',
          ementa: 'Estrutura o Sistema Nacional de Defesa do Consumidor - SNDC.',
          status: 'VIGENTE',
          categoria: 'DIREITO_CONSUMIDOR',
          data_publicacao: '2011-11-30',
          orgao_publicador: 'Congresso Nacional',
          autor: 'Executivo Federal',
          visualizacoes: 8734,
          downloads: 2341,
          favoritos: 456,
          ultima_atualizacao: '2023-09-10',
          tags: ['sndc', 'sistema', 'defesa consumidor']
        }
      ];

      setLeis(dadosSimulados);
      
      // Calcular estatísticas
      const estatisticas = {
        total: dadosSimulados.length,
        vigentes: dadosSimulados.filter(l => l.status === 'VIGENTE').length,
        revogadas: dadosSimulados.filter(l => l.status === 'REVOGADA').length,
        por_tipo: tiposLegislacao.map(tipo => ({
          tipo: tipo.value,
          label: tipo.label,
          count: dadosSimulados.filter(l => l.tipo === tipo.value).length,
          color: tipo.color
        }))
      };
      
      setStats(estatisticas);
      
    } catch (error) {
      console.error('Erro ao carregar leis:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...leis];

    // Filtro de busca textual
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lei =>
        lei.titulo.toLowerCase().includes(searchLower) ||
        lei.ementa.toLowerCase().includes(searchLower) ||
        lei.numero.toString().includes(searchLower) ||
        lei.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtros específicos
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(lei => {
          if (key === 'ano') {
            return lei.ano.toString() === filters[key];
          }
          return lei[key] === filters[key];
        });
      }
    });

    // Ordenação
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Tratamento especial para datas
        if (sortConfig.key.includes('data')) {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        // Tratamento especial para números
        if (typeof aValue === 'string' && !isNaN(aValue)) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredLeis(filtered);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      tipo: '',
      status: '',
      categoria: '',
      ano: '',
      orgao: ''
    });
    setSearchTerm('');
  };

  const handleSelectLei = (leiId) => {
    setSelectedLeis(prev =>
      prev.includes(leiId)
        ? prev.filter(id => id !== leiId)
        : [...prev, leiId]
    );
  };

  const handleSelectAll = () => {
    const currentPageItems = getCurrentPageItems();
    const allSelected = currentPageItems.every(lei => selectedLeis.includes(lei.id));
    
    if (allSelected) {
      setSelectedLeis(prev => prev.filter(id => !currentPageItems.some(item => item.id === id)));
    } else {
      setSelectedLeis(prev => [...prev, ...currentPageItems.map(item => item.id).filter(id => !prev.includes(id))]);
    }
  };

  const handleBulkAction = (action) => {
    console.log(`Ação em lote: ${action}`, selectedLeis);
    // Implementar ações em lote
    setSelectedLeis([]);
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLeis.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredLeis.length / itemsPerPage);
  };

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return CheckCircleIcon;
    return statusOption.icon;
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return 'gray';
    return statusOption.color;
  };

  const getTipoInfo = (tipo) => {
    return tiposLegislacao.find(t => t.value === tipo) || { label: tipo, icon: '📄', color: 'gray' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const currentItems = getCurrentPageItems();
  const totalPages = getTotalPages();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Estatísticas Rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Vigentes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.vigentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Revogadas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.revogadas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Este Mês</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {leis.filter(l => {
                    const pubDate = new Date(l.data_publicacao);
                    const now = new Date();
                    return pubDate.getMonth() === now.getMonth() && pubDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho e Controles */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        
        {/* Barra de Busca e Ações */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
          
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, número, ementa ou tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtros
            </button>

            <button
              onClick={carregarLeis}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Atualizar
            </button>

            <button
              onClick={() => onEditLei?.(null)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nova Lei
            </button>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {tiposLegislacao.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={filters.categoria}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                type="number"
                value={filters.ano}
                onChange={(e) => handleFilterChange('ano', e.target.value)}
                min="1800"
                max={new Date().getFullYear() + 5}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 2024"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Ações em Lote */}
        {selectedLeis.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <span className="text-sm text-blue-700">
              {selectedLeis.length} item(ns) selecionado(s)
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
              >
                Exportar
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
              >
                Arquivar
              </button>
              <button
                onClick={() => setSelectedLeis([])}
                className="px-3 py-1 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Leis */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={currentItems.length > 0 && currentItems.every(lei => selectedLeis.includes(lei.id))}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('tipo')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Tipo/Número</span>
                    <ChevronUpDownIcon className="h-4 w-4" />
                  </button>
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('titulo')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Título</span>
                    <ChevronUpDownIcon className="h-4 w-4" />
                  </button>
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Status</span>
                    <ChevronUpDownIcon className="h-4 w-4" />
                  </button>
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('data_publicacao')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Publicação</span>
                    <ChevronUpDownIcon className="h-4 w-4" />
                  </button>
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estatísticas
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((lei) => {
                const tipoInfo = getTipoInfo(lei.tipo);
                const StatusIcon = getStatusIcon(lei.status);
                const statusColor = getStatusColor(lei.status);
                
                return (
                  <tr
                    key={lei.id}
                    className={`hover:bg-gray-50 ${selectedLeis.includes(lei.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeis.includes(lei.id)}
                        onChange={() => handleSelectLei(lei.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{tipoInfo.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lei.tipo} Nº {lei.numero}/{lei.ano}
                          </div>
                          <div className="text-xs text-gray-500">
                            {lei.categoria}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {lei.titulo}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {lei.ementa}
                        </div>
                        {lei.tags && lei.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lei.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {lei.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{lei.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {lei.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(lei.data_publicacao)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lei.orgao_publicador}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          {lei.visualizacoes?.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                          {lei.downloads?.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <HeartIcon className="h-3 w-3 mr-1 text-red-400" />
                          {lei.favoritos?.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewDetails?.(lei)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Visualizar"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onEditLei?.(lei)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onDeleteLei?.(lei)}
                          className="p-1 text-red-600 hover:text-red-800"
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t">
            <div className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredLeis.length)}
              </span>{' '}
              de{' '}
              <span className="font-medium">{filteredLeis.length}</span>{' '}
              resultados
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estado Vazio */}
      {filteredLeis.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <BookOpenIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma legislação encontrada
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || Object.values(filters).some(f => f)
              ? 'Tente ajustar os filtros ou termos de busca.'
              : 'Comece cadastrando uma nova legislação.'
            }
          </p>
          <button
            onClick={() => onEditLei?.(null)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nova Legislação
          </button>
        </div>
      )}
    </div>
  );
};

export default GestaoLegislacao;
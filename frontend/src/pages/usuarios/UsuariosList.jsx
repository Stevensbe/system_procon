import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const UsuariosList = () => {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    perfil: '',
    status: '',
    dataInicio: '',
    dataFim: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'nome',
    direction: 'asc'
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [usuarios, filters, sortConfig]);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      // Simular dados da API
      const mockUsuarios = [
        {
          id: 1,
          nome: 'João Silva',
          email: 'joao.silva@procon.gov.br',
          telefone: '(11) 99999-9999',
          perfil: 'Administrador',
          status: 'ativo',
          ultimoAcesso: '2024-01-15T10:30:00',
          dataCriacao: '2023-01-15',
          departamento: 'TI',
          cargo: 'Administrador de Sistemas',
          tentativasLogin: 0,
          bloqueado: false,
          foto: null
        },
        {
          id: 2,
          nome: 'Maria Santos',
          email: 'maria.santos@procon.gov.br',
          telefone: '(11) 88888-8888',
          perfil: 'Fiscal',
          status: 'ativo',
          ultimoAcesso: '2024-01-15T09:15:00',
          dataCriacao: '2023-02-20',
          departamento: 'Fiscalização',
          cargo: 'Fiscal',
          tentativasLogin: 0,
          bloqueado: false,
          foto: null
        },
        {
          id: 3,
          nome: 'Pedro Costa',
          email: 'pedro.costa@procon.gov.br',
          telefone: '(11) 77777-7777',
          perfil: 'Analista Jurídico',
          status: 'ativo',
          ultimoAcesso: '2024-01-14T16:45:00',
          dataCriacao: '2023-03-10',
          departamento: 'Jurídico',
          cargo: 'Analista Jurídico',
          tentativasLogin: 0,
          bloqueado: false,
          foto: null
        },
        {
          id: 4,
          nome: 'Ana Oliveira',
          email: 'ana.oliveira@procon.gov.br',
          telefone: '(11) 66666-6666',
          perfil: 'Secretário',
          status: 'inativo',
          ultimoAcesso: '2024-01-10T14:20:00',
          dataCriacao: '2023-04-05',
          departamento: 'Administrativo',
          cargo: 'Secretária',
          tentativasLogin: 3,
          bloqueado: true,
          foto: null
        },
        {
          id: 5,
          nome: 'Carlos Lima',
          email: 'carlos.lima@procon.gov.br',
          telefone: '(11) 55555-5555',
          perfil: 'Coordenador',
          status: 'ativo',
          ultimoAcesso: '2024-01-15T11:00:00',
          dataCriacao: '2023-05-12',
          departamento: 'Coordenação',
          cargo: 'Coordenador',
          tentativasLogin: 0,
          bloqueado: false,
          foto: null
        },
        {
          id: 6,
          nome: 'Lucia Ferreira',
          email: 'lucia.ferreira@procon.gov.br',
          telefone: '(11) 44444-4444',
          perfil: 'Estagiário',
          status: 'pendente',
          ultimoAcesso: null,
          dataCriacao: '2024-01-10',
          departamento: 'Jurídico',
          cargo: 'Estagiário',
          tentativasLogin: 0,
          bloqueado: false,
          foto: null
        }
      ];

      setUsuarios(mockUsuarios);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...usuarios];

    // Filtro de busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(usuario =>
        usuario.nome.toLowerCase().includes(searchTerm) ||
        usuario.email.toLowerCase().includes(searchTerm) ||
        usuario.departamento.toLowerCase().includes(searchTerm) ||
        usuario.cargo.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por perfil
    if (filters.perfil) {
      filtered = filtered.filter(usuario => usuario.perfil === filters.perfil);
    }

    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(usuario => usuario.status === filters.status);
    }

    // Filtro por data
    if (filters.dataInicio) {
      filtered = filtered.filter(usuario => 
        new Date(usuario.dataCriacao) >= new Date(filters.dataInicio)
      );
    }

    if (filters.dataFim) {
      filtered = filtered.filter(usuario => 
        new Date(usuario.dataCriacao) <= new Date(filters.dataFim)
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

    setFilteredUsuarios(filtered);
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
      case 'ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inativo':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ativo':
        return CheckCircleIcon;
      case 'inativo':
        return XCircleIcon;
      case 'pendente':
        return ClockIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getPerfilColor = (perfil) => {
    switch (perfil) {
      case 'Administrador':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Fiscal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Analista Jurídico':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Secretário':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Coordenador':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Estagiário':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
    }
  };

  const handleToggleStatus = (id) => {
    setUsuarios(prev => prev.map(usuario => 
      usuario.id === id 
        ? { ...usuario, status: usuario.status === 'ativo' ? 'inativo' : 'ativo' }
        : usuario
    ));
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Usuários</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Gerencie usuários, permissões e acessos ao sistema
            </p>
          </div>
          <Link
            to="/usuarios/novo"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Usuário
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Perfil */}
          <select
            value={filters.perfil}
            onChange={(e) => handleFilterChange('perfil', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Todos os perfis</option>
            <option value="Administrador">Administrador</option>
            <option value="Fiscal">Fiscal</option>
            <option value="Analista Jurídico">Analista Jurídico</option>
            <option value="Secretário">Secretário</option>
            <option value="Coordenador">Coordenador</option>
            <option value="Estagiário">Estagiário</option>
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="pendente">Pendente</option>
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
            {filteredUsuarios.length} usuário(s) encontrado(s)
          </p>
          <button
            onClick={() => setFilters({
              search: '',
              perfil: '',
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
                    onClick={() => handleSort('nome')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Usuário
                    {sortConfig.key === 'nome' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('perfil')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Perfil
                    {sortConfig.key === 'perfil' && (
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
                    onClick={() => handleSort('ultimoAcesso')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Último Acesso
                    {sortConfig.key === 'ultimoAcesso' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                        <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('dataCriacao')}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Data Criação
                    {sortConfig.key === 'dataCriacao' && (
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
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {usuario.nome}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {usuario.email}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1">
                          <PhoneIcon className="h-3 w-3 mr-1" />
                          {usuario.telefone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerfilColor(usuario.perfil)}`}>
                        <ShieldCheckIcon className="h-3 w-3 mr-1" />
                        {usuario.perfil}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {usuario.departamento} • {usuario.cargo}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(usuario.status)}`}>
                        {React.createElement(getStatusIcon(usuario.status), { className: "h-3 w-3 mr-1" })}
                        {usuario.status === 'ativo' ? 'Ativo' : 
                         usuario.status === 'inativo' ? 'Inativo' : 'Pendente'}
                      </span>
                      {usuario.bloqueado && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500 ml-2" title="Usuário bloqueado" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(usuario.ultimoAcesso)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDateOnly(usuario.dataCriacao)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/usuarios/${usuario.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Visualizar"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/usuarios/${usuario.id}/editar`}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(usuario.id)}
                        className={`${
                          usuario.status === 'ativo' 
                            ? 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300' 
                            : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'
                        }`}
                        title={usuario.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      >
                        {usuario.status === 'ativo' ? 
                          <XCircleIcon className="h-4 w-4" /> : 
                          <CheckCircleIcon className="h-4 w-4" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(usuario.id)}
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

export default UsuariosList;

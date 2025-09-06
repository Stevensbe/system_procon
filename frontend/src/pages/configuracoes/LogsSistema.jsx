import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon,
  MagnifyingGlassIcon, FunnelIcon, EyeIcon, TrashIcon, ArrowDownTrayIcon,
  ClockIcon, CalendarIcon, InformationCircleIcon, XCircleIcon, CogIcon,
  ServerIcon, UserIcon, BuildingOfficeIcon, ScaleIcon, UserGroupIcon
} from '@heroicons/react/24/outline';
import { useNavigate, Link } from 'react-router-dom';

const LogsSistema = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    nivel: '',
    modulo: '',
    usuario: '',
    dataInicio: '',
    dataFim: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    // Configurações de Log
    logAtivo: true,
    nivelLog: 'info',
    rotacaoLog: 'diaria',
    retencaoLog: 90,
    tamanhoMaximoLog: 100,
    compressaoLog: true,
    criptografiaLog: false,
    
    // Configurações de Log Remoto
    logRemoto: false,
    servidorLog: '',
    portaLog: 514,
    protocoloLog: 'UDP',
    usuarioLog: '',
    senhaLog: '',
    formatoLog: 'syslog',
    
    // Configurações de Notificação
    notificarErros: true,
    notificarCriticos: true,
    emailNotificacao: 'admin@procon.gov.br',
    limiteNotificacoes: 10,
    intervaloNotificacoes: 60
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadLogs();
    loadLogConfig();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados de logs
      const mockLogs = [
        {
          id: 1,
          timestamp: '2024-01-15T14:30:25',
          nivel: 'info',
          modulo: 'sistema',
          usuario: 'admin',
          acao: 'Login realizado com sucesso',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'sucesso',
          detalhes: 'Usuário admin fez login no sistema'
        },
        {
          id: 2,
          timestamp: '2024-01-15T14:28:15',
          nivel: 'warning',
          modulo: 'fiscalizacao',
          usuario: 'fiscal1',
          acao: 'Tentativa de acesso negada',
          ip: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'erro',
          detalhes: 'Usuário tentou acessar módulo sem permissão'
        },
        {
          id: 3,
          timestamp: '2024-01-15T14:25:42',
          nivel: 'error',
          modulo: 'juridico',
          usuario: 'juridico1',
          acao: 'Erro ao salvar processo',
          ip: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'erro',
          detalhes: 'Erro de conexão com banco de dados'
        },
        {
          id: 4,
          timestamp: '2024-01-15T14:20:18',
          nivel: 'critical',
          modulo: 'sistema',
          usuario: 'sistema',
          acao: 'Falha crítica no sistema',
          ip: '127.0.0.1',
          userAgent: 'Sistema',
          status: 'erro',
          detalhes: 'Serviço de backup falhou'
        },
        {
          id: 5,
          timestamp: '2024-01-15T14:15:33',
          nivel: 'info',
          modulo: 'usuarios',
          usuario: 'admin',
          acao: 'Usuário criado',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'sucesso',
          detalhes: 'Novo usuário fiscal2 criado'
        },
        {
          id: 6,
          timestamp: '2024-01-15T14:10:55',
          nivel: 'debug',
          modulo: 'relatorios',
          usuario: 'relatorios1',
          acao: 'Relatório gerado',
          ip: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'sucesso',
          detalhes: 'Relatório de fiscalização gerado'
        },
        {
          id: 7,
          timestamp: '2024-01-15T14:05:12',
          nivel: 'warning',
          modulo: 'backup',
          usuario: 'sistema',
          acao: 'Backup com aviso',
          ip: '127.0.0.1',
          userAgent: 'Sistema',
          status: 'aviso',
          detalhes: 'Espaço em disco baixo para backup'
        },
        {
          id: 8,
          timestamp: '2024-01-15T14:00:00',
          nivel: 'info',
          modulo: 'sistema',
          usuario: 'sistema',
          acao: 'Backup automático realizado',
          ip: '127.0.0.1',
          userAgent: 'Sistema',
          status: 'sucesso',
          detalhes: 'Backup diário concluído com sucesso'
        }
      ];
      
      setLogs(mockLogs);
      setFilteredLogs(mockLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogConfig = async () => {
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 500));
      // Os dados já estão no estado inicial
    } catch (error) {
      console.error('Erro ao carregar configurações de log:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.acao.toLowerCase().includes(searchTerm) ||
        log.detalhes.toLowerCase().includes(searchTerm) ||
        log.usuario.toLowerCase().includes(searchTerm) ||
        log.ip.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.nivel) {
      filtered = filtered.filter(log => log.nivel === filters.nivel);
    }

    if (filters.modulo) {
      filtered = filtered.filter(log => log.modulo === filters.modulo);
    }

    if (filters.usuario) {
      filtered = filtered.filter(log => log.usuario === filters.usuario);
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    if (filters.dataInicio) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dataInicio));
    }

    if (filters.dataFim) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dataFim));
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.logRemoto && !formData.servidorLog.trim()) {
      newErrors.servidorLog = 'Servidor de log é obrigatório';
    }

    if (formData.logRemoto && !formData.usuarioLog.trim()) {
      newErrors.usuarioLog = 'Usuário de log é obrigatório';
    }

    if (formData.portaLog < 1 || formData.portaLog > 65535) {
      newErrors.portaLog = 'Porta deve estar entre 1 e 65535';
    }

    if (formData.retencaoLog < 1 || formData.retencaoLog > 365) {
      newErrors.retencaoLog = 'Retenção deve estar entre 1 e 365 dias';
    }

    if (formData.tamanhoMaximoLog < 1 || formData.tamanhoMaximoLog > 1000) {
      newErrors.tamanhoMaximoLog = 'Tamanho máximo deve estar entre 1 e 1000 MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Configurações de log salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Simular limpeza
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLogs([]);
      setFilteredLogs([]);
      alert('Logs limpos com sucesso!');
    } catch (error) {
      alert('Erro ao limpar logs. Tente novamente.');
    }
  };

  const handleExportLogs = async () => {
    try {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Exportação de logs iniciada!');
    } catch (error) {
      alert('Erro ao exportar logs. Tente novamente.');
    }
  };

  const handleTestConnection = async () => {
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Teste de conexão realizado com sucesso!');
    } catch (error) {
      alert('Erro no teste de conexão. Verifique as configurações.');
    }
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'debug': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'critical': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getNivelIcon = (nivel) => {
    switch (nivel) {
      case 'debug': return <InformationCircleIcon className="w-4 h-4" />;
      case 'info': return <InformationCircleIcon className="w-4 h-4" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'error': return <XCircleIcon className="w-4 h-4" />;
      case 'critical': return <XCircleIcon className="w-4 h-4" />;
      default: return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sucesso': return 'text-green-600';
      case 'erro': return 'text-red-600';
      case 'aviso': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getModuloIcon = (modulo) => {
    switch (modulo) {
      case 'sistema': return <ServerIcon className="w-4 h-4" />;
      case 'usuarios': return <UserGroupIcon className="w-4 h-4" />;
      case 'fiscalizacao': return <BuildingOfficeIcon className="w-4 h-4" />;
      case 'juridico': return <ScaleIcon className="w-4 h-4" />;
      case 'relatorios': return <DocumentTextIcon className="w-4 h-4" />;
      case 'backup': return <DocumentTextIcon className="w-4 h-4" />;
      default: return <CogIcon className="w-4 h-4" />;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/configuracoes/dashboard"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Logs do Sistema
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize e gerencie os logs do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTestConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Testar Conexão
          </button>
          <button
            onClick={handleExportLogs}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Exportar Logs
          </button>
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Limpar Logs
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filtros
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Buscar nos logs..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nível
              </label>
              <select
                value={filters.nivel}
                onChange={(e) => handleFilterChange('nivel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Módulo
              </label>
              <select
                value={filters.modulo}
                onChange={(e) => handleFilterChange('modulo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="sistema">Sistema</option>
                <option value="usuarios">Usuários</option>
                <option value="fiscalizacao">Fiscalização</option>
                <option value="juridico">Jurídico</option>
                <option value="relatorios">Relatórios</option>
                <option value="backup">Backup</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="sucesso">Sucesso</option>
                <option value="erro">Erro</option>
                <option value="aviso">Aviso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Início
              </label>
              <input
                type="datetime-local"
                value={filters.dataInicio}
                onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Fim
              </label>
              <input
                type="datetime-local"
                value={filters.dataFim}
                onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={filters.usuario}
                onChange={(e) => handleFilterChange('usuario', e.target.value)}
                placeholder="Filtrar por usuário..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Logs do Sistema ({filteredLogs.length} registros)
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getNivelColor(log.nivel)}`}>
                        {getNivelIcon(log.nivel)}
                        <span className="capitalize">{log.nivel}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        {getModuloIcon(log.modulo)}
                        <span className="text-sm capitalize">{log.modulo}</span>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'sucesso' ? 'Sucesso' : 
                         log.status === 'erro' ? 'Erro' : 'Aviso'}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {log.acao}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {log.detalhes}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <UserIcon className="w-3 h-3" />
                        <span>{log.usuario}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ServerIcon className="w-3 h-3" />
                        <span>{log.ip}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => alert(`Detalhes completos:\n${JSON.stringify(log, null, 2)}`)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Ver detalhes"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum log encontrado com os filtros aplicados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configurações de Log */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CogIcon className="w-5 h-5 mr-2" />
              Configurações de Log
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nível de Log
                </label>
                <select
                  value={formData.nivelLog}
                  onChange={(e) => handleInputChange('nivelLog', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rotação de Log
                </label>
                <select
                  value={formData.rotacaoLog}
                  onChange={(e) => handleInputChange('rotacaoLog', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="diaria">Diária</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                  <option value="por_tamanho">Por Tamanho</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Retenção (dias)
                </label>
                <input
                  type="number"
                  value={formData.retencaoLog}
                  onChange={(e) => handleInputChange('retencaoLog', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.retencaoLog ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.retencaoLog && (
                  <p className="mt-1 text-sm text-red-600">{errors.retencaoLog}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamanho Máximo (MB)
                </label>
                <input
                  type="number"
                  value={formData.tamanhoMaximoLog}
                  onChange={(e) => handleInputChange('tamanhoMaximoLog', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.tamanhoMaximoLog ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tamanhoMaximoLog && (
                  <p className="mt-1 text-sm text-red-600">{errors.tamanhoMaximoLog}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.logAtivo}
                  onChange={(e) => handleInputChange('logAtivo', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Logs
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.compressaoLog}
                  onChange={(e) => handleInputChange('compressaoLog', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Comprimir Logs
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.criptografiaLog}
                  onChange={(e) => handleInputChange('criptografiaLog', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Criptografar Logs
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/configuracoes/dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogsSistema;

import React, { useState, useEffect } from 'react';
import { 
  DocumentMagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  ClockIcon,
  UserIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAudit } from '../../utils/audit';

const AuditLogViewer = () => {
  const { getLogs, exportLogs, getStats } = useAudit();
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    type: '',
    level: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = () => {
    setIsLoading(true);
    const filteredLogs = getLogs(filters);
    setLogs(filteredLogs);
    setIsLoading(false);
  };

  const loadStats = () => {
    const auditStats = getStats();
    setStats(auditStats);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      level: '',
      userId: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleExport = (format) => {
    const data = exportLogs(format);
    const blob = new Blob([data], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'security':
        return <ShieldExclamationIcon className="h-4 w-4 text-orange-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'http_request':
        return <GlobeAltIcon className="h-4 w-4" />;
      case 'user_action':
        return <UserIcon className="h-4 w-4" />;
      case 'route_change':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <DocumentMagnifyingGlassIcon className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'security':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const formatDuration = (duration) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const renderLogDetails = (log) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">Timestamp:</span>
            <p className="text-gray-900 dark:text-gray-100">{formatTimestamp(log.timestamp)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">Tipo:</span>
            <p className="text-gray-900 dark:text-gray-100">{log.type}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">Nível:</span>
            <p className="text-gray-900 dark:text-gray-100">{log.level}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">Usuário:</span>
            <p className="text-gray-900 dark:text-gray-100">{log.userId}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">Sessão:</span>
            <p className="text-gray-900 dark:text-gray-100">{log.sessionId}</p>
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-500 dark:text-gray-400">Dados:</span>
          <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(log.data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentMagnifyingGlassIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Visualizador de Logs de Auditoria
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {logs.length} logs encontrados
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleExport('json')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Exportar JSON"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.recent || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Última Hora</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.byLevel?.critical || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Críticos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.byLevel?.security || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Segurança</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os tipos</option>
                <option value="http_request">Requisições HTTP</option>
                <option value="user_action">Ações do Usuário</option>
                <option value="route_change">Mudanças de Rota</option>
                <option value="security">Segurança</option>
                <option value="critical_error">Erros Críticos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nível
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os níveis</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuário
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Filtrar por usuário"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Inicial
              </label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Final
              </label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Lista de Logs */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Carregando logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Nenhum log encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tente ajustar os filtros para ver mais resultados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${getLevelColor(log.level)}`}
                onClick={() => setSelectedLog(selectedLog?.timestamp === log.timestamp ? null : log)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(log.type)}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          log.level === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          log.level === 'security' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          log.level === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          log.level === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {log.level}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Usuário:</span> {log.userId} | 
                      <span className="font-medium ml-2">Sessão:</span> {log.sessionId}
                    </div>

                    {/* Dados resumidos */}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {log.type === 'http_request' && (
                        <span>
                          {log.data.method} {log.data.url} - {log.data.status} ({formatDuration(log.data.duration)})
                        </span>
                      )}
                      {log.type === 'user_action' && (
                        <span>
                          {log.data.action} - {log.data.element} {log.data.text ? `"${log.data.text}"` : ''}
                        </span>
                      )}
                      {log.type === 'route_change' && (
                        <span>
                          {log.data.from} → {log.data.to}
                        </span>
                      )}
                      {log.type === 'security' && (
                        <span>
                          {log.data.event} - {log.data.details}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {selectedLog?.timestamp === log.timestamp && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    {renderLogDetails(log)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rodapé */}
      {logs.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {logs.length} logs
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('csv')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Exportar CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Exportar JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AuditoriaPage = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: 'TODOS',
    usuario: '',
    nivel: 'TODOS'
  });

  useEffect(() => {
    loadLogs();
  }, [filtros]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const logsSimulados = [
        {
          id: 1,
          timestamp: '2024-01-20 18:30:25',
          nivel: 'INFO',
          usuario: 'joao.silva@procon.am.gov.br',
          acao: 'LOGIN',
          descricao: 'Usuário fez login no sistema',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: 2,
          timestamp: '2024-01-20 18:25:10',
          nivel: 'WARNING',
          usuario: 'maria.santos@procon.am.gov.br',
          acao: 'TENTATIVA_LOGIN',
          descricao: 'Tentativa de login com senha incorreta',
          ip: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: 3,
          timestamp: '2024-01-20 18:20:45',
          nivel: 'INFO',
          usuario: 'carlos.oliveira@procon.am.gov.br',
          acao: 'CRIAR_AUTO',
          descricao: 'Criou novo auto de infração #2024-001',
          ip: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: 4,
          timestamp: '2024-01-20 18:15:30',
          nivel: 'ERROR',
          usuario: 'sistema@procon.am.gov.br',
          acao: 'ERRO_SISTEMA',
          descricao: 'Erro ao processar backup automático',
          ip: '192.168.1.1',
          userAgent: 'Sistema Automático'
        },
        {
          id: 5,
          timestamp: '2024-01-20 18:10:15',
          nivel: 'INFO',
          usuario: 'ana.costa@procon.am.gov.br',
          acao: 'EDITAR_USUARIO',
          descricao: 'Editou dados do usuário ID: 123',
          ip: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: 6,
          timestamp: '2024-01-20 18:05:00',
          nivel: 'SECURITY',
          usuario: 'sistema@procon.am.gov.br',
          acao: 'BLOQUEIO_USUARIO',
          descricao: 'Usuário bloqueado por múltiplas tentativas de login',
          ip: '192.168.1.104',
          userAgent: 'Sistema de Segurança'
        }
      ];

      setLogs(logsSimulados);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'SECURITY':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getNivelIcon = (nivel) => {
    switch (nivel) {
      case 'INFO':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'WARNING':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'ERROR':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'SECURITY':
        return <ShieldCheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesData = (!filtros.dataInicio || log.timestamp >= filtros.dataInicio) &&
                       (!filtros.dataFim || log.timestamp <= filtros.dataFim);
    const matchesTipo = filtros.tipo === 'TODOS' || log.acao === filtros.tipo;
    const matchesUsuario = !filtros.usuario || log.usuario.toLowerCase().includes(filtros.usuario.toLowerCase());
    const matchesNivel = filtros.nivel === 'TODOS' || log.nivel === filtros.nivel;
    
    return matchesData && matchesTipo && matchesUsuario && matchesNivel;
  });

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
      <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoria do Sistema</h1>
            <p className="text-gray-600 dark:text-gray-300">Monitore logs de segurança e atividades do sistema</p>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Início
            </label>
            <input
              type="datetime-local"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Fim
            </label>
            <input
              type="datetime-local"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Ação
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            >
              <option value="TODOS">Todas as Ações</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CRIAR_AUTO">Criar Auto</option>
              <option value="EDITAR_AUTO">Editar Auto</option>
              <option value="EXCLUIR_AUTO">Excluir Auto</option>
              <option value="CRIAR_USUARIO">Criar Usuário</option>
              <option value="EDITAR_USUARIO">Editar Usuário</option>
              <option value="EXCLUIR_USUARIO">Excluir Usuário</option>
              <option value="TENTATIVA_LOGIN">Tentativa de Login</option>
              <option value="BLOQUEIO_USUARIO">Bloqueio de Usuário</option>
              <option value="ERRO_SISTEMA">Erro do Sistema</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nível
            </label>
            <select
              value={filtros.nivel}
              onChange={(e) => setFiltros({...filtros, nivel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            >
              <option value="TODOS">Todos os Níveis</option>
              <option value="INFO">Informação</option>
              <option value="WARNING">Aviso</option>
              <option value="ERROR">Erro</option>
              <option value="SECURITY">Segurança</option>
            </select>
          </div>
          
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={filtros.usuario}
              onChange={(e) => setFiltros({...filtros, usuario: e.target.value})}
              placeholder="Buscar por usuário..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            />
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <InformationCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Logs de Informação</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {logs.filter(log => log.nivel === 'INFO').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Avisos</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                {logs.filter(log => log.nivel === 'WARNING').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Erros</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                {logs.filter(log => log.nivel === 'ERROR').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Eventos de Segurança</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                {logs.filter(log => log.nivel === 'SECURITY').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logs de Auditoria</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Mostrando {filteredLogs.length} de {logs.length} registros
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getNivelIcon(log.nivel)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNivelColor(log.nivel)}`}>
                        {log.nivel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.usuario}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.acao}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs truncate" title={log.descricao}>
                      {log.descricao}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300"
                        title="Ver detalhes"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-300"
                        title="Exportar"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relatórios de Segurança */}
      <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Relatórios de Segurança</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tentativas de Login Falhadas</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Últimas 24 horas: {logs.filter(log => log.acao === 'TENTATIVA_LOGIN').length} tentativas
            </p>
            <button className="mt-2 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm">
              Ver relatório completo →
            </button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Usuários Bloqueados</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Atualmente: {logs.filter(log => log.acao === 'BLOQUEIO_USUARIO').length} usuários
            </p>
            <button className="mt-2 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm">
              Ver detalhes →
            </button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Atividades Críticas</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hoje: {logs.filter(log => ['CRIAR_USUARIO', 'EDITAR_USUARIO', 'EXCLUIR_USUARIO'].includes(log.acao)).length} ações
            </p>
            <button className="mt-2 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm">
              Ver histórico →
            </button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Erros do Sistema</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Últimas 24h: {logs.filter(log => log.acao === 'ERRO_SISTEMA').length} erros
            </p>
            <button className="mt-2 text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm">
              Ver logs de erro →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaPage;

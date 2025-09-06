import React, { useState, useEffect } from 'react';
import {
  CogIcon, ShieldCheckIcon, DocumentTextIcon, ExclamationTriangleIcon,
  CheckCircleIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon, CalendarIcon, EyeIcon,
  CloudArrowUpIcon, ArrowPathIcon, ChartBarIcon, WrenchScrewdriverIcon, BellIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

const ConfiguracoesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [stats, setStats] = useState({
    totalConfiguracoes: 0,
    configuracoesAtivas: 0,
    configuracoesPendentes: 0,
    backupsRealizados: 0,
    backupsPendentes: 0,
    logsGerados: 0,
    logsErro: 0,
    logsAviso: 0,
    sistemaEstavel: true,
    ultimaAtualizacao: '',
    proximoBackup: '',
    espacoDisco: 0
  });

  const [chartData, setChartData] = useState({
    logsPorTipo: [],
    backupsPorMes: [],
    configuracoesPorModulo: [],
    performanceSistema: [],
    alertasPorDia: []
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, [periodoSelecionado]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular dados da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalConfiguracoes: 156,
        configuracoesAtivas: 142,
        configuracoesPendentes: 14,
        backupsRealizados: 28,
        backupsPendentes: 2,
        logsGerados: 15420,
        logsErro: 23,
        logsAviso: 156,
        sistemaEstavel: true,
        ultimaAtualizacao: '2024-01-15T10:30:00',
        proximoBackup: '2024-01-16T02:00:00',
        espacoDisco: 78
      });

      setChartData({
        logsPorTipo: [
          { name: 'Informação', value: 15200, color: '#3B82F6' },
          { name: 'Aviso', value: 156, color: '#F59E0B' },
          { name: 'Erro', value: 23, color: '#EF4444' },
          { name: 'Crítico', value: 5, color: '#7C2D12' }
        ],
        backupsPorMes: [
          { mes: 'Jan', backups: 28, restauracao: 2 },
          { mes: 'Fev', backups: 25, restauracao: 1 },
          { mes: 'Mar', backups: 30, restauracao: 0 },
          { mes: 'Abr', backups: 27, restauracao: 1 },
          { mes: 'Mai', backups: 29, restauracao: 0 },
          { mes: 'Jun', backups: 26, restauracao: 1 }
        ],
        configuracoesPorModulo: [
          { modulo: 'Sistema', configuracoes: 45, ativas: 42 },
          { modulo: 'Usuários', configuracoes: 32, ativas: 30 },
          { modulo: 'Segurança', configuracoes: 28, ativas: 25 },
          { modulo: 'Backup', configuracoes: 18, ativas: 18 },
          { modulo: 'Logs', configuracoes: 15, ativas: 15 },
          { modulo: 'Notificações', configuracoes: 18, ativas: 12 }
        ],
        performanceSistema: [
          { hora: '00:00', cpu: 15, memoria: 45, disco: 30 },
          { hora: '04:00', cpu: 8, memoria: 35, disco: 28 },
          { hora: '08:00', cpu: 65, memoria: 78, disco: 45 },
          { hora: '12:00', cpu: 85, memoria: 82, disco: 52 },
          { hora: '16:00', cpu: 72, memoria: 75, disco: 48 },
          { hora: '20:00', cpu: 45, memoria: 60, disco: 38 }
        ],
        alertasPorDia: [
          { dia: 'Seg', alertas: 5, criticos: 1 },
          { dia: 'Ter', alertas: 3, criticos: 0 },
          { dia: 'Qua', alertas: 7, criticos: 2 },
          { dia: 'Qui', alertas: 4, criticos: 0 },
          { dia: 'Sex', alertas: 6, criticos: 1 },
          { dia: 'Sab', alertas: 2, criticos: 0 },
          { dia: 'Dom', alertas: 1, criticos: 0 }
        ]
      });

      setRecentActivities([
        {
          id: 1,
          tipo: 'configuracao',
          acao: 'Configuração atualizada',
          modulo: 'Sistema',
          usuario: 'admin',
          data: '2024-01-15T14:30:00',
          status: 'sucesso'
        },
        {
          id: 2,
          tipo: 'backup',
          acao: 'Backup automático realizado',
          modulo: 'Backup',
          usuario: 'sistema',
          data: '2024-01-15T02:00:00',
          status: 'sucesso'
        },
        {
          id: 3,
          tipo: 'log',
          acao: 'Log de erro detectado',
          modulo: 'Sistema',
          usuario: 'sistema',
          data: '2024-01-15T10:15:00',
          status: 'erro'
        },
        {
          id: 4,
          tipo: 'configuracao',
          acao: 'Parâmetro alterado',
          modulo: 'Segurança',
          usuario: 'admin',
          data: '2024-01-15T09:45:00',
          status: 'sucesso'
        },
        {
          id: 5,
          tipo: 'backup',
          acao: 'Restauração solicitada',
          modulo: 'Backup',
          usuario: 'admin',
          data: '2024-01-15T08:20:00',
          status: 'pendente'
        }
      ]);

      setSystemStatus({
        servidor: { status: 'online', uptime: '15 dias, 8 horas' },
        banco: { status: 'online', conexoes: 45 },
        backup: { status: 'online', ultimoBackup: '2024-01-15T02:00:00' },
        logs: { status: 'online', arquivos: 156 },
        seguranca: { status: 'online', firewall: 'ativo' }
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'pendente': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'offline': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'pendente': return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      default: return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityIcon = (tipo) => {
    switch (tipo) {
      case 'configuracao': return <CogIcon className="w-4 h-4" />;
      case 'backup': return <DocumentTextIcon className="w-4 h-4" />;
      case 'log': return <DocumentTextIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard de Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral das configurações do sistema
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <select
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="semana">Última Semana</option>
            <option value="mes">Último Mês</option>
            <option value="trimestre">Último Trimestre</option>
            <option value="ano">Último Ano</option>
          </select>
        </div>
      </div>

      {/* Status do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(systemStatus).map(([key, value]) => (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {key}
                </p>
                <p className={`text-lg font-semibold ${getStatusColor(value.status)}`}>
                  {value.status === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
              {getStatusIcon(value.status)}
            </div>
            {value.uptime && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Uptime: {value.uptime}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CogIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Configurações
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalConfiguracoes)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">
              {stats.configuracoesAtivas} ativas
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Backups
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.backupsRealizados)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ClockIcon className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-yellow-600 dark:text-yellow-400">
              {stats.backupsPendentes} pendentes
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Logs Gerados
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.logsGerados)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-600 dark:text-red-400">
              {stats.logsErro} erros
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Espaço Disco
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.espacoDisco}%
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {stats.espacoDisco > 80 ? (
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-1" />
            ) : (
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
            )}
            <span className={stats.espacoDisco > 80 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
              {stats.espacoDisco > 80 ? 'Crítico' : 'Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs por Tipo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Logs por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.logsPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.logsPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance do Sistema */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance do Sistema
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.performanceSistema}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cpu" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              <Area type="monotone" dataKey="memoria" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="disco" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Backups por Mês */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Backups por Mês
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.backupsPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="backups" fill="#3B82F6" />
              <Bar dataKey="restauracao" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas por Dia */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alertas por Dia
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.alertasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="alertas" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="criticos" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Atividades Recentes
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.acao}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Módulo: {activity.modulo} • Usuário: {activity.usuario}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(activity.data)}
                  </p>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(activity.status)}
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/configuracoes/sistema"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <CogIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Configurações do Sistema
            </span>
          </Link>

          <Link
            to="/configuracoes/parametros"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <WrenchScrewdriverIcon className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Parâmetros Gerais
            </span>
          </Link>

          <Link
            to="/configuracoes/backup"
            className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <CloudArrowUpIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Backup e Restauração
            </span>
          </Link>

          <Link
            to="/configuracoes/logs"
            className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <DocumentTextIcon className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Logs do Sistema
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesDashboard;

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  EyeIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

const RelatoriosDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [stats, setStats] = useState({
    totalRelatorios: 0,
    relatoriosGerados: 0,
    relatoriosPendentes: 0,
    downloads: 0,
    fiscalizacao: 0,
    juridico: 0,
    usuarios: 0,
    financeiro: 0
  });

  const [chartData, setChartData] = useState({
    relatoriosPorMes: [],
    downloadsPorTipo: [],
    performanceModulos: [],
    tendencias: []
  });

  const [recentReports, setRecentReports] = useState([]);
  const [popularReports, setPopularReports] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [periodoSelecionado]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular dados da API
      const mockStats = {
        totalRelatorios: 45,
        relatoriosGerados: 38,
        relatoriosPendentes: 7,
        downloads: 1247,
        fiscalizacao: 156,
        juridico: 89,
        usuarios: 67,
        financeiro: 234
      };

      const mockChartData = {
        relatoriosPorMes: [
          { mes: 'Jan', gerados: 12, downloads: 156, usuarios: 45 },
          { mes: 'Fev', gerados: 15, downloads: 189, usuarios: 52 },
          { mes: 'Mar', gerados: 18, downloads: 234, usuarios: 61 },
          { mes: 'Abr', gerados: 22, downloads: 287, usuarios: 68 },
          { mes: 'Mai', gerados: 25, downloads: 312, usuarios: 74 },
          { mes: 'Jun', gerados: 28, downloads: 345, usuarios: 81 }
        ],
        downloadsPorTipo: [
          { tipo: 'Fiscalização', quantidade: 456, cor: '#EF4444' },
          { tipo: 'Jurídico', quantidade: 234, cor: '#3B82F6' },
          { tipo: 'Usuários', quantidade: 189, cor: '#10B981' },
          { tipo: 'Financeiro', quantidade: 367, cor: '#F59E0B' }
        ],
        performanceModulos: [
          { modulo: 'Fiscalização', relatorios: 156, downloads: 456, eficiencia: 92 },
          { modulo: 'Jurídico', relatorios: 89, downloads: 234, eficiencia: 88 },
          { modulo: 'Usuários', relatorios: 67, downloads: 189, eficiencia: 85 },
          { modulo: 'Financeiro', relatorios: 234, downloads: 367, eficiencia: 90 }
        ],
        tendencias: [
          { mes: 'Jan', fiscalizacao: 12, juridico: 8, usuarios: 6, financeiro: 15 },
          { mes: 'Fev', fiscalizacao: 15, juridico: 10, usuarios: 8, financeiro: 18 },
          { mes: 'Mar', fiscalizacao: 18, juridico: 12, usuarios: 10, financeiro: 22 },
          { mes: 'Abr', fiscalizacao: 22, juridico: 15, usuarios: 12, financeiro: 25 },
          { mes: 'Mai', fiscalizacao: 25, juridico: 18, usuarios: 15, financeiro: 28 },
          { mes: 'Jun', fiscalizacao: 28, juridico: 21, usuarios: 18, financeiro: 32 }
        ]
      };

      const mockRecentReports = [
        {
          id: 1,
          titulo: 'Relatório de Fiscalização - Junho 2024',
          modulo: 'Fiscalização',
          tipo: 'Mensal',
          dataGeracao: '2024-06-15T10:30:00',
          downloads: 45,
          status: 'concluido'
        },
        {
          id: 2,
          titulo: 'Análise de Processos Jurídicos',
          modulo: 'Jurídico',
          tipo: 'Trimestral',
          dataGeracao: '2024-06-14T14:20:00',
          downloads: 23,
          status: 'concluido'
        },
        {
          id: 3,
          titulo: 'Relatório de Usuários Ativos',
          modulo: 'Usuários',
          tipo: 'Semanal',
          dataGeracao: '2024-06-13T09:15:00',
          downloads: 67,
          status: 'pendente'
        },
        {
          id: 4,
          titulo: 'Análise Financeira - Q2 2024',
          modulo: 'Financeiro',
          tipo: 'Trimestral',
          dataGeracao: '2024-06-12T16:45:00',
          downloads: 34,
          status: 'concluido'
        }
      ];

      const mockPopularReports = [
        {
          id: 1,
          titulo: 'Relatório de Autos de Infração',
          modulo: 'Fiscalização',
          downloads: 234,
          ultimoDownload: '2024-06-15T08:30:00'
        },
        {
          id: 2,
          titulo: 'Análise de Processos por Status',
          modulo: 'Jurídico',
          downloads: 189,
          ultimoDownload: '2024-06-14T15:20:00'
        },
        {
          id: 3,
          titulo: 'Relatório de Performance de Usuários',
          modulo: 'Usuários',
          downloads: 156,
          ultimoDownload: '2024-06-13T11:45:00'
        },
        {
          id: 4,
          titulo: 'Análise de Multas e Cobranças',
          modulo: 'Financeiro',
          downloads: 298,
          ultimoDownload: '2024-06-12T14:10:00'
        }
      ];

      setStats(mockStats);
      setChartData(mockChartData);
      setRecentReports(mockRecentReports);
      setPopularReports(mockPopularReports);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Relatórios</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Visão geral e análise de relatórios do sistema - {new Date().toLocaleDateString('pt-BR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="semana">Última semana</option>
              <option value="mes">Último mês</option>
              <option value="trimestre">Último trimestre</option>
              <option value="ano">Último ano</option>
            </select>
            
            <Link
              to="/relatorios/gerar"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Relatórios */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Relatórios</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.totalRelatorios)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>+12%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Gerados</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatNumber(stats.relatoriosGerados)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Pendentes</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {formatNumber(stats.relatoriosPendentes)}
              </span>
            </div>
          </div>
        </div>

        {/* Downloads */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <ArrowDownTrayIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Downloads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.downloads)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>+8%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Média/dia</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(Math.round(stats.downloads / 30))}
              </span>
            </div>
          </div>
        </div>

        {/* Módulo Mais Ativo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Módulo Mais Ativo</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  Fiscalização
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>+15%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Relatórios</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {formatNumber(stats.fiscalizacao)}
              </span>
            </div>
          </div>
        </div>

        {/* Eficiência */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <DocumentChartBarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  94.2%
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>+2.1%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Erros</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                2.8%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relatórios por Mês */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Relatórios Gerados por Mês
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.relatoriosPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value, name) => [
                  formatNumber(value), 
                  name === 'gerados' ? 'Gerados' :
                  name === 'downloads' ? 'Downloads' : 'Usuários'
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="gerados" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="downloads" 
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Downloads por Tipo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Downloads por Tipo de Relatório
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.downloadsPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tipo, quantidade }) => `${tipo} ${quantidade}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantidade"
              >
                {chartData.downloadsPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [formatNumber(value), 'Downloads']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance por Módulo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance por Módulo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.performanceModulos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="modulo" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value, name) => [
                  formatNumber(value),
                  name === 'relatorios' ? 'Relatórios' :
                  name === 'downloads' ? 'Downloads' : 'Eficiência (%)'
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="relatorios" fill="#3B82F6" name="Relatórios" />
              <Bar dataKey="downloads" fill="#10B981" name="Downloads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendências */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tendências por Módulo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.tendencias}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value, name) => [formatNumber(value), name]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="fiscalizacao" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="juridico" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="usuarios" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="financeiro" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Relatórios Recentes e Populares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relatórios Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Relatórios Recentes
            </h3>
            <Link to="/relatorios/recentes" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {recentReports.map((relatorio) => (
              <div key={relatorio.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
                  {React.createElement(getModuloIcon(relatorio.modulo), { className: "h-4 w-4 text-blue-600 dark:text-blue-400" })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {relatorio.titulo}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {relatorio.modulo} • {relatorio.tipo}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(relatorio.dataGeracao)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(relatorio.status)}`}>
                      {React.createElement(getStatusIcon(relatorio.status), { className: "h-3 w-3 mr-1" })}
                      {relatorio.status === 'concluido' ? 'Concluído' : 
                       relatorio.status === 'pendente' ? 'Pendente' : 'Erro'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatNumber(relatorio.downloads)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">downloads</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relatórios Populares */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Relatórios Mais Baixados
            </h3>
            <Link to="/relatorios/populares" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {popularReports.map((relatorio, index) => (
              <div key={relatorio.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/20">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {relatorio.titulo}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {relatorio.modulo}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Último download: {formatDate(relatorio.ultimoDownload)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatNumber(relatorio.downloads)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">downloads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/relatorios/fiscalizacao"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Fiscalização</span>
              <p className="text-xs text-blue-700 dark:text-blue-200">Autos, multas, processos</p>
            </div>
          </Link>
          
          <Link
            to="/relatorios/juridico"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
          >
            <ScaleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Jurídico</span>
              <p className="text-xs text-green-700 dark:text-green-200">Processos, análises</p>
            </div>
          </Link>
          
          <Link
            to="/relatorios/usuarios"
            className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
          >
            <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Usuários</span>
              <p className="text-xs text-purple-700 dark:text-purple-200">Acessos, perfis</p>
            </div>
          </Link>
          
          <Link
            to="/relatorios/financeiro"
            className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
          >
            <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Financeiro</span>
              <p className="text-xs text-yellow-700 dark:text-yellow-200">Receitas, despesas</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosDashboard;

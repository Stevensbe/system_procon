import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BellIcon,
  EyeIcon,
  CalendarIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import dashboardService from '../services/dashboardService';
import { runDiagnostics } from '../utils/checkModules';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalProcessos: 0,
    processosEmAndamento: 0,
    processosConcluidos: 0,
    processosPendentes: 0,
    totalMultas: 0,
    multasPagas: 0,
    multasPendentes: 0,
    multasVencidas: 0,
    arrecadacaoMes: 0,
    arrecadacaoAno: 0,
    denunciasRecebidas: 0,
    fiscalizacoesRealizadas: 0,
    usuariosAtivos: 0,
    taxaResolucao: 0,
    tempoMedioResolucao: 0
  });

  const [chartData, setChartData] = useState({
    arrecadacaoMensal: [],
    processosPorStatus: [],
    multasPorTipo: [],
    denunciasPorMes: [],
    performanceMensal: [],
    fiscalizacoesPorMes: []
  });

  const [alertas, setAlertas] = useState([]);
  const [atividadesRecentes, setAtividadesRecentes] = useState([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');

  useEffect(() => {
    loadDashboardData();
  }, [periodoSelecionado]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Carregar dados usando o serviço
      const [estatisticas, graficos, alertasData, atividadesData] = await Promise.all([
        dashboardService.getEstatisticasPrincipais(periodoSelecionado),
        dashboardService.getDadosGraficos(periodoSelecionado),
        dashboardService.getAlertas(),
        dashboardService.getAtividadesRecentes(10)
      ]);

      setStats(estatisticas);
      setChartData(graficos);
      setAlertas(alertasData);
      setAtividadesRecentes(atividadesData);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleDiagnostics = async () => {
    try {
      console.log('🔍 Executando diagnóstico do sistema...');
      const diagnostics = await runDiagnostics();
      
      // Mostrar resultado no console
      console.log('📊 Diagnóstico completo:', diagnostics);
      
      // Mostrar toast com resultado
      if (diagnostics.server.status === 'success') {
        toast.success('✅ Diagnóstico executado! Verifique o console para detalhes.');
      } else {
        toast.error('❌ Problemas detectados! Verifique o console para detalhes.');
      }
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
      toast.error('Erro ao executar diagnóstico');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getVariationColor = (variation) => {
    return variation >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getVariationIcon = (variation) => {
    return variation >= 0 ? ArrowUpIcon : ArrowDownIcon;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Executivo</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Visão geral do sistema PROCON - {new Date().toLocaleDateString('pt-BR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Seletor de período */}
            <select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="mes">Último mês</option>
              <option value="trimestre">Último trimestre</option>
              <option value="ano">Último ano</option>
            </select>
            
            {/* Botão de atualizar */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>

            {/* Botão de diagnóstico */}
            <button
              onClick={handleDiagnostics}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
              title="Executar diagnóstico do sistema"
            >
              <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
              Diagnóstico
            </button>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alertas.map((alerta) => {
            const Icon = alerta.icone || ExclamationTriangleIcon;
            return (
              <div key={alerta.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-l-4 ${
                alerta.tipo === 'warning' ? 'border-yellow-500' :
                alerta.tipo === 'info' ? 'border-blue-500' :
                'border-green-500'
              }`}>
                <div className="flex items-start">
                  <Icon className={`h-5 w-5 mt-0.5 mr-3 ${
                    alerta.tipo === 'warning' ? 'text-yellow-500' :
                    alerta.tipo === 'info' ? 'text-blue-500' :
                    'text-green-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {alerta.titulo}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {alerta.mensagem}
                    </p>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2">
                      {alerta.acao}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Processos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Processos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.totalProcessos)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center text-sm ${getVariationColor(12)}`}>
                {React.createElement(getVariationIcon(12), { className: "h-4 w-4 mr-1" })}
                <span>+12%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Em andamento</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.processosEmAndamento)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Concluídos</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.processosConcluidos)}
              </span>
            </div>
          </div>
        </div>

        {/* Arrecadação Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Arrecadação Mensal</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.arrecadacaoMes)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center text-sm ${getVariationColor(8)}`}>
                {React.createElement(getVariationIcon(8), { className: "h-4 w-4 mr-1" })}
                <span>+8%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Anual</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(stats.arrecadacaoAno)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Meta mensal</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(1000000)}
              </span>
            </div>
          </div>
        </div>

        {/* Multas Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Multas Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.multasPendentes)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center text-sm ${getVariationColor(-5)}`}>
                {React.createElement(getVariationIcon(-5), { className: "h-4 w-4 mr-1" })}
                <span>-5%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Vencidas</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatNumber(stats.multasVencidas)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Pagas</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatNumber(stats.multasPagas)}
              </span>
            </div>
          </div>
        </div>

        {/* Taxa de Resolução */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <CheckCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Resolução</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(stats.taxaResolucao)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center text-sm ${getVariationColor(3)}`}>
                {React.createElement(getVariationIcon(3), { className: "h-4 w-4 mr-1" })}
                <span>+3%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tempo médio</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.tempoMedioResolucao} dias
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Usuários ativos</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.usuariosAtivos)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrecadação vs Meta */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Arrecadação vs Meta Mensal
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Realizado</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Meta</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.arrecadacaoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Valor']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="meta" 
                stroke="#9CA3AF" 
                fill="#9CA3AF"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Processos por Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuição de Processos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.processosPorStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentual }) => `${status} ${percentual}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantidade"
              >
                {chartData.processosPorStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [formatNumber(value), 'Quantidade']}
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

        {/* Performance Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Mensal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.performanceMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value, name) => [
                  formatNumber(value), 
                  name === 'processos' ? 'Processos' :
                  name === 'multas' ? 'Multas' : 'Fiscalizações'
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="processos" fill="#3B82F6" name="Processos" />
              <Bar dataKey="multas" fill="#10B981" name="Multas" />
              <Bar dataKey="fiscalizacoes" fill="#F59E0B" name="Fiscalizações" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Eficiência das Fiscalizações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Eficiência das Fiscalizações
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.fiscalizacoesPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'eficiencia' ? `${value}%` : formatNumber(value),
                  name === 'planejadas' ? 'Planejadas' :
                  name === 'realizadas' ? 'Realizadas' : 'Eficiência'
                ]}
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
                dataKey="planejadas" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="realizadas" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="eficiencia" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Atividades Recentes e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades Recentes */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atividades Recentes
            </h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todas
            </button>
          </div>
          <div className="space-y-4">
            {atividadesRecentes.map((atividade) => (
              <div key={atividade.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  atividade.tipo === 'processo' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  atividade.tipo === 'multa' ? 'bg-green-100 dark:bg-green-900/20' :
                  atividade.tipo === 'fiscalizacao' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-purple-100 dark:bg-purple-900/20'
                }`}>
                  {atividade.tipo === 'processo' && <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  {atividade.tipo === 'multa' && <CurrencyDollarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {atividade.tipo === 'fiscalizacao' && <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                  {atividade.tipo === 'relatorio' && <ChartBarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {atividade.titulo}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {atividade.descricao}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {atividade.tempo} • {atividade.usuario}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Executivo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumo Executivo
          </h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(stats.arrecadacaoAno)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Arrecadação Anual
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(stats.fiscalizacoesRealizadas)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Fiscalizações Realizadas
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatPercentage(stats.taxaResolucao)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taxa de Resolução
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.tempoMedioResolucao} dias
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tempo Médio de Resolução
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
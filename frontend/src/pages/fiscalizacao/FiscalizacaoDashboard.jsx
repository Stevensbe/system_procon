import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

const FiscalizacaoDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAutos: 0,
    autosEmAndamento: 0,
    autosConcluidos: 0,
    autosPendentes: 0,
    totalMultas: 0,
    multasPagas: 0,
    multasPendentes: 0,
    multasVencidas: 0,
    fiscalizacoesMes: 0,
    fiscalizacoesAno: 0,
    irregularidadesEncontradas: 0,
    empresasFiscalizadas: 0,
    valorTotalMultas: 0,
    taxaEficiencia: 0
  });

  const [chartData, setChartData] = useState({
    fiscalizacoesPorMes: [],
    autosPorTipo: [],
    multasPorTipo: [],
    irregularidadesPorCategoria: [],
    performanceMensal: [],
    eficienciaPorSetor: []
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');

  useEffect(() => {
    loadDashboardData();
  }, [periodoSelecionado]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular dados da API
      const mockStats = {
        totalAutos: 1247,
        autosEmAndamento: 89,
        autosConcluidos: 1158,
        autosPendentes: 156,
        totalMultas: 892,
        multasPagas: 634,
        multasPendentes: 258,
        multasVencidas: 45,
        fiscalizacoesMes: 67,
        fiscalizacoesAno: 892,
        irregularidadesEncontradas: 445,
        empresasFiscalizadas: 234,
        valorTotalMultas: 2847500,
        taxaEficiencia: 87.5
      };

      const mockChartData = {
        fiscalizacoesPorMes: [
          { mes: 'Jan', planejadas: 80, realizadas: 75, eficiencia: 93.8 },
          { mes: 'Fev', planejadas: 85, realizadas: 82, eficiencia: 96.5 },
          { mes: 'Mar', planejadas: 90, realizadas: 87, eficiencia: 96.7 },
          { mes: 'Abr', planejadas: 95, realizadas: 89, eficiencia: 93.7 },
          { mes: 'Mai', planejadas: 100, realizadas: 94, eficiencia: 94.0 },
          { mes: 'Jun', planejadas: 105, realizadas: 98, eficiencia: 93.3 }
        ],
        autosPorTipo: [
          { tipo: 'Bancos', quantidade: 45, cor: '#3B82F6' },
          { tipo: 'Postos', quantidade: 78, cor: '#10B981' },
          { tipo: 'Supermercados', quantidade: 92, cor: '#F59E0B' },
          { tipo: 'Diversos', quantidade: 34, cor: '#EF4444' }
        ],
        multasPorTipo: [
          { tipo: 'Leve', quantidade: 156, valor: 234000, cor: '#10B981' },
          { tipo: 'Média', quantidade: 89, valor: 445000, cor: '#F59E0B' },
          { tipo: 'Grave', quantidade: 23, valor: 690000, cor: '#EF4444' },
          { tipo: 'Gravíssima', quantidade: 12, valor: 480000, cor: '#8B5CF6' }
        ],
        irregularidadesPorCategoria: [
          { categoria: 'Preços', quantidade: 123, cor: '#3B82F6' },
          { categoria: 'Prazos', quantidade: 89, cor: '#10B981' },
          { categoria: 'Documentação', quantidade: 67, cor: '#F59E0B' },
          { categoria: 'Segurança', quantidade: 45, cor: '#EF4444' },
          { categoria: 'Outras', quantidade: 121, cor: '#8B5CF6' }
        ],
        performanceMensal: [
          { mes: 'Jan', autos: 45, multas: 23, irregularidades: 67 },
          { mes: 'Fev', autos: 52, multas: 28, irregularidades: 74 },
          { mes: 'Mar', autos: 48, multas: 25, irregularidades: 71 },
          { mes: 'Abr', autos: 61, multas: 32, irregularidades: 89 },
          { mes: 'Mai', autos: 55, multas: 29, irregularidades: 82 },
          { mes: 'Jun', autos: 67, multas: 35, irregularidades: 95 }
        ],
        eficienciaPorSetor: [
          { setor: 'Bancos', eficiencia: 92, autos: 45, multas: 23 },
          { setor: 'Postos', eficiencia: 88, autos: 78, multas: 41 },
          { setor: 'Supermercados', eficiencia: 85, autos: 92, multas: 48 },
          { setor: 'Diversos', eficiencia: 91, autos: 34, multas: 18 }
        ]
      };

      const mockActivities = [
        {
          id: 1,
          tipo: 'auto',
          titulo: 'Auto de Infração criado',
          descricao: 'Auto nº 2024/001234 - Banco XYZ',
          tempo: '2 horas atrás',
          usuario: 'João Silva'
        },
        {
          id: 2,
          tipo: 'multa',
          titulo: 'Multa aplicada',
          descricao: 'Multa de R$ 15.000,00 - Posto ABC',
          tempo: '4 horas atrás',
          usuario: 'Maria Santos'
        },
        {
          id: 3,
          tipo: 'fiscalizacao',
          titulo: 'Fiscalização realizada',
          descricao: 'Supermercado DEF - 3 irregularidades encontradas',
          tempo: '6 horas atrás',
          usuario: 'Pedro Costa'
        },
        {
          id: 4,
          tipo: 'relatorio',
          titulo: 'Relatório gerado',
          descricao: 'Relatório mensal de fiscalização - Junho/2024',
          tempo: '1 dia atrás',
          usuario: 'Ana Oliveira'
        }
      ];

      setStats(mockStats);
      setChartData(mockChartData);
      setRecentActivities(mockActivities);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Fiscalização</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Controle e monitoramento das atividades de fiscalização - {new Date().toLocaleDateString('pt-BR', { 
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
              <option value="mes">Último mês</option>
              <option value="trimestre">Último trimestre</option>
              <option value="ano">Último ano</option>
            </select>
            
            <Link
              to="/fiscalizacao/novo-auto"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Auto
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Autos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Autos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.totalAutos)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center text-sm ${getVariationColor(15)}`}>
                {React.createElement(getVariationIcon(15), { className: "h-4 w-4 mr-1" })}
                <span>+15%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Em andamento</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.autosEmAndamento)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Concluídos</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.autosConcluidos)}
              </span>
            </div>
          </div>
        </div>

        {/* Fiscalizações do Mês */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <MagnifyingGlassIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fiscalizações/Mês</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.fiscalizacoesMes)}
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
                {formatNumber(stats.fiscalizacoesAno)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Empresas</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.empresasFiscalizadas)}
              </span>
            </div>
          </div>
        </div>

        {/* Valor Total Multas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total Multas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.valorTotalMultas)}
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
              <span className="text-gray-600 dark:text-gray-400">Pagas</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatNumber(stats.multasPagas)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Pendentes</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatNumber(stats.multasPendentes)}
              </span>
            </div>
          </div>
        </div>

        {/* Taxa de Eficiência */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <CheckCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Eficiência</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(stats.taxaEficiencia)}
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
              <span className="text-gray-600 dark:text-gray-400">Irregularidades</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.irregularidadesEncontradas)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Vencidas</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatNumber(stats.multasVencidas)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Autos por Tipo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuição de Autos por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.autosPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tipo, quantidade }) => `${tipo} ${quantidade}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantidade"
              >
                {chartData.autosPorTipo.map((entry, index) => (
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
                  name === 'autos' ? 'Autos' :
                  name === 'multas' ? 'Multas' : 'Irregularidades'
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="autos" fill="#3B82F6" name="Autos" />
              <Bar dataKey="multas" fill="#10B981" name="Multas" />
              <Bar dataKey="irregularidades" fill="#F59E0B" name="Irregularidades" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Irregularidades por Categoria */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Irregularidades por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.irregularidadesPorCategoria} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#6B7280" />
              <YAxis dataKey="categoria" type="category" stroke="#6B7280" width={80} />
              <Tooltip 
                formatter={(value, name) => [formatNumber(value), 'Quantidade']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="quantidade" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Atividades Recentes e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades Recentes */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atividades Recentes
            </h3>
            <Link to="/fiscalizacao/atividades" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.map((atividade) => (
              <div key={atividade.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  atividade.tipo === 'auto' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  atividade.tipo === 'multa' ? 'bg-green-100 dark:bg-green-900/20' :
                  atividade.tipo === 'fiscalizacao' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-purple-100 dark:bg-purple-900/20'
                }`}>
                  {atividade.tipo === 'auto' && <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  {atividade.tipo === 'multa' && <CurrencyDollarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {atividade.tipo === 'fiscalizacao' && <MagnifyingGlassIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
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

        {/* Ações Rápidas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <Link
              to="/fiscalizacao/novo-auto"
              className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <PlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Criar Auto de Infração</span>
            </Link>
            
            <Link
              to="/fiscalizacao/autos"
              className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Gerenciar Autos</span>
            </Link>
            
            <Link
              to="/fiscalizacao/relatorios"
              className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <ChartBarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Gerar Relatórios</span>
            </Link>
            
            <Link
              to="/fiscalizacao/multas"
              className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
            >
              <CurrencyDollarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Controlar Multas</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiscalizacaoDashboard;

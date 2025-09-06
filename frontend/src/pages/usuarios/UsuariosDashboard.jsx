import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
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

const UsuariosDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosAtivos: 0,
    usuariosInativos: 0,
    usuariosPendentes: 0,
    totalPerfis: 0,
    perfisAtivos: 0,
    acessosMes: 0,
    acessosAno: 0,
    tentativasLogin: 0,
    bloqueios: 0,
    taxaAtivacao: 0,
    tempoMedioSessao: 0
  });

  const [chartData, setChartData] = useState({
    usuariosPorPerfil: [],
    acessosPorMes: [],
    atividadePorDia: [],
    distribuicaoGeografica: [],
    performanceUsuarios: [],
    seguranca: []
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
        totalUsuarios: 156,
        usuariosAtivos: 142,
        usuariosInativos: 8,
        usuariosPendentes: 6,
        totalPerfis: 8,
        perfisAtivos: 7,
        acessosMes: 2847,
        acessosAno: 32456,
        tentativasLogin: 89,
        bloqueios: 3,
        taxaAtivacao: 91.0,
        tempoMedioSessao: 45
      };

      const mockChartData = {
        usuariosPorPerfil: [
          { perfil: 'Administrador', quantidade: 12, cor: '#EF4444' },
          { perfil: 'Fiscal', quantidade: 45, cor: '#3B82F6' },
          { perfil: 'Analista Jurídico', quantidade: 23, cor: '#10B981' },
          { perfil: 'Secretário', quantidade: 18, cor: '#F59E0B' },
          { perfil: 'Coordenador', quantidade: 8, cor: '#8B5CF6' },
          { perfil: 'Estagiário', quantidade: 15, cor: '#EC4899' }
        ],
        acessosPorMes: [
          { mes: 'Jan', acessos: 2456, usuarios: 89, sessoes: 1234 },
          { mes: 'Fev', acessos: 2678, usuarios: 92, sessoes: 1345 },
          { mes: 'Mar', acessos: 2890, usuarios: 95, sessoes: 1456 },
          { mes: 'Abr', acessos: 3123, usuarios: 98, sessoes: 1567 },
          { mes: 'Mai', acessos: 2956, usuarios: 96, sessoes: 1478 },
          { mes: 'Jun', acessos: 2847, usuarios: 94, sessoes: 1423 }
        ],
        atividadePorDia: [
          { dia: 'Seg', acessos: 456, usuarios: 67, tempo: 42 },
          { dia: 'Ter', acessos: 523, usuarios: 72, tempo: 45 },
          { dia: 'Qua', acessos: 489, usuarios: 69, tempo: 41 },
          { dia: 'Qui', acessos: 567, usuarios: 78, tempo: 48 },
          { dia: 'Sex', acessos: 445, usuarios: 65, tempo: 39 },
          { dia: 'Sab', acessos: 123, usuarios: 23, tempo: 25 },
          { dia: 'Dom', acessos: 89, usuarios: 18, tempo: 20 }
        ],
        distribuicaoGeografica: [
          { regiao: 'Centro', usuarios: 45, cor: '#3B82F6' },
          { regiao: 'Norte', usuarios: 23, cor: '#10B981' },
          { regiao: 'Sul', usuarios: 34, cor: '#F59E0B' },
          { regiao: 'Leste', usuarios: 28, cor: '#EF4444' },
          { regiao: 'Oeste', usuarios: 26, cor: '#8B5CF6' }
        ],
        performanceUsuarios: [
          { usuario: 'João Silva', acoes: 156, tempo: 8.5, eficiencia: 92 },
          { usuario: 'Maria Santos', acoes: 142, tempo: 7.8, eficiencia: 88 },
          { usuario: 'Pedro Costa', acoes: 134, tempo: 8.2, eficiencia: 85 },
          { usuario: 'Ana Oliveira', acoes: 128, tempo: 7.5, eficiencia: 90 },
          { usuario: 'Carlos Lima', acoes: 119, tempo: 8.0, eficiencia: 87 }
        ],
        seguranca: [
          { mes: 'Jan', tentativas: 45, bloqueios: 2, sucessos: 43 },
          { mes: 'Fev', tentativas: 52, bloqueios: 1, sucessos: 51 },
          { mes: 'Mar', tentativas: 38, bloqueios: 3, sucessos: 35 },
          { mes: 'Abr', tentativas: 67, bloqueios: 4, sucessos: 63 },
          { mes: 'Mai', tentativas: 41, bloqueios: 2, sucessos: 39 },
          { mes: 'Jun', tentativas: 89, bloqueios: 3, sucessos: 86 }
        ]
      };

      const mockActivities = [
        {
          id: 1,
          tipo: 'login',
          titulo: 'Novo usuário criado',
          descricao: 'Usuário "Carlos Lima" foi criado com perfil Fiscal',
          tempo: '2 horas atrás',
          usuario: 'Administrador'
        },
        {
          id: 2,
          tipo: 'perfil',
          titulo: 'Perfil atualizado',
          descricao: 'Perfil "Analista Jurídico" teve permissões modificadas',
          tempo: '4 horas atrás',
          usuario: 'João Silva'
        },
        {
          id: 3,
          tipo: 'bloqueio',
          titulo: 'Usuário bloqueado',
          descricao: 'Usuário "Maria Santos" foi bloqueado por tentativas inválidas',
          tempo: '6 horas atrás',
          usuario: 'Sistema'
        },
        {
          id: 4,
          tipo: 'acesso',
          titulo: 'Acesso remoto detectado',
          descricao: 'Acesso remoto detectado para usuário "Pedro Costa"',
          tempo: '1 dia atrás',
          usuario: 'Sistema'
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

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Usuários</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Gestão e monitoramento de usuários do sistema - {new Date().toLocaleDateString('pt-BR', { 
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
              to="/usuarios/novo"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Usuário
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Usuários */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.totalUsuarios)}
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
              <span className="text-gray-600 dark:text-gray-400">Ativos</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatNumber(stats.usuariosAtivos)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Inativos</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatNumber(stats.usuariosInativos)}
              </span>
            </div>
          </div>
        </div>

        {/* Acessos do Mês */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Acessos/Mês</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.acessosMes)}
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
              <span className="text-gray-600 dark:text-gray-400">Anual</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.acessosAno)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Tempo médio</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatTime(stats.tempoMedioSessao)}
              </span>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <ShieldCheckIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Segurança</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.tentativasLogin)}
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
              <span className="text-gray-600 dark:text-gray-400">Bloqueios</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatNumber(stats.bloqueios)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Taxa ativação</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatPercentage(stats.taxaAtivacao)}
              </span>
            </div>
          </div>
        </div>

        {/* Perfis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <CheckCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Perfis Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.perfisAtivos)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center text-sm ${getVariationColor(0)}`}>
                {React.createElement(getVariationIcon(0), { className: "h-4 w-4 mr-1" })}
                <span>0%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total perfis</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(stats.totalPerfis)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Pendentes</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {formatNumber(stats.usuariosPendentes)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuários por Perfil */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuição de Usuários por Perfil
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.usuariosPorPerfil}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ perfil, quantidade }) => `${perfil} ${quantidade}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantidade"
              >
                {chartData.usuariosPorPerfil.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [formatNumber(value), 'Usuários']}
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

        {/* Acessos por Mês */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Acessos por Mês
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.acessosPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value, name) => [
                  formatNumber(value), 
                  name === 'acessos' ? 'Acessos' :
                  name === 'usuarios' ? 'Usuários' : 'Sessões'
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
                dataKey="acessos" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="usuarios" 
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Atividade por Dia da Semana */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividade por Dia da Semana
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.atividadePorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="dia" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'tempo' ? formatTime(value) : formatNumber(value),
                  name === 'acessos' ? 'Acessos' :
                  name === 'usuarios' ? 'Usuários' : 'Tempo (min)'
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="acessos" fill="#3B82F6" name="Acessos" />
              <Bar dataKey="usuarios" fill="#10B981" name="Usuários" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Segurança - Tentativas de Login */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Segurança - Tentativas de Login
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.seguranca}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                formatter={(value, name) => [
                  formatNumber(value),
                  name === 'tentativas' ? 'Tentativas' :
                  name === 'bloqueios' ? 'Bloqueios' : 'Sucessos'
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
                dataKey="tentativas" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="bloqueios" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="sucessos" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
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
            <Link to="/usuarios/atividades" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.map((atividade) => (
              <div key={atividade.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  atividade.tipo === 'login' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  atividade.tipo === 'perfil' ? 'bg-green-100 dark:bg-green-900/20' :
                  atividade.tipo === 'bloqueio' ? 'bg-red-100 dark:bg-red-900/20' :
                  'bg-yellow-100 dark:bg-yellow-900/20'
                }`}>
                  {atividade.tipo === 'login' && <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  {atividade.tipo === 'perfil' && <ShieldCheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {atividade.tipo === 'bloqueio' && <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />}
                  {atividade.tipo === 'acesso' && <EyeIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
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
              to="/usuarios/novo"
              className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <PlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Criar Usuário</span>
            </Link>
            
            <Link
              to="/usuarios/lista"
              className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <UserGroupIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Gerenciar Usuários</span>
            </Link>
            
            <Link
              to="/usuarios/perfis"
              className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <ShieldCheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Gerenciar Perfis</span>
            </Link>
            
            <Link
              to="/usuarios/relatorios"
              className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
            >
              <ChartBarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Relatórios</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsuariosDashboard;

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import juridicoService from '../../services/juridicoService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationContainer from '../../components/ui/NotificationContainer';
import useNotification from '../../hooks/useNotification';

const DashboardJuridico = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const { notifications, addNotification, removeNotification } = useNotification();

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    carregarDashboard();
    carregarEstatisticas();
  }, []);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const response = await juridicoService.getDashboardData();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Criar dados padrão se a API falhar
      setDashboardData({
        total_processos: 0,
        processos_abertos: 0,
        processos_atrasados: 0,
        prazos_vencendo: 0,
        processos_por_status: {},
        processos_por_prioridade: {},
        processos_recentes: [],
        prazos_urgentes: []
      });
      addNotification('Usando dados padrão - API não disponível', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const response = await juridicoService.getEstatisticas();
      setStatsData(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Carregando dashboard...</p>
      </div>
    );
  }

  // Preparar dados para gráficos
  const statusData = Object.entries(dashboardData.processos_por_status).map(([status, total]) => ({
    name: status,
    total: total
  }));

  const prioridadeData = Object.entries(dashboardData.processos_por_prioridade).map(([prioridade, total]) => ({
    name: prioridade,
    total: total
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Jurídico
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Visão geral dos processos jurídicos e prazos
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Processos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Processos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.total_processos}
                </p>
              </div>
            </div>
          </div>

          {/* Processos Abertos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Processos Abertos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.processos_abertos}
                </p>
              </div>
            </div>
          </div>

          {/* Processos Atrasados */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Processos Atrasados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.processos_atrasados}
                </p>
              </div>
            </div>
          </div>

          {/* Prazos Vencendo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Prazos Vencendo
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.prazos_vencendo}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Processos por Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Prioridade */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Processos por Prioridade
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prioridadeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {prioridadeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processos Recentes e Prazos Urgentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Processos Recentes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Processos Recentes
              </h3>
            </div>
            <div className="p-6">
              {dashboardData.processos_recentes.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.processos_recentes.map((processo) => (
                    <div key={processo.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {processo.numero}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {processo.parte}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(processo.data_abertura).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          processo.status === 'ABERTO' ? 'bg-yellow-100 text-yellow-800' :
                          processo.status === 'EM_ANALISE' ? 'bg-blue-100 text-blue-800' :
                          processo.status === 'RESPONDIDO' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {processo.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum processo recente
                </p>
              )}
            </div>
          </div>

          {/* Prazos Urgentes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Prazos Urgentes
              </h3>
            </div>
            <div className="p-6">
              {dashboardData.prazos_urgentes.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.prazos_urgentes.map((prazo) => (
                    <div key={prazo.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {prazo.processo.numero}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {prazo.descricao}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Vence em {prazo.dias_restantes} dias
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {prazo.tipo_prazo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum prazo urgente
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        {statsData && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estatísticas Detalhadas - {statsData.periodo}
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Analistas Mais Ativos
                  </h4>
                  <div className="space-y-2">
                    {statsData.analistas_mais_ativos.map((analista, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {analista.nome}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {analista.total} processos
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Tipos de Análise Mais Comuns
                  </h4>
                  <div className="space-y-2">
                    {statsData.tipos_mais_comuns.map((tipo, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {tipo.tipo_analise}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {tipo.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Resumo do Período
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total de Processos
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {statsData.total_processos}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Média por Mês
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(statsData.total_processos / 12).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardJuridico;

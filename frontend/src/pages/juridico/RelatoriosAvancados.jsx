import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import juridicoService from '../../services/juridicoService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationContainer from '../../components/ui/NotificationContainer';
import useNotification from '../../hooks/useNotification';

const RelatoriosAvancados = () => {
  const [relatorioData, setRelatorioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    periodo: '30', // dias
    analista: '',
    tipo_processo: '',
    status: ''
  });
  const { notifications, addNotification, removeNotification } = useNotification();

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    carregarRelatorio();
  }, [filtros]);

  const carregarRelatorio = async () => {
    try {
      setLoading(true);
      const response = await juridicoService.getRelatorioAvancado(filtros);
      setRelatorioData(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      // Criar dados de exemplo se a API falhar
      setRelatorioData({
        resumo_geral: {
          total_processos: 45,
          processos_abertos: 12,
          processos_concluidos: 28,
          processos_atrasados: 5,
          valor_total_causas: 125000.00
        },
        processos_por_mes: [
          { mes: 'Jan', total: 8, abertos: 3, concluidos: 5 },
          { mes: 'Fev', total: 12, abertos: 4, concluidos: 8 },
          { mes: 'Mar', total: 15, abertos: 5, concluidos: 10 },
          { mes: 'Abr', total: 10, abertos: 0, concluidos: 5 }
        ],
        processos_por_analista: [
          { analista: 'Dr. Silva', total: 15, concluidos: 12, pendentes: 3 },
          { analista: 'Dra. Santos', total: 12, concluidos: 8, pendentes: 4 },
          { analista: 'Dr. Oliveira', total: 10, concluidos: 6, pendentes: 4 },
          { analista: 'Dra. Costa', total: 8, concluidos: 2, pendentes: 6 }
        ],
        processos_por_status: [
          { status: 'ABERTO', total: 12 },
          { status: 'EM_ANALISE', total: 8 },
          { status: 'RESPONDIDO', total: 15 },
          { status: 'ARQUIVADO', total: 10 }
        ],
        processos_por_prioridade: [
          { prioridade: 'URGENTE', total: 5 },
          { prioridade: 'ALTA', total: 12 },
          { prioridade: 'MEDIA', total: 18 },
          { prioridade: 'BAIXA', total: 10 }
        ],
        tempo_medio_resolucao: 25, // dias
        taxa_conclusao: 62.2, // percentual
        analistas_mais_ativos: [
          { nome: 'Dr. Silva', processos: 15, media_dias: 22 },
          { nome: 'Dra. Santos', processos: 12, media_dias: 28 },
          { nome: 'Dr. Oliveira', processos: 10, media_dias: 30 }
        ],
        tipos_mais_comuns: [
          { tipo: 'Direito do Consumidor', total: 25 },
          { tipo: 'Direito Administrativo', total: 12 },
          { tipo: 'Direito Civil', total: 8 }
        ]
      });
      addNotification('Usando dados de exemplo - API não disponível', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!relatorioData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Erro ao carregar relatório</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Relatórios Avançados
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Estatísticas detalhadas do módulo jurídico
              </p>
            </div>
            <div className="flex space-x-4">
              <select
                name="periodo"
                value={filtros.periodo}
                onChange={handleFiltroChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
              </select>
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                  {relatorioData.resumo_geral.total_processos}
                </p>
              </div>
            </div>
          </div>

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
                  {relatorioData.resumo_geral.processos_abertos}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Processos Concluídos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {relatorioData.resumo_geral.processos_concluidos}
                </p>
              </div>
            </div>
          </div>

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
                  {relatorioData.resumo_geral.processos_atrasados}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valor Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatarMoeda(relatorioData.resumo_geral.valor_total_causas)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Processos por Mês */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Processos por Mês
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={relatorioData.processos_por_mes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Total" />
                <Bar dataKey="concluidos" fill="#10B981" name="Concluídos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Processos por Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Processos por Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={relatorioData.processos_por_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, total }) => `${status}: ${total}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {relatorioData.processos_por_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Análise de Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Analistas Mais Ativos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Analistas Mais Ativos
            </h3>
            <div className="space-y-4">
              {relatorioData.analistas_mais_ativos.map((analista, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {analista.nome}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {analista.processos} processos • Média: {analista.media_dias} dias
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(analista.processos / Math.max(...relatorioData.analistas_mais_ativos.map(a => a.processos))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas de Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Métricas de Performance
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tempo Médio de Resolução
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {relatorioData.tempo_medio_resolucao} dias
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((relatorioData.tempo_medio_resolucao / 60) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Taxa de Conclusão
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {relatorioData.taxa_conclusao}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${relatorioData.taxa_conclusao}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Processos por Prioridade
                  </span>
                </div>
                <div className="space-y-2">
                  {relatorioData.processos_por_prioridade.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.prioridade}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tipos de Processo Mais Comuns */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tipos de Processo Mais Comuns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatorioData.tipos_mais_comuns.map((tipo, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {tipo.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {tipo.tipo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosAvancados;

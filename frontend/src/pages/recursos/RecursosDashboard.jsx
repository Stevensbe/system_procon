import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import recursosService from '../../services/recursosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import KPICard from '../../components/common/KPICard';
import { formatCurrency, formatDate } from '../../utils/formatters';

const RecursosDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [recursosRecentes, setRecursosRecentes] = useState([]);
  const [recursosPrazo, setRecursosPrazo] = useState([]);
  const [recursosPorInstancia, setRecursosPorInstancia] = useState([]);
  const [recursosPorStatus, setRecursosPorStatus] = useState([]);
  const [recursosPorTipo, setRecursosPorTipo] = useState([]);
  const [recursosPorMes, setRecursosPorMes] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas gerais
      const stats = await recursosService.getEstatisticas();
      setEstatisticas(stats);

      // Carregar recursos recentes
      const recentes = await recursosService.getRecursosRecentes();
      setRecursosRecentes(recentes);

      // Carregar recursos com prazo vencendo
      const prazo = await recursosService.getRecursosPrazo();
      setRecursosPrazo(prazo);

      // Carregar dados para gráficos
      const instancia = await recursosService.getRecursosPorInstancia();
      setRecursosPorInstancia(instancia);

      const status = await recursosService.getRecursosPorStatus();
      setRecursosPorStatus(status);

      const tipo = await recursosService.getRecursosPorTipo();
      setRecursosPorTipo(tipo);

      const mes = await recursosService.getRecursosPorMes();
      setRecursosPorMes(mes);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Usar dados mock em caso de erro
      carregarDadosMock();
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosMock = () => {
    setEstatisticas({
      total_recursos: 156,
      recursos_pendentes: 23,
      recursos_em_analise: 45,
      recursos_julgados: 88,
      recursos_vencidos: 12,
      recursos_segunda_instancia: 34,
      recursos_terceira_instancia: 8,
      valor_total_causas: 2450000.00
    });

    setRecursosRecentes([
      {
        id: 1,
        numero_protocolo: 'REC-00123/2025',
        requerente_nome: 'Empresa ABC Ltda',
        tipo_recurso: 'Recurso Ordinário',
        instancia: 'primeira',
        status: 'protocolado',
        data_protocolo: '2025-01-15',
        valor_causa: 150000.00
      },
      {
        id: 2,
        numero_protocolo: 'REC-00122/2025',
        requerente_nome: 'João Silva',
        tipo_recurso: 'Recurso Extraordinário',
        instancia: 'segunda',
        status: 'em_analise',
        data_protocolo: '2025-01-14',
        valor_causa: 75000.00
      },
      {
        id: 3,
        numero_protocolo: 'REC-00121/2025',
        requerente_nome: 'Maria Santos',
        tipo_recurso: 'Pedido de Revisão',
        instancia: 'primeira',
        status: 'julgado',
        data_protocolo: '2025-01-13',
        valor_causa: 25000.00
      }
    ]);

    setRecursosPrazo([
      {
        id: 4,
        numero_protocolo: 'REC-00120/2025',
        requerente_nome: 'Empresa XYZ Ltda',
        data_limite_analise: '2025-01-20',
        dias_restantes: 2,
        prioridade: 'alta'
      },
      {
        id: 5,
        numero_protocolo: 'REC-00119/2025',
        requerente_nome: 'Pedro Oliveira',
        data_limite_analise: '2025-01-22',
        dias_restantes: 4,
        prioridade: 'normal'
      }
    ]);

    setRecursosPorInstancia([
      { instancia: 'Primeira Instância', quantidade: 98, percentual: 62.8 },
      { instancia: 'Segunda Instância', quantidade: 45, percentual: 28.8 },
      { instancia: 'Terceira Instância', quantidade: 13, percentual: 8.4 }
    ]);

    setRecursosPorStatus([
      { status: 'Protocolado', quantidade: 23, percentual: 14.7 },
      { status: 'Em Análise', quantidade: 45, percentual: 28.8 },
      { status: 'Com Parecer', quantidade: 18, percentual: 11.5 },
      { status: 'Deferido', quantidade: 35, percentual: 22.4 },
      { status: 'Indeferido', quantidade: 25, percentual: 16.0 },
      { status: 'Arquivado', quantidade: 10, percentual: 6.4 }
    ]);
  };

  const getStatusColor = (status) => {
    const colors = {
      'protocolado': 'bg-blue-100 text-blue-800',
      'em_analise': 'bg-yellow-100 text-yellow-800',
      'com_parecer': 'bg-purple-100 text-purple-800',
      'deferido': 'bg-green-100 text-green-800',
      'indeferido': 'bg-red-100 text-red-800',
      'parcialmente_deferido': 'bg-orange-100 text-orange-800',
      'anulado': 'bg-gray-100 text-gray-800',
      'arquivado': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getInstanciaColor = (instancia) => {
    const colors = {
      'primeira': 'bg-blue-100 text-blue-800',
      'segunda': 'bg-green-100 text-green-800',
      'terceira': 'bg-purple-100 text-purple-800'
    };
    return colors[instancia] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      'alta': 'bg-red-100 text-red-800',
      'normal': 'bg-yellow-100 text-yellow-800',
      'baixa': 'bg-green-100 text-green-800'
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard de Recursos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral dos recursos administrativos e judiciais
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={carregarDados}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Atualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de Recursos"
          value={estatisticas?.total_recursos || 0}
          icon={DocumentTextIcon}
          color="blue"
          change="+12%"
          changeType="positive"
        />
        <KPICard
          title="Recursos Pendentes"
          value={estatisticas?.recursos_pendentes || 0}
          icon={ClockIcon}
          color="yellow"
          change="+5%"
          changeType="neutral"
        />
        <KPICard
          title="Recursos Julgados"
          value={estatisticas?.recursos_julgados || 0}
          icon={CheckCircleIcon}
          color="green"
          change="+8%"
          changeType="positive"
        />
        <KPICard
          title="Valor Total das Causas"
          value={formatCurrency(estatisticas?.valor_total_causas || 0)}
          icon={ScaleIcon}
          color="purple"
          change="+15%"
          changeType="positive"
        />
      </div>

      {/* Gráficos e Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recursos por Instância */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recursos por Instância
          </h3>
          <div className="space-y-3">
            {recursosPorInstancia.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.instancia}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.quantidade}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({item.percentual}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recursos por Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recursos por Status
          </h3>
          <div className="space-y-3">
            {recursosPorStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.quantidade}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({item.percentual}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recursos Recentes e Prazos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recursos Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recursos Recentes
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recursosRecentes.map((recurso) => (
                <div key={recurso.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {recurso.numero_protocolo}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(recurso.status)}`}>
                        {recurso.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getInstanciaColor(recurso.instancia)}`}>
                        {recurso.instancia === 'primeira' ? '1ª' : recurso.instancia === 'segunda' ? '2ª' : '3ª'} Instância
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {recurso.requerente_nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      Protocolado em {formatDate(recurso.data_protocolo)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(recurso.valor_causa)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {recurso.tipo_recurso}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recursos com Prazo Vencendo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Prazos Vencendo
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recursosPrazo.map((recurso) => (
                <div key={recurso.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {recurso.numero_protocolo}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadeColor(recurso.prioridade)}`}>
                        {recurso.prioridade.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {recurso.requerente_nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      Prazo: {formatDate(recurso.data_limite_analise)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${recurso.dias_restantes <= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {recurso.dias_restantes} dias
                    </p>
                    <p className="text-xs text-gray-500">
                      restantes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Recurso
          </button>
          <button className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-2" />
            Consultar Recurso
          </button>
                       <button className="flex items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
               <ScaleIcon className="h-5 w-5 mr-2" />
               Julgamentos
             </button>
        </div>
      </div>
    </div>
  );
};

export default RecursosDashboard;

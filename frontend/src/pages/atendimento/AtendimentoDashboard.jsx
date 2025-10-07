import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useNotification } from '../../hooks/useNotifications';

const AtendimentoDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    atendimentosHoje: 0,
    reclamasPendentes: 0,
    reclamasSemana: 0,
    satisfacaoMedia: 0
  });
  const [graficos, setGraficos] = useState({
    atendimentosPorTipo: [],
    statusReclamacoes: []
  });
  const [reclamacoesRecentes, setReclamacoesRecentes] = useState([]);

  const { showError } = useNotification();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const { data } = await api.get('/atendimento/dashboard/');

      setEstatisticas({
        atendimentosHoje: data.atendimentos_hoje,
        reclamasPendentes: data.reclamas_pendentes,
        reclamasSemana: data.reclamas_semana,
        satisfacaoMedia: data.satisfacao_media,
      });

      setGraficos({
        atendimentosPorTipo: (data.atendimentos_por_tipo || []).map(item => ({
          tipo: item.tipo_atendimento || item.tipo || 'N/A',
          total: item.total || 0,
        })),
        statusReclamacoes: data.status_reclamacoes || [],
      });

      setReclamacoesRecentes((data.reclamacoes_recentes || []).map(item => ({
        id: item.id,
        numero: item.numero_protocolo,
        consumidor: item.consumidor_nome,
        empresa: item.empresa_razao_social,
        status: item.status,
        data: item.criado_em,
      })));
    } catch (error) {
      const mensagem = error?.response?.data?.detail || error?.message || 'Erro ao carregar dados do dashboard';
      showError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'REGISTRADA': 'bg-blue-100 text-blue-800',
      'EM_ANALISE': 'bg-yellow-100 text-yellow-800',
      'CLASSIFICADA': 'bg-green-100 text-green-800',
      'NOTIFICADA': 'bg-purple-100 text-purple-800',
      'CONCILIADA': 'bg-green-100 text-green-800',
      'FINALIZADA': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'REGISTRADA': 'Registrada',
      'EM_ANALISE': 'Em Análise',
      'CLASSIFICADA': 'Classificada',
      'NOTIFICADA': 'Notificada',
      'CONCILIADA': 'Conciliada',
      'FINALIZADA': 'Finalizada'
    };
    return texts[status] || status;
  };

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Atendimento</h1>
            <p className="text-gray-600">Visão geral do módulo de atendimento PROCON</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Atendimento
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Nova Reclamação
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Atendimentos Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.atendimentosHoje}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reclamações Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.reclamasPendentes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reclamações Semana</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.reclamasSemana}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.satisfacaoMedia}/5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atendimentos por Tipo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atendimentos por Tipo</h3>
          <div className="space-y-3">
            {graficos.atendimentosPorTipo.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.tipo}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(item.total / 50) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status das Reclamações */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status das Reclamações</h3>
          <div className="space-y-3">
            {graficos.statusReclamacoes.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{getStatusText(item.status)}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(item.total / 50) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reclamações Recentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reclamações Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Protocolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumidor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reclamacoesRecentes.map((reclamacao) => (
                <tr key={reclamacao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reclamacao.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reclamacao.consumidor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reclamacao.empresa}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reclamacao.status)}`}>
                      {getStatusText(reclamacao.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reclamacao.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      Ver
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AtendimentoDashboard;


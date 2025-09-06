import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { multasService } from '../../services/multasService';
import { formatCurrency } from '../../utils/formatters';

export default function MultasDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Testar primeiro o endpoint de teste
      const dataTeste = await multasService.getEstatisticasTeste();
      console.log('Endpoint de teste funcionando:', dataTeste);
      
      // Agora tentar o endpoint real
      const data = await multasService.getEstatisticas();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Multas',
      value: stats.resumo?.total_multas || 0,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Valor Total',
      value: formatCurrency(stats.valores?.valor_total || 0),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Multas Pagas',
      value: stats.resumo?.multas_pagas || 0,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Multas Pendentes',
      value: stats.resumo?.multas_pendentes || 0,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Multas Vencidas',
      value: stats.resumo?.multas_vencidas || 0,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Valor Pendente',
      value: formatCurrency(stats.valores?.valor_pendente || 0),
      icon: CurrencyDollarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de distribuição */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.por_status?.paga || 0}</div>
            <div className="text-sm text-gray-600">Pagas</div>
            <div className="text-xs text-gray-500">
              {stats.resumo?.total_multas > 0 ? Math.round(((stats.por_status?.paga || 0) / stats.resumo.total_multas) * 100) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.por_status?.pendente || 0}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
            <div className="text-xs text-gray-500">
              {stats.resumo?.total_multas > 0 ? Math.round(((stats.por_status?.pendente || 0) / stats.resumo.total_multas) * 100) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.por_status?.vencida || 0}</div>
            <div className="text-sm text-gray-600">Vencidas</div>
            <div className="text-xs text-gray-500">
              {stats.resumo?.total_multas > 0 ? Math.round(((stats.por_status?.vencida || 0) / stats.resumo.total_multas) * 100) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.por_status?.cancelada || 0}</div>
            <div className="text-sm text-gray-600">Canceladas</div>
            <div className="text-xs text-gray-500">
              {stats.resumo?.total_multas > 0 ? Math.round(((stats.por_status?.cancelada || 0) / stats.resumo.total_multas) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
